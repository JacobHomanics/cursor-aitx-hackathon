export const env = {
  convexUrl: process.env.EXPO_PUBLIC_CONVEX_URL ?? '',
  privyAppId: process.env.EXPO_PUBLIC_PRIVY_APP_ID ?? '',
  privyClientId: process.env.EXPO_PUBLIC_PRIVY_CLIENT_ID ?? '',
};

export const isConvexConfigured = env.convexUrl.length > 0;
export const isPrivyConfigured = env.privyAppId.length > 0;
