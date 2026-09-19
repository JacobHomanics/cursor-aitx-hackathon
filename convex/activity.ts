import { v } from 'convex/values';

import {
  internalQuery,
  mutation,
  query,
  type MutationCtx,
  type QueryCtx,
} from './_generated/server';

export type ActivityKind = 'event' | 'course';

export type ActivityEntry = {
  kind: ActivityKind;
  itemId: string;
  name: string;
  url: string;
  detail?: string;
  completedAt: number;
};

export type ActivityHistory = {
  events: ActivityEntry[];
  courses: ActivityEntry[];
};

const kindValidator = v.union(v.literal('event'), v.literal('course'));

/** Read cap per kind. Enough to exclude everything the student has ever logged. */
const MAX_ENTRIES = 500;
/** How many of the most recent entries per kind are written into the ChatGPT prompt. */
const PROMPT_ENTRIES = 30;

export const list = query({
  args: {},
  handler: async (ctx): Promise<ActivityHistory | null> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    return await loadHistory(ctx, identity.tokenIdentifier);
  },
});

export const historyInternal = internalQuery({
  args: {},
  handler: async (ctx): Promise<ActivityHistory> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return { events: [], courses: [] };
    }

    return await loadHistory(ctx, identity.tokenIdentifier);
  },
});

export const setCompleted = mutation({
  args: {
    kind: kindValidator,
    itemId: v.string(),
    completed: v.boolean(),
  },
  handler: async (ctx, { kind, itemId, completed }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }

    const existing = await ctx.db
      .query('activityLog')
      .withIndex('by_token_and_kind_and_item', (q) =>
        q.eq('tokenIdentifier', identity.tokenIdentifier).eq('kind', kind).eq('itemId', itemId),
      )
      .unique();

    if (!completed) {
      if (existing) {
        await ctx.db.delete(existing._id);
      }
      return;
    }

    if (existing) {
      return;
    }

    const item = await findItem(ctx, identity.tokenIdentifier, kind, itemId);
    if (!item) {
      throw new Error('That item is no longer in your latest results');
    }

    await ctx.db.insert('activityLog', {
      tokenIdentifier: identity.tokenIdentifier,
      kind,
      itemId,
      ...item,
      completedAt: Date.now(),
    });
  },
});

/** The log as a block of prompt text, most recent first. */
export function formatActivityLog(history: ActivityHistory) {
  const events = history.events.slice(0, PROMPT_ENTRIES);
  const courses = history.courses.slice(0, PROMPT_ENTRIES);
  if (events.length === 0 && courses.length === 0) {
    return 'Activity log: the student has not logged any events or courses yet.';
  }

  const lines = ['Activity log (already done, most recent first):'];
  if (events.length > 0) {
    lines.push('Events attended:', ...events.map(formatLogLine));
  }
  if (courses.length > 0) {
    lines.push('Courses completed:', ...courses.map(formatLogLine));
  }
  return lines.join('\n');
}

export function loggedIds(entries: ActivityEntry[]) {
  return new Set(entries.map((entry) => entry.itemId));
}

function formatLogLine(entry: ActivityEntry) {
  const date = new Date(entry.completedAt).toISOString().slice(0, 10);
  const detail = entry.detail ? ` — ${entry.detail}` : '';
  return `- ${entry.name}${detail} — logged ${date}`;
}

async function loadHistory(ctx: QueryCtx, tokenIdentifier: string): Promise<ActivityHistory> {
  const [events, courses] = await Promise.all([
    loadKind(ctx, tokenIdentifier, 'event'),
    loadKind(ctx, tokenIdentifier, 'course'),
  ]);
  return { events, courses };
}

async function loadKind(
  ctx: QueryCtx,
  tokenIdentifier: string,
  kind: ActivityKind,
): Promise<ActivityEntry[]> {
  const rows = await ctx.db
    .query('activityLog')
    .withIndex('by_token_and_kind', (q) => q.eq('tokenIdentifier', tokenIdentifier).eq('kind', kind))
    .order('desc')
    .take(MAX_ENTRIES);

  return rows.map(({ kind, itemId, name, url, detail, completedAt }) => ({
    kind,
    itemId,
    name,
    url,
    detail,
    completedAt,
  }));
}

/** Looks the item up in the student's latest analysis so the client only has to send an id. */
async function findItem(
  ctx: MutationCtx,
  tokenIdentifier: string,
  kind: ActivityKind,
  itemId: string,
): Promise<{ name: string; url: string; detail?: string } | null> {
  if (kind === 'event') {
    const analysis = await ctx.db
      .query('eventAnalyses')
      .withIndex('by_token', (q) => q.eq('tokenIdentifier', tokenIdentifier))
      .unique();
    const event = analysis?.events.find((entry) => entry.id === itemId);
    if (!event) {
      return null;
    }
    return {
      name: event.name,
      url: event.url,
      detail: [event.location, event.calendarName].filter(Boolean).join(' · ') || undefined,
    };
  }

  const analysis = await ctx.db
    .query('courseAnalyses')
    .withIndex('by_token', (q) => q.eq('tokenIdentifier', tokenIdentifier))
    .unique();
  const course = analysis?.courses.find((entry) => entry.id === itemId);
  if (!course) {
    return null;
  }
  const type = course.kind === 'playlist' ? 'Playlist' : course.kind === 'video' ? 'Video' : undefined;
  return {
    name: course.name,
    url: course.url,
    detail: [type, course.channel].filter(Boolean).join(' · ') || undefined,
  };
}
