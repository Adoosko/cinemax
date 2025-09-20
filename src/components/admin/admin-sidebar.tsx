'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { signOut } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';
import { Toggle } from '@/components/ui/toggle';
import {
  Film,
  Calendar,
  Ticket,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
  Home,
  User,
  Settings,
} from 'lucide-react';

const adminNavItems = [
  { name: 'Movies', href: '/admin/movies', icon: Film, badge: '24' },

  { name: 'Showtimes', href: '/admin/showtimes', icon: Calendar, badge: '48' },
  { name: 'Bookings', href: '/admin/bookings', icon: Ticket, badge: '12' },
];

interface AdminSidebarProps {
  user: {
    name?: string;
    email: string;
    role: string;
  };
}

export function AdminSidebar({
  user,
  collapsed = false,
  onToggleCollapse,
  mobileOpen = false,
}: AdminSidebarProps & {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  mobileOpen?: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
    router.refresh();
  };

  const handleToggleCollapse = () => {
    console.log('Toggle sidebar:', collapsed, '→', !collapsed);
    if (onToggleCollapse) {
      onToggleCollapse();
    }
  };

  return (
    <div
      style={{ width: collapsed ? '80px' : '280px' }}
      className={`fixed left-0 top-16 h-[calc(100vh-4rem)] bg-black/80 backdrop-blur-xl border-r border-white/10 z-40 overflow-hidden transition-all duration-300
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}
    >
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <Toggle
              pressed={collapsed}
              onPressedChange={(pressed) => {
                console.log('Toggle pressed:', pressed);
                if (onToggleCollapse) {
                  onToggleCollapse();
                }
              }}
              variant="outline"
              className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200 border-white/10"
            >
              {collapsed ? (
                <PanelLeftOpen className="w-5 h-5" />
              ) : (
                <PanelLeftClose className="w-5 h-5" />
              )}
            </Toggle>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-6">
          <nav className="space-y-2 px-4">
            {adminNavItems.map((item, index) => {
              const isActive =
                pathname === item.href ||
                (item.href !== '/admin' && pathname.startsWith(item.href));

              return (
                <div key={item.name} className="opacity-100 transition-opacity duration-300">
                  <Link href={item.href}>
                    <div
                      className={`group relative flex items-center space-x-4 p-3 rounded-xl transition-all duration-200 ${
                        isActive
                          ? 'bg-netflix-red text-white shadow-lg shadow-netflix-red/25'
                          : 'text-white/60 hover:text-white hover:bg-white/10'
                      } ${!collapsed ? 'hover:translate-x-1' : 'hover:scale-105'}`}
                    >
                      {/* Icon */}
                      <div className={`flex-shrink-0 ${collapsed ? 'mx-auto' : ''}`}>
                        <item.icon className="w-5 h-5" />
                      </div>

                      {/* Label and Badge */}
                      {!collapsed && (
                        <div className="flex items-center justify-between flex-1 overflow-hidden">
                          <span className="font-medium whitespace-nowrap">{item.name}</span>
                          {item.badge && (
                            <div className="bg-white/20 text-white text-xs font-bold px-2 py-1 rounded-full min-w-[20px] text-center">
                              {item.badge}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Tooltip for collapsed state */}
                      {collapsed && (
                        <div className="absolute left-full ml-4 px-3 py-2 bg-black/90 backdrop-blur-sm text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 border border-white/10">
                          {item.name}
                          {item.badge && (
                            <span className="ml-2 bg-netflix-red text-white text-xs px-2 py-0.5 rounded-full">
                              {item.badge}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </Link>
                </div>
              );
            })}
          </nav>
        </div>

        {/* User Profile at Bottom */}
        <div className="mt-auto p-4 border-t border-white/10">
          {!collapsed ? (
            <div className="flex flex-col space-y-3">
              {/* User Info */}
              <div className="flex items-center space-x-3 p-3 bg-white/5 rounded-xl">
                <div className="w-10 h-10 bg-gradient-to-br from-netflix-red to-red-700 rounded-xl flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">
                    {user.name || user.email.split('@')[0]}
                  </p>
                  <p className="text-white/60 text-xs truncate">{user.email}</p>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex space-x-2">
                <Link href="/" className="flex-1">
                  <button className="w-full p-2 bg-white/5 hover:bg-white/10 rounded-lg text-white/70 hover:text-white transition-colors flex items-center justify-center">
                    <Home className="w-4 h-4" />
                  </button>
                </Link>
                <Link href="/admin/settings" className="flex-1">
                  <button className="w-full p-2 bg-white/5 hover:bg-white/10 rounded-lg text-white/70 hover:text-white transition-colors flex items-center justify-center">
                    <Settings className="w-4 h-4" />
                  </button>
                </Link>
                <button
                  onClick={handleSignOut}
                  className="flex-1 p-2 bg-white/5 hover:bg-netflix-red/20 rounded-lg text-white/70 hover:text-netflix-red transition-colors flex items-center justify-center"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-4">
              <div className="w-10 h-10 bg-gradient-to-br from-netflix-red to-red-700 rounded-xl flex items-center justify-center group relative cursor-pointer">
                <User className="w-5 h-5 text-white" />

                {/* Tooltip */}
                <div className="absolute left-full ml-4 px-3 py-2 bg-black/90 backdrop-blur-sm text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 border border-white/10">
                  {user.name || user.email.split('@')[0]}
                </div>
              </div>

              <button
                onClick={handleSignOut}
                className="p-2 bg-white/5 hover:bg-netflix-red/20 rounded-lg text-white/70 hover:text-netflix-red transition-colors flex items-center justify-center group relative"
              >
                <LogOut className="w-4 h-4" />

                {/* Tooltip */}
                <div className="absolute left-full ml-4 px-3 py-2 bg-black/90 backdrop-blur-sm text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 border border-white/10">
                  Sign Out
                </div>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
