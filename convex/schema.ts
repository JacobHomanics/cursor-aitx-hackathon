import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  users: defineTable({
    tokenIdentifier: v.string(),
    privyDid: v.string(),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    phone: v.optional(v.string()),
    collegeYear: v.optional(
      v.union(
        v.literal('first_year'),
        v.literal('second_year'),
        v.literal('third_year'),
        v.literal('fourth_year'),
        v.literal('fifth_year_plus'),
        v.literal('graduate'),
        v.literal('other'),
      ),
    ),
    city: v.optional(v.string()),
    state: v.optional(v.string()),
    industryInterest: v.optional(v.string()),
    roleInterest: v.optional(v.string()),
    preferredCompany: v.optional(v.string()),
    onboardingCompletedAt: v.optional(v.number()),
  })
    .index('by_token', ['tokenIdentifier'])
    .index('by_privy_did', ['privyDid']),
});
