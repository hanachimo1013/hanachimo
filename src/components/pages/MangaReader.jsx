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

function getDoujinPath(path) {
  return `/doujin${path}`;
}

function PageSkeleton({ height, width }) {
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
  const [pillTheme, setPillTheme] = useState('dark'); // 'dark' = dark pill (for light bg), 'light' = light pill (for dark bg)

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
      // Ignore if typing in an input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.key === 'ArrowLeft') {
        // Manga reads RTL (Left = Next), Manhwa reads standard (Left = Prev)
        viewMode === 'manga' ? handleNextPage() : handlePrevPage();
      } else if (e.key === 'ArrowRight') {
        // Manga reads RTL (Right = Prev), Manhwa reads standard (Right = Next)
        viewMode === 'manga' ? handlePrevPage() : handleNextPage();
      } else if (e.key === 'Escape') {
        navigate(getDoujinPath('/'));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNextPage, handlePrevPage, viewMode, navigate]);

  // ── 10. Adaptive pill brightness detection ─────────────────────────
  useEffect(() => {
    if (!numPages || loading) return;

    // Small delay to let react-pdf render the canvas
    const timer = setTimeout(() => {
      try {
        // Find the currently visible page canvas
        const container = containerRef.current;
        if (!container) return;

        let canvas;
        if (viewMode === 'manga') {
          canvas = container.querySelector('canvas');
        } else {
          // Manhwa mode: find the canvas closest to the visible page
          const pageDiv = pageRefs.current[visiblePage - 1];
          if (pageDiv) canvas = pageDiv.querySelector('canvas');
        }

        if (!canvas || canvas.width === 0 || canvas.height === 0) return;

        // Sample pixels from the bottom ~15% center strip (where the pill overlaps)
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        const sampleY = Math.floor(canvas.height * 0.82);
        const sampleH = Math.floor(canvas.height * 0.15);
        const sampleX = Math.floor(canvas.width * 0.25);
        const sampleW = Math.floor(canvas.width * 0.5);

        const imageData = ctx.getImageData(sampleX, sampleY, sampleW, sampleH);
        const data = imageData.data;

        // Compute average brightness (perceived luminance)
        let totalBrightness = 0;
        const pixelCount = data.length / 4;
        // Sample every 8th pixel for performance
        const step = 8;
        let sampled = 0;
        for (let i = 0; i < data.length; i += 4 * step) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          // Perceived brightness formula
          totalBrightness += (0.299 * r + 0.587 * g + 0.114 * b);
          sampled++;
        }

        const avgBrightness = totalBrightness / sampled;
        // If background is dark (brightness < 128), use light pill; otherwise dark pill
        setPillTheme(avgBrightness < 128 ? 'light' : 'dark');
      } catch {
        // Silently ignore — cross-origin or missing canvas
        setPillTheme('light');
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [visiblePage, numPages, viewMode, loading]);

  // Pill color tokens derived from pillTheme
  const pillColors = useMemo(() => {
    if (pillTheme === 'light') {
      // Light / frosted pill for dark backgrounds
      return {
        bg: 'rgba(255, 255, 255, 0.12)',
        border: 'rgba(255, 255, 255, 0.18)',
        text: 'rgba(255, 255, 255, 0.85)',
        textMuted: 'rgba(255, 255, 255, 0.55)',
        toggleBg: 'rgba(255, 255, 255, 0.1)',
        toggleActive: 'rgba(255, 255, 255, 0.95)',
        toggleActiveText: '#000',
        toggleInactive: 'rgba(255, 255, 255, 0.5)',
        separator: 'rgba(255, 255, 255, 0.12)',
      };
    }
    // Dark pill for light backgrounds
    return {
      bg: 'rgba(0, 0, 0, 0.45)',
      border: 'rgba(0, 0, 0, 0.12)',
      text: 'rgba(0, 0, 0, 0.85)',
      textMuted: 'rgba(0, 0, 0, 0.5)',
      toggleBg: 'rgba(0, 0, 0, 0.08)',
      toggleActive: 'rgba(0, 0, 0, 0.85)',
      toggleActiveText: '#fff',
      toggleInactive: 'rgba(0, 0, 0, 0.45)',
      separator: 'rgba(0, 0, 0, 0.1)',
    };
  }, [pillTheme]);

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
      {/* ── Floating Bottom Pill (adaptive to background brightness) ── */}
      <div
        className="fixed left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full flex gap-3 items-center shadow-2xl hover:opacity-100 opacity-70 md:opacity-90"
        style={{
          bottom: window.innerWidth < 768
            ? 'calc(12px + env(safe-area-inset-bottom, 0px))'
            : '32px',
          background: pillColors.bg,
          border: `1px solid ${pillColors.border}`,
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          fontSize: '12px',
          transition: 'background 500ms ease, border-color 500ms ease, box-shadow 500ms ease',
          boxShadow: pillTheme === 'light'
            ? '0 4px 24px rgba(0,0,0,0.35)'
            : '0 4px 24px rgba(0,0,0,0.15)',
        }}
      >
        <button
          onClick={() => navigate(getDoujinPath('/'))}
          className="transition-colors duration-300"
          style={{ color: pillColors.text }}
          title="Back to Gallery"
        >
          <i className="bi bi-arrow-left text-xs"></i>
        </button>

        {/* Compact view mode toggle */}
        <div className="flex rounded-md p-0.5" style={{ background: pillColors.toggleBg, transition: 'background 500ms ease' }}>
          <button
            onClick={() => setViewMode('manga')}
            className="px-2 py-0.5 text-[11px] rounded transition-all duration-300"
            style={{
              background: viewMode === 'manga' ? pillColors.toggleActive : 'transparent',
              color: viewMode === 'manga' ? pillColors.toggleActiveText : pillColors.toggleInactive,
              fontWeight: viewMode === 'manga' ? 600 : 400,
            }}
          >
            Manga
          </button>
          <button
            onClick={() => setViewMode('manhwa')}
            className="px-2 py-0.5 text-[11px] rounded transition-all duration-300"
            style={{
              background: viewMode === 'manhwa' ? pillColors.toggleActive : 'transparent',
              color: viewMode === 'manhwa' ? pillColors.toggleActiveText : pillColors.toggleInactive,
              fontWeight: viewMode === 'manhwa' ? 600 : 400,
            }}
          >
            Manhwa
          </button>
        </div>

        {/* Compact page nav */}
        <div className="flex items-center gap-2 font-mono transition-colors duration-300" style={{ color: pillColors.textMuted }}>
          <button onClick={handlePrevPage} disabled={currentPage <= 1} className="disabled:opacity-30 transition-colors duration-300" style={{ color: pillColors.text }}>
            <i className="bi bi-chevron-left text-[10px]"></i>
          </button>
          <span className="tabular-nums" style={{ color: pillColors.text, transition: 'color 500ms ease' }}>
            {visiblePage}<span style={{ color: pillColors.textMuted, margin: '0 2px' }}>/</span>{numPages || '…'}
          </span>
          <button onClick={handleNextPage} disabled={numPages && currentPage >= numPages} className="disabled:opacity-30 transition-colors duration-300" style={{ color: pillColors.text }}>
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
          <div className="absolute top-0 bottom-0 left-0 w-1/4 z-40 cursor-pointer" onClick={handleNextPage} title="Next Page"></div>
          <div className="absolute top-0 bottom-0 right-0 w-1/4 z-40 cursor-pointer" onClick={handlePrevPage} title="Previous Page"></div>
        </>
      )}
    </div>
  );
}
