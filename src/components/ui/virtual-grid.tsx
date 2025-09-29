'use client';

import { ReactNode, useEffect, useRef, useState } from 'react';

interface VirtualGridProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => ReactNode;
  className?: string;
  gap?: number;
  columns?: number;
}

export function VirtualGrid<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  className = '',
  gap = 16,
  columns = 4,
}: VirtualGridProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const rowHeight = itemHeight + gap;
  const totalRows = Math.ceil(items.length / columns);
  const totalHeight = totalRows * rowHeight;

  // Calculate visible items based on scroll position
  useEffect(() => {
    const overscan = 2; // Render extra rows for smoother scrolling
    const visibleRows = Math.ceil(containerHeight / rowHeight);
    const startRow = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
    const endRow = Math.min(totalRows, startRow + visibleRows + overscan * 2);

    const start = startRow * columns;
    const end = Math.min(items.length, endRow * columns);

    setVisibleRange({ start, end });
  }, [scrollTop, containerHeight, rowHeight, totalRows, columns, items.length]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  const visibleItems = items.slice(visibleRange.start, visibleRange.end);
  const offsetY = Math.floor(visibleRange.start / columns) * rowHeight;

  return (
    <div
      ref={containerRef}
      className={`relative overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      {/* Total height spacer */}
      <div style={{ height: totalHeight, position: 'relative' }}>
        {/* Visible items container */}
        <div
          className={`grid grid-cols-${columns} gap-${gap / 4}`}
          style={{
            position: 'absolute',
            top: offsetY,
            left: 0,
            right: 0,
          }}
        >
          {visibleItems.map((item, index) => (
            <div key={visibleRange.start + index}>
              {renderItem(item, visibleRange.start + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Hook for dynamic container height
export function useContainerHeight(ref: React.RefObject<HTMLElement>, fallback: number = 600) {
  const [height, setHeight] = useState(fallback);

  useEffect(() => {
    const updateHeight = () => {
      if (ref.current) {
        setHeight(ref.current.clientHeight);
      }
    };

    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, [ref]);

  return height;
}
