export interface PricingRule {
  id: string;
  name: string;
  description: string;
  type: 'percentage' | 'fixed' | 'special';
  value: number;
  minAge?: number;
  maxAge?: number;
  conditions?: string[];
  validDays?: string[];
  validTimes?: string[];
  requiresVerification?: boolean;
  verificationText?: string;
}

export interface TicketType {
  id: string;
  name: string;
  basePrice: number;
  minAge?: number;
  maxAge?: number;
  description: string;
}

export interface SeatPricing {
  standard: number;
  premium: number;
  wheelchair: number; // Will be 0 but kept for structure
}

export interface FamilyPackage {
  id: string;
  name: string;
  description: string;
  composition: { adults: number; children: number; seniors?: number };
  discount: number;
  minTickets: number;
}

export const SEAT_PRICING: SeatPricing = {
  standard: 0, // Base price (no surcharge)
  premium: 8, // +$8 surcharge for premium seats
  wheelchair: 0, // Free (but will require verification)
};

export const TICKET_TYPES: TicketType[] = [
  {
    id: 'adult',
    name: 'Adult',
    basePrice: 16.0,
    minAge: 18,
    description: 'Standard adult ticket',
  },
  {
    id: 'child',
    name: 'Child',
    basePrice: 8.0, // Reduced from $10
    maxAge: 12,
    description: 'Children 12 and under',
  },
  {
    id: 'teen',
    name: 'Teen',
    basePrice: 12.0,
    minAge: 13,
    maxAge: 17,
    description: 'Teenagers 13-17 years',
  },
  {
    id: 'senior',
    name: 'Senior',
    basePrice: 11.0,
    minAge: 65,
    description: 'Senior citizens 65+',
  },
  {
    id: 'student',
    name: 'Student',
    basePrice: 10.0,
    description: 'Valid student ID required',
  },
];

export const PRICING_RULES: PricingRule[] = [
  {
    id: 'student-discount',
    name: 'Student Discount',
    description: '30% off with valid student ID',
    type: 'percentage',
    value: 30,
    requiresVerification: true,
    verificationText: 'Please bring valid student ID to theater',
  },
  {
    id: 'wheelchair-free',
    name: 'Wheelchair Accessible',
    description: 'Free admission for wheelchair users',
    type: 'special',
    value: 100, // 100% discount
    requiresVerification: true,
    verificationText: 'Disability documentation required at theater',
  },
  {
    id: 'matinee',
    name: 'Matinee Pricing',
    description: '$4 off shows before 5 PM',
    type: 'fixed',
    value: 4,
    validTimes: ['before-17:00'],
  },
  {
    id: 'tuesday-special',
    name: 'Tuesday Special',
    description: '25% off all tickets on Tuesdays',
    type: 'percentage',
    value: 25,
    validDays: ['tuesday'],
  },
  {
    id: 'group-discount',
    name: 'Group Discount',
    description: '15% off for groups of 6+',
    type: 'percentage',
    value: 15,
    conditions: ['min-6-tickets'],
  },
];

export const FAMILY_PACKAGES: FamilyPackage[] = [
  {
    id: 'family-classic',
    name: 'Family Pack',
    description: '2 Adults + 2 Children - Save 20%',
    composition: { adults: 2, children: 2 },
    discount: 20,
    minTickets: 4,
  },
  {
    id: 'family-large',
    name: 'Large Family Pack',
    description: '2 Adults + 3 Children - Save 25%',
    composition: { adults: 2, children: 3 },
    discount: 25,
    minTickets: 5,
  },
  {
    id: 'multi-generation',
    name: 'Multi-Generation Pack',
    description: '2 Adults + 2 Children + 1 Senior - Save 18%',
    composition: { adults: 2, children: 2, seniors: 1 },
    discount: 18,
    minTickets: 5,
  },
];

export interface TicketWithSeat {
  type: string;
  seatType: 'standard' | 'premium' | 'wheelchair';
  quantity: number;
  seatIds?: string[]; // Track which specific seats
}

export interface PricingCalculation {
  subtotal: number;
  discounts: Array<{ name: string; amount: number; type: string }>;
  taxes: number;
  processingFee: number;
  total: number;
  breakdown: Array<{
    type: string;
    quantity: number;
    unitPrice: number;
    seatSurcharge: number;
    total: number;
    seatType: string;
  }>;
  wheelchairSeats: number;
  requiresVerification: string[];
}

