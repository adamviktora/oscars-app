'use client';

import { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';

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
  shortlistSize: number;
  totalEarned: number;
  maxPossible: number;
  successRate: number;
  successfulUsers: number;
  userSuccessRate: number;
}

interface UserAccuracyRow {
  userName: string;
  counts: number[];
}

interface Props {
  categories: CategoryStats[];
  userAccuracy: UserAccuracyRow[];
  hasNominations: boolean;
}

export function Prenom2StatsClient({
  categories,
  userAccuracy,
  hasNominations,
}: Props) {
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(
    new Set([categories[0]?.categoryId])
  );
  const [activeTab, setActiveTab] = useState<
    'categories' | 'accuracy' | 'success' | 'userSuccess'
  >('categories');

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

      {/* Tabs */}
      <div className="tabs tabs-boxed mb-6 flex-wrap">
        <button
          className={`tab ${activeTab === 'categories' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('categories')}
        >
          📋 Tipy podle kategorií
        </button>
        {hasNominations && (
          <>
            <button
              className={`tab ${activeTab === 'accuracy' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('accuracy')}
            >
              🎯 Přesnost uživatelů
            </button>
            <button
              className={`tab ${activeTab === 'userSuccess' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('userSuccess')}
            >
              👥 Úspěšnost - uživatelé
            </button>
            <button
              className={`tab ${activeTab === 'success' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('success')}
            >
              💰 Úspěšnost - peníze
            </button>
          </>
        )}
      </div>

      {/* User Accuracy Table */}
      {activeTab === 'accuracy' && hasNominations && (
        <div className="card bg-base-100 shadow-sm mb-6">
          <div className="card-body">
            <h2 className="card-title text-lg mb-4">
              🎯 Přesnost tipů podle uživatelů
            </h2>
            <p className="text-sm text-base-content/60 mb-4">
              Počet kategorií, ve kterých uživatel uhodl daný počet filmů z 5.
            </p>
            <div className="overflow-x-auto">
              <table className="table table-sm">
                <thead>
                  <tr className="bg-base-200">
                    <th>Uživatel</th>
                    <th className="text-center">0/5</th>
                    <th className="text-center">1/5</th>
                    <th className="text-center">2/5</th>
                    <th className="text-center">3/5</th>
                    <th className="text-center">4/5</th>
                    <th className="text-center">5/5</th>
                  </tr>
                </thead>
                <tbody>
                  {userAccuracy.map((user) => (
                    <tr key={user.userName}>
                      <td className="font-medium">{user.userName}</td>
                      {user.counts.map((count, idx) => (
                        <td
                          key={idx}
                          className={`text-center ${
                            idx >= 3 && count > 0
                              ? 'bg-green-500/20 font-bold text-green-400'
                              : idx === 0 && count > 0
                              ? 'bg-red-500/10 text-red-400'
                              : ''
                          }`}
                        >
                          {count > 0 ? count : '-'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* User Success Rate per Category */}
      {activeTab === 'userSuccess' && hasNominations && (
        <div className="card bg-base-100 shadow-sm mb-6">
          <div className="card-body">
            <h2 className="card-title text-lg mb-4">
              👥 Úspěšnost - kolik uživatelů získalo peníze
            </h2>
            <p className="text-sm text-base-content/60 mb-4">
              Kolik procent uživatelů získalo alespoň 1 Kč v dané kategorii
              (z těch, kteří se zúčastnili).
            </p>
            <div className="space-y-3">
              {categories
                .slice()
                .sort((a, b) => b.userSuccessRate - a.userSuccessRate)
                .map((category) => (
                  <div
                    key={category.categoryId}
                    className="flex items-center gap-4"
                  >
                    <div className="w-32 sm:w-48 font-medium truncate">
                      {category.categoryName}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-base-200 rounded-full h-4 overflow-hidden">
                          <div
                            className={`h-full transition-all ${
                              category.userSuccessRate >= 50
                                ? 'bg-green-500'
                                : category.userSuccessRate >= 25
                                ? 'bg-yellow-500'
                                : 'bg-red-500'
                            }`}
                            style={{ width: `${category.userSuccessRate}%` }}
                          />
                        </div>
                        <span className="w-12 text-right font-mono text-sm">
                          {category.userSuccessRate}%
                        </span>
                      </div>
                    </div>
                    <div className="text-xs text-base-content/50 w-28 text-right hidden sm:block">
                      {category.successfulUsers} / {category.totalUsers} uživatelů
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Category Money Success Rate */}
      {activeTab === 'success' && hasNominations && (
        <div className="card bg-base-100 shadow-sm mb-6">
          <div className="card-body">
            <h2 className="card-title text-lg mb-4">
              💰 Úspěšnost - získané peníze
            </h2>
            <p className="text-sm text-base-content/60 mb-4">
              Kolik procent z maximálně možných Kč uživatelé celkově získali v
              každé kategorii.
            </p>
            <div className="space-y-3">
              {categories
                .slice()
                .sort((a, b) => b.successRate - a.successRate)
                .map((category) => (
                  <div
                    key={category.categoryId}
                    className="flex items-center gap-4"
                  >
                    <div className="w-32 sm:w-48 font-medium truncate">
                      {category.categoryName}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-base-200 rounded-full h-4 overflow-hidden">
                          <div
                            className={`h-full transition-all ${
                              category.successRate >= 50
                                ? 'bg-green-500'
                                : category.successRate >= 25
                                ? 'bg-yellow-500'
                                : 'bg-red-500'
                            }`}
                            style={{ width: `${category.successRate}%` }}
                          />
                        </div>
                        <span className="w-12 text-right font-mono text-sm">
                          {category.successRate}%
                        </span>
                      </div>
                    </div>
                    <div className="text-xs text-base-content/50 w-24 text-right hidden sm:block">
                      {category.totalEarned} / {category.maxPossible} Kč
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Categories list */}
      {activeTab === 'categories' && <div className="space-y-4">
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
                        Netipli nejčastější film &bdquo;{topMovie.movieName}&ldquo;
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
      </div>}
    </div>
  );
}
