import { Request, Response, NextFunction } from "express";
import { StatusService } from "../services/status.service";
import { StatusRepository } from "../repositories/status.repository";
import { validateRequest } from "../utils/requestValidator";
import { AddReactionDto, AddReplyDTO, ArchiveStatusDto, CreateStatusDto, StatusFileUpload, StatusQueryDto } from "../dtos/status.dto";
import { decoded } from "../utils/decodeJwt";
import { NotFoundError } from "../utils/customError";
import { S3BucketUtils } from "../utils/s3BucketUtils";

// status controller object class
export class StatusController {
  private readonly statusService
  constructor() {
    this.statusService = new StatusService();
  }
  async createStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = decoded(req).userId; // Authenticated user
      const validatedData = await validateRequest(CreateStatusDto, req.body);
      const files = req.files as {
        [fieldname: string]: Express.MulterS3.File[];
      };
      const statusFile = files["file"]?.[0] as unknown as StatusFileUpload;
      const statuses = await this.statusService.createStatus(validatedData, userId, statusFile);
      return res.status(201).json({
        status: 'success',
        message: `status(es) created`,
        data: {
          statuses
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getStatuses(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.params.userId as string;
      const statuses = await this.statusService.getUserStatuses(userId);
      if(!statuses){
        throw new NotFoundError('user does not have status')
      }
      return res.status(200).json({
        status: 'success',
        message: `user statuses fetched successfuly`,
        data: {
          statuses
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async archiveStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const archiverUserId = decoded(req).userId; // Authenticated user;
      const validatedData = await validateRequest(ArchiveStatusDto, req.body);
      const status = await this.statusService.archiveUserStatuses(validatedData, archiverUserId);
      return res.status(201).json({ 
        status: 'success',
        message: `status archived successfuly`,
        data: {
          status
        },
       });
    } catch (error) {
      next(error);
    }
  }
  async getUserArchivedStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = decoded(req).userId; // Authenticated user;
      // validates the request query
      const queryOptions = await validateRequest(StatusQueryDto, req.query);
      const statuses = await this.statusService.getUserArchivedStatus(userId, queryOptions);
      return res.status(200).json({ 
        status: 'success',
        message: ` archive status fetched successfuly`,
        data: {
          statuses: statuses.data,
          metadata: statuses.metadata
        },
       });
    } catch (error) {
      next(error);
    }
  }

  async deleteStatus(req: Request, res: Response, next: NextFunction) {
    try {
      decoded(req).userId; // Authenticated user;
      const statusId = req.params.statusId;
      await this.statusService.deleteStatus(statusId);
      return res.status(201).json({ 
        status: 'success',
        message: ` status deleted successfuly`,
        data: {}
       });
    } catch (error) {
      next(error);
    }
  }

  async addReaction(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = decoded(req).userId; // Authenticated user;
      const validatedData = await validateRequest(AddReactionDto, req.body);
      const updatedStatus = await this.statusService.addReaction(validatedData, userId);

      return res.status(201).json({
        status: "success",
        message: "Reaction added successfully",
        data: { updatedStatus },
      });
    } catch (error) {
      next(error);
    }
  }

  async addReply(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = decoded(req).userId; // Authenticated user;
      const validatedData = await validateRequest(AddReplyDTO, req.body);
      const updatedStatus = await this.statusService.addReply(validatedData, userId);

      return res.status(201).json({
        status: "success",
        message: "Reply added successfully",
        data: { updatedStatus },
      });
    } catch (error) {
      next(error);
    }
  }

  async getConnectionStatuses(req: Request, res: Response, next: NextFunction) {
    try {
      // validates the request query
      const queryOptions = await validateRequest(StatusQueryDto, req.query);

      const userId = decoded(req).userId; // Authenticated user;
      const statuses = await this.statusService.getConnectionStatuses(userId, queryOptions);

      return res.status(200).json({
        status: "success",
        message: "Statuses fetched successfully",
        data: { statuses },
      });
    } catch (error) {
      next(error);
    }
  }
  
}
