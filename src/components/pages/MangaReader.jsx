import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import LoadingOverlay from '../ui/LoadingOverlay';

// Initialize PDF.js worker using Vite standard pattern
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

export default function MangaReader() {
  const { fileId, pageNum } = useParams();
  const navigate = useNavigate();

  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 'manga' = RTL horizontal, 'manhwa' = vertical
  const [viewMode, setViewMode] = useState('manga'); 

  const containerRef = useRef(null);
  const pageRefs = useRef([]);

  // 1. Fetch PDF as Blob
  useEffect(() => {
    let active = true;
    const fetchPdf = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/fetch-manga?fileId=${fileId}`);
        if (!res.ok) throw new Error('Failed to load PDF.');
        const blob = await res.blob();
        if (active) {
          const url = URL.createObjectURL(blob);
          setPdfBlobUrl(url);
        }
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchPdf();

    return () => {
      active = false;
      if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileId]);

  // 2. Handle Document Load
  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
  }

  // 3. Scroll to specific page if present in URL on mount/change
  useEffect(() => {
    if (!numPages || !pageNum) return;
    const idx = parseInt(pageNum, 10) - 1;
    if (pageRefs.current[idx]) {
      // Small timeout to allow render
      setTimeout(() => {
        pageRefs.current[idx].scrollIntoView({ behavior: 'auto', block: 'start', inline: 'start' });
      }, 100);
    }
  }, [numPages, pageNum, viewMode]);

  // 4. Track Intersection to Update URL (debounced sync)
  useEffect(() => {
    if (!numPages || !containerRef.current) return;
    
    // We observe children to see which page is currently in view
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
          const visiblePage = entry.target.getAttribute('data-page-index');
          if (visiblePage) {
            const pageNumber = parseInt(visiblePage, 10) + 1;
            // Only replace state to avoid breaking back history
            if (pageNumber.toString() !== pageNum) {
              window.history.replaceState(null, '', `/m/${fileId}/${pageNumber}`);
            }
          }
        }
      });
    }, {
      root: containerRef.current,
      threshold: 0.51, // Trigger when more than 50% visible
    });

    pageRefs.current.forEach(el => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [numPages, fileId, pageNum, viewMode]);

  // 5. Build styles based on view mode
  const getContainerClassName = () => {
    if (viewMode === 'manga') {
      return "flex flex-row-reverse overflow-x-auto scroll-snap-type-x-mandatory h-screen w-full custom-scrollbar bg-[var(--surface-primary)]";
    }
    // Manhwa
    return "flex flex-col overflow-y-auto h-screen w-full custom-scrollbar bg-[var(--surface-primary)] items-center";
  };

  const getPageClassName = () => {
    if (viewMode === 'manga') {
      return "scroll-snap-align-start shrink-0 h-full flex justify-center items-center min-w-full";
    }
    // Manhwa
    return "shrink-0 w-full max-w-3xl flex justify-center mb-4";
  };

  const handleNextPage = () => {
    const current = parseInt(pageNum || '1', 10);
    if (numPages && current < numPages) {
       navigate(`/m/${fileId}/${current + 1}`);
    }
  };

  const handlePrevPage = () => {
    const current = parseInt(pageNum || '1', 10);
    if (current > 1) {
       navigate(`/m/${fileId}/${current - 1}`);
    }
  };

  if (loading) return <LoadingOverlay message="Fetching PDF..." />;
  if (error) return (
    <div className="flex h-screen items-center justify-center">
      <div className="glass-card p-8 text-center text-red-500 font-semibold">Error: {error}</div>
    </div>
  );

  return (
    <div className="relative h-screen w-full overflow-hidden bg-black text-white">
      {/* Floating Controls Overlay */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 glass-subtle px-6 py-3 rounded-full flex gap-4 items-center animate-slide-up shadow-xl transition-opacity hover:opacity-100 opacity-20 md:opacity-100">
        <button 
          onClick={() => navigate('/m')}
          className="text-white hover:text-[var(--accent-blue)] transition-colors mr-2"
          title="Back to Gallery"
        >
          <i className="bi bi-arrow-left"></i>
        </button>
        
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

        <div className="flex items-center gap-3 font-mono text-sm">
          <button onClick={handlePrevPage} disabled={parseInt(pageNum || '1', 10) <= 1} className="disabled:opacity-30 hover:text-[var(--accent-blue)]">
            <i className="bi bi-chevron-left"></i>
          </button>
          <span>
            {pageNum || 1} / {numPages || '?'}
          </span>
          <button onClick={handleNextPage} disabled={numPages && parseInt(pageNum || '1', 10) >= numPages} className="disabled:opacity-30 hover:text-[var(--accent-blue)]">
            <i className="bi bi-chevron-right"></i>
          </button>
        </div>
      </div>

      {/* Reader Container */}
      <div 
        ref={containerRef} 
        className={getContainerClassName()} 
        style={{ scrollSnapType: viewMode === 'manga' ? 'x mandatory' : 'none' }}
      >
        <Document
          file={pdfBlobUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={<div className="flex items-center gap-2 m-auto"><span className="google-dots"><span></span><span></span><span></span><span></span></span></div>}
          className={viewMode === 'manga' ? 'flex flex-row-reverse h-full' : 'flex flex-col items-center w-full mt-24 mb-10'}
        >
          {numPages && Array.from(new Array(numPages), (el, index) => (
            <div 
              key={`page_${index + 1}`} 
              ref={(el) => pageRefs.current[index] = el}
              data-page-index={index}
              className={getPageClassName()}
              style={{ scrollSnapAlign: 'start' }}
            >
              <Page
                pageNumber={index + 1}
                width={viewMode === 'manhwa' ? Math.min(window.innerWidth - 32, 800) : undefined}
                height={viewMode === 'manga' ? window.innerHeight : undefined}
                renderAnnotationLayer={false}
                renderTextLayer={false}
                className="shadow-2xl"
              />
            </div>
          ))}
        </Document>
      </div>

      {/* Click zones for Manga mode */}
      {viewMode === 'manga' && (
        <>
          <div className="absolute top-0 bottom-0 left-0 w-1/4 z-40 cursor-pointer" onClick={handleNextPage} title="Next Page"></div>
          <div className="absolute top-0 bottom-0 right-0 w-1/4 z-40 cursor-pointer" onClick={handlePrevPage} title="Previous Page"></div>
        </>
      )}
    </div>
  );
}
