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

/** Placeholder data until the journey is driven by the user's onboarding answers. */
export const SAMPLE_GOAL: JourneyGoal = {
  title: 'Software Engineer at Stripe',
  detail: 'A full-time offer by graduation',
};

/** Ordered from the first step to the last; the path renders the last one nearest the goal. */
export const SAMPLE_MILESTONES: JourneyMilestone[] = [
  { id: 'fundamentals', title: 'Sharpen the fundamentals', timeframe: 'Weeks 1–8', status: 'done' },
  { id: 'project', title: 'Ship a portfolio project', timeframe: 'Weeks 9–14', status: 'done' },
  { id: 'resume', title: 'Polish resume & LinkedIn', timeframe: 'This month', status: 'current' },
  { id: 'internship', title: 'Land a summer internship', timeframe: 'Spring', status: 'upcoming' },
  { id: 'interviews', title: 'Ace technical interviews', timeframe: 'Summer', status: 'upcoming' },
];
