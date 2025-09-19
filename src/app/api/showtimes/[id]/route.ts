import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const showtime = await prisma.showtime.findUnique({
      where: {
        id: params.id,
      },
      include: {
        theater: {
          select: {
            id: true,
            name: true,
            screenType: true,
            totalSeats: true,
          },
        },
        movie: {
          select: {
            id: true,
            title: true,
            duration: true,
          },
        },
      },
    });

    if (!showtime) {
      return NextResponse.json({ error: 'Showtime not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: showtime.id,
      startTime: showtime.startTime,
      endTime: showtime.endTime,
      price: showtime.basePrice,
      theater: showtime.theater,
      movie: showtime.movie,
    });
  } catch (error) {
    console.error('Failed to fetch showtime:', error);
    return NextResponse.json({ error: 'Failed to fetch showtime' }, { status: 500 });
  }
}
