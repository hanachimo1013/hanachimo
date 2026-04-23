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

function formatTitleCase(str) {
  return str.split(' ').map((word) => {
    if (word.length === 0) return word;
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  }).join(' ');
}

// ── Unslugify: extract artist (in []) and title from filename ──
// Handles both underscored and space-separated filenames from Google Drive
function unslugify(filename) {
  const stripped = filename.replace(/\.pdf$/i, '');

  // Pattern: optional_digits + separator, then [artist] + separator, then title
  // Separator can be underscore or space
  const regex = /^(?:\d+[\s_])?\[(.*?)\][\s_](.*)$/;
  const match = stripped.match(regex);

  if (match) {
    const rawArtist = match[1].replace(/_/g, ' ');
    const rawTitle = match[2].replace(/_/g, ' ');
    return { artist: rawArtist, title: formatTitleCase(rawTitle) };
  }

  // Fallback: strip leading numeric ID (with underscore or space), mark artist as "Unknown"
  const withoutId = stripped.replace(/^\d+[\s_]/, '');
  const fallbackTitle = withoutId.replace(/_/g, ' ');
  return { artist: 'Unknown', title: formatTitleCase(fallbackTitle) };
}

// ── Detect small viewport (mobile / small tablet) ──
function isSmallViewport() {
  return window.innerWidth < 1024;
}

// ── Group key: strip vol/part/chapter markers + subtitles, take first 3 words ──
function getGroupKey(title) {
  const cleaned = title
    .replace(/-[^-]+-/g, '')                        // Remove -subtitle- markers
    .replace(/\bVol\.?\s*[\d.]+/gi, '')              // Remove Vol. X
    .replace(/\bPart\s*[\d.]+/gi, '')                // Remove Part X
    .replace(/\bCh(?:apter)?\.?\s*[\d.]+/gi, '')     // Remove Ch/Chapter X
    .trim();
  const words = cleaned.split(/\s+/).filter((w) => w.length > 0).slice(0, 3);
  return words.join(' ').toLowerCase() || title.toLowerCase();
}

const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000;
function isNewFile(modifiedTime) {
  if (!modifiedTime) return false;
  return (Date.now() - new Date(modifiedTime).getTime()) <= TWO_DAYS_MS;
}

