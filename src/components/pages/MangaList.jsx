import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LoadingOverlay from '../ui/LoadingOverlay';

export default function MangaList() {
  const [mangaList, setMangaList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('/api/fetch-manga')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch manga list');
        return res.json();
      })
      .then((data) => {
        setMangaList(data || []);
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) return <LoadingOverlay message="Loading Manga Gallery..." />;

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="glass-card p-8 text-center text-red-500 font-semibold">
          Error: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 md:p-10">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-4 md:mb-0">Manga Library</h1>
        </div>

        {mangaList.length === 0 ? (
          <div className="glass-card p-12 text-center text-var(--text-secondary)">
            No PDF files found in the specified Google Drive folder.
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {mangaList.map((manga) => (
              <div
                key={manga.id}
                className="glass-card flex flex-col overflow-hidden cursor-pointer hover:shadow-[var(--glass-shadow)] transition-all duration-300 animate-slide-up group"
                onClick={() => navigate(`/m/${manga.id}/1`)}
              >
                <div className="aspect-[3/4] w-full bg-gray-100 dark:bg-gray-800 relative overflow-hidden">
                  {manga.thumbnailLink ? (
                    <img
                      src={manga.thumbnailLink}
                      alt={manga.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[var(--text-tertiary)]">
                      <i className="bi bi-file-pdf display-1 text-5xl"></i>
                    </div>
                  )}
                  {/* Subtle overlay */}
                  <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                </div>
                <div className="p-4 flex-1 flex items-center justify-center text-center">
                  <h3 className="font-semibold text-sm line-clamp-2" title={manga.name}>
                    {manga.name.replace('.pdf', '')}
                  </h3>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
