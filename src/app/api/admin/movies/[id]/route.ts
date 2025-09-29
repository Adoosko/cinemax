import { auth } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication and admin role
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const movieId = id;

    // Check if movie exists
    const existingMovie = await prisma.movie.findUnique({
      where: { id: movieId },
    });

    if (!existingMovie) {
      return NextResponse.json({ error: 'Movie not found' }, { status: 404 });
    }

    // Delete related data that doesn't have cascade delete
    // Delete reviews first (they don't have onDelete: Cascade)
    await prisma.review.deleteMany({
      where: { movieId },
    });

    // Delete movie comments (they use movieSlug, not movieId)
    if (existingMovie.slug) {
      await prisma.movieComment.deleteMany({
        where: { movieSlug: existingMovie.slug },
      });
    }

    // Delete the movie (other relations like WatchHistory, Showtime, WatchParty, AiTrailer will cascade)
    await prisma.movie.delete({
      where: { id: movieId },
    });

    // Revalidate the movies list page
    revalidatePath('/movies');

    return NextResponse.json({ message: 'Movie deleted successfully' });
  } catch (error) {
    console.error('Failed to delete movie:', error);
    return NextResponse.json({ error: 'Failed to delete movie' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Check authentication and admin role
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const movieId = id;
    const data = await request.json();

    // Check if movie exists
    const existingMovie = await prisma.movie.findUnique({
      where: { id: movieId },
    });

    if (!existingMovie) {
      return NextResponse.json({ error: 'Movie not found' }, { status: 404 });
    }

    // Update the movie
    const updatedMovie = await prisma.movie.update({
      where: { id: movieId },
      data: {
        title: data.title,
        description: data.description,
        duration: data.duration,
        genre: data.genre,
        rating: data.rating,
        director: data.director,
        cast: data.cast || [],
        posterUrl: data.posterUrl || null,
        backdropUrl: data.backdropUrl || null,
        trailerUrl: data.trailerUrl || null,
        releaseDate: data.releaseDate ? new Date(data.releaseDate) : undefined,
        isActive: data.isActive ?? existingMovie.isActive,
      },
    });

    // Revalidate the movies list and specific movie page
    revalidatePath('/movies');
    revalidatePath(`/movies/${updatedMovie.slug}`);

    return NextResponse.json({ movie: updatedMovie });
  } catch (error) {
    console.error('Failed to update movie:', error);
    return NextResponse.json({ error: 'Failed to update movie' }, { status: 500 });
  }
}
