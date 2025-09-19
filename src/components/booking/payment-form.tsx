'use client';

import { useState, useEffect } from 'react';
import { PaymentElement, useStripe, useElements, Elements } from '@stripe/react-stripe-js';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CreditCard,
  Lock,
  User,
  Mail,
  Phone,
  Shield,
  Check,
  AlertCircle,
  MapPin,
  Sparkles,
  Clock,
  Calendar,
  Film,
  ArrowRight,
  CheckCircle,
} from 'lucide-react';
import { getStripe } from '@/lib/stripe-client';

interface PaymentFormProps {
  amount: number;
  selectedSeats: string[];
  selectedSeatDetails: any[];
  showtimeId: string;
  theaterId: string;
  movie: any;
  showtime: any;
  onSuccess: () => void;
}

// Inner component that uses Stripe hooks
function PaymentFormInner({
  amount,
  selectedSeats,
  selectedSeatDetails,
  showtimeId,
  theaterId,
  movie,
  showtime,
  onSuccess,
  clientSecret,
  userInfo,
}: PaymentFormProps & { clientSecret: string; userInfo: any }) {
  const stripe = useStripe();
  const elements = useElements();

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) return;

    setIsProcessing(true);
    setError(null);

    const { error: submitError } = await elements.submit();
    if (submitError) {
      setError(submitError.message || 'An error occurred');
      setIsProcessing(false);
      return;
    }

    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      clientSecret,
      confirmParams: {
        return_url: `${window.location.origin}/booking-success`,
        payment_method_data: {
          billing_details: {
            name: userInfo.name,
            email: userInfo.email,
            phone: userInfo.phone,
            address: {
              country: 'US',
              line1: userInfo.address.line1,
              line2: userInfo.address.line2,
              city: userInfo.address.city,
              state: userInfo.address.state,
              postal_code: userInfo.address.postal_code,
            },
          },
        },
      },
      redirect: 'if_required',
    });

    if (confirmError) {
      setError(confirmError.message || 'Payment failed');
    } else {
      onSuccess();
    }

    setIsProcessing(false);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        {/* Header */}
        <div className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
            className="w-20 h-20 bg-netflix-red rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-netflix-red/25"
          >
            <CreditCard className="w-10 h-10 text-white" />
          </motion.div>
          <h2 className="text-3xl font-bold text-white mb-3">Secure Payment</h2>
          <p className="text-white/60 text-lg">Complete your movie booking with confidence</p>
        </div>

        {/* Booking Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-black/50 backdrop-blur-xl border border-white/10 rounded-2xl p-8"
        >
          <div className="flex items-center space-x-3 mb-6">
            <Sparkles className="w-6 h-6 text-netflix-red" />
            <h3 className="text-xl font-bold text-white">Booking Summary</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <Film className="w-4 h-4 text-netflix-red" />
                <span className="text-white/60 text-sm font-medium">Movie</span>
              </div>
              <div className="text-white font-bold text-lg">{movie.title}</div>
            </div>

            <div>
              <div className="flex items-center space-x-2 mb-2">
                <Clock className="w-4 h-4 text-netflix-red" />
                <span className="text-white/60 text-sm font-medium">Showtime</span>
              </div>
              <div className="text-white font-bold">
                {showtime.date} at {showtime.time}
              </div>
            </div>

            <div>
              <div className="flex items-center space-x-2 mb-2">
                <MapPin className="w-4 h-4 text-netflix-red" />
                <span className="text-white/60 text-sm font-medium">Theater</span>
              </div>
              <div className="text-white font-bold">{showtime.theater}</div>
            </div>

            <div>
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircle className="w-4 h-4 text-netflix-red" />
                <span className="text-white/60 text-sm font-medium">Seats</span>
              </div>
              <div className="text-white font-bold">{selectedSeats.join(', ')}</div>
            </div>
          </div>

          {/* Customer Info */}
          <div className="border-t border-white/10 pt-6 mb-6">
            <h4 className="text-white font-semibold mb-4">Customer Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between">
                <span className="text-white/60">Name:</span>
                <span className="text-white font-medium">{userInfo.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Email:</span>
                <span className="text-white font-medium">{userInfo.email}</span>
              </div>
              {userInfo.phone && (
                <div className="flex justify-between">
                  <span className="text-white/60">Phone:</span>
                  <span className="text-white font-medium">{userInfo.phone}</span>
                </div>
              )}
            </div>
          </div>

          {/* Total */}
          <div className="border-t border-white/10 pt-6">
            <div className="flex justify-between items-center">
              <span className="text-xl font-bold text-white">Total Amount</span>
              <span className="text-4xl font-bold text-netflix-red">${amount.toFixed(2)}</span>
            </div>
          </div>
        </motion.div>

        {/* Payment Form */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          <div className="bg-black/50 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
            <div className="flex items-center space-x-3 mb-6">
              <Lock className="w-6 h-6 text-netflix-red" />
              <h3 className="text-xl font-bold text-white">Payment Information</h3>
            </div>

            <div className="payment-element-container">
              <PaymentElement
                options={{
                  layout: 'tabs',
                  paymentMethodOrder: ['card'],
                  fields: {
                    billingDetails: 'never',
                  },
                }}
              />
            </div>
          </div>

          {/* Error Display */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -10, height: 0 }}
                className="bg-red-900/20 border border-red-500/30 rounded-xl p-4 overflow-hidden"
              >
                <div className="flex items-center space-x-3">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                  <span className="text-red-300">{error}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Security Features */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div className="flex flex-col items-center space-y-3">
                <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                  <Shield className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <div className="text-white font-semibold">SSL Encrypted</div>
                  <div className="text-white/60 text-sm">Bank-level security</div>
                </div>
              </div>

              <div className="flex flex-col items-center space-y-3">
                <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
                  <Check className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <div className="text-white font-semibold">PCI Compliant</div>
                  <div className="text-white/60 text-sm">Industry standard</div>
                </div>
              </div>

              <div className="flex flex-col items-center space-y-3">
                <div className="w-12 h-12 bg-netflix-red/20 rounded-full flex items-center justify-center">
                  <Lock className="w-6 h-6 text-netflix-red" />
                </div>
                <div>
                  <div className="text-white font-semibold">Secure Payment</div>
                  <div className="text-white/60 text-sm">Protected by Stripe</div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Submit Button */}
          <motion.button
            type="submit"
            disabled={!stripe || isProcessing}
            whileHover={{ scale: isProcessing ? 1 : 1.02 }}
            whileTap={{ scale: isProcessing ? 1 : 0.98 }}
            className="w-full bg-netflix-red hover:bg-red-700 disabled:bg-white/10 disabled:cursor-not-allowed disabled:text-white/40 text-white py-5 px-8 rounded-xl font-bold text-xl transition-all shadow-lg hover:shadow-netflix-red/25 flex items-center justify-center space-x-3"
          >
            {isProcessing ? (
              <>
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Processing Payment...</span>
              </>
            ) : (
              <>
                <span>Complete Payment ${amount.toFixed(2)}</span>
                <ArrowRight className="w-6 h-6" />
              </>
            )}
          </motion.button>

          {/* Terms & Conditions */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-white/40 text-sm text-center leading-relaxed"
          >
            By completing this purchase, you agree to our{' '}
            <a
              href="/terms"
              className="text-netflix-red hover:text-white transition-colors underline"
            >
              Terms of Service
            </a>{' '}
            and{' '}
            <a
              href="/privacy"
              className="text-netflix-red hover:text-white transition-colors underline"
            >
              Privacy Policy
            </a>
            . All sales are final.
          </motion.p>
        </motion.form>
      </motion.div>
    </div>
  );
}

