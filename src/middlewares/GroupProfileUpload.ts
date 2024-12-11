// src/middleware/upload.ts
import { multerUpload } from "./MulterUpload";

export const GroupProfileUpload = multerUpload({
  useS3: true,
  destination: "uploads/groupPicture",
  fields: {
    profilePhoto: {
      fileType: ["image/jpeg", "image/png"],
      fileSize: 5 * 1024 * 1024, // 5MB
      maxCount: 1,
    },

    bannerPhoto: {
      fileType: ["image/jpeg", "image/png"],
      fileSize: 5 * 1024 * 1024, // 5MB
      maxCount: 1,
    },
  }
});

// Ensure the 'uploads' directory exists in the root folder
// const profileDir = path.join(__dirname, "..", "uploads/groupPicture");
// console.log(profileDir);

// const bannerDir = path.join(__dirname, "..", "uploads/banner");
// console.log(bannerDir);
//  // Adjust path as needed

// // Create the directory if it doesn't exist
// if (!fs.existsSync(profileDir)) {
//   fs.mkdirSync(profileDir, { recursive: true });
// }

// if (!fs.existsSync(bannerDir)) {
//   fs.mkdirSync(bannerDir, { recursive: true });
// }
// const storage = multer.memoryStorage();

// const fileFilter = (
//   req: Express.Request,
//   file: Express.Multer.File,
//   cb: multer.FileFilterCallback
// ) => {
//   const allowedTypes = /jpeg|jpg|png/;
//   const extname = path.extname(file.originalname).toLowerCase().slice(1);
//   const mimetype = file.mimetype.split('/')[1];

//   const isPng = extname === 'png' && mimetype === 'octet-stream';

  
//   const isJpegOrMp4 = (extname === 'jpg' || extname === 'jpeg') &&
//     mimetype === 'octet-stream';

//   console.log(`File name: ${file.originalname}`);
//   console.log(`File extension: ${extname}`);
//   console.log(`File MIME type: ${mimetype}`);  
//   const extValid = allowedTypes.test(extname);
//   const mimeValid = isPng || isJpegOrMp4 || allowedTypes.test(mimetype);

//   console.log(`File name: ${file.originalname}`);
//   console.log(`File extension: ${extname}`);
//   console.log(`File MIME type: ${mimetype}`);

//   console.log(`Extension valid: ${extValid}`);
//   console.log(`MIME type valid: ${mimeValid}`);
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

//     let quality = 80;

//     // Resize and compress image
//     if (metadata.format === 'jpeg' || metadata.format === 'jpg') {
//       image = image.resize(800).jpeg({ quality });
//     } else if (metadata.format === 'png') {
//       image = image.resize(800).png({ quality });
//     } else if (metadata.format === 'webp') {
//       image = image.resize(800).webp({ quality });
//     }

//     // Save initial image
//     await image.toFile(filePath);

//     // Adjust quality if needed
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


// export const GroupProfileUpload = multer({
//   storage,
//   fileFilter,
// }).fields([
//   { name: 'profilePhoto', maxCount: 1 },
//   { name: 'bannerPhoto', maxCount: 1 }
// ]);

// export const processGroupProfileFiles = async (req: any, res: any, next: any) => {
//   if (req.files) {
//     for (const [field, files] of Object.entries(req.files)) {
//       console.log(`Processing field: ${field}`);
//       const fileArray = files as Express.Multer.File[];
//       for (const file of fileArray) {
//         const fileName = `${Date.now()}-${file.originalname}`;
//         const filePath = field === 'bannerPhoto'
//           ? path.join(bannerDir, fileName)
//           : path.join(profileDir, fileName);

//         if (file.mimetype.startsWith('image/')) {
//           await processImage(file.buffer, filePath);
//         } else {
//           fs.writeFileSync(filePath, file.buffer);
//         }

//         // Attach the file path to the file object
//         file.path = filePath;
//       }
//     }
//   } else {
//     console.error("No files received");
//   }

//   next();
// };