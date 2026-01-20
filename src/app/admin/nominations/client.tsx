'use client';

import { useState, useRef } from 'react';
import { Save, Loader2, Check, AlertTriangle } from 'lucide-react';

interface Movie {
  id: number;
  name: string;
}

interface Props {
  movies: Movie[];
  categoryId: number;
  initialNominations: number[];
}

export function NominationsClient({
  movies,
  categoryId,
  initialNominations,
}: Props) {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(
    new Set(initialNominations)
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const modalRef = useRef<HTMLDialogElement>(null);

  // Get selected movie names for the confirmation modal
  const selectedMovieNames = movies
    .filter((m) => selectedIds.has(m.id))
    .map((m) => m.name);

  const handleToggle = (movieId: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(movieId)) {
        next.delete(movieId);
      } else {
        // Max 10 nominations
        if (next.size >= 10) {
          return prev;
        }
        next.add(movieId);
      }
      return next;
    });
    setSaved(false);
  };

  const handleSubmit = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      const response = await fetch('/api/admin/nominations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryId,
          movieIds: Array.from(selectedIds),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Nepodařilo se uložit nominace');
      }

      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nepodařilo se uložit');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Nominace - Nejlepší film</h1>
          <p className="text-base-content/60 mt-1">
            Vyberte filmy, které byly nominovány na Oscara za nejlepší film
            (max. 10)
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="badge badge-lg badge-neutral">
            {selectedIds.size} / 10 vybráno
          </div>
          <button
            onClick={() => modalRef.current?.showModal()}
            disabled={saving || selectedIds.size < 7}
            className="btn btn-primary gap-2"
          >
            <Save className="w-5 h-5" />
            Uložit nominace
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-error mb-6">
          <span>{error}</span>
        </div>
      )}

      {saved && (
        <div className="alert alert-success mb-6">
          <Check className="w-5 h-5" />
          <span>Nominace byly úspěšně uloženy</span>
        </div>
      )}

      <div className="bg-base-100 rounded-lg shadow p-4">
        <div className="grid gap-2 sm:grid-cols-2">
          {movies.map((movie) => {
            const isSelected = selectedIds.has(movie.id);
            const isDisabled = !isSelected && selectedIds.size >= 10;

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
                  onChange={() => handleToggle(movie.id)}
                />
                <span className={isSelected ? 'font-medium' : ''}>
                  {movie.name}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Confirmation Modal */}
      <dialog ref={modalRef} className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-warning" />
            Potvrdit uložení nominací
          </h3>
          <p className="py-4">
            Opravdu chcete uložit těchto <strong>{selectedIds.size}</strong>{' '}
            nominací?
          </p>
          
          {selectedMovieNames.length > 0 && (
            <div className="bg-base-200 rounded-lg p-3 max-h-48 overflow-y-auto">
              <ol className="list-decimal list-inside space-y-1 text-sm">
                {selectedMovieNames.map((name) => (
                  <li key={name}>{name}</li>
                ))}
              </ol>
            </div>
          )}

          <div className="modal-action">
            <form method="dialog">
              <button className="btn btn-ghost">Zrušit</button>
            </form>
            <button
              onClick={() => {
                modalRef.current?.close();
                handleSubmit();
              }}
              disabled={saving}
              className="btn btn-primary gap-2"
            >
              {saving ? (
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
