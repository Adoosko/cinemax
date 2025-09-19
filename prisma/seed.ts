import { PrismaClient, Decimal } from '@prisma/client';

const prisma = new PrismaClient();

async function createCinemaAndTheaters() {
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
    {
      id: 'theater-1',
      name: 'Theater 1',
      totalSeats: 120,
      screenType: 'STANDARD' as const,
    },
    {
      id: 'theater-2',
      name: 'IMAX Theater',
      totalSeats: 200,
      screenType: 'IMAX' as const,
    },
    {
      id: 'theater-3',
      name: 'Dolby Atmos Theater',
      totalSeats: 150,
      screenType: 'DOLBY_ATMOS' as const,
    },
  ];

  for (const theaterData of theaters) {
    const theater = await prisma.theater.upsert({
      where: { id: theaterData.id },
      update: {},
      create: {
        ...theaterData,
        cinemaId: cinema.id,
        isActive: true,
      },
    });
    console.log('✅ Created theater:', theater.name);

    // Generate seats for each theater
    await generateSeatsForTheater(theater.id, theaterData.screenType);
  }

  console.log('🎉 Database seeded successfully!');
}

async function generateSeatsForTheater(theaterId: string, screenType: string) {
  const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

  // Different layouts based on screen type
  const getSeatsInRow = (row: string, screenType: string) => {
    if (screenType === 'IMAX') {
      return ['A', 'B'].includes(row) ? 12 : ['I', 'J'].includes(row) ? 16 : 18;
    }
    if (screenType === 'DOLBY_ATMOS') {
      return ['A', 'B'].includes(row) ? 10 : ['I', 'J'].includes(row) ? 14 : 16;
    }
    // Standard theater
    return ['A', 'B'].includes(row) ? 8 : ['I', 'J'].includes(row) ? 10 : 12;
  };

  for (const row of rows) {
    const seatsInRow = getSeatsInRow(row, screenType);

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
      // VIP seats (IMAX theaters only, last two rows center)
      else if (
        screenType === 'IMAX' &&
        ['I', 'J'].includes(row) &&
        seatNumber >= Math.floor(seatsInRow * 0.3) &&
        seatNumber <= Math.floor(seatsInRow * 0.7)
      ) {
        seatType = 'VIP';
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

async function createShowtimesForAllMovies() {
  console.log('🎬 Creating showtimes for all movies...');

  // Get all theaters and movies
  const theaters = await prisma.theater.findMany({ where: { isActive: true } });
  const movies = await prisma.movie.findMany({ where: { isActive: true } });

  if (theaters.length === 0) {
    console.log('❌ No theaters found for creating showtimes');
    return;
  }

  if (movies.length === 0) {
    console.log('❌ No movies found for creating showtimes');
    return;
  }

  // Create showtimes for the next 7 days
  const today = new Date();
  const showtimes = [];

  // Time slots for different theater types
  const timeSlots = {
    STANDARD: ['10:00', '13:30', '17:00', '20:30'],
    IMAX: ['11:00', '14:30', '18:00', '21:30'],
    DOLBY_ATMOS: ['12:00', '15:30', '19:00', '22:00'],
  };

  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const date = new Date(today);
    date.setDate(today.getDate() + dayOffset);
    date.setHours(0, 0, 0, 0);

    for (const movie of movies) {
      for (const theater of theaters) {
        const slots = timeSlots[theater.screenType as keyof typeof timeSlots] || timeSlots.STANDARD;

        for (const timeSlot of slots) {
          const [hours, minutes] = timeSlot.split(':').map(Number);
          const startTime = new Date(date);
          startTime.setHours(hours, minutes, 0, 0);

          // Calculate end time (start time + movie duration + 30 min buffer)
          const endTime = new Date(startTime);
          endTime.setMinutes(startTime.getMinutes() + movie.duration + 30);

          // Calculate base price based on theater type
          let basePrice = 14.0;
          if (theater.screenType === 'IMAX') basePrice = 22.0;
          else if (theater.screenType === 'DOLBY_ATMOS') basePrice = 28.0;
          else if (theater.screenType === 'STANDARD') basePrice = 16.0;

          // Weekend surcharge
          if (startTime.getDay() === 0 || startTime.getDay() === 6) {
            basePrice += 2.0;
          }

          const showtimeId = `${movie.id}-${theater.id}-${startTime.getTime()}`;

          try {
            await prisma.showtime.upsert({
              where: { id: showtimeId },
              create: {
                id: showtimeId,
                movieId: movie.id,
                theaterId: theater.id,
                startTime,
                endTime,
                basePrice: new Decimal(basePrice.toString()),
                isActive: true,
              },
              update: {},
            });
            showtimes.push(showtimeId);
          } catch (error) {
            // Skip if showtime already exists with same theater and time
            console.log(`Skipping duplicate showtime: ${showtimeId}`);
          }
        }
      }
    }
  }

  console.log(`✅ Created ${showtimes.length} showtimes`);
}

// Import the movie seeder
import { seedMovies } from './seed-movies';

async function main() {
  // Step 1: Create cinema and theaters with seats
  await createCinemaAndTheaters();

  // Step 2: Seed movies
  await seedMovies();

  // Step 3: Create showtimes linking movies to theaters
  await createShowtimesForAllMovies();
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
