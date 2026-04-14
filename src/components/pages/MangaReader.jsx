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
const BUFFER_PAGES = 2;

// Simple in-memory cache so navigating back doesn't re-download
const blobCache = new Map();

function PageSkeleton({ height, width }) {
  return (
    <div
      className="flex items-center justify-center animate-pulse"
      style={{ height: height || '100vh', width: width || '100%', background: 'rgba(255,255,255,0.04)' }}
    >
      <AppleSpinner white />
    </div>
  );
}

export default function MangaReader() {
  const { slug, pageNum } = useParams();
  const navigate = useNavigate();
  const currentPage = parseInt(pageNum || '1', 10);

  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('manga');
  const [visiblePage, setVisiblePage] = useState(currentPage);

  const containerRef = useRef(null);
  const pageRefs = useRef([]);
  const observerRef = useRef(null);
  const scrollTimeoutRef = useRef(null);

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
  const renderedPages = useMemo(() => {
    if (!numPages) return new Set();
    const center = visiblePage - 1; // 0-indexed
    const pages = new Set();
    for (let i = center - BUFFER_PAGES; i <= center + BUFFER_PAGES; i++) {
      if (i >= 0 && i < numPages) pages.add(i);
    }
    return pages;
  }, [numPages, visiblePage]);

  // ── 5. Scroll to the requested page after document load (Manhwa) ──
  useEffect(() => {
    if (!numPages || viewMode === 'manga') return;
    const idx = currentPage - 1;
    const el = pageRefs.current[idx];
    if (el) {
      requestAnimationFrame(() => {
        el.scrollIntoView({ behavior: 'auto', block: 'start', inline: 'start' });
      });
    }
  }, [numPages, currentPage, viewMode]);

  // ── 6. IntersectionObserver to track visible page (Manhwa) ────────
  useEffect(() => {
    if (!numPages || !containerRef.current || viewMode === 'manga') return;

    if (observerRef.current) observerRef.current.disconnect();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio > 0.3) {
            const idx = parseInt(entry.target.getAttribute('data-page-index'), 10);
            const pageNumber = idx + 1;

            setVisiblePage(pageNumber);

            // Debounced URL update
            clearTimeout(scrollTimeoutRef.current);
            scrollTimeoutRef.current = setTimeout(() => {
              if (pageNumber.toString() !== (pageNum || '1')) {
                window.history.replaceState(null, '', `/doujin/${encodeURIComponent(slug)}/${pageNumber}`);
              }
            }, 150);
          }
        }
      },
      {
        root: containerRef.current,
        threshold: [0.3, 0.6],
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
  }, [numPages, slug, pageNum, viewMode]);

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
      navigate(`/doujin/${encodeURIComponent(slug)}/${currentPage + 1}`, { replace: true });
    }
  }, [numPages, currentPage, slug, navigate, viewMode]);

  const handlePrevPage = useCallback(() => {
    if (currentPage > 1) {
      if (viewMode === 'manga') setVisiblePage(currentPage - 1);
      navigate(`/doujin/${encodeURIComponent(slug)}/${currentPage - 1}`, { replace: true });
    }
  }, [currentPage, slug, navigate, viewMode]);

  // Ensure visiblePage stays in sync with URL if user changes via URL directly in Manga mode
  useEffect(() => {
    if (viewMode === 'manga') setVisiblePage(currentPage);
  }, [currentPage, viewMode]);

  // ── 9. Keyboard Navigation ─────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if typing in an input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.key === 'ArrowLeft') {
        // Manga reads RTL (Left = Next), Manhwa reads standard (Left = Prev)
        viewMode === 'manga' ? handleNextPage() : handlePrevPage();
      } else if (e.key === 'ArrowRight') {
        // Manga reads RTL (Right = Prev), Manhwa reads standard (Right = Next)
        viewMode === 'manga' ? handlePrevPage() : handleNextPage();
      } else if (e.key === 'Escape') {
        navigate('/doujin');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNextPage, handlePrevPage, viewMode, navigate]);

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
          onClick={() => navigate('/doujin')}
          className="text-white/80 hover:text-[var(--accent-blue)] transition-colors"
          title="Back to Gallery"
        >
          <i className="bi bi-arrow-left text-xs"></i>
        </button>

        {/* Compact view mode toggle */}
        <div className="flex bg-white/10 rounded-md p-0.5">
          <button
            onClick={() => setViewMode('manga')}
            className={`px-2 py-0.5 text-[11px] rounded transition-all ${viewMode === 'manga' ? 'bg-white text-black font-semibold' : 'text-white/60 hover:text-white'}`}
          >
            Manga
          </button>
          <button
            onClick={() => setViewMode('manhwa')}
            className={`px-2 py-0.5 text-[11px] rounded transition-all ${viewMode === 'manhwa' ? 'bg-white text-black font-semibold' : 'text-white/60 hover:text-white'}`}
          >
            Manhwa
          </button>
        </div>

        {/* Compact page nav */}
        <div className="flex items-center gap-2 font-mono text-white/70">
          <button onClick={handlePrevPage} disabled={currentPage <= 1} className="disabled:opacity-30 hover:text-white transition-colors">
            <i className="bi bi-chevron-left text-[10px]"></i>
          </button>
          <span className="tabular-nums">{visiblePage}<span className="text-white/30 mx-0.5">/</span>{numPages || '…'}</span>
          <button onClick={handleNextPage} disabled={numPages && currentPage >= numPages} className="disabled:opacity-30 hover:text-white transition-colors">
            <i className="bi bi-chevron-right text-[10px]"></i>
          </button>
        </div>
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
              : 'flex flex-col items-center w-full mt-20 mb-10 gap-2'
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
              className={
                viewMode === 'manga'
                  ? 'shrink-0 flex justify-center items-center min-w-full'
                  : 'shrink-0 w-full max-w-3xl flex justify-center px-2 md:px-0'
              }
              style={{
                scrollSnapAlign: viewMode === 'manga' ? 'start' : undefined,
                minHeight: viewMode === 'manga' ? '100%' : undefined,
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
                  height={pageDimensions.height || window.innerHeight}
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
          <div className="absolute top-0 bottom-0 left-0 w-1/4 z-40 cursor-pointer" onClick={handleNextPage} title="Next Page"></div>
          <div className="absolute top-0 bottom-0 right-0 w-1/4 z-40 cursor-pointer" onClick={handlePrevPage} title="Previous Page"></div>
        </>
      )}
    </div>
  );
}