// Main component that handles the two-step process
export function PaymentForm(props: PaymentFormProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState({
    name: '',
    email: '',
    phone: '',
    address: {
      line1: '',
      line2: '',
      city: '',
      state: '',
      postal_code: '',
    },
  });

  const handleCreatePaymentIntent = async () => {
    if (
      !userInfo.name ||
      !userInfo.email ||
      !userInfo.address.line1 ||
      !userInfo.address.city ||
      !userInfo.address.state ||
      !userInfo.address.postal_code
    ) {
      setError('Please fill in all required fields');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          showtimeId: props.showtimeId,
          theaterId: props.theaterId,
          selectedSeats: props.selectedSeatDetails.map((seat) => ({
            row: seat.id.slice(0, 1),
            number: parseInt(seat.id.slice(1)),
            price: seat.price || 18.0,
            seatType: seat.type,
          })),
          tickets: props.selectedSeatDetails.map((seat) => ({
            seatId: seat.id,
            type: 'ADULT',
            price: seat.price || 18.0,
          })),
          userEmail: userInfo.email,
          userName: userInfo.name,
          userPhone: userInfo.phone,
          totalAmount: props.amount,
        }),
      });

      const data = await response.json();

      if (data.error) {
        setError(data.error);
      } else {
        setClientSecret(data.clientSecret);
      }
    } catch (err) {
      setError('Failed to create payment intent');
    }

    setIsProcessing(false);
  };

  // User Information Step
  if (!clientSecret) {
    return (
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Header */}
          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
              className="w-20 h-20 bg-netflix-red rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-netflix-red/25"
            >
              <User className="w-10 h-10 text-white" />
            </motion.div>
            <h2 className="text-3xl font-bold text-white mb-3">Contact Information</h2>
            <p className="text-white/60 text-lg">We'll send your tickets to this email address</p>
          </div>

          {/* Order Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-black/50 backdrop-blur-xl border border-white/10 rounded-2xl p-8"
          >
            <div className="flex items-center space-x-3 mb-6">
              <Sparkles className="w-6 h-6 text-netflix-red" />
              <h3 className="text-xl font-bold text-white">Order Summary</h3>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-white font-bold text-lg">{props.movie.title}</div>
                  <div className="text-white/60">
                    {props.showtime.date} at {props.showtime.time}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-white/60 text-sm">
                    {props.selectedSeats.length} ticket{props.selectedSeats.length !== 1 ? 's' : ''}
                  </div>
                  <div className="text-white font-medium">
                    Seats: {props.selectedSeats.join(', ')}
                  </div>
                </div>
              </div>

              <div className="border-t border-white/10 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-xl font-bold text-white">Total</span>
                  <span className="text-3xl font-bold text-netflix-red">
                    ${props.amount.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-black/50 backdrop-blur-xl border border-white/10 rounded-2xl p-8 space-y-6"
          >
            <h3 className="text-xl font-bold text-white mb-6">Your Details</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-white font-semibold mb-3">
                  Full Name <span className="text-netflix-red">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
                  <input
                    type="text"
                    value={userInfo.name}
                    onChange={(e) => setUserInfo({ ...userInfo, name: e.target.value })}
                    className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 text-white rounded-xl focus:border-netflix-red focus:outline-none focus:bg-white/10 transition-all placeholder-white/40"
                    placeholder="Enter your full name"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-white font-semibold mb-3">
                  Email Address <span className="text-netflix-red">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
                  <input
                    type="email"
                    value={userInfo.email}
                    onChange={(e) => setUserInfo({ ...userInfo, email: e.target.value })}
                    className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 text-white rounded-xl focus:border-netflix-red focus:outline-none focus:bg-white/10 transition-all placeholder-white/40"
                    placeholder="your@email.com"
                    required
                  />
                </div>
                <p className="text-white/40 text-sm mt-2">Your tickets will be sent here</p>
              </div>

              <div>
                <label className="block text-white font-semibold mb-3">
                  Phone Number <span className="text-white/40">(Optional)</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
                  <input
                    type="tel"
                    value={userInfo.phone}
                    onChange={(e) => setUserInfo({ ...userInfo, phone: e.target.value })}
                    className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 text-white rounded-xl focus:border-netflix-red focus:outline-none focus:bg-white/10 transition-all placeholder-white/40"
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
              </div>
            </div>

            {/* Address Fields */}
            <div className="space-y-6 pt-6 border-t border-white/10">
              <h4 className="text-white font-semibold">Billing Address</h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-white font-medium mb-3">
                    Street Address <span className="text-netflix-red">*</span>
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
                    <input
                      type="text"
                      value={userInfo.address.line1}
                      onChange={(e) =>
                        setUserInfo({
                          ...userInfo,
                          address: { ...userInfo.address, line1: e.target.value },
                        })
                      }
                      className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 text-white rounded-xl focus:border-netflix-red focus:outline-none focus:bg-white/10 transition-all placeholder-white/40"
                      placeholder="123 Main Street"
                      required
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-white font-medium mb-3">
                    Apartment, Suite, etc. <span className="text-white/40">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={userInfo.address.line2}
                    onChange={(e) =>
                      setUserInfo({
                        ...userInfo,
                        address: { ...userInfo.address, line2: e.target.value },
                      })
                    }
                    className="w-full px-4 py-4 bg-white/5 border border-white/10 text-white rounded-xl focus:border-netflix-red focus:outline-none focus:bg-white/10 transition-all placeholder-white/40"
                    placeholder="Apartment, suite, unit, etc."
                  />
                </div>

                <div>
                  <label className="block text-white font-medium mb-3">
                    City <span className="text-netflix-red">*</span>
                  </label>
                  <input
                    type="text"
                    value={userInfo.address.city}
                    onChange={(e) =>
                      setUserInfo({
                        ...userInfo,
                        address: { ...userInfo.address, city: e.target.value },
                      })
                    }
                    className="w-full px-4 py-4 bg-white/5 border border-white/10 text-white rounded-xl focus:border-netflix-red focus:outline-none focus:bg-white/10 transition-all placeholder-white/40"
                    placeholder="New York"
                    required
                  />
                </div>

                <div>
                  <label className="block text-white font-medium mb-3">
                    State <span className="text-netflix-red">*</span>
                  </label>
                  <select
                    value={userInfo.address.state}
                    onChange={(e) =>
                      setUserInfo({
                        ...userInfo,
                        address: { ...userInfo.address, state: e.target.value },
                      })
                    }
                    className="w-full px-4 py-4 bg-white/5 border border-white/10 text-white rounded-xl focus:border-netflix-red focus:outline-none focus:bg-white/10 transition-all"
                    required
                  >
                    <option value="">Select State</option>
                    <option value="CA">California</option>
                    <option value="NY">New York</option>
                    <option value="TX">Texas</option>
                    <option value="FL">Florida</option>
                    <option value="IL">Illinois</option>
                    {/* Add more states as needed */}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-white font-medium mb-3">
                    ZIP Code <span className="text-netflix-red">*</span>
                  </label>
                  <input
                    type="text"
                    value={userInfo.address.postal_code}
                    onChange={(e) =>
                      setUserInfo({
                        ...userInfo,
                        address: { ...userInfo.address, postal_code: e.target.value },
                      })
                    }
                    className="w-full px-4 py-4 bg-white/5 border border-white/10 text-white rounded-xl focus:border-netflix-red focus:outline-none focus:bg-white/10 transition-all placeholder-white/40"
                    placeholder="10001"
                    required
                  />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Error Display */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -10, height: 0 }}
                className="bg-red-900/20 border border-red-500/30 rounded-xl p-4 overflow-hidden"
              >
                <div className="flex items-center space-x-3">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                  <span className="text-red-300">{error}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Continue Button */}
          <motion.button
            onClick={handleCreatePaymentIntent}
            disabled={
              !userInfo.name ||
              !userInfo.email ||
              !userInfo.address.line1 ||
              !userInfo.address.city ||
              !userInfo.address.state ||
              !userInfo.address.postal_code ||
              isProcessing
            }
            whileHover={{ scale: isProcessing ? 1 : 1.02 }}
            whileTap={{ scale: isProcessing ? 1 : 0.98 }}
            className="w-full bg-netflix-red hover:bg-red-700 disabled:bg-white/10 disabled:cursor-not-allowed disabled:text-white/40 text-white py-5 px-8 rounded-xl font-bold text-xl transition-all shadow-lg hover:shadow-netflix-red/25 flex items-center justify-center space-x-3"
          >
            {isProcessing ? (
              <>
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Processing...</span>
              </>
            ) : (
              <>
                <span>Continue to Payment</span>
                <ArrowRight className="w-6 h-6" />
              </>
            )}
          </motion.button>

          {/* Security Notice */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex items-center justify-center space-x-3 text-white/40"
          >
            <Shield className="w-5 h-5" />
            <span className="text-sm">Your information is secure and encrypted</span>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  // Payment Step with Stripe Elements
  return (
    <Elements
      stripe={getStripe()}
      options={{
        clientSecret,
        appearance: {
          theme: 'night',
          variables: {
            colorPrimary: '#E50914',
            colorBackground: 'rgba(0, 0, 0, 0.5)',
            colorText: '#ffffff',
            colorDanger: '#ef4444',
            fontFamily: 'system-ui, sans-serif',
            spacingUnit: '4px',
            borderRadius: '12px',
            focusBoxShadow: '0 0 0 2px #E50914',
          },
          rules: {
            '.Input': {
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              padding: '16px',
            },
            '.Input:focus': {
              border: '1px solid #E50914',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
            },
          },
        },
      }}
    >
      <PaymentFormInner {...props} clientSecret={clientSecret} userInfo={userInfo} />
    </Elements>
  );
}

// Wrapper component for the booking page
export function PaymentFormWrapper(props: PaymentFormProps) {
  return (
    <div className="bg-black/50 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
      <PaymentForm {...props} />
    </div>
  );
}
