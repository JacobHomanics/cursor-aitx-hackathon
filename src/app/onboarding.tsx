import { useConvexAuth, useMutation, useQuery } from 'convex/react';
import { Redirect, useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/app-button';
import { AppSelect } from '@/components/ui/app-select';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import {
  COLLEGE_YEARS,
  INDUSTRY_INTERESTS,
  PREFERRED_COMPANIES,
  ROLE_INTERESTS,
  isOnboardingComplete,
  resolvedInterest,
  type CollegeYear,
} from '@/constants/onboarding';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { api } from '@convex/_generated/api';

const STEPS = [
  {
    id: 'college_year',
    title: 'What year of college/university are you in?',
  },
  {
    id: 'industry',
    title: 'What industry are you interested in?',
  },
  {
    id: 'role',
    title: 'What role are you interested in?',
  },
  {
    id: 'company',
    title: "What's your preferred company?",
  },
] as const;

export default function OnboardingScreen() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const user = useQuery(api.users.current, isAuthenticated ? {} : 'skip');
  const completeOnboarding = useMutation(api.users.completeOnboarding);
  const [step, setStep] = useState(0);
  const [collegeYear, setCollegeYear] = useState<CollegeYear | null>(null);
  const [industryChoice, setIndustryChoice] = useState<string | null>(null);
  const [industryCustom, setIndustryCustom] = useState('');
  const [roleChoice, setRoleChoice] = useState<string | null>(null);
  const [roleCustom, setRoleCustom] = useState('');
  const [companyChoice, setCompanyChoice] = useState<string | null>(null);
  const [companyCustom, setCompanyCustom] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isLoading && !isAuthenticated) {
    return <Redirect href="/" />;
  }

  if (user == null) {
    return <ThemedView style={styles.container} />;
  }

  if (isOnboardingComplete(user)) {
    return <Redirect href="/" />;
  }

  const current = STEPS[step];
  const industryInterest = resolvedInterest(industryChoice, industryCustom);
  const roleInterest = resolvedInterest(roleChoice, roleCustom);
  const preferredCompany = resolvedInterest(companyChoice, companyCustom);
  const canContinue =
    current.id === 'college_year'
      ? collegeYear != null
      : current.id === 'industry'
        ? industryInterest.length > 0
        : current.id === 'role'
          ? roleInterest.length > 0
          : preferredCompany.length > 0;
  const isLastStep = step === STEPS.length - 1;

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled">
          <SafeAreaView style={styles.safeArea}>
            <ThemedText type="small" themeColor="textSecondary">
              {step + 1} of {STEPS.length} · A few questions to get started
            </ThemedText>
            <ThemedText type="subtitle">{current.title}</ThemedText>

            {current.id === 'college_year' ? (
              <View style={styles.options}>
                {COLLEGE_YEARS.map((year) => {
                  const selected = collegeYear === year.value;
                  return (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={year.label}
                      key={year.value}
                      onPress={() => setCollegeYear(year.value)}
                      style={({ pressed }) => pressed && styles.pressed}>
                      <ThemedView
                        type={selected ? 'backgroundSelected' : 'backgroundElement'}
                        style={styles.option}>
                        <ThemedText
                          type="smallBold"
                          themeColor={selected ? 'text' : 'textSecondary'}>
                          {year.label}
                        </ThemedText>
                      </ThemedView>
                    </Pressable>
                  );
                })}
              </View>
            ) : null}

            {current.id === 'industry' ? (
              <AppSelect
                options={INDUSTRY_INTERESTS}
                value={industryChoice}
                customValue={industryCustom}
                placeholder="Select an industry"
                customPlaceholder="Type your industry"
                onChange={setIndustryChoice}
                onCustomChange={setIndustryCustom}
              />
            ) : null}

            {current.id === 'role' ? (
              <AppSelect
                options={ROLE_INTERESTS}
                value={roleChoice}
                customValue={roleCustom}
                placeholder="Select a role"
                customPlaceholder="Type your role"
                onChange={setRoleChoice}
                onCustomChange={setRoleCustom}
              />
            ) : null}

            {current.id === 'company' ? (
              <AppSelect
                options={PREFERRED_COMPANIES}
                value={companyChoice}
                customValue={companyCustom}
                placeholder="Select a company"
                customPlaceholder="Type your preferred company"
                onChange={setCompanyChoice}
                onCustomChange={setCompanyCustom}
              />
            ) : null}

            {error ? (
              <ThemedText type="small" themeColor="textSecondary">
                {error}
              </ThemedText>
            ) : null}

            <View style={styles.actions}>
              {step > 0 ? (
                <AppButton
                  label="Back"
                  variant="secondary"
                  onPress={() => {
                    setError(null);
                    setStep((currentStep) => currentStep - 1);
                  }}
                />
              ) : null}
              <AppButton
                disabled={!canContinue || submitting}
                label={submitting ? 'Saving…' : isLastStep ? 'Finish' : 'Continue'}
                onPress={() => {
                  if (!canContinue) {
                    return;
                  }

                  if (!isLastStep) {
                    setError(null);
                    setStep((currentStep) => currentStep + 1);
                    return;
                  }

                  if (!collegeYear) {
                    return;
                  }

                  setError(null);
                  setSubmitting(true);
                  void completeOnboarding({
                    collegeYear,
                    industryInterest,
                    roleInterest,
                    preferredCompany,
                  })
                    .then(() => {
                      router.replace('/');
                    })
                    .catch((onboardingError: unknown) => {
                      setError(
                        onboardingError instanceof Error
                          ? onboardingError.message
                          : 'Could not save your answers',
                      );
                    })
                    .finally(() => {
                      setSubmitting(false);
                    });
                }}
              />
            </View>
          </SafeAreaView>
        </ScrollView>
      </KeyboardAvoidingView>
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
  actions: {
    gap: Spacing.two,
  },
  pressed: {
    opacity: 0.7,
  },
});
