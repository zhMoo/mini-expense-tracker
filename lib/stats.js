// Stats for the widget, computed from the list of expenses.
// A plain function (no database, no React), so the stats update instantly
// whenever an expense is added or deleted in the Context.
//
// Money is added up in CENTS (whole numbers), then turned back into ringgit,
// so 0.10 + 0.20 is exactly 0.30, not 0.30000000000000004.

const toCents = (amount) => Math.round(amount * 100);

export function computeStats(expenses) {
  const count = expenses.length;
  const totalCents = expenses.reduce((sum, e) => sum + toCents(e.amount), 0);

  // Group by category: how many entries, and how much in total.
  const groups = {};
  for (const e of expenses) {
    groups[e.category] ??= { category: e.category, count: 0, cents: 0 };
    groups[e.category].count += 1;
    groups[e.category].cents += toCents(e.amount);
  }
  const byCategory = Object.values(groups)
    .map((g) => ({
      category: g.category,
      count: g.count,
      total: g.cents / 100,
      percent: totalCents === 0 ? 0 : Math.round((g.cents / totalCents) * 100),
    }))
    .sort((a, b) => b.total - a.total); // biggest spending first

  const largest = expenses.reduce((max, e) => (!max || e.amount > max.amount ? e : max), null);

  return {
    count,
    total: totalCents / 100,
    average: count === 0 ? 0 : Math.round(totalCents / count) / 100,
    largest, // the single biggest expense, or null
    topCategory: byCategory[0]?.category ?? null,
    byCategory,
  };
}

// 1234.5 -> "RM 1,234.50"
export function formatRM(amount) {
  return `RM ${Number(amount).toLocaleString("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
