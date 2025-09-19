// AWS S3 video delivery service
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export interface VideoQuality {
  quality: string;
  url: string;
  bitrate: number;
}

export interface VideoMetadata {
  id: string;
  title: string;
  duration: number;
  thumbnail: string;
  poster: string;
  qualities: VideoQuality[];
  subtitles?: Array<{
    language: string;
    label: string;
    url: string;
  }>;
}

export class S3VideoService {
  private static readonly S3_BUCKET = process.env.NEXT_PUBLIC_AWS_S3_BUCKET || '';
  private static readonly S3_REGION = process.env.NEXT_PUBLIC_AWS_S3_REGION || 'us-east-1';
  private static readonly CLOUDFRONT_URL = process.env.NEXT_PUBLIC_AWS_CLOUDFRONT_URL || '';

  private static s3Client = new S3Client({
    region: this.S3_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    },
  });

  // Get direct S3 URL or CloudFront URL if available
  static getVideoUrl(videoSlug: string, quality: string = '1080p'): string {
    const baseUrl =
      this.CLOUDFRONT_URL || `https://${this.S3_BUCKET}.s3.${this.S3_REGION}.amazonaws.com`;
    return `${baseUrl}/videos/${videoSlug}/${quality}.mp4`;
  }

  static getThumbnailUrl(videoSlug: string, timeOffset: number = 0): string {
    const baseUrl =
      this.CLOUDFRONT_URL || `https://${this.S3_BUCKET}.s3.${this.S3_REGION}.amazonaws.com`;
    return `${baseUrl}/videos/${videoSlug}/thumbnails/${timeOffset}.jpg`;
  }

  static getPosterUrl(videoSlug: string): string {
    const baseUrl =
      this.CLOUDFRONT_URL || `https://${this.S3_BUCKET}.s3.${this.S3_REGION}.amazonaws.com`;
    return `${baseUrl}/videos/${videoSlug}/poster.jpg`;
  }

  // Generate presigned URL for secure video streaming
  static async getPresignedVideoUrl(
    videoSlug: string,
    quality: string = '1080p',
    expiresIn: number = 3600
  ): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.S3_BUCKET,
      Key: `videos/${videoSlug}/${quality}.mp4`,
    });

    try {
      return await getSignedUrl(this.s3Client, command, { expiresIn });
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
    const command = new PutObjectCommand({
      Bucket: this.S3_BUCKET,
      Key: `videos/${videoSlug}/${quality}.mp4`,
      ContentType: contentType,
    });

    return await getSignedUrl(this.s3Client, command, { expiresIn: 3600 });
  }

  // Sample video metadata for The Beekeeper (educational showcase)
  static getBeekeeperVideo(): VideoMetadata {
    return {
      id: 'beekeeper-2024',
      title: 'The Beekeeper',
      duration: 6360, // 1h 46m in seconds
      thumbnail: this.getThumbnailUrl('beekeeper-2024'),
      poster: this.getPosterUrl('beekeeper-2024'),
      qualities: [
        {
          quality: '4K',
          url: this.getVideoUrl('beekeeper-2024', '4k'),
          bitrate: 15000,
        },
        {
          quality: '1080p',
          url: this.getVideoUrl('beekeeper-2024', '1080p'),
          bitrate: 8000,
        },
        {
          quality: '720p',
          url: this.getVideoUrl('beekeeper-2024', '720p'),
          bitrate: 5000,
        },
        {
          quality: '480p',
          url: this.getVideoUrl('beekeeper-2024', '480p'),
          bitrate: 2500,
        },
      ],
      subtitles: [
        {
          language: 'en',
          label: 'English',
          url: `${this.CLOUDFRONT_URL || `https://${this.S3_BUCKET}.s3.${this.S3_REGION}.amazonaws.com`}/videos/beekeeper-2024/subtitles/en.vtt`,
        },
      ],
    };
  }

  // Check if a movie has streaming available
  static hasStreamingAvailable(movieSlug: string): boolean {
    // For now, only The Beekeeper has streaming
    return movieSlug === 'the-beekeeper' || movieSlug === 'beekeeper';
  }

  // Get streaming URL for a movie
  static getStreamingUrl(movieSlug: string): string | null {
    if (this.hasStreamingAvailable(movieSlug)) {
      return this.getVideoUrl('beekeeper-2024', '1080p');
    }
    return null;
  }

  // Upload video file to S3
  static async uploadVideo(file: File, videoSlug: string, quality: string): Promise<string> {
    try {
      const uploadUrl = await this.getUploadPresignedUrl(videoSlug, quality, file.type);

      const response = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      return this.getVideoUrl(videoSlug, quality);
    } catch (error) {
      console.error('Error uploading video:', error);
      throw error;
    }
  }

  // Convert movie title to a valid slug for S3 paths
  static titleToSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric chars with hyphens
      .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
  }

  // Delete video from S3
  static async deleteVideo(videoSlug: string, quality: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.S3_BUCKET,
      Key: `videos/${videoSlug}/${quality}.mp4`,
    });

    try {
      await this.s3Client.send(command);
    } catch (error) {
      console.error('Error deleting video:', error);
      throw error;
    }
  }
}

// Video player configuration
export const videoPlayerConfig = {
  controls: true,
  responsive: true,
  fluid: true,
  playbackRates: [0.5, 1, 1.25, 1.5, 2],
  plugins: {
    hotkeys: {
      volumeStep: 0.1,
      seekStep: 5,
      enableModifiersForNumbers: false,
    },
  },
};
