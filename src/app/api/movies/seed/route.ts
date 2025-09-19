import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST() {
  try {
    console.log('🎬 Creating movie records...');

    // Create the Quantum Nexus movie that matches the booking page
    const movie = await prisma.movie.upsert({
      where: { id: 'quantum-nexus' },
      create: {
        id: 'quantum-nexus',
        title: 'Quantum Nexus',
        description:
          'A mind-bending sci-fi thriller that explores the boundaries of reality and consciousness.',
        duration: 148, // 2h 28m
        rating: 'PG-13',
        releaseDate: new Date('2024-03-01'),
        posterUrl:
          'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=200&h=300&fit=crop',
        trailerUrl: 'https://example.com/trailer',
        // cast: ['Leonardo DiCaprio', 'Marion Cotillard'], // Temporarily removed due to schema mismatch
        director: 'Christopher Nolan',
        genre: ['Sci-Fi', 'Thriller'],
        isActive: true,
      },
      update: {},
    });

    // Get or create cinema and theater
    const cinema = await prisma.cinema.upsert({
      where: { id: 'cinema-1' },
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
      update: {},
    });

    const theater = await prisma.theater.upsert({
      where: { id: 'theater-1' },
      create: {
        id: 'theater-1',
        name: 'Theater 1',
        cinemaId: cinema.id,
        totalSeats: 120,
        screenType: 'STANDARD',
        isActive: true,
      },
      update: {},
    });

    // Create showtimes that match the booking page format
    const showtimes = [
      { time: '14:30', date: '2024-03-15' },
      { time: '17:00', date: '2024-03-15' },
      { time: '20:30', date: '2024-03-15' }, // This matches the default 8:30 PM
      { time: '14:30', date: '2024-03-16' },
      { time: '17:00', date: '2024-03-16' },
      { time: '20:30', date: '2024-03-16' },
    ];

    for (const showtime of showtimes) {
      const startTime = new Date(`${showtime.date}T${showtime.time}:00`);
      const endTime = new Date(startTime.getTime() + movie.duration * 60000);

      // Create showtime with format that matches booking page: movieId-time-date
      const showtimeId = `${movie.id}-${showtime.time.replace(':', '')}-${showtime.date}`;

      await prisma.showtime.upsert({
        where: { id: showtimeId },
        create: {
          id: showtimeId,
          movieId: movie.id,
          theaterId: theater.id,
          startTime,
          endTime,
          basePrice: 12.5,
          isActive: true,
        },
        update: {},
      });
    }

    return NextResponse.json({
      message: 'Movie and showtimes created successfully',
      movie: movie.title,
      showtimes: showtimes.length,
    });
  } catch (error) {
    console.error('❌ Movie seed failed:', error);
    return NextResponse.json({ error: 'Failed to seed movie data' }, { status: 500 });
  }
}
