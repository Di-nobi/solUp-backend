import { Status } from "../models/Status";
import { S3BucketUtils } from "./s3BucketUtils";
import { NODE_ENV } from "../utils/config";
export class DatabaseWatcher {
  // Static method to watch for expired statuses and delete content from S3
  public static async watchForExpiredStatuses(): Promise<void> {
    const pipeline = [{ $match: { operationType: "delete" } }];
    
    // Watch stream for changes in the Status collection
    const changeStream = Status.watch(pipeline);

    changeStream.on("change", async (change: { documentKey: { _id: any }; fullDocument: any }) => {
      const deletedStatus = change.documentKey._id;
      const expiredStatus = change.fullDocument;

      if (expiredStatus.type === "image") {
        console.log(`Deleting content for status: ${expiredStatus._id}`);
        await S3BucketUtils.deleteFile(expiredStatus.content);
      }
    });
  }
  // Static method 2: Another method to watch database changes
  // ... 

  // Static method 3: This can be used to initialize all watch methods at once
  public static async initializeWatchers(): Promise<void> {
    if(NODE_ENV !== 'localhost'){
      // Automatically start all watchers when this method is called
      await this.watchForExpiredStatuses();
    }
  }
}