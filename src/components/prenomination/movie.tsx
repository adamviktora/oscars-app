'use client';

import { useState, useEffect } from 'react';
import { Check, HelpCircle, X } from 'lucide-react';

export interface MovieData {
  id: number;
  name: string;
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
  initialRating?: Rating | null;
  initialRanking?: number | null;
  onRatingChange?: (movieId: number, rating: Rating, ranking: number | null) => void;
}

export default function Movie({ id, name, initialRating, initialRanking, onRatingChange }: MovieProps) {
  const [selectedRating, setSelectedRating] = useState<Rating | null>(initialRating || null);
  const [ranking, setRanking] = useState<number | null>(initialRanking || null);
  const [isSaving, setIsSaving] = useState(false);

  // Sync internal state with props when they change (e.g., after filter toggle)
  useEffect(() => {
    setSelectedRating(initialRating || null);
    setRanking(initialRanking || null);
  }, [initialRating, initialRanking]);

  const handleRatingChange = (rating: Rating) => {
    setSelectedRating(rating);
    const newRanking = rating === Rating.YES ? ranking : null;
    onRatingChange?.(id, rating, newRanking);
  };

  const handleRankingChange = (newRank: number) => {
    setRanking(newRank);
    if (selectedRating === Rating.YES) {
      onRatingChange?.(id, Rating.YES, newRank);
    }
  };

  // Ukládání změn do databáze
  useEffect(() => {
    if (selectedRating === null) return;

    const saveSelection = async () => {
      setIsSaving(true);
      try {
        await fetch('/api/movie-selection-prenom', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            movieId: id,
            rating: selectedRating,
            ranking: selectedRating === Rating.YES ? ranking : null,
          }),
        });
      } catch (error) {
        console.error('Error saving selection:', error);
      } finally {
        setIsSaving(false);
      }
    };

    saveSelection();
  }, [selectedRating, ranking, id]);

  return (
    <div className="border p-4 rounded-lg relative">
      {isSaving && (
        <div className="absolute top-2 right-2">
          <span className="loading loading-spinner loading-sm"></span>
        </div>
      )}
      <h2 className="text-xl font-semibold mb-3">{name}</h2>
      <div className="flex gap-4 items-center">
        <label className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
          <input
            type="radio"
            name={`movie-${id}`}
            className="radio radio-success"
            checked={selectedRating === Rating.YES}
            onChange={() => handleRatingChange(Rating.YES)}
          />
          <Check className="w-6 h-6 text-green-500" strokeWidth={3} />
        </label>
        <label className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
          <input
            type="radio"
            name={`movie-${id}`}
            className="radio radio-warning"
            checked={selectedRating === Rating.MAYBE}
            onChange={() => handleRatingChange(Rating.MAYBE)}
          />
          <HelpCircle className="w-6 h-6 text-yellow-500" strokeWidth={2.5} />
        </label>
        <label className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
          <input
            type="radio"
            name={`movie-${id}`}
            className="radio radio-error"
            checked={selectedRating === Rating.NO}
            onChange={() => handleRatingChange(Rating.NO)}
          />
          <X className="w-6 h-6 text-red-500" strokeWidth={3} />
        </label>
      </div>
      {selectedRating === Rating.YES && (
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
                className={`w-10 h-10 rounded-lg font-semibold transition-all ${
                  ranking === num
                    ? 'bg-green-500 text-white scale-110'
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

