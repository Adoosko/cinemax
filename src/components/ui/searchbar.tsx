'use client';

import React, { useState } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface SearchBarProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  onClear?: () => void;
  className?: string;
  autoFocus?: boolean;
  variant?: 'default' | 'minimal';
}

export function SearchBar({
  placeholder = 'Search...',
  value,
  onChange,
  onClear,
  className,
  autoFocus = false,
  variant = 'default',
}: SearchBarProps) {
  const [internalValue, setInternalValue] = useState(value || '');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInternalValue(newValue);
    onChange?.(newValue);
  };

  const handleClear = () => {
    setInternalValue('');
    onClear?.();
    onChange?.('');
  };

  const showClearButton = internalValue.length > 0;

  return (
    <div className={cn('relative', className)}>
      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40 pointer-events-none" />
      <Input
        type="text"
        placeholder={placeholder}
        value={value !== undefined ? value : internalValue}
        onChange={handleChange}
        autoFocus={autoFocus}
        className={cn(
          'pl-12 pr-12',
          variant === 'minimal' && 'bg-white/5 border-white/10 focus:bg-white/10'
        )}
      />
      {showClearButton && (
        <button
          onClick={handleClear}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/40 hover:text-white transition-colors cursor-pointer"
          type="button"
          aria-label="Clear search"
        >
          <X className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
