'use client';

import { useState } from 'react';
import { AlertTriangle, Trophy, ChevronDown } from 'lucide-react';

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

interface FirstPlaceAgreementItem {
  categoryName: string;
  slug: string;
  movieName: string;
  count: number;
}

interface CloseBattle {
  categoryName: string;
  slug: string;
  movieA: string;
  countA: number;
  movieB: string;
  countB: number;
}

interface MajorityDivergenceItem {
  categoryName: string;
  slug: string;
  majorityMovie: string;
  majorityCount: number;
  divergers: { userName: string; pickedMovie: string }[];
}

interface UnanimousPlacement {
  categoryName: string;
  slug: string;
  movieName: string;
  position: number;
  agreedCount: number;
  totalCount: number;
}

interface ObjectivityRankingItem {
  userName: string;
  score: number;
  plusConsensus: number;
  plusMatching: number;
  minusDivergence: number;
  minusUnique: number;
}

interface Props {
  posudekCategories: PosudekCategory[];
  movieChances: MovieChance[];
  objectivityCategories: ObjectivityCategory[];
  firstPlaceAgreement: FirstPlaceAgreementItem[];
  closeBattles: CloseBattle[];
  majorityDivergence: MajorityDivergenceItem[];
  unanimousPlacements: UnanimousPlacement[];
  objectivityRanking: ObjectivityRankingItem[];
  numRespondents: number;
  allFinalized: boolean;
  totalUsers: number;
}

