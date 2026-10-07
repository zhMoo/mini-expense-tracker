"use client";
import { useState } from "react";
import { useExpenses } from "../context/ExpensesContext.jsx";
import { CATEGORIES } from "../lib/validation";

export default function ExpenseForm({ onViewHistory }) {
  const { addExpense } = useExpenses();
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [error, setError] = useState("");
  const [added, setAdded] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setAdded("");
    try {
      // The amount is sent exactly as typed. The SERVER decides whether it's
      // a valid positive number, so its error message shows up below.
      await addExpense({ description, amount, category });
      setAdded(description.trim());
      setDescription("");
      setAmount("");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-3">
      <h2 className="font-semibold">Log an expense</h2>
      <div className="grid gap-2 sm:grid-cols-[1fr_8rem_9rem]">
        <input
          placeholder="What was it? e.g. Nasi lemak"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="input"
          aria-label="Description"
        />
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">RM</span>
          <input
            inputMode="decimal"
            placeholder="0.00"
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
      {added && (
        <p className="text-sm text-emerald-700" role="status">
          Added &ldquo;{added}&rdquo;.{" "}
          {onViewHistory && (
            <button type="button" onClick={onViewHistory} className="font-medium underline">
              View history
            </button>
          )}
        </p>
      )}
      <button type="submit" disabled={submitting} className="btn">
        {submitting ? "Adding…" : "Add expense"}
      </button>
    </form>
  );
}
