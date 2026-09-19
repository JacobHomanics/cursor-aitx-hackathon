import { v } from 'convex/values';

import { formatActivityLog, type ActivityHistory } from './activity';
import { internal } from './_generated/api';
import { action, internalMutation, query } from './_generated/server';
import { completeChat, parseChatStringList, prettyJson } from './chatgpt';
import { formatProfile, type FormattedProfile, type StudentProfile } from './profile';

const YEAR_STOPS = ['1st year', '2nd year', '3rd year', '4th year'] as const;

export const latest = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    return await ctx.db
      .query('journeyPlans')
      .withIndex('by_token', (q) => q.eq('tokenIdentifier', identity.tokenIdentifier))
      .unique();
  },
});

export const saveLatest = internalMutation({
  args: {
    profileKey: v.string(),
    titles: v.array(v.string()),
    createdAt: v.number(),
    prompt: v.string(),
    response: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }

    const existing = await ctx.db
      .query('journeyPlans')
      .withIndex('by_token', (q) => q.eq('tokenIdentifier', identity.tokenIdentifier))
      .unique();

    const doc = {
      tokenIdentifier: identity.tokenIdentifier,
      ...args,
    };

    if (existing) {
      await ctx.db.patch(existing._id, doc);
      return existing._id;
    }

    return await ctx.db.insert('journeyPlans', doc);
  },
});

export const generateTitles = action({
  args: {},
  handler: async (ctx): Promise<{
    profileKey: string;
    titles: string[];
    createdAt: number;
    prompt: string;
    response: string;
  }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Sign in to generate internship titles');
    }

    const user: StudentProfile | null = await ctx.runQuery(internal.users.currentInternal, {});
    if (!user?.roleInterest) {
      throw new Error('Finish onboarding so we know your role');
    }

    const history: ActivityHistory = await ctx.runQuery(internal.activity.historyInternal, {});
    const profile = formatProfile(user);
    const profileKey: string = [
      user.collegeYear ?? '',
      user.roleInterest,
      user.industryInterest ?? '',
      user.preferredCompany ?? '',
    ].join('|');
    const summers = summerYears(user.collegeYear);
    const fallbackTitles = fallbackInternshipTitles(profile.role, summers);
    const { titles, prompt, response } = await titlesWithChatGPT(profile, history, summers, fallbackTitles);
    const result = {
      profileKey,
      titles,
      createdAt: Date.now(),
      prompt,
      response,
    };

    await ctx.runMutation(internal.journey.saveLatest, result);
    return result;
  },
});

async function titlesWithChatGPT(
  profile: FormattedProfile,
  history: ActivityHistory,
  summers: number[],
  fallbackTitles: string[],
) {
  const yearLines = YEAR_STOPS.map(
    (label, index) => `${index + 1}. ${label} · Summer ${summers[index]} intern`,
  ).join('\n');
  const system = [
    'You write realistic U.S. college internship job titles for a four-year path.',
    'Titles must sound like real job postings, not made-up progress labels.',
    'Good: "Microsoft Explore Intern", "Software Engineering Intern", "Summer Analyst, Investment Banking", "APM Intern", "Product Design Intern, Summer 2028".',
    'Bad: "Exploratory intern", "Returning intern", "Senior intern", "Full-time track intern".',
    'Use named programs when they fit the preferred company (Google STEP, Microsoft Explore, Meta University, Goldman Sachs Summer Analyst).',
    'Otherwise use the posting title companies actually use, optionally with a function or team.',
    'Progress from freshman-friendly to more specialized by year. Keep each title under 56 characters.',
    'Do not invent a company the student did not name. Return JSON: { "titles": ["...", "...", "...", "..."] } with exactly 4 titles in year order.',
  ].join(' ');
  const user = [
    'Student profile:',
    `- College year: ${profile.collegeYear}`,
    `- Location: ${profile.location}`,
    `- Industry interest: ${profile.industry}`,
    `- Role interest: ${profile.role}`,
    `- Preferred company: ${profile.preferredCompany}`,
    '',
    formatActivityLog(history),
    '',
    'Write one internship title for each year:',
    yearLines,
  ].join('\n');
  const messages = [
    { role: 'system' as const, content: system },
    { role: 'user' as const, content: user },
  ];
  const prompt = `System:\n${system}\n\nUser:\n${user}`;

  try {
    const response = prettyJson(await completeChat(messages, 0.8));
    return {
      titles: parseChatStringList(response, 'titles', fallbackTitles),
      prompt,
      response,
    };
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'ChatGPT is unavailable';
    return {
      titles: fallbackTitles,
      prompt,
      response: detail,
    };
  }
}

