import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import LoadingOverlay from '../ui/LoadingOverlay';

const SORT_FIELDS = [
  { value: 'name',         label: 'Name' },
  { value: 'modifiedTime', label: 'Date Modified' },
];

function compareFn(a, b, field, direction) {
  let valA = a[field];
  let valB = b[field];

  if (field === 'modifiedTime') {
    valA = valA ? new Date(valA).getTime() : 0;
    valB = valB ? new Date(valB).getTime() : 0;
  } else {
    valA = String(valA || '').toLowerCase();
    valB = String(valB || '').toLowerCase();
  }

  if (valA < valB) return direction === 'asc' ? -1 : 1;
  if (valA > valB) return direction === 'asc' ? 1 : -1;
  return 0;
}

function getDoujinPath(path) {
  return `/doujin${path}`;
}

export default function MangaList() {
  const [mangaList, setMangaList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Initialize sorting from localStorage or defaults
  const [sortField, setSortField] = useState(() => localStorage.getItem('mangaSortField') || 'name');
  const [sortDir, setSortDir] = useState(() => localStorage.getItem('mangaSortDir') || 'asc');
  
  const [showSortMenu, setShowSortMenu] = useState(false);
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  // Handle document title
  useEffect(() => {
    document.title = "Manga Library | from hanachimo's Doujin Archives";
  }, []);

  // Persist sorting changes
  useEffect(() => {
    localStorage.setItem('mangaSortField', sortField);
  }, [sortField]);

  useEffect(() => {
    localStorage.setItem('mangaSortDir', sortDir);
  }, [sortDir]);

  useEffect(() => {
    fetch('/api/fetch-manga')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch manga list');
        return res.json();
      })
      .then((data) => {
        // Keep only the fields the UI needs
        const slim = (data || []).map(({ id, name, thumbnailLink, modifiedTime }) => ({
          id, name, thumbnailLink, modifiedTime,
        }));
        setMangaList(slim);
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const sorted = useMemo(
    () => [...mangaList].sort((a, b) => compareFn(a, b, sortField, sortDir)),
    [mangaList, sortField, sortDir]
  );

  const currentFieldLabel = SORT_FIELDS.find((f) => f.value === sortField)?.label || 'Name';

  if (loading) return <LoadingOverlay message="Loading Manga Gallery..." />;

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center" style={{ background: 'var(--surface-primary)' }}>
        <div className="glass-card p-8 text-center font-semibold" style={{ color: 'var(--accent-red)' }}>
          Error: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-10" style={{ background: 'var(--surface-primary)', color: 'var(--text-primary)' }}>
      <div className="max-w-7xl mx-auto">
        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Manga Library</h1>

          <div className="flex items-center gap-2">
            {/* Sort dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowSortMenu((v) => !v)}
                className="glass-card px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm font-medium hover:shadow-lg transition-all duration-200 active:scale-95"
              >
                <i className="bi bi-sort-down" style={{ color: 'var(--accent-blue)' }}></i>
                <span className="hidden md:inline">{currentFieldLabel}</span>
                <i className={`bi bi-chevron-${showSortMenu ? 'up' : 'down'} text-xs`} style={{ color: 'var(--text-tertiary)' }}></i>
              </button>

              {showSortMenu && (
                <>
                  {/* Invisible click-away backdrop */}
                  <div className="fixed inset-0 z-40" onClick={() => setShowSortMenu(false)}></div>

                  <div className="absolute right-0 top-full mt-2 z-50 glass-card rounded-xl p-2 min-w-[220px] shadow-2xl animate-fade-scale"
                       style={{ border: '1px solid var(--glass-border)' }}
                  >
                    {/* Sort-by field options */}
                    <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-tertiary)' }}>
                      Sort by
                    </p>
                    {SORT_FIELDS.map((f) => (
                      <button
                        key={f.value}
                        onClick={() => { setSortField(f.value); }}
                        className="w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between transition-colors duration-150"
                        style={{
                          background: sortField === f.value ? 'var(--accent-blue)' : 'transparent',
                          color: sortField === f.value ? '#fff' : 'var(--text-primary)',
                        }}
                      >
                        {f.label}
                        {sortField === f.value && <i className="bi bi-check2"></i>}
                      </button>
                    ))}

                    {/* Divider */}
                    <div className="my-2 mx-3" style={{ borderTop: '1px solid var(--border-light)' }}></div>

                    {/* Direction toggle */}
                    <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-tertiary)' }}>
                      Direction
                    </p>
                    <button
                      onClick={() => setSortDir('asc')}
                      className="w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between transition-colors duration-150"
                      style={{
                        background: sortDir === 'asc' ? 'var(--accent-blue)' : 'transparent',
                        color: sortDir === 'asc' ? '#fff' : 'var(--text-primary)',
                      }}
                    >
                      <span><i className="bi bi-sort-up mr-2"></i>Ascending</span>
                      {sortDir === 'asc' && <i className="bi bi-check2"></i>}
                    </button>
                    <button
                      onClick={() => setSortDir('desc')}
                      className="w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between transition-colors duration-150"
                      style={{
                        background: sortDir === 'desc' ? 'var(--accent-blue)' : 'transparent',
                        color: sortDir === 'desc' ? '#fff' : 'var(--text-primary)',
                      }}
                    >
                      <span><i className="bi bi-sort-down mr-2"></i>Descending</span>
                      {sortDir === 'desc' && <i className="bi bi-check2"></i>}
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="glass-card p-2.5 rounded-xl hover:shadow-lg transition-all duration-300 active:scale-95"
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              <i className={`bi ${theme === 'dark' ? 'bi-sun-fill' : 'bi-moon-fill'} text-lg`}
                 style={{ color: theme === 'dark' ? 'var(--accent-orange)' : 'var(--accent-purple)' }}
              ></i>
            </button>
          </div>
        </div>

        {/* ── Gallery Grid ── */}
        {sorted.length === 0 ? (
          <div className="glass-card p-12 text-center" style={{ color: 'var(--text-secondary)' }}>
            No PDF files found in the specified Google Drive folder.
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
            {sorted.map((manga, i) => {
              const fileDate = manga.modifiedTime;
              const isNew = fileDate
                ? (Date.now() - new Date(fileDate).getTime()) <= (2 * 24 * 60 * 60 * 1000)
                : false;

              return (
              <div
                key={manga.id}
                className="glass-card flex flex-col overflow-hidden cursor-pointer transition-all duration-300 group hover:scale-[1.02] hover:shadow-lg"
                onClick={() => {
                  const slug = manga.name.replace(/\.pdf$/i, '');
                  navigate(getDoujinPath(`/${encodeURIComponent(slug)}/1`));
                }}
                style={{ animationDelay: `${i * 40}ms`, animation: 'slide-up 350ms cubic-bezier(0.25, 0.46, 0.45, 0.94) both' }}
              >
                <div className="aspect-[3/4] w-full relative overflow-hidden" style={{ background: 'var(--border-light)' }}>
                  {isNew && (
                    <div 
                      className="absolute top-2 right-2 z-10 px-2 py-0.5 text-white text-[10px] font-bold uppercase rounded shadow-lg pointer-events-none"
                      style={{ background: 'var(--accent-red, #ef4444)' }}
                    >
                      New
                    </div>
                  )}
                  {manga.thumbnailLink ? (
                    <img
                      src={manga.thumbnailLink}
                      alt={manga.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center" style={{ color: 'var(--text-tertiary)' }}>
                      <i className="bi bi-file-pdf text-5xl"></i>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                </div>
                <div className="p-3 md:p-4 flex-1 flex items-center justify-center text-center">
                  <h3 className="font-semibold text-xs md:text-sm line-clamp-2" title={manga.name}>
                    {manga.name.replace('.pdf', '')}
                  </h3>
                </div>
              </div>
            )})}
          </div>
        )}
      </div>
    </div>
  );
}
