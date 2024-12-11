import { VideoUtils } from "../utils/videoProcessingUtils";
import { StatusRepository } from "../repositories/status.repository";
import { S3BucketUtils } from "../utils/s3BucketUtils";
import fs from "fs";
import path from "path";
import { IStatus } from "../models/Status";
import { StatusTypeEnum } from "../dtos/status.dto";
import { APIError } from "./customError";
  

// this feature as been drop to version two. 
// TODO: change the local storage processing to S3 bucket
export const  processVideo = async (
file: Express.Multer.File,
userId: string,
expiresAt: Date,
statuses: Partial<IStatus>[]
): Promise<void> => {
// Set the relative path, relative to the current file's location
const tempDir = path.join(__dirname, '..', 'uploads', 'status', 'temp');
const tempFilePath = path.join(tempDir, file.originalname);
// const tempFilePath = path.join(__dirname, '..', 'uploads', 'status', 'temp', file.originalname);

    // Ensure the temp directory exists
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
}

// Write the file to the temp directory
if (file.buffer) {
    fs.writeFileSync(tempFilePath, file.buffer);
} else {
    const fileStream = fs.createReadStream(file.path);
    const writeStream = fs.createWriteStream(tempFilePath);
    await new Promise((resolve, reject) => {
    fileStream.pipe(writeStream)
        .on('finish', resolve)
        .on('error', reject);
    });
}

// creeate a read stream if multer already wrote the buffer to a file
// const fileStream = fs.createReadStream(file.path);

try {
    const duration = await VideoUtils.getVideoDuration(tempDir);
    let videoSegments = [tempFilePath]; // Default, no splitting needed

    if (duration > 30) {
    videoSegments = await VideoUtils.splitVideo(tempFilePath, tempDir);
    }

    for (const segment of videoSegments) {
    const segmentBuffer = fs.readFileSync(segment); // Read file content into buffer
    const segmentFile: Express.Multer.File = {
        buffer: segmentBuffer,
        originalname: path.basename(segment), // Use the file name
        mimetype: "video/mp4", // Adjust this if necessary
        size: segmentBuffer.length,
        encoding: "7bit", // Default encoding
        fieldname: "file", // Default fieldname for Multer
    } as Partial<Express.Multer.File> as Express.Multer.File; //  assert the type as partial of the expected multer objects

    const segmentUrl = await S3BucketUtils.uploadFile(segmentFile); // Pass mock file object
    statuses.push({
        user: userId,
        type: StatusTypeEnum.TEXT, // placeholder to be changed to video
        content: segmentUrl,
        expiresAt,
    });

    fs.unlinkSync(segment); // Clean up segment after upload
    }
} catch (error: any) {
    throw new APIError(`Error processing video: ${error.message}`)
} finally {
    // Ensure temp file is removed
    fs.unlinkSync(tempFilePath);
}
}