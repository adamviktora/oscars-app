'use client';

import { useState } from 'react';
import { Trophy, Medal, ChevronDown, ChevronUp } from 'lucide-react';

interface CategoryResult {
  categoryId: number;
  categoryName: string;
  shortlistSize: number;
  correctGuesses: number;
  prize: number;
  correctMovies: string[];
  participated: boolean;
}

interface UserScore {
  id: string;
  name: string;
  totalPrize: number;
  position: number;
  categoryResults: CategoryResult[];
}

interface Props {
  users: UserScore[];
}

export function Prenom2LeaderboardClient({ users }: Props) {
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

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
          Žebříček - Prenominační kolo 2.0
        </h1>
        <p className="text-base-content/60">
          Hodnocení podle získaných Kč za správné tipy
        </p>
      </div>

      {/* Leaderboard */}
      <div className="card bg-base-100 shadow-sm">
        <div className="card-body p-0">
          <div className="overflow-x-auto">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th className="w-16">Pořadí</th>
                  <th>Jméno</th>
                  <th className="text-center">Celkový zisk</th>
                  <th className="w-12"></th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <>
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
                      </td>
                      <td className="text-center">
                        <span className="badge badge-lg badge-primary font-bold">
                          {user.totalPrize} Kč
                        </span>
                      </td>
                      <td>
                        {expandedUser === user.id ? (
                          <ChevronUp className="w-5 h-5 text-base-content/50" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-base-content/50" />
                        )}
                      </td>
                    </tr>
                    {expandedUser === user.id && (
                      <tr key={`${user.id}-detail`}>
                        <td colSpan={4} className="bg-base-200/50 p-4">
                          <div className="text-sm font-medium mb-3">
                            Výsledky podle kategorií:
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                            {user.categoryResults.map((cat) => (
                              <div
                                key={cat.categoryId}
                                className={`rounded-lg px-3 py-2 ${
                                  !cat.participated
                                    ? 'bg-orange-500/10 border border-orange-500/30 opacity-70'
                                    : cat.prize > 0
                                    ? 'bg-green-500/10 border border-green-500/30'
                                    : 'bg-base-100'
                                }`}
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <span
                                    className={`font-medium text-sm ${
                                      !cat.participated
                                        ? 'text-base-content/50'
                                        : ''
                                    }`}
                                  >
                                    {cat.categoryName}
                                  </span>
                                  {cat.prize > 0 ? (
                                    <span className="badge badge-success badge-sm">
                                      +{cat.prize} Kč
                                    </span>
                                  ) : (
                                    <span className="badge badge-ghost badge-sm text-base-content/40">
                                      +0 Kč
                                    </span>
                                  )}
                                </div>
                                <div
                                  className={`text-xs ${
                                    !cat.participated
                                      ? 'text-orange-400/80'
                                      : 'text-base-content/60'
                                  }`}
                                >
                                  {!cat.participated ? (
                                    'Nezúčastnil/a se'
                                  ) : (
                                    <>
                                      {cat.correctGuesses}/5 správně
                                      <span className="mx-1">•</span>
                                      shortlist: {cat.shortlistSize}
                                    </>
                                  )}
                                </div>
                                {cat.correctMovies.length > 0 && (
                                  <div className="text-xs text-green-400 mt-1">
                                    ✓ {cat.correctMovies.join(', ')}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Scoring explanation */}
      <div className="collapse collapse-arrow bg-base-100 mt-6">
        <input type="checkbox" />
        <div className="collapse-title font-medium">Jak se počítá zisk?</div>
        <div className="collapse-content text-sm text-base-content/70">
          <p className="mb-3">
            Výše zisku závisí na počtu správných tipů a velikosti shortlistu
            (počet filmů k výběru):
          </p>
          <div className="overflow-x-auto">
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>Správné tipy</th>
                  <th>10 filmů</th>
                  <th>15-16 filmů</th>
                  <th>20 filmů</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>5 shod</td>
                  <td>10 Kč</td>
                  <td>13 Kč</td>
                  <td>17 Kč</td>
                </tr>
                <tr>
                  <td>4 shody</td>
                  <td>5 Kč</td>
                  <td>6 Kč</td>
                  <td>8 Kč</td>
                </tr>
                <tr>
                  <td>3 shody</td>
                  <td>2 Kč</td>
                  <td>3 Kč</td>
                  <td>4 Kč</td>
                </tr>
                <tr>
                  <td>2 shody</td>
                  <td>0 Kč</td>
                  <td>0 Kč</td>
                  <td>1 Kč</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
