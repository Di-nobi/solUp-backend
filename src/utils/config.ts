import dotenv from 'dotenv';
dotenv.config();

export const NODE_ENV = process.env.NODE_ENV as string;
export const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME as string;
export const S3_BUCKET_REGION = process.env.S3_BUCKET_REGION as string;
export const S3_BUCKET_ACCESS_KEY = process.env.S3_BUCKET_ACCESS_KEY as string;
export const S3_BUCKET_SECRET_ACCESS_KEY = process.env.S3_BUCKET_SECRET_ACCESS_KEY as string;