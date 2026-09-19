import { useAction, useConvexAuth, useQuery } from 'convex/react';
import { useState } from 'react';
import { Platform, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
            We send your profile to ChatGPT and get one internship job title you should apply for.
          </ThemedText>
        </ThemedView>

        <ThemedView style={styles.body}>
          {!isAuthenticated || !user ? (
            <ThemedText type="small" themeColor="textSecondary">
              Sign in and finish onboarding to get an internship title.
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
                label={busy ? 'Analyzing…' : latest ? 'Refresh recommendation' : 'Recommend an internship'}
                onPress={() => {
                  setError(null);
                  setBusy(true);
                  void recommendInternship({})
                    .catch((recommendError: unknown) => {
                      setError(
                        recommendError instanceof Error
                          ? recommendError.message
                          : 'Could not recommend an internship',
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
                </>
              ) : null}
            </>
          )}
        </ThemedView>
      </ThemedView>
    </ScrollView>
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
  titleCard: {
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.four,
    borderRadius: Spacing.four,
  },
  dump: {
    flexShrink: 1,
  },
});
