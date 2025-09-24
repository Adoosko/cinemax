'use client';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle, Film, Sparkles, Ticket } from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import { motion } from 'framer-motion';
import { ScrollArea } from '../ui/scroll-area';

const PLANS = [
  {
    name: 'Free',
    description: 'Watch 2 movies/month with ads.',
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
          <DialogContent className="z-[100] max-h-[95vh] sm:max-h-[90vh] w-[95vw] sm:max-w-[95vw] md:max-w-[90vw] lg:max-w-[85vw] xl:max-w-[1000px] rounded-2xl bg-black/95 border border-white/10 shadow-2xl p-0 overflow-hidden backdrop-blur-xl">
            <DialogHeader className="pb-4">
              <DialogTitle asChild>
                <div className="flex flex-col items-center pt-6 pb-2">
                  <div className="flex items-center gap-2 mt-4">
                    <Sparkles className="w-4 h-4 text-netflix-red" />
                    <h2 className="text-lg font-bold text-white">Choose Your CINEMX+ Plan</h2>
                    <Sparkles className="w-4 h-4 text-netflix-red" />
                  </div>
                </div>
              </DialogTitle>
              <DialogDescription asChild>
                <div className="text-white/60 text-center max-w-lg mx-auto text-sm px-6">
                  Remove ads and watch unlimited movies with premium quality streaming
                </div>
              </DialogDescription>
            </DialogHeader>

            <ScrollArea className="w-full px-6 pb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
                {PLANS.map((plan) => (
                  <motion.div
                    key={plan.planKey}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: plan.highlight ? 0.2 : 0.1 }}
                    className={`
                    relative rounded-xl border p-6 bg-black/50 backdrop-blur-sm
                    ${
                      plan.highlight
                        ? 'border-netflix-red ring-1 ring-netflix-red/50 shadow-lg shadow-netflix-red/20'
                        : 'border-white/10'
                    }
                    ${plan.disabled ? 'opacity-60' : 'hover:border-white/20 transition-colors'}
                    `}
                  >
                    {plan.highlight && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-netflix-red text-white px-3 py-1 rounded-full text-xs font-semibold shadow-md">
                        Best Value
                      </div>
                    )}

                    <div className="text-center mb-4">
                      <h3 className="text-white font-semibold text-sm mb-2">{plan.name}</h3>
                      <div className="text-netflix-red font-bold text-2xl mb-1">{plan.price}</div>
                      <p className="text-white/60 text-xs leading-relaxed">{plan.description}</p>
                    </div>

                    <ul className="space-y-2 mb-6 text-white/80 text-xs">
                      {plan.planKey === 'free' ? (
                        <>
                          <li className="flex items-center gap-2">
                            <CheckCircle className="w-3 h-3 text-green-400 flex-shrink-0" />
                            <span>4K Ultra HD streaming</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle className="w-3 h-3 text-green-400 flex-shrink-0" />
                            <span>2 movies per month</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="w-3 h-3 bg-yellow-400 rounded-full flex items-center justify-center text-black text-[10px] font-bold flex-shrink-0">
                              !
                            </span>
                            <span>Ads may appear</span>
                          </li>
                        </>
                      ) : (
                        <>
                          <li className="flex items-center gap-2">
                            <CheckCircle className="w-3 h-3 text-green-400 flex-shrink-0" />
                            <span>4K Ultra HD streaming</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle className="w-3 h-3 text-green-400 flex-shrink-0" />
                            <span>Unlimited movies</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle className="w-3 h-3 text-green-400 flex-shrink-0" />
                            <span>No ads</span>
                          </li>
                        </>
                      )}
                    </ul>

                    {plan.disabled ? (
                      <div className="w-full bg-white/20 text-white/60 py-2 px-4 rounded-lg text-sm font-medium text-center">
                        Current Plan
                      </div>
                    ) : (
                      <Button
                        variant="premium"
                        size="sm"
                        className="w-full"
                        onClick={() => plan.slug && handleUpgrade(plan.slug)}
                        disabled={!!loadingSlug}
                      >
                        {loadingSlug === plan.slug ? (
                          <>
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></span>
                            Processing...
                          </>
                        ) : (
                          plan.cta
                        )}
                      </Button>
                    )}
                  </motion.div>
                ))}
              </div>

              <div className="mt-6 text-center">
                <div className="flex items-center justify-center gap-2 text-white/60 text-xs mb-2">
                  <Ticket className="w-3 h-3 text-green-400" />
                  <span className="font-medium text-green-300">Cancel anytime</span>
                </div>
                <p className="text-white/40 text-xs">No hidden fees • Built for movie lovers</p>
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
