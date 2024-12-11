// src/middleware/upload.ts
import { multerUpload } from "./MulterUpload";

export const fileUpload = multerUpload({
  useS3: true,
  destination: "uploads/resumes",
  fields: {
    resume: {
      fileType: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      fileSize: 5 * 1024 * 1024,
      maxCount: 1,
    },
  }
});
// Ensure the 'uploads' directory exists in the root folder
// const uploadDir = path.join(__dirname, "..", "uploads/resumes"); // Adjust path as needed

// // Create the directory if it doesn't exist
// if (!fs.existsSync(uploadDir)) {
//   fs.mkdirSync(uploadDir);
// }

// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, uploadDir);
//   },
//   filename: (req, file, cb) => {
//     cb(null, `${Date.now()}-${file.originalname}`);
//   },
// });

// // File filter to ensure only PDF or DOC/DOCX files are uploaded
// const fileFilter = (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
//     const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  
//     if (allowedTypes.includes(file.mimetype)) {
//       cb(null, true);
//     } else {
//       cb(new Error('Invalid file type. Only PDF, DOC, and DOCX are allowed.'));
//     }
//   };
// export const fileUpload = multer({
//   storage: storage,
//   limits: {
//     fileSize: 1024 * 1024 * 5 // 5MB file size limit
//   },
//   fileFilter: fileFilter,
// });
