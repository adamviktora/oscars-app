'use client';

import { useState, useCallback, useMemo, useRef } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Check,
  Save,
  Loader2,
  AlertTriangle,
} from 'lucide-react';

interface Movie {
  id: number;
  name: string;
}

interface Category {
  id: number;
  name: string;
  slug: string;
  movies: Movie[];
  nominatedMovieIds: number[];
}

interface Props {
  categories: Category[];
}

export function Nominations2Client({ categories }: Props) {
  // Track selections per category: categoryId -> Set of movieIds
  const [selections, setSelections] = useState<Map<number, Set<number>>>(() => {
    const initial = new Map<number, Set<number>>();
    categories.forEach((cat) => {
      initial.set(cat.id, new Set(cat.nominatedMovieIds));
    });
    return initial;
  });

  // Track saved state per category
  const [savedSelections, setSavedSelections] = useState<Map<number, Set<number>>>(() => {
    const initial = new Map<number, Set<number>>();
    categories.forEach((cat) => {
      initial.set(cat.id, new Set(cat.nominatedMovieIds));
    });
    return initial;
  });

  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(
    () => new Set(categories.length > 0 ? [categories[0].id] : [])
  );
  const [savingCategory, setSavingCategory] = useState<number | null>(null);
  const [savingAll, setSavingAll] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [categoryToConfirm, setCategoryToConfirm] = useState<number | null>(null);
  const modalRef = useRef<HTMLDialogElement>(null);
  const categoryModalRef = useRef<HTMLDialogElement>(null);

  const getSelectionCount = useCallback(
    (categoryId: number) => {
      return selections.get(categoryId)?.size ?? 0;
    },
    [selections]
  );

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

  const handleToggleSelection = useCallback(
    (categoryId: number, movieId: number) => {
      setSelections((prev) => {
        const next = new Map(prev);
        const categorySet = new Set(prev.get(categoryId) || []);

        if (categorySet.has(movieId)) {
          categorySet.delete(movieId);
        } else {
          // Max 5 nominations per category
          if (categorySet.size >= 5) {
            return prev;
          }
          categorySet.add(movieId);
        }

        next.set(categoryId, categorySet);
        return next;
      });
      setSuccessMessage(null);
    },
    []
  );

  // Check if category has unsaved changes
  const hasUnsavedChanges = useCallback(
    (categoryId: number) => {
      const current = selections.get(categoryId) || new Set();
      const saved = savedSelections.get(categoryId) || new Set();

      if (current.size !== saved.size) return true;

      for (const id of current) {
        if (!saved.has(id)) return true;
      }
      return false;
    },
    [selections, savedSelections]
  );

  // Count complete categories (exactly 5 selections)
  const completeCategories = useMemo(() => {
    return categories.filter((cat) => getSelectionCount(cat.id) === 5).length;
  }, [categories, getSelectionCount]);

  // Check if any complete category has unsaved changes
  const anyCompleteWithChanges = useMemo(() => {
    return categories.some(
      (cat) => getSelectionCount(cat.id) === 5 && hasUnsavedChanges(cat.id)
    );
  }, [categories, getSelectionCount, hasUnsavedChanges]);

  // Show confirmation modal for category
  const confirmSaveCategory = (categoryId: number) => {
    setCategoryToConfirm(categoryId);
    categoryModalRef.current?.showModal();
  };

  // Save single category
  const saveCategory = async (categoryId: number) => {
    categoryModalRef.current?.close();
    const movieIds = Array.from(selections.get(categoryId) || []);

    setSavingCategory(categoryId);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch('/api/admin/nominations2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoryId, movieIds }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Nepodařilo se uložit');
      }

      // Update saved state
      setSavedSelections((prev) => {
        const next = new Map(prev);
        next.set(categoryId, new Set(movieIds));
        return next;
      });

      setSuccessMessage('Kategorie byla uložena');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nepodařilo se uložit');
    } finally {
      setSavingCategory(null);
    }
  };

  // Save all complete categories (only those with exactly 5 movies)
  const saveAll = async () => {
    setSavingAll(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // Only save categories that have exactly 5 movies selected
      const completeNominations = categories
        .filter((cat) => getSelectionCount(cat.id) === 5)
        .map((cat) => ({
          categoryId: cat.id,
          movieIds: Array.from(selections.get(cat.id) || []),
        }));

      if (completeNominations.length === 0) {
        throw new Error('Žádná kategorie není kompletní (5 filmů)');
      }

      const response = await fetch('/api/admin/nominations2/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nominations: completeNominations }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Nepodařilo se uložit');
      }

      // Update saved state only for complete categories
      setSavedSelections((prev) => {
        const next = new Map(prev);
        completeNominations.forEach((nom) => {
          next.set(nom.categoryId, new Set(nom.movieIds));
        });
        return next;
      });

      setSuccessMessage(`Uloženo ${completeNominations.length} kompletních kategorií`);
      modalRef.current?.close();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nepodařilo se uložit');
    } finally {
      setSavingAll(false);
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Nominace - Kategorie z prenominačního kola 2.0</h1>
          <p className="text-base-content/60 mt-1">
            Vyberte přesně 5 filmů v každé kategorii, které byly nominovány
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="badge badge-lg badge-neutral">
            {completeCategories} / {categories.length} kategorií hotovo
          </div>
          <button
            onClick={() => modalRef.current?.showModal()}
            disabled={savingAll || !anyCompleteWithChanges}
            className="btn btn-primary gap-2"
          >
            <Save className="w-5 h-5" />
            Uložit vše
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-error mb-6">
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="alert alert-success mb-6">
          <Check className="w-5 h-5" />
          <span>{successMessage}</span>
        </div>
      )}

      <div className="space-y-4">
        {categories.map((category) => {
          const selectionCount = getSelectionCount(category.id);
          const isExpanded = expandedCategories.has(category.id);
          const isComplete = selectionCount === 5;
          const isSaving = savingCategory === category.id;
          const hasChanges = hasUnsavedChanges(category.id);

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
                  {hasChanges && (
                    <span className="badge badge-warning badge-sm">
                      neuloženo
                    </span>
                  )}
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5" />
                ) : (
                  <ChevronDown className="w-5 h-5" />
                )}
              </button>

              {/* Category Content */}
              {isExpanded && (
                <div className="p-4">
                  <div className="grid gap-2 sm:grid-cols-2">
                    {category.movies.map((movie) => {
                      const isSelected =
                        selections.get(category.id)?.has(movie.id) ?? false;
                      const isDisabled = !isSelected && selectionCount >= 5;

                      return (
                        <label
                          key={movie.id}
                          className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                            isSelected
                              ? 'border-green-500 bg-green-500/10'
                              : 'border-base-300 hover:border-base-content/30'
                          } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <input
                            type="checkbox"
                            className="checkbox checkbox-success"
                            checked={isSelected}
                            disabled={isDisabled}
                            onChange={() =>
                              handleToggleSelection(category.id, movie.id)
                            }
                          />
                          <span className={isSelected ? 'font-medium' : ''}>
                            {movie.name}
                          </span>
                        </label>
                      );
                    })}
                  </div>

                  {/* Save category button */}
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={() => confirmSaveCategory(category.id)}
                      disabled={isSaving || !isComplete || !hasChanges}
                      className="btn btn-sm btn-primary gap-2"
                    >
                      <Save className="w-4 h-4" />
                      Uložit kategorii
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Confirmation Modal for Save All */}
      <dialog ref={modalRef} className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-warning" />
            Potvrdit uložení nominací
          </h3>
          <p className="py-4">
            Budou uloženy pouze kompletní kategorie (5 filmů):
          </p>

          <div className="bg-base-200 rounded-lg p-3 max-h-48 overflow-y-auto">
            <ul className="space-y-1 text-sm">
              {categories.map((cat) => {
                const count = getSelectionCount(cat.id);
                const isComplete = count === 5;
                const hasChanges = hasUnsavedChanges(cat.id);
                const willBeSaved = isComplete && hasChanges;
                return (
                  <li key={cat.id} className="flex items-center gap-2">
                    {willBeSaved ? (
                      <Check className="w-4 h-4 text-success" />
                    ) : isComplete ? (
                      <span className="w-4 h-4 text-base-content/40">✓</span>
                    ) : (
                      <span className="w-4 h-4 text-base-content/40">–</span>
                    )}
                    <span
                      className={
                        willBeSaved
                          ? 'font-medium'
                          : 'text-base-content/50'
                      }
                    >
                      {cat.name}: {count}/5
                      {willBeSaved && ' (bude uloženo)'}
                      {isComplete && !hasChanges && ' (už uloženo)'}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="modal-action">
            <form method="dialog">
              <button className="btn btn-ghost">Zrušit</button>
            </form>
            <button
              onClick={saveAll}
              disabled={savingAll}
              className="btn btn-primary gap-2"
            >
              {savingAll ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Ukládám...
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  Potvrdit
                </>
              )}
            </button>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>zavřít</button>
        </form>
      </dialog>

      {/* Confirmation Modal for Save Category */}
      <dialog ref={categoryModalRef} className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-warning" />
            Potvrdit uložení kategorie
          </h3>
          {categoryToConfirm && (
            <>
              <p className="py-4">
                Opravdu chcete uložit nominace pro kategorii{' '}
                <strong>
                  {categories.find((c) => c.id === categoryToConfirm)?.name}
                </strong>
                ?
              </p>

              <div className="bg-base-200 rounded-lg p-3 max-h-48 overflow-y-auto">
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {categories
                    .find((c) => c.id === categoryToConfirm)
                    ?.movies.filter((m) =>
                      selections.get(categoryToConfirm)?.has(m.id)
                    )
                    .map((movie) => (
                      <li key={movie.id}>{movie.name}</li>
                    ))}
                </ul>
              </div>
            </>
          )}

          <div className="modal-action">
            <form method="dialog">
              <button className="btn btn-ghost">Zrušit</button>
            </form>
            <button
              onClick={() => categoryToConfirm && saveCategory(categoryToConfirm)}
              disabled={savingCategory !== null}
              className="btn btn-primary gap-2"
            >
              {savingCategory !== null ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Ukládám...
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  Potvrdit
                </>
              )}
            </button>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>zavřít</button>
        </form>
      </dialog>
    </div>
  );
}
