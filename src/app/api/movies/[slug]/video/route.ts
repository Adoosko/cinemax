import { GetObjectCommand, HeadObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

interface RouteParams {
  params: Promise<{ slug: string }>;
}

const prisma = new PrismaClient();

const s3Client = new S3Client({
  region: process.env.NEXT_PUBLIC_S3_REGION || 'eu-north-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

async function generatePresignedUrl(bucket: string, key: string): Promise<string> {
  const command = new GetObjectCommand({ Bucket: bucket, Key: key });
  return await getSignedUrl(s3Client, command, { expiresIn: 7200 }); // 2 hours
}

async function checkFileExists(bucket: string, key: string): Promise<boolean> {
  try {
    await s3Client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    return true;
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const url = new URL(request.url);
    const useDirect = url.searchParams.get('direct') === 'true';

    console.log(`Fetching video for: ${slug}, useDirect: ${useDirect}`);

    const movie = await prisma.movie.findUnique({
      where: { slug: slug, isActive: true },
    });

    if (!movie) {
      return NextResponse.json({ error: 'Movie not found' }, { status: 404 });
    }

    const bucket = process.env.NEXT_PUBLIC_S3_BUCKET || 'cinemx';
    const qualityFiles = [
      { quality: '4K', file: '4k.mp4', bitrate: 25000 },
      { quality: '1080P', file: '1080p.mp4', bitrate: 8000 },
      { quality: '720P', file: '720p.mp4', bitrate: 4000 },
      { quality: '480P', file: '480p.mp4', bitrate: 2000 },
    ];

    const qualities = [];
    let primaryUrl = '';

    for (const { quality, file, bitrate } of qualityFiles) {
      const key = `videos/${slug}/${file}`;
      const exists = await checkFileExists(bucket, key);

      if (exists) {
        // ALWAYS use presigned URLs now - no more direct URLs
        const presignedUrl = await generatePresignedUrl(bucket, key);

        qualities.push({
          quality,
          url: presignedUrl,
          bitrate,
        });

        // Set primary URL to highest quality available
        if (!primaryUrl) {
          primaryUrl = presignedUrl;
        }
      }
    }

    if (!primaryUrl && qualities.length === 0) {
      return NextResponse.json({ error: 'No video files available' }, { status: 404 });
    }

    const movieData = {
      id: movie.id,
      slug: movie.slug,
      title: movie.title,
      description: movie.description,
      streamingUrl: primaryUrl, // Always presigned URL
      poster: movie.posterUrl,
      backdrop: movie.backdropUrl,
      duration: movie.duration,
      year: movie.releaseDate ? new Date(movie.releaseDate).getFullYear() : undefined,
      genre: movie.genre,
      rating: movie.rating,
      director: movie.director,
      cast: movie.cast,
      qualities, // All presigned URLs
    };

    const response = NextResponse.json({
      success: true,
      movie: movieData,
    });

    // CORS headers
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Cache-Control', 'no-store, max-age=0');

    return response;
  } catch (error) {
    console.error('Error in video endpoint:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
