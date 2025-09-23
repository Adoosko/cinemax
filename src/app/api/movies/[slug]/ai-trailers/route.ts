import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { generatePresignedAudioUrl } from '@/lib/services/s3-audio';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // Find the movie by slug
    const movie = await prisma.movie.findUnique({
      where: { slug },
      select: { id: true }
    });

    if (!movie) {
      return NextResponse.json({ error: 'Movie not found' }, { status: 404 });
    }

    // Get AI trailers for this movie
    const aiTrailers = await prisma.aiTrailer.findMany({
      where: {
        movieId: movie.id,
        status: 'COMPLETED'
      },
      select: {
        id: true,
        script: true,
        fileUrl: true,
        fileSize: true,
        voiceStyle: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Generate presigned URLs for each trailer
    const trailersWithPresignedUrls = await Promise.all(
      aiTrailers.map(async (trailer) => {
        try {
          // Extract S3 key from fileUrl (same pattern as video system)
          // Expected format: https://domain/audio/movie-slug/voice-style/timestamp.mp3
          let s3Key = '';
          
          if (trailer.fileUrl.includes('/audio/')) {
            // Extract everything after the domain
            const urlParts = trailer.fileUrl.split('/');
            const audioIndex = urlParts.findIndex(part => part === 'audio');
            if (audioIndex !== -1) {
              s3Key = urlParts.slice(audioIndex).join('/');
            }
          } else {
            // Fallback: assume it's already a key
            s3Key = trailer.fileUrl.startsWith('/') ? trailer.fileUrl.slice(1) : trailer.fileUrl;
          }

          // Generate presigned URL using existing S3 audio service
          const presignedUrl = await generatePresignedAudioUrl(s3Key);

          return {
            ...trailer,
            fileUrl: presignedUrl, // Replace with presigned URL
          };
        } catch (error) {
          console.error(`Error generating presigned URL for trailer ${trailer.id}:`, error);
          // Return trailer with original URL if presigned URL generation fails
          return trailer;
        }
      })
    );

    return NextResponse.json({ 
      success: true,
      aiTrailers: trailersWithPresignedUrls 
    });
  } catch (error) {
    console.error('Error fetching AI trailers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch AI trailers' },
      { status: 500 }
    );
  }
}
