import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { slugify } from '@/lib/utils';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    // Check authentication and admin role
    const session = await auth.api.getSession({
      headers: await headers(),
    });

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

    // Create movie
    const movie = await prisma.movie.create({
      data: {
        title: data.title,
        slug: slugify(data.title),
        description: data.description,
        duration: data.duration,
        genre: data.genre,
        rating: data.rating,
        director: data.director,
        cast: data.cast || [],
        posterUrl: data.posterUrl || null,
        trailerUrl: data.trailerUrl || null,
        releaseDate: data.releaseDate ? new Date(data.releaseDate) : undefined,
        isActive: true,
      },
    });

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
