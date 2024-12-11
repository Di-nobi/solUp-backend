import AWS from "aws-sdk";
import fs from "fs";
import path from "path";
import mime from "mime";

//configure bucket
const bucket = new AWS.S3({
    accessKeyId: process.env.ACCESS_KEY,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
});

// logic for the uploading of files to the s3 bucket
async  function uploadFileToBucket(filePath: any, bk: any, prefix: string='') {
    const fileContent = fs.readFileSync(filePath);
    const fileName = path.basename(filePath);
    const data = `${prefix}${fileName}`;

    // const getContent = mime.getType(filePath) || "application/octet-stream";
    const params = {
        Bucket: bk,
        Key: data,
        Body: fileContent,
        // ContentType: getContent
    };

    try {
        await bucket.upload(params).promise();
        console.log(`File ${filePath} uploaded to ${bk} bucket.`);
        return filePath;
    } catch (error) {
        console.error(`Error uploading file ${filePath} to ${bk} bucket:`, error);
        throw error;
    }
}

export default uploadFileToBucket;