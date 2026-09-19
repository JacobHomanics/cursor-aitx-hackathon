import { ConvexProvider, ConvexProviderWithAuth, ConvexReactClient, useConvexAuth, useMutation } from 'convex/react';
import { type ReactNode, useEffect } from 'react';

import { api } from '@convex/_generated/api';
import { useAppAuth } from '@/hooks/use-app-auth';
import { useAuthFromPrivy } from '@/hooks/use-auth-from-privy';
import { env, isConvexConfigured, isPrivyConfigured } from '@/lib/env';
import { PlatformPrivyProvider } from '@/providers/privy-provider';

const convex = isConvexConfigured
  ? new ConvexReactClient(env.convexUrl, { unsavedChangesWarning: false })
  : null;

function ConvexUserSync() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { email, phone, userId } = useAppAuth();
  const storeUser = useMutation(api.users.store);

  useEffect(() => {
    if (isLoading || !isAuthenticated || !userId) {
      return;
    }

    void storeUser({ email, phone });
  }, [email, isAuthenticated, isLoading, phone, storeUser, userId]);

  return null;
}

function AuthenticatedConvexProvider({ children }: { children: ReactNode }) {
  if (!convex) {
    return children;
  }

  return (
    <ConvexProviderWithAuth client={convex} useAuth={useAuthFromPrivy}>
      <ConvexUserSync />
      {children}
    </ConvexProviderWithAuth>
  );
}

export function AppProviders({ children }: { children: ReactNode }) {
  if (!convex) {
    return children;
  }

  if (!isPrivyConfigured) {
    return <ConvexProvider client={convex}>{children}</ConvexProvider>;
  }

  return (
    <PlatformPrivyProvider>
      <AuthenticatedConvexProvider>{children}</AuthenticatedConvexProvider>
    </PlatformPrivyProvider>
  );
}
