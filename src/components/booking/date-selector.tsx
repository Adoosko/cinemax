'use client';

import { motion } from 'framer-motion';
import { Calendar } from 'lucide-react';

interface DateOption {
  date: string;
  dayName: string;
  dayNumber: number;
  monthName: string;
}

interface DateSelectorProps {
  selectedDate: string;
  onDateSelect: (date: string) => void;
  className?: string;
}

export function DateSelector({ selectedDate, onDateSelect, className = '' }: DateSelectorProps) {
  // Generate next 7 days
  const getNext7Days = (): DateOption[] => {
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

  const days = getNext7Days();

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center space-x-2 mb-6">
        <Calendar className="w-5 h-5 text-white" />
        <h3 className="text-xl font-bold text-white">Select Date</h3>
      </div>

      <div className="bg-neutral-900/50 backdrop-blur-sm border border-neutral-800 rounded-xl p-4">
        <div className="flex space-x-3 overflow-x-auto scrollbar-hide">
          {days.map((day, index) => (
            <motion.button
              key={day.date}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => onDateSelect(day.date)}
              className={`
                relative flex-shrink-0 px-6 py-4 rounded-xl text-center min-w-[90px] 
                transition-all duration-300 group
                ${
                  selectedDate === day.date
                    ? 'bg-gradient-to-b from-red-600 to-red-700 text-white shadow-lg shadow-red-500/25 scale-105'
                    : 'bg-neutral-800/80 text-gray-300 hover:bg-neutral-700/80 hover:text-white hover:scale-102'
                }
              `}
            >
              {/* Selection indicator */}
              {selectedDate === day.date && (
                <div className="absolute inset-0 rounded-xl bg-gradient-to-b from-red-500/20 to-red-600/20 animate-pulse" />
              )}

              <div className="relative z-10">
                <div className="text-xs font-medium uppercase tracking-wider opacity-80 mb-1">
                  {day.dayName}
                </div>
                <div className="text-2xl font-bold mb-1">{day.dayNumber}</div>
                <div className="text-xs opacity-70">{day.monthName}</div>
              </div>

              {/* Hover effect */}
              <div
                className={`
                absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 
                transition-opacity duration-300
                ${selectedDate !== day.date ? 'bg-gradient-to-b from-white/5 to-white/10' : ''}
              `}
              />
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}
