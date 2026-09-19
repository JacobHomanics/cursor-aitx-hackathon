export type StudentProfile = {
  collegeYear?: string;
  inCollege?: boolean;
  highSchool?: string;
  gpa?: number;
  dateOfBirth?: string;
  country?: string;
  city?: string;
  state?: string;
  industryInterest?: string;
  roleInterest?: string;
  preferredCompany?: string;
  hardSkills?: { name: string; level: 1 | 2 | 3 | 4 | 5 }[];
  softSkills?: {
    communication: 1 | 2 | 3 | 4 | 5;
    teamwork: 1 | 2 | 3 | 4 | 5;
    problemSolving: 1 | 2 | 3 | 4 | 5;
    timeManagement: 1 | 2 | 3 | 4 | 5;
    adaptability: 1 | 2 | 3 | 4 | 5;
    leadership: 1 | 2 | 3 | 4 | 5;
  };
};

export type FormattedProfile = {
  collegeYear: string;
  highSchool: string;
  gpa: string;
  dateOfBirth: string;
  location: string;
  industry: string;
  role: string;
  preferredCompany: string;
  hardSkills: string;
  softSkills: string;
};

const COLLEGE_YEAR_LABELS: Record<string, string> = {
  not_yet: 'Not in college yet',
  first_year: '1st year',
  second_year: '2nd year',
  third_year: '3rd year',
  fourth_year: '4th year',
  fifth_year_plus: '5th year or more',
  graduate: 'Graduate / professional',
  other: 'Other',
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
    highSchool: user.highSchool?.trim() || 'Unknown',
    gpa: user.gpa != null ? String(user.gpa) : 'Unknown',
    dateOfBirth: user.dateOfBirth ?? 'Unknown',
    location: [user.city, user.state, user.country].filter(Boolean).join(', ') || 'Unknown',
    industry: labelFor(INDUSTRY_LABELS, user.industryInterest) ?? user.industryInterest ?? 'Unknown',
    role: labelFor(ROLE_LABELS, user.roleInterest) ?? user.roleInterest ?? 'Unknown',
    preferredCompany:
      labelFor(COMPANY_LABELS, user.preferredCompany) ?? user.preferredCompany ?? 'Unknown',
    hardSkills:
      user.hardSkills && user.hardSkills.length > 0
        ? user.hardSkills.map((skill) => `${skill.name} (${skill.level}/5)`).join(', ')
        : 'None listed',
    softSkills: user.softSkills
      ? [
          `communication ${user.softSkills.communication}/5`,
          `teamwork ${user.softSkills.teamwork}/5`,
          `problem solving ${user.softSkills.problemSolving}/5`,
          `time management ${user.softSkills.timeManagement}/5`,
          `adaptability ${user.softSkills.adaptability}/5`,
          `leadership ${user.softSkills.leadership}/5`,
        ].join(', ')
      : 'None listed',
  };
}

export function formatProfileLines(profile: FormattedProfile) {
  return [
    `- College year: ${profile.collegeYear}`,
    `- High school: ${profile.highSchool}`,
    `- GPA: ${profile.gpa}`,
    `- Date of birth: ${profile.dateOfBirth}`,
    `- Location: ${profile.location}`,
    `- Industry interest: ${profile.industry}`,
    `- Role interest: ${profile.role}`,
    `- Preferred company: ${profile.preferredCompany}`,
    `- Hard skills: ${profile.hardSkills}`,
    `- Soft skills: ${profile.softSkills}`,
  ];
}

function labelFor(labels: Record<string, string>, value: string | undefined) {
  if (!value) {
    return undefined;
  }
  return labels[value] ?? value;
}
