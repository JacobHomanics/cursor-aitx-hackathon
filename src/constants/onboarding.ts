export const COLLEGE_YEARS = [
  { value: 'first_year', label: '1st year' },
  { value: 'second_year', label: '2nd year' },
  { value: 'third_year', label: '3rd year' },
  { value: 'fourth_year', label: '4th year' },
  { value: 'fifth_year_plus', label: '5th year or more' },
  { value: 'graduate', label: 'Graduate / professional' },
  { value: 'other', label: 'Other' },
] as const;

export type CollegeYear =
  | (typeof COLLEGE_YEARS)[number]['value']
  | 'not_yet';

export const COLLEGE_YEAR_LABELS: Record<CollegeYear, string> = {
  not_yet: 'Not in college yet',
  first_year: '1st year',
  second_year: '2nd year',
  third_year: '3rd year',
  fourth_year: '4th year',
  fifth_year_plus: '5th year or more',
  graduate: 'Graduate / professional',
  other: 'Other',
};

export const SOFT_SKILLS = [
  { id: 'communication', label: 'Communication' },
  { id: 'teamwork', label: 'Teamwork' },
  { id: 'problemSolving', label: 'Problem solving' },
  { id: 'timeManagement', label: 'Time management' },
  { id: 'adaptability', label: 'Adaptability' },
  { id: 'leadership', label: 'Leadership' },
] as const;

export type SoftSkillId = (typeof SOFT_SKILLS)[number]['id'];
export type SkillLevel = 1 | 2 | 3 | 4 | 5;
export type HardSkill = { name: string; level: SkillLevel };
export type SoftSkills = Record<SoftSkillId, SkillLevel>;

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
  if (!value) {
    return undefined;
  }
  return COLLEGE_YEAR_LABELS[value] ?? COLLEGE_YEARS.find((year) => year.value === value)?.label;
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

export function parseGpa(value: string) {
  const parsed = Number(value.trim().replace(',', '.'));
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 5) {
    return null;
  }
  return Math.round(parsed * 100) / 100;
}

export function parseDateOfBirth(value: string) {
  const trimmed = value.trim();
  let iso = trimmed;
  const slash = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slash) {
    iso = `${slash[3]}-${slash[1].padStart(2, '0')}-${slash[2].padStart(2, '0')}`;
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    return null;
  }
  const date = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  const [year, month, day] = iso.split('-').map(Number);
  if (date.getFullYear() !== year || date.getMonth() + 1 !== month || date.getDate() !== day) {
    return null;
  }
  const ageYears = (Date.now() - date.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
  if (ageYears < 13 || ageYears > 80) {
    return null;
  }
  return iso;
}

export function locationLabel(
  city: string | undefined,
  state: string | undefined,
  country?: string,
) {
  const parts = [city?.trim(), state?.trim(), country?.trim()].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : undefined;
}

export function profileSummaryBits(user: {
  highSchool?: string;
  gpa?: number;
  collegeYear?: CollegeYear;
  city?: string;
  state?: string;
  country?: string;
  industryInterest?: string;
  roleInterest?: string;
  preferredCompany?: string;
  hardSkills?: { name: string; level: number }[];
}) {
  const skills =
    user.hardSkills && user.hardSkills.length > 0
      ? user.hardSkills.map((skill) => `${skill.name} ${skill.level}/5`).join(', ')
      : undefined;
  return [
    user.highSchool?.trim(),
    user.gpa != null ? `GPA ${user.gpa}` : undefined,
    collegeYearLabel(user.collegeYear),
    locationLabel(user.city, user.state, user.country),
    interestLabel(INDUSTRY_INTERESTS, user.industryInterest),
    interestLabel(ROLE_INTERESTS, user.roleInterest),
    interestLabel(PREFERRED_COMPANIES, user.preferredCompany),
    skills,
  ].filter(Boolean);
}

export function isOnboardingComplete(user: {
  onboardingCompletedAt?: number;
  highSchool?: string;
  gpa?: number;
  collegeYear?: string;
  dateOfBirth?: string;
  city?: string;
  state?: string;
  country?: string;
  industryInterest?: string;
  roleInterest?: string;
  preferredCompany?: string;
  hardSkills?: { name: string; level: number }[];
  softSkills?: SoftSkills;
}) {
  return Boolean(
    user.onboardingCompletedAt &&
      user.highSchool?.trim() &&
      user.gpa != null &&
      user.collegeYear &&
      user.dateOfBirth?.trim() &&
      user.country?.trim() &&
      user.city?.trim() &&
      user.state?.trim() &&
      user.industryInterest?.trim() &&
      user.roleInterest?.trim() &&
      user.preferredCompany?.trim() &&
      (user.hardSkills?.length ?? 0) > 0 &&
      SOFT_SKILLS.every((skill) => Boolean(user.softSkills?.[skill.id])),
  );
}
