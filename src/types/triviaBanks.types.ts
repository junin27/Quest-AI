/**
 * Tipos unificados para múltiplas fontes de trivia (APIs).
 * Abstrai as diferenças entre provedores para uma interface comum.
 */

export type TriviaBankProvider =
  | 'openTrivia'
  | 'jService'
  | 'bongoTrivia'
  | 'trivious'
  | 'theTriviaApi'
  | 'numbersApi'
  | 'dadJokes'
  | 'peterApi'
  | 'officialJokes';

export interface TriviaBankArea {
  id: string;
  name: string;
  provider: TriviaBankProvider;
}

export interface TriviaBankCategory {
  id: string;
  name: string;
  provider: TriviaBankProvider;
  areas?: TriviaBankArea[];
  questionCount?: number;
}

export interface TriviaBankQuestion {
  id: string;
  text: string;
  options: string[];
  correctIndex: number;
  provider: TriviaBankProvider;
  category: string;
  categoryId?: string;
  areaId?: string;
  areaName?: string;
  difficulty?: string;
  explanation?: string;
}

export interface TriviaBankFetchOptions {
  categoryId: string;
  areaIds?: string[];
  difficulty?: string;
  count: number;
}

export interface TriviaBankProviderResponse {
  questions: TriviaBankQuestion[];
  provider: TriviaBankProvider;
  error?: string;
}

export interface ConsolidatedCategoryMap {
  [normalizedName: string]: TriviaBankCategory[];
}

export interface CategoryWithProviders {
  id: string;
  name: string;
  providers: TriviaBankProvider[];
  areasAvailable: boolean;
  areasByProvider: Record<TriviaBankProvider, TriviaBankArea[]>;
}
