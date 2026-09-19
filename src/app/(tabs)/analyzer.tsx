import { useAction, useConvexAuth, useQuery } from 'convex/react';
import { Image } from 'expo-image';
import { useState } from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
import { useTheme } from '@/hooks/use-theme';
import { api } from '@convex/_generated/api';

export default function AnalyzerScreen() {
  const safeAreaInsets = useSafeAreaInsets();
  const { isMobileWeb } = useBreakpoint();
  const theme = useTheme();
  const { isAuthenticated } = useConvexAuth();
  const user = useQuery(api.users.current, isAuthenticated ? {} : 'skip');
  const latest = useQuery(api.analyzer.latest, isAuthenticated ? {} : 'skip');
  const analyzeEvents = useAction(api.analyzer.analyzeEvents);
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
          <ThemedText type="subtitle">Event analyzer</ThemedText>
          <ThemedText style={styles.centerText} themeColor="textSecondary">
            We send your profile to ChatGPT and match it with public Luma events near your city.
          </ThemedText>
        </ThemedView>

        <ThemedView style={styles.body}>
          {!isAuthenticated || !user ? (
            <ThemedText type="small" themeColor="textSecondary">
              Sign in and finish onboarding to get event picks.
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
                label={busy ? 'Analyzing…' : latest ? 'Refresh events' : 'Find nearby events'}
                onPress={() => {
                  setError(null);
                  setBusy(true);
                  void analyzeEvents({})
                    .catch((analyzeError: unknown) => {
                      setError(
                        analyzeError instanceof Error
                          ? analyzeError.message
                          : 'Could not analyze events',
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
                    {latest.lumaPlace
                      ? `Luma events in ${latest.lumaPlace}`
                      : 'Luma events near you'}
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

                  {latest.events.length === 0 ? (
                    <ThemedText type="small" themeColor="textSecondary">
                      No Luma events were returned for this city.
                    </ThemedText>
                  ) : (
                    latest.events.map((event) => (
                      <EventCard key={event.id} event={event} />
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

function EventCard({
  event,
}: {
  event: {
    id: string;
    name: string;
    url: string;
    startAt?: string;
    timezone?: string;
    location?: string;
    calendarName?: string;
    reason?: string;
    fit?: 'high' | 'medium' | 'low';
    coverUrl?: string;
  };
}) {
  return (
    <ThemedView type="backgroundElement" style={styles.eventCard}>
      {event.coverUrl ? (
        <Image source={{ uri: event.coverUrl }} style={styles.cover} contentFit="cover" />
      ) : null}
      <View style={styles.eventBody}>
        <View style={styles.eventTitleRow}>
          <ThemedText type="smallBold" style={styles.eventName}>
            {event.name}
          </ThemedText>
          {event.fit ? (
            <ThemedView type="backgroundSelected" style={styles.fitBadge}>
              <ThemedText type="code" themeColor="textSecondary">
                {event.fit}
              </ThemedText>
            </ThemedView>
          ) : null}
        </View>
        {formatWhen(event.startAt, event.timezone) ? (
          <ThemedText type="small" themeColor="textSecondary">
            {formatWhen(event.startAt, event.timezone)}
          </ThemedText>
        ) : null}
        {event.location ? (
          <ThemedText type="small" themeColor="textSecondary">
            {event.location}
          </ThemedText>
        ) : null}
        {event.reason ? <ThemedText type="small">{event.reason}</ThemedText> : null}
        <ExternalLink href={event.url as `${string}:${string}`}>
          <ThemedText type="linkPrimary">Open on Luma</ThemedText>
        </ExternalLink>
      </View>
    </ThemedView>
  );
}

function formatWhen(iso?: string, timeZone?: string) {
  if (!iso) {
    return undefined;
  }

  try {
    return new Date(iso).toLocaleString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZone,
    });
  } catch {
    return iso;
  }
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
