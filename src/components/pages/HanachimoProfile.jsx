import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AppleSpinner from '../ui/AppleSpinner';

const GITHUB_USER_URL = 'https://api.github.com/users/hanachimo1013';
const GITHUB_REPOS_URL = 'https://api.github.com/users/hanachimo1013/repos?sort=pushed&per_page=6';

const LANG_COLORS = {
  JavaScript: '#F7DF1E',
  Python: '#3776AB',
  Vue: '#42B883',
  PHP: '#777BB4',
  TypeScript: '#3178C6',
  CSS: '#563D7C',
  HTML: '#E34C26',
};

const StatPill = ({ label, value, color }) => (
  <div className="glass-subtle rounded-xl p-4 text-center flex-1 min-w-[100px]">
    <p className="text-2xl font-bold" style={{ color: color || 'var(--accent-blue)' }}>{value}</p>
    <p className="text-[11px] font-medium uppercase tracking-wider mt-1" style={{ color: 'var(--text-tertiary)' }}>{label}</p>
  </div>
);

const RepoCard = ({ repo }) => {
  const lang = repo.language;
  const langColor = LANG_COLORS[lang] || 'var(--text-tertiary)';
  const updatedDate = new Date(repo.pushed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <a
      href={repo.html_url}
      target="_blank"
      rel="noreferrer"
      className="glass-subtle rounded-2xl p-5 flex flex-col hover:shadow-lg transition-all group"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold group-hover:underline truncate" style={{ color: 'var(--accent-blue)' }}>
          {repo.name}
        </h3>
        {repo.archived && (
          <span className="shrink-0 text-[10px] font-medium uppercase px-2 py-0.5 rounded-full" style={{ background: 'rgba(255, 149, 0, 0.1)', color: 'var(--accent-orange)' }}>
            archived
          </span>
        )}
      </div>
      {repo.description && (
        <p className="text-xs mt-2 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{repo.description}</p>
      )}
      <div className="mt-auto pt-3 flex items-center gap-4 text-[11px] font-medium" style={{ color: 'var(--text-tertiary)' }}>
        {lang && (
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: langColor }} />
            {lang}
          </span>
        )}
        {repo.stargazers_count > 0 && (
          <span className="flex items-center gap-1">
            <i className="bi bi-star" aria-hidden="true" /> {repo.stargazers_count}
          </span>
        )}
        {repo.forks_count > 0 && (
          <span className="flex items-center gap-1">
            <i className="bi bi-diagram-2" aria-hidden="true" /> {repo.forks_count}
          </span>
        )}
        <span className="ml-auto">{updatedDate}</span>
      </div>
    </a>
  );
};

