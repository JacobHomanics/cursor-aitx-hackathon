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
        v.literal('not_yet'),
        v.literal('first_year'),
        v.literal('second_year'),
        v.literal('third_year'),
        v.literal('fourth_year'),
        v.literal('fifth_year_plus'),
        v.literal('graduate'),
        v.literal('other'),
      ),
    ),
    inCollege: v.optional(v.boolean()),
    highSchool: v.optional(v.string()),
    gpa: v.optional(v.number()),
    dateOfBirth: v.optional(v.string()),
    country: v.optional(v.string()),
    city: v.optional(v.string()),
    state: v.optional(v.string()),
    industryInterest: v.optional(v.string()),
    roleInterest: v.optional(v.string()),
    preferredCompany: v.optional(v.string()),
    hardSkills: v.optional(
      v.array(
        v.object({
          name: v.string(),
          level: v.union(v.literal(1), v.literal(2), v.literal(3), v.literal(4), v.literal(5)),
        }),
      ),
    ),
    softSkills: v.optional(
      v.object({
        communication: v.union(v.literal(1), v.literal(2), v.literal(3), v.literal(4), v.literal(5)),
        teamwork: v.union(v.literal(1), v.literal(2), v.literal(3), v.literal(4), v.literal(5)),
        problemSolving: v.union(v.literal(1), v.literal(2), v.literal(3), v.literal(4), v.literal(5)),
        timeManagement: v.union(v.literal(1), v.literal(2), v.literal(3), v.literal(4), v.literal(5)),
        adaptability: v.union(v.literal(1), v.literal(2), v.literal(3), v.literal(4), v.literal(5)),
        leadership: v.union(v.literal(1), v.literal(2), v.literal(3), v.literal(4), v.literal(5)),
      }),
    ),
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
    kind: v.union(v.literal('event'), v.literal('course'), v.literal('internship')),
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

  journeyPlans: defineTable({
    tokenIdentifier: v.string(),
    profileKey: v.string(),
    titles: v.array(v.string()),
    createdAt: v.number(),
    prompt: v.optional(v.string()),
    response: v.optional(v.string()),
  }).index('by_token', ['tokenIdentifier']),

  internshipAnalyses: defineTable({
    tokenIdentifier: v.string(),
    title: v.string(),
    summary: v.string(),
    listings: v.optional(
      v.array(
        v.object({
          id: v.string(),
          name: v.string(),
          url: v.string(),
          company: v.optional(v.string()),
          location: v.optional(v.string()),
          category: v.optional(v.string()),
          publishedAt: v.optional(v.string()),
          reason: v.optional(v.string()),
          fit: v.optional(v.union(v.literal('high'), v.literal('medium'), v.literal('low'))),
        }),
      ),
    ),
    createdAt: v.number(),
    prompt: v.optional(v.string()),
    response: v.optional(v.string()),
  }).index('by_token', ['tokenIdentifier']),
});
