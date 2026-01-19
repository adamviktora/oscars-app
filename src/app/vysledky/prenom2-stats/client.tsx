'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, AlertTriangle, Sparkles } from 'lucide-react';

interface MovieGuess {
  movieName: string;
  count: number;
  users: string[];
}

interface UserMatch {
  users: string[];
  movies: string[];
}

interface CategoryStats {
  categoryId: number;
  categoryName: string;
  totalUsers: number;
  movieGuesses: MovieGuess[];
  usersWhoDidntGuessTop: string[];
  perfectMatches: UserMatch[];
}

interface Props {
  categories: CategoryStats[];
}

export function Prenom2StatsClient({ categories }: Props) {
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(
    new Set([categories[0]?.categoryId])
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

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Statistiky kategorií</h1>
      <p className="text-base-content/60 mb-6">
        Prenominační kolo 2.0 • Přehled tipů podle kategorií
      </p>

      <div className="space-y-4">
        {categories.map((category) => {
          const isExpanded = expandedCategories.has(category.categoryId);
          const topMovie = category.movieGuesses[0];
          const hasPerfectMatches = category.perfectMatches.length > 0;

          return (
            <div
              key={category.categoryId}
              className="bg-base-100 rounded-lg shadow overflow-hidden"
            >
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(category.categoryId)}
                className="w-full p-4 flex items-center justify-between bg-base-200 hover:bg-base-300 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-lg">
                    {category.categoryName}
                  </span>
                  <span className="badge badge-neutral">
                    {category.totalUsers} účastníků
                  </span>
                  {hasPerfectMatches && (
                    <span className="badge badge-success gap-1">
                      <Sparkles className="w-3 h-3" />
                      5/5 shoda
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
                <div className="p-4 space-y-6">
                  {/* Movie guesses table */}
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <span>Tipy filmů</span>
                      <span className="text-sm font-normal text-base-content/60">
                        (seřazeno podle četnosti)
                      </span>
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="table table-sm w-full">
                        <thead>
                          <tr className="bg-base-200">
                            <th>Film</th>
                            <th className="w-24 text-center">Počet</th>
                            <th>Tipující</th>
                          </tr>
                        </thead>
                        <tbody>
                          {category.movieGuesses.map((movie, idx) => {
                            const isTop =
                              idx === 0 ||
                              movie.count === category.movieGuesses[0].count;
                            const isLonely = movie.count === 1;

                            return (
                              <tr
                                key={movie.movieName}
                                className={
                                  isTop
                                    ? 'bg-amber-500/10'
                                    : isLonely
                                    ? 'bg-red-700/15'
                                    : ''
                                }
                              >
                                <td>
                                  <span
                                    className={isTop ? 'font-semibold' : ''}
                                  >
                                    {movie.movieName}
                                  </span>
                                  {isTop && (
                                    <span className="badge badge-sm badge-warning ml-2">
                                      TOP
                                    </span>
                                  )}
                                </td>
                                <td className="text-center font-mono">
                                  {movie.count}-krát
                                </td>
                                <td>
                                  <span className="text-base-content/60 text-sm">
                                    {movie.users.join(', ')}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Users who didn't guess top movie */}
                  {category.usersWhoDidntGuessTop.length > 0 && topMovie && (
                    <div className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                      <h3 className="font-semibold mb-2 flex items-center gap-2 text-orange-400">
                        <AlertTriangle className="w-4 h-4" />
                        Netipli nejčastější film „{topMovie.movieName}"
                      </h3>
                      <p className="text-sm">
                        {category.usersWhoDidntGuessTop.join(', ')}
                      </p>
                    </div>
                  )}

                  {/* Perfect 5/5 matches */}
                  {category.perfectMatches.length > 0 && (
                    <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                      <h3 className="font-semibold mb-3 flex items-center gap-2 text-green-400">
                        <Sparkles className="w-4 h-4" />
                        100% shoda (5/5)
                      </h3>
                      <div className="space-y-3">
                        {category.perfectMatches.map((match, idx) => (
                          <div key={idx} className="text-sm">
                            <div className="font-medium mb-1">
                              {match.users.join(' + ')}
                            </div>
                            <div className="text-base-content/60 pl-4">
                              {match.movies.join(', ')}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {category.movieGuesses.length === 0 && (
                    <p className="text-base-content/60 italic">
                      Zatím žádné tipy v této kategorii
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
