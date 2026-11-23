"use client";

import { useState } from "react";

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

export default function Home() {
  const [user, setUser] = useState<SampleUser | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);

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
        <h1 className="text-2xl font-semibold">db test</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          do stuff in the database
        </p>

        <button
          type="button"
          onClick={runPrismaTest}
          disabled={isRunning}
          className="mt-6 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isRunning ? "doing stuff..." : "click me"}
        </button>

        {user && (
          <section
            aria-live="polite"
            className="mt-6 rounded-lg border border-green-300 bg-green-50 p-4 text-sm dark:border-green-900 dark:bg-green-950"
          >
            <h2 className="font-semibold text-green-800 dark:text-green-200">
              yayy the stuff was done:
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
