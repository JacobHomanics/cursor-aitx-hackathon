import {
  collegeYearLabel,
  interestLabel,
  locationLabel,
  PREFERRED_COMPANIES,
  ROLE_INTERESTS,
  type CollegeYear,
} from '@/constants/onboarding';

export type MilestoneStatus = 'done' | 'current' | 'upcoming';

export type JourneyMilestone = {
  id: string;
  title: string;
  timeframe: string;
  status: MilestoneStatus;
};

export type JourneyGoal = {
  title: string;
  detail: string;
};

export type JourneyProfile = {
  collegeYear?: CollegeYear;
  city?: string;
  state?: string;
  industryInterest?: string;
  roleInterest?: string;
  preferredCompany?: string;
};

const YEARS_UNTIL_GRADUATION: Record<CollegeYear, number> = {
  first_year: 4,
  second_year: 3,
  third_year: 2,
  fourth_year: 1,
  fifth_year_plus: 1,
  graduate: 0,
  other: 4,
};

const YEAR_INDEX: Record<CollegeYear, number> = {
  first_year: 0,
  second_year: 1,
  third_year: 2,
  fourth_year: 3,
  fifth_year_plus: 3,
  graduate: 4,
  other: 0,
};

const COLLEGE_YEAR_STOPS = [
  { id: 'first_year', label: '1st year' },
  { id: 'second_year', label: '2nd year' },
  { id: 'third_year', label: '3rd year' },
  { id: 'fourth_year', label: '4th year' },
] as const;

const GENERIC_YEAR_TITLES: [string, string, string, string] = [
  'Explore Intern',
  'Summer Intern',
  'Software Engineering Intern',
  'New Grad Intern',
];

const ROLE_YEAR_TITLES: Record<string, [string, string, string, string]> = {
  software_engineer: [
    'Explore Engineering Intern',
    'Software Engineering Intern',
    'Software Engineering Intern, Backend',
    'Software Engineering Intern',
  ],
  product_manager: [
    'Associate Product Manager Intern',
    'Product Management Intern',
    'Product Manager Intern, Growth',
    'Product Management Intern',
  ],
  designer: [
    'UX Design Intern',
    'Product Design Intern',
    'Product Design Intern, Systems',
    'Product Design Intern',
  ],
  data_scientist: [
    'Data Analytics Intern',
    'Data Science Intern',
    'Machine Learning Intern',
    'Data Science Intern',
  ],
  researcher: [
    'Research Assistant Intern',
    'Research Intern',
    'Applied Research Intern',
    'Research Intern',
  ],
  founder: [
    'Startup Operations Intern',
    'Founding Engineer Intern',
    'Founding Product Intern',
    'Founding Engineer Intern',
  ],
  consultant: [
    'Summer Analyst Intern',
    'Business Analyst Intern',
    'Strategy Intern',
    'Summer Associate Intern',
  ],
  operations: [
    'Operations Intern',
    'Business Operations Intern',
    'Program Operations Intern',
    'Business Operations Intern',
  ],
  marketing: [
    'Marketing Intern',
    'Product Marketing Intern',
    'Growth Marketing Intern',
    'Product Marketing Intern',
  ],
  policy: [
    'Public Policy Intern',
    'Government Affairs Intern',
    'Policy Research Intern',
    'Public Policy Intern',
  ],
};

export function academicCalendar(now = new Date()) {
  const month = now.getMonth();
  const year = now.getFullYear();
  const academicStart = month >= 7 ? year : year - 1;
  const academicEnd = academicStart + 1;

  let semester: string;
  if (month >= 7) {
    semester = `Fall ${year}`;
  } else if (month <= 4) {
    semester = `Spring ${year}`;
  } else {
    semester = `Summer ${year}`;
  }

  return {
    semester,
    academicYear: formatAcademicYear(academicStart),
    academicStart,
  };
}

export function graduationYear(collegeYear: CollegeYear | undefined, now = new Date()) {
  const remaining = collegeYear ? YEARS_UNTIL_GRADUATION[collegeYear] : 4;
  if (remaining === 0) {
    return now.getFullYear();
  }

  return academicCalendar(now).academicStart + remaining;
}

export function internshipTitleForYear(
  roleInterest: string | undefined,
  yearIndex: number,
  generatedTitles?: string[],
) {
  const generated = generatedTitles?.[yearIndex]?.trim();
  if (generated) {
    return generated;
  }

  const preset = roleInterest ? ROLE_YEAR_TITLES[roleInterest] : GENERIC_YEAR_TITLES;
  if (preset?.[yearIndex]) {
    return preset[yearIndex];
  }

  const role = interestLabel(ROLE_INTERESTS, roleInterest);
  return role ? `${role} Intern` : 'Summer Intern';
}

export function journeyProfileKey(profile: JourneyProfile | null | undefined) {
  return [
    profile?.collegeYear ?? '',
    profile?.roleInterest ?? '',
    profile?.industryInterest ?? '',
    profile?.preferredCompany ?? '',
  ].join('|');
}

export function buildJourney(
  profile: JourneyProfile | null | undefined,
  options: { now?: Date; titles?: string[] } = {},
): {
  goal: JourneyGoal;
  milestones: JourneyMilestone[];
} {
  const now = options.now ?? new Date();
  const year = profile?.collegeYear;
  const place = locationLabel(profile?.city, profile?.state);
  const role = interestLabel(ROLE_INTERESTS, profile?.roleInterest);
  const company = interestLabel(PREFERRED_COMPANIES, profile?.preferredCompany);
  const gradYear = graduationYear(year, now);
  const here = year ? YEAR_INDEX[year] : 0;
  const atGraduation = year === 'graduate';

  const goal: JourneyGoal = {
    title: role && company ? `${role} at ${company}` : 'Land a full-time offer',
    detail: atGraduation ? 'Career goal' : `Graduation · Class of ${gradYear}`,
  };

  const milestones: JourneyMilestone[] = COLLEGE_YEAR_STOPS.map((stop, index) => {
    const status: MilestoneStatus = here > index ? 'done' : here === index ? 'current' : 'upcoming';
    const yearLabel = status === 'current' && collegeYearLabel(year) ? collegeYearLabel(year)! : stop.label;

    return {
      id: stop.id,
      title: internshipTitleForYear(profile?.roleInterest, index, options.titles),
      timeframe: [yearLabel, formatAcademicYear(gradYear - 4 + index), status === 'current' ? place : undefined]
        .filter(Boolean)
        .join(' · '),
      status,
    };
  });

  return { goal, milestones };
}

function formatAcademicYear(start: number) {
  return `${start}–${String(start + 1).slice(-2)}`;
}

