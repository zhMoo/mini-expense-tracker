import { unstable_cache, revalidateTag } from "next/cache";
import { getAllExpenses } from "./db";

// OBJECTIVE: Caching (Next.js Data Cache)
//
// Every dashboard load and every GET /api/expenses used to run a SELECT on
// MySQL. Now the result is kept in Next.js's Data Cache, per user:
//   - first read          -> MISS, runs the query, stores the result
//   - next reads          -> HIT, no database round trip at all
//   - add / edit / delete -> the route calls invalidateExpenses(userId), so the
//                            next read is a MISS again and shows the change.
// `revalidate: 60` is a safety net: rows changed OUTSIDE the app (phpMyAdmin,
// TiDB console, db:inspect edits...) show up within a minute anyway.
//
// lib/db.js stays cache-free on purpose, so scripts can still use it outside Next.js.

const CACHE_SECONDS = 60;

// One tag per user, so Moo adding an expense never clears Jeff's cache.
const expensesTag = (userId) => `expenses:${userId}`;

export function getCachedExpenses(userId) {
  return unstable_cache(
    async () => {
      console.log(`[cache] MISS expenses for user ${userId} -> querying MySQL`);
      return getAllExpenses(userId);
    },
    ["expenses", userId], // cache key: the userId is part of it
    { tags: [expensesTag(userId)], revalidate: CACHE_SECONDS },
  )();
}

// Call after any write. `{ expire: 0 }` = never serve the old list again, so the
// user always sees their own change straight away (the "max" profile would
// serve the stale list once more while refreshing in the background).
export function invalidateExpenses(userId) {
  revalidateTag(expensesTag(userId), { expire: 0 });
}
