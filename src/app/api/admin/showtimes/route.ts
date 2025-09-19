import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

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
    if (!data.movieId || !data.theaterId || !data.startTime || !data.basePrice) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Calculate end time based on movie duration
    const movie = await prisma.movie.findUnique({
      where: { id: data.movieId },
      select: { duration: true },
    });

    if (!movie) {
      return NextResponse.json({ error: 'Movie not found' }, { status: 404 });
    }

    const startTime = new Date(data.startTime);
    const endTime = new Date(startTime.getTime() + movie.duration * 60000); // duration in minutes to milliseconds

    // Check for overlapping showtimes in the same theater
    const overlappingShowtime = await prisma.showtime.findFirst({
      where: {
        theaterId: data.theaterId,
        isActive: true,
        OR: [
          {
            AND: [{ startTime: { lte: startTime } }, { endTime: { gt: startTime } }],
          },
          {
            AND: [{ startTime: { lt: endTime } }, { endTime: { gte: endTime } }],
          },
          {
            AND: [{ startTime: { gte: startTime } }, { endTime: { lte: endTime } }],
          },
        ],
      },
    });

    if (overlappingShowtime) {
      return NextResponse.json(
        { error: 'Showtime conflicts with existing showtime' },
        { status: 409 }
      );
    }

    // Create showtime
    const showtime = await prisma.showtime.create({
      data: {
        movieId: data.movieId,
        theaterId: data.theaterId,
        startTime,
        endTime,
        basePrice: parseFloat(data.basePrice),
        isActive: true,
      },
      include: {
        movie: {
          select: {
            title: true,
            duration: true,
          },
        },
        theater: {
          select: {
            name: true,
            cinema: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ showtime }, { status: 201 });
  } catch (error) {
    console.error('Failed to create showtime:', error);
    return NextResponse.json({ error: 'Failed to create showtime' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const showtimes = await prisma.showtime.findMany({
      include: {
        movie: {
          select: {
            title: true,
            duration: true,
            posterUrl: true,
          },
        },
        theater: {
          select: {
            name: true,
            totalSeats: true,
            cinema: {
              select: {
                name: true,
              },
            },
          },
        },
        _count: {
          select: {
            bookings: {
              where: {
                status: 'CONFIRMED',
              },
            },
          },
        },
      },
      orderBy: {
        startTime: 'asc',
      },
    });

    return NextResponse.json({ showtimes });
  } catch (error) {
    console.error('Failed to fetch showtimes:', error);
    return NextResponse.json({ error: 'Failed to fetch showtimes' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const showtimeId = searchParams.get('id');

    if (!showtimeId) {
      return NextResponse.json({ error: 'Showtime ID required' }, { status: 400 });
    }

    // Check if showtime has any confirmed bookings
    const bookingsCount = await prisma.booking.count({
      where: {
        showtimeId,
        status: 'CONFIRMED',
      },
    });

    if (bookingsCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete showtime with confirmed bookings' },
        { status: 409 }
      );
    }

    // Soft delete by setting isActive to false
    const showtime = await prisma.showtime.update({
      where: { id: showtimeId },
      data: { isActive: false },
    });

    return NextResponse.json({ showtime });
  } catch (error) {
    console.error('Failed to delete showtime:', error);
    return NextResponse.json({ error: 'Failed to delete showtime' }, { status: 500 });
  }
}
