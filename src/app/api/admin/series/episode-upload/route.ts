import { S3VideoService, titleToSlug } from '@/lib/services/video-service';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const {
      seriesId,
      seasonNumber,
      episodeNumber,
      seriesTitle,
      episodeTitle,
      quality,
      contentType,
    } = await request.json();

    // Validate required fields
    if (!seriesId || !seasonNumber || !episodeNumber || !quality) {
      return NextResponse.json(
        { error: 'Missing required fields: seriesId, seasonNumber, episodeNumber, quality' },
        { status: 400 }
      );
    }

    // Use simple path structure: series-slug/season-X/episodes/Y
    const seriesSlug = seriesTitle ? titleToSlug(seriesTitle) : seriesId;
    const videoPath = `${seriesSlug}/season-${seasonNumber}/episodes/${episodeNumber}`;

    // Generate presigned URL for upload
    const uploadUrl = await S3VideoService.getEpisodeUploadPresignedUrl(
      videoPath,
      quality,
      contentType || 'video/mp4'
    );

    return NextResponse.json({
      uploadUrl,
      videoUrl: S3VideoService.getEpisodeVideoUrl(videoPath, quality),
      videoPath, // Return the path for reference
    });
  } catch (error) {
    console.error('Error generating episode upload URL:', error);
    return NextResponse.json({ error: 'Failed to generate upload URL' }, { status: 500 });
  }
}
