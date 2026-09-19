import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { JourneyPath } from '@/components/journey-path';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { SAMPLE_GOAL, SAMPLE_MILESTONES } from '@/constants/journey';
import {
  BottomTabInset,
  Fonts,
  MaxContentWidth,
  Spacing,
  WebTabBarHeight,
} from '@/constants/theme';
import { useBreakpoint } from '@/hooks/use-breakpoint';
import { useJourneyColors } from '@/hooks/use-journey-colors';

export default function DashboardScreen() {
  const colors = useJourneyColors();
  const { isMobileWeb } = useBreakpoint();

  const total = SAMPLE_MILESTONES.length;
  const done = SAMPLE_MILESTONES.filter((milestone) => milestone.status === 'done').length;
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);
  const next = SAMPLE_MILESTONES.find((milestone) => milestone.status === 'current');

  return (
    <ThemedView style={styles.container}>
      <View pointerEvents="none" style={[styles.blob, styles.blobTop, { backgroundColor: colors.accentGlow }]} />
      <View pointerEvents="none" style={[styles.blob, styles.blobSide, { backgroundColor: colors.goldGlow }]} />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          isMobileWeb && { paddingBottom: WebTabBarHeight + Spacing.five },
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
            <View style={styles.progressRow}>
              <ThemedText type="smallBold">
                {done} of {total} milestones
              </ThemedText>
              <ThemedText type="smallBold" style={{ color: colors.accent }}>
                {percent}%
              </ThemedText>
            </View>
            <View style={[styles.track, { backgroundColor: colors.track }]}>
              <View style={[styles.fill, { width: `${percent}%`, backgroundColor: colors.accent }]} />
            </View>
            {next && (
              <ThemedText type="small" themeColor="textSecondary">
                Next up: {next.title}
              </ThemedText>
            )}
          </ThemedView>

          <JourneyPath goal={SAMPLE_GOAL} milestones={SAMPLE_MILESTONES} />
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
    paddingBottom: BottomTabInset + Spacing.four,
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
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  track: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 4,
  },
});
