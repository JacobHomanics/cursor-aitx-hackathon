import { useAction, useConvexAuth, useQuery } from 'convex/react';
import { Image } from 'expo-image';
import { useState } from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CompletionButton } from '@/components/completion-button';
import { ExternalLink } from '@/components/external-link';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AppButton } from '@/components/ui/app-button';
import { Collapsible } from '@/components/ui/collapsible';
import {
  collegeYearLabel,
  INDUSTRY_INTERESTS,
  interestLabel,
  locationLabel,
  PREFERRED_COMPANIES,
  ROLE_INTERESTS,
} from '@/constants/onboarding';
import { BottomTabInset, MaxContentWidth, Spacing, WebTabBarHeight } from '@/constants/theme';
import { useBreakpoint } from '@/hooks/use-breakpoint';
import { useCompletedItems } from '@/hooks/use-completed-items';
import { useTheme } from '@/hooks/use-theme';
import { api } from '@convex/_generated/api';

export default function CoursesScreen() {
  const safeAreaInsets = useSafeAreaInsets();
  const { isMobileWeb } = useBreakpoint();
  const theme = useTheme();
  const { isAuthenticated } = useConvexAuth();
  const user = useQuery(api.users.current, isAuthenticated ? {} : 'skip');
  const latest = useQuery(api.courses.latest, isAuthenticated ? {} : 'skip');
  const analyzeCourses = useAction(api.courses.analyzeCourses);
  const { completedIds, setItemCompleted } = useCompletedItems('course');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const insets = {
    ...safeAreaInsets,
    bottom: safeAreaInsets.bottom + BottomTabInset + Spacing.three,
  };
  const contentPlatformStyle = Platform.select({
    android: {
      paddingTop: insets.top,
      paddingLeft: insets.left,
      paddingRight: insets.right,
      paddingBottom: insets.bottom,
    },
    web: {
      paddingTop: Spacing.six,
      paddingBottom: isMobileWeb ? WebTabBarHeight + Spacing.five : Spacing.four,
    },
  });

  const profileBits = user
    ? [
        locationLabel(user.city, user.state),
        collegeYearLabel(user.collegeYear),
        interestLabel(INDUSTRY_INTERESTS, user.industryInterest),
        interestLabel(ROLE_INTERESTS, user.roleInterest),
        interestLabel(PREFERRED_COMPANIES, user.preferredCompany),
      ].filter(Boolean)
    : [];

  return (
    <ScrollView
      style={[styles.scrollView, { backgroundColor: theme.background }]}
      contentInset={insets}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={[styles.contentContainer, contentPlatformStyle]}>
      <ThemedView style={styles.container}>
        <ThemedView style={styles.header}>
          <ThemedText type="subtitle">Course analyzer</ThemedText>
          <ThemedText style={styles.centerText} themeColor="textSecondary">
            We send your profile to ChatGPT and match it with public YouTube courses.
          </ThemedText>
        </ThemedView>

        <ThemedView style={styles.body}>
          {!isAuthenticated || !user ? (
            <ThemedText type="small" themeColor="textSecondary">
              Sign in and finish onboarding to get course picks.
            </ThemedText>
          ) : (
            <>
              <ThemedView type="backgroundElement" style={styles.profileCard}>
                <ThemedText type="smallBold">Your profile</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {profileBits.join(' · ')}
                </ThemedText>
              </ThemedView>

              <AppButton
                disabled={busy}
                label={busy ? 'Analyzing…' : latest ? 'Refresh courses' : 'Find YouTube courses'}
                onPress={() => {
                  setError(null);
                  setBusy(true);
                  void analyzeCourses({})
                    .catch((analyzeError: unknown) => {
                      setError(
                        analyzeError instanceof Error
                          ? analyzeError.message
                          : 'Could not analyze courses',
                      );
                    })
                    .finally(() => {
                      setBusy(false);
                    });
                }}
              />

              {error ? (
                <ThemedText type="small" themeColor="textSecondary">
                  {error}
                </ThemedText>
              ) : null}

              {latest ? (
                <>
                  <ThemedText type="small" themeColor="textSecondary">
                    YouTube courses for your profile
                  </ThemedText>
                  <ThemedView type="backgroundElement" style={styles.summaryCard}>
                    <ThemedText type="small">{latest.summary}</ThemedText>
                  </ThemedView>

                  {latest.prompt ? (
                    <Collapsible title="ChatGPT prompt" defaultOpen>
                      <ThemedText type="code" themeColor="textSecondary" selectable style={styles.dump}>
                        {latest.prompt}
                      </ThemedText>
                    </Collapsible>
                  ) : null}

                  {latest.response ? (
                    <Collapsible title="ChatGPT response" defaultOpen>
                      <ThemedText type="code" themeColor="textSecondary" selectable style={styles.dump}>
                        {latest.response}
                      </ThemedText>
                    </Collapsible>
                  ) : null}

                  {latest.courses.length === 0 ? (
                    <ThemedText type="small" themeColor="textSecondary">
                      No YouTube courses were returned for this profile.
                    </ThemedText>
                  ) : (
                    latest.courses.map((course) => (
                      <CourseCard
                        key={course.id}
                        course={course}
                        completed={completedIds.has(course.id)}
                        onCompletedChange={(completed) => setItemCompleted(course.id, completed)}
                      />
                    ))
                  )}
                </>
              ) : null}
            </>
          )}
        </ThemedView>
      </ThemedView>
    </ScrollView>
  );
}

