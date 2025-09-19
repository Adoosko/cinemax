import { Prisma } from '@prisma/client';

// Complete booking data with all relations
export type BookingWithDetails = Prisma.BookingGetPayload<{
  include: {
    user: true;
    showtime: {
      include: {
        movie: true;
        theater: {
          include: {
            cinema: true;
          };
        };
      };
    };
    bookingSeats: {
      include: {
        seat: true;
      };
    };
    payment: true;
  };
}>;

// Showtime with movie and theater details
export type ShowtimeWithDetails = Prisma.ShowtimeGetPayload<{
  include: {
    movie: true;
    theater: {
      include: {
        cinema: true;
      };
    };
    _count: {
      select: {
        bookings: true;
      };
    };
  };
}>;

// Seat availability data
export type SeatWithBooking = Prisma.SeatGetPayload<{
  include: {
    bookingSeats: {
      include: {
        booking: {
          select: {
            status: true;
            showtimeId: true;
          };
        };
      };
    };
    tempReservations: true;
  };
}>;

export type MovieWithShowtimes = Prisma.MovieGetPayload<{
  include: {
    showtimes: {
      include: {
        theater: {
          include: {
            cinema: true;
          };
        };
      };
    };
  };
}>;
