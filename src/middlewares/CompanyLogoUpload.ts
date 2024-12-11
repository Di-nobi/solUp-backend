// src/middleware/CompanyLogoUpload.ts
import { multerUpload } from "./MulterUpload";

export const logoUpload = multerUpload({
  useS3: true,
  destination: "uploads/logos",
  fields: {
    logo: {
      fileType: ['image/jpeg', 'image/png'],
      fileSize: 5 * 1024 * 1024,
      maxCount: 1,
    },
  }
});

// const uploadDir = path.join(__dirname, "..", "uploads/logos");

// if (!fs.existsSync(uploadDir)) {
//   fs.mkdirSync(uploadDir, { recursive: true });
// }

// const storage = multer.memoryStorage(); // Use memory storage for processing with Sharp

// const fileFilter = (
//   req: Express.Request,
//   file: Express.Multer.File,
//   cb: multer.FileFilterCallback
// ) => {
//   const allowedTypes = /jpeg|jpg|png|svg|webp/;
//   const extname = path.extname(file.originalname).toLowerCase().slice(1);
//   const mimetype = file.mimetype.split('/')[1];

//   const extValid = allowedTypes.test(extname);
//   const mimeValid = extname === 'png' || extname === 'jpeg' || extname === 'jpg'  || extname === 'svg' || extname === 'webp' || mimetype === 'octet-stream';

//   if (extValid && mimeValid) {
//     return cb(null, true);
//   } else {
//     cb(new Error("Only images are allowed"));
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

// // Configure multer with fileFilter
// export const logoUpload = multer({
//   storage,
//   fileFilter
// });

// // Middleware to process the uploaded file
// export const processUploadedFile = async (req: any, res: any, next: any) => {
//   if (req.file) {
//     const fileName = `${Date.now()}-${req.file.originalname}`;
//     const filePath = path.join(uploadDir, fileName);

//     if (req.file.mimetype.startsWith('image/')) {
//       await processImage(req.file.buffer, filePath);
//     } else {
//       fs.writeFileSync(filePath, req.file.buffer);
//     }

//     req.file.path = filePath;
//   }
//   next();
// };
