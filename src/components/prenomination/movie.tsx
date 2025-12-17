'use client';

import { useState, useEffect } from 'react';
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
  initialRating?: Rating | null;
  initialRanking?: number | null;
  onRatingChange?: (movieId: number, rating: Rating | null, ranking: number | null) => void;
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

  const handleRatingClick = (rating: Rating) => {
    // If clicking on the same rating, unselect it
    if (selectedRating === rating) {
      setSelectedRating(null);
      setRanking(null);
      onRatingChange?.(id, null, null);
    } else {
      setSelectedRating(rating);
      const newRanking = rating === Rating.YES ? ranking : null;
      onRatingChange?.(id, rating, newRanking);
    }
  };

  const handleRankingChange = (newRank: number) => {
    setRanking(newRank);
    if (selectedRating === Rating.YES) {
      onRatingChange?.(id, Rating.YES, newRank);
    }
  };

  // Track if initial load is done to prevent saving on mount
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    setIsInitialized(true);
  }, []);

  // Ukládání změn do databáze
  useEffect(() => {
    if (!isInitialized) return;

    const saveSelection = async () => {
      setIsSaving(true);
      try {
        if (selectedRating === null) {
          // Delete selection
          await fetch(`/api/movie-selection-prenom?movieId=${id}`, {
            method: 'DELETE',
          });
        } else {
          // Save selection
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
        }
      } catch (error) {
        console.error('Error saving selection:', error);
      } finally {
        setIsSaving(false);
      }
    };

    saveSelection();
  }, [selectedRating, ranking, id, isInitialized]);

  return (
    <div className="border p-4 rounded-lg relative">
      {isSaving && (
        <div className="absolute top-2 right-2">
          <span className="loading loading-spinner loading-sm"></span>
        </div>
      )}
      <h2 className="text-xl font-semibold mb-3">{name}</h2>
      <div className="flex gap-4 items-center">
        <div 
          onClick={() => handleRatingClick(Rating.YES)}
          className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
        >
          <input
            type="radio"
            name={`movie-${id}`}
            className="radio radio-success"
            checked={selectedRating === Rating.YES}
            readOnly
          />
          <Check className="w-6 h-6 text-green-500" strokeWidth={3} />
        </div>
        <div 
          onClick={() => handleRatingClick(Rating.MAYBE)}
          className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
        >
          <input
            type="radio"
            name={`movie-${id}`}
            className="radio radio-warning"
            checked={selectedRating === Rating.MAYBE}
            readOnly
          />
          <HelpCircle className="w-6 h-6 text-yellow-500" strokeWidth={2.5} />
        </div>
        <div 
          onClick={() => handleRatingClick(Rating.NO)}
          className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
        >
          <input
            type="radio"
            name={`movie-${id}`}
            className="radio radio-error"
            checked={selectedRating === Rating.NO}
            readOnly
          />
          <X className="w-6 h-6 text-red-500" strokeWidth={3} />
        </div>
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

