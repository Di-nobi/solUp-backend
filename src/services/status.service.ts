import { StatusRepository } from "../repositories/status.repository";
import { S3BucketUtils } from "../utils/s3BucketUtils";
import { IStatus } from "../models/Status";
import { AddReactionDto, AddReplyDTO, ArchiveStatusDto, CreateStatusDto, StatusFileUpload, StatusQueryDto, StatusTypeEnum } from "../dtos/status.dto";
import { APIError, BadRequestError, NotFoundError } from "../utils/customError";
import mongoose from "mongoose";

export class StatusService {
  private readonly statusRepository;
  constructor() {
    this.statusRepository = new StatusRepository();
  }

  // create status by text or by image. video statuses moved to version two
  async createStatus(createStatusDto: CreateStatusDto, userId: string, uploadedFile: StatusFileUpload | undefined): Promise<IStatus[]> {
    const file = uploadedFile
    const { content, caption, backgroundColor } = createStatusDto;
    const statuses: Partial<IStatus>[] = [];
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours im milliseconds

    // Process Text Status
    if (!file) {
      if (!content) {
        throw new BadRequestError("At least one of content or file must be provided.");
      }
      statuses.push({
        user: userId,
        type: StatusTypeEnum.TEXT,
        content,
        backgroundColor,
        expiresAt,
      });
    } else {
      // Process File Upload
      const fileTypeDetected = file.mimetype;
      if (!fileTypeDetected) {
        throw new APIError("Unable to determine file type.");
      }

      if (fileTypeDetected.startsWith("image/")) {
        statuses.push({
          user: userId,
          type: StatusTypeEnum.IMAGE,
          content: file.location,
          caption: caption,
          expiresAt,
        });
        // this logic is moved to version two
      } else if (fileTypeDetected.startsWith("video/")) {
        // await this.processVideo(file, userId, expiresAt, statuses); // to be added back in version two
      } else {
        throw new BadRequestError("Unsupported file type.");
      }
    }

    return await Promise.all(
      statuses.map((status) => this.statusRepository.createStatus(status))
    );
  }

  async getUserStatuses(userId: string): Promise<IStatus[]> {
    const statuses = await this.statusRepository.getStatusesByUser(userId);
    if (statuses.length === 0) { // Check for empty array
      throw new NotFoundError('User does not have any statuses');
    }
    return statuses;
  }

  async archiveUserStatuses(archiveStatusDto: ArchiveStatusDto, archiverUserId: string): Promise<IStatus[]> {
    const { statusOwnerId } = archiveStatusDto;
    // achiver is the user in session, statusOwnerId is the user who posted the status
    const statuses = await this.statusRepository.archiveStatusesForUser(
      statusOwnerId,
      archiverUserId
    );
  
    if (statuses.length === 0) {
      throw new NotFoundError(
        "No statuses found for the specified user."
      );
    }
  
    return statuses;
  }
  

  async getUserArchivedStatus(userId: string, statusQueryDtO: StatusQueryDto): Promise<any> {
    const page = statusQueryDtO.page || 1;
    const limit = statusQueryDtO.limit || 10;
    const archivedStatuses =  await this.statusRepository.getArchivedStatuses(userId, page, limit);
    // Group statuses by user
    const groupedStatuses: { [key: string]: IStatus[] } = {};
    archivedStatuses.data.forEach(status => {
        // convert the status user to mongoose object id to be able to do a deep level get on the objec.
        // since we want to get the id of the populated user.
        const user = status.user as mongoose.Types.ObjectId;
        const userId = user._id.toString()

        if (!groupedStatuses[userId]) {
            groupedStatuses[userId] = []; // Initialize array for this user
        }

        groupedStatuses[userId].push(status); // Add status to user's array
    });

    // Transform grouped statuses into the desired output format
    const result = Object.entries(groupedStatuses).map(([userId, statuses]) => ({
        userId,
        statuses,
    }));

    return {
        data: result,
        metadata: {
            totalItems: archivedStatuses.metadata.totalItems,
            totalPages: archivedStatuses.metadata.totalPages,
            currentPage: archivedStatuses.metadata.currentPage,
            limit,
        },
    };
  }

