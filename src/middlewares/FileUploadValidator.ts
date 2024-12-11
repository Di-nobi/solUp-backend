
import { NextFunction, Request, Response } from 'express';
import multer from 'multer';

// Error handling middleware for file uploads
export const fileUploadErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof multer.MulterError) {
    // Handle multer-specific errors
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File size exceeds the 5MB limit.' });
    }
  } else if (err) {
    // Handle custom errors
    return res.status(400).json({ message: err.message });
  }
  next();
};