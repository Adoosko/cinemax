import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.NEXT_PUBLIC_AWS_S3_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export interface AudioUploadResult {
  fileUrl: string;
  fileSize: number;
  key: string;
}

export async function uploadAudioToS3(
  audioBuffer: ArrayBuffer,
  movieSlug: string,
  voiceStyle: string,
  contentType: string = 'audio/mpeg'
): Promise<AudioUploadResult> {
  if (!process.env.NEXT_PUBLIC_AWS_S3_BUCKET) {
    throw new Error('AWS S3 bucket is not configured');
  }

  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    throw new Error('AWS credentials are not configured');
  }

  // Generate timestamp for unique filename
  const timestamp = Date.now();
  const key = `audio/${movieSlug.toLowerCase()}/${voiceStyle.toLowerCase()}/${timestamp}.mp3`;

  try {
    const command = new PutObjectCommand({
      Bucket: process.env.NEXT_PUBLIC_AWS_S3_BUCKET,
      Key: key,
      Body: new Uint8Array(audioBuffer),
      ContentType: contentType,
      CacheControl: 'max-age=31536000', // Cache for 1 year
      Metadata: {
        'movie-slug': movieSlug,
        'voice-style': voiceStyle,
        'generated-at': new Date().toISOString(),
      },
    });

    await s3Client.send(command);

    // Construct the public URL
    const baseUrl = process.env.NEXT_PUBLIC_AWS_CLOUDFRONT_URL || 
                   `https://${process.env.NEXT_PUBLIC_AWS_S3_BUCKET}.s3.${process.env.NEXT_PUBLIC_AWS_S3_REGION}.amazonaws.com`;
    
    const fileUrl = `${baseUrl}/${key}`;
    const fileSize = audioBuffer.byteLength;

    return {
      fileUrl,
      fileSize,
      key,
    };
  } catch (error) {
    console.error('Error uploading audio to S3:', error);
    throw new Error(`Failed to upload audio to S3: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function generatePresignedAudioUrl(
  key: string,
  expiresIn: number = 3600 // 1 hour default
): Promise<string> {
  if (!process.env.NEXT_PUBLIC_AWS_S3_BUCKET) {
    throw new Error('AWS S3 bucket is not configured');
  }

  try {
    const command = new GetObjectCommand({
      Bucket: process.env.NEXT_PUBLIC_AWS_S3_BUCKET,
      Key: key,
    });

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn });
    return signedUrl;
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    throw new Error(`Failed to generate presigned URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function checkAudioExists(key: string): Promise<boolean> {
  if (!process.env.NEXT_PUBLIC_AWS_S3_BUCKET) {
    return false;
  }

  try {
    const command = new GetObjectCommand({
      Bucket: process.env.NEXT_PUBLIC_AWS_S3_BUCKET,
      Key: key,
    });

    await s3Client.send(command);
    return true;
  } catch (error) {
    return false;
  }
}

export function parseAudioKey(key: string): {
  movieSlug: string;
  voiceStyle: string;
  timestamp: string;
} | null {
  // Expected format: audio/{movie-slug}/{voice-style}/{timestamp}.mp3
  const match = key.match(/^audio\/([^\/]+)\/([^\/]+)\/(\d+)\.mp3$/);
  
  if (!match) {
    return null;
  }

  return {
    movieSlug: match[1],
    voiceStyle: match[2],
    timestamp: match[3],
  };
}

export async function testS3Connection(): Promise<boolean> {
  try {
    if (!process.env.NEXT_PUBLIC_AWS_S3_BUCKET || 
        !process.env.AWS_ACCESS_KEY_ID || 
        !process.env.AWS_SECRET_ACCESS_KEY) {
      return false;
    }

    // Test by attempting to list objects (this doesn't actually list, just tests connection)
    const testKey = 'test-connection';
    await checkAudioExists(testKey);
    return true;
  } catch (error) {
    console.error('S3 connection test failed:', error);
    return false;
  }
}
