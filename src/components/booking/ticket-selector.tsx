'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TICKET_TYPES,
  FAMILY_PACKAGES,
  calculatePricing,
  type TicketWithSeat,
} from '@/lib/pricing';
import {
  Users,
  GraduationCap,
  Baby,
  Crown,
  Plus,
  Minus,
  Shield,
  CheckCircle2,
  Gift,
  Sparkles,
  Clock,
  Calendar,
  AlertCircle,
  Ticket,
} from 'lucide-react';

interface TicketSelectorProps {
  selectedSeats: Array<{ id: string; type: 'standard' | 'premium' | 'wheelchair' }>;
  showtime?: { day: string; time: string };
  onPricingChange: (pricing: any) => void;
}

export function TicketSelector({ selectedSeats, showtime, onPricingChange }: TicketSelectorProps) {
  const [tickets, setTickets] = useState<Record<string, Record<string, number>>>({
    adult: { standard: 0, premium: 0, wheelchair: 0 },
    child: { standard: 0, premium: 0, wheelchair: 0 },
    teen: { standard: 0, premium: 0, wheelchair: 0 },
    senior: { standard: 0, premium: 0, wheelchair: 0 },
    student: { standard: 0, premium: 0, wheelchair: 0 },
  });

  const [selectedFamilyPack, setSelectedFamilyPack] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<'seats' | 'tickets'>('seats');

  const seatCounts = selectedSeats.reduce(
    (acc, seat) => {
      acc[seat.type] = (acc[seat.type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const totalSeats = selectedSeats.length;
  const wheelchairSeats = seatCounts.wheelchair || 0;
  const premiumSeats = seatCounts.premium || 0;
  const standardSeats = seatCounts.standard || 0;

  useEffect(() => {
    if (currentStep === 'seats' && totalSeats > 0) {
      const timer = setTimeout(() => setCurrentStep('tickets'), 800);
      return () => clearTimeout(timer);
    }
  }, [totalSeats, currentStep]);

  useEffect(() => {
    updatePricing(tickets);
  }, [tickets, selectedFamilyPack]);

  const updatePricing = (newTickets: Record<string, Record<string, number>>) => {
    const ticketArray: TicketWithSeat[] = [];
    const appliedDiscounts: string[] = [];

    Object.entries(newTickets).forEach(([ticketType, seatTypes]) => {
      Object.entries(seatTypes).forEach(([seatType, quantity]) => {
        if (quantity > 0) {
          ticketArray.push({
            type: ticketType,
            seatType: seatType as 'standard' | 'premium' | 'wheelchair',
            quantity,
          });
        }
      });
    });

    if (wheelchairSeats > 0) appliedDiscounts.push('wheelchair-free');

    if (showtime) {
      const hour = parseInt(showtime.time.split(':')[0]);
      const isPM = showtime.time.includes('PM');
      const is24Hour = isPM && hour !== 12 ? hour + 12 : hour;
      if (is24Hour < 17) appliedDiscounts.push('matinee');
      if (showtime.day.toLowerCase() === 'tuesday') appliedDiscounts.push('tuesday-special');
    }

    if (totalSeats >= 6) appliedDiscounts.push('group-discount');

    const pricing = calculatePricing(
      ticketArray,
      appliedDiscounts,
      showtime,
      selectedFamilyPack || undefined
    );
    onPricingChange(pricing);
  };

  const handleTicketChange = (ticketType: string, seatType: string, delta: number) => {
    const currentTicketTotal = Object.values(tickets).reduce(
      (sum, seatTypes) => sum + Object.values(seatTypes).reduce((seatSum, qty) => seatSum + qty, 0),
      0
    );

    const currentSeatTypeTotal = Object.values(tickets).reduce(
      (sum, seatTypes) => sum + (seatTypes[seatType] || 0),
      0
    );

    const newQuantity = Math.max(0, (tickets[ticketType][seatType] || 0) + delta);

    if (delta > 0 && currentTicketTotal >= totalSeats) return;
    if (delta > 0 && currentSeatTypeTotal >= (seatCounts[seatType] || 0)) return;

    const newTickets = {
      ...tickets,
      [ticketType]: {
        ...tickets[ticketType],
        [seatType]: newQuantity,
      },
    };

    setTickets(newTickets);
  };

  const selectFamilyPack = (packageId: string) => {
    const familyPack = FAMILY_PACKAGES.find((fp) => fp.id === packageId);
    if (!familyPack) return;

    const requiredSeats =
      familyPack.composition.adults +
      familyPack.composition.children +
      (familyPack.composition.seniors || 0);
    if (totalSeats < requiredSeats) return;

    const newTickets = { ...tickets };

    Object.keys(newTickets).forEach((ticketType) => {
      Object.keys(newTickets[ticketType]).forEach((seatType) => {
        newTickets[ticketType][seatType] = 0;
      });
    });

    const seatTypeOrder: Array<keyof typeof seatCounts> = ['wheelchair', 'premium', 'standard'];

    let adultsToAssign = familyPack.composition.adults;
    let childrenToAssign = familyPack.composition.children;
    let seniorsToAssign = familyPack.composition.seniors || 0;

    seatTypeOrder.forEach((seatType) => {
      const availableSeats = seatCounts[seatType] || 0;
      if (availableSeats === 0) return;

      if (adultsToAssign > 0) {
        const toAssign = Math.min(adultsToAssign, availableSeats);
        newTickets.adult[seatType] = toAssign;
        adultsToAssign -= toAssign;
      }

      const remainingSeats = availableSeats - (newTickets.adult[seatType] || 0);
      if (childrenToAssign > 0 && remainingSeats > 0) {
        const toAssign = Math.min(childrenToAssign, remainingSeats);
        newTickets.child[seatType] = toAssign;
        childrenToAssign -= toAssign;
      }

      const remainingSeatsFinal = remainingSeats - (newTickets.child[seatType] || 0);
      if (seniorsToAssign > 0 && remainingSeatsFinal > 0) {
        const toAssign = Math.min(seniorsToAssign, remainingSeatsFinal);
        newTickets.senior[seatType] = toAssign;
        seniorsToAssign -= toAssign;
      }
    });

    setSelectedFamilyPack(packageId);
    setTickets(newTickets);
  };

  const getTicketIcon = (ticketType: string) => {
    switch (ticketType) {
      case 'adult':
        return Users;
      case 'child':
        return Baby;
      case 'teen':
        return Users;
      case 'senior':
        return Users;
      case 'student':
        return GraduationCap;
      default:
        return Users;
    }
  };

  const currentTotal = Object.values(tickets).reduce(
    (sum, seatTypes) => sum + Object.values(seatTypes).reduce((seatSum, qty) => seatSum + qty, 0),
    0
  );

  const availableFamilyPackages = FAMILY_PACKAGES.filter((pack) => {
    const requiredSeats =
      pack.composition.adults + pack.composition.children + (pack.composition.seniors || 0);
    return totalSeats >= requiredSeats;
  });

  return (
    <div className="space-y-8">
      {/* Netflix Progress Steps */}
      <div className="flex items-center justify-center space-x-16">
        {[
          { id: 'seats', label: 'Seats Selected', number: '01', icon: CheckCircle2 },
          { id: 'tickets', label: 'Choose Tickets', number: '02', icon: Ticket },
        ].map((step, index) => {
          const isActive = currentStep === step.id;
          const isComplete =
            step.id === 'seats' ? totalSeats > 0 : currentTotal === totalSeats && currentTotal > 0;
          const Icon = step.icon;

          return (
            <motion.div
              key={step.id}
              className="flex flex-col items-center relative"
              initial={{ opacity: 0.4, scale: 0.9 }}
              animate={{
                opacity: isActive || isComplete ? 1 : 0.4,
                scale: isActive ? 1.05 : 1,
              }}
              transition={{ duration: 0.4 }}
            >
              {/* Step Circle */}
              <motion.div
                className={`w-20 h-20 rounded-full border-2 flex items-center justify-center relative overflow-hidden transition-all duration-500 ${
                  isComplete
                    ? 'bg-netflix-red border-netflix-red shadow-lg shadow-netflix-red/25'
                    : isActive
                      ? 'bg-black border-netflix-red shadow-lg'
                      : 'bg-black border-white/20'
                }`}
                whileHover={{ scale: 1.05 }}
              >
                {/* Animated background */}
                {isActive && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute inset-0 bg-netflix-red/10 rounded-full"
                  />
                )}

                {isComplete ? (
                  <motion.div
                    initial={{ scale: 0, rotate: -90 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 200 }}
                  >
                    <Icon className="w-8 h-8 text-white" />
                  </motion.div>
                ) : (
                  <span
                    className={`text-xl font-bold relative z-10 ${
                      isActive ? 'text-netflix-red' : 'text-white'
                    }`}
                  >
                    {step.number}
                  </span>
                )}
              </motion.div>

              {/* Step Label */}
              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="mt-4 text-center"
              >
                <span
                  className={`block text-sm font-bold uppercase tracking-wider transition-colors ${
                    isActive || isComplete ? 'text-white' : 'text-white/40'
                  }`}
                >
                  {step.label}
                </span>
              </motion.div>

              {/* Connecting Line */}
              {index < 1 && (
                <div className="absolute top-10 left-20 w-16 h-0.5 bg-white/20">
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: isComplete ? 1 : 0 }}
                    transition={{ duration: 0.5 }}
                    className="h-full bg-netflix-red origin-left"
                  />
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {/* Step 1: Seat Confirmation */}
        {currentStep === 'seats' && (
          <motion.div
            key="seats"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.6 }}
          >
            <div className="bg-black/50 backdrop-blur-xl border border-white/10 rounded-2xl p-12 text-center">
              {/* Success Animation */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 150, delay: 0.2 }}
                className="w-24 h-24 bg-netflix-red rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg shadow-netflix-red/25"
              >
                <CheckCircle2 className="w-12 h-12 text-white" />
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-4xl font-bold text-white mb-4"
              >
                Perfect! Seats Reserved
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-xl text-white/60 mb-12"
              >
                {totalSeats} premium seat{totalSeats !== 1 ? 's' : ''} secured for your viewing
                experience
              </motion.p>

              {/* Seat Type Breakdown */}
              <div className="flex justify-center items-center space-x-12">
                {standardSeats > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="text-center"
                  >
                    <div className="w-16 h-16 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl mx-auto mb-4 flex items-center justify-center">
                      <div className="w-8 h-8 bg-white rounded-lg" />
                    </div>
                    <div className="text-3xl font-bold text-white mb-2">{standardSeats}</div>
                    <div className="text-white/60 text-sm font-semibold uppercase tracking-wider">
                      Standard
                    </div>
                  </motion.div>
                )}

                {premiumSeats > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="text-center"
                  >
                    <div className="w-16 h-16 bg-netflix-red/20 border border-netflix-red/40 rounded-xl mx-auto mb-4 flex items-center justify-center">
                      <Crown className="w-8 h-8 text-netflix-red" />
                    </div>
                    <div className="text-3xl font-bold text-netflix-red mb-2">{premiumSeats}</div>
                    <div className="text-netflix-red text-sm font-bold uppercase tracking-wider">
                      Premium
                    </div>
                  </motion.div>
                )}

                {wheelchairSeats > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="text-center"
                  >
                    <div className="w-16 h-16 bg-blue-500/20 border border-blue-500/40 rounded-xl mx-auto mb-4 flex items-center justify-center">
                      <Shield className="w-8 h-8 text-blue-400" />
                    </div>
                    <div className="text-3xl font-bold text-blue-400 mb-2">{wheelchairSeats}</div>
                    <div className="text-blue-400 text-sm font-semibold uppercase tracking-wider">
                      Accessible
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Loading indicator */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="mt-8 flex items-center justify-center space-x-2 text-white/40"
              >
                <div className="w-2 h-2 bg-netflix-red rounded-full animate-pulse" />
                <span className="text-sm">Loading ticket options...</span>
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* Step 2: Ticket Selection */}
        {currentStep === 'tickets' && (
          <motion.div
            key="tickets"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.6 }}
            className="space-y-8"
          >
            {/* Family Packages */}
            {availableFamilyPackages.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-black/50 backdrop-blur-xl border border-white/10 rounded-2xl p-8"
              >
                <div className="text-center mb-8">
                  <div className="flex items-center justify-center space-x-3 mb-4">
                    <Sparkles className="w-6 h-6 text-netflix-red" />
                    <h3 className="text-2xl font-bold text-white">Family Packages</h3>
                    <Sparkles className="w-6 h-6 text-netflix-red" />
                  </div>
                  <p className="text-white/60">Save more when you book together</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {availableFamilyPackages.map((familyPack, index) => (
                    <motion.button
                      key={familyPack.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.05, y: -5 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => selectFamilyPack(familyPack.id)}
                      className={`relative p-8 rounded-xl border-2 transition-all duration-300 overflow-hidden ${
                        selectedFamilyPack === familyPack.id
                          ? 'border-netflix-red bg-netflix-red shadow-lg shadow-netflix-red/25'
                          : 'border-white/20 bg-white/5 hover:border-netflix-red/50 hover:bg-white/10'
                      }`}
                    >
                      {/* Background Pattern */}
                      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-50" />

                      <div className="relative text-center">
                        <Gift
                          className={`w-10 h-10 mx-auto mb-4 ${
                            selectedFamilyPack === familyPack.id ? 'text-white' : 'text-netflix-red'
                          }`}
                        />

                        <h4
                          className={`text-lg font-bold mb-3 ${
                            selectedFamilyPack === familyPack.id ? 'text-white' : 'text-white'
                          }`}
                        >
                          {familyPack.name}
                        </h4>

                        <div
                          className={`text-5xl font-bold mb-2 ${
                            selectedFamilyPack === familyPack.id ? 'text-white' : 'text-netflix-red'
                          }`}
                        >
                          {familyPack.discount}%
                        </div>

                        <div
                          className={`text-sm uppercase tracking-wider font-semibold ${
                            selectedFamilyPack === familyPack.id ? 'text-white/90' : 'text-white/60'
                          }`}
                        >
                          Savings
                        </div>

                        {selectedFamilyPack === familyPack.id && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute top-4 right-4 w-8 h-8 bg-white rounded-full flex items-center justify-center"
                          >
                            <CheckCircle2 className="w-5 h-5 text-netflix-red" />
                          </motion.div>
                        )}
                      </div>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Individual Tickets */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-black/50 backdrop-blur-xl border border-white/10 rounded-2xl p-8"
            >
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-white mb-2">Select Individual Tickets</h3>
                <div className="flex items-center justify-center space-x-2 text-white/60">
                  <span>
                    {currentTotal} of {totalSeats} tickets selected
                  </span>
                  {currentTotal < totalSeats && (
                    <>
                      <div className="w-1 h-1 bg-white/40 rounded-full" />
                      <span className="text-netflix-red">
                        {totalSeats - currentTotal} remaining
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-8">
                {TICKET_TYPES.map((ticketType, typeIndex) => {
                  const Icon = getTicketIcon(ticketType.id);

                  return (
                    <motion.div
                      key={ticketType.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: typeIndex * 0.1 }}
                      className="border border-white/10 rounded-xl p-6 bg-white/5"
                    >
                      {/* Ticket Type Header */}
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-4">
                          <div className="w-14 h-14 bg-netflix-red rounded-xl flex items-center justify-center">
                            <Icon className="w-7 h-7 text-white" />
                          </div>
                          <div>
                            <h4 className="text-xl font-bold text-white">{ticketType.name}</h4>
                            <p className="text-white/60">{ticketType.description}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-3xl font-bold text-white">
                            ${ticketType.basePrice}
                          </div>
                          <div className="text-white/40 text-sm">base price</div>
                        </div>
                      </div>

                      {/* Seat Type Selection */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {(['standard', 'premium', 'wheelchair'] as const).map(
                          (seatType, seatIndex) => {
                            const availableSeats = seatCounts[seatType] || 0;
                            const currentQuantity = tickets[ticketType.id][seatType] || 0;

                            if (availableSeats === 0) return null;

                            const seatSurcharge = seatType === 'premium' ? 8 : 0;
                            const finalPrice =
                              seatType === 'wheelchair' ? 0 : ticketType.basePrice + seatSurcharge;

                            return (
                              <motion.div
                                key={seatType}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: typeIndex * 0.1 + seatIndex * 0.05 }}
                                className={`p-6 rounded-xl border-2 transition-all duration-300 ${
                                  currentQuantity > 0
                                    ? 'border-netflix-red bg-netflix-red/20'
                                    : 'border-white/20 bg-white/5 hover:border-white/40'
                                }`}
                              >
                                <div className="text-center">
                                  {/* Seat Type Header */}
                                  <div className="flex items-center justify-center mb-4">
                                    {seatType === 'premium' && (
                                      <Crown className="w-5 h-5 mr-2 text-netflix-red" />
                                    )}
                                    {seatType === 'wheelchair' && (
                                      <Shield className="w-5 h-5 mr-2 text-blue-400" />
                                    )}
                                    <span className="font-bold uppercase tracking-wider text-white">
                                      {seatType}
                                    </span>
                                  </div>

                                  {/* Price */}
                                  <div className="text-2xl font-bold text-white mb-2">
                                    {seatType === 'wheelchair' ? (
                                      <span className="text-blue-400">FREE</span>
                                    ) : (
                                      `$${finalPrice}`
                                    )}
                                  </div>

                                  {/* Premium Surcharge */}
                                  {seatType === 'premium' && (
                                    <div className="text-netflix-red text-xs font-semibold mb-3 uppercase tracking-wide">
                                      +$8 Premium
                                    </div>
                                  )}

                                  {/* Available Count */}
                                  <div className="text-white/40 text-xs mb-4 uppercase tracking-wide">
                                    {availableSeats} Available
                                  </div>

                                  {/* Quantity Controls */}
                                  <div className="flex items-center justify-center space-x-4">
                                    <motion.button
                                      whileHover={{ scale: 1.1 }}
                                      whileTap={{ scale: 0.9 }}
                                      onClick={() =>
                                        handleTicketChange(ticketType.id, seatType, -1)
                                      }
                                      disabled={currentQuantity === 0}
                                      className="w-10 h-10 rounded-full border-2 border-white hover:bg-white hover:text-black disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center"
                                    >
                                      <Minus className="w-4 h-4" />
                                    </motion.button>

                                    <div className="w-16 text-center">
                                      <span className="text-2xl font-bold text-white">
                                        {currentQuantity}
                                      </span>
                                    </div>

                                    <motion.button
                                      whileHover={{ scale: 1.1 }}
                                      whileTap={{ scale: 0.9 }}
                                      onClick={() => handleTicketChange(ticketType.id, seatType, 1)}
                                      disabled={
                                        currentTotal >= totalSeats ||
                                        Object.values(tickets).reduce(
                                          (sum, seatTypes) => sum + (seatTypes[seatType] || 0),
                                          0
                                        ) >= availableSeats
                                      }
                                      className="w-10 h-10 rounded-full border-2 border-white hover:bg-white hover:text-black disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center"
                                    >
                                      <Plus className="w-4 h-4" />
                                    </motion.button>
                                  </div>
                                </div>
                              </motion.div>
                            );
                          }
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Accessibility Notice */}
      {wheelchairSeats > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-6"
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h4 className="font-bold text-blue-400 mb-1">Accessibility Information</h4>
              <p className="text-blue-200 text-sm">
                Wheelchair accessible seats are complimentary. Valid accessibility documentation may
                be required at the venue.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Time-based Discounts */}
      {showtime && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-netflix-red/10 border border-netflix-red/30 rounded-xl p-6"
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-netflix-red/20 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-netflix-red" />
            </div>
            <div>
              <h4 className="font-bold text-netflix-red mb-1">Special Pricing</h4>
              <p className="text-white/80 text-sm">
                {showtime.day} {showtime.time} - Check pricing summary for applicable discounts
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
