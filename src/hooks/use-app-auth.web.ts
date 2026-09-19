import { usePrivy } from '@privy-io/react-auth';

import { getPrivyDisplayName, getPrivyEmail, getPrivyPhone, getPrivyUserId } from '@/lib/privy';

import type { AppAuth } from './use-app-auth.types';

export function useAppAuth(): AppAuth {
  const { ready, authenticated, user, logout, getAccessToken } = usePrivy();
  const userId = getPrivyUserId(user);

  return {
    ready,
    isAuthenticated: ready && authenticated && userId !== null,
    userId,
    email: getPrivyEmail(user),
    phone: getPrivyPhone(user),
    displayName: getPrivyDisplayName(user),
    logout,
    getAccessToken: async () => (await getAccessToken()) ?? null,
  };
}
