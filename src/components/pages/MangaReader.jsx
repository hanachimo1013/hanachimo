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

/* ── Dropdown Component ── */
const PillDropdown = ({ label, value, options, onChange, isOpen, onToggle, dropdownRef }) => (
  <div className="relative" ref={dropdownRef}>
    <button
      onClick={onToggle}
      className="flex items-center gap-1 px-2 py-0.5 text-[11px] rounded-md bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-all cursor-pointer select-none"
      title={label}
    >
      <span className="font-medium">{options.find(o => o.value === value)?.label || value}</span>
      <i className={`bi bi-chevron-${isOpen ? 'up' : 'down'} text-[8px] ml-0.5 opacity-60`}></i>
    </button>
    {isOpen && (
      <div
        className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 min-w-[140px] rounded-xl overflow-hidden shadow-2xl animate-fade-scale z-[60]"
        style={{
          background: 'rgba(30, 30, 32, 0.92)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <div className="px-2.5 py-1.5 text-[9px] font-semibold uppercase tracking-wider text-white/30 select-none">
          {label}
        </div>
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => { onChange(opt.value); onToggle(); }}
            className={`w-full text-left px-3 py-1.5 text-[11px] transition-all cursor-pointer ${
              value === opt.value
                ? 'bg-white/15 text-white font-semibold'
                : 'text-white/60 hover:bg-white/8 hover:text-white'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    )}
  </div>
);

/* ── Jump-to-Page Modal ── */
const JumpToPageModal = ({ isOpen, onClose, numPages, onJump }) => {
  const [pageInput, setPageInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setPageInput('');
      setErrorMsg('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    const trimmed = pageInput.trim();

    if (!trimmed) {
      setErrorMsg('Please enter a page number.');
      return;
    }

    const num = parseInt(trimmed, 10);

    if (isNaN(num) || !Number.isInteger(Number(trimmed))) {
      setErrorMsg(`"${trimmed}" is not a valid page number.`);
      return;
    }

    if (num < 1 || num > numPages) {
      setErrorMsg(`Page must be between 1 and ${numPages}.`);
      return;
    }

    setErrorMsg('');
    onJump(num);
    onClose();
  }, [pageInput, numPages, onJump, onClose]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      onClick={onClose}
      style={{ background: 'rgba(0,0,0,0.55)' }}
    >
      <div
        className="relative w-[280px] rounded-2xl p-5 animate-fade-scale"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'rgba(30, 30, 32, 0.94)',
          backdropFilter: 'blur(32px)',
          WebkitBackdropFilter: 'blur(32px)',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white text-sm font-semibold">Jump to Page</h3>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white transition-colors text-xs cursor-pointer"
          >
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              inputMode="numeric"
              value={pageInput}
              onChange={(e) => { setPageInput(e.target.value); setErrorMsg(''); }}
              placeholder={`1 – ${numPages}`}
              className="w-full px-3 py-2 rounded-lg text-sm text-white placeholder-white/30 outline-none transition-all"
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: errorMsg ? '1px solid rgba(255,59,48,0.6)' : '1px solid rgba(255,255,255,0.1)',
              }}
            />
          </div>

          {errorMsg && (
            <p className="text-[11px] mt-2 text-red-400 font-medium animate-fade-in">
              <i className="bi bi-exclamation-circle mr-1"></i>{errorMsg}
            </p>
          )}

          <button
            type="submit"
            className="w-full mt-3 py-2 rounded-lg text-xs font-semibold text-white transition-all cursor-pointer hover:brightness-110 active:scale-[0.97]"
            style={{ background: 'rgba(0,122,255,0.8)' }}
          >
            Go
          </button>
        </form>
      </div>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════════
   MangaReader
   ════════════════════════════════════════════════════════════════════ */
const MangaReader = () => {
  const { slug, pageNum } = useParams();
  const navigate = useNavigate();
  const currentPage = parseInt(pageNum || '1', 10);

  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('manga');       // manga | manhwa
  const [sequenceMode, setSequenceMode] = useState('rtl');  // rtl | ltr
  const [visiblePage, setVisiblePage] = useState(currentPage);

  // Dropdown open states
  const [viewDropOpen, setViewDropOpen] = useState(false);
  const [seqDropOpen, setSeqDropOpen] = useState(false);
  const [jumpModalOpen, setJumpModalOpen] = useState(false);

  const viewDropRef = useRef(null);
  const seqDropRef = useRef(null);

  const containerRef = useRef(null);
  const pageRefs = useRef([]);
  const observerRef = useRef(null);
  const scrollTimeoutRef = useRef(null);
  const initialScrollDoneRef = useRef(false);
  const renderedRangeRef = useRef({ min: Infinity, max: -Infinity });

  // ── Close dropdowns on outside click ─────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (viewDropRef.current && !viewDropRef.current.contains(e.target)) setViewDropOpen(false);
      if (seqDropRef.current && !seqDropRef.current.contains(e.target)) setSeqDropOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

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
          const reader = res.body.getReader();
          const chunks = [];
          let received = 0;

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(value);
            received += value.length;
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

  // ── 4. Virtualization ──────────────────────────────────────────────
  const renderedPages = useMemo(() => {
    if (!numPages) return new Set();
    const center = visiblePage - 1;
    const newMin = Math.max(0, center - BUFFER_PAGES);
    const newMax = Math.min(numPages - 1, center + BUFFER_PAGES);

    if (viewMode === 'manhwa') {
      renderedRangeRef.current.min = Math.min(renderedRangeRef.current.min, newMin);
      renderedRangeRef.current.max = Math.max(renderedRangeRef.current.max, newMax);
    } else {
      renderedRangeRef.current.min = newMin;
      renderedRangeRef.current.max = newMax;
    }

    const pages = new Set();
    for (let i = renderedRangeRef.current.min; i <= renderedRangeRef.current.max; i++) {
      pages.add(i);
    }
    return pages;
  }, [numPages, visiblePage, viewMode]);

  // ── 5. Scroll to requested page after document load (Manhwa) ──────
  useEffect(() => {
    if (!numPages || viewMode === 'manga') return;
    if (initialScrollDoneRef.current) return;

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
    renderedRangeRef.current = { min: Infinity, max: -Infinity };
  }, [viewMode]);

  // ── 6. IntersectionObserver (Manhwa) ──────────────────────────────
  useEffect(() => {
    if (!numPages || !containerRef.current || viewMode === 'manga') return;

    if (observerRef.current) observerRef.current.disconnect();

    const observer = new IntersectionObserver(
      (entries) => {
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

  // ── 7. Compute page dimensions ────────────────────────────────────
  const isMobile = window.innerWidth < 768;
  const pageDimensions = useMemo(() => {
    const mobile = window.innerWidth < 768;
    if (viewMode === 'manhwa') {
      return { width: mobile ? window.innerWidth - 16 : Math.min(window.innerWidth - 64, 800), height: undefined };
    }
    if (mobile) {
      return { width: window.innerWidth - 16, height: undefined };
    }
    const h = window.innerHeight - 48;
    return { width: undefined, height: h };
  }, [viewMode]);

  // ── 8. Navigation — respects sequenceMode ─────────────────────────
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

  // Ensure visiblePage stays in sync with URL in Manga mode
  useEffect(() => {
    if (viewMode === 'manga') setVisiblePage(currentPage);
  }, [currentPage, viewMode]);

  // Jump to page handler
  const handleJumpToPage = useCallback((page) => {
    if (viewMode === 'manga') {
      setVisiblePage(page);
      navigate(getDoujinPath(`/${encodeURIComponent(slug)}/${page}`), { replace: true });
    } else {
      // Manhwa: scroll to the page
      const idx = page - 1;
      const el = pageRefs.current[idx];
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      setVisiblePage(page);
      window.history.replaceState(null, '', getDoujinPath(`/${encodeURIComponent(slug)}/${page}`));
    }
  }, [viewMode, slug, navigate]);

  // ── 9. Keyboard Navigation — respects sequenceMode ────────────────
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      const isRtl = sequenceMode === 'rtl';

      if (e.key === 'ArrowLeft') {
        isRtl ? handleNextPage() : handlePrevPage();
      } else if (e.key === 'ArrowRight') {
        isRtl ? handlePrevPage() : handleNextPage();
      } else if (e.key === 'Escape') {
        if (jumpModalOpen) {
          setJumpModalOpen(false);
        } else {
          navigate(getDoujinPath('/'));
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNextPage, handlePrevPage, sequenceMode, navigate, jumpModalOpen]);

  // ── Click zone handlers (respect sequenceMode) ────────────────────
  const handleLeftZoneClick = useCallback(() => {
    sequenceMode === 'rtl' ? handleNextPage() : handlePrevPage();
  }, [sequenceMode, handleNextPage, handlePrevPage]);

  const handleRightZoneClick = useCallback(() => {
    sequenceMode === 'rtl' ? handlePrevPage() : handleNextPage();
  }, [sequenceMode, handleNextPage, handlePrevPage]);

  // ── Loading state ─────────────────────────────────────────────────
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

  // ── Dropdown options ──────────────────────────────────────────────
  const viewModeOptions = [
    { value: 'manga', label: 'Manga' },
    { value: 'manhwa', label: 'Manhwa' },
  ];

  const sequenceModeOptions = [
    { value: 'rtl', label: 'Right to Left' },
    { value: 'ltr', label: 'Left to Right' },
  ];

  return (
    <div className="relative h-screen w-full overflow-hidden bg-black text-white">
      {/* ── Jump-to-Page Modal ── */}
      <JumpToPageModal
        isOpen={jumpModalOpen}
        onClose={() => setJumpModalOpen(false)}
        numPages={numPages}
        onJump={handleJumpToPage}
      />

      {/* ── Floating Bottom Pill (Safari-style) ── */}
      <div className="fixed left-1/2 -translate-x-1/2 z-50 glass-subtle px-3 py-2 rounded-full flex gap-2 items-center shadow-2xl transition-opacity duration-300 hover:opacity-100 opacity-60 md:opacity-90"
           style={{
             bottom: window.innerWidth < 768
               ? 'calc(12px + env(safe-area-inset-bottom, 0px))'
               : '32px',
             backdropFilter: 'blur(20px)',
             WebkitBackdropFilter: 'blur(20px)',
             fontSize: '12px',
           }}
      >
        {/* Back button */}
        <button
          onClick={() => navigate(getDoujinPath('/'))}
          className="text-white/80 hover:text-[var(--accent-blue)] transition-colors cursor-pointer"
          title="Back to Gallery"
        >
          <i className="bi bi-arrow-left text-xs"></i>
        </button>

        {/* Divider */}
        <div className="w-px h-4 bg-white/15"></div>

        {/* View Mode Dropdown */}
        <PillDropdown
          label="Viewing Mode"
          value={viewMode}
          options={viewModeOptions}
          onChange={setViewMode}
          isOpen={viewDropOpen}
          onToggle={() => { setViewDropOpen(v => !v); setSeqDropOpen(false); }}
          dropdownRef={viewDropRef}
        />

        {/* Sequence Mode Dropdown (only visible in manga mode) */}
        {viewMode === 'manga' && (
          <PillDropdown
            label="Reading Direction"
            value={sequenceMode}
            options={sequenceModeOptions}
            onChange={setSequenceMode}
            isOpen={seqDropOpen}
            onToggle={() => { setSeqDropOpen(v => !v); setViewDropOpen(false); }}
            dropdownRef={seqDropRef}
          />
        )}

        {/* Divider */}
        <div className="w-px h-4 bg-white/15"></div>

        {/* Page nav */}
        <div className="flex items-center gap-1.5 font-mono text-white/70">
          <button onClick={handlePrevPage} disabled={currentPage <= 1} className="disabled:opacity-30 hover:text-white transition-colors cursor-pointer">
            <i className="bi bi-chevron-left text-[10px]"></i>
          </button>
          <span className="tabular-nums text-[11px]">{visiblePage}<span className="text-white/30 mx-0.5">/</span>{numPages || '…'}</span>
          <button onClick={handleNextPage} disabled={numPages && currentPage >= numPages} className="disabled:opacity-30 hover:text-white transition-colors cursor-pointer">
            <i className="bi bi-chevron-right text-[10px]"></i>
          </button>
        </div>

        {/* Divider */}
        <div className="w-px h-4 bg-white/15"></div>

        {/* Search / Jump to page button */}
        <button
          onClick={() => setJumpModalOpen(true)}
          className="text-white/60 hover:text-white transition-colors cursor-pointer"
          title="Jump to page"
        >
          <i className="bi bi-search text-[10px]"></i>
        </button>
      </div>

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
          <div className="absolute top-0 bottom-0 left-0 w-1/4 z-40 cursor-pointer" onClick={handleLeftZoneClick} title={sequenceMode === 'rtl' ? 'Next Page' : 'Previous Page'}></div>
          <div className="absolute top-0 bottom-0 right-0 w-1/4 z-40 cursor-pointer" onClick={handleRightZoneClick} title={sequenceMode === 'rtl' ? 'Previous Page' : 'Next Page'}></div>
        </>
      )}
    </div>
  );
};

export default MangaReader;
