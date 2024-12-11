import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuid } from 'uuid';
import fs from 'fs';
import { APIError } from "./customError";
import { s3 } from './s3Client'

export class S3BucketUtils {
  
  static async uploadFile(file: Express.Multer.File) {
    try {
      const fileStream = fs.createReadStream(file.path);
      const fileName = `${uuid()}-${file.originalname}`;
      const params = {
        Bucket: process.env.S3_BUCKET_NAME!,
        Key: fileName,
        Body: file.buffer || fileStream,
        ContentType: file.mimetype,
      };

      const command = new PutObjectCommand(params);
      await s3.send(command);
      return `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.S3_BUCKET_REGION}.amazonaws.com/${fileName}`;
      
    } catch (error: any) {
      throw new APIError(`Error uploading to S3: ${error.message}`);
    }
  }

  static async getFile(fileUrl: string) {
    const key = this.extractKeyFromUrl(fileUrl);
    const params = {
      Bucket: process.env.S3_BUCKET_NAME!,
      Key: key,
    };

    try {
      const command = new GetObjectCommand(params);
      return await s3.send(command);
      
    } catch (error) {
      throw new Error(`Error retrieving file from S3: ${error}`);
    }
  }

  static async replaceFile(fileUrl: string, newFile: Express.Multer.File): Promise<string> {
    const key = this.extractKeyFromUrl(fileUrl);

    try {
      // Delete the old file
      await this.deleteFile(fileUrl);

      // Upload the new file with the same key
      const params = {
        Bucket: process.env.S3_BUCKET_NAME!,
        Key: key, // Reuse the same key
        Body: newFile.buffer,
        ContentType: newFile.mimetype,
      };

      const command = new PutObjectCommand(params);
      await s3.send(command);

      // Return the URL of the newly uploaded file
      return `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.S3_BUCKET_REGION}.amazonaws.com/${key}`;
      
    } catch (error: any) {
      throw new APIError(`Error replacing file in S3: ${error.message}`);
    }
  }

  // a presign function to get a signed URL for a file for 24 hours for the client to have access
  static async generatePresignedUrl(fileUrl: string, expiresInSeconds?: number ) {
    const key = this.extractKeyFromUrl(fileUrl);

    const params = {
      Bucket: process.env.S3_BUCKET_NAME!,
      Key: key,
    };

    const command = new GetObjectCommand(params);
    try {
      return await getSignedUrl(s3, command, { expiresIn: expiresInSeconds || 24 * 60 * 60 }) as string;;
    } catch (error) {
      throw new Error(`Error generating signed URL: ${error}`);
    }
  }
  
  static async deleteFile(fileUrl: string) {
    const key = this.extractKeyFromUrl(fileUrl);
    const params = {
      Bucket: process.env.S3_BUCKET_NAME!,
      Key: key,
    };

    try {
      const command = new DeleteObjectCommand(params);
      return await s3.send(command);
      
    } catch (error) {
      throw new Error(`Error deleting file from S3: ${error}`);
    }
  }

  
  // private static extractKeyFromUrl(fileUrl: string) {
  //   const bucketName = process.env.S3_BUCKET_NAME!;
  //   const baseUrl = `https://${bucketName}.s3.${process.env.S3_BUCKET_REGION}.amazonaws.com/`;
    
  //   if (!fileUrl.startsWith(baseUrl)) {
  //     throw new Error("Invalid file URL. Cannot extract key.");
  //   }
    
  //   return fileUrl.replace(baseUrl, "");
  // }

  private static extractKeyFromUrl(fileUrl: string) {
    const bucketName = process.env.S3_BUCKET_NAME!;
    const baseUrl = `https://${bucketName}.s3.${process.env.S3_BUCKET_REGION}.amazonaws.com/`;

    // Check if the URL starts with the base URL
    if (!fileUrl.startsWith(baseUrl)) {
        throw new Error("Invalid file URL. Cannot extract key.");
    }

    // Remove the base URL to get the key
    const keyWithQuery = fileUrl.replace(baseUrl, "");

    // If there are query parameters (for signed URLs), split them off
    const key = keyWithQuery.split('?')[0]; // This will give you just the key without any query parameters

    return key;
}
}
