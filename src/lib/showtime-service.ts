import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface ShowtimeData {
  id: string;
  startTime: Date;
  endTime: Date;
  basePrice: number;
  theater: {
    id: string;
    name: string;
    screenType: string;
    totalSeats: number;
  };
  availableSeats: number;
}

export interface MovieWithShowtimes {
  id: string;
  title: string;
  description: string;
  duration: string;
  genre: string;
  rating: string;
  director: string;
  cast: string[];
  posterUrl: string;
  avgRating: number;
  showtimes: ShowtimeData[];
}

export async function getMoviesWithShowtimes(date?: Date) {
  try {
    const targetDate = date || new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const movies = await prisma.movie.findMany({
      where: {
        isActive: true,
        showtimes: {
          some: {
            startTime: {
              gte: startOfDay,
              lte: endOfDay,
            },
            isActive: true,
          },
        },
      },
      include: {
        reviews: {
          select: {
            rating: true,
          },
        },
        showtimes: {
          where: {
            startTime: {
              gte: startOfDay,
              lte: endOfDay,
            },
            isActive: true,
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
            bookings: {
              where: {
                status: {
                  in: ['CONFIRMED', 'PENDING'],
                },
              },
              include: {
                bookingSeats: true,
              },
            },
          },
          orderBy: {
            startTime: 'asc',
          },
        },
      },
      orderBy: {
        title: 'asc',
      },
    });

    return movies.map((movie) => {
      // Calculate average rating
      const avgRating =
        movie.reviews.length > 0
          ? movie.reviews.reduce((sum, review) => sum + review.rating, 0) / movie.reviews.length
          : 4.2;

      // Process showtimes
      const showtimes: ShowtimeData[] = movie.showtimes.map((showtime) => {
        // Calculate available seats
        const bookedSeats = showtime.bookings.reduce(
          (total, booking) => total + booking.bookingSeats.length,
          0
        );
        const availableSeats = showtime.theater.totalSeats - bookedSeats;

        return {
          id: showtime.id,
          startTime: showtime.startTime,
          endTime: showtime.endTime,
          basePrice: Number(showtime.basePrice),
          theater: showtime.theater,
          availableSeats,
        };
      });

      return {
        id: movie.id,
        title: movie.title,
        description: movie.description || '',
        duration: `${Math.floor(movie.duration / 60)}h ${movie.duration % 60}m`,
        genre: Array.isArray(movie.genre) ? movie.genre.join(', ') : movie.genre || 'Drama',
        rating: movie.rating || 'PG-13',
        director: movie.director || 'Unknown Director',
        cast: Array.isArray(movie.cast) ? movie.cast : [],
        posterUrl:
          movie.posterUrl ||
          'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=600&fit=crop',
        avgRating: Number(avgRating.toFixed(1)),
        showtimes,
      };
    });
  } catch (error) {
    console.error('Error fetching movies with showtimes:', error);
    return [];
  }
}

export async function getShowtimeById(showtimeId: string) {
  try {
    const showtime = await prisma.showtime.findUnique({
      where: { id: showtimeId },
      include: {
        movie: true,
        theater: {
          include: {
            cinema: true,
            seats: {
              where: { isActive: true },
              orderBy: [{ row: 'asc' }, { number: 'asc' }],
            },
          },
        },
        bookings: {
          where: {
            status: {
              in: ['CONFIRMED', 'PENDING'],
            },
          },
          include: {
            bookingSeats: {
              include: {
                seat: true,
              },
            },
          },
        },
      },
    });

    if (!showtime) {
      return null;
    }

    // Get booked seat IDs
    const bookedSeatIds = new Set(
      showtime.bookings.flatMap((booking) => booking.bookingSeats.map((bs) => bs.seatId))
    );

    // Mark seats as available/booked
    const seats = showtime.theater.seats.map((seat) => ({
      ...seat,
      isBooked: bookedSeatIds.has(seat.id),
    }));

    return {
      ...showtime,
      theater: {
        ...showtime.theater,
        seats,
      },
    };
  } catch (error) {
    console.error('Error fetching showtime:', error);
    return null;
  }
}

export async function getAvailableDates(daysAhead = 7) {
  try {
    const today = new Date();
    const dates = [];

    for (let i = 0; i < daysAhead; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);

      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const showtimeCount = await prisma.showtime.count({
        where: {
          startTime: {
            gte: startOfDay,
            lte: endOfDay,
          },
          isActive: true,
        },
      });

      if (showtimeCount > 0) {
        dates.push({
          date,
          showtimeCount,
        });
      }
    }

    return dates;
  } catch (error) {
    console.error('Error fetching available dates:', error);
    return [];
  }
}
