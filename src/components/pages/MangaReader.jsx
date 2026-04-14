import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
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
      <div className="google-dots">
        <span></span><span></span><span></span><span></span>
      </div>
    </div>
  );
}

export default function MangaReader() {
  const { fileId, pageNum } = useParams();
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
      if (blobCache.has(fileId)) {
        setPdfBlobUrl(blobCache.get(fileId));
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setDownloadProgress(0);

        const res = await fetch(`/api/fetch-manga?fileId=${fileId}`);
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
            blobCache.set(fileId, url);
            setPdfBlobUrl(url);
          }
        } else {
          // Fallback: no content-length header
          const blob = await res.blob();
          if (active) {
            const url = URL.createObjectURL(blob);
            blobCache.set(fileId, url);
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
  }, [fileId]);

  // ── 2. Document loaded → set page count ───────────────────────────
  const onDocumentLoadSuccess = useCallback(({ numPages: n }) => {
    setNumPages(n);
  }, []);

  // ── 3. Determine which pages to actually render (virtualization) ──
  const renderedPages = useMemo(() => {
    if (!numPages) return new Set();
    const center = visiblePage - 1; // 0-indexed
    const pages = new Set();
    for (let i = center - BUFFER_PAGES; i <= center + BUFFER_PAGES; i++) {
      if (i >= 0 && i < numPages) pages.add(i);
    }
    return pages;
  }, [numPages, visiblePage]);

  // ── 4. Scroll to the requested page after document load ───────────
  useEffect(() => {
    if (!numPages) return;
    const idx = currentPage - 1;
    const el = pageRefs.current[idx];
    if (el) {
      requestAnimationFrame(() => {
        el.scrollIntoView({ behavior: 'auto', block: 'start', inline: 'start' });
      });
    }
  }, [numPages, currentPage, viewMode]);

  // ── 5. IntersectionObserver to track visible page ─────────────────
  useEffect(() => {
    if (!numPages || !containerRef.current) return;

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
                window.history.replaceState(null, '', `/m/${fileId}/${pageNumber}`);
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
  }, [numPages, fileId, pageNum, viewMode]);

  // ── 6. Compute page dimensions once ───────────────────────────────
  const pageDimensions = useMemo(() => {
    if (viewMode === 'manhwa') {
      return { width: Math.min(window.innerWidth - 32, 800), height: undefined };
    }
    return { width: undefined, height: window.innerHeight };
  }, [viewMode]);

  // ── 7. Navigation handlers ────────────────────────────────────────
  const handleNextPage = useCallback(() => {
    if (numPages && currentPage < numPages) {
      navigate(`/m/${fileId}/${currentPage + 1}`);
    }
  }, [numPages, currentPage, fileId, navigate]);

  const handlePrevPage = useCallback(() => {
    if (currentPage > 1) {
      navigate(`/m/${fileId}/${currentPage - 1}`);
    }
  }, [currentPage, fileId, navigate]);

  // ── Loading state with progress bar ───────────────────────────────
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-black">
        <div className="glass-card p-8 flex flex-col items-center gap-4 min-w-[280px]">
          <div className="google-dots">
            <span></span><span></span><span></span><span></span>
          </div>
          <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
            Downloading PDF…
          </p>
          {downloadProgress > 0 && (
            <div className="w-full bg-black/20 rounded-full h-2 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${downloadProgress}%`,
                  background: 'var(--accent-blue)',
                }}
              />
            </div>
          )}
          {downloadProgress > 0 && (
            <span className="text-xs font-mono" style={{ color: 'var(--text-tertiary)' }}>
              {downloadProgress}%
            </span>
          )}
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
      {/* ── Floating Controls (glassmorphism) ── */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 glass-subtle px-6 py-3 rounded-full flex gap-4 items-center animate-slide-up shadow-xl transition-opacity duration-300 hover:opacity-100 opacity-30 md:opacity-100"
           style={{ backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}
      >
        <button
          onClick={() => navigate('/m')}
          className="text-white hover:text-[var(--accent-blue)] transition-colors mr-2"
          title="Back to Gallery"
        >
          <i className="bi bi-arrow-left"></i>
        </button>

        {/* View mode toggle */}
        <div className="flex bg-black/40 rounded-lg p-1 mr-4">
          <button
            onClick={() => setViewMode('manga')}
            className={`px-3 py-1 text-sm rounded-md transition-all ${viewMode === 'manga' ? 'bg-white text-black font-semibold' : 'text-gray-300 hover:text-white'}`}
          >
            Manga
          </button>
          <button
            onClick={() => setViewMode('manhwa')}
            className={`px-3 py-1 text-sm rounded-md transition-all ${viewMode === 'manhwa' ? 'bg-white text-black font-semibold' : 'text-gray-300 hover:text-white'}`}
          >
            Manhwa
          </button>
        </div>

        {/* Page nav */}
        <div className="flex items-center gap-3 font-mono text-sm">
          <button onClick={handlePrevPage} disabled={currentPage <= 1} className="disabled:opacity-30 hover:text-[var(--accent-blue)] transition-colors">
            <i className="bi bi-chevron-left"></i>
          </button>
          <span>{visiblePage} / {numPages || '…'}</span>
          <button onClick={handleNextPage} disabled={numPages && currentPage >= numPages} className="disabled:opacity-30 hover:text-[var(--accent-blue)] transition-colors">
            <i className="bi bi-chevron-right"></i>
          </button>
        </div>
      </div>

      {/* ── Reader Container ── */}
      <div
        ref={containerRef}
        className={
          viewMode === 'manga'
            ? 'flex flex-row-reverse overflow-x-auto h-screen w-full custom-scrollbar'
            : 'flex flex-col overflow-y-auto h-screen w-full custom-scrollbar items-center'
        }
        style={{ scrollSnapType: viewMode === 'manga' ? 'x mandatory' : 'none' }}
      >
        <Document
          file={pdfBlobUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={
            <div className="flex items-center justify-center h-screen w-full">
              <div className="google-dots"><span></span><span></span><span></span><span></span></div>
            </div>
          }
          className={
            viewMode === 'manga'
              ? 'flex flex-row-reverse h-full'
              : 'flex flex-col items-center w-full mt-20 mb-10'
          }
        >
          {numPages && Array.from({ length: numPages }, (_, index) => (
            <div
              key={`page_${index + 1}`}
              ref={(el) => { pageRefs.current[index] = el; }}
              data-page-index={index}
              className={
                viewMode === 'manga'
                  ? 'shrink-0 h-full flex justify-center items-center min-w-full'
                  : 'shrink-0 w-full max-w-3xl flex justify-center mb-1'
              }
              style={{ scrollSnapAlign: viewMode === 'manga' ? 'start' : undefined }}
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
                  width={pageDimensions.width || '100%'}
                />
              )}
            </div>
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
