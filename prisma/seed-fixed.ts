import { PrismaClient, Decimal } from '@prisma/client';

const prisma = new PrismaClient();

async function createCinemaAndTheaters() {
  console.log('🌱 Starting database seed...');

  // Create Cinema
  const cinema = await prisma.cinema.upsert({
    where: { id: 'cinema-1' },
    create: {
      id: 'cinema-1',
      name: 'CinemaX Downtown',
      address: '123 Main Street, Downtown',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      phone: '+1 (555) 123-4567',
      email: 'info@cinemax-downtown.com',
      isActive: true,
    },
    update: {},
  });

  console.log('✅ Cinema created/updated');

  // Create Theaters
  const theaters = [
    {
      id: 'theater-1',
      name: 'Theater 1',
      totalSeats: 120,
      screenType: 'STANDARD' as const,
    },
    {
      id: 'theater-2',
      name: 'Theater 2 - IMAX',
      totalSeats: 200,
      screenType: 'IMAX' as const,
    },
    {
      id: 'theater-3',
      name: 'Theater 3 - Premium',
      totalSeats: 80,
      screenType: 'PREMIUM' as const,
    },
  ];

  for (const theaterData of theaters) {
    const theater = await prisma.theater.upsert({
      where: { id: theaterData.id },
      create: {
        ...theaterData,
        cinema: {
          connect: { id: cinema.id },
        },
        isActive: true,
      },
      update: {},
    });

    console.log(`✅ Theater ${theaterData.name} created/updated`);

    // Generate seats for this theater
    await generateSeats(theater.id, theaterData.screenType, theaterData.totalSeats);
  }
}

async function generateSeats(theaterId: string, screenType: string, totalSeats: number) {
  console.log(`🪑 Generating seats for ${theaterId}...`);

  // Delete existing seats first
  await prisma.seat.deleteMany({
    where: { theaterId },
  });

  const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
  const seatsPerRow = Math.ceil(totalSeats / rows.length);

  for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
    const row = rows[rowIndex];
    const seatsInRow =
      rowIndex < rows.length - 1 ? seatsPerRow : totalSeats - rowIndex * seatsPerRow;

    if (seatsInRow <= 0) break;

    for (let seatNumber = 1; seatNumber <= seatsInRow; seatNumber++) {
      let seatType = 'STANDARD';

      // Premium seats (middle rows, center seats)
      if (
        ['D', 'E', 'F', 'G'].includes(row) &&
        seatNumber >= Math.floor(seatsInRow * 0.25) &&
        seatNumber <= Math.floor(seatsInRow * 0.75)
      ) {
        seatType = 'PREMIUM';
      }
      // Wheelchair accessible (back rows, aisle seats)
      else if (['A', 'B'].includes(row) && (seatNumber <= 2 || seatNumber >= seatsInRow - 1)) {
        seatType = 'WHEELCHAIR';
      }
      // VIP seats for IMAX theaters
      else if (
        screenType === 'IMAX' &&
        ['I', 'J'].includes(row) &&
        seatNumber >= Math.floor(seatsInRow * 0.3) &&
        seatNumber <= Math.floor(seatsInRow * 0.7)
      ) {
        seatType = 'VIP';
      }

      await prisma.seat.create({
        data: {
          theater: {
            connect: { id: theaterId },
          },
          row,
          number: seatNumber,
          seatType: seatType as any,
          isActive: true,
        },
      });
    }
  }

  console.log(`✅ Generated seats for ${theaterId}`);
}

async function createShowtimes() {
  console.log('🎬 Creating showtimes...');

  // Get the first theater for creating showtimes
  const theater = await prisma.theater.findFirst();
  if (!theater) {
    console.log('❌ No theater found for creating showtimes');
    return;
  }

  // Create a sample movie if none exists
  const movie = await prisma.movie.upsert({
    where: { id: 'quantum-nexus' },
    create: {
      id: 'quantum-nexus',
      title: 'Quantum Nexus',
      description: 'A mind-bending sci-fi thriller that explores the boundaries of reality.',
      duration: 148, // 2h 28m
      rating: 'PG-13',
      releaseDate: new Date('2024-03-01'),
      posterUrl:
        'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=200&h=300&fit=crop',
      trailerUrl: 'https://example.com/trailer',
      genre: 'Sci-Fi',
      director: 'Christopher Nolan',
      isActive: true,
    },
    update: {},
  });

  // Create showtimes for the next few days
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
    const endTime = new Date(startTime.getTime() + movie.duration * 60000); // Add duration in minutes

    // Create showtime with predictable ID format matching booking page
    const showtimeId = `${movie.id}-${showtime.time.replace(':', '')}-${showtime.date}`;

    await prisma.showtime.upsert({
      where: { id: showtimeId },
      create: {
        id: showtimeId,
        movie: {
          connect: { id: movie.id },
        },
        theater: {
          connect: { id: theater.id },
        },
        startTime,
        endTime,
        basePrice: new Decimal('12.50'),
        isActive: true,
      },
      update: {},
    });
  }

  console.log(`✅ Created ${showtimes.length} showtimes`);
}

async function main() {
  await createCinemaAndTheaters();
  await createShowtimes();
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
