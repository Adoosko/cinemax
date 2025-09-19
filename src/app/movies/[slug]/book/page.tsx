'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TicketSelector } from '@/components/booking/ticket-selector';
import { DateSelector } from '@/components/booking/date-selector';
import { TheaterCard } from '@/components/booking/theater-card';
import { SeatMap } from '@/components/booking/seat-map';
import { BookingSidebar } from '@/components/booking/booking-sidebar';
import { ProgressBar } from '@/components/booking/progress-bar';
import { StatusBar } from '@/components/booking/status-bar';
import { useParams, useSearchParams } from 'next/navigation';
import { useSeatsWebSocket } from '@/lib/hooks/use-seat-websocket';
import { calculatePricing, type PricingCalculation } from '@/lib/pricing';
import {
  ArrowLeft,
  Check,
  Star,
  Clock,
  MapPin,
  Film,
  Sparkles,
  Calendar,
  Users,
  AlertTriangle,
  Loader,
} from 'lucide-react';
import Link from 'next/link';
import { PaymentFormWrapper } from '@/components/booking/payment-form';

type SeatStatus = 'available' | 'selected' | 'taken' | 'reserved' | 'my-selection';

interface Seat {
  id: string;
  row: string;
  number: number;
  status: SeatStatus;
  price: number;
  type: 'standard' | 'premium' | 'wheelchair';
  reservedBy?: string;
  reservedAt?: number;
}

interface Showtime {
  id: string;
  theaterId: string;
  theaterName: string;
  screenType: string;
  startTime: string;
  endTime: string;
  availableSeats: number;
  totalSeats: number;
  date: string;
}

interface Movie {
  id: string;
  slug: string;
  title: string;
  duration: string;
  rating: number;
  posterUrl: string;
}

