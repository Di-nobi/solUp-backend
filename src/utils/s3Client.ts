import dotenv from 'dotenv';
dotenv.config();
import { S3Client } from '@aws-sdk/client-s3';

export const s3 = new S3Client({
  region: process.env.S3_BUCKET_REGION!,
  credentials: {
    accessKeyId: process.env.S3_BUCKET_ACCESS_KEY!,
    secretAccessKey: process.env.S3_BUCKET_SECRET_ACCESS_KEY!,
  },
});
