"use client";
import { useState, useMemo, useCallback, memo } from "react";
import { useExpenses } from "../context/ExpensesContext.jsx";
import { formatRM } from "../lib/stats";
import { CATEGORIES } from "../lib/validation";

const dateFormat = new Intl.DateTimeFormat("en-MY", {
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "Asia/Kuala_Lumpur",
});

// The History tab: every expense, filterable by category, with Edit and Delete.
export default function ExpenseList({ onAddClick }) {
  const { expenses } = useExpenses();
  const [filter, setFilter] = useState("All");
  const [editingId, setEditingId] = useState(null);

  // OBJECTIVE: Memoization — only re-filter when the list or the filter
  // changes, not e.g. when you click Edit on a row. (Hooks must run before the
  // early return below.)
  const shown = useMemo(
    () => (filter === "All" ? expenses : expenses.filter((e) => e.category === filter)),
    [expenses, filter],
  );
  // Stable callbacks, so the memo()-ised rows below don't re-render for nothing.
  const startEdit = useCallback((id) => setEditingId(id), []);
  const stopEdit = useCallback(() => setEditingId(null), []);

  if (expenses.length === 0) {
    return (
      <div className="card text-center">
        <p className="hint">No expenses yet.</p>
        {onAddClick && (
          <button className="btn mt-3" onClick={onAddClick}>
            Log your first expense
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="card p-0">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-3">
        <h2 className="font-semibold">
          History <span className="hint font-normal">({shown.length})</span>
        </h2>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="input w-auto py-1.5"
          aria-label="Filter by category"
        >
          <option value="All">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </div>

      {shown.length === 0 ? (
        <p className="hint px-5 py-6 text-center">No {filter} expenses.</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {shown.map((e) =>
            editingId === e.id ? (
              <EditRow key={e.id} expense={e} onDone={stopEdit} />
            ) : (
              <ViewRow key={e.id} expense={e} onEdit={startEdit} />
            ),
          )}
        </ul>
      )}
    </div>
  );
}

// OBJECTIVE: Memoization — memo() skips re-rendering a row whose `expense`
// object and `onEdit` callback are unchanged. Editing one expense replaces
// only that object in the array, so only that one row re-renders.
const ViewRow = memo(function ViewRow({ expense: e, onEdit }) {
  const { removeExpense } = useExpenses();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    setError("");
    setDeleting(true);
    try {
      await removeExpense(e.id); // row disappears from the list on success
    } catch (err) {
      setError(err.message);
      setDeleting(false);
      setConfirming(false);
    }
  }

  return (
    <li className="px-5 py-3" data-expense={e.description}>
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{e.description}</p>
          <p className="text-xs text-slate-500">
            <span className="tag ml-0">{e.category}</span> {dateFormat.format(new Date(e.createdAt))}
          </p>
        </div>
        <span className="shrink-0 font-semibold tabular-nums">{formatRM(e.amount)}</span>
        {confirming ? (
          <div className="flex shrink-0 items-center gap-2">
            <span className="text-xs text-slate-500">Delete?</span>
            <button className="btn-danger" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting…" : "Yes"}
            </button>
            <button className="btn-ghost" onClick={() => setConfirming(false)} disabled={deleting}>
              No
            </button>
          </div>
        ) : (
          <div className="flex shrink-0 gap-2">
            <button className="btn-ghost" onClick={() => onEdit(e.id)} aria-label={`Edit ${e.description}`}>
              Edit
            </button>
            <button className="btn-ghost" onClick={() => setConfirming(true)} aria-label={`Delete ${e.description}`}>
              Delete
            </button>
          </div>
        )}
      </div>
      {error && <p className="error mt-1">{error}</p>}
    </li>
  );
});

function EditRow({ expense, onDone }) {
  const { editExpense } = useExpenses();
  const [description, setDescription] = useState(expense.description);
  const [amount, setAmount] = useState(expense.amount.toFixed(2));
  const [category, setCategory] = useState(expense.category);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      // Same as adding: the amount goes to the server exactly as typed,
      // and the server's validation message shows up below if it's wrong.
      await editExpense(expense.id, { description, amount, category });
      onDone();
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  return (
    <li className="bg-cyan-50/40 px-5 py-3">
      <form onSubmit={handleSubmit} className="space-y-2" onKeyDown={(e) => e.key === "Escape" && onDone()}>
        <div className="grid gap-2 sm:grid-cols-[1fr_8rem_9rem]">
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="input"
            aria-label="Description"
            autoFocus
          />
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">RM</span>
            <input
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="input pl-10"
              aria-label="Amount"
            />
          </div>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="input" aria-label="Category">
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
        {error && <p className="error" role="alert">{error}</p>}
        <div className="flex gap-2">
          <button type="submit" disabled={saving} className="btn">
            {saving ? "Saving…" : "Save"}
          </button>
          <button type="button" onClick={onDone} disabled={saving} className="btn-ghost">
            Cancel
          </button>
        </div>
      </form>
    </li>
  );
}
