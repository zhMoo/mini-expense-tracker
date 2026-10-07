"use client";
import { createContext, useContext, useState, useCallback } from "react";

// OBJECTIVE: Managing global application state with the Context API
//
// ExpenseForm, ExpenseList and ExpenseStats all need the same `expenses`
// array. When one changes it (add or delete), the other two update too.
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

  // Delete — DELETE /api/expenses/:id
  const removeExpense = useCallback(async (id) => {
    const res = await fetch(`/api/expenses/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || "Could not delete expense");
    }
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  }, []);

  return (
    <ExpensesContext.Provider value={{ expenses, addExpense, removeExpense }}>
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
