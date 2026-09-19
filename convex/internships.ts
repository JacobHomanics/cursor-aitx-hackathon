import { v } from 'convex/values';

import { formatActivityLog, type ActivityHistory } from './activity';
import { internal } from './_generated/api';
import { action, internalMutation, query } from './_generated/server';
import {
  completeChat,
  parseChatPicks,
  parseChatString,
  parseChatSummary,
  prettyJson,
  type ChatPick,
} from './chatgpt';
import { searchInternshipListings, type InternshipListing } from './jobs';
import { formatProfile, type FormattedProfile, type StudentProfile } from './profile';

const listingValidator = v.object({
  id: v.string(),
  name: v.string(),
  url: v.string(),
  company: v.optional(v.string()),
  location: v.optional(v.string()),
  category: v.optional(v.string()),
  publishedAt: v.optional(v.string()),
  reason: v.optional(v.string()),
  fit: v.optional(v.union(v.literal('high'), v.literal('medium'), v.literal('low'))),
});

const analysisValidator = v.object({
  title: v.string(),
  summary: v.string(),
  listings: v.array(listingValidator),
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
      .query('internshipAnalyses')
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
      .query('internshipAnalyses')
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

    return await ctx.db.insert('internshipAnalyses', doc);
  },
});

export const recommendInternship = action({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Sign in to get an internship recommendation');
    }

    const user: StudentProfile | null = await ctx.runQuery(internal.users.currentInternal, {});
    if (!user?.industryInterest || !user.roleInterest) {
      throw new Error('Finish onboarding so we know your industry and role');
    }

    const history: ActivityHistory = await ctx.runQuery(internal.activity.historyInternal, {});
    const profile = formatProfile(user);
    const catalog = await searchInternshipListings({
      roleInterest: user.roleInterest,
      industryInterest: user.industryInterest,
      preferredCompany: user.preferredCompany,
      city: user.city,
      state: user.state,
    });
    const { title, summary, picks, prompt, response } = await recommendWithChatGPT(
      profile,
      catalog,
      history,
    );
    const result = {
      title,
      summary,
      listings: rankListings(catalog, picks),
      createdAt: Date.now(),
      prompt,
      response,
    };

    await ctx.runMutation(internal.internships.saveLatest, result);
    return result;
  },
});

async function recommendWithChatGPT(
  profile: FormattedProfile,
  catalog: InternshipListing[],
  history: ActivityHistory,
) {
  const fallbackTitle = `${profile.role} intern`;
  const listingLines =
    catalog.length > 0
      ? catalog.map((listing, index) => formatListingLine(listing, index)).join('\n')
      : 'No public internship listings were found for this profile.';
  const system = [
    'You match a college student to real public internship listings from The Muse.',
    'You will receive their profile, a log of events they attended and courses they completed, and a numbered list of live internship postings.',
    'Recommend one internship job title they should apply for, then pick the best matching listings from the list.',
    'Connect the student to those listings: name the job and company in your writeup and explain why each pick fits their year, location, industry, role, preferred company, or activity log.',
    'Only use listings from the list. Do not invent postings, companies, or URLs.',
    'Return JSON with:',
    '- title: a single internship job title (not a company posting)',
    '- summary: 3-6 sentences that name the best matching listings and make the profile connection',
    '- picks: up to 8 objects with id (from the list), name, reason (why it fits this student), and fit (high, medium, or low)',
    'If the listing list is empty, still return a title and say so in summary with an empty picks array.',
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
    'Live internship listings:',
    listingLines,
    '',
    'Recommend one internship title and the best matching listings from this list.',
  ].join('\n');
  const messages = [
    { role: 'system' as const, content: system },
    { role: 'user' as const, content: user },
  ];
  const prompt = `System:\n${system}\n\nUser:\n${user}`;

  try {
    const response = prettyJson(await completeChat(messages));
    return {
      title: parseChatString(response, 'title', fallbackTitle),
      summary: parseChatSummary(
        response,
        catalog.length > 0
          ? 'Here are public internship listings matched to your profile.'
          : `Based on this profile, a strong next step is applying for a ${fallbackTitle} role.`,
      ),
      picks: parseChatPicks(response, new Set(catalog.map((listing) => listing.id))),
      prompt,
      response,
    };
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'ChatGPT is unavailable';
    return {
      title: fallbackTitle,
      summary:
        catalog.length > 0
          ? `Here are public internship listings related to ${profile.role}. ${detail}`
          : `Could not get internship listings for ${profile.role}. ${detail}`,
      picks: [] as ChatPick[],
      prompt,
      response: detail,
    };
  }
}

function formatListingLine(listing: InternshipListing, index: number) {
  const company = listing.company ?? 'unknown company';
  const location = listing.location ?? 'location TBA';
  const category = listing.category ? ` · ${listing.category}` : '';
  return `${index + 1}. ${listing.name} [id: ${listing.id}] — ${company} — ${location}${category}`;
}

function rankListings(listings: InternshipListing[], picks: ChatPick[]) {
  const byId = new Map(listings.map((listing) => [listing.id, listing]));
  const picked = picks.flatMap((pick) => {
    const listing = byId.get(pick.id);
    if (!listing) {
      return [];
    }
    byId.delete(pick.id);
    return [{ ...listing, reason: pick.reason, fit: pick.fit }];
  });

  if (picked.length > 0) {
    return picked.slice(0, 8);
  }

  return listings.slice(0, 8).map((listing) => ({
    ...listing,
    reason: 'Public internship listing related to your profile.',
    fit: 'medium' as const,
  }));
}
