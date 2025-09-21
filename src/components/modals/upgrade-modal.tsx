'use client';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle, Film, Sparkles, X } from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import { motion, AnimatePresence } from 'framer-motion';

export function UpgradeModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      await authClient.checkout({ slug: 'cinemx-yearly ' }); // use your slug
    } finally {
      setLoading(false);
    }
  };

  // Lock body scroll when modal is open
  if (typeof window !== 'undefined') {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
  }

  return (
    <AnimatePresence>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md rounded-2xl bg-black/90 border border-white/10 shadow-2xl p-0 overflow-hidden backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Header and Icon */}
            <DialogHeader className="flex flex-col items-center gap-3 pt-10">
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                className="bg-netflix-red rounded-full p-4 shadow-xl flex items-center justify-center"
              >
                <Film className="w-10 h-10 text-white" />
              </motion.div>
              <DialogTitle className="text-2xl md:text-3xl flex gap-2 items-center text-white font-bold mt-3">
                <motion.div
                  animate={{ rotate: [0, 15, -15, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 3 }}
                >
                  <Sparkles className="w-6 h-6 text-netflix-red" />
                </motion.div>
                Go Premium
                <motion.div
                  animate={{ rotate: [0, -15, 15, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 3 }}
                >
                  <Sparkles className="w-6 h-6 text-netflix-red" />
                </motion.div>
              </DialogTitle>
              <DialogDescription className="text-white/70 text-center text-base font-normal px-6">
                Unlock unlimited movies,{' '}
                <span className="text-netflix-red font-bold">ad-free bingeing</span>, and more with{' '}
                <span className="font-semibold">CinemaX+</span>!
              </DialogDescription>
            </DialogHeader>

            {/* Perks */}
            <div className="mt-8 px-10">
              <ul className="space-y-4 text-white/80 text-base">
                {[
                  'Unlimited streaming',
                  'No ads, ever',
                  'Access exclusive content',
                  'Premium support',
                ].map((perk, index) => (
                  <motion.li
                    key={perk}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + index * 0.1 }}
                    className="flex items-center gap-3"
                  >
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span>{perk}</span>
                  </motion.li>
                ))}
              </ul>
            </div>

            {/* CTA Button */}
            <div className="mt-10 px-10 mb-10">
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Button
                  className="w-full bg-netflix-red hover:bg-red-700 text-white font-semibold text-lg py-6 rounded-xl shadow-lg transition-all duration-300"
                  onClick={handleUpgrade}
                  type="button"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></span>
                      Redirecting...
                    </>
                  ) : (
                    'Upgrade to CinemaX+'
                  )}
                </Button>
              </motion.div>
              <div className="text-white/40 text-xs mt-4 text-center">
                Cancel anytime. Secure checkout powered by Polar.
              </div>
            </div>
          </motion.div>

          <DialogClose asChild>
            <motion.button
              whileHover={{ scale: 1.2, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              transition={{ duration: 0.2 }}
              aria-label="Close"
              className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 p-2 rounded-full text-white/60 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </motion.button>
          </DialogClose>
        </DialogContent>
      </Dialog>
    </AnimatePresence>
  );
}
