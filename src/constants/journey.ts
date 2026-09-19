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
    academicYear: `${academicStart}–${String(academicEnd).slice(-2)}`,
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

export function buildJourney(profile: JourneyProfile | null | undefined, now = new Date()): {
  goal: JourneyGoal;
  milestones: JourneyMilestone[];
} {
  const calendar = academicCalendar(now);
  const year = profile?.collegeYear;
  const place = locationLabel(profile?.city, profile?.state);
  const role = interestLabel(ROLE_INTERESTS, profile?.roleInterest);
  const company = interestLabel(PREFERRED_COMPANIES, profile?.preferredCompany);
  const gradYear = graduationYear(year, now);
  const atGraduation = year === 'graduate';

  const goal: JourneyGoal = {
    title: role && company ? `${role} at ${company}` : 'Land a full-time offer',
    detail: atGraduation ? 'Career goal' : `Graduation · Class of ${gradYear}`,
  };

  const milestones: JourneyMilestone[] = [
    {
      id: 'here',
      title: collegeYearLabel(year) ?? 'You are here',
      timeframe: place ?? 'Right now',
      status: 'current',
    },
    {
      id: 'semester',
      title: 'This semester',
      timeframe: calendar.semester,
      status: 'upcoming',
    },
    {
      id: 'year',
      title: 'This year',
      timeframe: calendar.academicYear,
      status: 'upcoming',
    },
  ];

  return { goal, milestones };
}