export default function SeatBookingPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [sessionTimer, setSessionTimer] = useState(600);
  const [showTimer, setShowTimer] = useState(false);
  const [pricing, setPricing] = useState<PricingCalculation | null>(null);
  const [movie, setMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New state for showtime selection
  const [showtimes, setShowtimes] = useState<Record<string, Showtime[]>>({});
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedShowtime, setSelectedShowtime] = useState<Showtime | null>(null);

  // Get URL params if provided (direct link to specific showtime)
  const urlShowtimeId = searchParams.get('showtime');
  const urlDate = searchParams.get('date');

  const slug = params.slug as string;
  const userId = 'user-' + Math.random().toString(36).substr(2, 9);

  const { isConnected, onlineUsers, connectionStatus, reserveSeat, releaseSeat, onSeatUpdate } =
    useSeatsWebSocket({
      showtimeId: selectedShowtime?.id || `${slug}-default`,
      userId,
    });

  // Initialize with URL params or first day
  useEffect(() => {
    if (urlDate) {
      setSelectedDate(urlDate);
    } else {
      const today = new Date().toISOString().split('T')[0];
      setSelectedDate(today);
    }
  }, [urlDate]);

  // Fetch movie data by slug
  useEffect(() => {
    const fetchMovie = async () => {
      try {
        const response = await fetch(`/api/movies/${slug}`);
        if (response.ok) {
          const movieData = await response.json();
          setMovie({
            id: movieData.id,
            slug: movieData.slug,
            title: movieData.title,
            duration: movieData.duration,
            rating: movieData.rating,
            posterUrl: movieData.posterUrl,
          });
        } else {
          setError('Movie not found');
        }
      } catch (error) {
        console.error('Failed to fetch movie:', error);
        setError('Failed to load movie');
      }
    };

    if (slug) {
      fetchMovie();
    }
  }, [slug]);

  // Fetch showtimes
  useEffect(() => {
    const fetchShowtimes = async () => {
      if (!movie) return;

      setLoading(true);
      try {
        const response = await fetch(`/api/movies/${movie.id}/showtimes`);
        const showtimesData = await response.json();

        // Group by date
        const grouped = showtimesData.reduce((acc: Record<string, Showtime[]>, showtime: any) => {
          const date = showtime.startTime.split('T')[0];
          if (!acc[date]) acc[date] = [];
          acc[date].push({
            id: showtime.id,
            theaterId: showtime.theaterId,
            theaterName: showtime.theater.name,
            screenType: showtime.theater.screenType,
            startTime: new Date(showtime.startTime).toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true,
            }),
            endTime: new Date(showtime.endTime).toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true,
            }),
            availableSeats: showtime.theater.totalSeats - (showtime._count?.bookings || 0),
            totalSeats: showtime.theater.totalSeats,
            date: date,
          });
          return acc;
        }, {});

        setShowtimes(grouped);

        // Auto-select showtime if URL params provided
        if (urlShowtimeId && urlDate) {
          const dateShowtimes = grouped[urlDate] || [];
          const showtime = dateShowtimes.find((s: Showtime) => s.id === urlShowtimeId);
          if (showtime) {
            setSelectedShowtime(showtime);
            setCurrentStep(2); // Skip to seat selection
          }
        }
      } catch (error) {
        console.error('Failed to fetch showtimes:', error);
        // Mock data fallback with unified pricing
        const mockShowtimes: Record<string, Showtime[]> = {};
        const generateMockDays = () => {
          const days = [];
          for (let i = 0; i < 7; i++) {
            const date = new Date();
            date.setDate(date.getDate() + i);
            days.push({
              date: date.toISOString().split('T')[0],
              dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
              dayNumber: date.getDate(),
              monthName: date.toLocaleDateString('en-US', { month: 'short' }),
            });
          }
          return days;
        };
        const days = generateMockDays();
        days.forEach((day: any) => {
          mockShowtimes[day.date] = [
            {
              id: `showtime-1-${day.date}`,
              theaterId: 'theater-1',
              theaterName: 'Theater 1',
              screenType: 'STANDARD',
              startTime: '10:00 AM',
              endTime: '12:28 PM',
              availableSeats: 95,
              totalSeats: 120,
              date: day.date,
            },
            {
              id: `showtime-2-${day.date}`,
              theaterId: 'theater-2',
              theaterName: 'Theater 2',
              screenType: 'STANDARD',
              startTime: '1:30 PM',
              endTime: '3:58 PM',
              availableSeats: 78,
              totalSeats: 120,
              date: day.date,
            },
            {
              id: `showtime-3-${day.date}`,
              theaterId: 'theater-3',
              theaterName: 'Theater 3',
              screenType: 'STANDARD',
              startTime: '5:00 PM',
              endTime: '7:28 PM',
              availableSeats: 45,
              totalSeats: 120,
              date: day.date,
            },
            {
              id: `showtime-4-${day.date}`,
              theaterId: 'theater-4',
              theaterName: 'Theater 4',
              screenType: 'STANDARD',
              startTime: '8:30 PM',
              endTime: '10:58 PM',
              availableSeats: 62,
              totalSeats: 120,
              date: day.date,
            },
          ];
        });
        setShowtimes(mockShowtimes);
      }
      setLoading(false);
    };

    fetchShowtimes();
  }, [movie]);

  const fetchSeats = async () => {
    if (!selectedShowtime) return;

    try {
      const response = await fetch(
        `/api/theaters/${selectedShowtime.theaterId}/seats?showtimeId=${selectedShowtime.id}`
      );
      const seatsData = await response.json();
      setSeats(seatsData);
    } catch (error) {
      console.error('Failed to fetch seats:', error);
      setSeats(generateFallbackSeats());
    }
  };

  const generateFallbackSeats = (): Seat[] => {
    const seats: Seat[] = [];
    const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

    rows.forEach((row, rowIndex) => {
      const seatsInRow = ['A', 'B'].includes(row) ? 8 : ['I', 'J'].includes(row) ? 10 : 12;
      const isWheelchairRow = row === 'A';
      const isPremiumRow = ['G', 'H', 'I', 'J'].includes(row);

      for (let seatNum = 1; seatNum <= seatsInRow; seatNum++) {
        const seatId = `${row}${seatNum}`;
        const isWheelchair = isWheelchairRow && [1, 2, 7, 8].includes(seatNum);
        const isTaken = Math.random() < 0.25;

        seats.push({
          id: seatId,
          row,
          number: seatNum,
          status: isTaken ? 'taken' : 'available',
          price: isPremiumRow ? 24.0 : isWheelchair ? 0.0 : 18.0,
          type: isWheelchair ? 'wheelchair' : isPremiumRow ? 'premium' : 'standard',
        });
      }
    });

    return seats;
  };

  useEffect(() => {
    if (selectedShowtime && currentStep >= 2) {
      fetchSeats();
    }
  }, [selectedShowtime, currentStep]);

  useEffect(() => {
    const cleanup = onSeatUpdate((update) => {
      setSeats((prev) =>
        prev.map((seat) =>
          seat.id === update.seatId
            ? {
                ...seat,
                status: update.isMySelection ? 'my-selection' : update.status,
                reservedBy: update.userId,
                reservedAt: update.timestamp,
              }
            : seat
        )
      );
    });

    return cleanup;
  }, [onSeatUpdate]);

  useEffect(() => {
    if (selectedSeats.length > 0 && !showTimer) {
      setShowTimer(true);
    }

    if (showTimer && sessionTimer > 0) {
      const timer = setInterval(() => {
        setSessionTimer((prev) => {
          if (prev <= 1) {
            selectedSeats.forEach((seatId) => releaseSeat(seatId));
            setSelectedSeats([]);
            setShowTimer(false);
            setCurrentStep(2);
            return 600;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [selectedSeats, showTimer, sessionTimer, releaseSeat]);

  const handleSeatSelect = (seatId: string) => {
    const seat = seats.find((s) => s.id === seatId);
    if (!seat || ['taken', 'reserved'].includes(seat.status)) return;

    if (seat.status === 'my-selection') {
      releaseSeat(seatId);
      setSeats((prev) => prev.map((s) => (s.id === seatId ? { ...s, status: 'available' } : s)));
      setSelectedSeats((prev) => prev.filter((id) => id !== seatId));
    } else {
      reserveSeat(seatId);
      setSeats((prev) =>
        prev.map((s) =>
          s.id === seatId ? { ...s, status: 'my-selection', reservedBy: userId } : s
        )
      );
      setSelectedSeats((prev) => [...prev, seatId]);
    }
  };

  const selectedSeatDetails = seats.filter((seat) => selectedSeats.includes(seat.id));

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const nextStep = () => {
    if (currentStep === 1 && !selectedShowtime) return;
    if (currentStep === 2 && selectedSeats.length === 0) return;
    if (currentStep === 3 && (!pricing || pricing.total === 0)) return;
    setCurrentStep((prev) => Math.min(prev + 1, 5));
  };

  const prevStep = () => {
    if (currentStep === 2 && selectedSeats.length > 0) {
      // Clear selected seats when going back from seat selection
      selectedSeats.forEach((seatId) => releaseSeat(seatId));
      setSelectedSeats([]);
      setShowTimer(false);
    }
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  if (error || !movie) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md"
        >
          <div className="w-20 h-20 bg-red-900/20 border border-red-500/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-4">{error || 'Movie not found'}</h1>
          <p className="text-white/60 mb-8">
            We couldn't load the movie details. Please try again or browse other movies.
          </p>
          <Link href="/movies">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-netflix-red hover:bg-red-700 text-white px-8 py-3 rounded-xl font-semibold transition-all shadow-lg flex items-center space-x-2 mx-auto"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Movies</span>
            </motion.button>
          </Link>
        </motion.div>
      </div>
    );
  }

  // Final confirmation step
  if (currentStep === 5) {
    return (
      <div className="min-h-screen bg-black">
        <div className="px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <div className="bg-black/50 backdrop-blur-xl border border-white/10 rounded-2xl p-12">
                {/* Success Animation */}
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                  className="w-24 h-24 bg-netflix-red rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg shadow-netflix-red/25"
                >
                  <Check className="w-12 h-12 text-white" />
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-4xl font-bold text-white mb-4"
                >
                  🎬 Booking Confirmed!
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="text-xl text-white/60 mb-8"
                >
                  Your movie experience is all set! Get ready for showtime.
                </motion.p>

                {/* Booking Details */}
                {pricing && selectedShowtime && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8 mb-8 max-w-2xl mx-auto"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="text-left">
                        <span className="text-white/60 text-sm font-medium">Movie</span>
                        <div className="text-white font-bold text-lg">{movie.title}</div>
                      </div>
                      <div className="text-left">
                        <span className="text-white/60 text-sm font-medium">Date & Time</span>
                        <div className="text-white font-bold">
                          {new Date(selectedDate).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                          })}{' '}
                          at {selectedShowtime.startTime}
                        </div>
                      </div>
                      <div className="text-left">
                        <span className="text-white/60 text-sm font-medium">Theater</span>
                        <div className="text-white font-bold">{selectedShowtime.theaterName}</div>
                      </div>
                      <div className="text-left">
                        <span className="text-white/60 text-sm font-medium">Seats</span>
                        <div className="text-white font-bold">{selectedSeats.join(', ')}</div>
                      </div>
                    </div>

                    <div className="border-t border-white/10 mt-6 pt-6">
                      <div className="flex justify-between items-center">
                        <span className="text-white/60 text-lg">Total Paid</span>
                        <span className="text-4xl font-bold text-netflix-red">
                          ${pricing.total.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Action Buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto"
                >
                  <Link href="/movies" className="flex-1">
                    <button className="w-full bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/40 text-white px-6 py-3 rounded-xl font-semibold transition-all">
                      Book More Movies
                    </button>
                  </Link>
                  <Link href="/bookings" className="flex-1">
                    <button className="w-full bg-netflix-red hover:bg-red-700 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-lg hover:shadow-netflix-red/25">
                      View My Tickets
                    </button>
                  </Link>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Status Bar */}
      <StatusBar
        connectionStatus={connectionStatus}
        onlineUsers={onlineUsers}
        showTimer={showTimer}
        sessionTimer={sessionTimer}
        formatTime={formatTime}
      />

      {/* Progress Bar */}
      <ProgressBar currentStep={currentStep} />

      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center space-x-4 mb-8"
          >
            {currentStep > 1 ? (
              <motion.button
                onClick={prevStep}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-3 text-white hover:text-netflix-red hover:bg-white/10 transition-all rounded-xl"
              >
                <ArrowLeft className="w-6 h-6" />
              </motion.button>
            ) : (
              <Link href={`/movies/${slug}`}>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-3 text-white hover:text-netflix-red hover:bg-white/10 transition-all rounded-xl"
                >
                  <ArrowLeft className="w-6 h-6" />
                </motion.button>
              </Link>
            )}

            <div>
              <h1 className="text-3xl font-bold text-white">
                {currentStep === 1 && 'Select Your Showtime'}
                {currentStep === 2 && 'Choose Perfect Seats'}
                {currentStep === 3 && 'Select Your Tickets'}
                {currentStep === 4 && 'Complete Your Booking'}
              </h1>
              <p className="text-white/60 mt-1">
                {currentStep === 1 && 'Pick your preferred date and showtime'}
                {currentStep === 2 && 'Select the best seats for your experience'}
                {currentStep === 3 && 'Choose ticket types and quantities'}
                {currentStep === 4 && 'Finalize your booking with secure payment'}
              </p>
            </div>
          </motion.div>

          {/* Movie Context Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-black/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 mb-8"
          >
            <div className="flex items-center space-x-6">
              <img
                src={movie.posterUrl}
                alt={movie.title}
                className="w-16 h-24 object-cover rounded-xl shadow-lg"
              />
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h2 className="text-2xl font-bold text-white">{movie.title}</h2>
                  <div className="flex items-center space-x-1 bg-netflix-red/20 px-2 py-1 rounded-full">
                    <Star className="w-4 h-4 text-netflix-red fill-current" />
                    <span className="text-netflix-red font-semibold text-sm">{movie.rating}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-6 text-white/60">
                  {selectedShowtime && (
                    <>
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4" />
                        <span className="font-medium">{selectedShowtime.startTime}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4" />
                        <span className="font-medium">{selectedShowtime.theaterName}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4" />
                        <span className="font-medium">
                          {selectedShowtime.availableSeats} available
                        </span>
                      </div>
                    </>
                  )}
                  <div className="flex items-center space-x-2">
                    <Film className="w-4 h-4" />
                    <span className="font-medium">{movie.duration}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
            {/* Main Content */}
            <div className="xl:col-span-3">
              {/* Step 1: Showtime Selection */}
              <AnimatePresence mode="wait">
                {currentStep === 1 && (
                  <motion.div
                    key="showtime"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-8"
                  >
                    <DateSelector selectedDate={selectedDate} onDateSelect={setSelectedDate} />

                    <div className="space-y-6">
                      <div className="flex items-center space-x-3">
                        <Sparkles className="w-6 h-6 text-netflix-red" />
                        <h3 className="text-2xl font-bold text-white">Available Showtimes</h3>
                      </div>

                      {loading ? (
                        <div className="text-center py-16">
                          <div className="w-12 h-12 border-4 border-netflix-red border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                          <div className="text-white/60 text-lg">Finding best showtimes...</div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {(showtimes[selectedDate] || []).map((showtime, index) => (
                            <TheaterCard
                              key={showtime.id}
                              showtime={showtime}
                              isSelected={selectedShowtime?.id === showtime.id}
                              onSelect={setSelectedShowtime}
                              index={index}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* Step 2: Seat Selection */}
                {currentStep === 2 && selectedShowtime && (
                  <motion.div
                    key="seats"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <SeatMap seats={seats} onSeatSelect={handleSeatSelect} />
                  </motion.div>
                )}

                {/* Step 3: Ticket Selection */}
                {currentStep === 3 && (
                  <motion.div
                    key="tickets"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <TicketSelector
                      selectedSeats={selectedSeatDetails.map((seat) => ({
                        id: seat.id,
                        type: seat.type,
                      }))}
                      showtime={{
                        day: new Date(selectedDate)
                          .toLocaleDateString('en-US', { weekday: 'long' })
                          .toLowerCase(),
                        time: selectedShowtime?.startTime || '',
                      }}
                      onPricingChange={setPricing}
                    />
                  </motion.div>
                )}

                {/* Step 4: Payment */}
                {currentStep === 4 && selectedShowtime && (
                  <motion.div
                    key="payment"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <PaymentFormWrapper
                      amount={pricing?.total || 0}
                      selectedSeats={selectedSeats}
                      selectedSeatDetails={selectedSeatDetails}
                      showtimeId={selectedShowtime.id}
                      theaterId={selectedShowtime.theaterId}
                      movie={movie}
                      showtime={{
                        time: selectedShowtime.startTime,
                        date: selectedDate,
                        theater: selectedShowtime.theaterName,
                        day: new Date(selectedDate)
                          .toLocaleDateString('en-US', { weekday: 'long' })
                          .toLowerCase(),
                      }}
                      onSuccess={() => setCurrentStep(5)}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Booking Sidebar */}
            <div className="xl:col-span-1">
              <div className="sticky top-8">
                <BookingSidebar
                  selectedShowtime={selectedShowtime}
                  selectedSeats={selectedSeats}
                  selectedSeatDetails={selectedSeatDetails}
                  selectedDate={selectedDate}
                  pricing={pricing}
                  currentStep={currentStep}
                  showTimer={showTimer}
                  sessionTimer={sessionTimer}
                  onNextStep={nextStep}
                  formatTime={formatTime}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
