import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import multerS3 from 'multer-s3';
import { s3 } from '../utils/s3Client';
import { v4 as uuidv4 } from 'uuid';

interface FieldOptions {
  fileType?: string[]; // Allowed MIME types for the field
  fileSize?: number;   // File size limit for the field
  multipleFiles?: boolean; // Whether multiple files are allowed for this field
  maxCount?: number;   // Maximum number of files for this field
  
}

interface MulterUploadOptions {
  useS3?: boolean; // Flag to switch to S3 storage
  destination?: string; // Optional destination folder for local storage
  fields?: Record<string, FieldOptions>; // Map of field names to their specific configurations
}

// Helper function for local storage
const multerStorageLocal = (destination: string) => {
  const absoluteDestination = path.isAbsolute(destination)
    ? destination
    : path.resolve(destination);

  return multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, absoluteDestination);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      const filename = `${uuidv4()}.${ext}`;
      cb(null, filename);
    },
  });
};

export const multerUpload = ({ useS3 = true, destination, fields }: MulterUploadOptions) => {
  if (!fields) {
    throw new Error('No fields defined for multer upload');
  }

  const multerFields: multer.Field[] = [];
  
  // Define storage variable outside of the loop
  let storage;

  for (const [fieldName, options] of Object.entries(fields)) {
    const { fileSize, fileType, multipleFiles = true, maxCount } = options;

    // Define file filter for each field
    const fileFilter: multer.Options['fileFilter'] = (req, file, cb) => {
      if (fileType && !fileType.includes(file.mimetype)) {
        return cb(null, false);
      }
      cb(null, true);
    };

    // Create storage for the field based on useS3 flag
    if (useS3) {
      storage = multerS3({
        s3,
        bucket: process.env.S3_BUCKET_NAME!,
        metadata: (req, file, cb) => {
          cb(null, { fieldName: file.fieldname });
        },
        key: (req, file, cb) => {
          const folderPath = destination ? `${destination}/` : "";
          const fileName = `${Date.now()}-${path.basename(file.originalname)}`;
          cb(null, `${folderPath}${fileName}`);
        },
      });
    } else {
      storage = multerStorageLocal(destination || './uploads');
    }

    // Create multer instance for the field configuration
    multerFields.push({
      name: fieldName,
      maxCount: multipleFiles ? maxCount || 10 : 1,
    });
  }

  // Return multer middleware with defined storage and limits
  return multer({
    storage,
    limits: { 
      fileSize: Math.max(...Object.values(fields).map((f) => f.fileSize || 5 * 1024 * 1024))  // default to 5mb
    },
    fileFilter: (req, file, cb) => {
      const fieldOptions = fields[file.fieldname];
      if (!fieldOptions || (fieldOptions.fileType && !fieldOptions.fileType.includes(file.mimetype))) {
        return cb(null, false);
      }
      cb(null, true);
    },
  }).fields(multerFields);
};


// import multer, { FileFilterCallback } from 'multer';
// import path from 'path';
// import { S3BucketUtils } from '../utils/s3BucketUtils';
// import multerS3 from 'multer-s3';
// import { s3 } from '../utils/s3Client';

// // Define a type for the options passed to the middleware
// interface MulterUploadOptions {
//   fileSize?: number;
//   fileType?: string[];
//   destination?: string; // Optional destination folder for local storage
//   useS3?: boolean; // Flag to switch to S3
//   multipleFiles?: boolean;
//   maxCount?: number;
// }

// // Helper function for local storage
// const multerStorageLocal = (destination: string) => {
//   const absoluteDestination = path.isAbsolute(destination)
//     ? destination
//     : path.resolve(destination);

//   return multer.diskStorage({
//     destination: (req, file, cb) => {
//       cb(null, absoluteDestination);
//     },
//     filename: (req, file, cb) => {
//       const ext = path.extname(file.originalname);
//       const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
//       cb(null, filename);
//     },
//   });
// };

// // Main Multer middleware factory function
// export const multerUpload = ({
//   fileSize,
//   fileType,
//   destination,
//   useS3 = true,
//   multipleFiles = true, // make every file multiple by default, to centralized how files are handled in the controller
//   maxCount,
// }: MulterUploadOptions) => {
//   const sizeLimit = fileSize || 5 * 1024 * 1024; // Default to 5MB

//   // File type filter
//   const fileFilter: multer.Options['fileFilter'] = (req, file, cb: FileFilterCallback) => {
//     if (fileType && !fileType.includes(file.mimetype)) {
//       return cb(null, false);
//     }
//     cb(null, true);
//   };

//   // Configure storage based on S3 or local option.
//   // MulterS3 directly write to S3 without using the upload method defined in the s3BucketUtils
//   const storage = useS3
//     ? multerS3({
//         s3,
//         bucket: process.env.S3_BUCKET_NAME!,
//         metadata: (req, file, cb) => {
//           cb(null, { fieldName: file.fieldname });
//         },
//         key: (req, file, cb) => {
//           const fileName = `${Date.now()}-${path.basename(file.originalname)}`;
//           cb(null, fileName);
//         },
//       })
//     : multerStorageLocal(destination || './uploads');

//   // Create multer instance
//   const upload = multer({
//     storage,
//     limits: { fileSize: sizeLimit },
//     fileFilter,
//   });


//   // Handle single or multiple files
//   if (multipleFiles) {
//     return upload.array('files', maxCount || 10);
//   } else {
//     return upload.single('file');
//   }
// };
