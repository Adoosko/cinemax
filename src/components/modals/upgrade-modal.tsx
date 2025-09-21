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
import { CheckCircle, Film, Sparkles, Users, Ticket, X } from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import { motion, AnimatePresence } from 'framer-motion';
import { ScrollArea } from '../ui/scroll-area';

const PLANS = [
  {
    name: 'Free',
    description: 'Enjoy all 4K movies. Limit: 2 movies/month.',
    price: '€0',
    planKey: 'free',
    limit: '2 movies / month',
    cta: 'Current plan',
    disabled: true,
  },
  {
    name: 'CINEMX+ Popcorn Flex (Monthly)',
    description: 'Unlimited streaming – billed monthly.',
    price: '3$',
    planKey: 'monthly',
    limit: 'Unlimited movies',
    cta: 'Go Monthly',
    highlight: false,
    slug: 'cinemx-monthly',
  },
  {
    name: 'CINEMX+ Marathon Master (Yearly)',
    description: 'Unlimited streaming. Save 25% vs monthly.',
    price: '25$',
    planKey: 'yearly',
    limit: 'Unlimited movies',
    cta: 'Go Yearly',
    highlight: true,
    slug: 'cinemx-yearly',
  },
];

export function UpgradeModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [loadingSlug, setLoadingSlug] = useState<string | null>(null);

  const handleUpgrade = async (slug: string) => {
    setLoadingSlug(slug);
    try {
      await authClient.checkout({ slug });
    } finally {
      setLoadingSlug(null);
    }
  };

  if (typeof window !== 'undefined') {
    document.body.style.overflow = open ? 'hidden' : 'auto';
  }

  return (
    <div>
      {open && (
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent className="z-[100] max-h-[95vh] sm:max-h-[90vh] w-[95vw] sm:max-w-[95vw] md:max-w-[90vw] lg:max-w-[85vw] xl:max-w-[1100px] rounded-2xl bg-black/90 border border-white/10 shadow-2xl p-0 overflow-hidden backdrop-blur-md">
            <DialogHeader>
              <DialogTitle asChild>
                <div className="flex flex-col items-center mt-4 sm:mt-6">
                  <div className="bg-netflix-red rounded-full p-3 sm:p-4 shadow-xl flex items-center justify-center mb-3 sm:mb-4">
                    <Film className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                  </div>
                  <div className="flex flex-wrap justify-center items-center gap-1 sm:gap-2 text-xl sm:text-2xl md:text-3xl font-bold text-white mt-1 sm:mt-2">
                    <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-netflix-red" />
                    <span>Pick Your CINEMX+ Plan</span>
                    <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-netflix-red" />
                  </div>
                </div>
              </DialogTitle>
              <DialogDescription asChild>
                <div className="text-white/70 mt-2 sm:mt-3 text-center max-w-xl mx-auto text-sm sm:text-base font-normal px-4">
                  All plans include <b>4K streaming</b>, instant playback, and our full movie
                  catalog.
                  <br className="hidden sm:block" />
                  <span className="sm:hidden"> </span>
                  Only difference? How many movies you can watch!
                </div>
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="w-full pb-2 h-auto max-h-[calc(100vh-230px)] sm:max-h-[calc(90vh-200px)]">
              <div className="flex flex-col sm:grid sm:grid-cols-2 lg:flex lg:flex-row gap-4 sm:gap-6 lg:gap-8 justify-center items-stretch px-2 sm:px-4 py-4 mb-4">
                {PLANS.map((plan) => (
                  <motion.div
                    key={plan.planKey}
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: plan.highlight ? 0.23 : 0.13 }}
                    className={`
                    flex flex-col items-center rounded-2xl w-full sm:min-w-0 lg:w-[calc(33%-1rem)] xl:w-[300px] px-4 sm:px-5 py-6 sm:py-7 bg-white/5
                    ${plan.highlight ? 'shadow-2xl ring-2 ring-netflix-red border border-netflix-red' : 'border border-white/10'}
                    relative transition-all h-full
                  `}
                    style={{ minWidth: 0 }}
                  >
                    {plan.highlight && (
                      <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-netflix-red text-white px-4 py-1 rounded-full text-xs font-black shadow">
                        Best Value
                      </div>
                    )}
                    <div className="font-bold text-xl text-white mb-1 mt-2">{plan.name}</div>
                    <div className="text-netflix-red font-black text-3xl mb-2">{plan.price}</div>
                    <div className="text-white/70 pb-2 text-center min-h-[44px]">
                      {plan.description}
                    </div>
                    <ul className="mb-4 space-y-2 mt-2 text-white/90 text-sm text-left w-full">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                        <span>Full 4K Quality</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                        <span>All movies unlocked</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                        <span>True instant streaming</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                        <div className="flex flex-wrap items-center gap-1">
                          <span>Watch-party invites</span>
                          <Users className="w-4 h-4 text-white/70" />
                          <span className="text-xs text-white/70">
                            Up to 5 guests (no signup needed)
                          </span>
                        </div>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                        <span>{plan.limit}</span>
                      </li>
                    </ul>
                    {/* CTA button */}
                    <div className="mt-auto w-full">
                      {plan.disabled ? (
                        <div className="rounded bg-white/10 text-white/60 px-4 py-2 font-semibold text-center">
                          Current plan
                        </div>
                      ) : (
                        <Button
                          className={`
                          w-full text-lg font-bold rounded-lg transition py-3
                          ${
                            plan.highlight
                              ? 'bg-netflix-red hover:bg-red-700'
                              : 'bg-white/20 hover:bg-netflix-red hover:text-white'
                          }
                        `}
                          onClick={() => plan.slug && handleUpgrade(plan.slug)}
                          type="button"
                          disabled={!!loadingSlug}
                        >
                          {loadingSlug === plan.slug ? (
                            <>
                              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></span>
                              Redirecting...
                            </>
                          ) : (
                            plan.cta
                          )}
                        </Button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </ScrollArea>

            <div className="text-white/80 text-sm sm:text-base text-center mt-3 mb-2 px-4">
              <Ticket className="inline-block w-4 h-4 sm:w-5 sm:h-5 mr-1 text-green-500" />
              <span className="font-semibold text-green-300">Cancel anytime.</span>
              <span className="hidden sm:inline">
                No hidden fees. Downgrade in 2 clicks if you change your mind.
              </span>
              <span className="inline sm:hidden">No hidden fees.</span>
            </div>
            <div className="text-white/40 text-xs pb-2 text-center px-4">
              Built for real movie fans and shared moments — not for "gotchas."
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
