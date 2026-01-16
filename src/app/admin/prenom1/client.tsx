'use client';

import { useState } from 'react';

interface UserData {
  id: string;
  name: string;
  email: string;
  rankings: {
    ranking: number;
    movieName: string;
  }[];
}

interface Props {
  users: UserData[];
}

export function Prenom1GuessesClient({ users }: Props) {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(
    users[0]?.id ?? null
  );

  const selectedUser = users.find((u) => u.id === selectedUserId);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">
        Prenominační kolo - tipy účastníků
      </h1>

      <div className="flex gap-6">
        {/* User tabs on the left */}
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
                    <span className="font-medium">{user.name}</span>
                    <span className="text-xs text-base-content/60">
                      {user.rankings.length > 0
                        ? `${user.rankings.length} tipů`
                        : 'Žádné tipy'}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Rankings on the right */}
        <div className="flex-1">
          {selectedUser ? (
            <div className="bg-base-100 rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">
                {selectedUser.name}
              </h2>

              {selectedUser.rankings.length > 0 ? (
                <ol className="space-y-2">
                  {selectedUser.rankings.map((item) => (
                    <li
                      key={item.ranking}
                      className="flex items-center gap-3 p-3 bg-base-200 rounded-lg"
                    >
                      <span className="w-8 h-8 flex items-center justify-center bg-amber-500 text-gray-900 font-bold rounded-full">
                        {item.ranking}
                      </span>
                      <span>
                        ZATÍM TAJNÉ
                        {/* {item.movieName} */}
                      </span>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-base-content/60 italic">Žádné tipy</p>
              )}
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
