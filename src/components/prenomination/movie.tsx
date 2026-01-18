'use client';

import { Check, HelpCircle, X } from 'lucide-react';

export interface MovieData {
  id: number;
  name: string;
  prenom1Order: number | null;
  createdAt: string;
  updatedAt: string;
}

export enum Rating {
  YES = 'YES',
  MAYBE = 'MAYBE',
  NO = 'NO',
}

interface MovieProps {
  id: number;
  name: string;
  rating: Rating | null;
  ranking: number | null;
  disabled?: boolean;
  hasUnsavedChanges?: boolean;
  onRatingChange: (movieId: number, rating: Rating | null, ranking: number | null) => void;
}

export default function Movie({ 
  id, 
  name, 
  rating, 
  ranking, 
  disabled = false,
  hasUnsavedChanges,
  onRatingChange 
}: MovieProps) {

  const handleRatingClick = (newRating: Rating) => {
    if (disabled) return;
    // If clicking on the same rating, unselect it
    if (rating === newRating) {
      onRatingChange(id, null, null);
    } else {
      const newRanking = newRating === Rating.YES ? ranking : null;
      onRatingChange(id, newRating, newRanking);
    }
  };

  const handleRankingChange = (newRank: number) => {
    if (disabled) return;
    if (rating === Rating.YES) {
      onRatingChange(id, Rating.YES, newRank);
    }
  };

  return (
    <div className={`border p-4 rounded-lg relative transition-all ${
      hasUnsavedChanges ? 'border-warning bg-warning/5' : ''
    } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}>
      {hasUnsavedChanges && (
        <div className="absolute top-2 right-2">
          <span className="badge badge-warning badge-xs">neuloženo</span>
        </div>
      )}
      <h2 className="text-xl font-semibold mb-3">{name}</h2>
      <div className="flex gap-4 items-center">
        <div 
          onClick={() => handleRatingClick(Rating.YES)}
          className={`flex items-center gap-2 transition-opacity ${
            disabled ? 'cursor-not-allowed' : 'cursor-pointer hover:opacity-80'
          }`}
        >
          <input
            type="radio"
            name={`movie-${id}`}
            className="radio radio-success"
            checked={rating === Rating.YES}
            readOnly
          />
          <Check className="w-6 h-6 text-green-500" strokeWidth={3} />
        </div>
        <div 
          onClick={() => handleRatingClick(Rating.MAYBE)}
          className={`flex items-center gap-2 transition-opacity ${
            disabled ? 'cursor-not-allowed' : 'cursor-pointer hover:opacity-80'
          }`}
        >
          <input
            type="radio"
            name={`movie-${id}`}
            className="radio radio-warning"
            checked={rating === Rating.MAYBE}
            readOnly
          />
          <HelpCircle className="w-6 h-6 text-yellow-500" strokeWidth={2.5} />
        </div>
        <div 
          onClick={() => handleRatingClick(Rating.NO)}
          className={`flex items-center gap-2 transition-opacity ${
            disabled ? 'cursor-not-allowed' : 'cursor-pointer hover:opacity-80'
          }`}
        >
          <input
            type="radio"
            name={`movie-${id}`}
            className="radio radio-error"
            checked={rating === Rating.NO}
            readOnly
          />
          <X className="w-6 h-6 text-red-500" strokeWidth={3} />
        </div>
      </div>
      {rating === Rating.YES && (
        <div className="mt-4">
          <label className="block text-sm font-medium mb-2">
            Pořadí (1-10):
          </label>
          <div className="flex gap-2 flex-wrap">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handleRankingChange(num)}
                disabled={disabled}
                className={`w-10 h-10 rounded-lg font-semibold transition-all ${
                  ranking === num
                    ? 'bg-green-500 text-white scale-110'
                    : disabled
                      ? 'bg-gray-200 text-gray-500'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                }`}
              >
                {num}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
