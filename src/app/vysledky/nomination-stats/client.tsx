'use client';

import { useState } from 'react';
import { AlertTriangle, Trophy } from 'lucide-react';

interface MovieAssessment {
  movieName: string;
  actorName: string | null;
  totalCash: number;
  avgCash: number;
  placementCounts: number[];
  position: number;
}

interface PosudekCategory {
  categoryName: string;
  slug: string;
  isActorCategory: boolean;
  maxRanking: number;
  movies: MovieAssessment[];
}

interface MovieChance {
  movieName: string;
  totalCash: number;
  nominationCount: number;
  categories: string[];
  position: number;
}

interface ObjectivityCategory {
  categoryName: string;
  slug: string;
  isActorCategory: boolean;
  maxRanking: number;
  matchingGroups: string[][];
  consensusMatchers: string[];
  uniqueFirstPlaces: { displayName: string; userName: string }[];
}

interface Props {
  posudekCategories: PosudekCategory[];
  movieChances: MovieChance[];
  objectivityCategories: ObjectivityCategory[];
  numRespondents: number;
  allFinalized: boolean;
  totalUsers: number;
}

export function NominationStatsClient({
  posudekCategories,
  movieChances,
  objectivityCategories,
  numRespondents,
  allFinalized,
  totalUsers,
}: Props) {
  const [activeTab, setActiveTab] = useState<
    'posudek' | 'movie-chances' | 'objektivita'
  >('posudek');

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Statistiky — Nominační kolo</h1>
      <p className="text-base-content/60 mb-6">{numRespondents} respondentů</p>

      {!allFinalized && (
        <div className="alert alert-warning mb-6">
          <AlertTriangle className="w-5 h-5" />
          <span>
            Zatím neodevzdali všichni účastníci ({numRespondents} z {totalUsers}
            ). Data se mohou změnit.
          </span>
        </div>
      )}

      {/* Tabs */}
      <div className="tabs tabs-boxed mb-6 flex-wrap">
        <button
          className={`tab ${activeTab === 'posudek' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('posudek')}
        >
          📊 Celkový posudek
        </button>
        <button
          className={`tab ${activeTab === 'movie-chances' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('movie-chances')}
        >
          🎬 Celková šance filmů
        </button>
        <button
          className={`tab ${activeTab === 'objektivita' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('objektivita')}
        >
          🎯 Objektivita/subjektivita
        </button>
      </div>

      {/* Celkový posudek tab */}
      {activeTab === 'posudek' && (
        <div>
          <p className="text-sm text-base-content/60 mb-4">
            Průměrný tip všech účastníků — filmy seřazené podle tipované peněžní
            odměny.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {posudekCategories.map((cat) => {
              const maxCash = cat.movies[0]?.totalCash ?? 0;

              return (
                <div
                  key={cat.slug}
                  className="border border-base-300 rounded-lg overflow-hidden"
                >
                  <div className="w-full p-4 bg-base-200 flex items-center justify-between">
                    <span className="font-semibold text-lg">
                      {cat.categoryName}
                    </span>
                  </div>

                  <div className="p-4">
                    <ul className="space-y-2">
                      {cat.movies.map((movie, idx) => {
                        const barWidth =
                          maxCash > 0
                            ? Math.max((movie.totalCash / maxCash) * 100, 2)
                            : 0;

                        return (
                          <li key={idx}>
                            <div className="flex items-center gap-2 text-sm">
                              <span className="w-5 h-5 flex items-center justify-center bg-amber-500 text-gray-900 font-bold rounded-full text-xs shrink-0">
                                {movie.position}
                              </span>
                              <span className="min-w-0 flex-1">
                                {cat.isActorCategory && movie.actorName ? (
                                  <>
                                    <span className="font-medium">
                                      {movie.actorName}
                                    </span>
                                    <span className="text-base-content/60">
                                      {' '}
                                      — {movie.movieName}
                                    </span>
                                  </>
                                ) : (
                                  <span>{movie.movieName}</span>
                                )}
                              </span>
                              {movie.placementCounts[0] > 0 && (
                                <span className="badge badge-sm bg-base-300 text-base-content/70 border-base-300 gap-0.5 font-mono shrink-0">
                                  {movie.placementCounts[0]}
                                  <Trophy className="w-3 h-3 ml-1" />
                                </span>
                              )}
                              <span className="badge badge-sm badge-neutral font-mono shrink-0">
                                {movie.totalCash} Kč
                              </span>
                            </div>
                            <div className="ml-7 mt-1 h-1.5 bg-base-300 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-amber-500 rounded-full transition-all"
                                style={{ width: `${barWidth}%` }}
                              />
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Celková šance filmů tab */}
      {activeTab === 'movie-chances' && (
        <div>
          <p className="text-sm text-base-content/60 mb-4">
            Celkový součet tipované peněžní odměny napříč všemi kategoriemi. V
            případě bodové shody vede snímek s menším počtem nominací, příp.
            nominovaný v níže bodované kategorii.
          </p>

          <div className="border border-base-300 rounded-lg overflow-hidden max-w-3xl">
            <div className="w-full p-4 bg-base-200">
              <span className="font-semibold text-lg">Celková šance filmů</span>
            </div>

            <div className="p-4">
              <ul className="space-y-2">
                {movieChances.map((movie, idx) => {
                  const maxCash = movieChances[0]?.totalCash ?? 0;
                  const barWidth =
                    maxCash > 0
                      ? Math.max((movie.totalCash / maxCash) * 100, 2)
                      : 0;

                  return (
                    <li key={idx}>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="w-6 h-6 flex items-center justify-center bg-amber-500 text-gray-900 font-bold rounded-full text-xs shrink-0">
                          {movie.position}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="font-medium">{movie.movieName}</span>
                          <span className="text-base-content/50 text-xs ml-2">
                            ({movie.nominationCount}{' '}
                            {movie.nominationCount === 1
                              ? 'nominace'
                              : movie.nominationCount >= 2 &&
                                movie.nominationCount <= 4
                              ? 'nominace'
                              : 'nominací'}
                            )
                          </span>
                        </span>
                        <span className="badge badge-sm badge-neutral font-mono shrink-0">
                          {movie.totalCash} Kč
                        </span>
                      </div>
                      <div className="ml-8 mt-1">
                        <div className="h-1.5 bg-base-300 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-500 rounded-full transition-all"
                            style={{ width: `${barWidth}%` }}
                          />
                        </div>
                        <div className="text-xs text-base-content/40 mt-0.5 truncate">
                          {movie.categories.join(', ')}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Objektivita/subjektivita tab */}
      {activeTab === 'objektivita' && (
        <div>
          <p className="text-sm text-base-content/60 mb-4">
            Analýza shod a odlišností v tipech účastníků podle kategorií.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {objectivityCategories.map((cat) => (
              <div
                key={cat.slug}
                className="border border-base-300 rounded-lg overflow-hidden"
              >
                <div className="w-full p-4 bg-base-200">
                  <span className="font-semibold text-lg">
                    {cat.categoryName}
                  </span>
                </div>

                <div className="p-4 space-y-4">
                  {/* Absolutní shody mezi respondenty */}
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-base-content/50 mb-2">
                      🤝 Absolutní shody respondentů
                    </h4>
                    {cat.matchingGroups.length > 0 ? (
                      <ul className="space-y-1.5">
                        {cat.matchingGroups.map((group, idx) => (
                          <li
                            key={idx}
                            className="text-sm flex items-start gap-2"
                          >
                            <span className="badge badge-sm badge-success shrink-0 mt-0.5">
                              {group.length}×
                            </span>
                            <span>{group.join(', ')}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-base-content/40 italic">
                        Žádné shody
                      </p>
                    )}
                  </div>

                  {/* Shoda s celkovým posudkem */}
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-base-content/50 mb-2">
                      📊 Shoda s celkovým posudkem
                    </h4>
                    {cat.consensusMatchers.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {cat.consensusMatchers.map((name) => (
                          <span
                            key={name}
                            className="badge badge-sm badge-info"
                          >
                            {name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-base-content/40 italic">
                        Nikdo
                      </p>
                    )}
                  </div>

                  {/* Ojedinělé tipy na 1. místo */}
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-base-content/50 mb-2">
                      🎯 Ojedinělé tipy na 1. místo
                    </h4>
                    {cat.uniqueFirstPlaces.length > 0 ? (
                      <ul className="space-y-1.5">
                        {cat.uniqueFirstPlaces.map((item, idx) => (
                          <li
                            key={idx}
                            className="text-sm flex items-center gap-2"
                          >
                            <span className="font-medium min-w-0 flex-1">
                              {item.displayName}
                            </span>
                            <span className="badge badge-sm badge-warning shrink-0">
                              {item.userName}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-base-content/40 italic">
                        Žádné
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
