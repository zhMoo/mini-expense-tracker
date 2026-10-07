"use client";
import { useState } from "react";
import dynamic from "next/dynamic";
import { useExpenses } from "../context/ExpensesContext.jsx";
import { formatRM } from "../lib/stats";
import ExpenseStats from "./ExpenseStats.jsx";

// OBJECTIVE: Code splitting
//
// Summary is the first tab everyone sees, so ExpenseStats is a normal import.
// The Add and History tabs are split into their own JavaScript chunks with
// next/dynamic: the browser only downloads them when that tab is opened.
// Hovering a tab starts the download early (see preload below), so by the
// time the click lands the chunk is usually ready and no spinner shows.
const loadForm = () => import("./ExpenseForm.jsx");
const loadList = () => import("./ExpenseList.jsx");
const ExpenseForm = dynamic(loadForm, { loading: () => <TabLoading /> });
const ExpenseList = dynamic(loadList, { loading: () => <TabLoading /> });
const PRELOAD = { add: loadForm, history: loadList };

function TabLoading() {
  return (
    <div className="card flex items-center gap-3 text-sm text-slate-500" role="status">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-cyan-500" aria-hidden="true" />
      Loading…
    </div>
  );
}

const TABS = [
  { id: "summary", label: "Summary" },
  { id: "add", label: "Add expense", short: "Add" },
  { id: "history", label: "History" },
];

// The dashboard menu. All three tabs read the same Context, so an expense
// added, edited or deleted in one tab is already up to date in the others.
export default function DashboardTabs({ initialTab }) {
  const { expenses } = useExpenses();
  const [tab, setTab] = useState(initialTab);

  function select(id) {
    setTab(id);
    // Remember the tab in the URL (?tab=history) so a refresh stays on it.
    window.history.replaceState(null, "", id === "summary" ? "/dashboard" : `/dashboard?tab=${id}`);
  }

  return (
    <>
      <nav role="tablist" aria-label="Dashboard sections" className="mb-4 flex gap-1 rounded-xl bg-slate-200/60 p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => select(t.id)}
            onMouseEnter={PRELOAD[t.id]}
            onFocus={PRELOAD[t.id]}
            className={`flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition ${
              tab === t.id ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <span className="sm:hidden">{t.short ?? t.label}</span>
            <span className="hidden sm:inline">{t.label}</span>
            {t.id === "history" && (
              <span className="rounded-full bg-slate-900/10 px-1.5 text-xs tabular-nums">{expenses.length}</span>
            )}
          </button>
        ))}
      </nav>

      <div role="tabpanel">
        {tab === "summary" && (
          <>
            <ExpenseStats />
            <RecentExpenses onSeeAll={() => select("history")} onAdd={() => select("add")} />
          </>
        )}
        {tab === "add" && <ExpenseForm onViewHistory={() => select("history")} />}
        {tab === "history" && <ExpenseList onAddClick={() => select("add")} />}
      </div>
    </>
  );
}

// A short preview on the Summary tab: the 3 newest expenses.
function RecentExpenses({ onSeeAll, onAdd }) {
  const { expenses } = useExpenses();
  const recent = expenses.slice(0, 3);

  return (
    <section className="card">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold">Recent</h3>
        {expenses.length > 0 && (
          <button onClick={onSeeAll} className="text-sm font-medium text-cyan-700 hover:underline">
            See all →
          </button>
        )}
      </div>
      {recent.length === 0 ? (
        <p className="hint">
          Nothing logged yet.{" "}
          <button onClick={onAdd} className="font-medium text-cyan-700 hover:underline">
            Add an expense
          </button>
        </p>
      ) : (
        <ul className="divide-y divide-slate-100 text-sm">
          {recent.map((e) => (
            <li key={e.id} className="flex items-center gap-3 py-2">
              <span className="min-w-0 flex-1 truncate">{e.description}</span>
              <span className="tag">{e.category}</span>
              <span className="font-semibold tabular-nums">{formatRM(e.amount)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
