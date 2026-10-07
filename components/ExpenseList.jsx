"use client";
import { useState } from "react";
import { useExpenses } from "../context/ExpensesContext.jsx";
import { formatRM } from "../lib/stats";

const dateFormat = new Intl.DateTimeFormat("en-MY", {
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "Asia/Kuala_Lumpur",
});

export default function ExpenseList() {
  const { expenses, removeExpense } = useExpenses();
  const [error, setError] = useState("");

  if (expenses.length === 0) {
    return <p className="hint">No expenses yet — log one above.</p>;
  }

  async function handleDelete(id) {
    setError("");
    try {
      await removeExpense(id);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="card p-0">
      {error && <p className="error px-5 pt-4">{error}</p>}
      <ul className="divide-y divide-slate-100">
        {expenses.map((e) => (
          <li key={e.id} className="flex items-center gap-3 px-5 py-3" data-expense={e.description}>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{e.description}</p>
              <p className="text-xs text-slate-500">
                <span className="tag ml-0">{e.category}</span> {dateFormat.format(new Date(e.createdAt))}
              </p>
            </div>
            <span className="shrink-0 font-semibold tabular-nums">{formatRM(e.amount)}</span>
            <button className="btn-ghost shrink-0" onClick={() => handleDelete(e.id)} aria-label={`Delete ${e.description}`}>
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
