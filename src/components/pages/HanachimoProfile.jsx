import React, { useState } from 'react';

export default function HanachimoProfile() {
  const [avatarError, setAvatarError] = useState(false);

  return (
    <div className="min-h-screen bg-[#0b0f1a] text-white">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.25),_transparent_60%),radial-gradient(circle_at_30%_20%,_rgba(244,63,94,0.18),_transparent_55%)]" />
        <div className="relative border-b border-white/10">
          <div
            className="h-72 w-full"
            style={{
              backgroundImage:
                "linear-gradient(135deg, rgba(12,15,26,0.95), rgba(30,41,59,0.6)), url('/hanachimo-banner.png')",
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
          <div className="mx-auto w-full max-w-6xl px-6">
            <div className="-mt-16 flex flex-col gap-6 pb-10 md:flex-row md:items-end">
              <div className="relative h-32 w-32 rounded-full border-4 border-[#0b0f1a] bg-gradient-to-br from-rose-500 via-orange-400 to-amber-300 p-1 shadow-xl">
                {!avatarError && (
                  <img
                    src="/hanachimo-avatar.png"
                    alt="hanachimo avatar"
                    className="h-full w-full rounded-full object-cover"
                    onError={() => setAvatarError(true)}
                  />
                )}
                {avatarError && (
                  <div className="flex h-full w-full items-center justify-center rounded-full bg-black/40 text-2xl font-black">
                    h.
                  </div>
                )}
              </div>

              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-3xl font-black tracking-tight md:text-4xl">hanachimo</h1>
                  <span className="inline-flex items-center rounded-full bg-sky-500/15 px-3 py-1 text-xs font-semibold text-sky-200">
                    available for collaboration
                  </span>
                </div>
                <p className="mt-1 text-sm text-white/60">@hanachimo1013</p>
                <p className="mt-4 max-w-2xl text-base text-white/80">
                  Product-focused developer building clean, secure, and maintainable web apps.
                  This space highlights recent work and the systems I enjoy shipping.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <a
                    href="https://github.com/hanachimo1013"
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-gray-900 transition hover:bg-gray-200"
                  >
                    View GitHub
                  </a>
                  <a
                    href="https://x.com/hanachimo1013"
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border border-white/20 px-5 py-2 text-sm font-semibold text-white transition hover:border-white/60 hover:bg-white/10"
                  >
                    Follow on X
                  </a>
                </div>
              </div>

              <div className="w-full max-w-xs rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur md:ml-auto">
                <p className="text-xs uppercase tracking-[0.2em] text-white/50">Based in</p>
                <p className="mt-2 text-lg font-semibold">Philippines</p>
                <p className="mt-1 text-sm text-white/60">Open to remote projects</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 pb-16 pt-10">
        <div className="grid gap-8 lg:grid-cols-[1.1fr,0.9fr]">
          <div className="space-y-8">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
              <h2 className="text-lg font-semibold text-white/90">Featured Project</h2>
              <div className="mt-4 rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-5">
                <h3 className="text-xl font-semibold">BDLAG Utility Dashboard</h3>
                <p className="mt-2 text-sm text-white/70">
                  Secure admin dashboard with JWT authentication, role-based access, and Supabase data
                  management. Built for fast operations and clear reporting.
                </p>
                <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-white/70">
                  <span className="rounded-full border border-white/20 px-3 py-1">React</span>
                  <span className="rounded-full border border-white/20 px-3 py-1">Vite</span>
                  <span className="rounded-full border border-white/20 px-3 py-1">Tailwind</span>
                  <span className="rounded-full border border-white/20 px-3 py-1">Supabase</span>
                  <span className="rounded-full border border-white/20 px-3 py-1">Vercel</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
              <h2 className="text-lg font-semibold text-white/90">What I Care About</h2>
              <ul className="mt-4 grid gap-3 text-sm text-white/70 md:grid-cols-2">
                <li className="rounded-xl border border-white/10 bg-white/5 p-4">
                  Security-first auth and data flows
                </li>
                <li className="rounded-xl border border-white/10 bg-white/5 p-4">
                  Clean UI systems with strong UX
                </li>
                <li className="rounded-xl border border-white/10 bg-white/5 p-4">
                  Fast iteration with production discipline
                </li>
                <li className="rounded-xl border border-white/10 bg-white/5 p-4">
                  Maintainable code and clear handoffs
                </li>
              </ul>
            </div>
          </div>

          <div className="space-y-8">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
              <h2 className="text-lg font-semibold text-white/90">Core Skills</h2>
              <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-white/70">
                <span className="rounded-full border border-white/20 px-3 py-1">React</span>
                <span className="rounded-full border border-white/20 px-3 py-1">Node.js</span>
                <span className="rounded-full border border-white/20 px-3 py-1">Supabase</span>
                <span className="rounded-full border border-white/20 px-3 py-1">REST APIs</span>
                <span className="rounded-full border border-white/20 px-3 py-1">JWT Auth</span>
                <span className="rounded-full border border-white/20 px-3 py-1">Vercel</span>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
              <h2 className="text-lg font-semibold text-white/90">Links</h2>
              <div className="mt-4 space-y-3 text-sm">
                <a
                  href="https://github.com/hanachimo1013"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-semibold transition hover:border-white/30 hover:bg-white/10"
                >
                  GitHub
                  <span className="text-white/60">github.com/hanachimo1013</span>
                </a>
                <a
                  href="https://tiktok.com/@hanachimo1013"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-semibold transition hover:border-white/30 hover:bg-white/10"
                >
                  TikTok
                  <span className="text-white/60">@hanachimo1013</span>
                </a>
                <a
                  href="https://x.com/hanachimo1013"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-semibold transition hover:border-white/30 hover:bg-white/10"
                >
                  X
                  <span className="text-white/60">@hanachimo1013</span>
                </a>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
              <h2 className="text-lg font-semibold text-white/90">Quick Facts</h2>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <dt className="text-white/60">Born</dt>
                  <dd className="font-semibold">October 13, 1999</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-white/60">Joined X</dt>
                  <dd className="font-semibold">January 2020</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-white/60">Followers</dt>
                  <dd className="font-semibold">5</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-white/60">Following</dt>
                  <dd className="font-semibold">46</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
