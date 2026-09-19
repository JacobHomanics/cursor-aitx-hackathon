import { v } from 'convex/values';

import { internalQuery, mutation, query } from './_generated/server';

const collegeYearValidator = v.union(
  v.literal('not_yet'),
  v.literal('first_year'),
  v.literal('second_year'),
  v.literal('third_year'),
  v.literal('fourth_year'),
  v.literal('fifth_year_plus'),
  v.literal('graduate'),
  v.literal('other'),
);

const skillLevelValidator = v.union(
  v.literal(1),
  v.literal(2),
  v.literal(3),
  v.literal(4),
  v.literal(5),
);

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
    highSchool: v.string(),
    gpa: v.number(),
    inCollege: v.boolean(),
    collegeYear: collegeYearValidator,
    dateOfBirth: v.string(),
    country: v.string(),
    city: v.string(),
    state: v.string(),
    industryInterest: v.string(),
    roleInterest: v.string(),
    preferredCompany: v.string(),
    hardSkills: v.array(v.object({ name: v.string(), level: skillLevelValidator })),
    softSkills: v.object({
      communication: skillLevelValidator,
      teamwork: skillLevelValidator,
      problemSolving: skillLevelValidator,
      timeManagement: skillLevelValidator,
      adaptability: skillLevelValidator,
      leadership: skillLevelValidator,
    }),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }

    const highSchool = args.highSchool.trim();
    const country = args.country.trim();
    const city = args.city.trim();
    const state = args.state.trim();
    const industryInterest = args.industryInterest.trim();
    const roleInterest = args.roleInterest.trim();
    const preferredCompany = args.preferredCompany.trim();
    const dateOfBirth = args.dateOfBirth.trim();
    const hardSkills = args.hardSkills
      .map((skill) => ({ name: skill.name.trim(), level: skill.level }))
      .filter((skill) => skill.name.length > 0)
      .slice(0, 12);

    if (
      !highSchool ||
      !country ||
      !city ||
      !state ||
      !industryInterest ||
      !roleInterest ||
      !preferredCompany ||
      !dateOfBirth
    ) {
      throw new Error('All onboarding answers are required');
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)) {
      throw new Error('Date of birth must be YYYY-MM-DD');
    }
    if (args.gpa < 0 || args.gpa > 5) {
      throw new Error('GPA must be between 0 and 5');
    }
    if (!args.inCollege && args.collegeYear !== 'not_yet') {
      throw new Error('College year does not match college status');
    }
    if (args.inCollege && args.collegeYear === 'not_yet') {
      throw new Error('Choose your college year');
    }
    if (hardSkills.length === 0) {
      throw new Error('Add at least one hard skill');
    }
    if (
      highSchool.length > 80 ||
      country.length > 80 ||
      city.length > 80 ||
      state.length > 80 ||
      industryInterest.length > 80 ||
      roleInterest.length > 80 ||
      preferredCompany.length > 80 ||
      hardSkills.some((skill) => skill.name.length > 40)
    ) {
      throw new Error('Answers are too long');
    }

    const existing = await ctx.db
      .query('users')
      .withIndex('by_token', (q) => q.eq('tokenIdentifier', identity.tokenIdentifier))
      .unique();

    if (!existing) {
      throw new Error('User not found');
    }

    await ctx.db.patch(existing._id, {
      highSchool,
      gpa: args.gpa,
      inCollege: args.inCollege,
      collegeYear: args.collegeYear,
      dateOfBirth,
      country,
      city,
      state,
      industryInterest,
      roleInterest,
      preferredCompany,
      hardSkills,
      softSkills: args.softSkills,
      onboardingCompletedAt: Date.now(),
    });
  },
});
