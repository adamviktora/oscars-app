'use client';

import { Check, Lock, Trophy } from 'lucide-react';
import type { UserData, CategoryInfo } from './types';

interface ByCategoriesViewProps {
  users: UserData[];
  categories: CategoryInfo[];
  selectedCategoryId: number | null;
  selectedCategory: CategoryInfo | null;
  onSelectCategory: (id: number) => void;
  canShowDetails: (u: UserData) => boolean;
}

export function ByCategoriesView({
  users,
  categories,
  selectedCategoryId,
  selectedCategory,
  onSelectCategory,
  canShowDetails,
}: ByCategoriesViewProps) {
  const usersWithRankings = selectedCategory
    ? users.map((user) => {
        const catRanking = user.categoryRankings.find(
          (cr) => cr.categoryId === selectedCategory.categoryId
        );
        return { user, catRanking: catRanking ?? null };
      })
    : [];

  const firstPlaceCounts = selectedCategory
    ? (() => {
        const counts = new Map<string, number>();
        for (const { user, catRanking } of usersWithRankings) {
          if (!catRanking || !canShowDetails(user)) continue;
          const firstPlace = catRanking.nominations.find(
            (n) => n.ranking === 1
          );
          if (!firstPlace) continue;
          const label =
            selectedCategory.isActorCategory && firstPlace.actorName
              ? firstPlace.actorName
              : firstPlace.movieName;
          counts.set(label, (counts.get(label) || 0) + 1);
        }
        return counts;
      })()
    : new Map<string, number>();

  const sortedFirstPlace = Array.from(firstPlaceCounts.entries()).sort(
    (a, b) => b[1] - a[1]
  );

  return (
    <div className="flex gap-6">
      {/* Category list on the left */}
      <div className="w-64 shrink-0">
        <div className="bg-base-100 rounded-lg shadow overflow-hidden">
          <ul className="menu p-2">
            {categories.map((cat) => {
              const usersWithTips = users.filter((u) => {
                const cr = u.categoryRankings.find(
                  (r) => r.categoryId === cat.categoryId
                );
                return cr && cr.rankedCount > 0;
              }).length;

              return (
                <li key={cat.categoryId}>
                  <button
                    onClick={() => onSelectCategory(cat.categoryId)}
                    className={`flex flex-col items-start ${
                      selectedCategoryId === cat.categoryId ? 'active' : ''
                    }`}
                  >
                    <span className="font-medium">{cat.categoryName}</span>
                    <span className="text-xs text-base-content/60">
                      {usersWithTips} / {users.length} tipujících
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* Content on the right */}
      <div className="flex-1">
        {selectedCategory ? (
          <div>
            <h2 className="text-lg font-semibold mb-4">
              {selectedCategory.categoryName}
            </h2>

            {/* 1st place summary for this category */}
            {sortedFirstPlace.length > 0 && (
              <div className="bg-base-100 border border-amber-500/30 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Trophy className="w-5 h-5 text-amber-500" />
                  <span className="font-semibold">Tipy na 1. místo</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {sortedFirstPlace.map(([label, count]) => (
                    <span
                      key={label}
                      className="inline-flex items-center gap-1.5 bg-amber-500/15 border border-amber-500/30 text-sm px-3 py-1 rounded-full"
                    >
                      <span className="font-medium">{label}</span>
                      <span className="badge badge-xs bg-amber-500 text-gray-900 border-0">
                        {count}×
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* User cards grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {usersWithRankings.map(({ user, catRanking }) => {
                const hasRankings = catRanking && catRanking.rankedCount > 0;
                const isComplete =
                  catRanking &&
                  catRanking.rankedCount === selectedCategory.maxRanking;
                const showDetails = canShowDetails(user);

                return (
                  <div
                    key={user.id}
                    className={`border rounded-lg overflow-hidden ${
                      isComplete ? 'border-green-500' : 'border-base-300'
                    }`}
                  >
                    {/* User header */}
                    <div
                      className={`w-full p-4 flex items-center gap-2 ${
                        isComplete ? 'bg-green-500/10' : 'bg-base-200'
                      }`}
                    >
                      {user.prenom1Position != null && (
                        <span className="badge badge-sm badge-neutral font-mono">
                          R{user.prenom1Position}
                        </span>
                      )}
                      <span className="font-semibold text-lg flex-1">
                        {user.name}
                      </span>
                      {user.finalSubmitted ? (
                        <Check className="w-4 h-4 text-green-500 shrink-0" />
                      ) : (
                        <Lock className="w-4 h-4 text-warning shrink-0" />
                      )}
                    </div>

                    {/* Nominations list */}
                    <div className="p-4">
                      {hasRankings ? (
                        <ul className="space-y-1.5">
                          {catRanking.nominations.map((nom, idx) => (
                            <li
                              key={idx}
                              className="flex items-center gap-2 text-sm"
                            >
                              <span className="w-5 h-5 flex items-center justify-center bg-amber-500 text-gray-900 font-bold rounded-full text-xs shrink-0">
                                {nom.ranking}
                              </span>
                              {showDetails ? (
                                selectedCategory.isActorCategory &&
                                nom.actorName ? (
                                  <span className="min-w-0">
                                    <span className="font-medium">
                                      {nom.actorName}
                                    </span>
                                    <span className="text-base-content/60">
                                      {' '}
                                      — {nom.movieName}
                                    </span>
                                  </span>
                                ) : (
                                  <span>{nom.movieName}</span>
                                )
                              ) : (
                                <span className="text-base-content/50 italic">
                                  ZATÍM TAJNÉ
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
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="bg-base-100 rounded-lg shadow p-6">
            <p className="text-base-content/60">
              Vyberte kategorii ze seznamu
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
