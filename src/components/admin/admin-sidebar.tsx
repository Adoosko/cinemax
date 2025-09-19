'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Film,
  Calendar,
  Building,
  Ticket,
  Users,
  Settings,
  BarChart3,
  Star,
  ChevronLeft,
  ChevronRight,
  Play,
  TrendingUp,
  Eye,
  Activity,
} from 'lucide-react';

const adminNavItems = [
  { name: 'Dashboard', href: '/admin', icon: BarChart3, badge: null },
  { name: 'Movies', href: '/admin/movies', icon: Film, badge: '24' },
  { name: 'Videos', href: '/admin/videos', icon: Play, badge: null },
  { name: 'Showtimes', href: '/admin/showtimes', icon: Calendar, badge: '48' },
  { name: 'Theaters', href: '/admin/theaters', icon: Building, badge: null },
  { name: 'Bookings', href: '/admin/bookings', icon: Ticket, badge: '12' },
  { name: 'Users', href: '/admin/users', icon: Users, badge: null },
  { name: 'Reviews', href: '/admin/reviews', icon: Star, badge: '5' },
  { name: 'Settings', href: '/admin/settings', icon: Settings, badge: null },
];

const quickStats = [
  { label: 'Active Movies', value: '24', icon: Film, trend: '+3' },
  { label: 'Live Shows', value: '12', icon: Activity, trend: '+2' },
  { label: 'Online Users', value: '156', icon: Eye, trend: '+24' },
  { label: 'Revenue', value: '$2.4K', icon: TrendingUp, trend: '+12%' },
];

export function AdminSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <motion.div
      animate={{ width: collapsed ? 80 : 280 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="fixed left-0 top-16 h-[calc(100vh-4rem)] bg-black/80 backdrop-blur-xl border-r border-white/10 z-40 overflow-hidden"
    >
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <motion.button
              onClick={() => setCollapsed(!collapsed)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
            >
              <motion.div animate={{ rotate: collapsed ? 0 : 180 }} transition={{ duration: 0.3 }}>
                <ChevronLeft className="w-5 h-5" />
              </motion.div>
            </motion.button>
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
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link href={item.href}>
                    <motion.div
                      whileHover={{ x: collapsed ? 0 : 4, scale: collapsed ? 1.05 : 1 }}
                      whileTap={{ scale: 0.98 }}
                      className={`group relative flex items-center space-x-4 p-3 rounded-xl transition-all duration-200 ${
                        isActive
                          ? 'bg-netflix-red text-white shadow-lg shadow-netflix-red/25'
                          : 'text-white/60 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      {/* Icon */}
                      <div className={`flex-shrink-0 ${collapsed ? 'mx-auto' : ''}`}>
                        <item.icon className="w-5 h-5" />
                      </div>

                      {/* Label and Badge */}
                      <AnimatePresence>
                        {!collapsed && (
                          <motion.div
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: 'auto' }}
                            exit={{ opacity: 0, width: 0 }}
                            transition={{ duration: 0.2 }}
                            className="flex items-center justify-between flex-1 overflow-hidden"
                          >
                            <span className="font-medium whitespace-nowrap">{item.name}</span>
                            {item.badge && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.1 }}
                                className="bg-white/20 text-white text-xs font-bold px-2 py-1 rounded-full min-w-[20px] text-center"
                              >
                                {item.badge}
                              </motion.div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>

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

                      {/* Active Indicator */}
                      {isActive && (
                        <motion.div
                          layoutId="activeTab"
                          className="absolute left-0 top-0 bottom-0 w-1 bg-white rounded-r-full"
                          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        />
                      )}
                    </motion.div>
                  </Link>
                </motion.div>
              );
            })}
          </nav>
        </div>

        {/* Quick Stats Card */}
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3 }}
              className="p-4 border-t border-white/10"
            >
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                {/* Header */}
                <div className="flex items-center space-x-2 mb-4">
                  <div className="w-6 h-6 bg-netflix-red/20 rounded-lg flex items-center justify-center">
                    <Activity className="w-3 h-3 text-netflix-red" />
                  </div>
                  <h3 className="text-white font-semibold text-sm">Live Stats</h3>
                  <div className="flex-1" />
                  <div className="w-2 h-2 bg-netflix-red rounded-full animate-pulse" />
                </div>

                {/* Stats */}
                <div className="space-y-3">
                  {quickStats.map((stat, index) => (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between group"
                    >
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-white/10 rounded flex items-center justify-center group-hover:bg-netflix-red/20 transition-colors">
                          <stat.icon className="w-2 h-2 text-white/60 group-hover:text-netflix-red transition-colors" />
                        </div>
                        <span className="text-white/60 text-xs">{stat.label}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-white font-bold text-sm">{stat.value}</span>
                        <span className="text-netflix-red text-xs font-medium">{stat.trend}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* CTA */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full mt-4 bg-netflix-red/20 hover:bg-netflix-red/30 border border-netflix-red/30 hover:border-netflix-red/50 text-netflix-red py-2 px-3 rounded-lg text-xs font-medium transition-all duration-200"
                >
                  View Analytics
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Collapsed Stats Indicator */}
        {collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-4 border-t border-white/10"
          >
            <div className="flex flex-col items-center space-y-2">
              <div className="w-8 h-8 bg-netflix-red/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-netflix-red" />
              </div>
              <div className="w-2 h-2 bg-netflix-red rounded-full animate-pulse" />
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
