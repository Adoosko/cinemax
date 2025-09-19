import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  // Check if user is already logged in
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // Redirect to appropriate page if already logged in
  if (session?.user) {
    if (session.user.role === 'admin') {
      redirect('/admin');
    } else {
      redirect('/');
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">{children}</div>
  );
}
