'use client';

import { useEffect, useState, useRef } from 'react';
import { Send, Calendar, ChevronDown, ChevronUp, Check } from 'lucide-react';
import MovieCheckbox from '@/components/prenom2/movie-checkbox';

interface Movie {
  id: number;
  name: string;
}

interface Category {
  id: number;
  name: string;
  slug: string;
  order: number;
  movies: Movie[];
}

interface Selection {
  categoryId: number;
  movieId: number;
}

export default function Prenomination2Page() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selections, setSelections] = useState<Map<string, boolean>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());
  const [savingStates, setSavingStates] = useState<Map<string, boolean>>(new Map());
  const modalRef = useRef<HTMLDialogElement>(null);

  // Helper to create selection key
  const getSelectionKey = (categoryId: number, movieId: number) => 
    `${categoryId}-${movieId}`;

  // Count selections per category
  const getSelectionCount = (categoryId: number) => {
    let count = 0;
    selections.forEach((selected, key) => {
      if (selected && key.startsWith(`${categoryId}-`)) {
        count++;
      }
    });
    return count;
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load categories with movies
        const categoriesRes = await fetch('/api/prenom2/categories');
        if (!categoriesRes.ok) throw new Error('Nepodařilo se načíst kategorie');
        const categoriesData = await categoriesRes.json();
        setCategories(categoriesData);

        // Expand first category by default
        if (categoriesData.length > 0) {
          setExpandedCategories(new Set([categoriesData[0].id]));
        }

        // Try to load user's selections
        try {
          const selectionsRes = await fetch('/api/prenom2/selections');
          if (selectionsRes.ok) {
            const selectionsData: Selection[] = await selectionsRes.json();
            const selectionsMap = new Map<string, boolean>();
            selectionsData.forEach((sel) => {
              selectionsMap.set(getSelectionKey(sel.categoryId, sel.movieId), true);
            });
            setSelections(selectionsMap);
          }
        } catch {
          console.log('Nenalezeny žádné existující výběry');
        }

        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Nepodařilo se načíst data');
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const toggleCategory = (categoryId: number) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  const handleToggleSelection = async (categoryId: number, movieId: number, selected: boolean) => {
    const key = getSelectionKey(categoryId, movieId);
    
    // Optimistic update
    setSelections((prev) => new Map(prev).set(key, selected));
    setSavingStates((prev) => new Map(prev).set(key, true));

    try {
      const res = await fetch('/api/prenom2/selections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoryId, movieId, selected }),
      });

      if (!res.ok) {
        const data = await res.json();
        // Revert on error
        setSelections((prev) => new Map(prev).set(key, !selected));
        if (data.error === 'Maximum 5 selections per category') {
          alert('Můžete vybrat maximálně 5 filmů v každé kategorii.');
        }
      }
    } catch {
      // Revert on error
      setSelections((prev) => new Map(prev).set(key, !selected));
    } finally {
      setSavingStates((prev) => {
        const next = new Map(prev);
        next.delete(key);
        return next;
      });
    }
  };

  // Calculate total progress
  const totalCategories = categories.length;
  const completedCategories = categories.filter(
    (cat) => getSelectionCount(cat.id) === 5
  ).length;

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header with progress */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">Prenominační kolo 2.0</h1>
        <div className="badge badge-lg badge-outline gap-2">
          <Check className="w-4 h-4" />
          {completedCategories} / {totalCategories} kategorií dokončeno
        </div>
      </div>

      <p className="text-base-content/70 mb-6">
        V každé kategorii vyberte přesně <strong>5 filmů</strong>, které by podle vás měly postoupit do nominací.
      </p>

      {loading && <p>Načítání kategorií...</p>}
      {error && <p className="text-red-500">Chyba: {error}</p>}

      {!loading && !error && (
        <div className="space-y-4">
          {categories.map((category) => {
            const selectionCount = getSelectionCount(category.id);
            const isExpanded = expandedCategories.has(category.id);
            const isComplete = selectionCount === 5;

            return (
              <div
                key={category.id}
                className={`border rounded-lg overflow-hidden ${
                  isComplete ? 'border-green-500' : 'border-base-300'
                }`}
              >
                {/* Category Header */}
                <button
                  onClick={() => toggleCategory(category.id)}
                  className={`w-full p-4 flex items-center justify-between transition-colors ${
                    isComplete ? 'bg-green-500/10' : 'bg-base-200 hover:bg-base-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-lg">{category.name}</span>
                    <span
                      className={`badge ${
                        isComplete ? 'badge-success' : 'badge-neutral'
                      }`}
                    >
                      {selectionCount} / 5
                    </span>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5" />
                  ) : (
                    <ChevronDown className="w-5 h-5" />
                  )}
                </button>

                {/* Category Content */}
                {isExpanded && (
                  <div className="p-4 grid gap-2 sm:grid-cols-2">
                    {category.movies.map((movie) => {
                      const key = getSelectionKey(category.id, movie.id);
                      const isSelected = selections.get(key) || false;
                      const isSaving = savingStates.get(key) || false;
                      const isDisabled = selectionCount >= 5 && !isSelected;

                      return (
                        <div key={movie.id} className="relative">
                          <MovieCheckbox
                            id={movie.id}
                            name={movie.name}
                            selected={isSelected}
                            disabled={isDisabled}
                            onToggle={(movieId, selected) =>
                              handleToggleSelection(category.id, movieId, selected)
                            }
                          />
                          {isSaving && (
                            <div className="absolute top-2 right-2">
                              <span className="loading loading-spinner loading-xs"></span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Final submission button */}
      {!loading && !error && (
        <div className="mt-8 flex justify-end">
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
            Finální odevzdání prenominačního kola 2.0 bude možné nejdříve <strong>3. ledna 2025</strong>.
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

