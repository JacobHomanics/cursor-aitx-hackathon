import type { AuthConfig } from 'convex/server';

const privyAppId = process.env.PRIVY_APP_ID ?? '';

const authConfig = {
  providers: privyAppId
    ? [
        {
          type: 'customJwt' as const,
          issuer: 'privy.io',
          jwks: `https://auth.privy.io/api/v1/apps/${privyAppId}/jwks.json`,
          algorithm: 'ES256',
          applicationID: privyAppId,
        },
      ]
    : [],
} satisfies AuthConfig;

export default authConfig;
