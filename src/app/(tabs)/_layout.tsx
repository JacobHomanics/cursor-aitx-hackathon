import { Redirect } from 'expo-router';
import { useConvexAuth, useQuery } from 'convex/react';

import AppTabs from '@/components/app-tabs';
import { ThemedView } from '@/components/themed-view';
import { api } from '@convex/_generated/api';

export default function TabsLayout() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const user = useQuery(api.users.current, isAuthenticated ? {} : 'skip');

  if (isLoading || (isAuthenticated && user == null)) {
    return <ThemedView style={{ flex: 1 }} />;
  }

  if (isAuthenticated && user && !user.onboardingCompletedAt) {
    return <Redirect href="/onboarding" />;
  }

  return <AppTabs />;
}
