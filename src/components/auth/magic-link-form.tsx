'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { signIn } from '@/lib/auth-client';
import {
  Mail,
  CheckCircle,
  ArrowRight,
  Shield,
  Zap,
  User,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

export function MagicLinkForm() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await signIn.magicLink({
        email,
        ...(isSignUp && name && { name }),
        callbackURL: '/',
      });

      if (result.error) {
        setError(result.error.message || 'Failed to send magic link');
        return;
      }

      setEmailSent(true);
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Magic link error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Success State
  if (emailSent) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full"
      >
        <div className="bg-black/50 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
          {/* Success Animation */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                delay: 0.2,
                type: 'spring',
                stiffness: 200,
                duration: 0.8,
              }}
              className="relative w-20 h-20 mx-auto mb-6"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-netflix-red to-red-700 rounded-full flex items-center justify-center">
                <Mail className="w-10 h-10 text-white" />
              </div>
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1, duration: 0.5 }}
                className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center"
              >
                <CheckCircle className="w-5 h-5 text-white" />
              </motion.div>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-3xl font-bold text-white mb-3"
            >
              Check Your Email
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-white/60 mb-2"
            >
              We've sent a secure sign-in link to
            </motion.p>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="text-netflix-red font-semibold text-lg"
            >
              {email}
            </motion.p>
          </div>

          {/* Instructions */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-white/5 backdrop-blur-sm rounded-xl p-6 mb-6 border border-white/10"
          >
            <div className="space-y-4">
              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-netflix-red rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-sm font-bold">1</span>
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">Check Your Inbox</h3>
                  <p className="text-white/60 text-sm">
                    Look for an email from CinemaX in your inbox
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-netflix-red rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-sm font-bold">2</span>
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">Click the Magic Link</h3>
                  <p className="text-white/60 text-sm">
                    You'll be signed in automatically and securely
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Security Notice */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="flex items-center justify-center space-x-2 text-sm text-white/40 mb-8"
          >
            <Shield className="w-4 h-4" />
            <span>Link expires in 5 minutes for your security</span>
          </motion.div>

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="space-y-3"
          >
            <button
              onClick={() => {
                setEmailSent(false);
                setEmail('');
                setName('');
                setError('');
              }}
              className="w-full bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/40 text-white py-3 px-4 rounded-xl transition-all duration-200 font-semibold"
            >
              Send Another Link
            </button>
            <button
              onClick={() => (window.location.href = '/')}
              className="w-full text-white/60 hover:text-white py-2 transition-colors text-sm"
            >
              Back to Home
            </button>
          </motion.div>
        </div>
      </motion.div>
    );
  }

  // Main Form
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full">
      <div className="bg-black/50 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-8 pt-8 pb-6 text-center">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
          >
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Sparkles className="w-6 h-6 text-netflix-red" />
              <h1 className="text-3xl font-bold text-white">
                {isSignUp ? 'Join CinemaX' : 'Welcome Back'}
              </h1>
              <Sparkles className="w-6 h-6 text-netflix-red" />
            </div>
            <p className="text-white/60 text-lg">
              {isSignUp
                ? 'Create your account with just your email'
                : 'Sign in with a secure magic link'}
            </p>
          </motion.div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-8 pb-8">
          {/* Error Alert */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                className="bg-red-900/20 border border-red-500/30 rounded-xl p-4 overflow-hidden"
              >
                <div className="flex items-center space-x-3">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Name Field (Sign Up) */}
          <AnimatePresence>
            {isSignUp && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                className="overflow-hidden"
              >
                <label
                  htmlFor="name"
                  className="block text-white font-semibold mb-3 flex items-center space-x-2"
                >
                  <User className="w-4 h-4 text-netflix-red" />
                  <span>Full Name</span>
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  required={isSignUp}
                  disabled={isLoading}
                  className="w-full bg-white/5 border border-white/10 text-white placeholder-white/40 px-4 py-4 rounded-xl focus:border-netflix-red focus:outline-none focus:bg-white/10 transition-all"
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Email Field */}
          <div className="mb-6">
            <label
              htmlFor="email"
              className="block text-white font-semibold mb-3 flex items-center space-x-2"
            >
              <Mail className="w-4 h-4 text-netflix-red" />
              <span>Email Address</span>
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              disabled={isLoading}
              className="w-full bg-white/5 border border-white/10 text-white placeholder-white/40 px-4 py-4 rounded-xl focus:border-netflix-red focus:outline-none focus:bg-white/10 transition-all"
            />
          </div>

          {/* Submit Button */}
          <motion.button
            type="submit"
            disabled={isLoading || !email.trim() || (isSignUp && !name.trim())}
            whileHover={{ scale: isLoading ? 1 : 1.02 }}
            whileTap={{ scale: isLoading ? 1 : 0.98 }}
            className="w-full bg-netflix-red hover:bg-red-700 disabled:bg-white/10 disabled:cursor-not-allowed disabled:text-white/40 text-white py-4 px-6 rounded-xl font-bold text-lg transition-all duration-200 flex items-center justify-center space-x-3 group shadow-lg hover:shadow-netflix-red/25"
          >
            {isLoading ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full"
                />
                <span>Sending Magic...</span>
              </>
            ) : (
              <>
                <span>{isSignUp ? 'Create Account' : 'Send Magic Link'}</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </motion.button>

          {/* Toggle Sign Up/In */}
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError('');
                setName('');
              }}
              disabled={isLoading}
              className="text-white/60 hover:text-white transition-colors disabled:opacity-50 font-medium"
            >
              {isSignUp
                ? 'Already have an account? Sign in instead'
                : 'New to CinemaX? Create an account'}
            </button>
          </div>
        </form>

        {/* Footer */}
        <div className="px-8 py-6 bg-white/5 border-t border-white/10">
          <div className="flex items-center justify-center space-x-6 text-sm text-white/40">
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4" />
              <span>Secure</span>
            </div>
            <div className="w-1 h-1 bg-white/40 rounded-full"></div>
            <div className="flex items-center space-x-2">
              <Zap className="w-4 h-4" />
              <span>Instant</span>
            </div>
            <div className="w-1 h-1 bg-white/40 rounded-full"></div>
            <span>No Password</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
