import { useConvexAuth, useQuery } from 'convex/react';
import { useRef } from 'react';
import {
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { JourneyPath } from '@/components/journey-path';
import { PlannerPreview } from '@/components/planner-preview';
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
import { useJourneyTitles } from '@/hooks/use-journey-titles';
import { api } from '@convex/_generated/api';

export default function HomeScreen() {
  const colors = useJourneyColors();
  const { height } = useWindowDimensions();
  const { isMobileWeb } = useBreakpoint();
  const { isAuthenticated } = useConvexAuth();
  const user = useQuery(api.users.current, isAuthenticated ? {} : 'skip');
  const profile = user
    ? {
        collegeYear: user.collegeYear as CollegeYear | undefined,
        city: user.city,
        state: user.state,
        country: user.country,
        industryInterest: user.industryInterest,
        roleInterest: user.roleInterest,
        preferredCompany: user.preferredCompany,
      }
    : null;
  const titles = useJourneyTitles(profile, isAuthenticated);
  const { goal, milestones } = buildJourney(profile, { titles });

  const current = milestones.find((milestone) => milestone.status === 'current');
  const next = milestones.find((milestone) => milestone.status === 'upcoming');
  const scrollRef = useRef<ScrollView>(null);
  const currentAnchorRef = useRef<View>(null);
  const scrollY = useRef(0);
  const alignedKey = useRef<string | null>(null);
  const alignAttempts = useRef(0);
  const currentKey = current?.id ?? 'none';
  const trackedKey = useRef(currentKey);

  if (trackedKey.current !== currentKey) {
    trackedKey.current = currentKey;
    alignedKey.current = null;
    alignAttempts.current = 0;
  }

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollY.current = event.nativeEvent.contentOffset.y;
  };

  const scrollToCurrent = () => {
    if (alignedKey.current === currentKey || alignAttempts.current > 12) {
      return;
    }

    const anchor = currentAnchorRef.current;
    const scroll = scrollRef.current;
    if (!anchor || !scroll) {
      return;
    }

    requestAnimationFrame(() => {
      if (typeof anchor.measureInWindow !== 'function' || typeof scroll.measureInWindow !== 'function') {
        return;
      }

      try {
        anchor.measureInWindow((_ax, ay, _aw, ah) => {
          if (ah < 1) {
            return;
          }

          scroll.measureInWindow((_sx, sy, _sw, sh) => {
            if (sh < 1) {
              return;
            }

            const delta = ay + ah / 2 - (sy + sh / 2);
            const nextY = Math.max(0, scrollY.current + delta);
            if (Math.abs(delta) < 24 || Math.abs(nextY - scrollY.current) < 2) {
              alignedKey.current = currentKey;
              return;
            }

            alignAttempts.current += 1;
            scroll.scrollTo({ y: nextY, animated: false });
          });
        });
      } catch {
        alignedKey.current = currentKey;
      }
    });
  };

  return (
    <ThemedView style={styles.container}>
      <View pointerEvents="none" style={[styles.blob, styles.blobTop, { backgroundColor: colors.accentGlow }]} />
      <View pointerEvents="none" style={[styles.blob, styles.blobSide, { backgroundColor: colors.goldGlow }]} />

      <ScrollView
        ref={scrollRef}
        onScroll={onScroll}
        scrollEventThrottle={16}
        onContentSizeChange={scrollToCurrent}
        contentContainerStyle={[
          styles.scrollContent,
          isMobileWeb && { paddingBottom: WebTabBarHeight + Spacing.six },
        ]}>
        <SafeAreaView style={[styles.safeArea, { paddingBottom: Math.max(BottomTabInset + Spacing.six, Math.round(height * 0.38)) }]}>
          <View style={styles.header}>
            <ThemedText type="code" themeColor="textSecondary" style={styles.eyebrow}>
              Dashboard
            </ThemedText>
            <ThemedText type="subtitle" style={{ fontFamily: Fonts.serif }}>
              Your path
            </ThemedText>
          </View>

          <ThemedView type="backgroundElement" style={styles.progressCard}>
            <ThemedText type="smallBold">Four-year internships</ThemedText>
            {current ? (
              <ThemedText type="small" themeColor="textSecondary">
                This year: {current.title}
              </ThemedText>
            ) : (
              <ThemedText type="small" themeColor="textSecondary">
                Internship years complete · full-time goal is next
              </ThemedText>
            )}
            {next && (
              <ThemedText type="small" themeColor="textSecondary">
                Next: {next.title} · {next.timeframe}
              </ThemedText>
            )}
          </ThemedView>

          <JourneyPath
            goal={goal}
            milestones={milestones}
            currentAnchorRef={currentAnchorRef}
            onCurrentLayout={scrollToCurrent}
          />

          <PlannerPreview />
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
