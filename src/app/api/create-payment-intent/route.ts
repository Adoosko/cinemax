import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { PrismaClient } from '@prisma/client';

// Import Decimal from prisma/client/runtime
const { Decimal } = require('@prisma/client/runtime/library');

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { showtimeId, selectedSeats, tickets, userEmail, userName, totalAmount } =
      await request.json();

    // Create the movie record if it doesn't exist
    const movieId = showtimeId.split('-')[0];
    await prisma.movie.upsert({
      where: { id: movieId },
      create: {
        id: movieId,
        title: 'Quantum Nexus',
        description: 'A mind-bending sci-fi thriller',
        duration: 148,
        rating: 'PG-13',
        releaseDate: new Date('2024-03-01'),
        posterUrl:
          'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=200&h=300&fit=crop',
        genre: ['Sci-Fi', 'Thriller'] as string[],
        director: 'Christopher Nolan',
        isActive: true,
      },
      update: {},
    });

    // Create showtime record if it doesn't exist
    await prisma.showtime.upsert({
      where: { id: showtimeId },
      create: {
        id: showtimeId,
        movieId,
        theaterId: 'theater-1',
        startTime: new Date(),
        endTime: new Date(Date.now() + 148 * 60000),
        basePrice: 12.5,
        isActive: true,
      },
      update: {},
    });

    console.log('Created/verified movie and showtime for:', showtimeId);

    // Create or get user
    const user = await prisma.user.upsert({
      where: { email: userEmail },
      create: {
        email: userEmail,
        name: userName,
        firstName: userName?.split(' ')[0],
        lastName: userName?.split(' ').slice(1).join(' '),
      },
      update: {
        name: userName,
      },
    });

    // Generate booking number
    const bookingNumber = `CMX-${new Date().getFullYear()}-${Math.random().toString().substr(2, 6)}`;

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(totalAmount * 100), // Convert to cents
      currency: 'usd',
      payment_method_types: ['card'],
      metadata: {
        showtimeId,
        userId: user.id,
        selectedSeats: JSON.stringify(selectedSeats),
        tickets: JSON.stringify(tickets),
        bookingNumber,
      },
    });

    // Create pending booking
    const booking = await prisma.booking.create({
      data: {
        userId: user.id,
        showtimeId,
        bookingNumber,
        totalAmount: totalAmount,
        bookingFee: 2.5, // Standard booking fee
        status: 'PENDING',
        paymentIntentId: paymentIntent.id,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      },
    });

    // Create seats for booking
    console.log('Creating booking seats for booking:', booking.id);
    try {
      // Create theater seats if they don't exist
      for (const seat of selectedSeats) {
        // First, ensure the seat exists in the database
        const seatRecord = await prisma.seat.upsert({
          where: {
            // Use a unique constraint that makes sense for your schema
            // This is an example - adjust according to your actual schema
            theaterId_row_number: {
              theaterId: 'theater-1',
              row: seat.row,
              number: parseInt(seat.number),
            },
          },
          create: {
            theaterId: 'theater-1',
            row: seat.row,
            number: parseInt(seat.number),
            seatType: seat.type || 'STANDARD',
          },
          update: {},
        });

        console.log(`Created/verified seat: ${seatRecord.row}${seatRecord.number}`);

        // Now create the booking seat record
        const bookingSeat = await prisma.bookingSeat.create({
          data: {
            bookingId: booking.id,
            seatId: seatRecord.id,
            price: new Decimal(seat.price || 12.5),
          },
        });

        console.log(
          `Created booking seat: ${bookingSeat.id} for seat ${seatRecord.row}${seatRecord.number}`
        );
      }

      console.log(`Successfully created ${selectedSeats.length} booking seats`);
    } catch (error) {
      console.error('Error creating booking seats:', error);
      // Continue with the process even if seat creation fails
      // We don't want to block the payment intent creation
    }

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      bookingId: booking.id,
      bookingNumber,
    });
  } catch (error) {
    console.error('Payment intent creation failed:', error);
    return NextResponse.json({ error: 'Failed to create payment intent' }, { status: 500 });
  }
}
