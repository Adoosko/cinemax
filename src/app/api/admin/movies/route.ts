import { auth } from '@/lib/auth';
import { slugify } from '@/lib/utils';
import { PrismaClient } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    // Check authentication and admin role
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const data = await request.json();

    // Validate required fields
    if (!data.title || !data.description || !data.duration || data.genre.length === 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate rating - should be a number as string from TMDB API
    let movieRating = data.rating;
    if (movieRating && isNaN(parseFloat(movieRating))) {
      movieRating = null; // Not a valid number
    }

    // Create movie
    const movie = await prisma.movie.create({
      data: {
        title: data.title,
        slug: slugify(data.title),
        description: data.description,
        duration: data.duration,
        genre: data.genre,
        rating: movieRating,
        director: data.director,
        cast: data.cast || [],
        posterUrl: data.posterUrl || null,
        backdropUrl: data.backdropUrl || null,
        trailerUrl: data.trailerUrl || null,
        releaseDate: data.releaseDate ? new Date(data.releaseDate) : undefined,
        isActive: true,
      },
    });

    // Revalidate the movies list page to show new content immediately
    revalidatePath('/movies');
    revalidatePath('/admin/movies');
    revalidatePath(`/movies/${movie.slug}`);

    return NextResponse.json({ movie }, { status: 201 });
  } catch (error) {
    console.error('Failed to create movie:', error);
    return NextResponse.json({ error: 'Failed to create movie' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const movies = await prisma.movie.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ movies });
  } catch (error) {
    console.error('Failed to fetch movies:', error);
    return NextResponse.json({ error: 'Failed to fetch movies' }, { status: 500 });
  }
}
