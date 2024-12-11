// src/middleware/upload.ts
import path from "path";
import fs from "fs";
import { multerUpload } from "./MulterUpload";

export const uploadMiddleware = multerUpload({
  useS3: true,
  destination: "uploads/posts",
  fields: {
    media: {
      fileType: ['image/jpeg', 'image/png'],
      fileSize: 5 * 1024 * 1024,
      maxCount: 10,
    },
  }
});

// const uploadDir = path.join(__dirname, "..", "uploads/posts");

// // if (!fs.existsSync(uploadDir)) {
// //   fs.mkdirSync(uploadDir, { recursive: true });
// // }

// const storage = multer.memoryStorage(); // Use memory storage for processing with Sharp

// const fileFilter = (
//   req: Express.Request,
//   file: Express.Multer.File,
//   cb: multer.FileFilterCallback
// ) => {
//   const allowedTypes = /jpeg|jpg|png|gif|mp4|avi/;
//   const extname = path.extname(file.originalname).toLowerCase().slice(1);
//   const mimetype = file.mimetype.split('/')[1];

//   const extValid = allowedTypes.test(extname);
//   const mimeValid = extname === 'png' || extname === 'jpeg' || extname === 'jpg' || extname === 'mp4' || extname === 'avi' || mimetype === 'octet-stream';

//   if (extValid && mimeValid) {
//     return cb(null, true);
//   } else {
//     cb(new Error("Only images and videos are allowed"));
//   }
// };

// const processImageBuffer = async (buffer: Buffer, format: string, tempFilePath: string) => {
//   let image = sharp(buffer).resize(800);
//   if (format === "jpeg" || format === "jpg") {
//     await image.jpeg({ quality: 80 }).toFile(tempFilePath);
//   } else if (format === "png") {
//     await image.png({ quality: 80 }).toFile(tempFilePath);
//   } else if (format === "webp") {
//     await image.webp({ quality: 80 }).toFile(tempFilePath);
//   }
// };
// // Configure multer with fileFilter
// export const postUpload = multer({
//   storage,
//   fileFilter
// });

// // Middleware to process the uploaded file
// export const processUploadedFile = async (req: any, res: any, next: any) => {
//   const bucketName: any = process.env.S3_BUCKET_NAME;
//   const prefix = "uploads/posts/";
//   const tempDir = path.join(__dirname, "..", "temp");
//   if (!fs.existsSync(tempDir)) {
//     fs.mkdirSync(tempDir, { recursive: true });
//   }
//   if (req.files && req.files.length > 0) {
//     for (const file of req.files) {
//       // const fileName = `${Date.now()}-${file.originalname}`;
//       // const filePath = path.join(uploadDir, fileName);
//       // file.path = filePath;
//       const tempFilePath = path.join(tempDir, `${Date.now()}-${file.originalname}`);
//       try {
//         let s3Path: string;
//         if (file.mimetype.startsWith('image/')) {
//           // Process the image in memory and upload it
//           const format = path.extname(file.originalname).toLowerCase().slice(1);
//           await processImageBuffer(file.buffer, format, tempFilePath);
//         } else if (file.mimetype.startsWith("video/")) {
//           fs.writeFileSync(tempFilePath, file.buffer);
//         } else {
//           throw new Error("Unsupported file type");
//         }
        // Upload to S3
        // s3Path = await uploadFileToBucket(tempFilePath, bucketName, prefix);
        // console.log(`Uploaded to S3: ${s3Path}`);
        // file.s3Path = s3Path;
//         fs.unlinkSync(tempFilePath);
//       } catch (err) {
//         console.error("Error uploading to S3:", err);
//         return res.status(500).send("Failed to upload file to S3");
//       }
//     }
//   } else {
//     console.error("No files received");
//   }

//   next();
// };