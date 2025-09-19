'use client';

import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

interface ProgressStep {
  step: number;
  title: string;
}

interface ProgressBarProps {
  currentStep: number;
  className?: string;
}

export function ProgressBar({ currentStep, className = '' }: ProgressBarProps) {
  const steps: ProgressStep[] = [
    { step: 1, title: 'Select Showtime' },
    { step: 2, title: 'Select Seats' },
    { step: 3, title: 'Choose Tickets' },
    { step: 4, title: 'Payment' },
    { step: 5, title: 'Complete' },
  ];

  return (
    <div
      className={`bg-neutral-950/80 backdrop-blur-sm border-b border-neutral-800 px-4 py-6 ${className}`}
    >
      <div className="max-w-7xl mx-auto">
        {/* Mobile: Vertical Layout */}
        <div className="block lg:hidden">
          <div className="flex flex-col space-y-4">
            {steps.map((item, index) => (
              <div key={item.step} className="flex items-center space-x-4">
                {/* Step Circle */}
                <motion.div
                  className={`
                    relative w-8 h-8 border-2 flex items-center justify-center text-xs font-bold rounded-full flex-shrink-0
                    transition-all duration-300
                    ${
                      currentStep >= item.step
                        ? 'bg-gradient-to-b from-red-500 to-red-600 text-white border-red-400 shadow-lg shadow-red-500/25'
                        : 'bg-neutral-950 text-neutral-400 border-neutral-700'
                    }
                  `}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  {currentStep > item.step ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      <Check className="w-4 h-4" />
                    </motion.div>
                  ) : (
                    <span>{item.step}</span>
                  )}

                  {/* Glow effect for current step */}
                  {currentStep === item.step && (
                    <div className="absolute inset-0 rounded-full bg-red-500/30 animate-pulse" />
                  )}
                </motion.div>

                {/* Step Title and Progress */}
                <div className="flex-1 min-w-0">
                  <motion.div
                    className={`
                      text-sm font-medium transition-colors duration-300
                      ${currentStep >= item.step ? 'text-white' : 'text-gray-400'}
                    `}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 + 0.1 }}
                  >
                    {item.title}
                  </motion.div>

                  {/* Mini progress bar for mobile */}
                  {currentStep === item.step && (
                    <motion.div
                      className="w-full bg-neutral-800 rounded-full h-1 mt-1"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <div className="h-full bg-gradient-to-r from-red-500 to-red-600 rounded-full animate-pulse w-1/2" />
                    </motion.div>
                  )}
                </div>

                {/* Status indicator */}
                <div className="text-xs text-gray-500 flex-shrink-0">
                  {currentStep > item.step ? '✓' : currentStep === item.step ? '●' : '○'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Desktop: Horizontal Layout */}
        <div className="hidden lg:flex items-center justify-center space-x-8">
          {steps.map((item, index) => (
            <div key={item.step} className="flex items-center">
              <div className="flex items-center space-x-3">
                {/* Step Circle */}
                <motion.div
                  className={`
                    relative w-10 h-10 border-2 flex items-center justify-center text-sm font-bold rounded-full
                    transition-all duration-300
                    ${
                      currentStep >= item.step
                        ? 'bg-gradient-to-b from-red-500 to-red-600 text-white border-red-400 shadow-lg shadow-red-500/25'
                        : 'bg-neutral-950 text-neutral-400 border-neutral-700 hover:border-neutral-600'
                    }
                  `}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                >
                  {currentStep > item.step ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      <Check className="w-5 h-5" />
                    </motion.div>
                  ) : (
                    <span>{item.step}</span>
                  )}

                  {/* Glow effect for current step */}
                  {currentStep === item.step && (
                    <div className="absolute inset-0 rounded-full bg-red-500/30 animate-pulse" />
                  )}
                </motion.div>

                {/* Step Title */}
                <motion.span
                  className={`
                    text-sm font-medium transition-colors duration-300
                    ${currentStep >= item.step ? 'text-white' : 'text-gray-400'}
                  `}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 + 0.1 }}
                >
                  {item.title}
                </motion.span>
              </div>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <motion.div
                  className={`
                    w-12 h-px mx-6 transition-all duration-500
                    ${
                      currentStep > item.step
                        ? 'bg-gradient-to-r from-red-500 to-red-400'
                        : 'bg-neutral-700'
                    }
                  `}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: index * 0.1 + 0.2, duration: 0.5 }}
                />
              )}
            </div>
          ))}
        </div>

        {/* Progress Percentage - Desktop Only */}
        <div className="mt-4 text-center hidden lg:block">
          <div className="text-xs text-gray-400">
            Step {currentStep} of {steps.length}
          </div>
          <div className="w-full bg-neutral-800 rounded-full h-1 mt-2 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-red-500 to-red-600 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(currentStep / steps.length) * 100}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
