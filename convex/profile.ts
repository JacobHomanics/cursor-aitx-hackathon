export type StudentProfile = {
  collegeYear?: string;
  city?: string;
  state?: string;
  industryInterest?: string;
  roleInterest?: string;
  preferredCompany?: string;
};

export type FormattedProfile = {
  collegeYear: string;
  location: string;
  industry: string;
  role: string;
  preferredCompany: string;
};

const COLLEGE_YEAR_LABELS: Record<string, string> = {
  first_year: '1st year',
  second_year: '2nd year',
  third_year: '3rd year',
  fourth_year: '4th year',
  fifth_year_plus: '5th year or more',
  graduate: 'Graduate / professional',
  other: 'Other / not a student',
};

const INDUSTRY_LABELS: Record<string, string> = {
  technology: 'Technology',
  finance: 'Finance',
  healthcare: 'Healthcare',
  energy: 'Energy',
  consulting: 'Consulting',
  education: 'Education',
  government: 'Government / public policy',
  media: 'Media / entertainment',
  consumer: 'Consumer / retail',
  nonprofit: 'Nonprofit',
};

const ROLE_LABELS: Record<string, string> = {
  software_engineer: 'Software engineer',
  product_manager: 'Product manager',
  designer: 'Designer',
  data_scientist: 'Data scientist',
  researcher: 'Researcher',
  founder: 'Founder',
  consultant: 'Consultant',
  operations: 'Operations',
  marketing: 'Marketing',
  policy: 'Policy',
};

const COMPANY_LABELS: Record<string, string> = {
  google: 'Google',
  apple: 'Apple',
  microsoft: 'Microsoft',
  amazon: 'Amazon',
  meta: 'Meta',
  openai: 'OpenAI',
  nvidia: 'Nvidia',
  tesla: 'Tesla',
  spacex: 'SpaceX',
  stripe: 'Stripe',
  goldman_sachs: 'Goldman Sachs',
  mckinsey: 'McKinsey',
};

export function formatProfile(user: StudentProfile): FormattedProfile {
  return {
    collegeYear: labelFor(COLLEGE_YEAR_LABELS, user.collegeYear) ?? 'Unknown',
    location: [user.city, user.state].filter(Boolean).join(', ') || 'Unknown',
    industry: labelFor(INDUSTRY_LABELS, user.industryInterest) ?? user.industryInterest ?? 'Unknown',
    role: labelFor(ROLE_LABELS, user.roleInterest) ?? user.roleInterest ?? 'Unknown',
    preferredCompany:
      labelFor(COMPANY_LABELS, user.preferredCompany) ?? user.preferredCompany ?? 'Unknown',
  };
}

function labelFor(labels: Record<string, string>, value: string | undefined) {
  if (!value) {
    return undefined;
  }
  return labels[value] ?? value;
}
