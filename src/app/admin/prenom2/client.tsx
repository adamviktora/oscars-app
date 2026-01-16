'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Check } from 'lucide-react';

interface CategorySelection {
  categoryId: number;
  categoryName: string;
  movies: string[];
}

interface UserData {
  id: string;
  name: string;
  email: string;
  completeCategories: number;
  totalCategories: number;
  categorySelections: CategorySelection[];
}

interface Props {
  users: UserData[];
}

export function Prenom2GuessesClient({ users }: Props) {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(
    users[0]?.id ?? null
  );
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(
    new Set()
  );

  const selectedUser = users.find((u) => u.id === selectedUserId);

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

  // Expand all categories when switching users
  const handleSelectUser = (userId: string) => {
    setSelectedUserId(userId);
    setExpandedCategories(new Set()); // Reset expanded state
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">
        Prenominační kolo 2.0 - tipy účastníků
      </h1>

      <div className="flex gap-6">
        {/* User tabs on the left */}
        <div className="w-64 shrink-0">
          <div className="bg-base-100 rounded-lg shadow overflow-hidden">
            <ul className="menu p-2">
              {users.map((user) => (
                <li key={user.id}>
                  <button
                    onClick={() => handleSelectUser(user.id)}
                    className={`flex flex-col items-start ${
                      selectedUserId === user.id ? 'active' : ''
                    }`}
                  >
                    <span className="font-medium">{user.name}</span>
                    <span className="text-xs text-base-content/60">
                      {user.completeCategories > 0 ? (
                        <span className="flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          {user.completeCategories} / {user.totalCategories} kategorií
                        </span>
                      ) : (
                        'Žádné tipy'
                      )}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Categories on the right */}
        <div className="flex-1">
          {selectedUser ? (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold mb-4">{selectedUser.name}</h2>

              {selectedUser.categorySelections.map((cat) => {
                const isExpanded = expandedCategories.has(cat.categoryId);
                const isComplete = cat.movies.length === 5;
                const hasSelections = cat.movies.length > 0;

                return (
                  <div
                    key={cat.categoryId}
                    className={`border rounded-lg overflow-hidden ${
                      isComplete ? 'border-green-500' : 'border-base-300'
                    }`}
                  >
                    {/* Category Header */}
                    <button
                      onClick={() => toggleCategory(cat.categoryId)}
                      className={`w-full p-3 flex items-center justify-between transition-colors ${
                        isComplete
                          ? 'bg-green-500/10'
                          : 'bg-base-200 hover:bg-base-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-medium">{cat.categoryName}</span>
                        <span
                          className={`badge badge-sm ${
                            isComplete ? 'badge-success' : 'badge-neutral'
                          }`}
                        >
                          {cat.movies.length} / 5
                        </span>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>

                    {/* Category Content */}
                    {isExpanded && (
                      <div className="p-3 bg-base-100">
                        {hasSelections ? (
                          <ul className="space-y-1">
                            {cat.movies.map((movie, idx) => (
                              <li
                                key={idx}
                                className="flex items-center gap-2 text-sm"
                              >
                                <span className="w-5 h-5 flex items-center justify-center bg-amber-500 text-gray-900 font-bold rounded-full text-xs">
                                  {idx + 1}
                                </span>
                                ZATÍM TAJNÉ
                                {/* {movie} */}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-base-content/60 italic text-sm">
                            Žádné tipy
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
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
