import { Type } from "class-transformer";
import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString, ValidateIf, IsInt, Min, IsIn } from 'class-validator';

// enum for status type
export enum StatusTypeEnum {
  TEXT = "text",
  IMAGE = "image",
  // VIDEO = "video",
}

// class validator to validated and sanitize incoming payload
export class CreateStatusDto {
  @IsEnum(StatusTypeEnum, { message: 'type must be one of: text, image, video' })
  type!: StatusTypeEnum;

  @ValidateIf((obj) => obj.type === StatusTypeEnum.TEXT)
  @IsNotEmpty({ message: 'content is required for text status' })
  @IsString({ message: 'content must be a string' })
  content?: string;

  @ValidateIf((obj) => obj.type === StatusTypeEnum.TEXT)
  @IsNotEmpty({ message: 'background color is required for text status' })
  @IsString({ message: 'background color must be a string' })
  backgroundColor?: string

  @ValidateIf((obj) => obj.type !== StatusTypeEnum.TEXT)
  @IsOptional()
  file?: Express.Multer.File; // This will be validated and handled by the multer middleware.

  @ValidateIf((obj) => obj.type !== StatusTypeEnum.TEXT)
  @IsOptional()
  @IsString({ message: 'caption must be a string' })
  caption?: string; // This will be validated by the middleware.
}

export class ArchiveStatusDto {
  @IsString()
  @IsNotEmpty()
  statusOwnerId!: string;

}

export class AddReactionDto {
  @IsString()
  @IsNotEmpty()
  statusId!: string;

  @IsString()
  @IsNotEmpty()
  emoji!: string;
}

export class AddReplyDTO {
  @IsString()
  @IsNotEmpty()
  recipientId!: string;

  @IsString()
  @IsNotEmpty()
  content!: string;

  @IsString()
  @IsNotEmpty()
  statusId!: string;

  @IsString()
  @IsOptional()
  senderId?: string;

  @IsDateString()
  @IsOptional()
  createdAt?: Date;
}

export class StatusQueryDto {
  @IsOptional()
  @Type(() => Number) // Transform the string input to a number
  @IsInt({ message: "Page must be an integer" })
  page?: number;

  @IsOptional()
  @Type(() => Number) // Transform the string input to a number
  @IsInt({ message: "Limit must be an integer" })
  limit?: number;

  // @IsOptional()
  // @IsString({ message: "Filter must be a string" })
  // filter?: string; // For handling filter options as a string

  // @IsOptional()
  // @IsString({ message: "Sort must be a string" })
  // @IsIn(["asc", "desc"], { message: "Sort must be 'asc' or 'desc'" })
  // sort?: string; // For handling sorting options
}


export interface StatusFileUpload {
  fieldname: string;                
  originalname: string;            
  encoding: string;                
  mimetype: string;            
  size: number;                    
  bucket: string;              
  key: string;                      
  acl: string;                 
  contentType: string;        
  contentDisposition: string | null;
  contentEncoding: string | null;
  storageClass: string;             
  serverSideEncryption: string | null;
  metadata: {                      
    fieldName: string;           
  };
  location: string;                 
  etag: string;                    
  versionId?: string | undefined;
}
