'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import Link from 'next/link';
import { ListOrdered, AlertTriangle, Send, Calendar } from 'lucide-react';
import Movie, { MovieData, Rating } from '@/components/prenomination/movie';
import { ORDERING_PAGE_LABEL } from '@/lib/constants';

interface MovieSelection {
  id: number;
  movieId: number;
  rating: string;
  ranking: number | null;
}

export default function PrenominationPage() {
  const [movies, setMovies] = useState<MovieData[]>([]);
  const [ratings, setRatings] = useState<Map<number, Rating>>(new Map());
  const [rankings, setRankings] = useState<Map<number, number | null>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hideRejected, setHideRejected] = useState(() => {
    // Load from localStorage on initial render (only on client)
    if (typeof window !== 'undefined') {
      return localStorage.getItem('hideRejectedMovies') === 'true';
    }
    return false;
  });
  const modalRef = useRef<HTMLDialogElement>(null);

  // Save hideRejected to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('hideRejectedMovies', String(hideRejected));
  }, [hideRejected]);

  useEffect(() => {
    // Načíst filmy (vždy) a selections (pokud existují)
    const loadData = async () => {
      try {
        // Nejdřív načíst filmy - to je povinné
        const moviesRes = await fetch('/api/movie-prenom');
        if (!moviesRes.ok) throw new Error('Nepodařilo se načíst filmy');
        const moviesData = await moviesRes.json();
        setMovies(moviesData);
        
        // Zkusit načíst selections - pokud selže, prostě pokračuj bez nich
        try {
          const selectionsRes = await fetch('/api/movie-selection-prenom');
          if (selectionsRes.ok) {
            const selectionsData = await selectionsRes.json();
            
            // Převést selections na Map pro rychlý přístup
            const ratingsMap = new Map();
            const rankingsMap = new Map();
            selectionsData.forEach((sel: MovieSelection) => {
              ratingsMap.set(sel.movieId, sel.rating as Rating);
              rankingsMap.set(sel.movieId, sel.ranking);
            });
            setRatings(ratingsMap);
            setRankings(rankingsMap);
          }
          // Pokud selections selžou (401, 404, atd.), jen pokračuj bez nich
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

  const handleRatingChange = (movieId: number, rating: Rating, ranking: number | null) => {
    setRatings(prev => new Map(prev).set(movieId, rating));
    setRankings(prev => new Map(prev).set(movieId, ranking));
  };

  // Sort movies by prenom1Order (API only returns movies with prenom1Order)
  const sortedMovies = useMemo(() => {
    return [...movies].sort((a, b) => (a.prenom1Order ?? 0) - (b.prenom1Order ?? 0));
  }, [movies]);

  const filteredMovies = useMemo(() => {
    if (!hideRejected) return sortedMovies;
    return sortedMovies.filter(movie => ratings.get(movie.id) !== Rating.NO);
  }, [sortedMovies, ratings, hideRejected]);

  const rejectedCount = useMemo(() => {
    return Array.from(ratings.values()).filter(r => r === Rating.NO).length;
  }, [ratings]);

  const selectedCount = useMemo(() => {
    return Array.from(ratings.values()).filter(r => r === Rating.YES).length;
  }, [ratings]);

  // Check for duplicate rankings among YES movies
  const duplicateRankings = useMemo(() => {
    const yesMovieRankings: number[] = [];
    ratings.forEach((rating, movieId) => {
      if (rating === Rating.YES) {
        const rank = rankings.get(movieId);
        if (rank !== null && rank !== undefined) {
          yesMovieRankings.push(rank);
        }
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
  }, [ratings, rankings]);

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Final submission button */}
      <div className="mb-6">
        <button
          onClick={() => modalRef.current?.showModal()}
          className="btn btn-primary w-full gap-2"
        >
          <Send className="w-5 h-5" />
          Finální odevzdání
        </button>
      </div>

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

      {error && <p className="text-red-500">Chyba: {error}</p>}

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

      {!loading && !error && (
        <div className="grid gap-4">
          {filteredMovies.map((movie) => {
            // Use ratings/rankings state which reflects current client-side changes
            const currentRating = ratings.get(movie.id) || null;
            const currentRanking = rankings.get(movie.id) || null;
            return (
              <Movie 
                key={movie.id} 
                id={movie.id} 
                name={movie.name}
                initialRating={currentRating}
                initialRanking={currentRanking}
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

