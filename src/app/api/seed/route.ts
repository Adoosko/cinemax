import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST() {
  try {
    console.log('🌱 Starting database seed...');

    // Create Cinema
    const cinema = await prisma.cinema.upsert({
      where: { id: 'cinema-1' },
      update: {},
      create: {
        id: 'cinema-1',
        name: 'CinemaX Downtown',
        address: '123 Main Street',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        phone: '+1 (555) 123-4567',
        isActive: true,
      },
    });

    console.log('✅ Created cinema:', cinema.name);

    // Create Theaters
    const theaters = [
      { id: 'theater-1', name: 'Theater 1', screenType: 'STANDARD' },
      { id: 'theater-2', name: 'Theater 2', screenType: 'PREMIUM' },
      { id: 'theater-3', name: 'Theater 3', screenType: 'STANDARD' },
    ];

    for (const theaterData of theaters) {
      const theater = await prisma.theater.upsert({
        where: { id: theaterData.id },
        update: {},
        create: {
          id: theaterData.id,
          name: theaterData.name,
          cinemaId: cinema.id,
          totalSeats: 120,
          screenType: theaterData.screenType,
          isActive: true,
        },
      });

      console.log(`✅ Theater ${theaterData.name} created/updated`);

      // Generate seats for this theater
      await generateSeats(theater.id, theaterData.screenType);
    }

    // Create Movie
    const movie = await prisma.movie.upsert({
      where: { id: 'movie-1' },
      update: {},
      create: {
        id: 'movie-1',
        title: 'Movie Title',
        description: 'Movie description',
        duration: 148,
        isActive: true,
      },
    });

    console.log('✅ Created movie:', movie.title);

    // Create showtimes for each theater
    for (const theaterData of theaters) {
      const theater = await prisma.theater.findUnique({ where: { id: theaterData.id } });
      await createShowtimesForTheater(theater.id, movie.id);
    }

    return NextResponse.json({
      message: 'Database seeded successfully',
      cinema: cinema.name,
      theaters: theaters.length,
      movie: movie.title,
    });
  } catch (error) {
    console.error('❌ Seed failed:', error);
    return NextResponse.json({ error: 'Failed to seed database' }, { status: 500 });
  }
}

async function createShowtimesForTheater(theaterId: string, movieId: string) {
  const showtimes = [
    { time: '14:30', date: '2024-03-15' },
    { time: '17:00', date: '2024-03-15' },
    { time: '20:30', date: '2024-03-15' },
    { time: '14:30', date: '2024-03-16' },
    { time: '17:00', date: '2024-03-16' },
    { time: '20:30', date: '2024-03-16' },
  ];

  for (const showtime of showtimes) {
    const startTime = new Date(`${showtime.date}T${showtime.time}:00`);
    const endTime = new Date(startTime.getTime() + 148 * 60000); // 148 minutes

    // Create showtime with format matching booking page: movieId-time-date
    const showtimeId = `${movieId}-${showtime.time.replace(':', '')}-${showtime.date}`;

    await prisma.showtime.upsert({
      where: { id: showtimeId },
      create: {
        id: showtimeId,
        movieId,
        theaterId,
        startTime,
        endTime,
        basePrice: 12.5,
        isActive: true,
      },
      update: {},
    });
  }
}

async function generateSeats(theaterId: string, screenType: string) {
  const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

  for (const row of rows) {
    // Standard theater layout
    const seatsInRow = ['A', 'B'].includes(row) ? 8 : ['I', 'J'].includes(row) ? 10 : 12;

    for (let seatNumber = 1; seatNumber <= seatsInRow; seatNumber++) {
      // Determine seat type
      let seatType = 'STANDARD';

      // Wheelchair accessible seats (first row, positions 1-2 and last 2 positions)
      if (row === 'A' && (seatNumber <= 2 || seatNumber >= seatsInRow - 1)) {
        seatType = 'WHEELCHAIR_ACCESSIBLE';
      }
      // Premium seats (back rows G-J, middle sections)
      else if (
        ['G', 'H', 'I', 'J'].includes(row) &&
        seatNumber >= Math.floor(seatsInRow * 0.25) &&
        seatNumber <= Math.floor(seatsInRow * 0.75)
      ) {
        seatType = 'PREMIUM';
      }

      try {
        await prisma.seat.create({
          data: {
            theaterId,
            row,
            number: seatNumber,
            seatType: seatType as any,
            isActive: true,
          },
        });
      } catch (error) {
        // Skip if seat already exists
        console.log(`Seat ${row}${seatNumber} already exists, skipping...`);
      }
    }
  }

  console.log(`✅ Generated seats for ${theaterId}`);
}
