import QRCode from 'qrcode';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function generateQRCode(bookingId: string): Promise<string> {
  console.log('Generating QR code for booking ID:', bookingId);

  try {
    const qrData = {
      bookingId,
      timestamp: Date.now(),
      url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/ticket/${bookingId}`,
    };

    console.log('QR data:', JSON.stringify(qrData));

    // Generate QR code with higher quality settings for better email display
    const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrData), {
      width: 500, // Larger size for better quality
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'H',
      scale: 8, // Higher scale for better resolution
    });

    console.log('QR code generated successfully, data URL length:', qrCodeDataURL.length);

    // Log the first 100 characters of the data URL for debugging
    console.log('QR code data URL preview:', qrCodeDataURL.substring(0, 100) + '...');

    return qrCodeDataURL;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw error;
  }
}

export async function sendBookingConfirmation(booking: any, qrCode: string) {
  console.log('Starting email confirmation process...');
  console.log(
    'Booking data:',
    JSON.stringify({
      id: booking.id,
      bookingNumber: booking.bookingNumber,
      userEmail: booking.user?.email,
      movieTitle: booking.showtime?.movie?.title,
      showtime: booking.showtime?.startTime,
      seats: booking.bookingSeats?.length,
    })
  );

  // Log the full booking seats data to debug
  console.log('Booking seats data:', JSON.stringify(booking.bookingSeats));

  if (booking.bookingSeats?.length === 0) {
    console.log('No booking seats found, checking if we need to fetch them');
    // If bookingSeats array is empty, we might need to fetch them separately
    try {
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();

      const updatedBooking = await prisma.booking.findUnique({
        where: { id: booking.id },
        include: {
          bookingSeats: {
            include: {
              seat: true,
            },
          },
        },
      });

      if (updatedBooking?.bookingSeats?.length > 0) {
        console.log('Found booking seats after fetching:', updatedBooking.bookingSeats.length);
        booking.bookingSeats = updatedBooking.bookingSeats;
      }
    } catch (error) {
      console.error('Error fetching booking seats:', error);
    }
  }

  if (!booking.user?.email) {
    console.error('Cannot send email: No user email found in booking');
    return;
  }

  if (!process.env.RESEND_API_KEY) {
    console.error('Cannot send email: RESEND_API_KEY is not configured');
    return;
  }

  const movie = booking.showtime?.movie;
  const theater = booking.showtime?.theater;
  const cinema = theater?.cinema;
  const showDateTime = new Date(booking.showtime?.startTime).toLocaleString();

  // Format seats nicely
  let seats = 'Unknown';
  if (
    booking.bookingSeats &&
    Array.isArray(booking.bookingSeats) &&
    booking.bookingSeats.length > 0
  ) {
    try {
      seats = booking.bookingSeats
        .map((bs: any) => `${bs.seat?.row || ''}${bs.seat?.number || ''}`)
        .filter((seat: string) => seat.trim() !== '')
        .join(', ');

      if (!seats || seats.trim() === '') {
        seats = 'Unknown';
      }

      console.log('Formatted seats:', seats);
    } catch (error) {
      console.error('Error formatting seats:', error);
      seats = 'Unknown';
    }
  }

  try {
    console.log(`Attempting to send email to: ${booking.user.email}`);
    const emailResult = await resend.emails.send({
      from: 'CinemaX <booking@resend.dev>',
      to: booking.user.email,
      subject: `Booking Confirmed - ${movie?.title || 'Your Movie'}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #000; color: #fff; padding: 40px 20px;">
          <!-- Header -->
          <div style="text-align: center; margin-bottom: 40px;">
            <h1 style="color: #E50914; font-size: 32px; margin: 0; font-weight: bold;">CinemaX</h1>
            <p style="color: #999; margin: 10px 0 0 0;">Your Premium Cinema Experience</p>
          </div>

          <!-- Confirmation -->
          <div style="text-align: center; margin-bottom: 40px;">
            <div style="width: 60px; height: 60px; background: #fff; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
              <span style="color: #000; font-size: 24px;">✓</span>
            </div>
            <h2 style="color: #fff; margin: 0 0 10px 0;">Booking Confirmed!</h2>
            <p style="color: #999; margin: 0;">Booking #${booking.bookingNumber}</p>
          </div>

          <!-- Movie Info -->
          <div style="background: #111; border: 1px solid #333; padding: 30px; margin-bottom: 30px;">
            <h3 style="color: #E50914; margin: 0 0 20px 0; font-size: 24px;">${movie.title}</h3>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
              <div>
                <p style="color: #999; margin: 0; font-size: 14px;">DATE & TIME</p>
                <p style="color: #fff; margin: 5px 0 0 0; font-weight: bold;">${showDateTime}</p>
              </div>
              <div>
                <p style="color: #999; margin: 0; font-size: 14px;">CINEMA</p>
                <p style="color: #fff; margin: 5px 0 0 0; font-weight: bold;">${cinema.name}</p>
              </div>
              <div>
                <p style="color: #999; margin: 0; font-size: 14px;">THEATER</p>
                <p style="color: #fff; margin: 5px 0 0 0; font-weight: bold;">${theater.name}</p>
              </div>
              <div>
                <p style="color: #999; margin: 0; font-size: 14px;">SEATS</p>
                <p style="color: #fff; margin: 5px 0 0 0; font-weight: bold;">${seats !== 'Unknown' ? seats : 'Your seats are reserved'}</p>
                ${seats === 'Unknown' ? `<p style="color: #999; font-size: 12px;">Seat details will be available at the theater</p>` : ''}
              </div>
            </div>
          </div>

          <!-- QR Code -->
          <div style="text-align: center; margin-bottom: 30px; background: #fff; padding: 30px;">
            <h3 style="color: #000; margin: 0 0 20px 0;">Your Digital Ticket</h3>
            <img src="${qrCode}" alt="QR Code" style="display: block; width: 300px; height: auto; margin: 0 auto; border: 1px solid #eee;">
            <p style="color: #666; margin: 20px 0 0 0; font-size: 14px;">
              Show this QR code at the theater entrance
            </p>
            <p style="color: #999; font-size: 12px; margin-top: 8px;">
              If the QR code is not visible, please visit: ${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/ticket/${booking.id}
            </p>
          </div>

          <!-- Total -->
          <div style="background: #E50914; padding: 20px; text-align: center; margin-bottom: 30px;">
            <p style="color: #fff; margin: 0; font-size: 18px; font-weight: bold;">
              Total Paid: $${booking.totalAmount.toString()}
            </p>
          </div>

          <!-- Footer -->
          <div style="text-align: center; color: #999; font-size: 14px;">
            <p>Thank you for choosing CinemaX</p>
            <p>Need help? Contact us at support@cinemafx.com</p>
          </div>
        </div>
      `,
    });
  } catch (error) {
    console.error('Failed to send booking confirmation:', error);
    // Log detailed error information
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }

    // Check if it's a Resend API error
    if (error && typeof error === 'object' && 'statusCode' in error) {
      console.error('API Status Code:', (error as any).statusCode);
      console.error('API Error details:', JSON.stringify(error));
    }
  }

  // For development/testing, log a message to indicate completion
  console.log('Email sending process completed');
}
