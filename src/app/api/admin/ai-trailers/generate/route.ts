import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { generateTrailerScript, MovieTrailerData } from '@/lib/services/openai';
import { synthesizeVoice, VoiceStyleKey, VOICE_STYLES } from '@/lib/services/elevenlabs';
import { uploadAudioToS3 } from '@/lib/services/s3-audio';
import {
  createAiTrailer,
  updateAiTrailer,
  hasExistingTrailer,
  getAiTrailersByMovieId,
  AiTrailerStatus,
} from '@/lib/data/ai-trailers-simple';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { movieId, voiceStyle = 'epic', overwrite = false } = body;

    // Validate required fields
    if (!movieId) {
      return NextResponse.json({ error: 'Movie ID is required' }, { status: 400 });
    }

    if (!VOICE_STYLES[voiceStyle as VoiceStyleKey]) {
      return NextResponse.json(
        { error: `Invalid voice style. Available styles: ${Object.keys(VOICE_STYLES).join(', ')}` },
        { status: 400 }
      );
    }

    // Check if trailer already exists
    if (!overwrite && (await hasExistingTrailer(movieId, voiceStyle))) {
      return NextResponse.json(
        {
          error:
            'Trailer already exists for this movie and voice style. Use overwrite=true to regenerate.',
        },
        { status: 409 }
      );
    }

    // Fetch movie details
    const movie = await prisma.movie.findUnique({
      where: { id: movieId },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        genre: true,
        director: true,
        cast: true,
        rating: true,
        releaseDate: true,
      },
    });

    if (!movie) {
      return NextResponse.json({ error: 'Movie not found' }, { status: 404 });
    }

    if (!movie.slug) {
      return NextResponse.json(
        { error: 'Movie slug is required for file organization' },
        { status: 400 }
      );
    }

    // Create initial trailer record
    const initialTrailer = await createAiTrailer({
      movieId: movie.id,
      voiceStyle,
      status: 'GENERATING_SCRIPT',
    });

    try {
      // Step 1: Generate script with OpenAI
      await updateAiTrailer(initialTrailer.id, {
        status: 'GENERATING_SCRIPT',
      });

      const movieTrailerData: MovieTrailerData = {
        title: movie.title,
        genre: movie.genre,
        releaseYear: movie.releaseDate
          ? new Date(movie.releaseDate).getFullYear()
          : new Date().getFullYear(),
        tagline: movie.description || undefined,
        description: movie.description || undefined,
        mainCast: movie.cast,
        director: movie.director || undefined,
        rating: movie.rating || undefined,
      };

      const script = await generateTrailerScript(movieTrailerData);

      // Update with generated script
      await updateAiTrailer(initialTrailer.id, {
        script,
        status: 'GENERATING_AUDIO',
      });

      // Step 2: Generate audio with ElevenLabs
      const audioResponse = await synthesizeVoice(script, voiceStyle as VoiceStyleKey);

      // Update status to uploading
      await updateAiTrailer(initialTrailer.id, {
        status: 'UPLOADING',
      });

      // Step 3: Upload to S3
      const uploadResult = await uploadAudioToS3(
        audioResponse.audio,
        movie.slug,
        voiceStyle,
        audioResponse.contentType
      );

      // Step 4: Update final record
      const completedTrailer = await updateAiTrailer(initialTrailer.id, {
        script,
        fileUrl: uploadResult.fileUrl,
        fileSize: uploadResult.fileSize,
        status: 'COMPLETED',
      });

      return NextResponse.json({
        success: true,
        trailer: {
          id: completedTrailer.id,
          movieId: completedTrailer.movieId,
          script: completedTrailer.script,
          fileUrl: completedTrailer.fileUrl,
          fileSize: completedTrailer.fileSize,
          voiceStyle: completedTrailer.voiceStyle,
          status: completedTrailer.status,
          createdAt: completedTrailer.createdAt,
          movie: {
            title: movie.title,
            slug: movie.slug,
          },
        },
      });
    } catch (error) {
      // Update trailer record with error
      await updateAiTrailer(initialTrailer.id, {
        status: 'FAILED',
      });

      throw error;
    }
  } catch (error) {
    console.error('Error generating AI trailer:', error);

    return NextResponse.json(
      {
        error: 'Failed to generate AI trailer',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Get all AI trailers
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const movieId = searchParams.get('movieId');
    const status = searchParams.get('status') as AiTrailerStatus | null;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (movieId) {
      // Get trailers for specific movie
      const trailers = await getAiTrailersByMovieId(movieId);
      return NextResponse.json({ trailers });
    }

    // Get all trailers with pagination
    const skip = (page - 1) * limit;
    const where = status ? { status } : {};

    const [trailers, total] = await Promise.all([
      prisma.aiTrailer.findMany({
        where,
        include: {
          movie: {
            select: {
              id: true,
              title: true,
              slug: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.aiTrailer.count({ where }),
    ]);

    return NextResponse.json({
      trailers,
      pagination: {
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        limit,
      },
    });
  } catch (error) {
    console.error('Error fetching AI trailers:', error);
    return NextResponse.json({ error: 'Failed to fetch AI trailers' }, { status: 500 });
  }
}
