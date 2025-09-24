'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { SearchBar } from '@/components/ui/searchbar';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CachedUserProfile } from '@/components/auth/cached-user-profile';
import { useAuth } from '@/lib/hooks/use-auth';
import { signOut } from '@/lib/auth-client';
import { Film, Calendar, Search, X, Ticket, Shield, User, Settings, LogOut } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';

import { useSubscription } from '@/lib/hooks/use-subscription';
import { Badge } from '../ui/badge';
import { UpgradeModal } from '../modals/upgrade-modal';

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { subscription, loading } = useSubscription();
  console.log(subscription);

  // Handle sign out
  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close search on route change
  const pathname = usePathname();
  useEffect(() => {
    setIsSearchOpen(false);
  }, [pathname]);

  const navLinks = [{ name: 'Movies', href: '/movies', icon: Film }];

  return (
    <>
      {/* Main Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-30 bg-black/95 backdrop-blur-xl shadow-2xl`}>
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center group">
              <div className="flex items-center">
                <Image src="/logo.png" alt="Logo" width={50} height={50} />
                <Image className="pt-1" src="/text-logo.png" alt="Logo" width={100} height={80} />
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-8">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="flex items-center space-x-2 text-white/80 hover:text-white font-medium group relative py-2"
                >
                  <link.icon className="w-4 h-4" />
                  <span>{link.name}</span>
                </Link>
              ))}
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              {!subscription && isAuthenticated ? (
                <div>
                  <Button
                    onClick={() => setIsUpgradeModalOpen(true)}
                    variant={'premium'}
                    size={'sm'}
                  >
                    Upgrade
                  </Button>
                  <UpgradeModal open={isUpgradeModalOpen} onOpenChange={setIsUpgradeModalOpen} />
                </div>
              ) : (
                isAuthenticated && (
                  <Badge variant={'premium'}>
                    {subscription?.recurringInterval === 'year' ? 'Cinemx+' : 'Cinemx+'}
                  </Badge>
                )
              )}
              <Button
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                variant={'glass'}
                size={'icon'}
              >
                <Search className="w-5 h-5" />
              </Button>

              <CachedUserProfile />

              {/* Mobile Menu Button - REMOVED */}
            </div>
          </div>
        </div>

        {/* Search Bar Overlay */}
        {isSearchOpen && (
          <div className="border-t border-white/10 bg-black/95 backdrop-blur-xl">
            <div className="px-4 sm:px-6 lg:px-8 py-4">
              <div className="relative max-w-2xl mx-auto">
                <div className="flex items-center">
                  <SearchBar placeholder="Search movies..." autoFocus className="flex-1" />
                  <Button
                    onClick={() => setIsSearchOpen(false)}
                    variant={'glass'}
                    size={'icon'}
                    aria-label="Close search"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Mobile Menu using Sheet Component - REMOVED */}

      {/* Spacer */}
      <div className="h-16 sm:h-20" />
    </>
  );
}
