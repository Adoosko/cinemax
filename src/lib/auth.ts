import { polar, checkout, portal, usage, webhooks } from '@polar-sh/better-auth';
import { betterAuth } from 'better-auth';

import { prismaAdapter } from 'better-auth/adapters/prisma';
import { magicLink } from 'better-auth/plugins';
import { db } from './db';
import { sendMagicLinkEmail } from './email';
import { polarClient } from './polar';

export const auth = betterAuth({
  database: prismaAdapter(db, {
    provider: 'postgresql',
  }),
  emailAndPassword: {
    enabled: false,
  },
  plugins: [
    magicLink({
      disableSignUp: false,
      expiresIn: 300,
      sendMagicLink: async ({ email, url, token }, request) => {
        await sendMagicLinkEmail({
          email,
          magicLinkUrl: url,
        });
      },
    }),
    // --- Polar Billing Plugins ---
    polar({
      client: polarClient,
      createCustomerOnSignUp: true,
      use: [
        checkout({
          products: [
            { productId: '510da46d-d727-4cf7-b53b-ba35949a1099', slug: 'cinemx-yearly' },
            { productId: '8552ffb3-0e14-48fc-8a38-665dbdb0d5f3', slug: 'cinemx-monthly' },
          ],

          successUrl: '/success?checkout_id={CHECKOUT_ID}',
          authenticatedUsersOnly: true,
        }),
        usage(),
        portal(),

        webhooks({
          secret: process.env.POLAR_WEBHOOK_SECRET!,
          async onSubscriptionActive(payload) {
            const data = payload.data;
            const planEnum =
              data.recurringInterval === 'year'
                ? 'YEARLY'
                : 'MONTHLY'; // Default to MONTHLY for any non-yearly subscription

            const userId = data.customer?.externalId as string | undefined;
            const subscription = data;
            if (!userId || !subscription?.product?.name || !subscription.currentPeriodEnd) return;

            await db.subscription.upsert({
              where: { userId },
              update: {
                status: 'ACTIVE',
                plan: planEnum,
                currentPeriodEnd: new Date(subscription.currentPeriodEnd),
              },
              create: {
                userId,
                status: 'ACTIVE',
                plan: planEnum,
                currentPeriodEnd: new Date(subscription.currentPeriodEnd),
              },
            });
          },
          async onSubscriptionCanceled(payload) {
            const data = payload.data;

            const userId = data.customer?.externalId as string | undefined;
            if (!userId) return;
            await db.subscription.updateMany({
              where: { userId },
              data: { status: 'CANCELED' },
            });
          },
          // Add other handlers as needed...
        }),
      ],
    }),
  ],
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24,
    cookie: {
      sameSite: 'lax',
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      domain: undefined, // Use default domain
      httpOnly: true,
    },
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
