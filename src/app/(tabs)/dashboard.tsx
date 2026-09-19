import { useConvexAuth, useQuery } from 'convex/react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { JourneyPath } from '@/components/journey-path';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { buildJourney } from '@/constants/journey';
import type { CollegeYear } from '@/constants/onboarding';
import {
  BottomTabInset,
  Fonts,
  MaxContentWidth,
  Spacing,
  WebTabBarHeight,
} from '@/constants/theme';
import { useBreakpoint } from '@/hooks/use-breakpoint';
import { useJourneyColors } from '@/hooks/use-journey-colors';
import { api } from '@convex/_generated/api';

export default function DashboardScreen() {
  const colors = useJourneyColors();
  const { isMobileWeb } = useBreakpoint();
  const { isAuthenticated } = useConvexAuth();
  const user = useQuery(api.users.current, isAuthenticated ? {} : 'skip');

  const { goal, milestones } = buildJourney(
    user
      ? {
          collegeYear: user.collegeYear as CollegeYear | undefined,
          city: user.city,
          state: user.state,
          roleInterest: user.roleInterest,
          preferredCompany: user.preferredCompany,
        }
      : null,
  );

  const next = milestones.find((milestone) => milestone.status === 'upcoming');

  return (
    <ThemedView style={styles.container}>
      <View pointerEvents="none" style={[styles.blob, styles.blobTop, { backgroundColor: colors.accentGlow }]} />
      <View pointerEvents="none" style={[styles.blob, styles.blobSide, { backgroundColor: colors.goldGlow }]} />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          isMobileWeb && { paddingBottom: WebTabBarHeight + Spacing.six },
        ]}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <ThemedText type="code" themeColor="textSecondary" style={styles.eyebrow}>
              Dashboard
            </ThemedText>
            <ThemedText type="subtitle" style={{ fontFamily: Fonts.serif }}>
              Your path
            </ThemedText>
          </View>

          <ThemedView type="backgroundElement" style={styles.progressCard}>
            <ThemedText type="smallBold">Four-year checkpoints</ThemedText>
            {next && (
              <ThemedText type="small" themeColor="textSecondary">
                Next up: {next.title} · {next.timeframe}
              </ThemedText>
            )}
          </ThemedView>

          <JourneyPath goal={goal} milestones={milestones} />
        </SafeAreaView>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  scrollContent: {
    flexGrow: 1,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    gap: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.six,
    maxWidth: MaxContentWidth,
    width: '100%',
    alignSelf: 'center',
  },
  blob: {
    position: 'absolute',
    borderRadius: 999,
  },
  blobTop: {
    top: -140,
    right: -120,
    width: 340,
    height: 340,
  },
  blobSide: {
    top: 380,
    left: -160,
    width: 320,
    height: 320,
  },
  header: {
    gap: Spacing.one,
  },
  eyebrow: {
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  progressCard: {
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Spacing.four,
  },
});
