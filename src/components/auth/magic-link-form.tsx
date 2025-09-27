'use client';

import { signIn } from '@/lib/auth-client';
import { AlertCircle, ArrowRight, Mail, User } from 'lucide-react';
import { useState } from 'react';

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
        callbackURL: '/movies',
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
      <div className="w-full">
        <div className="bg-black/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
          {/* Success */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-netflix-red rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-white" />
            </div>

            <h2 className="text-2xl font-bold text-white mb-2">Check Your Email</h2>
            <p className="text-white/60 mb-2">We've sent a secure sign-in link to</p>
            <p className="text-netflix-red font-semibold">{email}</p>
          </div>

          {/* Instructions */}
          <div className="bg-white/5 rounded-xl p-4 mb-6 border border-white/10">
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-netflix-red rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs font-bold">1</span>
                </div>
                <div>
                  <h3 className="text-white font-semibold text-sm mb-1">Check Your Inbox</h3>
                  <p className="text-white/60 text-xs">Look for an email from CinemaX</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-netflix-red rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs font-bold">2</span>
                </div>
                <div>
                  <h3 className="text-white font-semibold text-sm mb-1">Click the Magic Link</h3>
                  <p className="text-white/60 text-xs">You'll be signed in automatically</p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={() => {
                setEmailSent(false);
                setEmail('');
                setName('');
                setError('');
              }}
              className="w-full bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/40 text-white py-3 px-4 rounded-xl transition-colors font-semibold"
            >
              Send Another Link
            </button>
            <button
              onClick={() => (window.location.href = '/')}
              className="w-full text-white/60 hover:text-white py-2 transition-colors text-sm"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main Form
  return (
    <div className="w-full">
      <div className="bg-black/50 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 text-center">
          <h1 className="text-2xl font-bold text-white mb-2">
            {isSignUp ? 'Join CinemaX' : 'Welcome Back'}
          </h1>
          <p className="text-white/60 text-sm">
            {isSignUp
              ? 'Create your account with just your email'
              : 'Sign in with a secure magic link'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 pb-6">
          {/* Error Alert */}
          {error && (
            <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-4 mb-4">
              <div className="flex items-center space-x-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Name Field (Sign Up) */}
          {isSignUp && (
            <div className="mb-4">
              <label
                htmlFor="name"
                className="block text-white font-semibold mb-2 flex items-center space-x-2"
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
                className="w-full bg-white/5 border border-white/10 text-white placeholder-white/40 px-4 py-3 rounded-xl focus:border-netflix-red focus:outline-none focus:bg-white/10 transition-colors"
              />
            </div>
          )}

          {/* Email Field */}
          <div className="mb-6">
            <label
              htmlFor="email"
              className="block text-white font-semibold mb-2 flex items-center space-x-2"
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
              className="w-full bg-white/5 border border-white/10 text-white placeholder-white/40 px-4 py-3 rounded-xl focus:border-netflix-red focus:outline-none focus:bg-white/10 transition-colors"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || !email.trim() || (isSignUp && !name.trim())}
            className="w-full bg-netflix-red hover:bg-red-700 disabled:bg-white/10 disabled:cursor-not-allowed disabled:text-white/40 text-white py-3 px-6 rounded-xl font-bold transition-colors flex items-center justify-center space-x-3 shadow-lg"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Sending...</span>
              </>
            ) : (
              <>
                <span>{isSignUp ? 'Create Account' : 'Send Magic Link'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {/* Toggle Sign Up/In */}
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError('');
                setName('');
              }}
              disabled={isLoading}
              className="text-white/60 hover:text-white transition-colors disabled:opacity-50 text-sm"
            >
              {isSignUp
                ? 'Already have an account? Sign in instead'
                : 'New to CinemaX? Create an account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
