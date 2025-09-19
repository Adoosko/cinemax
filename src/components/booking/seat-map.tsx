'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Crown, Shield, Users, ZoomIn, ZoomOut, RotateCcw, Maximize2 } from 'lucide-react';

type SeatStatus = 'available' | 'selected' | 'taken' | 'reserved' | 'my-selection';

interface Seat {
  id: string;
  row: string;
  number: number;
  status: SeatStatus;
  price: number;
  type: 'standard' | 'premium' | 'wheelchair';
  reservedBy?: string;
  reservedAt?: number;
}

interface SeatMapProps {
  seats: Seat[];
  onSeatSelect: (seatId: string) => void;
  className?: string;
}

export function SeatMap({ seats, onSeatSelect, className = '' }: SeatMapProps) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [interactionMode, setInteractionMode] = useState<'idle' | 'panning' | 'zooming'>('idle');
  const containerRef = useRef<HTMLDivElement>(null);
  const seatGridRef = useRef<HTMLDivElement>(null);

  const minScale = 0.2;
  const maxScale = 3;

  // Handle zoom
  const handleZoom = (delta: number, centerX?: number, centerY?: number) => {
    const newScale = Math.max(minScale, Math.min(maxScale, scale + delta));

    if (centerX !== undefined && centerY !== undefined && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const offsetX = centerX - rect.left - rect.width / 2;
      const offsetY = centerY - rect.top - rect.height / 2;

      const scaleRatio = newScale / scale;
      setPosition({
        x: position.x - offsetX * (scaleRatio - 1),
        y: position.y - offsetY * (scaleRatio - 1),
      });
    }

    setScale(newScale);
  };

  // Handle wheel zoom - DISABLED for better UX
  const handleWheel = (e: React.WheelEvent) => {
    // Allow normal page scrolling, don't intercept wheel events
    // Users should use zoom buttons instead
  };

  // Handle mouse drag
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Handle touch gestures
  const [lastTouchDistance, setLastTouchDistance] = useState(0);
  const [lastTouchCenter, setLastTouchCenter] = useState({ x: 0, y: 0 });

  const getTouchDistance = (touches: React.TouchList) => {
    if (touches.length < 2) return 0;
    const touch1 = touches[0];
    const touch2 = touches[1];
    return Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) + Math.pow(touch2.clientY - touch1.clientY, 2)
    );
  };

  const getTouchCenter = (touches: React.TouchList) => {
    if (touches.length === 1) {
      return { x: touches[0].clientX, y: touches[0].clientY };
    }
    if (touches.length >= 2) {
      return {
        x: (touches[0].clientX + touches[1].clientX) / 2,
        y: (touches[0].clientY + touches[1].clientY) / 2,
      };
    }
    return { x: 0, y: 0 };
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setInteractionMode('panning');
      const touch = e.touches[0];
      setDragStart({ x: touch.clientX - position.x, y: touch.clientY - position.y });
    } else if (e.touches.length === 2) {
      setIsDragging(false);
      setInteractionMode('zooming');
      setLastTouchDistance(getTouchDistance(e.touches));
      setLastTouchCenter(getTouchCenter(e.touches));
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();

    if (e.touches.length === 1 && isDragging && interactionMode === 'panning') {
      const touch = e.touches[0];
      setPosition({
        x: touch.clientX - dragStart.x,
        y: touch.clientY - dragStart.y,
      });
    } else if (e.touches.length === 2 && interactionMode === 'zooming') {
      const distance = getTouchDistance(e.touches);
      const center = getTouchCenter(e.touches);

      if (lastTouchDistance > 0) {
        const scaleChange = (distance - lastTouchDistance) * 0.008; // Reduced sensitivity
        handleZoom(scaleChange, center.x, center.y);
      }

      setLastTouchDistance(distance);
      setLastTouchCenter(center);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    setLastTouchDistance(0);
    setTimeout(() => setInteractionMode('idle'), 300); // Small delay to show feedback
  };

  // Reset view
  const resetView = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  const getSeatStyle = (seat: Seat) => {
    const baseClasses =
      'w-8 h-8 text-xs font-bold transition-all duration-200 cursor-pointer relative flex items-center justify-center rounded-lg group';

    switch (seat.status) {
      case 'available':
        if (seat.type === 'premium')
          return `${baseClasses} bg-gradient-to-b from-amber-600 to-amber-700 text-white hover:scale-110 hover:shadow-lg hover:shadow-amber-500/25 border border-amber-500/30`;
        if (seat.type === 'wheelchair')
          return `${baseClasses} bg-gradient-to-b from-blue-500 to-blue-600 text-white hover:scale-110 hover:shadow-lg hover:shadow-blue-500/25 border border-blue-400/30`;
        return `${baseClasses} bg-gradient-to-b from-neutral-600 to-neutral-700 text-white hover:bg-gradient-to-b hover:from-neutral-500 hover:to-neutral-600 hover:scale-110 hover:shadow-lg border border-neutral-500/30`;

      case 'my-selection':
        return `${baseClasses} bg-gradient-to-b from-red-500 to-red-600 text-white scale-110 shadow-lg shadow-red-500/50 border-2 border-red-400 animate-pulse`;

      case 'reserved':
        return `${baseClasses} bg-gradient-to-b from-orange-600 to-orange-700 text-orange-200 cursor-not-allowed opacity-70 border border-orange-500/30`;

      case 'taken':
        return `${baseClasses} bg-gradient-to-b from-neutral-800 to-neutral-900 text-neutral-500 cursor-not-allowed opacity-40 border border-neutral-700/30`;

      default:
        return `${baseClasses} bg-gradient-to-b from-neutral-700 to-neutral-800 text-neutral-400 border border-neutral-600/30`;
    }
  };

  const getSeatIcon = (seat: Seat) => {
    if (seat.type === 'premium') return <Crown className="w-3 h-3" />;
    if (seat.type === 'wheelchair') return <Shield className="w-3 h-3" />;
    return seat.number;
  };

  const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Instructions */}
      <div className="bg-neutral-950/80 backdrop-blur-sm border border-neutral-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-bold text-lg">Seat Map Navigation</h3>
          <div className="flex items-center space-x-2 text-gray-400">
            <Users className="w-4 h-4" />
            <span className="text-sm">Interactive Controls</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Desktop Instructions */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-red-400">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span className="font-semibold">Desktop</span>
            </div>
            <div className="space-y-2 text-sm text-gray-300">
              <div className="flex items-center space-x-3 p-2 bg-neutral-900/50 rounded-lg">
                <div className="w-8 h-8 bg-neutral-800 rounded-lg flex items-center justify-center">
                  <span className="text-xs">🖱️</span>
                </div>
                <div>
                  <div className="font-medium text-white">Click & Drag</div>
                  <div className="text-xs text-gray-400">Move around the theater</div>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-2 bg-neutral-900/50 rounded-lg">
                <div className="w-8 h-8 bg-neutral-800 rounded-lg flex items-center justify-center">
                  <ZoomIn className="w-4 h-4 text-gray-400" />
                </div>
                <div>
                  <div className="font-medium text-white">Zoom Buttons</div>
                  <div className="text-xs text-gray-400">Use +/- buttons to zoom</div>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Instructions */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-red-400">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span className="font-semibold">Mobile</span>
            </div>
            <div className="space-y-2 text-sm text-gray-300">
              <div className="flex items-center space-x-3 p-2 bg-neutral-900/50 rounded-lg">
                <div className="w-8 h-8 bg-neutral-800 rounded-lg flex items-center justify-center">
                  <span className="text-xs">👆</span>
                </div>
                <div>
                  <div className="font-medium text-white">One Finger</div>
                  <div className="text-xs text-gray-400">Drag to move around</div>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-2 bg-neutral-900/50 rounded-lg">
                <div className="w-8 h-8 bg-neutral-800 rounded-lg flex items-center justify-center">
                  <span className="text-xs">🤏</span>
                </div>
                <div>
                  <div className="font-medium text-white">Two Fingers</div>
                  <div className="text-xs text-gray-400">Pinch to zoom in/out</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-4">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-red-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-red-400 text-xs">!</span>
            </div>
            <div>
              <div className="text-red-300 font-medium text-sm mb-1">Pro Tip</div>
              <p className="text-red-200 text-xs leading-relaxed">
                If you get stuck or the map moves unexpectedly, click the red <strong>Reset</strong>{' '}
                button to return to the center view. On mobile, remember:{' '}
                <strong>one finger moves</strong>, <strong>two fingers zoom</strong>.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="bg-neutral-900/50 backdrop-blur-sm border border-neutral-800 rounded-xl p-4">
        <h4 className="text-white font-semibold mb-3 text-sm">Seat Legend</h4>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 bg-gradient-to-b from-neutral-600 to-neutral-700 rounded-lg border border-neutral-500/30"></div>
            <span className="text-gray-300">Available</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 bg-gradient-to-b from-amber-600 to-amber-700 rounded-lg border border-amber-500/30 flex items-center justify-center">
              <Crown className="w-2.5 h-2.5 text-white" />
            </div>
            <span className="text-gray-300">Premium</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 bg-gradient-to-b from-blue-500 to-blue-600 rounded-lg border border-blue-400/30 flex items-center justify-center">
              <Shield className="w-2.5 h-2.5 text-white" />
            </div>
            <span className="text-gray-300">Accessible</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 bg-gradient-to-b from-red-500 to-red-600 rounded-lg border-2 border-red-400 animate-pulse"></div>
            <span className="text-gray-300">Selected</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 bg-gradient-to-b from-neutral-800 to-neutral-900 rounded-lg border border-neutral-700/30 opacity-40"></div>
            <span className="text-gray-300">Taken</span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-neutral-900/50 backdrop-blur-sm border border-neutral-800 rounded-xl p-4">
        <div className="flex items-center space-x-2">
          <Users className="w-4 h-4 text-white" />
          <span className="text-white font-medium">Interactive Seat Map</span>
        </div>

        <div className="flex items-center space-x-2">
          {/* Interaction Mode Indicator */}
          {interactionMode !== 'idle' && (
            <div
              className={`px-3 py-1 rounded-full text-xs font-medium border ${
                interactionMode === 'panning'
                  ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                  : 'bg-green-500/20 text-green-300 border-green-500/30'
              }`}
            >
              {interactionMode === 'panning' ? '👆 Panning' : '🤏 Zooming'}
            </div>
          )}

          {/* Zoom Controls */}
          <button
            onClick={() => handleZoom(-0.2)}
            disabled={scale <= minScale}
            className="p-2 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          <span className="text-sm text-gray-300 min-w-[60px] text-center">
            {Math.round(scale * 100)}%
          </span>

          <button
            onClick={() => handleZoom(0.2)}
            disabled={scale >= maxScale}
            className="p-2 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          {/* Reset View */}
          <button
            onClick={resetView}
            className="p-2 bg-red-800 hover:bg-red-700 text-white rounded-lg transition-colors"
            title="Reset View (Click if stuck!)"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className="p-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors"
            title="Toggle Fullscreen"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Interactive Seat Container */}
      <div
        className={`
          relative bg-neutral-950/80 backdrop-blur-sm border border-neutral-800 rounded-2xl overflow-hidden
          ${isFullscreen ? 'fixed inset-0 z-50 rounded-none' : 'h-[500px] md:h-[600px]'}
        `}
      >
        {/* Seat Map Viewport */}
        <div
          ref={containerRef}
          className={`w-full h-full overflow-hidden select-none transition-all duration-200 ${
            isDragging
              ? 'cursor-grabbing'
              : interactionMode === 'panning'
                ? 'cursor-move'
                : interactionMode === 'zooming'
                  ? 'cursor-zoom-in'
                  : 'cursor-grab'
          }`}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div
            ref={seatGridRef}
            className="w-full h-full flex flex-col items-center justify-center p-8"
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
              transformOrigin: 'center center',
              transition: isDragging ? 'none' : 'transform 0.2s ease-out',
            }}
          >
            {/* Screen */}
            <div className="text-center space-y-4 mb-12">
              <div className="relative">
                <div className="h-3 w-96 bg-gradient-to-r from-transparent via-white to-transparent rounded-full shadow-lg shadow-white/20"></div>
                <div className="absolute inset-0 h-3 bg-gradient-to-r from-transparent via-white/50 to-transparent rounded-full animate-pulse"></div>
              </div>
              <p className="text-gray-300 uppercase tracking-[0.3em] text-sm font-medium">Screen</p>
            </div>

            {/* Seat Grid */}
            <div className="space-y-4">
              {rows.map((row, rowIndex) => {
                const rowSeats = seats.filter((seat) => seat.row === row);

                return (
                  <motion.div
                    key={row}
                    className="flex items-center justify-center space-x-6"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: rowIndex * 0.05 }}
                  >
                    {/* Row label - left */}
                    <div className="w-10 text-center">
                      <span className="text-gray-400 text-sm font-bold bg-neutral-800 px-3 py-2 rounded-lg">
                        {row}
                      </span>
                    </div>

                    {/* Seats */}
                    <div className="flex space-x-3">
                      {rowSeats.map((seat, seatIndex) => (
                        <motion.button
                          key={seat.id}
                          onClick={() => onSeatSelect(seat.id)}
                          className={getSeatStyle(seat)}
                          disabled={['taken', 'reserved'].includes(seat.status)}
                          title={`Seat ${seat.id} - ${seat.type === 'wheelchair' ? 'Accessible (FREE)' : `$${seat.price}`}`}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: rowIndex * 0.05 + seatIndex * 0.02 }}
                          whileHover={{ scale: seat.status === 'available' ? 1.1 : 1 }}
                          whileTap={{ scale: seat.status === 'available' ? 0.95 : 1 }}
                        >
                          {getSeatIcon(seat)}

                          {/* Reservation indicator */}
                          {seat.status === 'reserved' && (
                            <div className="absolute -top-1 -right-1 w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                          )}

                          {/* Selection glow */}
                          {seat.status === 'my-selection' && (
                            <div className="absolute inset-0 rounded-lg bg-red-500/30 animate-pulse"></div>
                          )}

                          {/* Tooltip on hover */}
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                            {seat.id} - {seat.type === 'wheelchair' ? 'FREE' : `$${seat.price}`}
                          </div>
                        </motion.button>
                      ))}
                    </div>

                    {/* Row label - right */}
                    <div className="w-10 text-center">
                      <span className="text-gray-400 text-sm font-bold bg-neutral-800 px-3 py-2 rounded-lg">
                        {row}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Fullscreen Exit Button */}
        {isFullscreen && (
          <button
            onClick={toggleFullscreen}
            className="absolute top-4 right-4 p-3 bg-black/50 hover:bg-black/70 text-white rounded-lg transition-colors z-10"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
