import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <main className="min-h-screen w-screen bg-gradient-to-br from-[#0f172a] via-[#1f2937] to-[#3b0a2a] text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col items-center justify-center px-6 py-16 text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1 text-xs tracking-[0.3em] uppercase text-white/80">
          <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
          Page Not Found
        </div>

        <h1 className="text-7xl font-black tracking-tight md:text-9xl">404</h1>
        <p className="mt-4 max-w-2xl text-lg text-white/80 md:text-xl">
          The page you are looking for drifted out of the map. Try heading back to the dashboard
          or the employee list.
        </p>

        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
          <Link
            to="/dashboard"
            className="rounded-full bg-emerald-400 px-6 py-3 text-sm font-semibold text-[#0f172a] transition hover:brightness-110"
          >
            <i className="bi bi-speedometer2 mr-2" aria-hidden="true" />
            Go to Dashboard
          </Link>
          <Link
            to="/employees"
            className="rounded-full border border-white/30 px-6 py-3 text-sm font-semibold text-white/90 transition hover:border-white/60 hover:text-white"
          >
            <i className="bi bi-people-fill mr-2" aria-hidden="true" />
            View Employees
          </Link>
        </div>

        <div className="mt-16 grid w-full max-w-3xl grid-cols-1 gap-4 text-left sm:grid-cols-3">
          {[
            { title: 'Try Search', body: 'Check the URL or use the app navigation to find your page.' },
            { title: 'Recent Updates', body: 'Pages may have moved after the latest release.' },
            { title: 'Need Help?', body: 'If this keeps happening, contact your administrator.' }
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur"
            >
              <p className="text-sm font-semibold text-white/90">{item.title}</p>
              <p className="mt-2 text-sm text-white/70">{item.body}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
