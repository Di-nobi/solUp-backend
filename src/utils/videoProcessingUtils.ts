import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';

export class VideoUtils {
  // Get video duration in seconds
  static async getVideoDuration(filePath: string): Promise<number> {
    console.log('Video file path:', filePath);

    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        console.log(metadata);
        if (err) {
          return reject(new Error(`Failed to probe video metadata: ${err.message}`));
        }

        if (!metadata || !metadata.format || typeof metadata.format.duration !== 'number') {
          return reject(new Error('Invalid video metadata: Duration is missing.'));
        }

        resolve(metadata.format.duration);
      });
    });
  }

  // Split video into segments of 30 seconds
  static async splitVideo(filePath: string, tempDir: string): Promise<string[]> {
    const segments: string[] = [];

    try {
      const duration = await VideoUtils.getVideoDuration(filePath);
      console.log('Video duration (seconds):', duration);

      let segmentStart = 0;

      while (segmentStart < duration) {
        const segmentPath = `${tempDir}/segment_${segmentStart}.mp4`;
        segments.push(segmentPath);

        console.log(`Creating segment from ${segmentStart}s to ${Math.min(segmentStart + 30, duration)}s`);

        await new Promise<void>((resolve, reject) => {
          ffmpeg(filePath)
            .setStartTime(segmentStart)
            .setDuration(30) // 30 seconds per segment
            .output(segmentPath)
            .on('end', () => {
              console.log(`Segment created: ${segmentPath}`);
              resolve();
            })
            .on('error', (error) => {
              reject(new Error(`Failed to create video segment: ${error.message}`));
            })
            .run();
        });

        segmentStart += 30;
      }
    } catch (error) {
      throw new Error(`Error during video splitting: ${error instanceof Error ? error.message : String(error)}`);
    }

    return segments;
  }
}
