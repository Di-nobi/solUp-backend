import { multerUpload } from "./MulterUpload";

export const commentUpload = multerUpload({
  useS3: true,
  destination: "uploads/comments",
  fields: {
    media: {
      fileType: ['image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/svg+xml', 'image/webp', 'image/tiff', 'video/mp4'],
      fileSize: 5 * 1024 * 1024,
      maxCount: 1,
    },
  }
});