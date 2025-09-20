'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Film, Menu } from 'lucide-react';
import { SearchBar } from '@/components/ui/searchbar';
import Image from 'next/image';

interface AdminHeaderProps {
  onToggleMobileMenu?: () => void;
}

export function AdminHeader({ onToggleMobileMenu }: AdminHeaderProps) {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-black/80 backdrop-blur-xl border-b border-white/10 z-50">
      <div className="flex items-center justify-between h-full px-6">
        {/* Mobile Menu Button (visible on small screens) */}
        <div className="lg:hidden">
          <button
            onClick={onToggleMobileMenu}
            className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {/* Logo & Title */}
        <div className="flex items-center">
          <Link href="/movies">
            <Image src="/logo.png" alt="Logo" width={50} height={50} />
          </Link>
          <Link href="/movies">
            <Image className="pt-1" src="/text-logo.png" alt="Logo" width={100} height={80} />
          </Link>
        </div>

        {/* Search Bar */}
        <div className="flex-1 max-w-xl mx-8">
          <SearchBar
            placeholder="Search admin content..."
            value={searchQuery}
            onChange={(value) => setSearchQuery(value)}
            variant="minimal"
          />
        </div>

        {/* Right Side - Empty */}
        <div className="w-32"></div>
      </div>
    </header>
  );
}