export function calculatePricing(
  tickets: TicketWithSeat[],
  appliedDiscounts: string[] = [],
  showtime?: { day: string; time: string },
  familyPackage?: string
): PricingCalculation {
  let subtotal = 0;
  const breakdown: PricingCalculation['breakdown'] = [];
  const discounts: Array<{ name: string; amount: number; type: string }> = [];
  const requiresVerification: string[] = [];
  let wheelchairSeats = 0;

  // ✅ Calculate base pricing with proper seat surcharges
  tickets.forEach((ticket) => {
    const ticketType = TICKET_TYPES.find((t) => t.id === ticket.type);
    if (!ticketType) return;

    // Base ticket price
    let unitPrice = ticketType.basePrice;

    // ✅ Add seat surcharge based on seat type
    const seatSurcharge = SEAT_PRICING[ticket.seatType];
    const finalUnitPrice = unitPrice + seatSurcharge;

    // ✅ Handle wheelchair seats (free but track them)
    if (ticket.seatType === 'wheelchair') {
      wheelchairSeats += ticket.quantity;
      requiresVerification.push(
        'Disability documentation required for wheelchair accessible seats'
      );

      breakdown.push({
        type: `${ticketType.name} (Wheelchair Accessible)`,
        quantity: ticket.quantity,
        unitPrice: 0, // Free!
        seatSurcharge: 0,
        total: 0,
        seatType: ticket.seatType,
      });
      return; // Don't add to subtotal
    }

    const ticketTotal = finalUnitPrice * ticket.quantity;
    subtotal += ticketTotal;

    breakdown.push({
      type: `${ticketType.name} (${ticket.seatType.charAt(0).toUpperCase() + ticket.seatType.slice(1)})`,
      quantity: ticket.quantity,
      unitPrice,
      seatSurcharge,
      total: ticketTotal,
      seatType: ticket.seatType,
    });
  });

  // ✅ Apply family package discounts (on the full price including premium surcharges)
  if (familyPackage) {
    const familyPack = FAMILY_PACKAGES.find((fp) => fp.id === familyPackage);
    if (familyPack) {
      const familyDiscount = subtotal * (familyPack.discount / 100);
      discounts.push({
        name: familyPack.name,
        amount: familyDiscount,
        type: 'family-package',
      });
    }
  }

  // ✅ Apply other discounts
  appliedDiscounts.forEach((discountId) => {
    const rule = PRICING_RULES.find((r) => r.id === discountId);
    if (!rule) return;

    // Add verification requirements
    if (rule.requiresVerification && rule.verificationText) {
      requiresVerification.push(rule.verificationText);
    }

    // Skip wheelchair discount - handled above
    if (rule.id === 'wheelchair-free') return;

    // Check time conditions
    if (rule.validDays && showtime) {
      if (!rule.validDays.includes(showtime.day.toLowerCase())) return;
    }

    if (rule.validTimes && showtime) {
      // Simple time check
      if (rule.validTimes.includes('before-17:00')) {
        const hour = parseInt(showtime.time.split(':')[0]);
        const isPM = showtime.time.includes('PM');
        const is24Hour = isPM ? hour + 12 : hour;
        if (is24Hour >= 17) return;
      }
    }

    // Check group conditions
    if (rule.conditions) {
      const totalTickets = tickets.reduce((sum, t) => sum + t.quantity, 0);
      if (rule.conditions.includes('min-6-tickets') && totalTickets < 6) return;
    }

    // Calculate discount amount
    let discountAmount = 0;
    if (rule.type === 'percentage') {
      discountAmount = subtotal * (rule.value / 100);
    } else if (rule.type === 'fixed') {
      // Fixed discount per ticket (excluding wheelchair seats)
      const paidTickets = tickets
        .filter((t) => t.seatType !== 'wheelchair')
        .reduce((sum, t) => sum + t.quantity, 0);
      discountAmount = rule.value * paidTickets;
    }

    discounts.push({
      name: rule.name,
      amount: discountAmount,
      type: rule.type,
    });
  });

  // ✅ Calculate final totals
  const totalDiscounts = discounts.reduce((sum, d) => sum + d.amount, 0);
  const discountedSubtotal = Math.max(0, subtotal - totalDiscounts);

  // Only apply taxes and fees to paid tickets
  const taxes = discountedSubtotal * 0.08; // 8% tax
  const processingFee = discountedSubtotal > 0 ? Math.max(2.5, discountedSubtotal * 0.03) : 0; // Min $2.50 or 3%
  const total = discountedSubtotal + taxes + processingFee;

  return {
    subtotal,
    discounts,
    taxes,
    processingFee,
    total,
    breakdown,
    wheelchairSeats,
    requiresVerification: [...new Set(requiresVerification)], // Remove duplicates
  };
}
