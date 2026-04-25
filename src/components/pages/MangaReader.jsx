import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import AppleSpinner from '../ui/AppleSpinner';
import { useParams, useNavigate } from 'react-router-dom';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Initialize PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

// How many pages to render around the current visible page
const BUFFER_PAGES = 4;

// Simple in-memory cache so navigating back doesn't re-download
const blobCache = new Map();

const getDoujinPath = (path) => {
  return `/doujin${path}`;
};

const PageSkeleton = ({ height, width }) => {
  // Use a stable estimated height so the DOM doesn't collapse/expand
  // when pages enter/leave the render window.
  const stableHeight = height || '140vh';
  return (
    <div
      className="flex items-center justify-center"
      style={{ height: stableHeight, width: width || '100%', background: 'rgba(255,255,255,0.04)' }}
    >
      <AppleSpinner white />
    </div>
  );
};

const MangaReader = () => {
  const { slug, pageNum } = useParams();
  const navigate = useNavigate();
  const currentPage = parseInt(pageNum || '1', 10);

  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('manga');
  const [sequenceMode, setSequenceMode] = useState('rtl');
  const [visiblePage, setVisiblePage] = useState(currentPage);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showJumpModal, setShowJumpModal] = useState(false);
  const [jumpInput, setJumpInput] = useState('');
  const [jumpError, setJumpError] = useState('');
  const dropdownRef = useRef(null);

  const containerRef = useRef(null);
  const pageRefs = useRef([]);
  const observerRef = useRef(null);
  const scrollTimeoutRef = useRef(null);
  // Guard: only scrollIntoView on initial load or explicit navigation, not observer-driven
  const initialScrollDoneRef = useRef(false);
  // Track the high-water mark so we never un-render already-seen pages
  const renderedRangeRef = useRef({ min: Infinity, max: -Infinity });

  // ── 1. Fetch PDF with progress & caching ─────────────────────────
  useEffect(() => {
    let active = true;

    const fetchPdf = async () => {
      // Check cache first
      if (blobCache.has(slug)) {
        setPdfBlobUrl(blobCache.get(slug));
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setDownloadProgress(0);

        const res = await fetch(`/api/fetch-manga?fileName=${encodeURIComponent(slug + '.pdf')}`);
        if (!res.ok) throw new Error('Failed to load PDF.');

        const contentLength = res.headers.get('content-length');
        const total = contentLength ? parseInt(contentLength, 10) : 0;

        // Stream-read with progress if possible
        if (total && res.body) {
          const reader = res.body.getReader();
          const chunks = [];
          let received = 0;

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(value);
            received += value.length;
            if (active) setDownloadProgress(Math.round((received / total) * 100));
          }

          const blob = new Blob(chunks, { type: 'application/pdf' });
          if (active) {
            const url = URL.createObjectURL(blob);
            blobCache.set(slug, url);
            setPdfBlobUrl(url);
          }
        } else if (res.body) {
          // Fallback: stream without content-length — indeterminate progress
          const reader = res.body.getReader();
          const chunks = [];
          let received = 0;

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(value);
            received += value.length;
            // Asymptotic progress: ramps up but never reaches 100 until done
            if (active) setDownloadProgress(Math.min(95, Math.round(100 * (1 - Math.exp(-received / 500000)))));
          }

          if (active) setDownloadProgress(100);
          const blob = new Blob(chunks, { type: 'application/pdf' });
          if (active) {
            const url = URL.createObjectURL(blob);
            blobCache.set(slug, url);
            setPdfBlobUrl(url);
          }
        } else {
          // Final fallback: no streaming support at all
          const blob = await res.blob();
          if (active) {
            const url = URL.createObjectURL(blob);
            blobCache.set(slug, url);
            setPdfBlobUrl(url);
          }
        }
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchPdf();
    return () => { active = false; };
  }, [slug]);

  // ── 2. Document loaded → set page count ───────────────────────────
  const onDocumentLoadSuccess = useCallback(({ numPages: n }) => {
    setNumPages(n);
  }, []);

  // ── 3. Handle document title ────────────────────────────────────────
  useEffect(() => {
    if (slug) {
      const cleanName = slug.replace(/_/g, ' ');
      document.title = `Manga Mode | ${cleanName}`;
    }
  }, [slug]);

  // ── 4. Determine which pages to actually render (virtualization) ──
  // Use an expanding window: once a page is rendered, keep it rendered
  // to avoid layout shifts (the root cause of the stutter).
  const renderedPages = useMemo(() => {
    if (!numPages) return new Set();
    const center = visiblePage - 1; // 0-indexed

    // Expand buffer
    const newMin = Math.max(0, center - BUFFER_PAGES);
    const newMax = Math.min(numPages - 1, center + BUFFER_PAGES);

    // For manhwa mode, keep the high-water mark so we never un-render
    if (viewMode === 'manhwa') {
      renderedRangeRef.current.min = Math.min(renderedRangeRef.current.min, newMin);
      renderedRangeRef.current.max = Math.max(renderedRangeRef.current.max, newMax);
    } else {
      // Manga mode: just use the buffer window (single page view)
      renderedRangeRef.current.min = newMin;
      renderedRangeRef.current.max = newMax;
    }

    const pages = new Set();
    for (let i = renderedRangeRef.current.min; i <= renderedRangeRef.current.max; i++) {
      pages.add(i);
    }
    return pages;
  }, [numPages, visiblePage, viewMode]);

  // ── 5. Scroll to the requested page after document load (Manhwa) ──
  // Only fire on initial load (when numPages first becomes non-null)
  // NOT when the observer updates visiblePage / URL.
  useEffect(() => {
    if (!numPages || viewMode === 'manga') return;
    if (initialScrollDoneRef.current) return; // already scrolled

    initialScrollDoneRef.current = true;
    const idx = currentPage - 1;
    const el = pageRefs.current[idx];
    if (el) {
      requestAnimationFrame(() => {
        el.scrollIntoView({ behavior: 'auto', block: 'start', inline: 'start' });
      });
    }
  }, [numPages, viewMode]); // intentionally omitting currentPage to avoid re-firing

  // Reset the scroll guard when switching view modes
  useEffect(() => {
    initialScrollDoneRef.current = false;
    // Also reset the rendered range
    renderedRangeRef.current = { min: Infinity, max: -Infinity };
  }, [viewMode]);

  // ── 6. IntersectionObserver to track visible page (Manhwa) ────────
  useEffect(() => {
    if (!numPages || !containerRef.current || viewMode === 'manga') return;

    if (observerRef.current) observerRef.current.disconnect();

    const observer = new IntersectionObserver(
      (entries) => {
        // Find the most-visible entry
        let bestEntry = null;
        for (const entry of entries) {
          if (entry.isIntersecting) {
            if (!bestEntry || entry.intersectionRatio > bestEntry.intersectionRatio) {
              bestEntry = entry;
            }
          }
        }

        if (bestEntry) {
          const idx = parseInt(bestEntry.target.getAttribute('data-page-index'), 10);
          const pageNumber = idx + 1;

          setVisiblePage(pageNumber);

          // Debounced URL update via replaceState (no React re-render)
          clearTimeout(scrollTimeoutRef.current);
          scrollTimeoutRef.current = setTimeout(() => {
            window.history.replaceState(
              null,
              '',
              getDoujinPath(`/${encodeURIComponent(slug)}/${pageNumber}`)
            );
          }, 200);
        }
      },
      {
        root: containerRef.current,
        threshold: [0.1, 0.3, 0.5],
      }
    );

    observerRef.current = observer;

    pageRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => {
      observer.disconnect();
      clearTimeout(scrollTimeoutRef.current);
    };
  }, [numPages, slug, viewMode]);

  // ── 7. Compute page dimensions (responsive) ──────────────────────
  const isMobile = window.innerWidth < 768;
  const pageDimensions = useMemo(() => {
    const mobile = window.innerWidth < 768;
    if (viewMode === 'manhwa') {
      // Mobile: full width with small margins, Desktop: capped at 800px
      return { width: mobile ? window.innerWidth - 16 : Math.min(window.innerWidth - 64, 800), height: undefined };
    }
    // Manga mode: Mobile explicitly bounds width so content stretches don't clip. Desktop: bound height.
    if (mobile) {
      return { width: window.innerWidth - 16, height: undefined };
    }
    const h = window.innerHeight - 48;
    return { width: undefined, height: h };
  }, [viewMode]);

  // ── 8. Navigation handlers (Also sync visiblePage in Manga mode) ─
  const handleNextPage = useCallback(() => {
    if (numPages && currentPage < numPages) {
      if (viewMode === 'manga') setVisiblePage(currentPage + 1);
      navigate(getDoujinPath(`/${encodeURIComponent(slug)}/${currentPage + 1}`), { replace: true });
    }
  }, [numPages, currentPage, slug, navigate, viewMode]);

  const handlePrevPage = useCallback(() => {
    if (currentPage > 1) {
      if (viewMode === 'manga') setVisiblePage(currentPage - 1);
      navigate(getDoujinPath(`/${encodeURIComponent(slug)}/${currentPage - 1}`), { replace: true });
    }
  }, [currentPage, slug, navigate, viewMode]);

  // Ensure visiblePage stays in sync with URL if user changes via URL directly in Manga mode
  useEffect(() => {
    if (viewMode === 'manga') setVisiblePage(currentPage);
  }, [currentPage, viewMode]);

  // ── 9. Keyboard Navigation ─────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.key === 'ArrowLeft') {
        sequenceMode === 'rtl' ? handleNextPage() : handlePrevPage();
      } else if (e.key === 'ArrowRight') {
        sequenceMode === 'rtl' ? handlePrevPage() : handleNextPage();
      } else if (e.key === 'Escape') {
        if (showJumpModal) { setShowJumpModal(false); setJumpError(''); }
        else if (showDropdown) setShowDropdown(false);
        else navigate(getDoujinPath('/'));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNextPage, handlePrevPage, sequenceMode, navigate, showJumpModal, showDropdown]);

  // ── Close dropdown on outside click ──
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setShowDropdown(false);
    };
    if (showDropdown) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDropdown]);

  // ── Jump to page handler ──
  const handleJumpToPage = useCallback(() => {
    const page = parseInt(jumpInput, 10);
    if (isNaN(page) || page < 1 || page > numPages) {
      setJumpError(`Invalid page. Enter a number between 1 and ${numPages}.`);
      return;
    }
    setJumpError('');
    setShowJumpModal(false);
    setJumpInput('');
    setVisiblePage(page);
    navigate(getDoujinPath(`/${encodeURIComponent(slug)}/${page}`), { replace: true });
    if (viewMode === 'manhwa') {
      requestAnimationFrame(() => {
        const el = pageRefs.current[page - 1];
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  }, [jumpInput, numPages, slug, navigate, viewMode]);

  // ── Loading state with progress bar ───────────────────────────────
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-black">
        <div className="glass-card p-8 flex flex-col items-center gap-5 min-w-[280px]">
          <AppleSpinner size="lg" white />
          <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
            Initializing PDF… {downloadProgress > 0 ? `${downloadProgress}%` : ''}
          </p>
          <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300 ease-out"
              style={{
                width: `${downloadProgress}%`,
                background: 'rgba(255, 255, 255, 0.7)',
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-black">
        <div className="glass-card p-8 text-center text-red-400 font-semibold">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-full overflow-hidden bg-black text-white">
      {/* ── Floating Bottom Pill (Safari-style) ── */}
      <div className="fixed left-1/2 -translate-x-1/2 z-50 glass-subtle px-4 py-2 rounded-full flex gap-3 items-center shadow-2xl transition-opacity duration-300 hover:opacity-100 opacity-60 md:opacity-90"
           style={{
             bottom: window.innerWidth < 768
               ? 'calc(12px + env(safe-area-inset-bottom, 0px))'
               : '32px',
             backdropFilter: 'blur(20px)',
             WebkitBackdropFilter: 'blur(20px)',
             fontSize: '12px',
           }}
      >
        <button
          onClick={() => navigate(getDoujinPath('/'))}
          className="text-white/80 hover:text-[var(--accent-blue)] transition-colors"
          title="Back to Gallery"
        >
          <i className="bi bi-arrow-left text-xs"></i>
        </button>

        {/* Settings dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown((v) => !v)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all ${showDropdown ? 'bg-white/20 text-white' : 'bg-white/10 text-white/70 hover:text-white hover:bg-white/15'}`}
            title="Reader Settings"
          >
            <i className="bi bi-gear text-[11px]"></i>
            <span className="text-[11px] capitalize">{viewMode}</span>
            <i className={`bi bi-chevron-${showDropdown ? 'up' : 'down'} text-[8px] ml-0.5`}></i>
          </button>

          {showDropdown && (
            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 min-w-[180px] rounded-xl overflow-hidden shadow-2xl animate-fade-scale"
                 style={{ background: 'rgba(30,30,32,0.92)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="px-3 pt-2.5 pb-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-white/40">Viewing Type</span>
              </div>
              {['manga', 'manhwa'].map((m) => (
                <button key={m} onClick={() => { setViewMode(m); if (m === 'manga') setSequenceMode('rtl'); }}
                  className={`w-full text-left px-3 py-2 text-[12px] flex items-center justify-between transition-colors ${viewMode === m ? 'bg-white/10 text-white font-medium' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}>
                  <span className="capitalize">{m}</span>
                  {viewMode === m && <i className="bi bi-check2 text-[var(--accent-blue)] text-[11px]"></i>}
                </button>
              ))}

              <div className="mx-3 my-1 border-t border-white/8"></div>

              <div className="px-3 pt-1 pb-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-white/40">Sequence</span>
              </div>
              {[{ key: 'rtl', label: 'Right to Left' }, { key: 'ltr', label: 'Left to Right' }].map(({ key, label }) => (
                <button key={key} onClick={() => setSequenceMode(key)}
                  className={`w-full text-left px-3 py-2 text-[12px] flex items-center justify-between transition-colors ${sequenceMode === key ? 'bg-white/10 text-white font-medium' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}>
                  <span>{label}</span>
                  {sequenceMode === key && <i className="bi bi-check2 text-[var(--accent-blue)] text-[11px]"></i>}
                </button>
              ))}
              <div className="h-1.5"></div>
            </div>
          )}
        </div>

        {/* Compact page nav */}
        <div className="flex items-center gap-2 font-mono text-white/70">
          <button onClick={sequenceMode === 'rtl' ? handleNextPage : handlePrevPage} disabled={currentPage <= 1} className="disabled:opacity-30 hover:text-white transition-colors">
            <i className="bi bi-chevron-left text-[10px]"></i>
          </button>
          <span className="tabular-nums">{visiblePage}<span className="text-white/30 mx-0.5">/</span>{numPages || '…'}</span>
          <button onClick={sequenceMode === 'rtl' ? handlePrevPage : handleNextPage} disabled={numPages && currentPage >= numPages} className="disabled:opacity-30 hover:text-white transition-colors">
            <i className="bi bi-chevron-right text-[10px]"></i>
          </button>
        </div>

        {/* Jump to page button */}
        <button
          onClick={() => { setShowJumpModal(true); setJumpInput(''); setJumpError(''); }}
          className="text-white/60 hover:text-white hover:bg-white/10 rounded-md px-1.5 py-1 transition-all"
          title="Jump to Page"
        >
          <i className="bi bi-search text-[11px]"></i>
        </button>
      </div>

      {/* ── Jump to Page Modal ── */}
      {showJumpModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center" onClick={() => { setShowJumpModal(false); setJumpError(''); }}>
          <div className="absolute inset-0 bg-black/60" style={{ backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}></div>
          <div className="relative z-10 w-[280px] rounded-2xl p-5 animate-fade-scale"
               style={{ background: 'rgba(36,36,38,0.95)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 24px 80px rgba(0,0,0,0.5)' }}
               onClick={(e) => e.stopPropagation()}>
            <h3 className="text-white text-sm font-semibold mb-3">Jump to Page</h3>
            <input
              type="number"
              min="1"
              max={numPages || 1}
              value={jumpInput}
              onChange={(e) => { setJumpInput(e.target.value); setJumpError(''); }}
              onKeyDown={(e) => { if (e.key === 'Enter') handleJumpToPage(); }}
              placeholder={`1 – ${numPages || '?'}`}
              autoFocus
              className="w-full rounded-lg px-3 py-2 text-sm text-white outline-none placeholder:text-white/30"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}
            />
            {jumpError && (
              <p className="text-[11px] mt-2 px-1" style={{ color: 'var(--accent-red)' }}>{jumpError}</p>
            )}
            <div className="flex gap-2 mt-3">
              <button onClick={() => { setShowJumpModal(false); setJumpError(''); }}
                className="flex-1 rounded-lg py-2 text-[12px] font-medium text-white/60 hover:text-white transition-colors"
                style={{ background: 'rgba(255,255,255,0.06)' }}>
                Cancel
              </button>
              <button onClick={handleJumpToPage}
                className="flex-1 rounded-lg py-2 text-[12px] font-semibold text-white transition-colors"
                style={{ background: 'var(--accent-blue)' }}>
                Go
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Reader Container ── */}
      <div
        ref={containerRef}
        className={
          viewMode === 'manga'
            ? 'flex flex-col items-center justify-start h-screen w-full overflow-y-auto custom-scrollbar relative'
            : 'flex flex-col overflow-y-auto h-screen w-full custom-scrollbar items-center'
        }
        style={{
          padding: viewMode === 'manga' ? (isMobile ? '16px 0 120px 0' : '24px 0') : '0',
        }}
      >
        <Document
          file={pdfBlobUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={
            <div className="flex items-center justify-center h-screen w-full">
              <AppleSpinner size="lg" white />
            </div>
          }
          className={
            viewMode === 'manga'
              ? 'flex items-center justify-center w-full h-full'
              : 'flex flex-col items-center w-full mt-20 mb-10 gap-0'
          }
        >
          {numPages && (viewMode === 'manga' ? (
            <div className="flex justify-center items-center">
              {currentPage >= 1 && currentPage <= numPages && (
                <Page
                  pageNumber={currentPage}
                  width={pageDimensions.width}
                  height={pageDimensions.height}
                  renderAnnotationLayer={false}
                  renderTextLayer={false}
                  loading={<PageSkeleton height={pageDimensions.height} width={pageDimensions.width} />}
                  className="shadow-2xl"
                />
              )}
            </div>
          ) : (
            Array.from({ length: numPages }, (_, index) => (
            <div
              key={`page_${index + 1}`}
              ref={(el) => { pageRefs.current[index] = el; }}
              data-page-index={index}
              className="shrink-0 w-full max-w-3xl flex justify-center px-2 md:px-0"
              style={{
                // Give un-rendered placeholders a stable minimum height
                // so layout doesn't jump when pages enter/leave the render window
                minHeight: renderedPages.has(index) ? undefined : '140vh',
              }}
            >
              {renderedPages.has(index) ? (
                <Page
                  pageNumber={index + 1}
                  width={pageDimensions.width}
                  height={pageDimensions.height}
                  renderAnnotationLayer={false}
                  renderTextLayer={false}
                  loading={<PageSkeleton height={pageDimensions.height} width={pageDimensions.width} />}
                  className="shadow-2xl"
                />
              ) : (
                <PageSkeleton
                  height="140vh"
                  width={pageDimensions.width}
                />
              )}
            </div>
          ))
          ))}
        </Document>
      </div>

      {/* ── Click zones for Manga mode tap navigation ── */}
      {viewMode === 'manga' && (
        <>
          <div className="absolute top-0 bottom-0 left-0 w-1/4 z-40 cursor-pointer" onClick={sequenceMode === 'rtl' ? handleNextPage : handlePrevPage} title={sequenceMode === 'rtl' ? 'Next Page' : 'Previous Page'}></div>
          <div className="absolute top-0 bottom-0 right-0 w-1/4 z-40 cursor-pointer" onClick={sequenceMode === 'rtl' ? handlePrevPage : handleNextPage} title={sequenceMode === 'rtl' ? 'Previous Page' : 'Next Page'}></div>
        </>
      )}
    </div>
  );
};

export default MangaReader;
