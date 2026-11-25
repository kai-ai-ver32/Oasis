"use client";

import { useCallback, useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type UserRole = "admin" | "user";

type SampleUser = {
  id: number;
  email: string;
  name: string | null;
  createdAt: string;
};

type TestResponse = {
  user?: SampleUser;
  deleted?: boolean;
  error?: string;
};

type AuthResponse = {
  role?: UserRole | null;
  email?: string | null;
  error?: string;
};

export default function Home() {
  const [role, setRole] = useState<UserRole | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginMessage, setLoginMessage] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [user, setUser] = useState<SampleUser | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const refreshAuth = useCallback(async () => {
    setIsLoadingAuth(true);

    try {
      const response = await fetch("/api/auth/me", { cache: "no-store" });
      const result = (await response.json()) as AuthResponse;

      if (response.status === 401) {
        setIsSignedIn(false);
        setRole(null);
        setEmail(null);
        return;
      }

      if (response.status === 403) {
        setIsSignedIn(true);
        setRole(null);
        setEmail(null);
        setLoginMessage("unauthorized");
        return;
      }

      if (!response.ok || (result.role !== "admin" && result.role !== "user")) {
        throw new Error(result.error ?? "could not verify user");
      }

      setIsSignedIn(true);
      setRole(result.role);
      setEmail(result.email ?? null);
      setLoginMessage(null);
    } catch {
      setIsSignedIn(false);
      setRole(null);
      setEmail(null);
      setLoginMessage("could not verify session");
    } finally {
      setIsLoadingAuth(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => void refreshAuth());
  }, [refreshAuth]);

  async function signIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoginMessage(null);
    setIsSigningIn(true);

    // integrated supabase auth with 2 shared accounts - admin vs volunteer
    try {
      const supabase = createSupabaseBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: loginEmail.trim(),
        password: loginPassword,
      });

      if (signInError) {
        throw signInError;
      }

      setLoginPassword("");
      await refreshAuth();
    } catch {
      setLoginMessage("woah you're not who you say you are");
    } finally {
      setIsSigningIn(false);
    }
  }

  async function signOut() {
    try {
      const supabase = createSupabaseBrowserClient();
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) {
        throw signOutError;
      }

      setUser(null);
      setError(null);
      setLoginMessage(null);
      await refreshAuth();
    } catch {
      setLoginMessage("Could not sign out. Please try again.");
    }
  }

  async function runPrismaTest() {
    setIsRunning(true);
    setUser(null);
    setError(null);

    try {
      const response = await fetch("/api/prisma-test", { method: "POST" });
      const result = (await response.json()) as TestResponse;

      if (!response.ok || !result.user || !result.deleted) {
        throw new Error(result.error ?? "The database test did not complete.");
      }

      setUser(result.user);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "The database test failed.",
      );
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-zinc-50 px-6 py-16 font-sans text-zinc-900 dark:bg-black dark:text-zinc-50">
      <div className="w-full max-w-xl rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <h1 className="text-2xl font-semibold">Prisma auth test</h1>

        {isLoadingAuth ? (
          <p className="mt-6 text-sm text-zinc-600 dark:text-zinc-400">
            Checking Supabase session...
          </p>
        ) : isSignedIn ? (
          <section className="mt-6">
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm">
                Signed in{email ? ` as ${email}` : ""} ({role ?? "unauthorized"})
              </p>
              <button
                type="button"
                onClick={signOut}
                className="text-sm font-medium text-blue-700 hover:underline dark:text-blue-400"
              >
                Sign out
              </button>
            </div>

            {role === "admin" ? (
              <button
                type="button"
                onClick={runPrismaTest}
                disabled={isRunning}
                className="mt-6 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isRunning ? "doing stuff..." : "do stuff"}
              </button>
            ) : (
              <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
                wrong account !!!
              </p>
            )}
          </section>
        ) : (
          <form onSubmit={signIn} className="mt-6 space-y-3">
            <label htmlFor="email" className="block text-sm font-medium">
              Provide credentials
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={loginEmail}
              onChange={(event) => setLoginEmail(event.target.value)}
              className="w-full rounded-lg border border-zinc-300 bg-transparent px-3 py-2 text-sm dark:border-zinc-700"
              placeholder="you@oasis.com"
            />
            <label htmlFor="password" className="block text-sm font-medium">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={loginPassword}
              onChange={(event) => setLoginPassword(event.target.value)}
              className="w-full rounded-lg border border-zinc-300 bg-transparent px-3 py-2 text-sm dark:border-zinc-700"
            />
            <button
              type="submit"
              disabled={isSigningIn}
              className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSigningIn ? "WAIT" : "Sign in"}
            </button>
          </form>
        )}

        {loginMessage && (
          <p role="status" className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
            {loginMessage}
          </p>
        )}

        {user && (
          <section
            aria-live="polite"
            className="mt-6 rounded-lg border border-green-300 bg-green-50 p-4 text-sm dark:border-green-900 dark:bg-green-950"
          >
            <h2 className="font-semibold text-green-800 dark:text-green-200">
              yayy stuff was done
            </h2>
            <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
              <dt className="font-medium">ID</dt>
              <dd>{user.id}</dd>
              <dt className="font-medium">Email</dt>
              <dd>{user.email}</dd>
              <dt className="font-medium">Name</dt>
              <dd>{user.name ?? "—"}</dd>
              <dt className="font-medium">Created</dt>
              <dd>{new Date(user.createdAt).toLocaleString()}</dd>
            </dl>
          </section>
        )}

        {error && (
          <p role="alert" className="mt-6 text-sm text-red-700 dark:text-red-400">
            {error}
          </p>
        )}
      </div>
    </main>
  );
}
