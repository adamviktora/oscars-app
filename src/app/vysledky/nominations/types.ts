export interface NominationEntry {
  ranking: number;
  movieName: string;
  actorName: string | null;
}

export interface CategoryRanking {
  categoryId: number;
  rankedCount: number;
  nominations: NominationEntry[];
}

export interface CategoryInfo {
  categoryId: number;
  categoryName: string;
  slug: string;
  isActorCategory: boolean;
  maxRanking: number;
}

export interface FirstPlaceMovie {
  movieName: string;
  count: number;
}

export interface UserData {
  id: string;
  name: string;
  finalSubmitted: boolean;
  prenom1Position: number | null;
  completeCategories: number;
  totalCategories: number;
  prenom2Bonus: number;
  firstPlaceMovies: FirstPlaceMovie[];
  uniqueAwardedMovies: number;
  categoryRankings: CategoryRanking[];
}
