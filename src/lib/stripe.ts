import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
});

export const formatAmountForStripe = (amount: number, currency: string): number => {
  // Stripe expects amounts in cents
  return Math.round(amount * 100);
};

export const formatAmountFromStripe = (amount: number, currency: string): number => {
  // Convert cents back to dollars
  return amount / 100;
};
