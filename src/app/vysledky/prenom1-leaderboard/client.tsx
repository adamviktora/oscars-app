'use client';

import { Fragment, useState } from 'react';
import { Trophy, Medal, ChevronDown, ChevronUp } from 'lucide-react';

interface UserScore {
  id: string;
  name: string;
  email: string;
  successCount: number;
  rankSum: number;
  preferencePoints: number;
  position: number;
  successfulMovies: { name: string; rank: number; points: number }[];
}

interface Props {
  users: UserScore[];
  totalUsers: number;
  prizeAmount: number;
  nominatedCount: number;
}

// Helper to determine gender-appropriate winner label
// Czech female first names typically end in "a" or "e"
const getWinnerLabel = (winners: UserScore[]): string => {
  if (winners.length > 1) {
    return 'Vítězové';
  }
  const firstName = winners[0]?.name.split(' ')[0]?.toLowerCase() || '';
  const lastChar = firstName.slice(-1);
  return lastChar === 'a' || lastChar === 'e' ? 'Vítězka' : 'Vítěz';
};

export function Prenom1LeaderboardClient({
  users,
  totalUsers,
  prizeAmount,
  nominatedCount,
}: Props) {
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  const winners = users.filter((u) => u.position === 1);

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

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">
          Žebříček - Prenominační kolo
        </h1>
        <p className="text-base-content/60">Výsledky prenominačního kola.</p>
      </div>

      {/* Winner Announcement */}
      {users.length > 0 && (
        <div className="relative overflow-hidden rounded-2xl bg-linear-to-r from-yellow-500 via-amber-400 to-yellow-500 p-1 mb-6">
          <div className="relative rounded-xl bg-linear-to-br from-yellow-950 via-amber-950 to-yellow-950 px-6 py-8 text-center">
            {/* Decorative elements */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,rgba(251,191,36,0.15),transparent_70%)]" />
            <div className="absolute top-4 left-4 text-4xl opacity-20">✨</div>
            <div className="absolute top-4 right-4 text-4xl opacity-20">✨</div>
            <div className="absolute bottom-4 left-8 text-3xl opacity-15">
              🎬
            </div>
            <div className="absolute bottom-4 right-8 text-3xl opacity-15">
              🎬
            </div>

            <div className="relative">
              <Trophy className="w-16 h-16 mx-auto mb-4 text-yellow-400 drop-shadow-[0_0_15px_rgba(251,191,36,0.5)]" />

              <p className="text-yellow-400/80 text-sm uppercase tracking-widest mb-2">
                {getWinnerLabel(winners)} prenominačního kola
              </p>

              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">
                {winners.map((u) => u.name).join(' & ')}
              </h2>

              <div className="flex items-center justify-center gap-2 text-yellow-300 mb-4">
                <span className="text-lg">
                  {winners[0]?.successCount} úspěšných tipů
                </span>
              </div>

              <div className="inline-flex items-center gap-2 bg-yellow-400/20 border border-yellow-400/30 rounded-full px-6 py-2">
                <span className="text-yellow-300 text-sm">Odměna:</span>
                <span className="text-2xl font-bold text-white">
                  {winners.length > 1
                    ? `${Math.floor(prizeAmount / winners.length)} Kč`
                    : `${prizeAmount} Kč`}
                </span>
                {winners.length > 1 && (
                  <span className="text-yellow-400/70 text-sm">/ osoba</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard */}
      <div className="card bg-base-100 shadow-sm">
        <div className="card-body p-0">
          <div className="overflow-x-auto">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th className="w-16">Pořadí</th>
                  <th>Jméno</th>
                  <th className="text-center">Úspěšné tipy</th>
                  <th className="text-center hidden sm:table-cell">
                    Součet pozic
                  </th>
                  <th className="text-center hidden md:table-cell">
                    Objektivita tipů
                  </th>
                  <th className="w-12"></th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <Fragment key={user.id}>
                    <tr
                      key={user.id}
                      className={`cursor-pointer hover:bg-base-200 ${
                        expandedUser === user.id ? 'bg-base-200' : ''
                      }`}
                      onClick={() =>
                        setExpandedUser(
                          expandedUser === user.id ? null : user.id
                        )
                      }
                    >
                      <td>
                        <div
                          className={`flex items-center justify-center gap-1 w-10 h-10 rounded-full font-bold ${getPositionStyle(
                            user.position
                          )}`}
                        >
                          {getPositionIcon(user.position) || user.position}
                        </div>
                      </td>
                      <td>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-xs text-base-content/50 sm:hidden">
                          Pozice: {user.rankSum} | Pref: {user.preferencePoints}
                        </div>
                      </td>
                      <td className="text-center">
                        <span className="badge badge-lg badge-primary">
                          {user.successCount} / {nominatedCount}
                        </span>
                      </td>
                      <td className="text-center hidden sm:table-cell">
                        {user.successCount > 0 ? user.rankSum : '–'}
                      </td>
                      <td className="text-center hidden md:table-cell">
                        {user.successCount > 0 ? user.preferencePoints : '–'}
                      </td>
                      <td>
                        {user.successCount > 0 &&
                          (expandedUser === user.id ? (
                            <ChevronUp className="w-5 h-5 text-base-content/50" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-base-content/50" />
                          ))}
                      </td>
                    </tr>
                    {expandedUser === user.id && user.successCount > 0 && (
                      <tr key={`${user.id}-detail`}>
                        <td colSpan={6} className="bg-base-200/50 p-4">
                          <div className="text-sm font-medium mb-2">
                            Úspěšné tipy:
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                            {user.successfulMovies.map((movie, idx) => (
                              <div
                                key={idx}
                                className="flex items-center gap-2 bg-base-100 rounded-lg px-3 py-2"
                              >
                                <span className="badge badge-sm badge-success">
                                  #{movie.rank}
                                </span>
                                <span className="flex-1 truncate">
                                  {movie.name}
                                </span>
                                <span className="text-xs text-base-content/50">
                                  ({movie.points} b.)
                                </span>
                              </div>
                            ))}
                          </div>
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

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-6">
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body py-4">
            <div className="text-sm text-base-content/60">Počet účastníků</div>
            <div className="text-2xl font-bold">{totalUsers}</div>
          </div>
        </div>
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body py-4">
            <div className="text-sm text-base-content/60">
              Nominovaných filmů
            </div>
            <div className="text-2xl font-bold">{nominatedCount}</div>
          </div>
        </div>
        <div className="card bg-primary text-primary-content shadow-sm">
          <div className="card-body py-4">
            <div className="text-sm opacity-80">Odměna pro vítěze</div>
            <div className="text-2xl font-bold">{prizeAmount} Kč</div>
          </div>
        </div>
      </div>

      {/* Scoring explanation */}
      <div className="collapse collapse-arrow bg-base-100 mt-6">
        <input type="checkbox" />
        <div className="collapse-title font-medium">Jak se počítá pořadí?</div>
        <div className="collapse-content text-sm text-base-content/70 space-y-2">
          <p>
            <strong>1. Počet úspěšných tipů</strong> – Kolik filmů z vašeho top
            10 bylo skutečně nominováno. Více = lepší.
          </p>
          <p>
            <strong>2. Součet pozic</strong> – Pokud je remíza, rozhoduje součet
            pořadí úspěšných tipů. Nižší = lepší (tipy na pozicích 1-8 jsou
            lepší než 3-10).
          </p>
          <p>
            <strong>3. Riskantnost tipů</strong> – Pokud je stále remíza,
            rozhodují body z celkové preference (žebříček objektivity). Nižší =
            lepší (riskantnější tipy).
          </p>
        </div>
      </div>
    </div>
  );
}
