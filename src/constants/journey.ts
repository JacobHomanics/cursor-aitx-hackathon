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
  country?: string;
  roleInterest?: string;
  preferredCompany?: string;
};

const YEARS_UNTIL_GRADUATION: Record<CollegeYear, number> = {
  not_yet: 4,
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
  const place = locationLabel(profile?.city, profile?.state, profile?.country);
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

export type YearlyGoal = {
  id: string;
  yearLabel: string;
  title: string;
  detail: string;
  status: MilestoneStatus;
};

export function yearlyGoals(profile: JourneyProfile | null | undefined, now = new Date()): YearlyGoal[] {
  const calendar = academicCalendar(now);
  const remaining = profile?.collegeYear ? YEARS_UNTIL_GRADUATION[profile.collegeYear] : 4;
  const count = Math.max(remaining, 1);
  const role = interestLabel(ROLE_INTERESTS, profile?.roleInterest);
  const company = interestLabel(PREFERRED_COMPANIES, profile?.preferredCompany);

  return Array.from({ length: count }, (_, index) => {
    const start = calendar.academicStart + index;
    const yearLabel = `${start}–${String(start + 1).slice(-2)}`;
    const isCurrent = index === 0;
    const isGraduationYear = index === count - 1;

    if (isGraduationYear) {
      return {
        id: `year-${start}`,
        yearLabel,
        title: role && company ? `${role} at ${company}` : 'Full-time offer',
        detail: `Graduation year — turn internships, courses, and events into an offer.`,
        status: isCurrent ? 'current' : 'upcoming',
      };
    }

    if (index === count - 2) {
      return {
        id: `year-${start}`,
        yearLabel,
        title: 'Land a summer internship',
        detail: role ? `A ${role} internship that compounds toward graduation.` : 'A relevant internship.',
        status: isCurrent ? 'current' : 'upcoming',
      };
    }

    return {
      id: `year-${start}`,
      yearLabel,
      title: isCurrent ? 'This academic year' : 'Build proof',
      detail: 'Complete courses, attend events, and ship work that belongs on a resume.',
      status: isCurrent ? 'current' : 'upcoming',
    };
  });
}
