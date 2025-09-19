'use client';

import { createAuthClient } from 'better-auth/react';
import { magicLinkClient } from 'better-auth/client/plugins';

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || 'http://localhost:3000',
  plugins: [
    magicLinkClient(), // ✅ Add magic link client plugin
  ],
});

export const { signIn, signOut, useSession, getSession } = authClient;
