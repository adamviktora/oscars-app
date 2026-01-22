'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Check, Lock, Trophy } from 'lucide-react';

interface MovieSelection {
  movieId: number;
  movieName: string;
  isCorrect: boolean;
}

interface CategoryEarnings {
  categoryId: number;
  categoryName: string;
  shortlistSize: number;
  movies: MovieSelection[];
  correctCount: number;
  prize: number;
}

interface UserEarnings {
  id: string;
  name: string;
  email: string;
  finalSubmitted: boolean;
  totalPrize: number;
  categories: CategoryEarnings[];
  completedCategories: number;
  totalCategories: number;
}

interface Props {
  users: UserEarnings[];
}

export function Prenom2EarningsClient({ users }: Props) {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(
    users[0]?.id ?? null
  );
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(
    new Set()
  );

  const selectedUser = users.find((u) => u.id === selectedUserId);

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

  const handleSelectUser = (userId: string) => {
    setSelectedUserId(userId);
    setExpandedCategories(new Set());
  };

  // Sort users by total prize for display in sidebar
  const sortedUsers = [...users].sort((a, b) => {
    // Finalized users first, then by prize
    if (a.finalSubmitted !== b.finalSubmitted) {
      return a.finalSubmitted ? -1 : 1;
    }
    return b.totalPrize - a.totalPrize;
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Výsledné zisky</h1>

      <div className="flex gap-6">
        {/* User tabs on the left */}
        <div className="w-64 shrink-0">
          <div className="bg-base-100 rounded-lg shadow overflow-hidden">
            <ul className="menu p-2">
              {sortedUsers.map((user) => (
                <li key={user.id}>
                  <button
                    onClick={() => handleSelectUser(user.id)}
                    className={`flex flex-col items-start ${
                      selectedUserId === user.id ? 'active' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2 w-full">
                      <span className="font-medium flex-1">{user.name}</span>
                      {user.finalSubmitted && (
                        <Check className="w-4 h-4 text-green-500" />
                      )}
                    </div>
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs text-base-content/60">
                        {user.completedCategories} / {user.totalCategories}{' '}
                        kategorií
                      </span>
                      {user.totalPrize > 0 && (
                        <span className="badge badge-success badge-xs">
                          +{user.totalPrize} Kč
                        </span>
                      )}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Categories on the right */}
        <div className="flex-1">
          {selectedUser ? (
            <div className="space-y-3">
              {/* User header with total earnings */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold">{selectedUser.name}</h2>
                  {selectedUser.finalSubmitted ? (
                    <span className="badge badge-success badge-sm gap-1">
                      <Check className="w-3 h-3" />
                      Odevzdáno
                    </span>
                  ) : (
                    <span className="badge badge-warning badge-sm gap-1">
                      <Lock className="w-3 h-3" />
                      Neodevzdáno
                    </span>
                  )}
                </div>
                {selectedUser.totalPrize > 0 && (
                  <div className="flex items-center gap-2 bg-green-500/20 px-4 py-2 rounded-lg">
                    <Trophy className="w-5 h-5 text-green-400" />
                    <span className="font-bold text-green-400">
                      Celkem: {selectedUser.totalPrize} Kč
                    </span>
                  </div>
                )}
              </div>

              {selectedUser.categories.map((cat) => {
                const isExpanded = expandedCategories.has(cat.categoryId);
                const isComplete = cat.movies.length === 5;
                const hasSelections = cat.movies.length > 0;
                const hasPrize = cat.prize > 0;

                return (
                  <div
                    key={cat.categoryId}
                    className={`border rounded-lg overflow-hidden ${
                      hasPrize
                        ? 'border-green-500'
                        : isComplete
                        ? 'border-base-300'
                        : 'border-base-300'
                    }`}
                  >
                    {/* Category Header */}
                    <button
                      onClick={() => toggleCategory(cat.categoryId)}
                      className={`w-full p-3 flex items-center justify-between transition-colors ${
                        hasPrize
                          ? 'bg-green-500/10'
                          : 'bg-base-200 hover:bg-base-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-medium">{cat.categoryName}</span>
                        <span
                          className={`badge badge-sm ${
                            hasPrize
                              ? 'badge-success'
                              : cat.correctCount > 0
                              ? 'badge-info'
                              : 'badge-neutral'
                          }`}
                        >
                          {cat.correctCount} / 5
                        </span>
                        {hasPrize && (
                          <span className="badge badge-sm badge-success">
                            +{cat.prize} Kč
                          </span>
                        )}
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>

                    {/* Category Content */}
                    {isExpanded && (
                      <div className="p-3 bg-base-100">
                        {hasSelections ? (
                          <ul className="space-y-1">
                            {cat.movies.map((movie, idx) => (
                              <li
                                key={movie.movieId}
                                className={`flex items-center gap-2 text-sm p-2 rounded ${
                                  movie.isCorrect
                                    ? 'bg-green-500/20 border border-green-500/30'
                                    : ''
                                }`}
                              >
                                {movie.isCorrect ? (
                                  <span className="w-5 h-5 flex items-center justify-center bg-green-500 text-white font-bold rounded-full text-xs">
                                    ✓
                                  </span>
                                ) : (
                                  <span className="w-5 h-5 flex items-center justify-center bg-base-300 text-base-content/50 font-bold rounded-full text-xs">
                                    {idx + 1}
                                  </span>
                                )}
                                <span
                                  className={
                                    movie.isCorrect
                                      ? 'font-medium text-green-400'
                                      : ''
                                  }
                                >
                                  {movie.movieName}
                                </span>
                                {movie.isCorrect && (
                                  <span className="text-xs text-green-400 ml-auto">
                                    NOMINOVÁNO
                                  </span>
                                )}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-base-content/60 italic text-sm">
                            Žádné tipy
                          </p>
                        )}
                        <div className="mt-2 text-xs text-base-content/50">
                          Shortlist: {cat.shortlistSize} filmů
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-base-100 rounded-lg shadow p-6">
              <p className="text-base-content/60">
                Vyberte uživatele ze seznamu
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
