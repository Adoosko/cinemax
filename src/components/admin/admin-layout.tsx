'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AdminSidebar } from './admin-sidebar';
import { AdminHeader } from './admin-header';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Mobile sidebar backdrop */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <AdminSidebar
        user={{ name: 'Admin', email: 'admin@cinemafx.com', role: 'admin' }}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        mobileOpen={mobileMenuOpen}
      />

      {/* Main content */}
      <div
        className={`
        transition-all duration-300
        ${sidebarCollapsed ? 'lg:ml-[80px]' : 'lg:ml-[280px]'}
        ml-0
      `}
      >
        {/* Top bar */}
        <AdminHeader onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)} />

        {/* Page content */}
        <main className="pt-16 p-4 sm:p-6 lg:p-8 lg:pl-12">{children}</main>
      </div>
    </div>
  );
}