export function NominationStatsClient({
  posudekCategories,
  movieChances,
  objectivityCategories,
  firstPlaceAgreement,
  closeBattles,
  majorityDivergence,
  unanimousPlacements,
  objectivityRanking,
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
          🎯 Detailní statistiky
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

      {/* Detailní statistiky tab */}
      {activeTab === 'objektivita' && (
        <div className="space-y-6">
          <p className="text-sm text-base-content/60">
            Analýza shod a odlišností v tipech účastníků.
          </p>

          {/* 1. Absolutní shody respondentů */}
          <details open className="group">
            <summary className="cursor-pointer list-none flex items-center gap-2 mb-3">
              <ChevronDown className="w-5 h-5 transition-transform group-open:rotate-0 -rotate-90 shrink-0" />
              <h2 className="text-lg font-bold">
                🤝 Absolutní shody respondentů
              </h2>
              <span className="badge badge-sm badge-success">+ objektivita</span>
            </summary>
            <p className="text-sm text-base-content/60 mb-3 ml-7">
              Respondenti se shodným kompletním pořadím v dané kategorii.
            </p>
            {(() => {
              const catsWithMatches = objectivityCategories.filter(
                (c) => c.matchingGroups.length > 0
              );
              return catsWithMatches.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 ml-7">
                  {catsWithMatches.map((cat) => (
                    <div
                      key={cat.slug}
                      className="border border-base-300 rounded-lg overflow-hidden"
                    >
                      <div className="px-4 py-3 bg-base-200 font-semibold">
                        {cat.categoryName}
                      </div>
                      <ul className="p-4 space-y-1.5">
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
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-base-content/40 italic ml-7">
                  Žádné shody v žádné kategorii.
                </p>
              );
            })()}
          </details>

          {/* 2. Absolutní shoda s celkovým posudkem */}
          <details open className="group">
            <summary className="cursor-pointer list-none flex items-center gap-2 mb-3">
              <ChevronDown className="w-5 h-5 transition-transform group-open:rotate-0 -rotate-90 shrink-0" />
              <h2 className="text-lg font-bold">
                📊 Absolutní shoda s celkovým posudkem
              </h2>
              <span className="badge badge-sm badge-success">+ objektivita</span>
            </summary>
            <p className="text-sm text-base-content/60 mb-3 ml-7">
              Respondenti, jejichž kompletní pořadí odpovídá celkovému posudku.
            </p>
            {(() => {
              const catsWithConsensus = objectivityCategories.filter(
                (c) => c.consensusMatchers.length > 0
              );
              return catsWithConsensus.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 ml-7">
                  {catsWithConsensus.map((cat) => (
                    <div
                      key={cat.slug}
                      className="border border-base-300 rounded-lg overflow-hidden"
                    >
                      <div className="px-4 py-3 bg-base-200 font-semibold">
                        {cat.categoryName}
                      </div>
                      <div className="p-4 flex flex-wrap gap-1">
                        {cat.consensusMatchers.map((name) => (
                          <span
                            key={name}
                            className="badge badge-sm badge-info"
                          >
                            {name}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-base-content/40 italic ml-7">
                  Nikdo se neshoduje s celkovým posudkem v žádné kategorii.
                </p>
              );
            })()}
          </details>

          {/* 3. Ojedinělé tipy na 1. místo */}
          <details open className="group">
            <summary className="cursor-pointer list-none flex items-center gap-2 mb-3">
              <ChevronDown className="w-5 h-5 transition-transform group-open:rotate-0 -rotate-90 shrink-0" />
              <h2 className="text-lg font-bold">
                🎯 Ojedinělé tipy na 1. místo
              </h2>
              <span className="badge badge-sm badge-error">+ subjektivita</span>
            </summary>
            <p className="text-sm text-base-content/60 mb-3 ml-7">
              Nominace, kde pouze jeden respondent tipoval daný film na 1.
              místo.
            </p>
            {(() => {
              const catsWithUnique = objectivityCategories.filter(
                (c) => c.uniqueFirstPlaces.length > 0
              );
              return catsWithUnique.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 ml-7">
                  {catsWithUnique.map((cat) => (
                    <div
                      key={cat.slug}
                      className="border border-base-300 rounded-lg overflow-hidden"
                    >
                      <div className="px-4 py-3 bg-base-200 font-semibold">
                        {cat.categoryName}
                      </div>
                      <ul className="p-4 space-y-1.5">
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
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-base-content/40 italic ml-7">
                  Žádné ojedinělé tipy.
                </p>
              );
            })()}
          </details>

          {/* 4. Odklonění se od vysoce preferovaných tipů */}
          {majorityDivergence.length > 0 && (
            <details open className="group">
              <summary className="cursor-pointer list-none flex items-center gap-2 mb-3">
                <ChevronDown className="w-5 h-5 transition-transform group-open:rotate-0 -rotate-90 shrink-0" />
                <h2 className="text-lg font-bold">
                  🚫 Odklonění se od vysoce preferovaných tipů
                </h2>
                <span className="badge badge-sm badge-error">+ subjektivita</span>
              </summary>
              <p className="text-sm text-base-content/60 mb-3 ml-7">
                Kategorie, kde se 10+ respondentů shodlo na 1. místě — kdo
                tipoval jinak?
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 ml-7">
                {majorityDivergence.map((item) => (
                  <div
                    key={item.slug}
                    className="border border-base-300 rounded-lg overflow-hidden"
                  >
                    <div className="px-4 py-3 bg-base-200">
                      <span className="font-semibold">{item.categoryName}</span>
                      <span className="text-base-content/60 text-sm ml-2">
                        ({item.majorityCount}× {item.majorityMovie})
                      </span>
                    </div>
                    <ul className="p-4 space-y-1.5">
                      {item.divergers.map((d, idx) => (
                        <li
                          key={idx}
                          className="text-sm flex items-center gap-2"
                        >
                          <span className="badge badge-sm badge-warning shrink-0">
                            {d.userName}
                          </span>
                          <span className="text-base-content/70">
                            {d.pickedMovie}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </details>
          )}

          {/* 5. Žebříček objektivity / subjektivity */}
          <details open className="group">
            <summary className="cursor-pointer list-none flex items-center gap-2 mb-3">
              <ChevronDown className="w-5 h-5 transition-transform group-open:rotate-0 -rotate-90 shrink-0" />
              <h2 className="text-lg font-bold">
                📈 Žebříček objektivity / subjektivity
              </h2>
            </summary>
            <p className="text-sm text-base-content/60 mb-3 ml-7">
              Skóre: +1 za shodu s posudkem, +1 za shodu s respondenty, −1 za
              odklonění od většiny, −1 za ojedinělý tip na 1. místo.
            </p>
            <div className="border border-base-300 rounded-lg overflow-hidden max-w-2xl ml-7">
              <ul className="divide-y divide-base-300">
                {objectivityRanking.map((user, idx) => (
                  <li
                    key={user.userName}
                    className="flex items-center gap-3 px-4 py-3 text-sm"
                  >
                    <span className="w-6 h-6 flex items-center justify-center bg-amber-500 text-gray-900 font-bold rounded-full text-xs shrink-0">
                      {idx + 1}
                    </span>
                    <span className="font-medium flex-1">{user.userName}</span>
                    <span className="flex items-center gap-1.5 flex-wrap justify-end">
                      {user.plusConsensus > 0 && (
                        <span className="badge badge-xs badge-info">
                          +{user.plusConsensus} posudek
                        </span>
                      )}
                      {user.plusMatching > 0 && (
                        <span className="badge badge-xs badge-success">
                          +{user.plusMatching} shoda
                        </span>
                      )}
                      {user.minusDivergence > 0 && (
                        <span className="badge badge-xs badge-warning">
                          −{user.minusDivergence} odklonění
                        </span>
                      )}
                      {user.minusUnique > 0 && (
                        <span className="badge badge-xs badge-error">
                          −{user.minusUnique} ojedinělý
                        </span>
                      )}
                    </span>
                    <span className="font-bold font-mono w-8 text-right">
                      {user.score > 0 ? '+' : ''}
                      {user.score}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </details>

          {/* Divider */}
          <div className="divider" />

          {/* 6. Shoda v 1. místech */}
          {firstPlaceAgreement.length > 0 && (
            <details open className="group">
              <summary className="cursor-pointer list-none flex items-center gap-2 mb-3">
                <ChevronDown className="w-5 h-5 transition-transform group-open:rotate-0 -rotate-90 shrink-0" />
                <h2 className="text-lg font-bold">
                  🏆 Shoda v 1. místech
                </h2>
              </summary>
              <p className="text-sm text-base-content/60 mb-3 ml-7">
                Kategorie, kde se na 1. místě shodlo alespoň 7 respondentů.
              </p>
              <div className="border border-base-300 rounded-lg overflow-hidden ml-7">
                <ul className="divide-y divide-base-300">
                  {firstPlaceAgreement.map((item) => (
                    <li
                      key={item.slug}
                      className="flex items-center justify-between px-4 py-3 text-sm"
                    >
                      <span>
                        <span className="font-semibold">{item.categoryName}</span>
                        <span className="text-base-content/60">
                          {' '}— {item.movieName}
                        </span>
                      </span>
                      <span className="badge badge-success font-mono">
                        {item.count}× shoda
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </details>
          )}

          {/* 7. Těsné souboje */}
          {closeBattles.length > 0 && (
            <details open className="group">
              <summary className="cursor-pointer list-none flex items-center gap-2 mb-3">
                <ChevronDown className="w-5 h-5 transition-transform group-open:rotate-0 -rotate-90 shrink-0" />
                <h2 className="text-lg font-bold">
                  ⚔️ Těsné souboje
                </h2>
              </summary>
              <p className="text-sm text-base-content/60 mb-3 ml-7">
                Kategorie, kde dva filmy na 1. místě získaly alespoň 5 hlasů
                každý.
              </p>
              <div className="border border-base-300 rounded-lg overflow-hidden ml-7">
                <ul className="divide-y divide-base-300">
                  {closeBattles.map((b) => (
                    <li key={b.slug} className="px-4 py-3 text-sm">
                      <div className="font-semibold mb-1">{b.categoryName}</div>
                      <div className="flex items-center gap-2">
                        <span className="badge badge-sm badge-neutral font-mono">
                          {b.countA}×
                        </span>
                        <span>{b.movieA}</span>
                        <span className="text-base-content/40 font-bold">vs</span>
                        <span className="badge badge-sm badge-neutral font-mono">
                          {b.countB}×
                        </span>
                        <span>{b.movieB}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </details>
          )}

          {/* 8. Všichni na stejném místě */}
          <details open className="group">
            <summary className="cursor-pointer list-none flex items-center gap-2 mb-3">
              <ChevronDown className="w-5 h-5 transition-transform group-open:rotate-0 -rotate-90 shrink-0" />
              <h2 className="text-lg font-bold">
                ✅ Všichni na stejném místě
              </h2>
            </summary>
            {(() => {
              const perfect = unanimousPlacements.filter(
                (p) => p.agreedCount === p.totalCount
              );
              const nearMiss = unanimousPlacements.filter(
                (p) => p.agreedCount < p.totalCount
              );
              return (
                <div className="ml-7 space-y-4">
                  {perfect.length > 0 ? (
                    <p className="text-sm text-base-content/60">
                      Naprostá shoda ({numRespondents}/{numRespondents}) nastala
                      u <span className="font-semibold">{perfect.length}</span>{' '}
                      {perfect.length === 1
                        ? 'nominace'
                        : perfect.length <= 4
                        ? 'nominací'
                        : 'nominací'}
                      .
                    </p>
                  ) : (
                    <p className="text-sm text-base-content/60">
                      Naprostá shoda ({numRespondents}/{numRespondents}) nenastala
                      u žádné nominace.
                      {nearMiss.length > 0 &&
                        ' Nejtěsnější případy:'}
                    </p>
                  )}
                  {unanimousPlacements.length > 0 ? (
                    <div className="border border-base-300 rounded-lg overflow-hidden">
                      <ul className="divide-y divide-base-300">
                        {unanimousPlacements.map((item, idx) => {
                          const isPerfect =
                            item.agreedCount === item.totalCount;
                          return (
                            <li
                              key={idx}
                              className="flex items-center justify-between gap-2 px-4 py-3 text-sm"
                            >
                              <span className="min-w-0">
                                <span className="font-semibold">
                                  {item.categoryName}
                                </span>
                                <span className="text-base-content/60">
                                  {' '}— {item.movieName}
                                </span>
                              </span>
                              <span className="flex items-center gap-2 shrink-0">
                                <span
                                  className={`badge font-mono ${
                                    isPerfect
                                      ? 'badge-success'
                                      : 'badge-neutral'
                                  }`}
                                >
                                  {item.position}. místo
                                </span>
                                <span
                                  className={`badge font-mono ${
                                    isPerfect
                                      ? 'badge-success'
                                      : 'badge-warning'
                                  }`}
                                >
                                  {item.agreedCount} z {item.totalCount}
                                </span>
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ) : (
                    <p className="text-sm text-base-content/40 italic">
                      Žádná shoda na pozici u žádné nominace.
                    </p>
                  )}
                </div>
              );
            })()}
          </details>
        </div>
      )}
    </div>
  );
}
