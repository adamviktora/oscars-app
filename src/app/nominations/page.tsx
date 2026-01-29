'use client';

import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import Link from 'next/link';
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
import {
  Send,
  Save,
  Loader2,
  Trophy,
  Settings,
} from 'lucide-react';
import { SortableNominationCard } from '@/components/nominations/sortable-nomination-card';

// Category display order for nominations page
const CATEGORY_ORDER = [
  'best-picture',
  'director',
  'actor',
  'actress',
  'supporting-actor',
  'supporting-actress',
  'casting',
  'original-screenplay',
  'adapted-screenplay',
  'camera',
  'film-editing',
  'music',
  'song',
  'production-design',
  'costume-design',
  'makeup',
  'sound',
  'visual-effects',
  'international',
  'animated-feature',
  'documentary',
  'short-live-action',
  'short-animated',
  'short-documentary',
];

// Actor/actress categories (show actor name prominently)
const ACTOR_CATEGORIES = ['actor', 'actress', 'supporting-actor', 'supporting-actress'];

interface Nomination {
  id: number;
  movieId: number;
  movieName: string;
  actorId: number | null;
  actorName: string | null;
  actorGender: string | null;
  defaultOrder: number | null;
}

interface Category {
  id: number;
  name: string;
  slug: string;
  order: number;
  nominations: Nomination[];
}

interface SavedRanking {
  nominationId: number;
  ranking: number;
}

