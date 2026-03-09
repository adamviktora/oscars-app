'use client';

import { useState } from 'react';
import { Check, Lock, Trophy, Film } from 'lucide-react';

interface NominationEntry {
  ranking: number;
  movieName: string;
  actorName: string | null;
}

interface CategoryRanking {
  categoryId: number;
  rankedCount: number;
  nominations: NominationEntry[];
}

interface CategoryInfo {
  categoryId: number;
  categoryName: string;
  slug: string;
  isActorCategory: boolean;
  maxRanking: number;
}

interface FirstPlaceMovie {
  movieName: string;
  count: number;
}

interface UserData {
  id: string;
  name: string;
  finalSubmitted: boolean;
  completeCategories: number;
  totalCategories: number;
  prenom2Bonus: number;
  firstPlaceMovies: FirstPlaceMovie[];
  uniqueAwardedMovies: number;
  categoryRankings: CategoryRanking[];
}

interface Props {
  users: UserData[];
  categories: CategoryInfo[];
  viewerFinalized: boolean;
  viewerIsAdmin: boolean;
}

export function NominationResultsClient({
  users,
  categories,
  viewerFinalized,
  viewerIsAdmin,
}: Props) {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(
    users[0]?.id ?? null
  );

  const selectedUser = users.find((u) => u.id === selectedUserId);

  const categoryMap = new Map(categories.map((c) => [c.categoryId, c]));

  const canShowDetails = (user: UserData) =>
    viewerFinalized && (viewerIsAdmin || user.finalSubmitted);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">
        Nominační kolo - tipy účastníků
      </h1>

      <div className="flex gap-6">
        {/* User list on the left */}
        <div className="w-64 shrink-0">
          <div className="bg-base-100 rounded-lg shadow overflow-hidden">
            <ul className="menu p-2">
              {users.map((user) => (
                <li key={user.id}>
                  <button
                    onClick={() => setSelectedUserId(user.id)}
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
                        {user.completeCategories > 0 ? (
                          <span className="flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            {user.completeCategories} / {user.totalCategories}{' '}
                            kategorií
                          </span>
                        ) : (
                          'Žádné tipy'
                        )}
                      </span>
                      {user.prenom2Bonus > 0 && (
                        <span className="badge badge-success badge-xs">
                          +{user.prenom2Bonus} Kč
                        </span>
                      )}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Content on the right */}
        <div className="flex-1">
          {selectedUser ? (
            <div>
              {/* User header */}
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
                {selectedUser.prenom2Bonus > 0 && (
                  <div className="flex items-center gap-2 bg-green-500/20 px-4 py-2 rounded-lg">
                    <Trophy className="w-5 h-5 text-green-400" />
                    <span className="font-bold text-green-400">
                      +{selectedUser.prenom2Bonus} Kč z prenominačního kola 2.0
                    </span>
                  </div>
                )}
              </div>

              {/* 1st place summary */}
              {canShowDetails(selectedUser) &&
                selectedUser.firstPlaceMovies.length > 0 && (
                  <div className="bg-base-100 border border-amber-500/30 rounded-lg p-4 mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Film className="w-5 h-5 text-amber-500" />
                      <span className="font-semibold">
                        Počet &quot;výher&quot; (tipů na 1. místo)
                      </span>
                      <span className="badge badge-sm badge-neutral">
                        {selectedUser.uniqueAwardedMovies} různých filmů
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selectedUser.firstPlaceMovies.map((m) => (
                        <span
                          key={m.movieName}
                          className="inline-flex items-center gap-1.5 bg-amber-500/15 border border-amber-500/30 text-sm px-3 py-1 rounded-full"
                        >
                          <span className="font-medium">{m.movieName}</span>
                          <span className="badge badge-xs bg-amber-500 text-gray-900 border-0">
                            {m.count}x
                          </span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

              {/* Category cards grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {selectedUser.categoryRankings.map((catRanking) => {
                  const catInfo = categoryMap.get(catRanking.categoryId);
                  if (!catInfo) return null;

                  const isComplete =
                    catRanking.rankedCount === catInfo.maxRanking;
                  const hasRankings = catRanking.rankedCount > 0;
                  const showDetails = canShowDetails(selectedUser);

                  return (
                    <div
                      key={catRanking.categoryId}
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
                        <span className="font-semibold text-lg">
                          {catInfo.categoryName}
                        </span>
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
                                  catInfo.isActorCategory && nom.actorName ? (
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
                Vyberte uživatele ze seznamu
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
