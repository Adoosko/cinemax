import { FloatingDock } from '@/components/layout/floating-dock';
import { MobileHeader } from '@/components/layout/mobile-header';
import { Navbar } from '@/components/layout/navbar';
import { SubscriptionProvider } from '@/lib/contexts/subscription-context';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'sonner';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'CINEMX - Movie Streaming',
  description: 'Watch movies online for free',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head></head>
      <body className={inter.className}>
        <SubscriptionProvider>
          {/* Desktop: Navbar, Mobile: Header + FloatingDock */}
          <div className="hidden md:block">
            <Navbar />
          </div>
          <div className="md:hidden">
            <MobileHeader />
            <FloatingDock />
          </div>
          <div className="md:hidden pt-14" />
          {children}
          <Toaster />
        </SubscriptionProvider>
      </body>
    </html>
  );
}
