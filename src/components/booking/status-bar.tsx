'use client';

import { motion } from 'framer-motion';
import { Wifi, WifiOff, Eye, Timer, Signal } from 'lucide-react';

interface StatusBarProps {
  connectionStatus: 'connected' | 'connecting' | 'disconnected' | 'error';
  onlineUsers: number;
  showTimer: boolean;
  sessionTimer: number;
  formatTime: (seconds: number) => string;
  className?: string;
}

export function StatusBar({
  connectionStatus,
  onlineUsers,
  showTimer,
  sessionTimer,
  formatTime,
  className = '',
}: StatusBarProps) {
  const getConnectionIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Wifi className="w-4 h-4 text-emerald-400" />;
      case 'connecting':
        return <Signal className="w-4 h-4 text-amber-400 animate-pulse" />;
      case 'error':
        return <WifiOff className="w-4 h-4 text-red-500 animate-pulse" />;
      default:
        return <WifiOff className="w-4 h-4 text-red-400" />;
    }
  };

  const getConnectionText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Live Updates';
      case 'connecting':
        return 'Connecting...';
      case 'error':
        return 'Connection Error';
      default:
        return 'Disconnected';
    }
  };

  const getConnectionColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'text-emerald-400';
      case 'connecting':
        return 'text-amber-400';
      case 'error':
        return 'text-red-500';
      default:
        return 'text-red-400';
    }
  };

  return (
    <div
      className={`bg-neutral-950/95 backdrop-blur-sm border-b border-neutral-800 px-4 py-3 ${className}`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between text-sm">
        {/* Left side - Connection & Users */}
        <div className="flex items-center space-x-6">
          {/* Connection Status */}
          <motion.div
            className={`flex items-center space-x-2 ${getConnectionColor()}`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            {getConnectionIcon()}
            <span className="font-medium">{getConnectionText()}</span>

            {/* Connection indicator dot */}
            <div
              className={`
              w-2 h-2 rounded-full
              ${
                connectionStatus === 'connected'
                  ? 'bg-emerald-400 animate-pulse'
                  : connectionStatus === 'connecting'
                    ? 'bg-amber-400 animate-ping'
                    : 'bg-red-400'
              }
            `}
            />
          </motion.div>

          {/* Online Users */}
          <motion.div
            className="flex items-center space-x-2 text-gray-400"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Eye className="w-4 h-4" />
            <span>{onlineUsers} viewing</span>

            {/* Animated user count */}
            {onlineUsers > 1 && (
              <div className="flex space-x-1">
                {[...Array(Math.min(3, onlineUsers - 1))].map((_, i) => (
                  <div
                    key={i}
                    className="w-1 h-1 bg-gray-400 rounded-full animate-pulse"
                    style={{ animationDelay: `${i * 0.2}s` }}
                  />
                ))}
              </div>
            )}
          </motion.div>
        </div>

        {/* Right side - Session Timer */}
        {showTimer && (
          <motion.div
            className={`
              flex items-center space-x-2 px-4 py-2 rounded-full backdrop-blur-sm
              ${
                sessionTimer < 60
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                  : sessionTimer < 120
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              }
            `}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Timer className="w-4 h-4" />
            <span className="font-mono font-bold">{formatTime(sessionTimer)}</span>
            <span className="text-xs opacity-70">remaining</span>

            {/* Pulsing indicator for low time */}
            {sessionTimer < 60 && <div className="w-2 h-2 bg-red-400 rounded-full animate-ping" />}
          </motion.div>
        )}
      </div>

      {/* Bottom progress line for timer */}
      {showTimer && (
        <div className="mt-2">
          <div className="w-full bg-neutral-800 h-px overflow-hidden">
            <motion.div
              className={`
                h-full transition-all duration-1000 ease-linear
                ${
                  sessionTimer < 60
                    ? 'bg-red-500'
                    : sessionTimer < 120
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                }
              `}
              style={{ width: `${(sessionTimer / 600) * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