function CourseCard({
  course,
  completed,
  onCompletedChange,
}: {
  course: {
    id: string;
    name: string;
    url: string;
    channel?: string;
    kind?: 'playlist' | 'video';
    videoCount?: string;
    duration?: string;
    reason?: string;
    fit?: 'high' | 'medium' | 'low';
    coverUrl?: string;
  };
  completed: boolean;
  onCompletedChange: (completed: boolean) => Promise<unknown>;
}) {
  const meta = [course.kind === 'playlist' ? 'Playlist' : course.kind === 'video' ? 'Video' : null, course.channel, course.videoCount ?? course.duration]
    .filter(Boolean)
    .join(' · ');

  return (
    <ThemedView type="backgroundElement" style={[styles.eventCard, completed && styles.doneCard]}>
      {course.coverUrl ? (
        <Image source={{ uri: course.coverUrl }} style={styles.cover} contentFit="cover" />
      ) : null}
      <View style={styles.eventBody}>
        <View style={styles.eventTitleRow}>
          <ThemedText type="smallBold" style={styles.eventName}>
            {course.name}
          </ThemedText>
          {course.fit ? (
            <ThemedView type="backgroundSelected" style={styles.fitBadge}>
              <ThemedText type="code" themeColor="textSecondary">
                {course.fit}
              </ThemedText>
            </ThemedView>
          ) : null}
        </View>
        {meta ? (
          <ThemedText type="small" themeColor="textSecondary">
            {meta}
          </ThemedText>
        ) : null}
        {course.reason ? <ThemedText type="small">{course.reason}</ThemedText> : null}
        <ExternalLink href={course.url as `${string}:${string}`}>
          <ThemedText type="linkPrimary">Open on YouTube</ThemedText>
        </ExternalLink>
        <CompletionButton
          done={completed}
          todoLabel="I completed this course"
          doneLabel="Completed"
          onChange={onCompletedChange}
        />
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  container: {
    maxWidth: MaxContentWidth,
    flexGrow: 1,
    width: '100%',
  },
  header: {
    gap: Spacing.three,
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.six,
  },
  centerText: {
    textAlign: 'center',
  },
  body: {
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.five,
  },
  profileCard: {
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.four,
    borderRadius: Spacing.four,
  },
  summaryCard: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.four,
    borderRadius: Spacing.four,
  },
  eventCard: {
    borderRadius: Spacing.four,
    overflow: 'hidden',
  },
  doneCard: {
    opacity: 0.75,
  },
  cover: {
    width: '100%',
    aspectRatio: 16 / 9,
  },
  eventBody: {
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
  },
  eventTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  eventName: {
    flex: 1,
  },
  fitBadge: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: Spacing.two,
  },
  dump: {
    flexShrink: 1,
  },
});
