"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function SignIn() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const router = useRouter();

  async function handleSubmit(e) {
    e.preventDefault();
    if (pending) return; // ignore double-clicks while the server is checking
    setError("");
    setPending(true);

    // OBJECTIVE: Implementing authentication with NextAuth.js
    try {
      const res = await signIn("credentials", { username, password, redirect: false });

      if (res?.error) {
        setError("Invalid username or password");
        setPending(false);
      } else {
        // Stay in the loading state until the dashboard replaces this page.
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err) {
      console.error("Sign-in request failed:", err);
      setError("Could not reach the server. Please try again.");
      setPending(false);
    }
  }

  return (
    <div className="min-h-screen px-6 py-10">
      <div className="mx-auto max-w-sm">
        <p className="text-xs font-bold uppercase tracking-wider text-cyan-500">NextAuth.js — App Router</p>
        <h1 className="mb-5 text-3xl font-bold">Sign in</h1>

        <form onSubmit={handleSubmit} className="card space-y-4" aria-busy={pending}>
          <label className="block text-sm text-slate-600">
            Username
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={pending}
              className="input mt-1 disabled:bg-slate-50"
            />
          </label>
          <label className="block text-sm text-slate-600">
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={pending}
              className="input mt-1 disabled:bg-slate-50"
            />
          </label>
          {error && <p className="error" role="alert">{error}</p>}
          <button
            type="submit"
            disabled={pending}
            className="btn flex w-full items-center justify-center gap-2 disabled:cursor-wait"
          >
            {pending && (
              <span
                className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
                aria-hidden="true"
              />
            )}
            {pending ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="hint">
          Demo users: <code>Moo</code> / <code>password123</code> or <code>Jeff</code> /{" "}
          <code>password123</code>
        </p>
      </div>
    </div>
  );
}
