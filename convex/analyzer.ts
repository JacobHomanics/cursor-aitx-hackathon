import { v } from 'convex/values';

import { internal } from './_generated/api';
import { action, internalMutation, query } from './_generated/server';
import {
  completeChat,
  parseChatPicks,
  parseChatSummary,
  prettyJson,
  type ChatPick,
} from './chatgpt';
import { formatProfile, type StudentProfile } from './profile';
import { searchLumaEvents, type LumaEvent } from './luma';

const analyzedEventValidator = v.object({
  id: v.string(),
  name: v.string(),
  url: v.string(),
  startAt: v.optional(v.string()),
  timezone: v.optional(v.string()),
  location: v.optional(v.string()),
  calendarName: v.optional(v.string()),
  guestCount: v.optional(v.number()),
  isFree: v.optional(v.boolean()),
  coverUrl: v.optional(v.string()),
  reason: v.optional(v.string()),
  fit: v.optional(v.union(v.literal('high'), v.literal('medium'), v.literal('low'))),
});

const analysisValidator = v.object({
  summary: v.string(),
  lumaPlace: v.optional(v.string()),
  lumaSlug: v.optional(v.string()),
  events: v.array(analyzedEventValidator),
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
      .query('eventAnalyses')
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
      .query('eventAnalyses')
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

    return await ctx.db.insert('eventAnalyses', doc);
  },
});

export const analyzeEvents = action({
  args: {},
  handler: async (ctx): Promise<{
    summary: string;
    lumaPlace?: string;
    lumaSlug?: string;
    events: Array<{
      id: string;
      name: string;
      url: string;
      startAt?: string;
      timezone?: string;
      location?: string;
      calendarName?: string;
      guestCount?: number;
      isFree?: boolean;
      coverUrl?: string;
      reason?: string;
      fit?: 'high' | 'medium' | 'low';
    }>;
    createdAt: number;
    prompt: string;
    response: string;
  }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Sign in to analyze events');
    }

    const user: StudentProfile | null = await ctx.runQuery(internal.users.currentInternal, {});
    if (!user?.city || !user.state) {
      throw new Error('Finish onboarding so we know your city and state');
    }

    const luma = await searchLumaEvents(user.city, user.state);
    const profile = formatProfile(user);
    const { analysis, prompt, response } = await analyzeWithChatGPT(profile, luma);
    const ranked = rankEvents(luma.events, analysis);
    const createdAt = Date.now();
    const result = {
      summary: analysis.summary,
      lumaPlace: luma.placeName,
      lumaSlug: luma.placeSlug,
      events: ranked,
      createdAt,
      prompt,
      response,
    };

    await ctx.runMutation(internal.analyzer.saveLatest, result);
    return result;
  },
});

type ChatAnalysis = {
  summary: string;
  picks: ChatPick[];
};

type ChatExchange = {
  analysis: ChatAnalysis;
  prompt: string;
  response: string;
};

async function analyzeWithChatGPT(
  profile: ReturnType<typeof formatProfile>,
  luma: { placeName?: string; placeSlug?: string; events: LumaEvent[] },
): Promise<ChatExchange> {
  const place = luma.placeName ?? luma.placeSlug ?? profile.location;
  const catalog = luma.events.slice(0, 20);
  const eventLines =
    catalog.length > 0
      ? catalog.map((event, index) => formatEventLine(event, index)).join('\n')
      : 'No upcoming Luma events were found for this city.';
  const system = [
    'You match a college student to real public Luma (lu.ma) events near them.',
    'You will receive their profile and a numbered list of upcoming events.',
    'Connect the student to those events: name the events in your writeup and explain why each pick fits their year, location, industry, role, or preferred company.',
    'Only use events from the list. Do not invent events, dates, or URLs.',
    'Return JSON with:',
    '- summary: 3-6 sentences that name the best matching events and make the profile connection',
    '- picks: up to 8 objects with id (from the list), name, reason (why it fits this student), and fit (high, medium, or low)',
    'If the event list is empty, say so in summary and return an empty picks array.',
  ].join(' ');
  const user = [
    'Student profile:',
    `- College year: ${profile.collegeYear}`,
    `- Location: ${profile.location}`,
    `- Industry interest: ${profile.industry}`,
    `- Role interest: ${profile.role}`,
    `- Preferred company: ${profile.preferredCompany}`,
    '',
    `Upcoming Luma events near ${place}:`,
    eventLines,
    '',
    'Recommend the best matches and explain how each event connects to this student.',
  ].join('\n');
  const messages = [
    { role: 'system' as const, content: system },
    { role: 'user' as const, content: user },
  ];
  const prompt = `System:\n${system}\n\nUser:\n${user}`;

  try {
    const response = prettyJson(await completeChat(messages));
    return {
      analysis: parseChatAnalysis(response, catalog),
      prompt,
      response,
    };
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'ChatGPT is unavailable';
    return {
      analysis: {
        summary:
          catalog.length > 0
            ? `Here are upcoming Luma events near ${profile.location}. ${detail}`
            : `We could not find Luma events near ${profile.location}. ${detail}`,
        picks: [],
      },
      prompt,
      response: detail,
    };
  }
}

function formatEventLine(event: LumaEvent, index: number) {
  const when = event.startAt ?? 'date TBA';
  const location = event.location ?? 'location TBA';
  const calendar = event.calendarName ? ` · ${event.calendarName}` : '';
  return `${index + 1}. ${event.name} [id: ${event.id}] — ${when} — ${location}${calendar}`;
}

function parseChatAnalysis(content: string, events: LumaEvent[]): ChatAnalysis {
  return {
    summary: parseChatSummary(
      content,
      events.length > 0
        ? 'Here are upcoming Luma events near you, matched to your profile.'
        : 'No matching Luma events were found for this city.',
    ),
    picks: parseChatPicks(content, new Set(events.map((event) => event.id))),
  };
}

function rankEvents(events: LumaEvent[], analysis: ChatAnalysis) {
  const byId = new Map(events.map((event) => [event.id, event]));
  const picked = analysis.picks.flatMap((pick) => {
    const event = byId.get(pick.id);
    if (!event) {
      return [];
    }
    byId.delete(pick.id);
    return [{ ...event, reason: pick.reason, fit: pick.fit }];
  });

  const remainder = [...byId.values()].map((event) => ({
    ...event,
    reason: 'Upcoming on Luma near your city.',
    fit: 'medium' as const,
  }));

  if (picked.length > 0) {
    return picked.slice(0, 8);
  }

  return remainder.slice(0, 8);
}
