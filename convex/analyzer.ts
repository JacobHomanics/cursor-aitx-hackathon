import { getServiceToken } from 'convex/server';
import { v } from 'convex/values';

import { internal } from './_generated/api';
import { action, internalMutation, query } from './_generated/server';
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

type StudentProfile = {
  collegeYear?: string;
  city?: string;
  state?: string;
  industryInterest?: string;
  roleInterest?: string;
  preferredCompany?: string;
};

type ChatPick = {
  id: string;
  name?: string;
  reason: string;
  fit: 'high' | 'medium' | 'low';
};

type ChatAnalysis = {
  summary: string;
  picks: ChatPick[];
};

type ChatExchange = {
  analysis: ChatAnalysis;
  prompt: string;
  response: string;
};

function formatProfile(user: StudentProfile) {
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

async function completeChat(messages: Array<{ role: 'system' | 'user'; content: string }>) {
  try {
    const token = await getServiceToken('ai-gateway');
    return await requestChatCompletion(
      'https://ai-gateway.convex.dev/v1/chat/completions',
      token,
      'openai/gpt-4o-mini',
      messages,
    );
  } catch {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error(
        'Add OPENAI_API_KEY with npx convex env set OPENAI_API_KEY, or enable the Convex AI Gateway.',
      );
    }
    return await requestChatCompletion(
      'https://api.openai.com/v1/chat/completions',
      apiKey,
      'gpt-4o-mini',
      messages,
    );
  }
}

async function requestChatCompletion(
  endpoint: string,
  apiKey: string,
  model: string,
  messages: Array<{ role: 'system' | 'user'; content: string }>,
) {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      temperature: 0.4,
      response_format: { type: 'json_object' },
      messages,
    }),
  });

  if (!response.ok) {
    throw new Error(`ChatGPT request failed (${response.status})`);
  }

  const payload: unknown = await response.json();
  const content = readChatContent(payload);
  if (!content) {
    throw new Error('ChatGPT returned an empty response');
  }
  return content;
}

function readChatContent(payload: unknown) {
  if (!payload || typeof payload !== 'object') {
    return undefined;
  }
  const choices = (payload as { choices?: unknown }).choices;
  if (!Array.isArray(choices) || choices.length === 0) {
    return undefined;
  }
  const message = (choices[0] as { message?: { content?: unknown } }).message;
  return typeof message?.content === 'string' ? message.content : undefined;
}

function parseChatAnalysis(content: string, events: LumaEvent[]): ChatAnalysis {
  const json = extractJson(content);
  const summary =
    typeof json.summary === 'string' && json.summary.trim().length > 0
      ? json.summary.trim()
      : events.length > 0
        ? 'Here are upcoming Luma events near you, matched to your profile.'
        : 'No matching Luma events were found for this city.';

  const rawPicks = Array.isArray(json.picks) ? json.picks : [];
  const knownIds = new Set(events.map((event) => event.id));
  const picks: ChatPick[] = rawPicks.flatMap((pick) => {
    if (!pick || typeof pick !== 'object') {
      return [];
    }
    const record = pick as { id?: unknown; name?: unknown; reason?: unknown; fit?: unknown };
    const id = typeof record.id === 'string' ? record.id : undefined;
    const name = typeof record.name === 'string' ? record.name.trim() : undefined;
    const reason = typeof record.reason === 'string' ? record.reason.trim() : '';
    const fit =
      record.fit === 'high' || record.fit === 'medium' || record.fit === 'low'
        ? record.fit
        : 'medium';
    if (!id || !knownIds.has(id) || !reason) {
      return [];
    }
    return [{ id, name, reason, fit }];
  });

  return { summary, picks };
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

function prettyJson(content: string) {
  try {
    return JSON.stringify(JSON.parse(content), null, 2);
  } catch {
    return content;
  }
}

function extractJson(content: string) {
  const fenced = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fenced?.[1] ?? content;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      return parsed as Record<string, unknown>;
    }
  } catch {
    return {};
  }
  return {};
}
