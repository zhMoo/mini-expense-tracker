// Shown automatically by Next.js while app/dashboard/page.js is checking the
// session and reading MySQL (e.g. right after signing in).
export default function DashboardLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-10" role="status" aria-live="polite">
      <div className="flex items-center gap-3 text-sm text-slate-500">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-cyan-500" aria-hidden="true" />
        Loading your expenses…
      </div>
    </div>
  );
}
