import React, { useEffect, useState, useMemo, useRef } from 'react';
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

// ── Unslugify: extract artist (in []) and title from filename ──
// Pattern: optional_digits_[artist]_Title_Words  or just  Title_Words
function unslugify(filename) {
  // Remove .pdf extension
  const stripped = filename.replace(/\.pdf$/i, '');

  // Regex: optional leading digits + underscore, then [artist], then underscore + title
  const regex = /^(?:\d+_)?\[(.*?)\]_(.*)$/;
  const match = stripped.match(regex);

  if (match) {
    const rawArtist = match[1].replace(/_/g, ' ');
    const rawTitle = match[2].replace(/_/g, ' ');
    return {
      artist: rawArtist,
      title: formatTitleCase(rawTitle),
    };
  }

  // Fallback: no brackets found — treat entire string as title
  const fallbackTitle = stripped.replace(/_/g, ' ');
  return {
    artist: null,
    title: formatTitleCase(fallbackTitle),
  };
}

function formatTitleCase(str) {
  return str.split(' ').map((word) => {
    if (word.length === 0) return word;
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  }).join(' ');
}

// ── Age filter: "new" = modified within last 2 days ──
const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000;
function isNewFile(modifiedTime) {
  if (!modifiedTime) return false;
  return (Date.now() - new Date(modifiedTime).getTime()) <= TWO_DAYS_MS;
}

