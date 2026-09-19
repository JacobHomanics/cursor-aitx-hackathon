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

  eventAnalyses: defineTable({
    tokenIdentifier: v.string(),
    summary: v.string(),
    lumaPlace: v.optional(v.string()),
    lumaSlug: v.optional(v.string()),
    events: v.array(
      v.object({
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
      }),
    ),
    createdAt: v.number(),
    prompt: v.optional(v.string()),
    response: v.optional(v.string()),
  }).index('by_token', ['tokenIdentifier']),

  /**
   * Events the student attended and courses they completed. Name, url and detail are copied from
   * the analysis at the time so the log survives the analysis being replaced on refresh.
   */
  activityLog: defineTable({
    tokenIdentifier: v.string(),
    kind: v.union(v.literal('event'), v.literal('course')),
    itemId: v.string(),
    name: v.string(),
    url: v.string(),
    detail: v.optional(v.string()),
    completedAt: v.number(),
  })
    .index('by_token_and_kind', ['tokenIdentifier', 'kind'])
    .index('by_token_and_kind_and_item', ['tokenIdentifier', 'kind', 'itemId']),

  courseAnalyses: defineTable({
    tokenIdentifier: v.string(),
    summary: v.string(),
    courses: v.array(
      v.object({
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
      }),
    ),
    createdAt: v.number(),
    prompt: v.optional(v.string()),
    response: v.optional(v.string()),
  }).index('by_token', ['tokenIdentifier']),

  internshipAnalyses: defineTable({
    tokenIdentifier: v.string(),
    title: v.string(),
    summary: v.string(),
    createdAt: v.number(),
    prompt: v.optional(v.string()),
    response: v.optional(v.string()),
  }).index('by_token', ['tokenIdentifier']),
});
