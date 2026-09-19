/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as activity from "../activity.js";
import type * as analyzer from "../analyzer.js";
import type * as chatgpt from "../chatgpt.js";
import type * as courses from "../courses.js";
import type * as internships from "../internships.js";
import type * as jobs from "../jobs.js";
import type * as journey from "../journey.js";
import type * as luma from "../luma.js";
import type * as profile from "../profile.js";
import type * as status from "../status.js";
import type * as users from "../users.js";
import type * as youtube from "../youtube.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  activity: typeof activity;
  analyzer: typeof analyzer;
  chatgpt: typeof chatgpt;
  courses: typeof courses;
  internships: typeof internships;
  jobs: typeof jobs;
  journey: typeof journey;
  luma: typeof luma;
  profile: typeof profile;
  status: typeof status;
  users: typeof users;
  youtube: typeof youtube;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