export default function NominationsPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [finalSubmitted, setFinalSubmitted] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const modalRef = useRef<HTMLDialogElement>(null);

  // User setting: keep default order from nomination list
  const [keepDefaultOrder, setKeepDefaultOrder] = useState(false);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  // Rankings state: Map<nominationId, ranking>
  const [savedRankings, setSavedRankings] = useState<Map<number, number>>(
    new Map()
  );
  const [localRankings, setLocalRankings] = useState<Map<number, number>>(
    new Map()
  );

  // Visual order per category: Map<categoryId, nominationId[]>
  const [visualOrders, setVisualOrders] = useState<Map<number, number[]>>(
    new Map()
  );

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Calculate unsaved changes
  const hasUnsavedChanges = useMemo(() => {
    if (localRankings.size !== savedRankings.size) return true;
    for (const [nomId, ranking] of localRankings) {
      if (savedRankings.get(nomId) !== ranking) return true;
    }
    return false;
  }, [localRankings, savedRankings]);

  // Load data
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load categories with nominations
        const categoriesRes = await fetch('/api/nominations/categories');
        if (!categoriesRes.ok)
          throw new Error('Nepodařilo se načíst kategorie');
        const categoriesData: Category[] = await categoriesRes.json();
        
        // Sort categories by CATEGORY_ORDER
        const sortedCategories = [...categoriesData].sort((a, b) => {
          const aIndex = CATEGORY_ORDER.indexOf(a.slug);
          const bIndex = CATEGORY_ORDER.indexOf(b.slug);
          // If not in order list, put at end
          if (aIndex === -1 && bIndex === -1) return 0;
          if (aIndex === -1) return 1;
          if (bIndex === -1) return -1;
          return aIndex - bIndex;
        });
        setCategories(sortedCategories);

        // Load user's saved rankings
        const rankingsMap = new Map<number, number>();
        try {
          const rankingsRes = await fetch('/api/nominations/rankings');
          if (rankingsRes.ok) {
            const rankingsData: SavedRanking[] = await rankingsRes.json();
            rankingsData.forEach((r) => {
              rankingsMap.set(r.nominationId, r.ranking);
            });
            setSavedRankings(rankingsMap);
            setLocalRankings(new Map(rankingsMap));
          }
        } catch {
          console.log('No existing rankings found');
        }

        // Initialize visual orders based on rankings
        const orders = new Map<number, number[]>();
        categoriesData.forEach((cat) => {
          // Sort nominations: ranked first by rank, then unranked by defaultOrder
          const sorted = [...cat.nominations].sort((a, b) => {
            const aRank = rankingsMap.get(a.id);
            const bRank = rankingsMap.get(b.id);
            if (aRank !== undefined && bRank !== undefined) return aRank - bRank;
            if (aRank !== undefined) return -1;
            if (bRank !== undefined) return 1;
            return (a.defaultOrder ?? 999) - (b.defaultOrder ?? 999);
          });
          orders.set(cat.id, sorted.map((n) => n.id));
        });
        setVisualOrders(orders);

        // Load final submission status
        try {
          const statusRes = await fetch('/api/user/final-submissions');
          if (statusRes.ok) {
            const statusData = await statusRes.json();
            setFinalSubmitted(Boolean(statusData.nominationFinalSubmitted));
          }
        } catch {
          console.log('Could not load final submission status');
        }

        // Load user settings
        try {
          const settingsRes = await fetch('/api/user/settings');
          if (settingsRes.ok) {
            const settingsData = await settingsRes.json();
            setKeepDefaultOrder(Boolean(settingsData.keepNominationDefaultOrder));
          }
        } catch {
          console.log('Could not load user settings');
        }
        setSettingsLoaded(true);

        setLoading(false);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Nepodařilo se načíst data'
        );
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Toggle keep default order setting
  const handleToggleKeepDefaultOrder = async (newValue: boolean) => {
    setKeepDefaultOrder(newValue);
    
    // Save to server
    try {
      await fetch('/api/user/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keepNominationDefaultOrder: newValue }),
      });
    } catch {
      console.log('Could not save setting');
    }
  };

  const handleRankingChange = useCallback(
    (categoryId: number, nominationId: number, newRanking: number) => {
      if (finalSubmitted) return;

      const category = categories.find((c) => c.id === categoryId);
      if (!category) return;

      const categoryNominationIds = new Set(
        category.nominations.map((n) => n.id)
      );

      // Find current ranking of the nomination being changed
      const currentRanking = localRankings.get(nominationId);
      
      // Find if another nomination in this category has the target ranking
      let conflictingNomId: number | null = null;
      for (const [nomId, rank] of localRankings) {
        if (
          categoryNominationIds.has(nomId) &&
          rank === newRanking &&
          nomId !== nominationId
        ) {
          conflictingNomId = nomId;
          break;
        }
      }

      // Calculate new rank for conflicting movie (if any)
      let conflictNewRank: number | null = null;
      if (conflictingNomId !== null && !currentRanking) {
        // Clicked movie had no ranking - find next available rank for conflicting movie
        const maxRank = category.slug === 'best-picture' ? 10 : 5;
        const usedRanks = new Set<number>();
        for (const [nomId, rank] of localRankings) {
          if (categoryNominationIds.has(nomId) && nomId !== conflictingNomId) {
            usedRanks.add(rank);
          }
        }
        usedRanks.add(newRanking); // The rank we're taking
        
        // Find next available rank (prefer higher than current)
        for (let r = newRanking + 1; r <= maxRank; r++) {
          if (!usedRanks.has(r)) {
            conflictNewRank = r;
            break;
          }
        }
        // If no higher rank available, try lower
        if (conflictNewRank === null) {
          for (let r = newRanking - 1; r >= 1; r--) {
            if (!usedRanks.has(r)) {
              conflictNewRank = r;
              break;
            }
          }
        }
      }

      // Update rankings
      setLocalRankings((prev) => {
        const next = new Map(prev);

        if (conflictingNomId !== null) {
          if (currentRanking) {
            // Both movies have rankings - swap them
            next.set(conflictingNomId, currentRanking);
          } else if (conflictNewRank !== null) {
            // Clicked movie had no ranking - shift conflicting movie's rank
            next.set(conflictingNomId, conflictNewRank);
          }
        }

        next.set(nominationId, newRanking);
        return next;
      });

      // Update visual order - move items to their rank positions
      if (!keepDefaultOrder) {
        setVisualOrders((prev) => {
          const currentOrder = prev.get(categoryId) || category.nominations.map((n) => n.id);
          const newOrder = [...currentOrder];
          
          const clickedIndex = newOrder.indexOf(nominationId);
          const targetIndex = newRanking - 1; // rank 1 = index 0

          if (conflictingNomId !== null && currentRanking) {
            // Both movies had rankings - swap their positions
            const conflictingIndex = newOrder.indexOf(conflictingNomId);
            if (clickedIndex !== -1 && conflictingIndex !== -1) {
              newOrder[clickedIndex] = conflictingNomId;
              newOrder[conflictingIndex] = nominationId;
            }
          } else {
            // Either no conflict, or clicked movie had no ranking
            // Move clicked movie to target position
            if (clickedIndex !== -1) {
              newOrder.splice(clickedIndex, 1);
              const insertIndex = Math.min(targetIndex, newOrder.length);
              newOrder.splice(insertIndex, 0, nominationId);
            }
            
            // If conflicting movie got a new rank, move it to that position too
            if (conflictingNomId !== null && conflictNewRank !== null) {
              const conflictCurrentIndex = newOrder.indexOf(conflictingNomId);
              if (conflictCurrentIndex !== -1) {
                newOrder.splice(conflictCurrentIndex, 1);
                const conflictTargetIndex = Math.min(conflictNewRank - 1, newOrder.length);
                newOrder.splice(conflictTargetIndex, 0, conflictingNomId);
              }
            }
          }
          
          const next = new Map(prev);
          next.set(categoryId, newOrder);
          return next;
        });
      }
    },
    [categories, finalSubmitted, keepDefaultOrder, localRankings]
  );

  const handleRankingClear = useCallback(
    (nominationId: number) => {
      if (finalSubmitted) return;

      setLocalRankings((prev) => {
        const next = new Map(prev);
        next.delete(nominationId);
        return next;
      });
    },
    [finalSubmitted]
  );

  // Get sorted nominations for a category
  const getSortedNominations = useCallback(
    (category: Category) => {
      if (keepDefaultOrder) {
        // Keep default order from nomination list (sorted by defaultOrder)
        return [...category.nominations].sort((a, b) => {
          const aOrder = a.defaultOrder ?? 999;
          const bOrder = b.defaultOrder ?? 999;
          return aOrder - bOrder;
        });
      }

      // When keepDefaultOrder is OFF, use visual order
      const order = visualOrders.get(category.id);
      if (!order || order.length === 0) {
        // Fallback: sort by ranking
        return [...category.nominations].sort((a, b) => {
          const aRanking = localRankings.get(a.id);
          const bRanking = localRankings.get(b.id);
          if (aRanking !== undefined && bRanking !== undefined) return aRanking - bRanking;
          if (aRanking !== undefined) return -1;
          if (bRanking !== undefined) return 1;
          return (a.defaultOrder ?? 999) - (b.defaultOrder ?? 999);
        });
      }

      // Sort by visual order
      return [...category.nominations].sort((a, b) => {
        const aIndex = order.indexOf(a.id);
        const bIndex = order.indexOf(b.id);
        if (aIndex === -1 && bIndex === -1) return 0;
        if (aIndex === -1) return 1;
        if (bIndex === -1) return -1;
        return aIndex - bIndex;
      });
    },
    [keepDefaultOrder, visualOrders, localRankings]
  );

  const handleDragEnd = useCallback(
    (categoryId: number, event: DragEndEvent) => {
      if (finalSubmitted) return;

      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const category = categories.find((c) => c.id === categoryId);
      if (!category) return;

      // Get current visual order
      const currentOrder = visualOrders.get(categoryId) || category.nominations.map((n) => n.id);
      const oldIndex = currentOrder.indexOf(Number(active.id));
      const newIndex = currentOrder.indexOf(Number(over.id));

      if (oldIndex === -1 || newIndex === -1) return;

      const newOrder = arrayMove(currentOrder, oldIndex, newIndex);

      // Update visual order
      setVisualOrders((prev) => {
        const next = new Map(prev);
        next.set(categoryId, newOrder);
        return next;
      });

      // Update rankings based on new visual order
      // 1. Dragged movie always gets ranking = its new position
      // 2. Other movies that already had a ranking get ranking = their new position
      // 3. Movies without ranking stay without ranking
      const draggedNomId = Number(active.id);

      setLocalRankings((prev) => {
        const next = new Map(prev);

        newOrder.forEach((nomId, index) => {
          const position = index + 1;
          if (nomId === draggedNomId || prev.has(nomId)) {
            // Dragged movie or movie that already had a ranking
            next.set(nomId, position);
          }
        });

        return next;
      });
    },
    [categories, finalSubmitted, visualOrders]
  );

  const handleSave = async (): Promise<boolean> => {
    if (finalSubmitted) return false;
    if (!hasUnsavedChanges) return true;

    setSaving(true);
    setError(null);

    try {
      const rankings = Array.from(localRankings.entries()).map(
        ([nominationId, ranking]) => ({
          nominationId,
          ranking,
        })
      );

      const response = await fetch('/api/nominations/rankings/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rankings }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Nepodařilo se uložit změny');
      }

      setSavedRankings(new Map(localRankings));
      return true;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Nepodařilo se uložit změny'
      );
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleFinalizeSubmission = async () => {
    if (finalSubmitted) return;

    setFinalizing(true);
    setError(null);

    if (hasUnsavedChanges) {
      const saved = await handleSave();
      if (!saved) {
        setFinalizing(false);
        return;
      }
    }

    try {
      const response = await fetch('/api/nominations/finalize', {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || 'Nepodařilo se odeslat finální tipy');
      }

      setFinalSubmitted(true);
      modalRef.current?.close();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Nepodařilo se odeslat finální tipy'
      );
    } finally {
      setFinalizing(false);
    }
  };

  // Calculate progress
  const totalCategories = categories.length;
  const completedCategories = categories.filter((cat) => {
    const maxRanking = cat.slug === 'best-picture' ? 10 : 5;
    let rankedCount = 0;
    cat.nominations.forEach((nom) => {
      if (localRankings.has(nom.id)) rankedCount++;
    });
    return rankedCount === maxRanking;
  }).length;

  const unsavedCount = useMemo(() => {
    let count = 0;
    for (const [nomId, ranking] of localRankings) {
      if (savedRankings.get(nomId) !== ranking) count++;
    }
    for (const nomId of savedRankings.keys()) {
      if (!localRankings.has(nomId)) count++;
    }
    return count;
  }, [localRankings, savedRankings]);

  return (
    <div className="w-full px-4 md:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Trophy className="w-8 h-8 text-yellow-500" />
          <h1 className="text-2xl font-bold">Nominační kolo</h1>
        </div>
        <div className="badge badge-lg badge-outline gap-2">
          {completedCategories} / {totalCategories} kategorií dokončeno
        </div>
      </div>

      <p className="text-base-content/70 mb-4">
        V každé kategorii seřaďte nominace podle toho, jak si myslíte, že
        skončí. <strong>1 = vítěz</strong>.
      </p>

      {/* Mode selector */}
      {settingsLoaded && !loading && !finalSubmitted && (
        <div className="flex flex-col items-start gap-2 mb-6">
          <div className="flex items-center gap-2 text-sm text-base-content/70">
            <Settings className="w-4 h-4" />
            <span>Nastavte si způsob řazení</span>
          </div>
          <div className="inline-flex join border border-base-300 rounded-lg">
            <button
              className={`join-item btn btn-sm ${
                keepDefaultOrder
                  ? 'btn-primary'
                  : 'btn-ghost bg-base-200 hover:bg-base-300'
              }`}
              onClick={() => handleToggleKeepDefaultOrder(true)}
            >
              Zachovat pořadí z nominačního listu
            </button>
            <button
              className={`join-item btn btn-sm ${
                !keepDefaultOrder
                  ? 'btn-primary'
                  : 'btn-ghost bg-base-200 hover:bg-base-300'
              }`}
              onClick={() => handleToggleKeepDefaultOrder(false)}
            >
              Řadit přetažením
            </button>
          </div>
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-12">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      )}

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

      {finalSubmitted && !loading && !error && (
        <div className="alert alert-success mb-6">
          <span>Finální odevzdání je hotové. Tipy už nelze měnit.</span>
        </div>
      )}

      {/* Unsaved changes indicator */}
      {!loading && !error && hasUnsavedChanges && !finalSubmitted && (
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

      {/* Category cards */}
      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {categories.map((category) => {
            const maxRanking = category.slug === 'best-picture' ? 10 : 5;
            const sortedNominations = getSortedNominations(category);

            // Count ranked nominations
            let rankedCount = 0;
            category.nominations.forEach((nom) => {
              if (localRankings.has(nom.id)) rankedCount++;
            });
            const isComplete = rankedCount === maxRanking;

            return (
              <div
                key={category.id}
                className={`border rounded-lg overflow-hidden ${
                  isComplete ? 'border-green-500' : 'border-base-300'
                }`}
              >
                {/* Category Header */}
                <div
                  className={`w-full p-4 flex items-center justify-between ${
                    isComplete ? 'bg-green-500/10' : 'bg-base-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-lg">
                      {category.name}
                    </span>
                    <span
                      className={`badge ${
                        isComplete ? 'badge-success' : 'badge-neutral'
                      }`}
                    >
                      {rankedCount} / {maxRanking}
                    </span>
                  </div>
                </div>

                {/* Category Content */}
                <div className="p-4">
                  {keepDefaultOrder ? (
                    // No drag and drop - static list
                    <div className="space-y-2">
                      {sortedNominations.map((nomination) => (
                        <SortableNominationCard
                          key={nomination.id}
                          id={nomination.id}
                          movieName={nomination.movieName}
                          actorName={nomination.actorName}
                          ranking={localRankings.get(nomination.id) || null}
                          maxRanking={maxRanking}
                          disabled={finalSubmitted}
                          disableDrag={true}
                          isActorCategory={ACTOR_CATEGORIES.includes(category.slug)}
                          onRankingChange={(nomId, ranking) =>
                            handleRankingChange(category.id, nomId, ranking)
                          }
                          onRankingClear={handleRankingClear}
                        />
                      ))}
                    </div>
                  ) : (
                    // Drag and drop enabled
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={(event) => handleDragEnd(category.id, event)}
                    >
                      <SortableContext
                        items={sortedNominations.map((n) => n.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="space-y-2">
                          {sortedNominations.map((nomination) => (
                            <SortableNominationCard
                              key={nomination.id}
                              id={nomination.id}
                              movieName={nomination.movieName}
                              actorName={nomination.actorName}
                              ranking={localRankings.get(nomination.id) || null}
                              maxRanking={maxRanking}
                              disabled={finalSubmitted}
                              isActorCategory={ACTOR_CATEGORIES.includes(category.slug)}
                              onRankingChange={(nomId, ranking) =>
                                handleRankingChange(category.id, nomId, ranking)
                              }
                              onRankingClear={handleRankingClear}
                            />
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Bottom action buttons */}
      {!loading && !error && (
        <div className="mt-8 flex justify-end gap-4">
          {!finalSubmitted && hasUnsavedChanges && (
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
          {finalSubmitted ? (
            <Link href="/vysledky/nominations" className="btn btn-secondary">
              Výsledky
            </Link>
          ) : (
            <button
              onClick={() => modalRef.current?.showModal()}
              className="btn btn-primary gap-2"
            >
              <Send className="w-5 h-5" />
              Finální odevzdání
            </button>
          )}
        </div>
      )}

      {/* Finalization modal */}
      <dialog ref={modalRef} className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg flex items-center gap-2">
            Finální odevzdání
          </h3>
          <p className="py-4">
            Po finálním odevzdání už nebude možné tipy upravovat.
          </p>
          <div className="modal-action">
            <button
              className="btn btn-primary"
              onClick={handleFinalizeSubmission}
              disabled={finalizing}
            >
              {finalizing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Odesílám...
                </>
              ) : (
                'Potvrdit odevzdání'
              )}
            </button>
            <form method="dialog">
              <button className="btn">Zrušit</button>
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
