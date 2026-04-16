## Why

Currently, `VisibilityGraph` exposes two separate public methods: `searchAStar` and `searchDijkstra`. This creates API fragmentation and makes it difficult to extend with new pathfinding algorithms (e.g., Lee's algorithm) without breaking the public interface. Unifying these into a single `search()` method with configurable options will provide a cleaner, extensible API while preserving implementations for benchmarking.

## What Changes

- **New**: Create `src/types.ts` with `LonLat` type alias (`[number, number]`) and `SearchOptions` interface
- **New**: Add `SHORTEST_PATH_ALGORITHMS` constants with `as const` for type-safe algorithm selection
- **New**: Implement unified `search(distanceMax: number, options?: SearchOptions): Promise<LonLat[]>` method
- **New**: Export `LonLat`, `SearchOptions`, `SHORTEST_PATH_ALGORITHMS` from `index.ts`
- **BREAKING**: Change return type from `Promise<number[][]>` to `Promise<LonLat[]>`
- **BREAKING**: Rename `searchAStar` to private `_searchAStar`
- **BREAKING**: Rename `searchDijkstra` to private `_searchDijkstra`
- **Update**: Modify `test/visibilityGraphUtils.ts` to use `search()` with options
- **Update**: Modify `src/VisibilityGraph.spec.ts` to use `search()` with options
- **Update**: Modify `benchmark/pathfinding.ts` to use `search()` with options
- **Update**: Update `pathfinding-algorithms/spec.md` to reflect private method names
- **Update**: Update `visibility-graph/spec.md` to reflect new return type

## Capabilities

### New Capabilities

- `unified-search-api`: Unified search interface with configurable algorithm via `SearchOptions.shortestPathAlgorithm`

### Modified Capabilities

- `pathfinding-algorithms`: Update spec to reference private method names (`_searchAStar`, `_searchDijkstra`)
- `visibility-graph`: Update spec to reflect `Promise<LonLat[]>` return type instead of `Promise<number[][]>`

## Impact

- **Public API**: Breaking change - users must migrate from `searchAStar()` / `searchDijkstra()` to `search(distanceMax, { shortestPathAlgorithm })`
- **Type exports**: New types exported from `index.ts`
- **Test suite**: Tests must use new unified interface
- **Benchmarks**: Benchmark functions must use new unified interface
