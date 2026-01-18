'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableMovieCard } from '@/components/prenomination/sortable-movie-card';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface MovieWithRanking {
  id: number;
  movieId: number;
  rating: string;
  ranking: number | null;
  movie: {
    id: number;
    name: string;
  };
}

interface OrderedMovie {
  id: number;
  name: string;
  ranking: number;
}

export default function OrderingPage() {
  const [movies, setMovies] = useState<OrderedMovie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [finalSubmitted, setFinalSubmitted] = useState(false);
  const hasSavedInitial = useRef(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const saveRankings = useCallback(async (orderedMovies: OrderedMovie[]) => {
    if (finalSubmitted) return;
    setIsSaving(true);
    try {
      // Save each movie's ranking
      await Promise.all(
        orderedMovies.map((movie) =>
          fetch('/api/movie-selection-prenom', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              movieId: movie.id,
              rating: 'YES',
              ranking: movie.ranking,
            }),
          })
        )
      );
    } catch (error) {
      console.error('Chyba při ukládání pořadí:', error);
    } finally {
      setIsSaving(false);
    }
  }, [finalSubmitted]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await fetch('/api/movie-selection-prenom');
        if (!res.ok) {
          if (res.status === 401) {
            setError('Musíte být přihlášeni pro zobrazení této stránky.');
          } else {
            throw new Error('Nepodařilo se načíst výběr');
          }
          setLoading(false);
          return;
        }

        const data: MovieWithRanking[] = await res.json();

        try {
          const statusRes = await fetch('/api/user/final-submissions');
          if (statusRes.ok) {
            const statusData = await statusRes.json();
            setFinalSubmitted(Boolean(statusData.prenom1FinalSubmitted));
          }
        } catch {
          console.log('Nepodařilo se načíst stav finálního odevzdání');
        }
        
        // Filter only YES rated movies and sort by ranking
        const yesMovies = data
          .filter((sel) => sel.rating === 'YES')
          .sort((a, b) => {
            if (a.ranking === null && b.ranking === null) return 0;
            if (a.ranking === null) return 1;
            if (b.ranking === null) return -1;
            return a.ranking - b.ranking;
          })
          .map((sel, index) => ({
            id: sel.movieId,
            name: sel.movie.name,
            ranking: sel.ranking ?? index + 1,
          }));

        // Check for duplicates
        const rankings = yesMovies.map(m => m.ranking);
        const hasDuplicates = rankings.length !== new Set(rankings).size;
        
        // Only re-assign sequential rankings if there are duplicates
        if (hasDuplicates) {
          const orderedMovies = yesMovies.map((movie, index) => ({
            ...movie,
            ranking: index + 1,
          }));
          setMovies(orderedMovies);
          
          // Save the corrected order
          if (orderedMovies.length > 0 && !hasSavedInitial.current) {
            hasSavedInitial.current = true;
            await saveRankings(orderedMovies);
          }
        } else {
          // Keep original rankings
          setMovies(yesMovies);
        }
        
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Nepodařilo se načíst data');
        setLoading(false);
      }
    };

    loadData();
  }, [saveRankings]);

  const handleDragEnd = (event: DragEndEvent) => {
    if (finalSubmitted) return;
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setMovies((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        
        const newItems = arrayMove(items, oldIndex, newIndex).map((item, index) => ({
          ...item,
          ranking: index + 1,
        }));

        // Save the new order
        saveRankings(newItems);
        
        return newItems;
      });
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/prenomination"
          className="btn btn-ghost btn-circle"
          aria-label="Zpět na prenominační list"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Pořadí filmů</h1>
          <p className="text-base-content/60 text-sm">
            Přetáhněte filmy pro změnu pořadí
          </p>
        </div>
        {isSaving && (
          <span className="loading loading-spinner loading-sm text-primary"></span>
        )}
      </div>

      {finalSubmitted && (
        <div className="alert alert-success mb-6">
          <span>Finální odevzdání je hotové. Pořadí je jen pro čtení.</span>
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-12">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      )}

      {error && (
        <div className="alert alert-error">
          <span>{error}</span>
        </div>
      )}

      {!loading && !error && movies.length === 0 && (
        <div className="text-center py-12">
          <p className="text-base-content/60 mb-4">
            Zatím nemáte žádné filmy označené jako &quot;ANO&quot;.
          </p>
          <Link href="/prenomination" className="btn btn-primary">
            Zpět na prenominační list
          </Link>
        </div>
      )}

      {!loading && !error && movies.length > 0 && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={movies.map((m) => m.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3">
              {movies.map((movie, index) => {
                const isOverflow = index >= 10;

                return (
                  <div key={movie.id}>
                    {/* Divider after position 10 */}
                    {index === 10 && (
                      <div className="flex items-center gap-4 py-4 mb-3">
                        <div className="flex-1 h-px bg-yellow-500/50"></div>
                        <span className="text-sm text-yellow-600 font-medium px-3 py-1 bg-yellow-100 rounded-full">
                          Mimo TOP 10
                        </span>
                        <div className="flex-1 h-px bg-yellow-500/50"></div>
                      </div>
                    )}
                    <SortableMovieCard
                      id={movie.id}
                      name={movie.name}
                      rank={movie.ranking}
                      isOverflow={isOverflow}
                      disabled={finalSubmitted}
                    />
                  </div>
                );
              })}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {!loading && !error && movies.length > 0 && (
        <>
          {movies.length > 10 && (
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800 text-center">
                ⚠️ Máte vybraných více než 10 filmů. Filmy označené žlutě se nevejdou do TOP 10.
                <br />
                <span className="text-yellow-600">Přesuňte je nahoru, nebo je přehodnoťte v prenominačním listu.</span>
              </p>
            </div>
          )}
          <div className="mt-4 p-4 bg-base-200 rounded-lg">
            <p className="text-sm text-base-content/70 text-center">
              💡 Pořadí se automaticky ukládá při přetažení
            </p>
          </div>
        </>
      )}
    </div>
  );
}