  async deleteStatus(statusId: string): Promise<IStatus> {
    const status = await this.statusRepository.findStatus(statusId);
    
    // Check if status exists
    if (!status) {
        throw new NotFoundError('Status not found');
    }

    // If the status type is 'text', delete it directly
    if (status.type === 'text') {
        return await this.performDelete(statusId);
    }

    // For other types, delete associated file first
    await S3BucketUtils.deleteFile(status.content);
    
    // Perform the deletion
    return await this.performDelete(statusId);
  }

  async addReaction(addReactionDto: AddReactionDto, userId: string): Promise<IStatus | null> {
    const { statusId, emoji } = addReactionDto;
  
    // Fetch both the status and the user's existing reaction
    const { status, existingReaction } = await this.statusRepository.findStatusAndUserReaction(statusId, userId);
  
    // Check if the status exists
    if (!status) {
      throw new Error("Status does not exist.");
    }
  
    // Check if the user has already reacted with the same emoji
    if (existingReaction && existingReaction.emoji === emoji) {
      throw new Error("User has already reacted to this status with this emoji.");
    }
  
    // If no existing reaction or a different emoji, add the new reaction
    return await this.statusRepository.addReaction(statusId, {
      user: userId,
      emoji,
    });
  }

  async addReply(replyDto: AddReplyDTO, userId: string) {
    replyDto.senderId = userId;
    replyDto.createdAt = new Date();
    return await this.statusRepository.addReply(replyDto);
  }

  async getConnectionStatuses(userId: string, statusQueryDtO: StatusQueryDto): Promise<any> {
    const page = statusQueryDtO.page || 1;
    const limit = statusQueryDtO.limit || 10;
    // Fetch all connections with status 'accepted'
    const connections = await this.statusRepository.findConnections(userId);
    if (!connections.length) {
      return {
        // data: [], // send an empty array if no connections
        metadata: {
            totalItems: 0,
            totalPages: 0,
            currentPage: 0,
            limit,
        },
    };
    }

    // Extract IDs of connected users
    const connectedUserIds = connections.map((conn: { sender: { toString: () => string; }; receiver: { toString: () => any; }; }) => {
      return conn.sender.toString() === userId ? conn.receiver.toString() : conn.sender.toString();
    });

    // Fetch statuses for connected users
    const connectionStatuses = await this.statusRepository.findStatusesForConnections(connectedUserIds, page, limit);
    // Group statuses by user
    const groupedStatuses: { [key: string]: IStatus[] } = {};

    connectionStatuses.data.forEach(status => {
        // convert the status user to mongoose object id to be able to do a deep level get on the objec.
        // since we want to get the id of the populated user.
        const user = status.user as mongoose.Types.ObjectId;
        const userId = user._id.toString()

        if (!groupedStatuses[userId]) {
            groupedStatuses[userId] = []; // Initialize array for this user
        }

        groupedStatuses[userId].push(status); // Add status to user's array
    });

    // Transform grouped statuses into the desired output format
    const result = Object.entries(groupedStatuses).map(([userId, statuses]) => ({
        userId,
        statuses,
    }));

    return {
        data: result,
        metadata: {
            totalItems: connectionStatuses.metadata.totalItems,
            totalPages: connectionStatuses.metadata.totalPages,
            currentPage: connectionStatuses.metadata.currentPage,
            limit,
        },
    };
  }

  // Helper method to encapsulate deletion logic
  private async performDelete(statusId: string): Promise<IStatus> {
    const deletedStatus = await this.statusRepository.deleteStatus(statusId);
    
    // Check if the deletion was successful
    if (!deletedStatus) {
        throw new APIError('Error deleting status');
    }
    
    return deletedStatus;
  }
}
