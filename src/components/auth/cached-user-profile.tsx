'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { authClient, signOut } from '@/lib/auth-client';
import { useAuth } from '@/lib/hooks/use-auth';
import { useSubscription } from '@/lib/hooks/use-subscription';
import { CreditCard, LogOut } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface CachedUserProfileProps {
  className?: string;
  onMenuToggle?: (isOpen: boolean) => void;
}

export function CachedUserProfile({ className, onMenuToggle }: CachedUserProfileProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { subscription, error } = useSubscription();
  const [cachedProfile, setCachedProfile] = useState<any>(null);

  // Cache user data in localStorage for faster initial render
  useEffect(() => {
    if (user && !isLoading) {
      const profile = {
        name: user.name,
        email: user.email,
        image: user.image,
        role: (user as any)?.role,
        lastUpdated: new Date().toISOString(),
      };
      setCachedProfile(profile);
      localStorage.setItem('cachedUserProfile', JSON.stringify(profile));
    }
  }, [user, isLoading]);

  // Handle sign out
  const handleSignOut = async () => {
    localStorage.removeItem('cachedUserProfile');
    localStorage.removeItem('cachedSubscription');
    await signOut();
  };

  // Handle manage subscription
  const handleManageSubscription = async () => {
    try {
      await authClient.customer.portal();
    } catch (error) {
      console.error('[CachedUserProfile] Failed to open customer portal:', error);
      // Fallback to manual redirect if portal fails
      window.location.href = 'https://sandbox.polar.sh/adoos-developer';
    }
  };

  if (isLoading) {
    return <div className="w-28 h-9 bg-white/10 animate-pulse rounded-lg" />;
  }

  if (!isAuthenticated) {
    return (
      <Button asChild className="bg-netflix-dark-red text-white font-semibold px-5 py-2 rounded-xl">
        <Link href="/signin">Sign In</Link>
      </Button>
    );
  }

  const userName = user?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'User';
  const userRole = (user as any)?.role === 'admin' ? 'Admin' : 'Member';

  return (
    <DropdownMenu onOpenChange={onMenuToggle}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={`pl-1 pr-2 py-1 h-auto bg-white/5 hover:bg-white/10 rounded-xl flex items-center space-x-3 ${className || ''}`}
        >
          <Avatar className="w-9 h-9 border-2 border-netflix-red/70 shadow">
            {user?.image ? (
              <AvatarImage src={user.image} alt={userName} />
            ) : (
              <AvatarFallback className="bg-netflix-dark-red text-white">
                {userName[0]}
              </AvatarFallback>
            )}
          </Avatar>
          <div className="text-left hidden sm:block leading-tight">
            <div className="font-semibold text-white text-[15px]">{userName}</div>
            <div className="text-white/70 text-xs">{userRole}</div>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={12}
        className="bg-black border border-netflix-red/80 rounded-xl p-0 w-60 shadow-2xl"
      >
        <DropdownMenuLabel className="text-white font-semibold px-4 pt-4 pb-2">
          {user?.name || user?.email}
        </DropdownMenuLabel>
        <div className="px-4 pb-2 text-white/50 text-xs">{user?.email}</div>
        <DropdownMenuSeparator className="bg-white/10" />
        {subscription && (
          <DropdownMenuItem asChild>
            <button
              onClick={handleManageSubscription}
              className="flex w-full items-center px-4 py-2 gap-2 text-white hover:bg-white/10 rounded-none"
            >
              <CreditCard className="w-5 h-5 text-white hover:text-black" />
              Manage Subscription
            </button>
          </DropdownMenuItem>
        )}
        {(user as any)?.role === 'admin' && (
          <DropdownMenuItem asChild>
            <Link
              href="/admin"
              className="flex items-center px-4 py-2 gap-2 text-white hover:bg-white/10 rounded-none"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5 text-white hover:text-black"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              Admin Panel
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator className="bg-white/10" />
        <DropdownMenuItem asChild>
          <button
            onClick={handleSignOut}
            className="flex w-full items-center px-4 py-2 gap-2 text-white hover:bg-white/10 rounded-none"
          >
            <LogOut className="w-5 h-5 text-white hover:text-black" />
            Sign Out
          </button>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
