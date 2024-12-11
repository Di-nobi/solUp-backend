import { Status, IStatus, IReaction } from '../models/Status';
import Message, { IMessage } from '../models/SingleMessage';
import ConnectionData, { IConnectionRequest } from '../models/ConnectionData'
import { FilterQuery, UpdateQuery } from 'mongoose';
import { paginate, PaginationResult } from '../utils/pagination';

export class StatusRepository {
  private readonly statusModel;
  private readonly messageModel;  // TOD: in version 2, messages interactions should be decoupled with event listener or microservice
  private readonly connectionModel;  // TOD: in version 2, connections interactions should be decoupled with event listener or microservice
  constructor() {
    this.statusModel = Status;
    this.messageModel = Message;
    this.connectionModel = ConnectionData;
  }
  async createStatus(data: Partial<IStatus>): Promise<IStatus> {
    return await this.statusModel.create(data);
  }

  async getStatusesByUser(userId: string): Promise<IStatus[]> {
    return await this.statusModel.find({ user: userId }).populate('user', 'firstName lastName profilePicture')
  }

  async archiveStatusesForUser(
    statusOwnerId: string,
    archiverUserId: string
  ): Promise<IStatus[]> {
    // Define the filter to find statuses not already archived by the archiver
    const filter = {
      user: statusOwnerId,
      "archives.user": { $ne: archiverUserId }, // Exclude already archived statuses
    };
  
    // Define the update operation to add the archiver to the archives array
    const update = {
      $push: { archives: { user: archiverUserId, archived: true } },
    };
  
    // Perform the update using the reusable method
    await this.updateManyStatuses(filter, update);
  
    // Return the updated statuses
    return this.statusModel.find({ user: statusOwnerId });
  }
  
  async updateManyStatuses(
    filterObject: FilterQuery<IStatus>,
    updateObject: UpdateQuery<IStatus>,
  ): Promise<void> {
    // Perform the updateMany operation
    await this.statusModel.updateMany(filterObject, updateObject);
  }

  async getArchivedStatuses(userId: string, page: number, limit: number): Promise<PaginationResult<IStatus>> {
    try {
      const query = {
        // user: userId, // Match the root-level user
        archives: { 
          $elemMatch: { 
            archived: true 
          } 
        }
      }

      const populateOptions = [
        { path: 'user', select: 'firstName lastName profilePicture' }, // Populate user info
        // Add more population paths for multi populated query
      ];

      // Call the pagination utility function
      return paginate<IStatus>(this.statusModel, query, limit, page, populateOptions);
    } catch (error: any) {
      throw new Error(`Error retrieving archived statuses: ${error.message}`);
    }
  }
  
  async deleteStatus(statusId: string): Promise<IStatus | null> {
    return await this.statusModel.findByIdAndDelete(statusId);
  }

  async findStatus(statusId: string): Promise<IStatus | null> {
    return await this.statusModel.findOne({_id: statusId});
  }
  
  async findStatusAndUserReaction(statusId: string, userId: string): Promise<{ status: IStatus | null; existingReaction: IReaction | null }> {
    const status = await this.statusModel.findOne(
      { _id: statusId },
      { reactions: { $elemMatch: { user: userId } } } // Only fetch reactions for this user
    ).lean<IStatus | null>();
  
    // Check if the status exists
    if (!status) {
      return { status: null, existingReaction: null };
    }
  
    // Extract existing reaction from reactions array
    const existingReaction = status.reactions && status.reactions.length > 0 ? status.reactions[0] : null;
  
    return { status, existingReaction };
  }

  async addReaction(statusId: string, reaction: IReaction): Promise<IStatus | null> {
    return await this.statusModel.findByIdAndUpdate(
      statusId,
      { $push: { reactions: reaction } },
      { new: true } // Return the updated document
    );
  }

  async findStatusesForConnections(userIds: string[], page: number, limit: number): Promise<PaginationResult<IStatus>> {
    const query = {
      user: { $in: userIds },
      archives: {
        $not: {
          $elemMatch: {
            user: { $in: userIds }, // Check if the `user` in `archives` is in `userIds`
            archived: true, // Ensure the `archived` field is true
          },
        },
      },
    };
    // Call the pagination utility function
    return paginate<IStatus>(this.statusModel, query, limit, page);
  }
  // TODO: connections repository should be decoupled from the status repository
  async findConnections(userId: string): Promise<IConnectionRequest[]> {
    return await this.connectionModel.find({
      $or: [
        { sender: userId, status: { $in: ["accepted"] } },
        { receiver: userId, status: { $in: ["accepted"] } },
      ],
    }).lean();
  }

  // TODO: message repository should be decoupled from the status repository
  async addReply(data: Partial<IMessage>): Promise<IMessage> {
    return await this.messageModel.create(data);
  }
}
