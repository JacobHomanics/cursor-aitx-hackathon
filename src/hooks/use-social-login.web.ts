import { useLoginWithOAuth } from '@privy-io/react-auth';

import type { SocialProvider } from './use-social-login.types';

export function useSocialLogin() {
  const { initOAuth, state } = useLoginWithOAuth();

  return {
    busy: state.status === 'loading',
    loginWithProvider: (provider: SocialProvider) => initOAuth({ provider }),
  };
}
