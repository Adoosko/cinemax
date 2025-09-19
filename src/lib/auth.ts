import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { magicLink } from 'better-auth/plugins';
import { db } from './db';
import { sendMagicLinkEmail } from './email';

export const auth = betterAuth({
  database: prismaAdapter(db, {
    provider: 'postgresql',
  }),

  // ✅ DISABLE email/password authentication entirely
  emailAndPassword: {
    enabled: false, // No passwords at all!
  },

  // ✅ Magic Link Plugin Configuration
  plugins: [
    magicLink({
      // Don't allow signup via magic link - users must register first
      disableSignUp: false, // Allow signup via magic link

      // Magic link expires in 5 minutes (300 seconds)
      expiresIn: 300,

      // Send the magic link email
      sendMagicLink: async ({ email, url, token }, request) => {
        await sendMagicLinkEmail({
          email,
          magicLinkUrl: url,
        });
      },
    }),
  ],

  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24,
  },

  user: {
    additionalFields: {
      role: {
        type: 'string',
        defaultValue: 'customer',
        required: true,
      },
    },
  },
});
