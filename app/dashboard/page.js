import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "../../lib/auth";
import { getCachedExpenses } from "../../lib/cache";
import { ExpensesProvider } from "../../context/ExpensesContext.jsx";
import DashboardTabs from "../../components/DashboardTabs.jsx";
import SignOutButton from "../../components/SignOutButton.jsx";

// OBJECTIVE: Implementing authentication with NextAuth.js
// OBJECTIVE: Securing API routes and data
//
// This Server Component checks the session first. If there's no session,
// the redirect happens before any data is read.
// The menu tabs; ?tab=add or ?tab=history opens that tab directly.
const TAB_IDS = ["summary", "add", "history"];

export default async function Dashboard({ searchParams }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/signin");
  }

  const { tab } = await searchParams; // Page searchParams are a Promise in Next.js 15+

  // Read this user's expenses server-side — from the Data Cache when possible,
  // otherwise from MySQL (see lib/cache.js).
  // If the database is down, show a friendly message instead of crashing.
  let expenses;
  try {
    expenses = await getCachedExpenses(session.user.id);
  } catch (err) {
    console.error("Dashboard: could not load expenses:", err);
    return (
      <div className="min-h-screen px-6 py-10">
        <div className="card mx-auto max-w-lg">
          <h1 className="text-xl font-bold">Can&apos;t reach the database</h1>
          <p className="hint mt-2">
            Check that MySQL (MAMP) is running and that the <code>MYSQL_*</code> settings in{" "}
            <code>.env.local</code> are correct, then refresh this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    // OBJECTIVE: Managing global application state with the Context API
    <ExpensesProvider initialExpenses={expenses}>
      <div className="min-h-screen px-6 py-10">
        <div className="mx-auto max-w-3xl">
          <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-cyan-500">Mini Expense Tracker</p>
              <h1 className="text-3xl font-bold">My spending</h1>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span>
                Signed in as <strong>{session.user.name}</strong>
              </span>
              <SignOutButton />
            </div>
          </header>

          <DashboardTabs initialTab={TAB_IDS.includes(tab) ? tab : "summary"} />

          <footer className="mt-6 text-xs leading-relaxed text-slate-500">
            Adding, editing and deleting call secured Route Handlers under <code>app/api/expenses/</code>, which
            check your session, validate the input (the amount must be a positive number), then read
            and write a real MySQL database.
          </footer>
        </div>
      </div>
    </ExpensesProvider>
  );
}
