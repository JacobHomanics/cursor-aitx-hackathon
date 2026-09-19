import { useLoginWithOAuth } from '@privy-io/expo';

import type { SocialProvider } from './use-social-login.types';

export function useSocialLogin() {
  const { login, state } = useLoginWithOAuth();

  return {
    busy: state.status === 'loading',
    loginWithProvider: (provider: SocialProvider) => login({ provider }),
  };
}