export default function HanachimoProfile() {
  const [profile, setProfile] = useState(null);
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [avatarError, setAvatarError] = useState(false);

  useEffect(() => {
    let active = true;
    const fetchData = async () => {
      try {
        const [userRes, reposRes] = await Promise.all([
          fetch(GITHUB_USER_URL),
          fetch(GITHUB_REPOS_URL),
        ]);
        if (!active) return;
        if (userRes.ok) setProfile(await userRes.json());
        if (reposRes.ok) setRepos(await reposRes.json());
      } catch {
        // Fallback to static data silently
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchData();
    return () => { active = false; };
  }, []);

  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : 'December 2020';

  return (
    <div className="min-h-screen" style={{ background: 'var(--surface-primary)' }}>
      {/* Gradient orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -left-20 w-[500px] h-[500px] rounded-full opacity-[0.07] blur-3xl" style={{ background: 'var(--accent-blue)' }} />
        <div className="absolute top-1/3 right-0 w-[400px] h-[400px] rounded-full opacity-[0.05] blur-3xl" style={{ background: 'var(--accent-purple)' }} />
        <div className="absolute bottom-0 left-1/3 w-[350px] h-[350px] rounded-full opacity-[0.06] blur-3xl" style={{ background: 'var(--accent-green)' }} />
      </div>

      {/* Header / Hero */}
      <header className="relative">
        <div className="mx-auto w-full max-w-4xl px-6 pt-16 pb-10">
          <div className="flex flex-col items-center text-center">
            {/* Avatar */}
            <div className="relative w-28 h-28 rounded-full p-[3px] animate-fade-scale" style={{ background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple), var(--accent-green))' }}>
              {!avatarError ? (
                <img
                  src={profile?.avatar_url || 'https://avatars.githubusercontent.com/u/75973651?v=4'}
                  alt="hanachimo"
                  className="w-full h-full rounded-full object-cover"
                  style={{ border: '3px solid var(--surface-primary)' }}
                  onError={() => setAvatarError(true)}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center rounded-full text-2xl font-black" style={{ background: 'var(--surface-card)', color: 'var(--text-primary)', border: '3px solid var(--surface-primary)' }}>
                  h.
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center" style={{ background: 'var(--accent-green)', border: '2px solid var(--surface-primary)' }}>
                <i className="bi bi-check text-white text-xs" aria-hidden="true" />
              </div>
            </div>

            {/* Name */}
            <h1 className="mt-5 text-3xl font-bold tracking-tight animate-slide-up" style={{ color: 'var(--text-primary)' }}>
              {profile?.name || 'hanachimo'}
            </h1>
            <p className="mt-1 text-sm font-medium" style={{ color: 'var(--text-tertiary)' }}>
              @{profile?.login || 'hanachimo1013'}
            </p>

            {/* Bio */}
            <p className="mt-4 max-w-lg text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {profile?.bio || "0% Social Skills, 100% Repository Commits. I don't touch grass, I just write code that eventually breaks anyway."}
            </p>

            {/* Actions */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <a
                href="https://github.com/hanachimo1013"
                target="_blank"
                rel="noreferrer"
                className="btn-apple px-5 py-2.5 text-sm text-white rounded-full font-semibold"
                style={{ background: 'var(--accent-blue)' }}
              >
                <i className="bi bi-github mr-2" aria-hidden="true" />
                View GitHub
              </a>
              <a
                href="https://x.com/hanachimo1013"
                target="_blank"
                rel="noreferrer"
                className="btn-apple px-5 py-2.5 text-sm rounded-full font-medium"
                style={{ background: 'var(--surface-card)', color: 'var(--text-primary)', border: '1px solid var(--border-medium)' }}
              >
                <i className="bi bi-twitter-x mr-2" aria-hidden="true" />
                Follow on X
              </a>
              <Link
                to="/login"
                className="btn-apple px-5 py-2.5 text-sm rounded-full font-medium"
                style={{ background: 'var(--surface-card)', color: 'var(--text-primary)', border: '1px solid var(--border-medium)' }}
              >
                <i className="bi bi-box-arrow-in-right mr-2" aria-hidden="true" />
                Dashboard
              </Link>
            </div>

            {/* Stats */}
            <div className="mt-8 flex flex-wrap justify-center gap-3 w-full max-w-md">
              <StatPill label="Repos" value={profile?.public_repos ?? 11} color="var(--accent-blue)" />
              <StatPill label="Followers" value={profile?.followers ?? 2} color="var(--accent-green)" />
              <StatPill label="Following" value={profile?.following ?? 0} color="var(--accent-purple)" />
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="relative mx-auto w-full max-w-4xl px-6 pb-20">
        <div className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr]">
          {/* Left column */}
          <div className="space-y-6">
            {/* Repositories */}
            <section className="glass-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
                  <i className="bi bi-journal-code mr-2" style={{ color: 'var(--accent-blue)' }} aria-hidden="true" />
                  Repositories
                </h2>
                <a
                  href="https://github.com/hanachimo1013?tab=repositories"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-medium"
                  style={{ color: 'var(--accent-blue)' }}
                >
                  View all →
                </a>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <AppleSpinner size="lg" />
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {repos.filter(r => !r.fork).slice(0, 6).map((repo) => (
                    <RepoCard key={repo.id} repo={repo} />
                  ))}
                </div>
              )}
            </section>

            {/* Values */}
            <section className="glass-card p-5">
              <h2 className="text-base font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                <i className="bi bi-lightbulb mr-2" style={{ color: 'var(--accent-orange)' }} aria-hidden="true" />
                What I Care About
              </h2>
              <div className="grid gap-2 sm:grid-cols-2">
                {[
                  { icon: 'bi-shield-lock', text: 'Security-first auth and data flows' },
                  { icon: 'bi-palette', text: 'Clean UI systems with strong UX' },
                  { icon: 'bi-lightning-charge', text: 'Fast iteration with production discipline' },
                  { icon: 'bi-code-slash', text: 'Maintainable code and clear handoffs' },
                ].map((item) => (
                  <div key={item.text} className="glass-subtle rounded-xl p-4 flex items-start gap-3">
                    <i className={`bi ${item.icon} text-base mt-0.5`} style={{ color: 'var(--accent-blue)' }} aria-hidden="true" />
                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{item.text}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Right column */}
          <div className="space-y-6">
            {/* Skills */}
            <section className="glass-card p-5">
              <h2 className="text-base font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                <i className="bi bi-tools mr-2" style={{ color: 'var(--accent-green)' }} aria-hidden="true" />
                Core Skills
              </h2>
              <div className="flex flex-wrap gap-2">
                {['React', 'Vite', 'Node.js', 'Python', 'Laravel', 'Vue.js', 'Supabase', 'REST APIs', 'JWT Auth', 'Tailwind CSS', 'Vercel', 'PostgreSQL'].map((skill) => (
                  <span
                    key={skill}
                    className="glass-subtle rounded-full px-3.5 py-1.5 text-xs font-medium"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </section>

            {/* Links */}
            <section className="glass-card p-5">
              <h2 className="text-base font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                <i className="bi bi-link-45deg mr-2" style={{ color: 'var(--accent-purple)' }} aria-hidden="true" />
                Links
              </h2>
              <div className="space-y-2">
                {[
                  { icon: 'bi-github', name: 'GitHub', url: 'https://github.com/hanachimo1013', handle: 'hanachimo1013' },
                  { icon: 'bi-twitter-x', name: 'X', url: 'https://x.com/hanachimo1013', handle: '@hanachimo1013' },
                  { icon: 'bi-tiktok', name: 'TikTok', url: 'https://tiktok.com/@hanachimo1013', handle: '@hanachimo1013' },
                ].map((link) => (
                  <a
                    key={link.name}
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    className="glass-subtle rounded-xl px-4 py-3 flex items-center justify-between hover:shadow-md transition-all"
                  >
                    <span className="flex items-center gap-3 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      <i className={`bi ${link.icon}`} aria-hidden="true" />
                      {link.name}
                    </span>
                    <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{link.handle}</span>
                  </a>
                ))}
              </div>
            </section>

            {/* Quick Facts */}
            <section className="glass-card p-5">
              <h2 className="text-base font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                <i className="bi bi-info-circle mr-2" style={{ color: 'var(--accent-teal)' }} aria-hidden="true" />
                Quick Facts
              </h2>
              <dl className="space-y-3 text-sm">
                {[
                  { label: 'Location', value: 'Philippines' },
                  { label: 'Member since', value: memberSince },
                  { label: 'Status', value: 'Open to remote projects' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <dt style={{ color: 'var(--text-tertiary)' }}>{item.label}</dt>
                    <dd className="font-medium" style={{ color: 'var(--text-primary)' }}>{item.value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-16 text-center">
          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            Built by hanachimo using React, Vite, Tailwind
          </p>
        </footer>
      </main>
    </div>
  );
}
