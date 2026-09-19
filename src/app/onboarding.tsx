import { useConvexAuth, useMutation, useQuery } from 'convex/react';
import { Redirect, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/app-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { COLLEGE_YEARS, type CollegeYear } from '@/constants/onboarding';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { api } from '@convex/_generated/api';

export default function OnboardingScreen() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const user = useQuery(api.users.current, isAuthenticated ? {} : 'skip');
  const completeOnboarding = useMutation(api.users.completeOnboarding);
  const [collegeYear, setCollegeYear] = useState<CollegeYear | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isLoading && !isAuthenticated) {
    return <Redirect href="/" />;
  }

  if (user == null) {
    return <ThemedView style={styles.container} />;
  }

  if (user.onboardingCompletedAt) {
    return <Redirect href="/" />;
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <SafeAreaView style={styles.safeArea}>
          <ThemedText type="small" themeColor="textSecondary">
            A few questions to get started
          </ThemedText>
          <ThemedText type="subtitle">What year of college/university are you in?</ThemedText>

          <View style={styles.options}>
            {COLLEGE_YEARS.map((year) => {
              const selected = collegeYear === year.value;
              return (
                <Pressable
                  key={year.value}
                  onPress={() => setCollegeYear(year.value)}
                  style={({ pressed }) => pressed && styles.pressed}>
                  <ThemedView
                    type={selected ? 'backgroundSelected' : 'backgroundElement'}
                    style={styles.option}>
                    <ThemedText type="smallBold" themeColor={selected ? 'text' : 'textSecondary'}>
                      {year.label}
                    </ThemedText>
                  </ThemedView>
                </Pressable>
              );
            })}
          </View>

          {error ? (
            <ThemedText type="small" themeColor="textSecondary">
              {error}
            </ThemedText>
          ) : null}

          <AppButton
            disabled={!collegeYear || submitting}
            label={submitting ? 'Saving…' : 'Continue'}
            onPress={() => {
              if (!collegeYear) {
                return;
              }

              setError(null);
              setSubmitting(true);
              void completeOnboarding({ collegeYear })
                .then(() => {
                  router.replace('/');
                })
                .catch((onboardingError: unknown) => {
                  setError(
                    onboardingError instanceof Error
                      ? onboardingError.message
                      : 'Could not save your answer',
                  );
                })
                .finally(() => {
                  setSubmitting(false);
                });
            }}
          />
        </SafeAreaView>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  safeArea: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.five,
    gap: Spacing.three,
  },
  options: {
    gap: Spacing.two,
  },
  option: {
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
    borderRadius: Spacing.three,
  },
  pressed: {
    opacity: 0.7,
  },
});
