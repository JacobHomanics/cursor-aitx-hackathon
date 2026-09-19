import { PrivyProvider } from '@privy-io/expo';
import type { ReactNode } from 'react';

import { env } from '@/lib/env';

export function PlatformPrivyProvider({ children }: { children: ReactNode }) {
  return (
    <PrivyProvider appId={env.privyAppId} clientId={env.privyClientId}>
      {children}
    </PrivyProvider>
  );
}
