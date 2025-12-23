'use client';

import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import Link from 'next/link';
import { ListOrdered, AlertTriangle, Send, Calendar, Save, Loader2 } from 'lucide-react';
import Movie, { MovieData, Rating } from '@/components/prenomination/movie';
import { ORDERING_PAGE_LABEL } from '@/lib/constants';

interface MovieSelection {
  id: number;
  movieId: number;
  rating: string;
  ranking: number | null;
}

interface SelectionState {
  rating: Rating;
  ranking: number | null;
}

export default function PrenominationPage() {
  const [movies, setMovies] = useState<MovieData[]>([]);
  
  // Server state (what's saved in DB)
  const [savedSelections, setSavedSelections] = useState<Map<number, SelectionState>>(new Map());
  
  // Local state (current UI state)
  const [localSelections, setLocalSelections] = useState<Map<number, SelectionState>>(new Map());
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hideRejected, setHideRejected] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('hideRejectedMovies') === 'true';
    }
    return false;
  });
  const modalRef = useRef<HTMLDialogElement>(null);

  // Calculate which movies have unsaved changes
  const unsavedMovieIds = useMemo(() => {
    const unsaved = new Set<number>();
    
    // Check for changes in local selections
    localSelections.forEach((local, movieId) => {
      const saved = savedSelections.get(movieId);
      if (!saved || saved.rating !== local.rating || saved.ranking !== local.ranking) {
        unsaved.add(movieId);
      }
    });
    
    // Check for deletions (was saved, now removed from local)
    savedSelections.forEach((_, movieId) => {
      if (!localSelections.has(movieId)) {
        unsaved.add(movieId);
      }
    });
    
    return unsaved;
  }, [localSelections, savedSelections]);

  const hasUnsavedChanges = unsavedMovieIds.size > 0;

  // Save hideRejected to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('hideRejectedMovies', String(hideRejected));
  }, [hideRejected]);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load movies
        const moviesRes = await fetch('/api/movie-prenom');
        if (!moviesRes.ok) throw new Error('Nepodařilo se načíst filmy');
        const moviesData = await moviesRes.json();
        setMovies(moviesData);
        
        // Try to load selections
        try {
          const selectionsRes = await fetch('/api/movie-selection-prenom');
          if (selectionsRes.ok) {
            const selectionsData: MovieSelection[] = await selectionsRes.json();
            
            const selectionsMap = new Map<number, SelectionState>();
            selectionsData.forEach((sel) => {
              selectionsMap.set(sel.movieId, {
                rating: sel.rating as Rating,
                ranking: sel.ranking,
              });
            });
            setSavedSelections(selectionsMap);
            setLocalSelections(new Map(selectionsMap)); // Clone for local state
          }
        } catch {
          console.log('Nenalezeny žádné existující výběry, začínáme znovu');
        }
        
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Nepodařilo se načíst data');
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  const handleRatingChange = useCallback((movieId: number, rating: Rating | null, ranking: number | null) => {
    setLocalSelections(prev => {
      const next = new Map(prev);
      if (rating === null) {
        next.delete(movieId);
      } else {
        next.set(movieId, { rating, ranking });
      }
      return next;
    });
  }, []);

  // Save all changes to server
  const handleSave = async () => {
    if (!hasUnsavedChanges) return;
    
    setSaving(true);
    try {
      // Find all changes
      const toSave: { movieId: number; rating: Rating; ranking: number | null }[] = [];
      const toDelete: number[] = [];
      
      // New or updated selections
      localSelections.forEach((local, movieId) => {
        const saved = savedSelections.get(movieId);
        if (!saved || saved.rating !== local.rating || saved.ranking !== local.ranking) {
          toSave.push({ movieId, rating: local.rating, ranking: local.ranking });
        }
      });
      
      // Deleted selections
      savedSelections.forEach((_, movieId) => {
        if (!localSelections.has(movieId)) {
          toDelete.push(movieId);
        }
      });
      
      // Batch save - send all at once
      const response = await fetch('/api/movie-selection-prenom/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toSave, toDelete }),
      });
      
      if (!response.ok) {
        throw new Error('Nepodařilo se uložit změny');
      }
      
      // Update saved state to match local state
      setSavedSelections(new Map(localSelections));
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nepodařilo se uložit změny');
    } finally {
      setSaving(false);
    }
  };

  // Sort movies by prenom1Order
  const sortedMovies = useMemo(() => {
    return [...movies].sort((a, b) => (a.prenom1Order ?? 0) - (b.prenom1Order ?? 0));
  }, [movies]);

  const filteredMovies = useMemo(() => {
    if (!hideRejected) return sortedMovies;
    return sortedMovies.filter(movie => localSelections.get(movie.id)?.rating !== Rating.NO);
  }, [sortedMovies, localSelections, hideRejected]);

  const rejectedCount = useMemo(() => {
    let count = 0;
    localSelections.forEach(sel => {
      if (sel.rating === Rating.NO) count++;
    });
    return count;
  }, [localSelections]);

  const selectedCount = useMemo(() => {
    let count = 0;
    localSelections.forEach(sel => {
      if (sel.rating === Rating.YES) count++;
    });
    return count;
  }, [localSelections]);

  // Check for duplicate rankings among YES movies
  const duplicateRankings = useMemo(() => {
    const yesMovieRankings: number[] = [];
    localSelections.forEach((sel) => {
      if (sel.rating === Rating.YES && sel.ranking !== null) {
        yesMovieRankings.push(sel.ranking);
      }
    });
    
    const seen = new Set<number>();
    const duplicates = new Set<number>();
    yesMovieRankings.forEach(rank => {
      if (seen.has(rank)) {
        duplicates.add(rank);
      }
      seen.add(rank);
    });
    
    return Array.from(duplicates).sort((a, b) => a - b);
  }, [localSelections]);

  // Warn user about unsaved changes when leaving
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">Prenominační kolo</h1>
        
        <div className="flex items-center gap-4 flex-wrap">
          {/* Link to ordering page */}
          {selectedCount > 0 && (
            <Link
              href="/prenomination/ordering"
              className="btn btn-success btn-sm gap-2"
            >
              <ListOrdered className="w-4 h-4" />
              {ORDERING_PAGE_LABEL} ({selectedCount})
            </Link>
          )}

          {/* Filter toggle */}
          <label className="flex items-center gap-3 cursor-pointer">
            <span className="text-sm text-base-content/70">
              Skrýt zamítnuté {rejectedCount > 0 && `(${rejectedCount})`}
            </span>
            <input
              type="checkbox"
              className="toggle toggle-error"
              checked={hideRejected}
              onChange={(e) => setHideRejected(e.target.checked)}
            />
          </label>
        </div>
      </div>

      {loading && <p>Načítání filmů...</p>}

      {error && (
        <div className="alert alert-error mb-6">
          <span>Chyba: {error}</span>
          <button 
            className="btn btn-sm"
            onClick={() => {
              setError(null);
              window.location.reload();
            }}
          >
            Zkusit znovu
          </button>
        </div>
      )}

      {/* Warning for duplicate rankings */}
      {!loading && !error && duplicateRankings.length > 0 && (
        <div className="alert alert-warning mb-6">
          <AlertTriangle className="w-5 h-5" />
          <div>
            <p className="font-medium">Duplicitní pořadí!</p>
            <p className="text-sm">
              Máte více filmů na pozici: {duplicateRankings.join(', ')}. 
              Klikněte na &quot;{ORDERING_PAGE_LABEL}&quot; nebo pořadí opravte v prenominačním listu.
            </p>
          </div>
        </div>
      )}

      {/* Unsaved changes indicator */}
      {!loading && !error && hasUnsavedChanges && (
        <div className="alert border-2 border-warning bg-transparent mb-6">
          <Save className="w-5 h-5 text-warning" />
          <span>Máte {unsavedMovieIds.size} neuložených změn</span>
          <button 
            className="btn btn-success btn-sm gap-2"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Ukládám...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Uložit změny
              </>
            )}
          </button>
        </div>
      )}

      {!loading && !error && (
        <div className="grid gap-4">
          {filteredMovies.map((movie) => {
            const selection = localSelections.get(movie.id);
            return (
              <Movie 
                key={movie.id} 
                id={movie.id} 
                name={movie.name}
                rating={selection?.rating || null}
                ranking={selection?.ranking || null}
                hasUnsavedChanges={unsavedMovieIds.has(movie.id)}
                onRatingChange={handleRatingChange}
              />
            );
          })}
          {filteredMovies.length === 0 && hideRejected && (
            <p className="text-center text-base-content/60 py-8">
              Všechny filmy jsou zamítnuté. Vypněte filtr pro jejich zobrazení.
            </p>
          )}
        </div>
      )}

      {/* Final submission button */}
      {!loading && !error && (
        <div className="mt-8 flex justify-end gap-4">
          {hasUnsavedChanges && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn btn-success gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Ukládám...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Uložit změny ({unsavedMovieIds.size})
                </>
              )}
            </button>
          )}
          <button
            onClick={() => modalRef.current?.showModal()}
            className="btn btn-primary gap-2"
          >
            <Send className="w-5 h-5" />
            Finální odevzdání
          </button>
        </div>
      )}

      {/* Modal for final submission info */}
      <dialog ref={modalRef} className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Finální odevzdání
          </h3>
          <p className="py-4">
            Finální odevzdání prenominačního kola bude možné nejdříve <strong>3. ledna 2025</strong>.
          </p>
          <p className="text-sm text-base-content/70">
            Do té doby můžete své výběry kdykoliv upravovat.
          </p>
          <div className="modal-action">
            <form method="dialog">
              <button className="btn">Rozumím</button>
            </form>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>zavřít</button>
        </form>
      </dialog>
    </div>
  );
}
