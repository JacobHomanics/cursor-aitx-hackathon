import { v } from 'convex/values';

import { internalQuery, mutation, query } from './_generated/server';

export const current = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    return await ctx.db
      .query('users')
      .withIndex('by_token', (q) => q.eq('tokenIdentifier', identity.tokenIdentifier))
      .unique();
  },
});

export const currentInternal = internalQuery({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    return await ctx.db
      .query('users')
      .withIndex('by_token', (q) => q.eq('tokenIdentifier', identity.tokenIdentifier))
      .unique();
  },
});

export const store = mutation({
  args: {
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    phone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }

    const existing = await ctx.db
      .query('users')
      .withIndex('by_token', (q) => q.eq('tokenIdentifier', identity.tokenIdentifier))
      .unique();

    const profile = {
      tokenIdentifier: identity.tokenIdentifier,
      privyDid: identity.subject,
      email: args.email ?? existing?.email,
      name: args.name ?? existing?.name,
      phone: args.phone ?? existing?.phone,
    };

    if (existing) {
      await ctx.db.patch(existing._id, profile);
      return existing._id;
    }

    return await ctx.db.insert('users', profile);
  },
});

export const completeOnboarding = mutation({
  args: {
    collegeYear: v.union(
      v.literal('first_year'),
      v.literal('second_year'),
      v.literal('third_year'),
      v.literal('fourth_year'),
      v.literal('fifth_year_plus'),
      v.literal('graduate'),
      v.literal('other'),
    ),
    city: v.string(),
    state: v.string(),
    industryInterest: v.string(),
    roleInterest: v.string(),
    preferredCompany: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }

    const city = args.city.trim();
    const state = args.state.trim();
    const industryInterest = args.industryInterest.trim();
    const roleInterest = args.roleInterest.trim();
    const preferredCompany = args.preferredCompany.trim();
    if (!city || !state || !industryInterest || !roleInterest || !preferredCompany) {
      throw new Error('All onboarding answers are required');
    }
    if (
      city.length > 80 ||
      state.length > 80 ||
      industryInterest.length > 80 ||
      roleInterest.length > 80 ||
      preferredCompany.length > 80
    ) {
      throw new Error('Answers must be 80 characters or fewer');
    }

    const existing = await ctx.db
      .query('users')
      .withIndex('by_token', (q) => q.eq('tokenIdentifier', identity.tokenIdentifier))
      .unique();

    if (!existing) {
      throw new Error('User not found');
    }

    await ctx.db.patch(existing._id, {
      collegeYear: args.collegeYear,
      city,
      state,
      industryInterest,
      roleInterest,
      preferredCompany,
      onboardingCompletedAt: Date.now(),
    });
  },
});
