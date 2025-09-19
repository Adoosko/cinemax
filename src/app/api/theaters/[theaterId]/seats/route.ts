import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function GET(request: NextRequest, { params }: { params: { theaterId: string } }) {
  try {
    const { theaterId } = params;
    const { searchParams } = new URL(request.url);
    const showtimeId = searchParams.get('showtimeId');

    const seats = await prisma.seat.findMany({
      where: {
        theaterId,
        isActive: true,
      },
      orderBy: [{ row: 'asc' }, { number: 'asc' }],
    });

    // For now, let's simplify and just return available seats
    // TODO: Implement proper booking status checking after Prisma client is properly generated
    const bookedSeats: any[] = [];
    const tempReservations: any[] = [];

    // Map seat status
    const seatsWithStatus = seats.map((seat: any) => {
      const isBooked = bookedSeats.some((bs: any) => bs.seatId === seat.id);
      const isReserved = tempReservations.some((tr: any) => tr.seatId === seat.id);

      let status = 'available';
      if (isBooked) status = 'taken';
      else if (isReserved) status = 'reserved';

      return {
        id: `${seat.row}${seat.number}`,
        row: seat.row,
        number: seat.number,
        status,
        price:
          seat.seatType === 'PREMIUM'
            ? 24.0
            : seat.seatType === 'WHEELCHAIR_ACCESSIBLE'
              ? 16.0
              : 18.0,
        type:
          seat.seatType === 'WHEELCHAIR_ACCESSIBLE'
            ? 'wheelchair'
            : seat.seatType === 'PREMIUM'
              ? 'premium'
              : 'standard',
      };
    });

    return NextResponse.json(seatsWithStatus);
  } catch (error) {
    console.error('Failed to fetch seats:', error);
    return NextResponse.json({ error: 'Failed to fetch seats' }, { status: 500 });
  }
}