export default function MangaList() {
  const [mangaList, setMangaList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Initialize sorting from localStorage or defaults
  const [sortField, setSortField] = useState(() => localStorage.getItem('mangaSortField') || 'name');
  const [sortDir, setSortDir] = useState(() => localStorage.getItem('mangaSortDir') || 'asc');
  const [searchQuery, setSearchQuery] = useState('');
  const [ageFilter, setAgeFilter] = useState('all'); // 'all' | 'new' | 'old'
  
  const [showSortMenu, setShowSortMenu] = useState(false);
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const searchInputRef = useRef(null);

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

  // ── Derived: parse filenames, filter, sort ──
  const processed = useMemo(() => {
    return mangaList.map((manga) => {
      const parsed = unslugify(manga.name);
      return { ...manga, parsedTitle: parsed.title, parsedArtist: parsed.artist };
    });
  }, [mangaList]);

  const filtered = useMemo(() => {
    let list = processed;

    // Search filter — matches against title and artist
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter((m) =>
        m.parsedTitle.toLowerCase().includes(q) ||
        (m.parsedArtist && m.parsedArtist.toLowerCase().includes(q))
      );
    }

    // Age filter
    if (ageFilter === 'new') {
      list = list.filter((m) => isNewFile(m.modifiedTime));
    } else if (ageFilter === 'old') {
      list = list.filter((m) => !isNewFile(m.modifiedTime));
    }

    return list;
  }, [processed, searchQuery, ageFilter]);

  const sorted = useMemo(
    () => [...filtered].sort((a, b) => compareFn(a, b, sortField, sortDir)),
    [filtered, sortField, sortDir]
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
    <div className="min-h-screen" style={{ background: 'var(--surface-primary)', color: 'var(--text-primary)' }}>

      {/* ── Sticky Top Bar ── */}
      <div
        className="sticky top-0 z-50"
        style={{
          background: theme === 'dark'
            ? 'rgba(0, 0, 0, 0.72)'
            : 'rgba(245, 245, 247, 0.72)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: `1px solid var(--border-light)`,
        }}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-10">
          {/* Row 1: Title + Controls */}
          <div className="flex items-center justify-between py-3 gap-3">
            <h1 className="text-lg md:text-xl font-bold tracking-tight whitespace-nowrap" id="manga-library-title">
              Manga Library
            </h1>

            <div className="flex items-center gap-2">
              {/* NEW / OLD toggle pills */}
              <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid var(--border-medium)' }}>
                <button
                  id="filter-all"
                  onClick={() => setAgeFilter('all')}
                  className="px-2.5 md:px-3 py-1.5 text-[11px] md:text-xs font-semibold transition-all duration-200"
                  style={{
                    background: ageFilter === 'all' ? 'var(--accent-blue)' : 'transparent',
                    color: ageFilter === 'all' ? '#fff' : 'var(--text-secondary)',
                  }}
                >
                  All
                </button>
                <button
                  id="filter-new"
                  onClick={() => setAgeFilter('new')}
                  className="px-2.5 md:px-3 py-1.5 text-[11px] md:text-xs font-semibold transition-all duration-200"
                  style={{
                    background: ageFilter === 'new' ? 'var(--accent-red)' : 'transparent',
                    color: ageFilter === 'new' ? '#fff' : 'var(--text-secondary)',
                    borderLeft: '1px solid var(--border-medium)',
                    borderRight: '1px solid var(--border-medium)',
                  }}
                >
                  New
                </button>
                <button
                  id="filter-old"
                  onClick={() => setAgeFilter('old')}
                  className="px-2.5 md:px-3 py-1.5 text-[11px] md:text-xs font-semibold transition-all duration-200"
                  style={{
                    background: ageFilter === 'old' ? 'var(--accent-purple)' : 'transparent',
                    color: ageFilter === 'old' ? '#fff' : 'var(--text-secondary)',
                  }}
                >
                  Old
                </button>
              </div>

              {/* Sort dropdown */}
              <div className="relative">
                <button
                  id="sort-menu-toggle"
                  onClick={() => setShowSortMenu((v) => !v)}
                  className="glass-card px-3 py-2 rounded-xl flex items-center gap-1.5 text-xs font-medium hover:shadow-lg transition-all duration-200 active:scale-95"
                >
                  <i className="bi bi-sort-down" style={{ color: 'var(--accent-blue)' }}></i>
                  <span className="hidden md:inline">{currentFieldLabel}</span>
                  <i className={`bi bi-chevron-${showSortMenu ? 'up' : 'down'} text-[10px]`} style={{ color: 'var(--text-tertiary)' }}></i>
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
                id="theme-toggle"
                onClick={toggleTheme}
                className="glass-card p-2 rounded-xl hover:shadow-lg transition-all duration-300 active:scale-95"
                title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              >
                <i className={`bi ${theme === 'dark' ? 'bi-sun-fill' : 'bi-moon-fill'} text-base`}
                   style={{ color: theme === 'dark' ? 'var(--accent-orange)' : 'var(--accent-purple)' }}
                ></i>
              </button>
            </div>
          </div>

          {/* Row 2: Search Bar */}
          <div className="pb-3">
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-200"
              style={{
                background: theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                border: '1px solid var(--border-light)',
              }}
            >
              <i className="bi bi-search text-sm" style={{ color: 'var(--text-tertiary)' }}></i>
              <input
                id="manga-search"
                ref={searchInputRef}
                type="text"
                placeholder="Search by title or artist..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent outline-none text-sm"
                style={{ color: 'var(--text-primary)', caretColor: 'var(--accent-blue)' }}
              />
              {searchQuery && (
                <button
                  onClick={() => { setSearchQuery(''); searchInputRef.current?.focus(); }}
                  className="flex items-center justify-center w-5 h-5 rounded-full transition-colors duration-150"
                  style={{ background: 'var(--text-tertiary)', color: theme === 'dark' ? '#000' : '#fff' }}
                >
                  <i className="bi bi-x text-xs"></i>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Gallery Grid ── */}
      <div className="max-w-7xl mx-auto p-4 md:px-10 md:py-6">
        {sorted.length === 0 ? (
          <div className="glass-card p-12 text-center" style={{ color: 'var(--text-secondary)' }}>
            {searchQuery || ageFilter !== 'all'
              ? 'No results found. Try adjusting your search or filters.'
              : 'No PDF files found in the specified Google Drive folder.'}
          </div>
        ) : (
          <>
            {/* Result count */}
            <p className="text-xs font-medium mb-4" style={{ color: 'var(--text-tertiary)' }}>
              {sorted.length} title{sorted.length !== 1 ? 's' : ''}
              {(searchQuery || ageFilter !== 'all') ? ' found' : ''}
            </p>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
              {sorted.map((manga, i) => {
                const fileIsNew = isNewFile(manga.modifiedTime);

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
                    {fileIsNew && (
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
                        alt={manga.parsedTitle}
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
                  <div className="p-3 md:p-4 flex-1 flex flex-col items-center justify-center text-center gap-0.5">
                    <h3 className="font-semibold text-xs md:text-sm line-clamp-2" title={manga.parsedTitle}>
                      {manga.parsedTitle}
                    </h3>
                    {manga.parsedArtist && (
                      <p className="text-[10px] md:text-xs line-clamp-1" style={{ color: 'var(--text-tertiary)' }} title={manga.parsedArtist}>
                        {manga.parsedArtist}
                      </p>
                    )}
                  </div>
                </div>
              );})}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
