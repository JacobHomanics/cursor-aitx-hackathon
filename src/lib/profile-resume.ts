import {
  INDUSTRY_INTERESTS,
  PREFERRED_COMPANIES,
  ROLE_INTERESTS,
  collegeYearLabel,
  interestLabel,
  locationLabel,
  type CollegeYear,
} from '@/constants/onboarding';

export type ProfileUser = {
  name?: string;
  email?: string;
  phone?: string;
  collegeYear?: CollegeYear;
  highSchool?: string;
  gpa?: number;
  dateOfBirth?: string;
  city?: string;
  state?: string;
  country?: string;
  industryInterest?: string;
  roleInterest?: string;
  preferredCompany?: string;
  hardSkills?: { name: string; level: number }[];
  softSkills?: {
    communication: number;
    teamwork: number;
    problemSolving: number;
    timeManagement: number;
    adaptability: number;
    leadership: number;
  };
  onboardingCompletedAt?: number;
};

export type ResumeItem = {
  kind: 'event' | 'course' | 'internship';
  itemId: string;
  name: string;
  url: string;
  detail?: string;
  completedAt: number;
};

export function kindLabel(kind: ResumeItem['kind']) {
  if (kind === 'course') {
    return 'Course';
  }
  if (kind === 'internship') {
    return 'Internship';
  }
  return 'Event';
}

export type ResumeStanding = {
  label: string;
  detail: string;
  level: 'starting' | 'building' | 'active';
};

export type GoalBlock = {
  title: string;
  detail: string;
  source: 'logged' | 'derived';
};

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export function displayNameFor(user: ProfileUser | null | undefined, fallback?: string) {
  return user?.name?.trim() || fallback?.trim() || user?.email || 'Student';
}

