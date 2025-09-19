import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { seatIds, showtimeId, sessionId } = await request.json();

    // Clean up expired reservations first
    await prisma.tempReservation.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    // Create new temporary reservations
    const reservations = await Promise.all(
      seatIds.map(async (seatId: string) => {
        const [row, numberStr] = [seatId.slice(0, 1), seatId.slice(1)];
        const number = parseInt(numberStr);

        const seat = await prisma.seat.findFirst({
          where: { row, number },
        });

        if (!seat) return null;

        return prisma.tempReservation.upsert({
          where: {
            seatId_showtimeId: {
              seatId: seat.id,
              showtimeId,
            },
          },
          create: {
            seatId: seat.id,
            showtimeId,
            sessionId,
            expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
          },
          update: {
            sessionId,
            expiresAt: new Date(Date.now() + 10 * 60 * 1000),
          },
        });
      })
    );

    return NextResponse.json({ success: true, reservations });
  } catch (error) {
    console.error('Seat reservation failed:', error);
    return NextResponse.json({ error: 'Failed to reserve seats' }, { status: 500 });
  }
}
