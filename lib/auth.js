import CredentialsProvider from "next-auth/providers/credentials";

// OBJECTIVE: Implementing authentication with NextAuth.js
//
// DEMO ONLY: two hardcoded users, so you can sign in as different people
// and see that each one has their own expenses. In a real app, authorize()
// would look the user up in a database and compare a HASHED password —
// never a plain string like below.
const DEMO_USERS = [
  { id: "1", name: "Moo", username: "Moo", password: "password123" },
  { id: "2", name: "Jeff", username: "Jeff", password: "password123" },
];

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // Usernames are not case-sensitive ("moo" works too); passwords are.
        const username = String(credentials?.username ?? "").trim().toLowerCase();
        const user = DEMO_USERS.find(
          (u) => u.username.toLowerCase() === username && u.password === credentials?.password,
        );
        if (!user) return null; // null = failed login
        return { id: user.id, name: user.name };
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/signin" },
  callbacks: {
    async session({ session, token }) {
      session.user = { id: token.sub, name: token.name ?? null };
      return session;
    },
  },
  // The secret comes from .env.local. If that file is missing during
  // `npm run dev`, use a fixed development secret so sign-in still works.
  // (Without ANY secret, NextAuth can't read its own session cookie back.)
  // In production (`npm run build && npm start`, or a deployed app),
  // NEXTAUTH_SECRET must be set.
  secret:
    process.env.NEXTAUTH_SECRET ||
    (process.env.NODE_ENV !== "production" ? "dev-only-secret-change-me" : undefined),
};
