'use client';

import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { Send, Calendar, ChevronDown, ChevronUp, Check, Save, Loader2 } from 'lucide-react';
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
  
  // Server state (what's saved in DB)
  const [savedSelections, setSavedSelections] = useState<Set<string>>(new Set());
  
  // Local state (current UI state)
  const [localSelections, setLocalSelections] = useState<Set<string>>(new Set());
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());
  const modalRef = useRef<HTMLDialogElement>(null);

  // Helper to create selection key
  const getSelectionKey = (categoryId: number, movieId: number) => 
    `${categoryId}-${movieId}`;

  // Parse selection key
  const parseSelectionKey = (key: string): { categoryId: number; movieId: number } => {
    const [categoryId, movieId] = key.split('-').map(Number);
    return { categoryId, movieId };
  };

  // Count selections per category
  const getSelectionCount = useCallback((categoryId: number) => {
    let count = 0;
    localSelections.forEach((key) => {
      if (key.startsWith(`${categoryId}-`)) {
        count++;
      }
    });
    return count;
  }, [localSelections]);

  // Calculate unsaved changes
  const { toAdd, toRemove, hasUnsavedChanges } = useMemo(() => {
    const add: { categoryId: number; movieId: number }[] = [];
    const remove: { categoryId: number; movieId: number }[] = [];
    
    // New selections (in local but not saved)
    localSelections.forEach(key => {
      if (!savedSelections.has(key)) {
        add.push(parseSelectionKey(key));
      }
    });
    
    // Removed selections (in saved but not local)
    savedSelections.forEach(key => {
      if (!localSelections.has(key)) {
        remove.push(parseSelectionKey(key));
      }
    });
    
    return { 
      toAdd: add, 
      toRemove: remove, 
      hasUnsavedChanges: add.length > 0 || remove.length > 0 
    };
  }, [localSelections, savedSelections]);

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
            const selectionsSet = new Set<string>();
            selectionsData.forEach((sel) => {
              selectionsSet.add(getSelectionKey(sel.categoryId, sel.movieId));
            });
            setSavedSelections(selectionsSet);
            setLocalSelections(new Set(selectionsSet)); // Clone for local state
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

  const handleToggleSelection = useCallback((categoryId: number, movieId: number, selected: boolean) => {
    const key = getSelectionKey(categoryId, movieId);
    
    setLocalSelections((prev) => {
      const next = new Set(prev);
      if (selected) {
        // Check if already at max
        let count = 0;
        next.forEach(k => {
          if (k.startsWith(`${categoryId}-`)) count++;
        });
        if (count >= 5) {
          return prev; // Don't add if at max
        }
        next.add(key);
      } else {
        next.delete(key);
      }
      return next;
    });
  }, []);

  // Save all changes to server
  const handleSave = async () => {
    if (!hasUnsavedChanges) return;
    
    setSaving(true);
    setError(null);
    
    try {
      const response = await fetch('/api/prenom2/selections/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toAdd, toRemove }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Nepodařilo se uložit změny');
      }
      
      // Update saved state to match local state
      setSavedSelections(new Set(localSelections));
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nepodařilo se uložit změny');
    } finally {
      setSaving(false);
    }
  };

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

  // Calculate total progress
  const totalCategories = categories.length;
  const completedCategories = categories.filter(
    (cat) => getSelectionCount(cat.id) === 5
  ).length;

  const unsavedCount = toAdd.length + toRemove.length;

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

      {/* Unsaved changes indicator */}
      {!loading && !error && hasUnsavedChanges && (
        <div className="alert border-2 border-warning bg-transparent mb-6">
          <Save className="w-5 h-5 text-warning" />
          <span>Máte {unsavedCount} neuložených změn</span>
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
                      const isSelected = localSelections.has(key);
                      const isUnsaved = isSelected !== savedSelections.has(key);
                      const isDisabled = selectionCount >= 5 && !isSelected;

                      return (
                        <div key={movie.id} className="relative">
                          <MovieCheckbox
                            id={movie.id}
                            name={movie.name}
                            selected={isSelected}
                            disabled={isDisabled}
                            hasUnsavedChanges={isUnsaved}
                            onToggle={(movieId, selected) =>
                              handleToggleSelection(category.id, movieId, selected)
                            }
                          />
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
                  Uložit změny ({unsavedCount})
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
