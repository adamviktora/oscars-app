'use client';

interface MovieStats {
  id: number;
  name: string;
  points: number;
  frequency: number;
}

interface Props {
  movies: MovieStats[];
  maxFrequency: number;
}

export function Prenom1PreferencesClient({ movies, maxFrequency }: Props) {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Celková preference filmů</h1>
      <p className="text-base-content/60 mb-6">
        Prenominační kolo • Odevzdaných účastníků: {maxFrequency}
      </p>

      <div className="bg-base-100 rounded-lg shadow overflow-hidden">
        <table className="table w-full">
          <thead>
            <tr className="bg-base-200">
              <th className="w-16 text-center">#</th>
              <th>Film</th>
              <th className="w-32 text-center">Body</th>
              <th className="w-32 text-center">Četnost</th>
            </tr>
          </thead>
          <tbody>
            {movies.map((movie, index) => (
              <tr key={movie.id} className="hover:bg-base-200/50">
                <td className="text-center">
                  <span
                    className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold ${
                      index < 3
                        ? 'bg-amber-500 text-gray-900'
                        : index < 10
                        ? 'bg-amber-500/30 text-amber-200'
                        : 'bg-base-300 text-base-content/60'
                    }`}
                  >
                    {index + 1}
                  </span>
                </td>
                <td>
                  <span className="font-medium">{movie.name}</span>
                </td>
                <td className="text-center font-mono">{movie.points}</td>
                <td className="text-center">{movie.frequency}-krát</td>
              </tr>
            ))}
          </tbody>
        </table>

        {movies.length === 0 && (
          <div className="p-8 text-center text-base-content/60">
            Zatím žádná data
          </div>
        )}
      </div>
    </div>
  );
}
