'use client';

import { useState, useRef } from 'react';
import { Trophy, Loader2, Check, X, AlertTriangle } from 'lucide-react';

interface Nomination {
  id: number;
  displayName: string;
}

interface CategoryData {
  id: number;
  name: string;
  slug: string;
  isActorCategory: boolean;
  nominations: Nomination[];
  currentWinnerNominationIds: number[];
}

interface Props {
  categories: CategoryData[];
}

export function OscarWinnersClient({ categories }: Props) {
  const [winners, setWinners] = useState<Record<number, number[]>>(() => {
    const initial: Record<number, number[]> = {};
    for (const cat of categories) {
      initial[cat.id] = cat.currentWinnerNominationIds;
    }
    return initial;
  });
  const [savingCategory, setSavingCategory] = useState<number | null>(null);
  const [savedCategory, setSavedCategory] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [pendingAction, setPendingAction] = useState<{
    type: 'add' | 'remove' | 'clear';
    categoryId: number;
    categoryName: string;
    nominationId?: number;
    nominationName?: string;
  } | null>(null);
  const modalRef = useRef<HTMLDialogElement>(null);

  const announcedCount = Object.values(winners).filter((v) => v.length > 0).length;

  const openConfirmation = (action: NonNullable<typeof pendingAction>) => {
    setPendingAction(action);
    modalRef.current?.showModal();
  };

  const handleConfirm = async () => {
    if (!pendingAction) return;
    modalRef.current?.close();

    const { type, categoryId, nominationId } = pendingAction;
    setPendingAction(null);
    setSavingCategory(categoryId);
    setError(null);
    setSavedCategory(null);

    try {
      if (type === 'add' && nominationId) {
        const response = await fetch('/api/admin/oscar-winners', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ categoryId, nominationId }),
        });
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Nepodařilo se uložit');
        }
        setWinners((prev) => ({
          ...prev,
          [categoryId]: [...(prev[categoryId] ?? []), nominationId],
        }));
      } else if (type === 'remove' && nominationId) {
        const response = await fetch('/api/admin/oscar-winners', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ categoryId, nominationId }),
        });
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Nepodařilo se zrušit');
        }
        setWinners((prev) => ({
          ...prev,
          [categoryId]: (prev[categoryId] ?? []).filter((id) => id !== nominationId),
        }));
      } else {
        const response = await fetch('/api/admin/oscar-winners', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ categoryId }),
        });
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Nepodařilo se zrušit');
        }
        setWinners((prev) => ({ ...prev, [categoryId]: [] }));
      }
      setSavedCategory(categoryId);
      setTimeout(() => setSavedCategory(null), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nepodařilo se uložit');
    } finally {
      setSavingCategory(null);
    }
  };

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Trophy className="w-8 h-8 text-yellow-500" />
          <div>
            <h1 className="text-2xl font-bold">Vyhlášení vítězů Oscarů</h1>
            <p className="text-base-content/60 mt-1">
              Vyberte vítěze pro každou kategorii. Výsledky se okamžitě zobrazí účastníkům.
            </p>
          </div>
        </div>
        <div className="badge badge-lg badge-outline gap-2">
          {announcedCount} / {categories.length} vyhlášeno
        </div>
      </div>

      {error && (
        <div className="alert alert-error mb-6">
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {categories.map((cat) => {
          const currentWinners = winners[cat.id] ?? [];
          const isAnnounced = currentWinners.length > 0;
          const isSaving = savingCategory === cat.id;
          const justSaved = savedCategory === cat.id;

          return (
            <div
              key={cat.id}
              className={`border-2 rounded-lg overflow-hidden ${
                isAnnounced ? 'border-green-500 bg-green-500/5' : 'border-base-300 bg-base-100'
              }`}
            >
              {/* Category Header */}
              <div
                className={`w-full p-4 flex items-center justify-between ${
                  isAnnounced
                    ? 'bg-green-500/20 border-b border-green-500/30'
                    : 'bg-base-300/60 border-b border-base-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-lg">{cat.name}</span>
                  {currentWinners.length === 2 && (
                    <span className="badge badge-sm badge-warning">remíza</span>
                  )}
                  {isSaving && <Loader2 className="w-4 h-4 animate-spin text-base-content/50" />}
                  {justSaved && <Check className="w-4 h-4 text-success" />}
                </div>
                {isAnnounced && !isSaving && (
                  <button
                    onClick={() =>
                      openConfirmation({
                        type: 'clear',
                        categoryId: cat.id,
                        categoryName: cat.name,
                      })
                    }
                    className="btn btn-ghost btn-xs text-error"
                  >
                    <X className="w-4 h-4" />
                    Zrušit vše
                  </button>
                )}
              </div>

              {/* Nominations */}
              <div className="p-4 space-y-2">
                {cat.nominations.map((nom) => {
                  const isWinner = currentWinners.includes(nom.id);
                  const canAddMore = currentWinners.length < 2;

                  return (
                    <button
                      key={nom.id}
                      onClick={() =>
                        openConfirmation(
                          isWinner
                            ? {
                                type: 'remove',
                                categoryId: cat.id,
                                categoryName: cat.name,
                                nominationId: nom.id,
                                nominationName: nom.displayName,
                              }
                            : {
                                type: 'add',
                                categoryId: cat.id,
                                categoryName: cat.name,
                                nominationId: nom.id,
                                nominationName: nom.displayName,
                              }
                        )
                      }
                      disabled={isSaving || (!isWinner && !canAddMore)}
                      className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                        isWinner
                          ? 'border-success bg-success/10 font-medium'
                          : !canAddMore
                            ? 'border-base-300 opacity-40 cursor-not-allowed'
                            : 'border-base-300 hover:border-primary/50 hover:bg-base-200'
                      } ${isSaving ? 'opacity-50' : ''}`}
                    >
                      <span className="flex items-center gap-2">
                        {isWinner && <Trophy className="w-4 h-4 text-success shrink-0" />}
                        {nom.displayName}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Confirmation Modal */}
      <dialog ref={modalRef} className="modal">
        <div className="modal-box">
          {pendingAction && (
            <>
              <h3 className="font-bold text-lg flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-warning" />
                {pendingAction.type === 'add'
                  ? 'Potvrdit vyhlášení'
                  : pendingAction.type === 'remove'
                    ? 'Potvrdit odebrání vítěze'
                    : 'Potvrdit zrušení'}
              </h3>
              {pendingAction.type === 'add' ? (
                <div className="py-4">
                  <p className="mb-3">
                    Opravdu chcete přidat vítěze do kategorie{' '}
                    <strong>{pendingAction.categoryName}</strong>?
                  </p>
                  <div className="bg-success/10 border border-success/30 rounded-lg p-3 flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-success shrink-0" />
                    <span className="font-medium">{pendingAction.nominationName}</span>
                  </div>
                  <p className="text-sm text-base-content/50 mt-3">
                    Výsledek se okamžitě zobrazí všem účastníkům.
                  </p>
                </div>
              ) : pendingAction.type === 'remove' ? (
                <div className="py-4">
                  <p className="mb-3">
                    Opravdu chcete odebrat vítěze z kategorie{' '}
                    <strong>{pendingAction.categoryName}</strong>?
                  </p>
                  <div className="bg-error/10 border border-error/30 rounded-lg p-3 flex items-center gap-2">
                    <X className="w-5 h-5 text-error shrink-0" />
                    <span className="font-medium">{pendingAction.nominationName}</span>
                  </div>
                </div>
              ) : (
                <div className="py-4">
                  <p>
                    Opravdu chcete zrušit všechny vítěze kategorie{' '}
                    <strong>{pendingAction.categoryName}</strong>?
                  </p>
                  <p className="text-sm text-base-content/50 mt-3">
                    Kategorie se vrátí do stavu &quot;nevyhlášeno&quot;.
                  </p>
                </div>
              )}
              <div className="modal-action">
                <form method="dialog">
                  <button className="btn btn-ghost">Zrušit</button>
                </form>
                <button
                  onClick={handleConfirm}
                  className={`btn gap-2 ${
                    pendingAction.type === 'add' ? 'btn-success' : 'btn-error'
                  }`}
                >
                  {pendingAction.type === 'add' ? (
                    <>
                      <Trophy className="w-5 h-5" />
                      Vyhlásit
                    </>
                  ) : pendingAction.type === 'remove' ? (
                    <>
                      <X className="w-5 h-5" />
                      Odebrat vítěze
                    </>
                  ) : (
                    <>
                      <X className="w-5 h-5" />
                      Zrušit vše
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>zavřít</button>
        </form>
      </dialog>
    </div>
  );
}
