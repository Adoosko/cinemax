'use client';

import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export class VideoService {
  protected static readonly S3_BUCKET = process.env.NEXT_PUBLIC_S3_BUCKET || 'cinemx';
  protected static readonly S3_REGION = process.env.NEXT_PUBLIC_S3_REGION || 'eu-north-1';
  protected static readonly CLOUDFRONT_URL = process.env.NEXT_PUBLIC_CLOUDFRONT_URL;

  // Initialize S3 client (only on server-side)
  private static getS3Client() {
    // Only create the client on server-side where credentials are available
    if (typeof window === 'undefined') {
      return new S3Client({
        region: this.S3_REGION,
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
        },
      });
    }
    return null;
  }

  // Check if streaming is available for a movie
  static hasStreamingAvailable(movieSlug: string): boolean {
    // Support all movies - we'll check in the database if they're available
    return true;
  }
  
  // Get direct S3 URL or CloudFront URL if available
  static getVideoUrl(videoSlug: string, quality: string = '1080p', fileName?: string): string {
    const baseUrl =
      this.CLOUDFRONT_URL || `https://${this.S3_BUCKET}.s3.${this.S3_REGION}.amazonaws.com`;

    // If a specific fileName is provided, use it directly
    if (fileName) {
      return `${baseUrl}/videos/${videoSlug}/${fileName}`;
    }

    // Otherwise map quality to file name based on our conventions
    let videoFileName;
    switch (quality.toLowerCase()) {
      case '4k':
        videoFileName = '4k.mp4';
        break;
      case '1080p':
        videoFileName = '1080p.mp4';
        break;
      case '720p':
        videoFileName = '720p.mp4';
        break;
      case '480p':
        videoFileName = '480p.mp4';
        break;
      default:
        // Fallback to standard format if quality doesn't match our specific files
        videoFileName = `${quality}.mp4`;
    }

    return `${baseUrl}/videos/${videoSlug}/${videoFileName}`;
  }

  static getThumbnailUrl(videoSlug: string, timeOffset: number = 0): string {
    const baseUrl =
      this.CLOUDFRONT_URL || `https://${this.S3_BUCKET}.s3.${this.S3_REGION}.amazonaws.com`;
    return `${baseUrl}/thumbnails/${videoSlug}/thumb_${timeOffset}.jpg`;
  }
  
  // Get poster URL for a movie
  static getPosterUrl(videoSlug: string): string {
    const baseUrl =
      this.CLOUDFRONT_URL || `https://${this.S3_BUCKET}.s3.${this.S3_REGION}.amazonaws.com`;
    return `${baseUrl}/videos/${videoSlug}/poster.jpg`;
  }

  // Generate presigned URL for secure video access
  static async getPresignedVideoUrl(
    videoSlug: string,
    quality: string = '1080p',
    expiresIn: number = 3600
  ): Promise<string> {
    // Map quality to actual file name
    let fileName;
    switch (quality.toLowerCase()) {
      case '4k':
        fileName = '4k.mp4';
        break;
      case '720p':
        fileName = '720p.mp4';
        break;
      default:
        fileName = `${quality}.mp4`;
    }

    const command = new GetObjectCommand({
      Bucket: this.S3_BUCKET,
      Key: `videos/${videoSlug}/${fileName}`,
    });

    try {
      const s3Client = this.getS3Client();
      if (!s3Client) {
        throw new Error('S3 client not available (client-side environment)');
      }
      return await getSignedUrl(s3Client, command, { expiresIn });
    } catch (error) {
      console.error('Error generating presigned URL:', error);
      return this.getVideoUrl(videoSlug, quality); // Fallback to direct URL
    }
  }

  // Generate presigned URL for video upload
  static async getUploadPresignedUrl(
    videoSlug: string,
    quality: string,
    contentType: string = 'video/mp4'
  ): Promise<string> {
    // Map quality to actual file name
    let fileName;
    switch (quality.toLowerCase()) {
      case '4k':
        fileName = '4k.mp4';
        break;
      case '720p':
        fileName = '720p.mp4';
        break;
      default:
        fileName = `${quality}.mp4`;
    }

    const command = new PutObjectCommand({
      Bucket: this.S3_BUCKET,
      Key: `videos/${videoSlug}/${fileName}`,
      ContentType: contentType,
    });

    try {
      const s3Client = this.getS3Client();
      if (!s3Client) {
        throw new Error('S3 client not available (client-side environment)');
      }
      return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    } catch (error) {
      console.error('Error generating upload presigned URL:', error);
      throw error;
    }
  }

  // Get video metadata
  static async getVideoMetadata(videoSlug: string): Promise<any> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.S3_BUCKET,
        Key: `videos/${videoSlug}/metadata.json`,
      });

      const s3Client = this.getS3Client();
      if (!s3Client) {
        throw new Error('S3 client not available (client-side environment)');
      }
      const response = await s3Client.send(command);
      const metadata = await response.Body?.transformToString();
      return metadata ? JSON.parse(metadata) : null;
    } catch (error) {
      console.error('Error fetching video metadata:', error);
      return null;
    }
  }

  // Upload video metadata
  static async uploadVideoMetadata(videoSlug: string, metadata: any): Promise<void> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.S3_BUCKET,
        Key: `videos/${videoSlug}/metadata.json`,
        Body: JSON.stringify(metadata),
        ContentType: 'application/json',
      });

      const s3Client = this.getS3Client();
      if (!s3Client) {
        throw new Error('S3 client not available (client-side environment)');
      }
      await s3Client.send(command);
    } catch (error) {
      console.error('Error uploading video metadata:', error);
      throw error;
    }
  }

  // Delete video file
  static async deleteVideo(videoSlug: string, quality: string): Promise<void> {
    // Map quality to actual file name
    let fileName;
    switch (quality.toLowerCase()) {
      case '4k':
        fileName = '4k.mp4';
        break;
      case '720p':
        fileName = '720p.mp4';
        break;
      default:
        fileName = `${quality}.mp4`;
    }

    const command = new DeleteObjectCommand({
      Bucket: this.S3_BUCKET,
      Key: `videos/${videoSlug}/${fileName}`,
    });

    try {
      const s3Client = this.getS3Client();
      if (!s3Client) {
        throw new Error('S3 client not available (client-side environment)');
      }
      await s3Client.send(command);
    } catch (error) {
      console.error('Error deleting video:', error);
      throw error;
    }
  }

  // Check if video quality exists
  static async videoQualityExists(videoSlug: string, quality: string): Promise<boolean> {
    // In development mode, simulate file existence
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
      // For testing purposes, let's say only 720p and 4k exist
      return quality === '720p' || quality === '4k';
    }

    // Map quality to actual file name
    let fileName;
    switch (quality.toLowerCase()) {
      case '4k':
        fileName = '4k.mp4';
        break;
      case '720p':
        fileName = '720p.mp4';
        break;
      default:
        fileName = `${quality}.mp4`;
    }

    // In production, actually check if the file exists in S3
    const command = new GetObjectCommand({
      Bucket: this.S3_BUCKET,
      Key: `videos/${videoSlug}/${fileName}`,
    });

    try {
      const s3Client = this.getS3Client();
      if (!s3Client) {
        throw new Error('S3 client not available (client-side environment)');
      }
      await s3Client.send(command);
      return true;
    } catch (error) {
      return false;
    }
  }

  // Discover all available video qualities for a movie
  static async discoverVideoQualities(
    videoSlug: string
  ): Promise<Array<{ quality: string; url: string; bitrate: number }>> {
    // Define all possible video file patterns to check
    const possibleFiles = [
      // Standard quality designations
      { file: '4k.mp4', quality: '4K', bitrate: 15000 },
      { file: '1080p.mp4', quality: '1080P', bitrate: 8000 },
      { file: '720p.mp4', quality: '720P', bitrate: 5000 },
      { file: '480p.mp4', quality: '480P', bitrate: 2500 },
      { file: '360p.mp4', quality: '360P', bitrate: 1500 },
      { file: '240p.mp4', quality: '240P', bitrate: 800 },

      // Alternative naming patterns
      { file: 'uhd.mp4', quality: '4K', bitrate: 15000 },
      { file: 'hd.mp4', quality: 'HD', bitrate: 5000 },
      { file: 'sd.mp4', quality: 'SD', bitrate: 2500 },
      { file: 'high.mp4', quality: 'HIGH', bitrate: 8000 },
      { file: 'medium.mp4', quality: 'MEDIUM', bitrate: 5000 },
      { file: 'low.mp4', quality: 'LOW', bitrate: 2500 },

      // Numeric naming
      { file: '2160.mp4', quality: '4K', bitrate: 15000 },
      { file: '1080.mp4', quality: '1080P', bitrate: 8000 },
      { file: '720.mp4', quality: '720P', bitrate: 5000 },
      { file: '480.mp4', quality: '480P', bitrate: 2500 },
    ];

    // In development mode, simulate file discovery
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
      console.log(`[DEV] Simulating video quality discovery for ${videoSlug}`);

      // For demo purposes, let's say we have 720p and 4K
      try {
        // Generate presigned URLs for secure access
        const url4K = await this.getPresignedVideoUrl(videoSlug, '4k', 7200); // 2 hour expiry
        const url720p = await this.getPresignedVideoUrl(videoSlug, '720p', 7200); // 2 hour expiry
        
        return [
          {
            quality: '4K',
            url: url4K,
            bitrate: 15000,
          },
          {
            quality: '720P',
            url: url720p,
            bitrate: 5000,
          },
        ];
      } catch (error) {
        console.error('Error generating presigned URLs in development:', error);
        // Fallback to direct URLs (will likely cause 403 errors)
        return [
          {
            quality: '4K',
            url: this.getVideoUrl(videoSlug, '4k', '4k.mp4'),
            bitrate: 15000,
          },
          {
            quality: '720P',
            url: this.getVideoUrl(videoSlug, '720p', '720p.mp4'),
            bitrate: 5000,
          },
        ];
      }
    }

    // In production, we would list objects in the S3 bucket
    // For now, we'll check for each possible file pattern
    const availableQualities = [];

    // Check each possible file pattern
    for (const filePattern of possibleFiles) {
      try {
        // Check if this file exists in S3
        const command = new GetObjectCommand({
          Bucket: this.S3_BUCKET,
          Key: `videos/${videoSlug}/${filePattern.file}`,
        });

        try {
          const s3Client = this.getS3Client();
          if (!s3Client) {
            throw new Error('S3 client not available (client-side environment)');
          }
          await s3Client.send(command);
          // File exists, generate a presigned URL
          const url = await this.getPresignedVideoUrl(videoSlug, filePattern.quality, 7200); // 2 hours

          // Add to available qualities
          availableQualities.push({
            quality: filePattern.quality,
            url,
            bitrate: filePattern.bitrate,
          });

          console.log(`Found video quality: ${filePattern.quality} (${filePattern.file})`);
        } catch (error) {
          // File doesn't exist, skip silently
        }
      } catch (error) {
        console.error(`Error checking for file ${filePattern.file}:`, error);
      }
    }

    // Sort qualities by bitrate (highest first)
    availableQualities.sort((a, b) => b.bitrate - a.bitrate);

    return availableQualities;
  }
}

// Export VideoService as S3VideoService for backward compatibility
export const S3VideoService = VideoService;
