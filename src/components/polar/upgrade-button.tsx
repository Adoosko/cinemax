// e.g., src/components/UpgradeButton.tsx

'use client';

import { authClient } from '@/lib/auth-client';

export function UpgradeButton() {
  const handleCheckout = async () => {
    try {
      // Use the 'slug' you set in auth.ts: e.g. 'cinephile-unlimited'
      await authClient.checkout({
        slug: 'cinemx-yearly',
      });
      // This will automatically redirect to Polar's checkout
    } catch (error) {
      alert('Checkout failed!');
    }
  };

  return (
    <button className="btn btn-primary" onClick={handleCheckout}>
      Upgrade to Premium
    </button>
  );
}
