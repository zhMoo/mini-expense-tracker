"use client";
import { SessionProvider } from "next-auth/react";

// next-auth's SessionProvider is a Client Component, so it needs its own
// "use client" file before app/layout.js (a Server Component) can use it.
export default function SessionProviderWrapper({ children }) {
  return <SessionProvider>{children}</SessionProvider>;
}
