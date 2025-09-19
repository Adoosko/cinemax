import { NextRequest, NextResponse } from 'next/server';
import { S3VideoService } from '@/lib/video-service';

interface RouteParams {
  params: { slug: string };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;

    // Check if movie has streaming available
    if (!S3VideoService.hasStreamingAvailable(slug)) {
      return NextResponse.json(
        { error: 'Movie not found or not available for streaming' },
        { status: 404 }
      );
    }

    // For now, handle the beekeeper movie specifically
    // You can expand this to fetch from your database later
    let movieId: string;
    let movieTitle: string;

    if (slug === 'the-beekeeper' || slug === 'beekeeper') {
      movieId = 'the-beekeeper'; // Use the actual slug instead of 'beekeeper-2024'
      movieTitle = 'The Beekeeper';
    } else {
      return NextResponse.json(
        { error: 'Movie not found or not available for streaming' },
        { status: 404 }
      );
    }

    // Generate video URLs for different qualities
    const videoQualities = ['480p', '720p', '1080p', '4k'];
    const availableQualities = [];

    for (const quality of videoQualities) {
      try {
        // Generate presigned URL to check if file exists and get streaming URL
        const videoUrl = await S3VideoService.getPresignedVideoUrl(movieId, quality, 7200); // 2 hours
        availableQualities.push({
          quality: quality.toUpperCase(),
          url: videoUrl,
          bitrate: getEstimatedBitrate(quality),
        });
      } catch (error) {
        // If presigned URL fails, try direct URL
        const directUrl = S3VideoService.getVideoUrl(movieId, quality);
        availableQualities.push({
          quality: quality.toUpperCase(),
          url: directUrl,
          bitrate: getEstimatedBitrate(quality),
        });
      }
    }

    // Get thumbnail and poster URLs
    const thumbnailUrl = S3VideoService.getThumbnailUrl(movieId, 0);
    const posterUrl = S3VideoService.getPosterUrl(movieId);

    // Get additional metadata including backdrop
    const additionalMetadata = getMovieMetadata(slug);

    const videoMetadata = {
      id: movieId,
      title: movieTitle,
      slug: slug,
      duration: '1h 46m', // 1h 46m for The Beekeeper
      thumbnail: thumbnailUrl,
      poster: posterUrl,
      backdrop: additionalMetadata.backdrop,
      trailer: null,
      qualities: availableQualities,
      streamingUrl:
        availableQualities.find((q) => q.quality.toLowerCase() === '4k')?.url ||
        availableQualities[0]?.url,
      // Additional metadata
      description: additionalMetadata.description,
      year: additionalMetadata.year,
      genre: additionalMetadata.genre,
      rating: additionalMetadata.rating,
      director: additionalMetadata.director,
      cast: additionalMetadata.cast,
    };

    const response = NextResponse.json({
      success: true,
      movie: videoMetadata,
    });

    // Add CORS headers
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    return response;
  } catch (error) {
    console.error('Error fetching movie video data:', error);
    return NextResponse.json({ error: 'Failed to fetch movie video data' }, { status: 500 });
  }
}

function getEstimatedBitrate(quality: string): number {
  switch (quality) {
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


function getMovieMetadata(slug: string) {
  const movieData: { [key: string]: any } = {
    'the-beekeeper': {
      description:
        "One man's brutal campaign for vengeance takes on national stakes after he is revealed to be a former operative of a powerful and clandestine organization known as 'Beekeepers'.",
      year: 2024,
      genre: 'Action',
      rating: 7.2,
      director: 'David Ayer',
      cast: ['Jason Statham', 'Emmy Raver-Lampman', 'Bobby Naderi', 'Josh Hutcherson'],
      backdrop:
        'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=1920&h=1080&fit=crop',
    },
    'big-buck-bunny': {
      description:
        'Big Buck Bunny is a 2008 computer-animated comedy short film featuring animals of the forest, made by the Blender Institute, part of the Blender Foundation. Follow the adventures of a giant rabbit as he faces off against a trio of rodents.',
      year: 2008,
      genre: 'Animation, Comedy, Family',
      rating: 7.8,
      director: 'Sacha Goedegebure',
      cast: ['Big Buck Bunny', 'Frank the Flying Squirrel', 'Rinky the Squirrel'],
      backdrop:
        'https://images.unsplash.com/photo-1489599162914-09c5b83ac8c5?w=1920&h=1080&fit=crop',
    },
    'elephant-dream': {
      description:
        "Elephant's Dream is a 2006 computer animated short film produced by Blender Foundation using primarily free software. The film is set in a surreal world where two characters explore a strange mechanical landscape.",
      year: 2006,
      genre: 'Animation, Fantasy, Sci-Fi',
      rating: 7.2,
      director: 'Bassam Kurdali',
      cast: ['Proog', 'Emo'],
      backdrop:
        'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=1920&h=1080&fit=crop',
    },
    sintel: {
      description:
        "Sintel is a 2010 computer-animated fantasy short film. The film follows a girl named Sintel who is searching for a baby dragon she calls Scales. A dangerous journey leads her to discover that the dragon she's been looking for is not what she expected.",
      year: 2010,
      genre: 'Animation, Fantasy, Adventure',
      rating: 8.1,
      director: 'Colin Levy',
      cast: ['Sintel', 'Scales', 'The Shaman'],
      backdrop:
        'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1920&h=1080&fit=crop',
    },
  };

  return (
    movieData[slug] || {
      description: 'No description available.',
      year: 2024,
      genre: 'Unknown',
      rating: 7.0,
      director: 'Unknown Director',
      cast: [],
      backdrop:
        'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=1920&h=1080&fit=crop',
    }
  );
}
