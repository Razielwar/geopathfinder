export type LonLat = [number, number];

export const SHORTEST_PATH_ALGORITHMS = {
  A_STAR: 'a*',
  DIJKSTRA: 'dijkstra',
} as const;

export type ShortestPathAlgorithm = (typeof SHORTEST_PATH_ALGORITHMS)[keyof typeof SHORTEST_PATH_ALGORITHMS];

export interface SearchOptions {
  shortestPathAlgorithm?: ShortestPathAlgorithm;
}

export const DefaultSearchOptions: SearchOptions = {
  shortestPathAlgorithm: SHORTEST_PATH_ALGORITHMS.A_STAR,
};
