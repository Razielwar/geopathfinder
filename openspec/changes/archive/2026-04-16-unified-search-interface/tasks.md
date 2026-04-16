## 1. Type Definitions

- [x] 1.1 Create `src/types.ts` with `LonLat` type alias (`[number, number]`)
- [x] 1.2 Add `SHORTEST_PATH_ALGORITHMS` constants with `as const` in `src/types.ts`
- [x] 1.3 Add `ShortestPathAlgorithm` type in `src/types.ts`
- [x] 1.4 Add `SearchOptions` interface in `src/types.ts`
- [x] 1.5 Add `DefaultSearchOptions` constant in `src/types.ts`

## 2. VisibilityGraph Updates

- [x] 2.1 Rename `searchAStar` to `_searchAStar` (private method)
- [x] 2.2 Rename `searchDijkstra` to `_searchDijkstra` (private method)
- [x] 2.3 Implement unified `search(distanceMax: number, options?: SearchOptions): Promise<LonLat[]>` method
- [x] 2.4 Update `_buildPath` return type to `LonLat[]`
- [x] 2.5 Update internal method calls to use `_searchAStar` / `_searchDijkstra`

## 3. Index Exports

- [x] 3.1 Export `LonLat` from `index.ts`
- [x] 3.2 Export `SearchOptions` from `index.ts`
- [x] 3.3 Export `ShortestPathAlgorithm` type from `index.ts`
- [x] 3.4 Export `SHORTEST_PATH_ALGORITHMS` from `index.ts`
- [x] 3.5 Export `DefaultSearchOptions` from `index.ts`

## 4. Test Suite Updates

- [x] 4.1 Update `test/visibilityGraphUtils.ts` to use `search()` with options
- [x] 4.2 Update `src/VisibilityGraph.spec.ts` to use `search()` with options

## 5. Benchmark Updates

- [x] 5.1 Update `benchmark/pathfinding.ts` to use `search()` with options

## 6. Verification

- [x] 6.1 Run `yarn build` to verify compilation
- [x] 6.2 Run `yarn test` to verify all tests pass with 100% coverage
- [x] 6.3 Run `yarn lint` to verify no lint errors
- [x] 6.4 Run `yarn bench` to verify benchmarks still work

## 7. Documentation Updates

- [x] 7.1 Update README.md usage example to use `search()` instead of `searchAStar`
- [x] 7.2 Update README.md API section with new `SearchOptions` parameter documentation
- [x] 7.3 Add code examples for explicit algorithm selection
