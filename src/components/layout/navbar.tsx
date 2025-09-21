'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { SearchBar } from '@/components/ui/searchbar';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CachedUserProfile } from '@/components/auth/cached-user-profile';
import { useAuth } from '@/lib/hooks/use-auth';
import { signOut } from '@/lib/auth-client';
import {
  Menu,
  X,
  Film,
  Calendar,
  Search,
  Ticket,
  Shield,
  User,
  Settings,
  LogOut,
} from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { UpgradeButton } from '../polar/upgrade-button';
import { useSubscription } from '@/lib/hooks/use-subscription';
import { Badge } from '../ui/badge';
import { UpgradeModal } from '../modals/upgrade-modal';

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { subscription } = useSubscription();
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

  // Close mobile menu on route change
  const pathname = usePathname();
  useEffect(() => {
    setIsMenuOpen(false);
    setIsSearchOpen(false);
  }, [pathname]);

  const navLinks = [
    { name: 'Movies', href: '/movies', icon: Film },
    { name: 'Showtimes', href: '/showtimes', icon: Calendar },
    { name: 'My Bookings', href: '/bookings', icon: Ticket },
  ];

  return (
    <>
      {/* Main Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-30 bg-black/95 backdrop-blur-xl shadow-2xl`}>
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center group" onClick={() => setIsMenuOpen(false)}>
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
              {/* Search Toggle */}
              <Button
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="hidden sm:flex p-3 text-white/80 hover:text-white hover:bg-white/10 rounded-xl"
              >
                <Search className="w-5 h-5" />
              </Button>
              {!subscription ? (
                <UpgradeModal open={isUpgradeModalOpen} onOpenChange={setIsUpgradeModalOpen} />
              ) : (
                <Badge className="text-white">
                  {subscription?.plan.slug === 'cinemx-yearly' ? 'Yearly' : 'Monthly'}
                </Badge>
              )}

              {/* Desktop User Menu */}
              <div className="hidden lg:block relative">
                <CachedUserProfile />
              </div>

              {/* Mobile User Button */}
              <div className="lg:hidden">
                <CachedUserProfile />
              </div>

              {/* Mobile Menu Button with Sheet */}
              <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                <SheetTrigger asChild>
                  <Button className="lg:hidden p-3 text-white/80 hover:text-white hover:bg-white/10 rounded-xl relative">
                    <Menu className="w-6 h-6" />
                  </Button>
                </SheetTrigger>
              </Sheet>
            </div>
          </div>
        </div>

        {/* Search Bar Overlay */}
        {isSearchOpen && (
          <div className="border-t border-white/10 bg-black/95 backdrop-blur-xl">
            <div className="px-4 sm:px-6 lg:px-8 py-4">
              <div className="relative max-w-2xl mx-auto">
                <div className="flex items-center">
                  <SearchBar
                    placeholder="Search movies, showtimes, theaters..."
                    autoFocus
                    className="flex-1"
                  />
                  <Button
                    onClick={() => setIsSearchOpen(false)}
                    className="ml-3 p-2 text-white/40 hover:text-white transition-colors"
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

      {/* Mobile Menu using Sheet Component */}
      <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <SheetContent
          side="right"
          className="bg-black/95 backdrop-blur-xl border-l border-white/10 p-0 w-80 max-w-[85vw] lg:hidden"
        >
          <div className="pt-14 pb-6">
            {/* User Section - Mobile */}
            {isAuthenticated && (
              <div className="px-6 pb-6 border-b border-white/10">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-netflix-red to-red-700 rounded-xl flex items-center justify-center">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="text-white font-semibold">
                      {user?.name || user?.email?.split('@')[0] || 'User'}
                    </div>
                    <div className="text-sm text-white/60">{user?.email}</div>
                    <div className="flex items-center space-x-1 mt-1">
                      <div className="w-2 h-2 bg-netflix-red rounded-full" />
                      <span className="text-xs text-netflix-red font-medium">
                        {(user as any)?.role === 'admin' ? 'Admin Account' : 'Member'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Links */}
            <div className="px-6 py-6 space-y-2">
              {navLinks.map((link, index) => (
                <div key={link.name}>
                  <SheetClose asChild>
                    <Link
                      href={link.href}
                      className="flex items-center space-x-4 text-white hover:text-netflix-red hover:bg-white/10 transition-all duration-200 py-4 px-4 -mx-4 rounded-xl group"
                    >
                      <link.icon className="w-6 h-6 group-hover:scale-110 transition-transform duration-200" />
                      <span className="text-lg font-medium">{link.name}</span>
                    </Link>
                  </SheetClose>
                </div>
              ))}

              {/* Search - Mobile */}
              <div>
                <SheetClose asChild>
                  <Button
                    onClick={() => setIsSearchOpen(true)}
                    className="flex items-center space-x-4 text-white hover:text-netflix-red hover:bg-white/10 transition-all duration-200 py-4 px-4 -mx-4 w-full rounded-xl group text-left"
                  >
                    <Search className="w-6 h-6 group-hover:scale-110 transition-transform duration-200" />
                    <span className="text-lg font-medium">Search</span>
                  </Button>
                </SheetClose>
              </div>
            </div>

            {/* Sign In - Mobile (if not authenticated) */}
            {!isAuthenticated && (
              <div className="px-6 pt-6 border-t border-white/10">
                <SheetClose asChild>
                  <Link href="/auth/signin">
                    <Button className="w-full bg-netflix-red hover:bg-red-700 text-white py-4 text-lg font-semibold transition-all duration-200 rounded-xl shadow-lg">
                      Sign In to CinemaX
                    </Button>
                  </Link>
                </SheetClose>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Spacer */}
      <div className="h-16 sm:h-20" />
    </>
  );
}
