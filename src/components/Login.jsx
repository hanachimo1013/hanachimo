import React from 'react';

export default function Login() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-100 to-rose-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-6 py-12">
        <section className="w-full rounded-2xl border border-amber-200/70 bg-white/90 p-8 shadow-2xl backdrop-blur-sm dark:border-gray-700 dark:bg-gray-900/80">
          <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-gray-100">
            Login
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            Sign in to continue.
          </p>

          <form className="mt-8 space-y-5">
            <div>
              <label
                htmlFor="userid"
                className="mb-2 block text-sm font-semibold text-gray-800 dark:text-gray-200"
              >
                User ID
              </label>
              <input
                id="userid"
                name="userid"
                type="text"
                autoComplete="username"
                placeholder="Enter your user ID"
                className="w-full rounded-lg border border-amber-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-semibold text-gray-800 dark:text-gray-200"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="Enter your password"
                className="w-full rounded-lg border border-amber-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
              />
            </div>

            <button
              type="submit"
              className="mt-2 w-full rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              Sign In
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}
