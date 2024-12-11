// src/middleware/upload.ts
import { multerUpload } from "./MulterUpload";
export const GroupMediaUpload = multerUpload({
  useS3: true,
  destination: "uploads/groupMedia",
  fields: {
    mediaFile: {
      fileType: [
        // Image file types
        'image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/svg+xml', 'image/webp', 'image/tiff',

        // Audio file types
        'audio/aac', 'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/x-flac', 'audio/x-alac', 
        'audio/x-aiff', 'audio/amr', 'audio/opus', 'audio/x-ms-wma',

        // Video file types
        'video/mp4', 'video/x-matroska', 'video/quicktime', 'video/x-msvideo', 'video/x-ms-wmv',
        'video/x-flv', 'video/webm', 'video/x-m4v', 'video/3gpp', 'video/mpeg', 'video/ogg', 'video/ogv',

        // Document file types
        'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.oasis.opendocument.text', 'application/rtf', 'text/plain', 'text/markdown',
        'application/vnd.ms-works', 'application/x-iwork-pages-sffpages',

        // PDF file types
        'application/pdf',

        // PowerPoint file types
        'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/vnd.openxmlformats-officedocument.presentationml.slideshow', 'application/vnd.oasis.opendocument.presentation',
        'application/x-iwork-keynote-sffkey',

        // Excel file types
        'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel.sheet.macroenabled.12', 'text/csv', 'application/vnd.oasis.opendocument.spreadsheet',
        'text/tab-separated-values'
      ],
      fileSize: 50 * 1024 * 1024,
      maxCount: 3,
    },
  }
});
// Ensure the 'uploads' directory exists in the root folder
// const uploadDir = path.join(__dirname, "..", "uploads/groupMedia");
// console.log(uploadDir);

//  // Adjust path as needed

// if (!fs.existsSync(uploadDir)) {
//   fs.mkdirSync(uploadDir, { recursive: true });
// }

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

// const processImage = async (buffer: Buffer, filePath: string) => {
//   try {
//     console.log(`Original buffer size: ${buffer.length / 1024} KB`);

//     let image = sharp(buffer);
//     const metadata = await image.metadata();

//     // Define initial quality
//     let quality = 80;

//     // Process images
//     if (metadata.format === 'jpeg' || metadata.format === 'jpg') {
//       image = image.resize(800).jpeg({ quality });
//     } else if (metadata.format === 'png') {
//       image = image.resize(800).png({ quality });
//     } else if (metadata.format === 'webp') {
//       image = image.resize(800).webp({ quality });
//     }

//     // Save initial image
//     await image.toFile(filePath);
    
//     // Check file size and adjust quality if needed
//     let fileSize = fs.statSync(filePath).size;
//     console.log(`Initial processed size: ${fileSize / 1024} KB`);
//     while (fileSize > 512 * 1024) { // 512 KB
//       quality -= 10;
//       if (quality < 10) break; // Prevent quality from going too low

//       image = sharp(buffer).resize(800);
//       if (metadata.format === 'jpeg' || metadata.format === 'jpg') {
//         image = image.jpeg({ quality });
//       } else if (metadata.format === 'png') {
//         image = image.png({ quality });
//       } else if (metadata.format === 'webp') {
//         image = image.webp({ quality });
//       }

//       await image.toFile(filePath);
//       fileSize = fs.statSync(filePath).size;
//       console.log(`Adjusted size with quality ${quality}%: ${fileSize / 1024} KB`);
//     }
//     console.log(`Final image size: ${fileSize / 1024} KB`);
//   } catch (error) {
//     console.error('Error processing image:', error);
//   }
// };

// export const GroupMediaUpload = multer({
//     storage: storage,
//     limits: { fileSize: 5000000 }, // 5MB limit
//     fileFilter,
//   }).array('mediaFile', 5); // 'mediaFile' should match the form-data key used in the frontend

// // Middleware to process the uploaded file
// export const processGroupUploadedFile = async (req: any, res: any, next: any) => {
//   if (req.files && req.files.length > 0) {
//     for (const file of req.files) {
//       const fileName = `${Date.now()}-${file.originalname}`;
//       const filePath = path.join(uploadDir, fileName);

//       if (file.mimetype.startsWith('image/')) {
//         await processImage(file.buffer, filePath);
//       } else {
//         fs.writeFileSync(filePath, file.buffer);
//       }
//       // fs.writeFileSync(filePath, file.buffer);

//       file.filename = fileName;
//       file.path = filePath;
//     }
//   } else {
//     console.error("No files received");
//   }

//   next();
// };

