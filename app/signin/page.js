"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function SignIn() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    // OBJECTIVE: Implementing authentication with NextAuth.js
    const res = await signIn("credentials", { username, password, redirect: false });

    if (res?.error) {
      setError("Invalid username or password");
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  }

  return (
    <div className="min-h-screen px-6 py-10">
      <div className="mx-auto max-w-sm">
        <p className="text-xs font-bold uppercase tracking-wider text-cyan-500">NextAuth.js — App Router</p>
        <h1 className="mb-5 text-3xl font-bold">Sign in</h1>

        <form onSubmit={handleSubmit} className="card space-y-4">
          <label className="block text-sm text-slate-600">
            Username
            <input value={username} onChange={(e) => setUsername(e.target.value)} className="input mt-1" />
          </label>
          <label className="block text-sm text-slate-600">
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input mt-1"
            />
          </label>
          {error && <p className="error">{error}</p>}
          <button type="submit" className="btn w-full">Sign in</button>
        </form>

        <p className="hint">
          Demo users: <code>Moo</code> / <code>password123</code> or <code>Jeff</code> /{" "}
          <code>password123</code>
        </p>
      </div>
    </div>
  );
}
