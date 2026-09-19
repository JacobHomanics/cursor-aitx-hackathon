import { useAction, useConvexAuth, useQuery } from 'convex/react';
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

export default function InternshipsScreen() {
  const safeAreaInsets = useSafeAreaInsets();
  const { isMobileWeb } = useBreakpoint();
  const theme = useTheme();
  const { isAuthenticated } = useConvexAuth();
  const user = useQuery(api.users.current, isAuthenticated ? {} : 'skip');
  const latest = useQuery(api.internships.latest, isAuthenticated ? {} : 'skip');
  const recommendInternship = useAction(api.internships.recommendInternship);
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
  const listings = latest?.listings ?? [];

  return (
    <ScrollView
      style={[styles.scrollView, { backgroundColor: theme.background }]}
      contentInset={insets}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={[styles.contentContainer, contentPlatformStyle]}>
      <ThemedView style={styles.container}>
        <ThemedView style={styles.header}>
          <ThemedText type="subtitle">Internship analyzer</ThemedText>
          <ThemedText style={styles.centerText} themeColor="textSecondary">
            We send your profile to ChatGPT and match it with public internship listings.
          </ThemedText>
        </ThemedView>

        <ThemedView style={styles.body}>
          {!isAuthenticated || !user ? (
            <ThemedText type="small" themeColor="textSecondary">
              Sign in and finish onboarding to get internship listings.
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
                label={busy ? 'Analyzing…' : latest ? 'Refresh listings' : 'Find internships'}
                onPress={() => {
                  setError(null);
                  setBusy(true);
                  void recommendInternship({})
                    .catch((recommendError: unknown) => {
                      setError(
                        recommendError instanceof Error
                          ? recommendError.message
                          : 'Could not find internships',
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
                  <ThemedView type="backgroundElement" style={styles.titleCard}>
                    <ThemedText type="code" themeColor="textSecondary">
                      Recommended title
                    </ThemedText>
                    <ThemedText type="subtitle">{latest.title}</ThemedText>
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

                  {listings.length === 0 ? (
                    <ThemedText type="small" themeColor="textSecondary">
                      No public internship listings were returned for this profile.
                    </ThemedText>
                  ) : (
                    listings.map((listing) => <ListingCard key={listing.id} listing={listing} />)
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

function ListingCard({
  listing,
}: {
  listing: {
    id: string;
    name: string;
    url: string;
    company?: string;
    location?: string;
    category?: string;
    publishedAt?: string;
    reason?: string;
    fit?: 'high' | 'medium' | 'low';
  };
}) {
  const meta = [listing.company, listing.location, listing.category, formatPosted(listing.publishedAt)]
    .filter(Boolean)
    .join(' · ');

  return (
    <ThemedView type="backgroundElement" style={styles.listingCard}>
      <View style={styles.listingBody}>
        <View style={styles.titleRow}>
          <ThemedText type="smallBold" style={styles.listingName}>
            {listing.name}
          </ThemedText>
          {listing.fit ? (
            <ThemedView type="backgroundSelected" style={styles.fitBadge}>
              <ThemedText type="code" themeColor="textSecondary">
                {listing.fit}
              </ThemedText>
            </ThemedView>
          ) : null}
        </View>
        {meta ? (
          <ThemedText type="small" themeColor="textSecondary">
            {meta}
          </ThemedText>
        ) : null}
        {listing.reason ? <ThemedText type="small">{listing.reason}</ThemedText> : null}
        <ExternalLink href={listing.url as `${string}:${string}`}>
          <ThemedText type="linkPrimary">Open listing</ThemedText>
        </ExternalLink>
      </View>
    </ThemedView>
  );
}

function formatPosted(iso?: string) {
  if (!iso) {
    return undefined;
  }
  try {
    return `Posted ${new Date(iso).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })}`;
  } catch {
    return undefined;
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
  titleCard: {
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.four,
    borderRadius: Spacing.four,
  },
  listingCard: {
    borderRadius: Spacing.four,
    overflow: 'hidden',
  },
  listingBody: {
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  listingName: {
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
