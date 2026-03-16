'use client';

import {
  Fragment,
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
} from 'react';
import {
  Trophy,
  Medal,
  ChevronDown,
  ChevronUp,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { sortByCategory } from '@/lib/category-order';
import { NOMINATION_CASH } from '@/lib/nomination-cash';

const POOL_PER_PERSON = 350;
const REST_RATIO = [110, 20, 15, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
const REST_RATIO_SUM = REST_RATIO.reduce((a, b) => a + b, 0);

interface CategoryResult {
  cash: number;
  ranking: number | null;
}

interface LeaderboardEntry {
  userId: string;
  name: string;
  total: number;
  firstPlaces: number;
  prenom2Total: number;
  categories: Record<string, CategoryResult>;
}

interface AnnouncedCategory {
  categoryId: number;
  categoryName: string;
  categorySlug: string;
  categoryOrder: number;
  winnerName: string;
  movieName: string;
  actorName: string | null;
}

interface CategoryInfo {
  id: number;
  name: string;
  slug: string;
  order: number;
  announced: boolean;
}

interface ResultsData {
  leaderboard: LeaderboardEntry[];
  announcedCategories: AnnouncedCategory[];
  allCategories: CategoryInfo[];
  isAdmin: boolean;
}

const getPositionStyle = (position: number) => {
  switch (position) {
    case 1:
      return 'bg-yellow-500 text-yellow-950';
    case 2:
      return 'bg-gray-400 text-gray-900';
    case 3:
      return 'bg-amber-600 text-amber-950';
    default:
      return 'bg-base-300 text-base-content';
  }
};

const getPositionIcon = (position: number) => {
  switch (position) {
    case 1:
      return <Trophy className="w-5 h-5" />;
    case 2:
    case 3:
      return <Medal className="w-5 h-5" />;
    default:
      return null;
  }
};

export function LiveResultsClient() {
  const [data, setData] = useState<ResultsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set()
  );
  const [highlightedSlug, setHighlightedSlug] = useState<string | null>(null);
  const [showPrenom2, setShowPrenom2] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  const fetchResults = useCallback(async () => {
    try {
      const res = await fetch('/api/oscar-results');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchResults();

    const es = new EventSource('/api/oscar-results/stream');
    eventSourceRef.current = es;

    es.onopen = () => setConnected(true);
    es.onerror = () => setConnected(false);

    es.addEventListener('winner-announced', (event) => {
      const { categorySlug } = JSON.parse(event.data);

      setHighlightedSlug(categorySlug);
      setTimeout(() => setHighlightedSlug(null), 3000);

      setExpandedCategories((prev) => new Set([...prev, categorySlug]));

      fetchResults();
    });

    return () => {
      es.close();
      eventSourceRef.current = null;
    };
  }, [fetchResults]);

  const toggleCategory = (slug: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) {
        next.delete(slug);
      } else {
        next.add(slug);
      }
      return next;
    });
  };

  const leaderboard = useMemo(() => data?.leaderboard ?? [], [data]);
  const isAdmin = data?.isAdmin ?? false;
  const announcedCategories = useMemo(
    () =>
      data
        ? sortByCategory(
            data.announcedCategories.map((c) => ({
              ...c,
              slug: c.categorySlug,
            }))
          )
        : [],
    [data]
  );
  const allCategories = useMemo(
    () => (data ? sortByCategory(data.allCategories) : []),
    [data]
  );
  const announcedSlugs = useMemo(
    () => new Set(announcedCategories.map((c) => c.categorySlug)),
    [announcedCategories]
  );

  const allAnnounced =
    allCategories.length > 0 &&
    announcedCategories.length === allCategories.length;

  useEffect(() => {
    if (allAnnounced) setShowPrenom2(true);
  }, [allAnnounced]);
  const totalPool = POOL_PER_PERSON * leaderboard.length;
  const totalEarned = leaderboard.reduce((sum, e) => sum + e.total, 0);

  type ComputedEntry = LeaderboardEntry & {
    position: number | null;
    restBonus: number;
    prenom2Applied: number;
    displayTotal: number;
  };

  const computed: ComputedEntry[] = useMemo(() => {
    if (leaderboard.length === 0) return [];

    // Step 1: Base order by current cash (as delivered from API)
    const baseEntries = leaderboard.map((e, i) => ({
      ...e,
      basePosition: i,
    }));
    const baseByUserId = new Map(baseEntries.map((e) => [e.userId, e]));

    // Step 2: Create a fixed target order using full Prenom 2.0 totals
    const fixedOrder = [...baseEntries];
    if (showPrenom2 && allAnnounced) {
      fixedOrder.sort((a, b) => {
        const aT = a.total + a.prenom2Total;
        const bT = b.total + b.prenom2Total;
        if (bT !== aT) return bT - aT;
        return b.firstPlaces - a.firstPlaces;
      });
    }

    // Step 3: For fixed order, apply only minimal prenom needed for that position
    const prenom2AppliedMap = new Map<string, number>();
    if (showPrenom2 && allAnnounced) {
      for (let fixedPos = 0; fixedPos < fixedOrder.length; fixedPos++) {
        const user = fixedOrder[fixedPos];
        const baseUser = baseByUserId.get(user.userId);
        if (!baseUser) {
          prenom2AppliedMap.set(user.userId, 0);
          continue;
        }

        // User keeps or loses position => no prenom needed.
        if (fixedPos >= baseUser.basePosition || user.prenom2Total === 0) {
          prenom2AppliedMap.set(user.userId, 0);
          continue;
        }

        // Minimal amount to beat the original owner of this target base position.
        const personAtTargetBasePosition = baseEntries[fixedPos];
        const needed = personAtTargetBasePosition.total + 1 - user.total;
        prenom2AppliedMap.set(
          user.userId,
          Math.max(0, Math.min(user.prenom2Total, needed))
        );
      }

      // If two neighbors are equal before rest distribution, boost the better
      // ranked one by +1 Kč (when possible) so pre-rest cash is not equal.
      for (let i = fixedOrder.length - 2; i >= 0; i--) {
        const better = fixedOrder[i];
        const worse = fixedOrder[i + 1];

        const betterApplied = prenom2AppliedMap.get(better.userId) ?? 0;
        const worseApplied = prenom2AppliedMap.get(worse.userId) ?? 0;
        const betterPreRestTotal = better.total + betterApplied;
        const worsePreRestTotal = worse.total + worseApplied;

        if (betterPreRestTotal === worsePreRestTotal) {
          const betterRemainingPrenom = better.prenom2Total - betterApplied;
          if (betterRemainingPrenom > 0) {
            prenom2AppliedMap.set(better.userId, betterApplied + 1);
          }
        }
      }
    }

    // Keep this order fixed from now on.
    const postPrenom2 = fixedOrder.map((entry) => {
      const prenom2Applied = prenom2AppliedMap.get(entry.userId) ?? 0;
      return { ...entry, prenom2Applied };
    });

    const totalPrenom2Applied =
      showPrenom2 && allAnnounced
        ? postPrenom2.reduce((sum, entry) => sum + entry.prenom2Applied, 0)
        : 0;
    const restMoneyForDistribution = Math.max(
      0,
      totalPool - totalEarned - totalPrenom2Applied
    );

    // Step 4: Assign rest bonus in fixed order (must not reorder anymore)
    const restBonusMap = new Map<string, number>();
    if (allAnnounced) {
      for (let i = 0; i < postPrenom2.length; i++) {
        const ratio = i < REST_RATIO.length ? REST_RATIO[i] : 0;
        restBonusMap.set(
          postPrenom2[i].userId,
          Math.round((restMoneyForDistribution * ratio) / REST_RATIO_SUM)
        );
      }
    }

    // Step 4: Build final entries
    const entries: ComputedEntry[] = postPrenom2.map((entry) => {
      const restBonus = restBonusMap.get(entry.userId) ?? 0;
      const displayTotal = entry.total + entry.prenom2Applied + restBonus;
      return {
        ...entry,
        restBonus,
        displayTotal,
        position: null,
      };
    });

    for (let i = 0; i < entries.length; i++) {
      if (entries[i].displayTotal === 0) {
        entries[i].position = null;
        continue;
      }
      let position = i + 1;
      if (
        i > 0 &&
        entries[i].displayTotal === entries[i - 1].displayTotal &&
        entries[i].firstPlaces === entries[i - 1].firstPlaces
      ) {
        position = entries[i - 1].position ?? i + 1;
      }
      entries[i].position = position;
    }

    return entries;
  }, [leaderboard, allAnnounced, totalEarned, totalPool, showPrenom2]);

  const totalPrenom2Applied = useMemo(
    () => computed.reduce((sum, entry) => sum + entry.prenom2Applied, 0),
    [computed]
  );
  const restMoney = Math.max(
    0,
    totalPool -
      totalEarned -
      (showPrenom2 && allAnnounced ? totalPrenom2Applied : 0)
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="alert alert-error">Nepodařilo se načíst výsledky.</div>
    );
  }

  const leader =
    computed.length > 0 && computed[0].displayTotal > 0 ? computed[0] : null;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">Oscarové výsledky LIVE</h1>
          <p className="text-base-content/60">
            {announcedCategories.length} / {allCategories.length} kategorií
            vyhlášeno
          </p>
        </div>
        <div className="flex items-center gap-2">
          {(allAnnounced || isAdmin) && (
            <label className="label cursor-pointer gap-2">
              <span className="label-text text-sm">Prenom 2.0</span>
              <input
                type="checkbox"
                className="toggle toggle-sm toggle-success"
                checked={showPrenom2}
                onChange={(e) => setShowPrenom2(e.target.checked)}
              />
            </label>
          )}
          {connected ? (
            <div className="badge badge-success gap-1">
              <Wifi className="w-3 h-3" />
              Připojeno
            </div>
          ) : (
            <div className="badge badge-error gap-1">
              <WifiOff className="w-3 h-3" />
              Odpojeno
            </div>
          )}
        </div>
      </div>

      {/* Winner Announcement Card */}
      {leader && (
        <div className="relative overflow-hidden rounded-2xl bg-linear-to-r from-yellow-500 via-amber-400 to-yellow-500 p-1 mb-6">
          <div className="relative rounded-xl bg-linear-to-br from-yellow-950 via-amber-950 to-yellow-950 px-6 py-8 text-center">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,rgba(251,191,36,0.15),transparent_70%)]" />
            <div className="absolute top-4 left-4 text-4xl opacity-20">✨</div>
            <div className="absolute top-4 right-4 text-4xl opacity-20">✨</div>
            <div className="absolute bottom-4 left-8 text-3xl opacity-15">
              🏆
            </div>
            <div className="absolute bottom-4 right-8 text-3xl opacity-15">
              🏆
            </div>

            <div className="relative">
              <Trophy className="w-16 h-16 mx-auto mb-4 text-yellow-400 drop-shadow-[0_0_15px_rgba(251,191,36,0.5)]" />

              <p className="text-yellow-400/80 text-sm uppercase tracking-widest mb-2">
                Aktuální lídr
              </p>

              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">
                {leader.name}
              </h2>

              <div className="flex items-center justify-center gap-4 text-yellow-300 mb-4">
                <span className="text-lg">
                  {leader.firstPlaces}x tip na 1. místo
                </span>
              </div>

              <div className="inline-flex items-center gap-2 bg-black/30 border border-yellow-400/30 rounded-full px-6 py-3">
                <span className="text-yellow-300 text-sm">Celkem:</span>
                <span className="text-3xl font-bold text-yellow-300 drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]">
                  {leader.displayTotal} Kč
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard Table */}
      <div className="card bg-base-100 shadow-sm mb-8">
        <div className="card-body p-0">
          <div className="overflow-x-auto">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th className="w-16">Pořadí</th>
                  <th>Jméno</th>
                  <th className="text-center">Kč</th>
                  <th className="text-center hidden sm:table-cell">
                    Tipů na 1. místo
                  </th>
                  <th className="w-12"></th>
                </tr>
              </thead>
              <tbody>
                {computed.map((entry) => (
                  <Fragment key={entry.userId}>
                    <tr
                      className={`cursor-pointer hover:bg-base-200 ${
                        expandedUser === entry.userId ? 'bg-base-200' : ''
                      }`}
                      onClick={() =>
                        setExpandedUser(
                          expandedUser === entry.userId ? null : entry.userId
                        )
                      }
                    >
                      <td>
                        {entry.position !== null ? (
                          <div
                            className={`flex items-center justify-center gap-1 w-10 h-10 rounded-full font-bold ${getPositionStyle(
                              entry.position
                            )}`}
                          >
                            {getPositionIcon(entry.position) || entry.position}
                          </div>
                        ) : (
                          <div className="flex items-center justify-center w-10 h-10 text-base-content/30 font-bold">
                            —
                          </div>
                        )}
                      </td>
                      <td>
                        <div className="font-medium text-lg">
                          {entry.name}
                          {entry.prenom2Applied > 0 && (
                            <span className="text-xs text-success/50 ml-1.5">
                              (posun díky prenominačnímu kolu 2.0)
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-base-content/50 sm:hidden">
                          {entry.firstPlaces}x tip na 1. místo
                        </div>
                      </td>
                      <td className="text-center">
                        <div className="flex flex-col items-center gap-0.5">
                          <span className="badge badge-lg badge-warning text-base font-bold text-warning-content whitespace-nowrap">
                            {entry.displayTotal} Kč
                          </span>
                          <span className="text-sm text-base-content/80 tabular-nums font-medium">
                            <span>{entry.total} Kč</span>
                            <span className="text-accent">
                              {' '}
                              + {entry.prenom2Applied}
                            </span>
                            <span className="text-info"> + {entry.restBonus}</span>
                          </span>
                        </div>
                      </td>
                      <td className="text-center hidden sm:table-cell tabular-nums">
                        {entry.firstPlaces}
                      </td>
                      <td>
                        {expandedUser === entry.userId ? (
                          <ChevronUp className="w-5 h-5 text-base-content/50" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-base-content/50" />
                        )}
                      </td>
                    </tr>
                    {expandedUser === entry.userId && (
                      <tr key={`${entry.userId}-detail`}>
                        <td colSpan={5} className="bg-base-200/50 p-4">
                          <div className="text-sm font-medium mb-2">
                            Zisky podle kategorií:
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                            {announcedCategories.map((cat) => {
                              const result = entry.categories[cat.categorySlug];
                              const cash = result?.cash ?? 0;
                              const ranking = result?.ranking ?? null;
                              return (
                                <div
                                  key={cat.categorySlug}
                                  className="flex items-center gap-2 bg-base-100 rounded-lg px-3 py-2"
                                >
                                  <span
                                    className={`badge badge-sm ${
                                      cash > 0 ? 'badge-success' : 'badge-ghost'
                                    }`}
                                  >
                                    {cash} Kč
                                  </span>
                                  <span className="flex-1 truncate text-sm">
                                    {cat.categoryName}
                                  </span>
                                  <span className="text-xs text-base-content/50 shrink-0">
                                    {ranking !== null ? `${ranking}.` : '—'}
                                  </span>
                                </div>
                              );
                            })}
                            {announcedCategories.length === 0 && (
                              <div className="text-base-content/40 text-sm">
                                Zatím nebyla vyhlášena žádná kategorie.
                              </div>
                            )}
                          </div>
                          {(entry.restBonus > 0 ||
                            entry.prenom2Applied > 0) && (
                            <div className="mt-3 pt-3 border-t border-base-300 flex flex-wrap gap-3 text-sm">
                              {entry.restBonus > 0 && (
                                <div className="text-info">
                                  Zbytek: +{entry.restBonus} Kč
                                </div>
                              )}
                              {entry.prenom2Applied > 0 && (
                                <div className="text-accent">
                                  Prenom 2.0: +{entry.prenom2Applied} Kč
                                  <span className="text-base-content/40 ml-1">
                                    (z {entry.prenom2Total} Kč)
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Rest Money Info */}
      <div className="stats shadow mb-8 w-full">
        <div className="stat">
          <div className="stat-title">Celkový balík</div>
          <div className="stat-value text-lg">{totalPool} Kč</div>
          <div className="stat-desc">
            {leaderboard.length} účastníků × {POOL_PER_PERSON} Kč
          </div>
        </div>
        <div className="stat">
          <div className="stat-title">Získané peníze</div>
          <div className="stat-value text-lg">{totalEarned} Kč</div>
        </div>
        <div className="stat">
          <div className="stat-title">Zbylé peníze</div>
          <div className="stat-value text-lg text-info">{restMoney} Kč</div>
        </div>
      </div>

      {/* Movie Oscar Counts */}
      {announcedCategories.length > 0 &&
        (() => {
          const movieCounts = new Map<
            string,
            { count: number; categories: string[] }
          >();
          for (const ac of announcedCategories) {
            const movies = ac.movieName.split(' / ');
            for (let movie of movies) {
              if (ac.categorySlug === 'song') {
                const sep = movie.indexOf(' \u2013 ');
                if (sep !== -1) movie = movie.substring(0, sep);
              }
              const existing = movieCounts.get(movie);
              if (existing) {
                existing.count += 1;
                existing.categories.push(ac.categoryName);
              } else {
                movieCounts.set(movie, {
                  count: 1,
                  categories: [ac.categoryName],
                });
              }
            }
          }
          const sorted = [...movieCounts.entries()].sort(
            (a, b) => b[1].count - a[1].count
          );

          return (
            <div className="card bg-base-100 shadow-sm mb-8">
              <div className="card-body">
                <h2 className="card-title text-xl mb-2">Oscary podle filmů</h2>
                <div className="overflow-x-auto">
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th>Film</th>
                        <th className="text-center">Oscarů</th>
                        <th className="hidden sm:table-cell">Kategorie</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sorted.map(([movie, { count, categories }]) => (
                        <tr key={movie}>
                          <td className="font-medium">{movie}</td>
                          <td className="text-center">
                            <span className="badge badge-warning badge-sm font-bold">
                              {count}
                            </span>
                          </td>
                          <td className="hidden sm:table-cell text-sm text-base-content/60">
                            {categories.join(', ')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          );
        })()}

      {/* Categories */}
      <h2 className="text-xl font-bold mb-4">Kategorie</h2>
      <div className="space-y-2">
        {allCategories.map((cat) => {
          const announced = announcedSlugs.has(cat.slug);
          const winner = announcedCategories.find(
            (ac) => ac.categorySlug === cat.slug
          );
          const isExpanded = expandedCategories.has(cat.slug);
          const isHighlighted = highlightedSlug === cat.slug;

          return (
            <div
              key={cat.id}
              className={`card bg-base-100 shadow-sm transition-all duration-500 ${
                isHighlighted
                  ? 'ring-2 ring-warning ring-offset-2 ring-offset-base-200'
                  : ''
              }`}
            >
              <button
                onClick={() => announced && toggleCategory(cat.slug)}
                disabled={!announced}
                className={`w-full flex items-center justify-between p-4 text-left ${
                  announced
                    ? 'cursor-pointer hover:bg-base-200 rounded-lg'
                    : 'opacity-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  {announced ? (
                    <Trophy className="w-5 h-5 text-success shrink-0" />
                  ) : (
                    <span className="w-5 h-5 rounded-full border-2 border-base-300 inline-block shrink-0" />
                  )}
                  <div>
                    <div>
                      <span className="font-medium">{cat.name}</span>
                      {winner && (
                        <span className="text-success ml-2">
                          — {winner.winnerName}
                          {winner.actorName && (
                            <span className="text-success/60">
                              {' '}
                              ({winner.movieName})
                            </span>
                          )}
                        </span>
                      )}
                    </div>
                    {NOMINATION_CASH[cat.slug] && (
                      <div className="text-xs text-base-content/40 tabular-nums mt-0.5">
                        {NOMINATION_CASH[cat.slug].map((v, i) => (
                          <span key={i}>
                            {i > 0 && <span className="mx-0.5">·</span>}
                            {v}
                          </span>
                        ))}{' '}
                        Kč
                      </div>
                    )}
                  </div>
                </div>
                {announced &&
                  (isExpanded ? (
                    <ChevronUp className="w-4 h-4 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 shrink-0" />
                  ))}
              </button>

              {announced && isExpanded && (
                <div className="px-4 pb-4 border-t border-base-200">
                  <table className="table table-sm mt-2">
                    <thead>
                      <tr>
                        <th>Účastník</th>
                        <th className="text-center">Tip</th>
                        <th className="text-right">Zisk</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaderboard
                        .map((entry) => {
                          const result = entry.categories[cat.slug];
                          return {
                            name: entry.name,
                            cash: result?.cash ?? 0,
                            ranking: result?.ranking ?? null,
                          };
                        })
                        .sort((a, b) => b.cash - a.cash)
                        .map((row) => (
                          <tr key={row.name}>
                            <td>{row.name}</td>
                            <td className="text-center tabular-nums text-base-content/60">
                              {row.ranking !== null ? `${row.ranking}.` : '—'}
                            </td>
                            <td
                              className={`text-right tabular-nums ${
                                row.cash > 0
                                  ? 'text-success font-medium'
                                  : 'text-base-content/40'
                              }`}
                            >
                              {row.cash} Kč
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
