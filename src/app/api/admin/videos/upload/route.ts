import { NextRequest, NextResponse } from 'next/server';
import { S3VideoService } from '@/lib/video-service';

export async function POST(request: NextRequest) {
  try {
    const { videoId, movieTitle, quality, contentType } = await request.json();

    // Either videoId or movieTitle must be provided
    if ((!videoId && !movieTitle) || !quality) {
      return NextResponse.json(
        { error: 'Missing required fields: either videoId or movieTitle, and quality' },
        { status: 400 }
      );
    }

    // If movieTitle is provided, convert it to a slug, otherwise use videoId
    // We've already checked that either videoId or movieTitle exists, so videoSlug will be a string
    const videoSlug = movieTitle ? S3VideoService.titleToSlug(movieTitle) : (videoId as string);

    // Generate presigned URL for upload
    const uploadUrl = await S3VideoService.getUploadPresignedUrl(
      videoSlug,
      quality,
      contentType || 'video/mp4'
    );

    return NextResponse.json({
      uploadUrl,
      videoUrl: S3VideoService.getVideoUrl(videoSlug, quality),
      videoSlug, // Return the slug for reference
    });
  } catch (error) {
    console.error('Error generating upload URL:', error);
    return NextResponse.json({ error: 'Failed to generate upload URL' }, { status: 500 });
  }
}

// Get video streaming URL
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get('videoId');
    const movieTitle = searchParams.get('movieTitle');
    const quality = searchParams.get('quality') || '1080p';
    const presigned = searchParams.get('presigned') === 'true';
    const fetchAllQualities = searchParams.get('allQualities') === 'true';

    // Either videoId or movieTitle must be provided
    if (!videoId && !movieTitle) {
      return NextResponse.json(
        { error: 'Missing parameter: either videoId or movieTitle is required' },
        { status: 400 }
      );
    }

    // If movieTitle is provided, convert it to a slug, otherwise use videoId
    const videoSlug = movieTitle ? S3VideoService.titleToSlug(movieTitle) : (videoId as string);

    let videoUrl: string;

    if (presigned) {
      // Generate presigned URL for secure streaming
      videoUrl = await S3VideoService.getPresignedVideoUrl(videoSlug, quality);
    } else {
      // Get direct URL (for public videos)
      videoUrl = S3VideoService.getVideoUrl(videoSlug, quality);
    }

    // Prepare response object
    const response: any = {
      videoUrl,
      thumbnailUrl: S3VideoService.getThumbnailUrl(videoSlug),
      posterUrl: S3VideoService.getPosterUrl(videoSlug),
      videoSlug, // Return the slug for reference
    };

    // If requested, fetch URLs for all available qualities
    if (fetchAllQualities) {
      // Helper function to estimate bitrate based on quality
      function getEstimatedBitrate(quality: string): number {
        switch (quality.toLowerCase()) {
          case '4k':
            return 15000;
          case '1080p':
            return 8000;
          case '720p':
            return 5000;
          case '480p':
            return 2500;
          default:
            return 5000;
        }
      }

      // We can't use map with await directly, so we'll use Promise.all
      const qualityPromises = ['480p', '720p', '1080p', '4k'].map(async (q) => {
        const url = presigned
          ? await S3VideoService.getPresignedVideoUrl(videoSlug, q)
          : S3VideoService.getVideoUrl(videoSlug, q);

        return {
          quality: q.toUpperCase(),
          url,
          bitrate: getEstimatedBitrate(q),
        };
      });

      response.availableQualities = await Promise.all(qualityPromises);
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error getting video URL:', error);
    return NextResponse.json({ error: 'Failed to get video URL' }, { status: 500 });
  }
}
