import { v } from 'convex/values';

import { formatActivityLog, type ActivityHistory } from './activity';
import { internal } from './_generated/api';
import { action, internalMutation, query } from './_generated/server';
import { completeChat, parseChatString, parseChatSummary, prettyJson } from './chatgpt';
import { formatProfile, type FormattedProfile, type StudentProfile } from './profile';

const analysisValidator = v.object({
  title: v.string(),
  summary: v.string(),
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
    const { title, summary, prompt, response } = await recommendWithChatGPT(profile, history);
    const result = {
      title,
      summary,
      createdAt: Date.now(),
      prompt,
      response,
    };

    await ctx.runMutation(internal.internships.saveLatest, result);
    return result;
  },
});

async function recommendWithChatGPT(profile: FormattedProfile, history: ActivityHistory) {
  const fallbackTitle = `${profile.role} intern`;
  const system = [
    'You recommend one internship job title for a college student based on their profile and activity log.',
    'Return a role title they should apply for, such as "Software Engineering Intern" or "Investment Banking Summer Analyst".',
    'Do not recommend a specific company posting, URL, application, or job listing.',
    'Do not invent a company name as if it were a live opening.',
    'Return JSON with:',
    '- title: a single internship job title',
    '- summary: 2-4 sentences explaining why this title fits this student (year, location, industry, role, preferred company, and what they have already done)',
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
    'Recommend one internship job title this student should apply for, and explain the connection.',
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
        `Based on this profile, a strong next step is applying for a ${fallbackTitle} role.`,
      ),
      prompt,
      response,
    };
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'ChatGPT is unavailable';
    return {
      title: fallbackTitle,
      summary: `Could not get a ChatGPT internship recommendation. ${detail}`,
      prompt,
      response: detail,
    };
  }
}
