import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { authOptions } from "../../../../lib/auth";
import { deleteExpense } from "../../../../lib/db";
import { isValidId } from "../../../../lib/validation";

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
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(`DELETE /api/expenses/${id} failed:`, err);
    return NextResponse.json({ error: "Could not delete expense" }, { status: 500 });
  }
}
