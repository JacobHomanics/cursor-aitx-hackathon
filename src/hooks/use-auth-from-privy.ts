import { useCallback, useMemo } from 'react';

import { useAppAuth } from '@/hooks/use-app-auth';

export function useAuthFromPrivy() {
  const { ready, isAuthenticated, getAccessToken } = useAppAuth();

  const fetchAccessToken = useCallback(
    async ({ forceRefreshToken: _forceRefreshToken }: { forceRefreshToken: boolean }) => {
      try {
        return await getAccessToken();
      } catch {
        return null;
      }
    },
    [getAccessToken],
  );

  return useMemo(
    () => ({
      isLoading: !ready,
      isAuthenticated,
      fetchAccessToken,
    }),
    [ready, isAuthenticated, fetchAccessToken],
  );
}
