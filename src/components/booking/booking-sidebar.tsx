'use client';

import { motion } from 'framer-motion';
import {
  Crown,
  Shield,
  ChevronRight,
  CreditCard,
  Timer,
  Calendar,
  Clock,
  MapPin,
  Users,
} from 'lucide-react';
import { PricingCalculation } from '@/lib/pricing';

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

interface BookingSidebarProps {
  selectedShowtime: Showtime | null;
  selectedSeats: string[];
  selectedSeatDetails: Seat[];
  selectedDate: string;
  pricing: PricingCalculation | null;
  currentStep: number;
  showTimer: boolean;
  sessionTimer: number;
  onNextStep: () => void;
  formatTime: (seconds: number) => string;
  className?: string;
}

export function BookingSidebar({
  selectedShowtime,
  selectedSeats,
  selectedSeatDetails,
  selectedDate,
  pricing,
  currentStep,
  showTimer,
  sessionTimer,
  onNextStep,
  formatTime,
  className = '',
}: BookingSidebarProps) {
  const isNextDisabled =
    (currentStep === 1 && !selectedShowtime) ||
    (currentStep === 2 && selectedSeats.length === 0) ||
    (currentStep === 3 && (!pricing || pricing.total === 0));

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="bg-neutral-950/80 backdrop-blur-sm border border-neutral-800 rounded-2xl p-6 sticky top-24">
        {/* Showtime Info */}
        {selectedShowtime && (
          <motion.div
            className="mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center space-x-2 mb-4">
              <Calendar className="w-4 h-4 text-white" />
              <h4 className="text-white font-bold">Selected Showtime</h4>
            </div>

            <div className="bg-gradient-to-br from-neutral-900 to-neutral-800 border border-neutral-700 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span className="text-white font-medium">{selectedShowtime.theaterName}</span>
                </div>
                <span className="bg-neutral-800 text-gray-300 px-2 py-1 rounded text-xs">
                  {selectedShowtime.screenType}
                </span>
              </div>

              <div className="flex items-center space-x-4 text-sm text-gray-400">
                <div className="flex items-center space-x-1">
                  <Calendar className="w-3 h-3" />
                  <span>{selectedDate}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="w-3 h-3" />
                  <span>{selectedShowtime.startTime}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-neutral-700">
                <div className="flex items-center space-x-1 text-sm text-gray-400">
                  <Users className="w-3 h-3" />
                  <span>{selectedShowtime.availableSeats} available</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Selected Seats */}
        {selectedSeats.length > 0 && (
          <motion.div
            className="mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h4 className="text-white font-bold mb-4 flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span>Selected Seats ({selectedSeats.length})</span>
            </h4>

            <div className="space-y-3 max-h-48 overflow-y-auto scrollbar-hide">
              {selectedSeatDetails.map((seat, index) => (
                <motion.div
                  key={seat.id}
                  className="flex items-center justify-between p-3 bg-gradient-to-r from-neutral-900 to-neutral-800 border border-neutral-700 rounded-lg"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-8 h-8 flex items-center justify-center text-xs font-bold rounded-lg ${
                        seat.type === 'premium'
                          ? 'bg-gradient-to-b from-amber-600 to-amber-700 text-white'
                          : seat.type === 'wheelchair'
                            ? 'bg-gradient-to-b from-blue-500 to-blue-600 text-white'
                            : 'bg-gradient-to-b from-neutral-600 to-neutral-700 text-white'
                      }`}
                    >
                      {seat.type === 'premium' ? (
                        <Crown className="w-3 h-3" />
                      ) : seat.type === 'wheelchair' ? (
                        <Shield className="w-3 h-3" />
                      ) : (
                        seat.id
                      )}
                    </div>
                    <div>
                      <div className="text-white font-medium">{seat.id}</div>
                      <div className="text-xs text-gray-400 capitalize">{seat.type} seat</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-bold">
                      {seat.type === 'wheelchair' ? 'FREE' : `$${seat.price.toFixed(2)}`}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Pricing Breakdown */}
        {pricing && (
          <motion.div
            className="border-t border-neutral-700 pt-6 mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="space-y-3">
              {pricing.breakdown.map((item, index) => (
                <div key={index} className="flex justify-between text-sm text-gray-300">
                  <span>
                    {item.type} ×{item.quantity}
                  </span>
                  <span>${item.total.toFixed(2)}</span>
                </div>
              ))}

              {pricing.discounts.map((discount, index) => (
                <div key={index} className="flex justify-between text-sm text-red-400">
                  <span>- {discount.name}</span>
                  <span>-${discount.amount.toFixed(2)}</span>
                </div>
              ))}

              <div className="border-t border-neutral-700 pt-3">
                <div className="flex justify-between text-xl font-bold text-white">
                  <span>Total</span>
                  <span>${pricing.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Continue Button */}
        {currentStep < 4 ? (
          <motion.button
            onClick={onNextStep}
            disabled={isNextDisabled}
            className={`
              w-full py-4 px-6 font-bold transition-all duration-300 rounded-xl
              flex items-center justify-center space-x-2 group
              ${
                isNextDisabled
                  ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white shadow-lg hover:shadow-xl hover:shadow-red-500/25 hover:scale-105'
              }
            `}
            whileHover={!isNextDisabled ? { scale: 1.02 } : {}}
            whileTap={!isNextDisabled ? { scale: 0.98 } : {}}
          >
            {currentStep === 1 && (
              <>
                <span>Continue to Seats</span>
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
            {currentStep === 2 && (
              <>
                <span>Continue to Tickets</span>
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
            {currentStep === 3 && (
              <>
                <CreditCard className="w-5 h-5" />
                <span>Proceed to Payment</span>
              </>
            )}

            {selectedSeats.length > 0 && currentStep === 2 && (
              <div className="bg-white text-red-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold ml-2">
                {selectedSeats.length}
              </div>
            )}
          </motion.button>
        ) : currentStep === 4 ? (
          <div className="w-full bg-gradient-to-r from-neutral-700 to-neutral-800 text-white py-4 px-6 font-bold flex items-center justify-center space-x-2 rounded-xl">
            <CreditCard className="w-5 h-5" />
            <span>Complete payment to confirm</span>
          </div>
        ) : null}

        {/* Session Timer */}
        {selectedSeats.length > 0 && showTimer && (
          <motion.div
            className="mt-4 p-4 bg-gradient-to-r from-neutral-900 to-neutral-800 border border-neutral-700 rounded-xl"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="flex items-center space-x-3">
              <div
                className={`p-2 rounded-full ${
                  sessionTimer < 60
                    ? 'bg-red-500/20 text-red-400'
                    : 'bg-amber-500/20 text-amber-400'
                }`}
              >
                <Timer className="w-4 h-4" />
              </div>
              <div>
                <div className="text-white font-medium">Seats Reserved</div>
                <div
                  className={`font-mono text-lg font-bold ${
                    sessionTimer < 60 ? 'text-red-400' : 'text-amber-400'
                  }`}
                >
                  {formatTime(sessionTimer)}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