export default function MangaList() {
  const [mangaList, setMangaList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortField, setSortField] = useState(() => localStorage.getItem('mangaSortField') || 'name');
  const [sortDir, setSortDir] = useState(() => localStorage.getItem('mangaSortDir') || 'asc');
  const [searchQuery, setSearchQuery] = useState('');
  const [ageFilter, setAgeFilter] = useState('all');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null); // modal state
  const [modalView, setModalView] = useState('list'); // 'list' | 'card'
  const [pendingItem, setPendingItem] = useState(null); // mobile warning gate
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const searchInputRef = useRef(null);

  // Handle document title
  useEffect(() => {
    document.title = "Manga Library | from hanachimo's Doujin Archives";
  }, []);

  // Persist sorting changes
  useEffect(() => { localStorage.setItem('mangaSortField', sortField); }, [sortField]);
  useEffect(() => { localStorage.setItem('mangaSortDir', sortDir); }, [sortDir]);

  useEffect(() => {
    fetch('/api/fetch-manga')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch manga list');
        return res.json();
      })
      .then((data) => {
        const slim = (data || []).map(({ id, name, thumbnailLink, modifiedTime }) => ({
          id, name, thumbnailLink, modifiedTime,
        }));
        setMangaList(slim);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // ── Build groups ──
  const groups = useMemo(() => {
    // 1. Parse each file
    const parsed = mangaList.map((manga) => {
      const { artist, title } = unslugify(manga.name);
      const groupKey = getGroupKey(title);
      return { ...manga, parsedTitle: title, parsedArtist: artist, groupKey };
    });

    // 2. Group by groupKey
    const map = new Map();
    for (const item of parsed) {
      if (!map.has(item.groupKey)) map.set(item.groupKey, []);
      map.get(item.groupKey).push(item);
    }

    // 3. Convert to group objects
    return Array.from(map.entries()).map(([key, items]) => {
      // Natural sort within group so Vol. 1 < Vol. 2 < Vol. 10
      items.sort((a, b) => a.parsedTitle.localeCompare(b.parsedTitle, undefined, { numeric: true }));

      const first = items[0];
      const hasNew = items.some((m) => isNewFile(m.modifiedTime));
      const latestModified = items.reduce((latest, m) => {
        if (!m.modifiedTime) return latest;
        const t = new Date(m.modifiedTime).getTime();
        return t > latest ? t : latest;
      }, 0);

      return {
        groupKey: key,
        groupTitle: formatTitleCase(key),
        groupArtist: first.parsedArtist,
        thumbnailLink: first.thumbnailLink,
        items,
        itemCount: items.length,
        hasNew,
        modifiedTime: latestModified ? new Date(latestModified).toISOString() : null,
        name: key, // for sorting by name
      };
    });
  }, [mangaList]);

  // ── Filter groups ──
  const filtered = useMemo(() => {
    let list = groups;
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter((g) =>
        g.groupKey.includes(q) ||
        g.items.some((m) =>
          m.parsedTitle.toLowerCase().includes(q) ||
          (m.parsedArtist && m.parsedArtist.toLowerCase().includes(q))
        )
      );
    }
    if (ageFilter === 'new') list = list.filter((g) => g.hasNew);
    else if (ageFilter === 'old') list = list.filter((g) => !g.hasNew);
    return list;
  }, [groups, searchQuery, ageFilter]);

  // ── Sort groups ──
  const sorted = useMemo(
    () => [...filtered].sort((a, b) => compareFn(a, b, sortField, sortDir)),
    [filtered, sortField, sortDir]
  );

  const currentFieldLabel = SORT_FIELDS.find((f) => f.value === sortField)?.label || 'Name';

  // ── Handlers ──
  const navigateToReader = (manga) => {
    const slug = manga.name.replace(/\.pdf$/i, '');
    navigate(getDoujinPath(`/${encodeURIComponent(slug)}/1`));
  };

  const handleGroupClick = (group) => {
    if (group.itemCount === 1) {
      // Single item → check mobile warning first
      if (isSmallViewport()) {
        setPendingItem(group.items[0]);
      } else {
        navigateToReader(group.items[0]);
      }
    } else {
      setSelectedGroup(group);
    }
  };

  const handleItemClick = (manga) => {
    if (isSmallViewport()) {
      setPendingItem(manga);
    } else {
      navigateToReader(manga);
    }
  };

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
          background: theme === 'dark' ? 'rgba(0, 0, 0, 0.72)' : 'rgba(245, 245, 247, 0.72)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid var(--border-light)',
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
                {[
                  { key: 'all',  label: 'All',  activeColor: 'var(--accent-blue)' },
                  { key: 'new',  label: 'New',  activeColor: 'var(--accent-red)' },
                  { key: 'old',  label: 'Old',  activeColor: 'var(--accent-purple)' },
                ].map((f, idx) => (
                  <button
                    key={f.key}
                    id={`filter-${f.key}`}
                    onClick={() => setAgeFilter(f.key)}
                    className="px-2.5 md:px-3 py-1.5 text-[11px] md:text-xs font-semibold transition-all duration-200"
                    style={{
                      background: ageFilter === f.key ? f.activeColor : 'transparent',
                      color: ageFilter === f.key ? '#fff' : 'var(--text-secondary)',
                      borderLeft: idx > 0 ? '1px solid var(--border-medium)' : 'none',
                    }}
                  >
                    {f.label}
                  </button>
                ))}
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
                    <div className="fixed inset-0 z-40" onClick={() => setShowSortMenu(false)}></div>
                    <div className="absolute right-0 top-full mt-2 z-50 glass-card rounded-xl p-2 min-w-[220px] shadow-2xl animate-fade-scale"
                         style={{ border: '1px solid var(--glass-border)' }}>
                      <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-tertiary)' }}>Sort by</p>
                      {SORT_FIELDS.map((f) => (
                        <button key={f.value} onClick={() => setSortField(f.value)}
                          className="w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between transition-colors duration-150"
                          style={{ background: sortField === f.value ? 'var(--accent-blue)' : 'transparent', color: sortField === f.value ? '#fff' : 'var(--text-primary)' }}>
                          {f.label}
                          {sortField === f.value && <i className="bi bi-check2"></i>}
                        </button>
                      ))}
                      <div className="my-2 mx-3" style={{ borderTop: '1px solid var(--border-light)' }}></div>
                      <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-tertiary)' }}>Direction</p>
                      {['asc', 'desc'].map((d) => (
                        <button key={d} onClick={() => setSortDir(d)}
                          className="w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between transition-colors duration-150"
                          style={{ background: sortDir === d ? 'var(--accent-blue)' : 'transparent', color: sortDir === d ? '#fff' : 'var(--text-primary)' }}>
                          <span><i className={`bi bi-sort-${d === 'asc' ? 'up' : 'down'} mr-2`}></i>{d === 'asc' ? 'Ascending' : 'Descending'}</span>
                          {sortDir === d && <i className="bi bi-check2"></i>}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Theme toggle */}
              <button id="theme-toggle" onClick={toggleTheme}
                className="glass-card p-2 rounded-xl hover:shadow-lg transition-all duration-300 active:scale-95"
                title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
                <i className={`bi ${theme === 'dark' ? 'bi-sun-fill' : 'bi-moon-fill'} text-base`}
                   style={{ color: theme === 'dark' ? 'var(--accent-orange)' : 'var(--accent-purple)' }}></i>
              </button>
            </div>
          </div>

          {/* Row 2: Search Bar */}
          <div className="pb-3">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-200"
              style={{ background: theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', border: '1px solid var(--border-light)' }}>
              <i className="bi bi-search text-sm" style={{ color: 'var(--text-tertiary)' }}></i>
              <input id="manga-search" ref={searchInputRef} type="text"
                placeholder="Search by title or artist..."
                value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent outline-none text-sm"
                style={{ color: 'var(--text-primary)', caretColor: 'var(--accent-blue)' }} />
              {searchQuery && (
                <button onClick={() => { setSearchQuery(''); searchInputRef.current?.focus(); }}
                  className="flex items-center justify-center w-5 h-5 rounded-full transition-colors duration-150"
                  style={{ background: 'var(--text-tertiary)', color: theme === 'dark' ? '#000' : '#fff' }}>
                  <i className="bi bi-x text-xs"></i>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Gallery Grid (grouped) ── */}
      <div className="max-w-7xl mx-auto p-4 md:px-10 md:py-6">
        {sorted.length === 0 ? (
          <div className="glass-card p-12 text-center" style={{ color: 'var(--text-secondary)' }}>
            {searchQuery || ageFilter !== 'all'
              ? 'No results found. Try adjusting your search or filters.'
              : 'No PDF files found in the specified Google Drive folder.'}
          </div>
        ) : (
          <>
            <p className="text-xs font-medium mb-4" style={{ color: 'var(--text-tertiary)' }}>
              {sorted.length} series · {sorted.reduce((s, g) => s + g.itemCount, 0)} titles
              {(searchQuery || ageFilter !== 'all') ? ' found' : ''}
            </p>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
              {sorted.map((group, i) => (
                <div
                  key={group.groupKey}
                  className="glass-card flex flex-col overflow-hidden cursor-pointer transition-all duration-300 group hover:scale-[1.02] hover:shadow-lg"
                  onClick={() => handleGroupClick(group)}
                  style={{ animationDelay: `${i * 40}ms`, animation: 'slide-up 350ms cubic-bezier(0.25, 0.46, 0.45, 0.94) both' }}
                >
                  <div className="aspect-[3/4] w-full relative overflow-hidden" style={{ background: 'var(--border-light)' }}>
                    {/* Badges */}
                    <div className="absolute top-2 right-2 z-10 flex flex-col gap-1 items-end pointer-events-none">
                      {group.hasNew && (
                        <div className="px-2 py-0.5 text-white text-[10px] font-bold uppercase rounded shadow-lg"
                          style={{ background: 'var(--accent-red, #ef4444)' }}>New</div>
                      )}
                      {group.itemCount > 1 && (
                        <div className="px-2 py-0.5 text-white text-[10px] font-bold rounded shadow-lg"
                          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
                          <i className="bi bi-layers-fill mr-1"></i>{group.itemCount}
                        </div>
                      )}
                    </div>

                    {group.thumbnailLink ? (
                      <img src={group.thumbnailLink} alt={group.groupTitle}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center" style={{ color: 'var(--text-tertiary)' }}>
                        <i className="bi bi-file-pdf text-5xl"></i>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                  </div>

                  <div className="p-3 md:p-4 flex-1 flex flex-col items-center justify-center text-center gap-0.5">
                    <h3 className="font-semibold text-xs md:text-sm line-clamp-2" title={group.groupTitle}>
                      {group.groupTitle}
                    </h3>
                    <p className="text-[10px] md:text-xs line-clamp-1" style={{ color: 'var(--text-tertiary)' }} title={group.groupArtist}>
                      {group.groupArtist}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── Group Detail Modal ── */}
      {selectedGroup && (
        <div
          className="fixed inset-0 z-[100] flex items-end md:items-center justify-center"
          onClick={() => setSelectedGroup(null)}
          style={{ animation: 'fade-in 200ms ease' }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0"
            style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }} />

          {/* Modal card */}
          <div
            className="relative z-10 w-full max-w-lg max-h-[85vh] md:max-h-[80vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: theme === 'dark' ? 'rgba(28,28,30,0.92)' : 'rgba(255,255,255,0.92)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: '1px solid var(--glass-border)',
              borderRadius: window.innerWidth < 768 ? '20px 20px 0 0' : '20px',
              boxShadow: '0 24px 80px rgba(0,0,0,0.3)',
              animation: window.innerWidth < 768
                ? 'slide-up 300ms cubic-bezier(0.25, 0.46, 0.45, 0.94)'
                : 'fade-scale 280ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            }}
          >
            {/* Modal header */}
            <div className="flex items-start gap-4 p-5 pb-3">
              {/* Thumbnail */}
              {selectedGroup.thumbnailLink && (
                <div className="w-16 h-20 md:w-20 md:h-[104px] rounded-lg overflow-hidden shrink-0 shadow-lg"
                  style={{ background: 'var(--border-light)' }}>
                  <img src={selectedGroup.thumbnailLink} alt="" className="w-full h-full object-cover" />
                </div>
              )}
              <div className="flex-1 min-w-0 pt-1">
                <h2 className="font-bold text-base md:text-lg leading-tight line-clamp-2">
                  {selectedGroup.groupTitle}
                </h2>
                <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                  {selectedGroup.groupArtist}
                </p>
                <p className="text-[11px] mt-1 font-medium" style={{ color: 'var(--text-secondary)' }}>
                  {selectedGroup.itemCount} volume{selectedGroup.itemCount !== 1 ? 's' : ''}
                </p>
              </div>
              {/* Close button */}
              <button
                onClick={() => setSelectedGroup(null)}
                className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-150"
                style={{ background: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' }}
              >
                <i className="bi bi-x-lg text-xs" style={{ color: 'var(--text-secondary)' }}></i>
              </button>
            </div>

            {/* View toggle + divider */}
            <div className="flex items-center justify-between px-5 pb-2">
              <div style={{ borderTop: '1px solid var(--border-light)', flex: 1, marginRight: '12px' }}></div>
              <div className="flex rounded-lg overflow-hidden shrink-0" style={{ border: '1px solid var(--border-medium)' }}>
                <button
                  onClick={() => setModalView('list')}
                  className="px-2.5 py-1 text-[11px] font-semibold transition-all duration-200 flex items-center gap-1"
                  style={{
                    background: modalView === 'list' ? 'var(--accent-blue)' : 'transparent',
                    color: modalView === 'list' ? '#fff' : 'var(--text-secondary)',
                  }}
                >
                  <i className="bi bi-list-ul text-xs"></i>
                  <span className="hidden md:inline">List</span>
                </button>
                <button
                  onClick={() => setModalView('card')}
                  className="px-2.5 py-1 text-[11px] font-semibold transition-all duration-200 flex items-center gap-1"
                  style={{
                    background: modalView === 'card' ? 'var(--accent-blue)' : 'transparent',
                    color: modalView === 'card' ? '#fff' : 'var(--text-secondary)',
                    borderLeft: '1px solid var(--border-medium)',
                  }}
                >
                  <i className="bi bi-grid-fill text-xs"></i>
                  <span className="hidden md:inline">Card</span>
                </button>
              </div>
            </div>

            {/* Items — List View */}
            {modalView === 'list' && (
              <div className="overflow-y-auto flex-1 p-3 custom-scrollbar">
                {selectedGroup.items.map((manga, idx) => {
                  const itemIsNew = isNewFile(manga.modifiedTime);
                  return (
                    <button
                      key={manga.id}
                      onClick={() => handleItemClick(manga)}
                      className="w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-all duration-150 hover:scale-[1.01] active:scale-[0.99]"
                      style={{
                        background: 'transparent',
                        animationDelay: `${idx * 30}ms`,
                        animation: 'slide-up 250ms cubic-bezier(0.25, 0.46, 0.45, 0.94) both',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      {/* Item thumbnail */}
                      <div className="w-11 h-14 rounded-lg overflow-hidden shrink-0 shadow-md"
                        style={{ background: 'var(--border-light)' }}>
                        {manga.thumbnailLink ? (
                          <img src={manga.thumbnailLink} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center" style={{ color: 'var(--text-tertiary)' }}>
                            <i className="bi bi-file-pdf text-lg"></i>
                          </div>
                        )}
                      </div>

                      {/* Item info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm line-clamp-1">{manga.parsedTitle}</p>
                        <p className="text-[11px] line-clamp-1" style={{ color: 'var(--text-tertiary)' }}>
                          {manga.parsedArtist}
                        </p>
                      </div>

                      {/* Badges + chevron */}
                      <div className="flex items-center gap-2 shrink-0">
                        {itemIsNew && (
                          <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase rounded text-white"
                            style={{ background: 'var(--accent-red)' }}>New</span>
                        )}
                        <i className="bi bi-chevron-right text-xs" style={{ color: 'var(--text-tertiary)' }}></i>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Items — Card View */}
            {modalView === 'card' && (
              <div className="overflow-y-auto flex-1 p-4 custom-scrollbar">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {selectedGroup.items.map((manga, idx) => {
                    const itemIsNew = isNewFile(manga.modifiedTime);
                    return (
                      <div
                        key={manga.id}
                        onClick={() => handleItemClick(manga)}
                        className="flex flex-col overflow-hidden rounded-xl cursor-pointer transition-all duration-200 hover:scale-[1.03] active:scale-[0.98] hover:shadow-lg"
                        style={{
                          background: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                          border: '1px solid var(--border-light)',
                          animationDelay: `${idx * 40}ms`,
                          animation: 'slide-up 280ms cubic-bezier(0.25, 0.46, 0.45, 0.94) both',
                        }}
                      >
                        <div className="aspect-[3/4] w-full relative overflow-hidden" style={{ background: 'var(--border-light)' }}>
                          {itemIsNew && (
                            <div className="absolute top-1.5 right-1.5 z-10 px-1.5 py-0.5 text-white text-[9px] font-bold uppercase rounded shadow-lg pointer-events-none"
                              style={{ background: 'var(--accent-red)' }}>New</div>
                          )}
                          {manga.thumbnailLink ? (
                            <img src={manga.thumbnailLink} alt="" className="w-full h-full object-cover" loading="lazy" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center" style={{ color: 'var(--text-tertiary)' }}>
                              <i className="bi bi-file-pdf text-3xl"></i>
                            </div>
                          )}
                        </div>
                        <div className="p-2 text-center">
                          <p className="font-medium text-[11px] md:text-xs line-clamp-2">{manga.parsedTitle}</p>
                          <p className="text-[10px] line-clamp-1 mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{manga.parsedArtist}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Mobile Data Warning Dialog ── */}
      {pendingItem && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-6"
          onClick={() => setPendingItem(null)}
          style={{ animation: 'fade-in 150ms ease' }}
        >
          <div className="absolute inset-0"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }} />

          <div
            className="relative z-10 w-full max-w-sm overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: theme === 'dark' ? 'rgba(28,28,30,0.95)' : 'rgba(255,255,255,0.95)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: '1px solid var(--glass-border)',
              borderRadius: '16px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
              animation: 'fade-scale 250ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            }}
          >
            {/* Warning icon + text */}
            <div className="p-6 pb-4 text-center">
              <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center"
                style={{ background: 'rgba(255, 149, 0, 0.12)' }}>
                <i className="bi bi-exclamation-triangle-fill text-xl" style={{ color: 'var(--accent-orange)' }}></i>
              </div>
              <h3 className="font-bold text-base mb-1.5">Large File Warning</h3>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                This manga loads as a <strong>full PDF</strong> from Google Drive, which can be
                <strong> 20–100+ MB</strong>. Unlike traditional sites that stream images,
                the entire file must download before reading.
              </p>
              <p className="text-[11px] mt-2 font-medium" style={{ color: 'var(--accent-orange)' }}>
                <i className="bi bi-wifi mr-1"></i>
                Wi-Fi recommended for the best experience.
              </p>
            </div>

            {/* Action buttons */}
            <div style={{ borderTop: '1px solid var(--border-light)' }}>
              <div className="flex">
                <button
                  onClick={() => setPendingItem(null)}
                  className="flex-1 py-3.5 text-sm font-semibold transition-colors duration-150"
                  style={{ color: 'var(--accent-blue)', borderRight: '1px solid var(--border-light)' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = theme === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const item = pendingItem;
                    setPendingItem(null);
                    navigateToReader(item);
                  }}
                  className="flex-1 py-3.5 text-sm font-bold transition-colors duration-150"
                  style={{ color: 'var(--accent-orange)' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = theme === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  Proceed Anyway
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