function fallbackInternshipTitles(role: string, summers: number[]) {
  const base = internshipBaseTitle(role);
  return [
    freshmanTitle(role, summers[0]),
    `${base}, Summer ${summers[1]}`,
    specializedTitle(role, summers[2]),
    `${base}, Summer ${summers[3]}`,
  ];
}

function internshipBaseTitle(role: string) {
  switch (role) {
    case 'Software engineer':
      return 'Software Engineering Intern';
    case 'Product manager':
      return 'Product Management Intern';
    case 'Designer':
      return 'Product Design Intern';
    case 'Data scientist':
      return 'Data Science Intern';
    case 'Researcher':
      return 'Research Intern';
    case 'Founder':
      return 'Founding Engineer Intern';
    case 'Consultant':
      return 'Business Analyst Intern';
    case 'Operations':
      return 'Business Operations Intern';
    case 'Marketing':
      return 'Product Marketing Intern';
    case 'Policy':
      return 'Public Policy Intern';
    default:
      return `${role} Intern`;
  }
}

function freshmanTitle(role: string, summer: number) {
  if (role === 'Software engineer') {
    return `Explore Engineering Intern, Summer ${summer}`;
  }
  if (role === 'Product manager') {
    return `Associate Product Manager Intern, Summer ${summer}`;
  }
  if (role === 'Consultant') {
    return `Summer Analyst Intern, Summer ${summer}`;
  }
  return `${internshipBaseTitle(role)}, Summer ${summer}`;
}

function specializedTitle(role: string, summer: number) {
  switch (role) {
    case 'Software engineer':
      return `Software Engineering Intern, Backend, Summer ${summer}`;
    case 'Product manager':
      return `Product Manager Intern, Growth, Summer ${summer}`;
    case 'Designer':
      return `Product Design Intern, Systems, Summer ${summer}`;
    case 'Data scientist':
      return `Machine Learning Intern, Summer ${summer}`;
    case 'Researcher':
      return `Applied Research Intern, Summer ${summer}`;
    case 'Founder':
      return `Founding Product Intern, Summer ${summer}`;
    case 'Consultant':
      return `Strategy Intern, Summer ${summer}`;
    case 'Operations':
      return `Program Operations Intern, Summer ${summer}`;
    case 'Marketing':
      return `Growth Marketing Intern, Summer ${summer}`;
    case 'Policy':
      return `Policy Research Intern, Summer ${summer}`;
    default:
      return `${internshipBaseTitle(role)}, Summer ${summer}`;
  }
}

function summerYears(collegeYear: string | undefined) {
  const remaining =
    collegeYear === 'first_year'
      ? 4
      : collegeYear === 'second_year'
        ? 3
        : collegeYear === 'third_year'
          ? 2
          : collegeYear === 'fourth_year' || collegeYear === 'fifth_year_plus'
            ? 1
            : collegeYear === 'graduate'
              ? 0
              : 4;
  const now = new Date();
  const academicStart = now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1;
  const gradYear = remaining === 0 ? now.getFullYear() : academicStart + remaining;
  return [gradYear - 3, gradYear - 2, gradYear - 1, gradYear];
}
