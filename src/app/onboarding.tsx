import { useConvexAuth, useMutation, useQuery } from 'convex/react';
import { Redirect, useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/app-button';
import { AppSelect } from '@/components/ui/app-select';
import { AppTextField } from '@/components/ui/app-text-field';
import { DateOfBirthCalendar } from '@/components/ui/date-of-birth-calendar';
import { LevelPicker } from '@/components/ui/level-picker';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import {
  COLLEGE_YEARS,
  INDUSTRY_INTERESTS,
  MAX_INTEREST_LENGTH,
  PREFERRED_COMPANIES,
  ROLE_INTERESTS,
  SOFT_SKILLS,
  isOnboardingComplete,
  parseDateOfBirth,
  parseGpa,
  resolvedInterest,
  type CollegeYear,
  type HardSkill,
  type SkillLevel,
  type SoftSkillId,
} from '@/constants/onboarding';
import { COUNTRIES, citiesFor, hasLocationCatalog, statesForCountry } from '@/constants/locations';
import { APP_NAME } from '@/constants/app';
import { Fonts, Spacing } from '@/constants/theme';
import { api } from '@convex/_generated/api';

const STEPS = [
  { id: 'school', title: 'School', hint: 'High school you graduated from, and your GPA.' },
  { id: 'college', title: 'College', hint: 'Are you enrolled yet? If yes, choose your year.' },
  { id: 'location', title: 'Location', hint: 'Country first, then state and city.' },
  { id: 'dob', title: 'Birthday', hint: 'Select your date of birth.' },
  { id: 'industry', title: 'Industry', hint: 'The field you want to work in.' },
  { id: 'role', title: 'Role', hint: 'The role you are aiming for.' },
  { id: 'company', title: 'Company', hint: 'A company you would like to work at.' },
  { id: 'hard_skills', title: 'Hard skills', hint: 'Add a skill and rate proficiency from 1 to 5.' },
  { id: 'soft_skills', title: 'Soft skills', hint: 'Rate the skills that matter in every industry.' },
] as const;

export default function OnboardingScreen() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const user = useQuery(api.users.current, isAuthenticated ? {} : 'skip');
  const completeOnboarding = useMutation(api.users.completeOnboarding);
  const [step, setStep] = useState(0);
  const [highSchool, setHighSchool] = useState('');
  const [gpaText, setGpaText] = useState('');
  const [inCollege, setInCollege] = useState<boolean | null>(null);
  const [collegeYear, setCollegeYear] = useState<CollegeYear | null>(null);
  const [countryChoice, setCountryChoice] = useState<string | null>(null);
  const [countryCustom, setCountryCustom] = useState('');
  const [stateChoice, setStateChoice] = useState<string | null>(null);
  const [stateCustom, setStateCustom] = useState('');
  const [cityChoice, setCityChoice] = useState<string | null>(null);
  const [cityCustom, setCityCustom] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState<string | null>(null);
  const [industryChoice, setIndustryChoice] = useState<string | null>(null);
  const [industryCustom, setIndustryCustom] = useState('');
  const [roleChoice, setRoleChoice] = useState<string | null>(null);
  const [roleCustom, setRoleCustom] = useState('');
  const [companyChoice, setCompanyChoice] = useState<string | null>(null);
  const [companyCustom, setCompanyCustom] = useState('');
  const [hardSkills, setHardSkills] = useState<HardSkill[]>([]);
  const [draftSkill, setDraftSkill] = useState('');
  const [draftSkillLevel, setDraftSkillLevel] = useState<SkillLevel>(3);
  const [softSkills, setSoftSkills] = useState<Partial<Record<SoftSkillId, SkillLevel>>>({});
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
  const resolvedCountry = resolvedInterest(countryChoice, countryCustom);
  const stateOptions = resolvedCountry ? statesForCountry(resolvedCountry) : [];
  const usesCatalog = Boolean(resolvedCountry && hasLocationCatalog(resolvedCountry));
  const resolvedState = usesCatalog
    ? resolvedInterest(stateChoice, stateCustom)
    : stateCustom.trim();
  const cityOptions = resolvedCountry && resolvedState ? citiesFor(resolvedCountry, resolvedState) : [];
  const resolvedCity =
    cityOptions.length > 0 ? resolvedInterest(cityChoice, cityCustom) : cityCustom.trim();
  const gpa = parseGpa(gpaText);
  const validDob = dateOfBirth ? parseDateOfBirth(dateOfBirth) : null;
  const resolvedCollegeYear: CollegeYear | null =
    inCollege === false ? 'not_yet' : inCollege === true ? collegeYear : null;
  const canContinue =
    current.id === 'school'
      ? highSchool.trim().length > 0 && gpa != null
      : current.id === 'college'
        ? resolvedCollegeYear != null
        : current.id === 'location'
          ? resolvedCountry.length > 0 && resolvedState.length > 0 && resolvedCity.length > 0
          : current.id === 'dob'
            ? validDob != null
            : current.id === 'industry'
              ? industryInterest.length > 0
              : current.id === 'role'
                ? roleInterest.length > 0
                : current.id === 'company'
                  ? preferredCompany.length > 0
                  : current.id === 'hard_skills'
                    ? hardSkills.length > 0
                    : SOFT_SKILLS.every((skill) => softSkills[skill.id] != null);
  const isLastStep = step === STEPS.length - 1;

  const addHardSkill = () => {
    const name = draftSkill.trim();
    if (!name) {
      return;
    }
    if (hardSkills.some((skill) => skill.name.toLowerCase() === name.toLowerCase())) {
      return;
    }
    setHardSkills((currentSkills) => [...currentSkills, { name, level: draftSkillLevel }]);
    setDraftSkill('');
    setDraftSkillLevel(3);
  };

  const setHardSkillLevel = (name: string, level: SkillLevel) => {
    setHardSkills((currentSkills) =>
      currentSkills.map((skill) => (skill.name === name ? { ...skill, level } : skill)),
    );
  };

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.sheet}>
            <View style={styles.header}>
              <ThemedText type="code" themeColor="textSecondary">
                {APP_NAME}
              </ThemedText>
              <ThemedText type="code" themeColor="textSecondary">
                {step + 1} / {STEPS.length}
              </ThemedText>
            </View>
            <ThemedView type="backgroundElement" style={styles.progressTrack}>
              <ThemedView
                type="backgroundSelected"
                style={[styles.progressFill, { width: `${((step + 1) / STEPS.length) * 100}%` }]}
              />
            </ThemedView>
            <ThemedText type="subtitle" style={styles.title}>
              {current.title}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {current.hint}
            </ThemedText>

            <View style={styles.body}>
            {current.id === 'school' ? (
              <View style={styles.fields}>
                <AppTextField
                  autoCapitalize="words"
                  maxLength={MAX_INTEREST_LENGTH}
                  onChangeText={setHighSchool}
                  placeholder="High school name"
                  value={highSchool}
                />
                <AppTextField
                  keyboardType="decimal-pad"
                  maxLength={5}
                  onChangeText={setGpaText}
                  placeholder="GPA (0–5)"
                  value={gpaText}
                />
              </View>
            ) : null}

            {current.id === 'college' ? (
              <View style={styles.choiceGrid}>
                <Choice
                  label="Not yet"
                  selected={inCollege === false}
                  onPress={() => {
                    setInCollege(false);
                    setCollegeYear('not_yet');
                  }}
                />
                <Choice
                  label="Yes"
                  selected={inCollege === true}
                  onPress={() => {
                    setInCollege(true);
                    if (collegeYear === 'not_yet') {
                      setCollegeYear(null);
                    }
                  }}
                />
                {inCollege
                  ? COLLEGE_YEARS.map((year) => (
                      <Choice
                        key={year.value}
                        label={year.label}
                        selected={collegeYear === year.value}
                        onPress={() => setCollegeYear(year.value)}
                      />
                    ))
                  : null}
              </View>
            ) : null}

            {current.id === 'location' ? (
              <View style={styles.fields}>
                <AppSelect
                  allowCustom
                  searchable
                  options={COUNTRIES}
                  value={countryChoice}
                  customValue={countryCustom}
                  placeholder="Country"
                  customPlaceholder="Type your country"
                  onChange={(value) => {
                    setCountryChoice(value);
                    setStateChoice(null);
                    setStateCustom('');
                    setCityChoice(null);
                    setCityCustom('');
                  }}
                  onCustomChange={setCountryCustom}
                />
                {resolvedCountry ? (
                  usesCatalog ? (
                    <AppSelect
                      allowCustom
                      searchable
                      options={stateOptions}
                      value={stateChoice}
                      customValue={stateCustom}
                      placeholder="State / region"
                      customPlaceholder="Type your state or region"
                      onChange={(value) => {
                        setStateChoice(value);
                        setCityChoice(null);
                        setCityCustom('');
                      }}
                      onCustomChange={setStateCustom}
                    />
                  ) : (
                    <AppTextField
                      autoCapitalize="words"
                      maxLength={MAX_INTEREST_LENGTH}
                      onChangeText={setStateCustom}
                      placeholder="State / region"
                      value={stateCustom}
                    />
                  )
                ) : null}
                {resolvedCountry && resolvedState ? (
                  cityOptions.length > 0 ? (
                    <AppSelect
                      allowCustom
                      searchable
                      options={cityOptions}
                      value={cityChoice}
                      customValue={cityCustom}
                      placeholder="City"
                      customPlaceholder="Type your city"
                      onChange={setCityChoice}
                      onCustomChange={setCityCustom}
                    />
                  ) : (
                    <AppTextField
                      autoCapitalize="words"
                      maxLength={MAX_INTEREST_LENGTH}
                      onChangeText={setCityCustom}
                      placeholder="City"
                      value={cityCustom}
                    />
                  )
                ) : null}
              </View>
            ) : null}

            {current.id === 'dob' ? (
              <DateOfBirthCalendar value={dateOfBirth} onChange={setDateOfBirth} />
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

            {current.id === 'hard_skills' ? (
              <View style={styles.options}>
                <AppTextField
                  autoCapitalize="words"
                  maxLength={40}
                  onChangeText={setDraftSkill}
                  placeholder="Skill name"
                  value={draftSkill}
                />
                <View style={styles.hardAddRow}>
                  <View style={styles.hardAddPicker}>
                    <LevelPicker value={draftSkillLevel} onChange={setDraftSkillLevel} />
                  </View>
                  <AppButton
                    disabled={draftSkill.trim().length === 0}
                    label="Add"
                    variant="secondary"
                    onPress={addHardSkill}
                  />
                </View>
                <View style={styles.hardList}>
                  {hardSkills.map((skill) => (
                    <View key={skill.name} style={styles.hardItem}>
                      <ThemedText type="smallBold" style={styles.hardName} numberOfLines={1}>
                        {skill.name}
                      </ThemedText>
                      <View style={styles.hardItemPicker}>
                        <LevelPicker
                          value={skill.level}
                          onChange={(level) => setHardSkillLevel(skill.name, level)}
                        />
                      </View>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Remove ${skill.name}`}
                        onPress={() =>
                          setHardSkills((currentSkills) =>
                            currentSkills.filter((entry) => entry.name !== skill.name),
                          )
                        }>
                        <ThemedText type="small" themeColor="textSecondary">
                          Remove
                        </ThemedText>
                      </Pressable>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}

            {current.id === 'soft_skills' ? (
              <View style={styles.options}>
                {SOFT_SKILLS.map((skill) => (
                  <View key={skill.id} style={styles.softRow}>
                    <ThemedText type="smallBold" style={styles.softLabel} numberOfLines={1}>
                      {skill.label}
                    </ThemedText>
                    <View style={styles.softPicker}>
                      <LevelPicker
                        value={softSkills[skill.id] ?? null}
                        onChange={(level) =>
                          setSoftSkills((currentSkills) => ({ ...currentSkills, [skill.id]: level }))
                        }
                      />
                    </View>
                  </View>
                ))}
              </View>
            ) : null}
          </View>

          {error ? (
            <ThemedText type="small" themeColor="textSecondary">
              {error}
            </ThemedText>
          ) : null}

          <View style={styles.actions}>
            {step > 0 ? (
              <View style={styles.action}>
                <AppButton
                  label="Back"
                  variant="secondary"
                  onPress={() => {
                    setError(null);
                    setStep((currentStep) => currentStep - 1);
                  }}
                />
              </View>
            ) : null}
            <View style={styles.action}>
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

                  if (
                    gpa == null ||
                    validDob == null ||
                    resolvedCollegeYear == null ||
                    inCollege == null ||
                    !SOFT_SKILLS.every((skill) => softSkills[skill.id] != null)
                  ) {
                    return;
                  }

                  setError(null);
                  setSubmitting(true);
                  void completeOnboarding({
                    highSchool: highSchool.trim(),
                    gpa,
                    inCollege,
                    collegeYear: resolvedCollegeYear,
                    dateOfBirth: validDob,
                    country: resolvedCountry,
                    city: resolvedCity,
                    state: resolvedState,
                    industryInterest,
                    roleInterest,
                    preferredCompany,
                    hardSkills,
                    softSkills: {
                      communication: softSkills.communication!,
                      teamwork: softSkills.teamwork!,
                      problemSolving: softSkills.problemSolving!,
                      timeManagement: softSkills.timeManagement!,
                      adaptability: softSkills.adaptability!,
                      leadership: softSkills.leadership!,
                    },
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
          </View>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

function Choice({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.choice, pressed && styles.pressed]}>
      <ThemedView type={selected ? 'backgroundSelected' : 'backgroundElement'} style={styles.option}>
        <ThemedText type="smallBold" themeColor={selected ? 'text' : 'textSecondary'}>
          {label}
        </ThemedText>
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  sheet: {
    flex: 1,
    width: '100%',
    maxWidth: 440,
    gap: Spacing.two,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: 4,
    borderRadius: 2,
  },
  title: {
    fontFamily: Fonts.serif,
    fontSize: 28,
    lineHeight: 32,
  },
  body: {
    flex: 1,
    minHeight: 0,
    justifyContent: 'center',
  },
  options: {
    gap: Spacing.two,
    minHeight: 0,
  },
  fields: {
    gap: Spacing.two,
  },
  choiceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  choice: {
    minWidth: '30%',
    flexGrow: 1,
  },
  option: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: 12,
    alignItems: 'center',
  },
  hardAddRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  hardAddPicker: {
    flex: 1,
  },
  hardList: {
    gap: Spacing.one,
    flexShrink: 1,
  },
  hardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  hardName: {
    width: 88,
  },
  hardItemPicker: {
    flex: 1,
  },
  softRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  softLabel: {
    width: 130,
  },
  softPicker: {
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.two,
    paddingTop: Spacing.one,
  },
  action: {
    flex: 1,
  },
  pressed: {
    opacity: 0.7,
  },
});
