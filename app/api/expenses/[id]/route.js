import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { authOptions } from "../../../../lib/auth";
import { updateExpense, deleteExpense } from "../../../../lib/db";
import { invalidateExpenses } from "../../../../lib/cache";
import {
  isValidId,
  validateDescription,
  validateAmount,
  validateCategory,
  parseAmount,
} from "../../../../lib/validation";

// SECURED ACTION: editing an expense
export async function PUT(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params; // Route Handler params are a Promise in Next.js 15+
  if (!isValidId(id)) {
    return NextResponse.json({ error: "Expense id must be a number" }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Request body must be JSON" }, { status: 400 });
  }

  // OBJECTIVE: Data validation — the same rules as adding a new expense.
  const validationError =
    validateDescription(body.description) ||
    validateAmount(body.amount) ||
    validateCategory(body.category);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  try {
    const expense = await updateExpense(session.user.id, id, {
      description: body.description.trim(),
      amount: parseAmount(body.amount),
      category: body.category,
    });
    if (!expense) {
      // Doesn't exist, OR belongs to another user — same answer for both.
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }
    invalidateExpenses(session.user.id); // the cached list is now out of date
    return NextResponse.json(expense);
  } catch (err) {
    console.error(`PUT /api/expenses/${id} failed:`, err);
    return NextResponse.json({ error: "Could not update expense" }, { status: 500 });
  }
}

// SECURED ACTION: deleting an expense
export async function DELETE(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params; // Route Handler params are a Promise in Next.js 15+

  // OBJECTIVE: Data validation and error handling — the id itself
  if (!isValidId(id)) {
    return NextResponse.json({ error: "Expense id must be a number" }, { status: 400 });
  }

  try {
    const ok = await deleteExpense(session.user.id, id);
    if (!ok) {
      // Doesn't exist, OR belongs to another user — same answer for both.
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }
    invalidateExpenses(session.user.id);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(`DELETE /api/expenses/${id} failed:`, err);
    return NextResponse.json({ error: "Could not delete expense" }, { status: 500 });
  }
}
