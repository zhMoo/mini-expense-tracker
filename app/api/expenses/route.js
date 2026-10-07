import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { authOptions } from "../../../lib/auth";
import { createExpense } from "../../../lib/db";
import { getCachedExpenses, invalidateExpenses } from "../../../lib/cache";
import {
  validateDescription,
  validateAmount,
  validateCategory,
  parseAmount,
} from "../../../lib/validation";

// OBJECTIVE: Securing API routes and data
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // OBJECTIVE: Data validation and error handling
  // A database failure becomes a clean 500, never a crash or a stack trace.
  try {
    return NextResponse.json(await getCachedExpenses(session.user.id));
  } catch (err) {
    console.error("GET /api/expenses failed:", err);
    return NextResponse.json({ error: "Could not load expenses" }, { status: 500 });
  }
}

// SECURED ACTION: adding an expense
export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Request body must be JSON" }, { status: 400 });
  }

  // OBJECTIVE: Data validation — checked before anything reaches the database.
  // A validation failure is the CALLER's mistake, so it's a 400, not a 500.
  const validationError =
    validateDescription(body.description) ||
    validateAmount(body.amount) ||
    validateCategory(body.category);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  try {
    const expense = await createExpense(session.user.id, {
      description: body.description.trim(),
      amount: parseAmount(body.amount),
      category: body.category,
    });
    invalidateExpenses(session.user.id); // the cached list is now out of date
    return NextResponse.json(expense, { status: 201 });
  } catch (err) {
    console.error("POST /api/expenses failed:", err);
    return NextResponse.json({ error: "Could not add expense" }, { status: 500 });
  }
}
