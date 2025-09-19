'use client';

import { motion } from 'framer-motion';
import { Users, Clock } from 'lucide-react';

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

interface TheaterCardProps {
  showtime: Showtime;
  isSelected: boolean;
  onSelect: (showtime: Showtime) => void;
  index?: number;
}

export function TheaterCard({ showtime, isSelected, onSelect, index = 0 }: TheaterCardProps) {
  const getAvailabilityStatus = (available: number, total: number) => {
    const percentage = (available / total) * 100;
    if (percentage > 70)
      return { color: 'text-emerald-400', bg: 'bg-emerald-500/20', status: 'Great availability' };
    if (percentage > 30)
      return { color: 'text-amber-400', bg: 'bg-amber-500/20', status: 'Limited seats' };
    return { color: 'text-red-400', bg: 'bg-red-500/20', status: 'Few seats left' };
  };

  const availability = getAvailabilityStatus(showtime.availableSeats, showtime.totalSeats);

  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      onClick={() => onSelect(showtime)}
      className={`
        relative w-full p-6 rounded-2xl text-left transition-all duration-300 group
        backdrop-blur-sm border-2 overflow-hidden
        ${
          isSelected
            ? 'border-red-500 bg-gradient-to-br from-red-500/10 to-red-600/5 shadow-xl shadow-red-500/20 scale-[1.02]'
            : 'border-neutral-700/50 bg-gradient-to-br from-neutral-900/80 to-neutral-800/40 hover:border-neutral-600/50 hover:scale-[1.01] hover:shadow-lg'
        }
      `}
    >
      {/* Background gradient overlay */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-gray-500/10 to-gray-600/10" />

      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute top-4 right-4 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
      )}

      <div className="relative z-10 space-y-4">
        {/* Theater Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Users className="w-5 h-5 text-gray-400" />
            <div>
              <h4 className="font-bold text-white text-lg group-hover:text-white transition-colors">
                {showtime.theaterName}
              </h4>
              <div className="flex items-center space-x-2 mt-1">
                <span className="px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wider bg-gray-500/20 text-gray-300 border border-gray-500/30">
                  Standard
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Showtime */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-gray-400">
            <Clock className="w-4 h-4" />
            <span className="text-sm">Showtime</span>
          </div>
          <div className="flex items-baseline space-x-3">
            <span className="text-3xl font-bold text-white">{showtime.startTime}</span>
            <span className="text-sm text-gray-400">Ends {showtime.endTime}</span>
          </div>
        </div>

        {/* Availability */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-gray-400">
            <Users className="w-4 h-4" />
            <span className="text-sm">Seat Availability</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div
                className={`px-3 py-1 rounded-full text-sm font-medium ${availability.bg} ${availability.color}`}
              >
                {availability.status}
              </div>
            </div>
            <div className="text-right">
              <div className={`text-lg font-bold ${availability.color}`}>
                {showtime.availableSeats}
              </div>
              <div className="text-xs text-gray-400">of {showtime.totalSeats} seats</div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-neutral-800 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                availability.color.includes('emerald')
                  ? 'bg-emerald-500'
                  : availability.color.includes('amber')
                    ? 'bg-amber-500'
                    : 'bg-red-500'
              }`}
              style={{ width: `${(showtime.availableSeats / showtime.totalSeats) * 100}%` }}
            />
          </div>
        </div>

        {/* Selection prompt */}
        <div
          className={`
          text-center py-3 rounded-lg transition-all duration-300 font-medium
          ${
            isSelected
              ? 'bg-red-500/20 text-red-300 border border-red-500/30'
              : 'bg-neutral-800/50 text-gray-400 group-hover:bg-neutral-700/50 group-hover:text-gray-300'
          }
        `}
        >
          <span className="text-sm">
            {isSelected ? '✓ Selected' : 'Click to select this showtime'}
          </span>
        </div>
      </div>

      {/* Hover effect overlay */}
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
    </motion.button>
  );
}
