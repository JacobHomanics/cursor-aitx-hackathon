import { v } from 'convex/values';

import { formatActivityLog, loggedIds, type ActivityHistory } from './activity';
import { internal } from './_generated/api';
import { action, internalMutation, query } from './_generated/server';
import {
  completeChat,
  parseChatPicks,
  parseChatSummary,
  prettyJson,
  type ChatPick,
} from './chatgpt';
import { formatProfile, formatProfileLines, type FormattedProfile, type StudentProfile } from './profile';
import { searchYoutubeCourses, type YoutubeCourse } from './youtube';

const analyzedCourseValidator = v.object({
  id: v.string(),
  name: v.string(),
  url: v.string(),
  channel: v.optional(v.string()),
  kind: v.optional(v.union(v.literal('playlist'), v.literal('video'))),
  videoCount: v.optional(v.string()),
  duration: v.optional(v.string()),
  coverUrl: v.optional(v.string()),
  reason: v.optional(v.string()),
  fit: v.optional(v.union(v.literal('high'), v.literal('medium'), v.literal('low'))),
});

const analysisValidator = v.object({
  summary: v.string(),
  courses: v.array(analyzedCourseValidator),
  createdAt: v.number(),
  prompt: v.string(),
  response: v.string(),
});

export const latest = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    return await ctx.db
      .query('courseAnalyses')
      .withIndex('by_token', (q) => q.eq('tokenIdentifier', identity.tokenIdentifier))
      .unique();
  },
});

export const saveLatest = internalMutation({
  args: analysisValidator,
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }

    const existing = await ctx.db
      .query('courseAnalyses')
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

    return await ctx.db.insert('courseAnalyses', doc);
  },
});

export const analyzeCourses = action({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Sign in to analyze courses');
    }

    const user: StudentProfile | null = await ctx.runQuery(internal.users.currentInternal, {});
    if (!user?.industryInterest || !user.roleInterest) {
      throw new Error('Finish onboarding so we know your industry and role');
    }

    const history: ActivityHistory = await ctx.runQuery(internal.activity.historyInternal, {});
    const profile = formatProfile(user);
    const catalog = await searchYoutubeCourses(courseQueries(profile), loggedIds(history.courses));
    const { analysis, prompt, response } = await analyzeWithChatGPT(profile, catalog, history);
    const ranked = rankCourses(catalog, analysis.picks);
    const createdAt = Date.now();
    const result = {
      summary: analysis.summary,
      courses: ranked,
      createdAt,
      prompt,
      response,
    };

    await ctx.runMutation(internal.courses.saveLatest, result);
    return result;
  },
});

type ChatAnalysis = {
  summary: string;
  picks: ChatPick[];
};

function courseQueries(profile: FormattedProfile) {
  const queries = [`${profile.role} ${profile.industry} course`, `${profile.role} full course`];
  if (profile.preferredCompany !== 'Unknown') {
    queries.push(`${profile.preferredCompany} ${profile.role} course`);
  }
  return queries;
}

async function analyzeWithChatGPT(
  profile: FormattedProfile,
  catalog: YoutubeCourse[],
  history: ActivityHistory,
): Promise<{ analysis: ChatAnalysis; prompt: string; response: string }> {
  const courseLines =
    catalog.length > 0
      ? catalog.map((course, index) => formatCourseLine(course, index)).join('\n')
      : 'No new YouTube courses were found for this profile (courses the student already completed are excluded).';
  const system = [
    'You match a college student to real YouTube courses (playlists and long videos).',
    'You will receive their profile, a log of events they attended and courses they completed, and a numbered list of YouTube courses.',
    'Connect the student to those courses: name the courses in your writeup and explain why each pick fits their year, industry, role, or preferred company.',
    'Use the activity log to see what the student has already done: never recommend something already in it, and prefer courses that build on it (for example a more advanced follow-up) or cover what it has not touched yet. Say so in the reason when it applies.',
    'Only use courses from the list. Do not invent titles or URLs.',
    'Return JSON with:',
    '- summary: 3-6 sentences that name the best matching courses and make the profile connection',
    '- picks: up to 8 objects with id (from the list), name, reason (why it fits this student), and fit (high, medium, or low)',
    'If the course list is empty, say so in summary and return an empty picks array.',
  ].join(' ');
  const user = [
    'Student profile:',
    ...formatProfileLines(profile),
    '',
    formatActivityLog(history),
    '',
    'YouTube courses:',
    courseLines,
    '',
    'Recommend the best matches and explain how each course connects to this student.',
  ].join('\n');
  const messages = [
    { role: 'system' as const, content: system },
    { role: 'user' as const, content: user },
  ];
  const prompt = `System:\n${system}\n\nUser:\n${user}`;

  try {
    const response = prettyJson(await completeChat(messages));
    return {
      analysis: {
        summary: parseChatSummary(
          response,
          catalog.length > 0
            ? 'Here are YouTube courses matched to your profile.'
            : 'No matching YouTube courses were found.',
        ),
        picks: parseChatPicks(response, new Set(catalog.map((course) => course.id))),
      },
      prompt,
      response,
    };
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'ChatGPT is unavailable';
    return {
      analysis: {
        summary:
          catalog.length > 0
            ? `Here are YouTube courses related to ${profile.role}. ${detail}`
            : `We could not find YouTube courses for ${profile.role}. ${detail}`,
        picks: [],
      },
      prompt,
      response: detail,
    };
  }
}

function formatCourseLine(course: YoutubeCourse, index: number) {
  const kind = course.kind === 'playlist' ? 'playlist' : 'video';
  const channel = course.channel ?? 'unknown channel';
  const extra = course.videoCount ?? course.duration;
  const extraBit = extra ? ` · ${extra}` : '';
  return `${index + 1}. ${course.name} [id: ${course.id}] — ${kind} — ${channel}${extraBit}`;
}

function rankCourses(courses: YoutubeCourse[], picks: ChatPick[]) {
  const byId = new Map(courses.map((course) => [course.id, course]));
  const picked = picks.flatMap((pick) => {
    const course = byId.get(pick.id);
    if (!course) {
      return [];
    }
    byId.delete(pick.id);
    return [{ ...course, reason: pick.reason, fit: pick.fit }];
  });

  if (picked.length > 0) {
    return picked.slice(0, 8);
  }

  return courses.slice(0, 8).map((course) => ({
    ...course,
    reason: 'Related YouTube course for your profile.',
    fit: 'medium' as const,
  }));
}
