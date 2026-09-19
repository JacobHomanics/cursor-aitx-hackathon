import { PrivyProvider } from '@privy-io/react-auth';
import type { ReactNode } from 'react';

import { env } from '@/lib/env';

export function PlatformPrivyProvider({ children }: { children: ReactNode }) {
  return (
    <PrivyProvider
      appId={env.privyAppId}
      clientId={env.privyClientId || undefined}
      config={{
        loginMethods: ['email', 'sms', 'google', 'twitter'],
        intl: {
          defaultCountry: 'US',
        },
      }}>
      {children}
    </PrivyProvider>
  );
}
