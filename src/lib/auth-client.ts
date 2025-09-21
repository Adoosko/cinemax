'use client';

import { createAuthClient } from 'better-auth/react';
import { magicLinkClient } from 'better-auth/client/plugins';
import { polarClient } from '@polar-sh/better-auth';

export const authClient = createAuthClient({
  basePath: '/api/auth',
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || 'http://localhost:3000',
  plugins: [magicLinkClient(), polarClient()],
});

export const { signIn, signOut, useSession, getSession } = authClient;
