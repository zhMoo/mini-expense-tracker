"use client";
import { createContext, useContext, useState, useCallback, useMemo } from "react";

// OBJECTIVE: Managing global application state with the Context API
//
// ExpenseForm, ExpenseList and ExpenseStats all need the same `expenses`
// array. When one changes it (add, edit or delete), the others update too.
const ExpensesContext = createContext(null);

export function ExpensesProvider({ initialExpenses, children }) {
  const [expenses, setExpenses] = useState(initialExpenses);

  // Create — POST /api/expenses
  const addExpense = useCallback(async ({ description, amount, category }) => {
    const res = await fetch("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description, amount, category }),
    });
    if (!res.ok) {
      // e.g. 400 "Amount must be a positive number (more than 0)"
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || "Could not add expense");
    }
    const newExpense = await res.json();
    setExpenses((prev) => [newExpense, ...prev]); // newest first
  }, []);

  // Update — PUT /api/expenses/:id
  const editExpense = useCallback(async (id, { description, amount, category }) => {
    const res = await fetch(`/api/expenses/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description, amount, category }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || "Could not update expense");
    }
    const updated = await res.json();
    setExpenses((prev) => prev.map((e) => (e.id === id ? updated : e))); // keeps its place in the list
  }, []);

  // Delete — DELETE /api/expenses/:id
  const removeExpense = useCallback(async (id) => {
    const res = await fetch(`/api/expenses/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || "Could not delete expense");
    }
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  }, []);

  // OBJECTIVE: Memoization — a new `value` object on every render would make
  // EVERY component using useExpenses() re-render, even when nothing changed.
  // useMemo keeps the same object until `expenses` changes (the functions above
  // are already stable thanks to useCallback).
  const value = useMemo(
    () => ({ expenses, addExpense, editExpense, removeExpense }),
    [expenses, addExpense, editExpense, removeExpense],
  );

  return (
    <ExpensesContext.Provider value={value}>
      {children}
    </ExpensesContext.Provider>
  );
}

export function useExpenses() {
  const ctx = useContext(ExpensesContext);
  if (!ctx) {
    throw new Error("useExpenses must be used inside an <ExpensesProvider>");
  }
  return ctx;
}
