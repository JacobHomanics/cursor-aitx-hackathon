export const COLLEGE_YEARS = [
  { value: 'first_year', label: '1st year' },
  { value: 'second_year', label: '2nd year' },
  { value: 'third_year', label: '3rd year' },
  { value: 'fourth_year', label: '4th year' },
  { value: 'fifth_year_plus', label: '5th year or more' },
  { value: 'graduate', label: 'Graduate / professional' },
  { value: 'other', label: 'Other / not a student' },
] as const;

export type CollegeYear = (typeof COLLEGE_YEARS)[number]['value'];

export const ENTER_OWN_VALUE = '__enter_own__';

export const MAX_INTEREST_LENGTH = 80;

export const INDUSTRY_INTERESTS = [
  { value: 'technology', label: 'Technology' },
  { value: 'finance', label: 'Finance' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'energy', label: 'Energy' },
  { value: 'consulting', label: 'Consulting' },
  { value: 'education', label: 'Education' },
  { value: 'government', label: 'Government / public policy' },
  { value: 'media', label: 'Media / entertainment' },
  { value: 'consumer', label: 'Consumer / retail' },
  { value: 'nonprofit', label: 'Nonprofit' },
] as const;

export const ROLE_INTERESTS = [
  { value: 'software_engineer', label: 'Software engineer' },
  { value: 'product_manager', label: 'Product manager' },
  { value: 'designer', label: 'Designer' },
  { value: 'data_scientist', label: 'Data scientist' },
  { value: 'researcher', label: 'Researcher' },
  { value: 'founder', label: 'Founder' },
  { value: 'consultant', label: 'Consultant' },
  { value: 'operations', label: 'Operations' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'policy', label: 'Policy' },
] as const;

export const PREFERRED_COMPANIES = [
  { value: 'google', label: 'Google' },
  { value: 'apple', label: 'Apple' },
  { value: 'microsoft', label: 'Microsoft' },
  { value: 'amazon', label: 'Amazon' },
  { value: 'meta', label: 'Meta' },
  { value: 'openai', label: 'OpenAI' },
  { value: 'nvidia', label: 'Nvidia' },
  { value: 'tesla', label: 'Tesla' },
  { value: 'spacex', label: 'SpaceX' },
  { value: 'stripe', label: 'Stripe' },
  { value: 'goldman_sachs', label: 'Goldman Sachs' },
  { value: 'mckinsey', label: 'McKinsey' },
] as const;

export type InterestOption = { value: string; label: string };

export function collegeYearLabel(value: CollegeYear | undefined) {
  return COLLEGE_YEARS.find((year) => year.value === value)?.label;
}

export function interestLabel(options: readonly InterestOption[], value: string | undefined) {
  if (!value) {
    return undefined;
  }

  return options.find((option) => option.value === value)?.label ?? value;
}

export function resolvedInterest(choice: string | null, customValue: string) {
  if (!choice) {
    return '';
  }

  if (choice === ENTER_OWN_VALUE) {
    return customValue.trim();
  }

  return choice;
}

export function isOnboardingComplete(user: {
  onboardingCompletedAt?: number;
  collegeYear?: string;
  industryInterest?: string;
  roleInterest?: string;
  preferredCompany?: string;
}) {
  return Boolean(
    user.onboardingCompletedAt &&
      user.collegeYear &&
      user.industryInterest?.trim() &&
      user.roleInterest?.trim() &&
      user.preferredCompany?.trim(),
  );
}