export function initialsFor(name: string) {
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return 'S';
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export function roleLabel(user: ProfileUser | null | undefined) {
  return interestLabel(ROLE_INTERESTS, user?.roleInterest);
}

export function industryLabel(user: ProfileUser | null | undefined) {
  return interestLabel(INDUSTRY_INTERESTS, user?.industryInterest);
}

export function companyLabel(user: ProfileUser | null | undefined) {
  return interestLabel(PREFERRED_COMPANIES, user?.preferredCompany);
}

export function yearLabel(user: ProfileUser | null | undefined) {
  return collegeYearLabel(user?.collegeYear);
}

export function placeLabel(user: ProfileUser | null | undefined) {
  return locationLabel(user?.city, user?.state, user?.country);
}

export function briefProfileFor(
  user: ProfileUser | null | undefined,
  standing: ResumeStanding,
  graduationTitle: string,
  thisYearTitle: string,
  counts: { internships: number; courses: number; events: number },
) {
  const year = yearLabel(user);
  const place = placeLabel(user);
  const role = roleLabel(user);
  const industry = industryLabel(user);
  const company = companyLabel(user);
  const school = user?.highSchool?.trim();
  const gpa = user?.gpa != null ? `GPA ${user.gpa}` : null;
  const skills = user?.hardSkills?.length
    ? user.hardSkills
        .slice(0, 4)
        .map((skill) => `${skill.name} ${skill.level}/5`)
        .join(', ')
    : null;
  const who = [year, place].filter(Boolean).join(' in ');
  const schoolBit = [school, gpa].filter(Boolean).join(', ');
  const aim = [role, industry ? `in ${industry}` : null, company ? `toward ${company}` : null]
    .filter(Boolean)
    .join(' ');
  const activity = [
    counts.internships ? `${counts.internships} internship${counts.internships === 1 ? '' : 's'}` : null,
    counts.courses ? `${counts.courses} course${counts.courses === 1 ? '' : 's'}` : null,
    counts.events ? `${counts.events} event${counts.events === 1 ? '' : 's'}` : null,
  ].filter(Boolean);

  const lead = who
    ? `${who}${schoolBit ? ` · ${schoolBit}` : ''}${aim ? `, focused on ${aim}` : ''}.`
    : aim
      ? `Focused on ${aim}.`
      : 'Profile still filling in.';
  const skillBit = skills ? ` Skills: ${skills}.` : '';
  const work = activity.length > 0 ? ` Logged ${activity.join(', ')}.` : '';
  return `${lead}${skillBit} Graduation target: ${graduationTitle}. This year: ${thisYearTitle}. ${standing.label}.${work}`;
}

export function headlineFor(user: ProfileUser | null | undefined) {
  const role = roleLabel(user);
  const company = companyLabel(user);
  if (role && company) {
    return `${role} candidate · ${company}`;
  }
  return role ?? company ?? 'Building a career path';
}

export function standingFor(
  courseCount: number,
  eventCount: number,
  internshipCount = 0,
): ResumeStanding {
  const total = courseCount + eventCount + internshipCount;
  if (total === 0) {
    return {
      label: 'Getting started',
      detail: 'Log a course, event, or internship to start filling in this resume.',
      level: 'starting',
    };
  }
  if (total < 4) {
    return {
      label: 'Building momentum',
      detail: `${courseCount} course${courseCount === 1 ? '' : 's'} · ${internshipCount} internship${internshipCount === 1 ? '' : 's'} · ${eventCount} event${eventCount === 1 ? '' : 's'}.`,
      level: 'building',
    };
  }
  return {
    label: 'On track',
    detail: `${courseCount} courses completed, ${internshipCount} internship${internshipCount === 1 ? '' : 's'}, ${eventCount} events attended.`,
    level: 'active',
  };
}

export function broadGoalsFor(user: ProfileUser | null | undefined) {
  const role = roleLabel(user);
  const industry = industryLabel(user);
  const company = companyLabel(user);
  const title = [role, company].filter(Boolean).join(' at ') || 'Career path in progress';
  const parts = [
    role ? `Become a ${role}` : null,
    industry ? `in ${industry}` : null,
    company ? `with ${company} as the north star` : null,
  ].filter(Boolean);
  return {
    title,
    detail:
      parts.length > 0
        ? `${parts.join(' ')}.`
        : 'Finish onboarding to set a role, industry, and company target.',
  };
}

export function weekWindowLabel(now = Date.now()) {
  const start = new Date(now - WEEK_MS);
  const end = new Date(now);
  const fmt = (date: Date) =>
    date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  return `${fmt(start)} – ${fmt(end)}`;
}

export function thisWeekItems(items: ResumeItem[], now = Date.now()) {
  const start = now - WEEK_MS;
  return items
    .filter((item) => item.completedAt >= start && item.completedAt <= now)
    .sort((a, b) => b.completedAt - a.completedAt);
}

export function weeklyAchievementFor(items: ResumeItem[], user: ProfileUser | null | undefined): GoalBlock {
  const weekItems = thisWeekItems(items);
  if (weekItems.length > 0) {
    const names = weekItems.slice(0, 3).map((item) => item.name);
    const extra = weekItems.length > 3 ? ` and ${weekItems.length - 3} more` : '';
    return {
      title: `${weekItems.length} win${weekItems.length === 1 ? '' : 's'} this week`,
      detail: `${names.join(', ')}${extra}.`,
      source: 'logged',
    };
  }

  const role = roleLabel(user) ?? 'your target role';
  return {
    title: 'No logged wins yet this week',
    detail: `Mark a course, internship, or event complete to fill this in. Suggested focus: one concrete step toward ${role}.`,
    source: 'derived',
  };
}

export function semesterGoalFor(user: ProfileUser | null | undefined): GoalBlock {
  const role = roleLabel(user);
  const company = companyLabel(user);
  const industry = industryLabel(user);
  const year = yearLabel(user);
  const semester = currentSemesterLabel();

  if (role && company) {
    return {
      title: `${semester}: ${role} at ${company}`,
      detail: `Leave this term with a stronger ${role} story — coursework, events, and a portfolio that would read well to ${company}.`,
      source: 'derived',
    };
  }

  return {
    title: `${semester} goal`,
    detail: year
      ? `Use this ${year.toLowerCase()} term to lock a ${industry ?? 'career'} direction and a first set of proof points.`
      : 'Set a role and company in onboarding to turn this into a concrete semester target.',
    source: 'derived',
  };
}

export function currentSemesterLabel(now = new Date()) {
  const month = now.getMonth();
  const year = now.getFullYear();
  if (month >= 7) {
    return `Fall ${year}`;
  }
  if (month >= 4) {
    return `Summer ${year}`;
  }
  return `Spring ${year}`;
}

export function formatLoggedDate(timestamp: number) {
  return new Date(timestamp).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function resumeHtml(input: {
  name: string;
  email?: string;
  phone?: string;
  place?: string;
  year?: string;
  school?: string;
  gpa?: string;
  skills?: string;
  standing: ResumeStanding;
  graduation: { title: string; detail: string };
  yearly: { yearLabel: string; title: string; detail: string }[];
  weekly: GoalBlock;
  weekLabel: string;
  internships: ResumeItem[];
  courses: ResumeItem[];
  events: ResumeItem[];
}) {
  const contact = [
    input.place,
    input.year,
    input.school,
    input.gpa,
    input.email,
    input.phone,
  ].filter(Boolean).join(' · ');
  const yearlyLines =
    input.yearly.length === 0
      ? `<p class="muted">No yearly goals yet.</p>`
      : `<ul>${input.yearly
          .map(
            (goal) =>
              `<li><strong>${escapeHtml(goal.yearLabel)} — ${escapeHtml(goal.title)}</strong> — ${escapeHtml(goal.detail)}</li>`,
          )
          .join('')}</ul>`;
  const internshipLines = listHtml(input.internships, 'No internships marked complete yet.');
  const courseLines = listHtml(input.courses, 'No courses marked complete yet.');
  const eventLines = listHtml(input.events, 'No events marked attended yet.');

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(input.name)} — Resume</title>
    <style>
      @page { margin: 0.7in; }
      body { font-family: Georgia, "Times New Roman", serif; color: #111; margin: 40px; max-width: 720px; }
      h1 { font-size: 28px; margin: 0 0 6px; }
      h2 { font-size: 13px; letter-spacing: 0.12em; text-transform: uppercase; margin: 28px 0 8px; border-bottom: 1px solid #ccc; padding-bottom: 4px; }
      p, li { font-size: 14px; line-height: 1.45; }
      .muted { color: #555; }
      ul { padding-left: 18px; margin: 0; }
    </style>
  </head>
  <body>
    <h1>${escapeHtml(input.name)}</h1>
    <p class="muted">${escapeHtml(contact || 'Student profile')}</p>
    <p class="muted">Use Print → Save as PDF to download a copy.</p>
    <p>${escapeHtml(input.standing.label)} — ${escapeHtml(input.standing.detail)}</p>
    ${input.skills ? `<h2>Skills</h2><p>${escapeHtml(input.skills)}</p>` : ''}
    <h2>Graduation goal</h2>
    <p><strong>${escapeHtml(input.graduation.title)}</strong><br />${escapeHtml(input.graduation.detail)}</p>
    <h2>Yearly goals</h2>
    ${yearlyLines}
    <h2>This week (${escapeHtml(input.weekLabel)})</h2>
    <p><strong>${escapeHtml(input.weekly.title)}</strong><br />${escapeHtml(input.weekly.detail)}</p>
    <h2>Internships completed</h2>
    ${internshipLines}
    <h2>Courses completed</h2>
    ${courseLines}
    <h2>Events attended</h2>
    ${eventLines}
  </body>
</html>`;
}

function listHtml(items: ResumeItem[], empty: string) {
  if (items.length === 0) {
    return `<p class="muted">${escapeHtml(empty)}</p>`;
  }
  return `<ul>${items
    .map((item) => {
      const meta = [item.detail, formatLoggedDate(item.completedAt)].filter(Boolean).join(' · ');
      return `<li><strong>${escapeHtml(item.name)}</strong>${meta ? ` — ${escapeHtml(meta)}` : ''}</li>`;
    })
    .join('')}</ul>`;
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}
