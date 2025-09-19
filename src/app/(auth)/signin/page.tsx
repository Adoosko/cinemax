import { MagicLinkForm } from '@/components/auth/magic-link-form';
import Link from 'next/link';
import { Film } from 'lucide-react';

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center py-12 px-4 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900/20 to-black"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-netflix-red/5 via-transparent to-transparent"></div>

      <div className="relative z-10 w-full max-w-md">
        <MagicLinkForm />

        {/* Footer Links */}
        <div className="mt-8 text-center">
          <div className="flex items-center justify-center space-x-6 text-sm text-white/40">
            <button className="hover:text-white transition-colors">Privacy Policy</button>
            <div className="w-1 h-1 bg-white/40 rounded-full"></div>
            <button className="hover:text-white transition-colors">Terms of Service</button>
          </div>
          <div className="mt-6 text-center text-white/30 text-xs">
            © 2025 CinemX. All rights reserved.
          </div>
        </div>
      </div>
    </div>
  );
}
