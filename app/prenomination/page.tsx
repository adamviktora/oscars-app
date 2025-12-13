'use client';

import { useEffect, useState } from 'react';
import Movie, { MovieData, Rating } from './components/movie';

interface MovieSelection {
  id: number;
  movieId: number;
  rating: string;
  ranking: number | null;
}

export default function PrenominationPage() {
  const [movies, setMovies] = useState<MovieData[]>([]);
  const [selections, setSelections] = useState<Map<number, MovieSelection>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Načíst filmy (vždy) a selections (pokud existují)
    const loadData = async () => {
      try {
        // Nejdřív načíst filmy - to je povinné
        const moviesRes = await fetch('/api/movie-prenom');
        if (!moviesRes.ok) throw new Error('Failed to fetch movies');
        const moviesData = await moviesRes.json();
        setMovies(moviesData);
        
        // Zkusit načíst selections - pokud selže, prostě pokračuj bez nich
        try {
          const selectionsRes = await fetch('/api/movie-selection-prenom');
          if (selectionsRes.ok) {
            const selectionsData = await selectionsRes.json();
            
            // Převést selections na Map pro rychlý přístup
            const selectionsMap = new Map();
            selectionsData.forEach((sel: MovieSelection) => {
              selectionsMap.set(sel.movieId, sel);
            });
            setSelections(selectionsMap);
          }
          // Pokud selections selžou (401, 404, atd.), jen pokračuj bez nich
        } catch {
          console.log('No existing selections found, starting fresh');
        }
        
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Prenominační kolo</h1>

      {loading && <p>Načítání filmů...</p>}

      {error && <p className="text-red-500">Error: {error}</p>}

      {!loading && !error && (
        <div className="grid gap-4">
          {movies.map((movie) => {
            const selection = selections.get(movie.id);
            return (
              <Movie 
                key={movie.id} 
                id={movie.id} 
                name={movie.name}
                initialRating={selection?.rating as Rating || null}
                initialRanking={selection?.ranking || null}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
