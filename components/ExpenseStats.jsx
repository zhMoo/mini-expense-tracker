"use client";
import { useMemo } from "react";
import { useExpenses } from "../context/ExpensesContext.jsx";
import { computeStats, formatRM } from "../lib/stats";

// The stats widget. It reads the SAME `expenses` array as ExpenseList (via
// Context), so adding or deleting an expense updates these numbers instantly.
export default function ExpenseStats() {
  const { expenses } = useExpenses();

  // OBJECTIVE: Memoization — computeStats loops over every expense. useMemo
  // only re-runs it when the `expenses` array itself changes (add/edit/delete),
  // not on every re-render.
  const stats = useMemo(() => computeStats(expenses), [expenses]);

  const tiles = [
    { label: "Total spent", value: formatRM(stats.total), id: "total" },
    { label: "Average per entry", value: formatRM(stats.average), id: "average" },
    { label: "Entries", value: String(stats.count), id: "count" },
    {
      label: "Biggest expense",
      value: stats.largest ? formatRM(stats.largest.amount) : "—",
      note: stats.largest?.description,
      id: "largest",
    },
  ];

  return (
    <section className="card space-y-5" aria-label="Spending stats">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {tiles.map((t) => (
          <div key={t.id} className="rounded-lg bg-slate-50 p-3" data-stat={t.id}>
            <p className="text-xs text-slate-500">{t.label}</p>
            <p className="mt-1 text-xl font-bold tabular-nums">{t.value}</p>
            {t.note && <p className="truncate text-xs text-slate-500">{t.note}</p>}
          </div>
        ))}
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold">By category</h3>
        {stats.byCategory.length === 0 ? (
          <p className="hint">Nothing logged yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-500">
                <th className="pb-1 font-medium">Category</th>
                <th className="pb-1 text-right font-medium">Count</th>
                <th className="pb-1 text-right font-medium">Total</th>
                <th className="w-2/5 pb-1 pl-4 font-medium">Share</th>
              </tr>
            </thead>
            <tbody>
              {stats.byCategory.map((c) => (
                <tr key={c.category} data-category={c.category}>
                  <td className="py-1.5">{c.category}</td>
                  <td className="py-1.5 text-right tabular-nums">{c.count}</td>
                  <td className="whitespace-nowrap py-1.5 pl-2 text-right tabular-nums">{formatRM(c.total)}</td>
                  <td className="py-1.5 pl-4">
                    <div className="flex items-center gap-2">
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-cyan-500" style={{ width: `${c.percent}%` }} />
                      </div>
                      <span className="w-9 text-right text-xs tabular-nums text-slate-500">{c.percent}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
