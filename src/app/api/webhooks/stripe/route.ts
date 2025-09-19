import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { PrismaClient } from '@prisma/client';
import { generateQRCode, sendBookingConfirmation } from '@/lib/booking-utils';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  console.log('Webhook received at:', new Date().toISOString());

  const body = await request.text();
  const signature = request.headers.get('stripe-signature')!;

  if (!signature) {
    console.error('No Stripe signature found in the request');
    return NextResponse.json({ error: 'No signature provided' }, { status: 400 });
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error('STRIPE_WEBHOOK_SECRET is not configured');
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  try {
    console.log('Constructing Stripe event with signature:', signature.substring(0, 10) + '...');
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    console.log('Webhook event received:', event.type);

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      console.log('Payment intent succeeded:', paymentIntent.id);

      // First find the booking by payment intent ID
      const existingBooking = await prisma.booking.findFirst({
        where: { paymentIntentId: paymentIntent.id },
      });

      if (!existingBooking) {
        console.error('No booking found with payment intent ID:', paymentIntent.id);
        return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
      }

      console.log('Found booking:', existingBooking.id);

      // Update booking status
      const booking = await prisma.booking.update({
        where: { id: existingBooking.id },
        data: {
          status: 'CONFIRMED',
          expiresAt: null, // Remove expiration for confirmed booking
        },
        include: {
          user: true,
          showtime: {
            include: {
              movie: true,
              theater: {
                include: {
                  cinema: true,
                },
              },
            },
          },
          bookingSeats: {
            include: {
              seat: true,
            },
          },
        },
      });

      // Create payment record
      console.log('Creating payment record for booking:', booking.id);
      const payment = await prisma.payment.create({
        data: {
          bookingId: booking.id,
          stripePaymentId: paymentIntent.id,
          amount: booking.totalAmount,
          currency: paymentIntent.currency.toUpperCase(),
          status: 'SUCCEEDED',
          paymentMethod: paymentIntent.payment_method_types[0] || 'card',
        },
      });
      console.log('Payment record created:', payment.id);

      // Generate QR code
      console.log('Generating QR code for booking:', booking.id);
      const qrCode = await generateQRCode(booking.id);
      console.log('QR code generated successfully');

      // Update booking with QR code
      console.log('Updating booking with QR code');
      await prisma.booking.update({
        where: { id: booking.id },
        data: { qrCode },
      });
      console.log('Booking updated with QR code');

      // Fetch complete booking data with seats before sending email
      console.log('Fetching complete booking data with seats for email...');
      const completeBooking = await prisma.booking.findUnique({
        where: { id: booking.id },
        include: {
          user: true,
          showtime: {
            include: {
              movie: true,
              theater: {
                include: {
                  cinema: true,
                },
              },
            },
          },
          bookingSeats: {
            include: {
              seat: true,
            },
          },
        },
      });

      if (!completeBooking) {
        console.error('Failed to fetch complete booking data for email');
        return NextResponse.json(
          { error: 'Failed to fetch complete booking data' },
          { status: 500 }
        );
      }

      console.log(`Found ${completeBooking.bookingSeats.length} seats for booking ${booking.id}`);

      // Send confirmation email
      console.log('Sending confirmation email to:', completeBooking.user?.email);
      await sendBookingConfirmation(completeBooking, qrCode);
      console.log('Email sending process initiated');

      // Clean up temporary reservations for this booking
      // Note: Temporarily disabled until Prisma client is properly generated
      // await prisma.tempReservation.deleteMany({
      //   where: {
      //     seatId: {
      //       in: booking.bookingSeats.map((bs: any) => bs.seatId)
      //     },
      //     showtimeId: booking.showtimeId
      //   }
      // })
    }

    console.log('Webhook processed successfully');
    return NextResponse.json({ received: true, success: true });
  } catch (error) {
    console.error('Webhook error:', error);

    // Enhanced error logging
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }

    // Check if it's a Stripe error
    if (error && typeof error === 'object' && 'type' in error) {
      console.error('Stripe error type:', (error as any).type);

      if ((error as any).type === 'StripeSignatureVerificationError') {
        return NextResponse.json(
          { error: 'Invalid signature', details: (error as any).message },
          { status: 401 }
        );
      }
    }

    return NextResponse.json(
      {
        error: 'Webhook handler failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 400 }
    );
  }
}
