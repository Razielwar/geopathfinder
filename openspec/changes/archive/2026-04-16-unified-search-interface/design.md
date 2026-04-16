## Context

Currently, `VisibilityGraph` exposes two public search methods: `searchAStar(distanceMax: number): Promise<number[][]>` and `searchDijkstra(distanceMax: number): Promise<number[][]>`. These methods share significant implementation details (visibility edge computation, path reconstruction, event-loop yielding) but require separate public API entry points. This fragmentation makes it difficult to extend the library with new algorithms (e.g., Lee's algorithm for maze solving) without further proliferating public methods.

## Goals / Non-Goals

**Goals:**

- Unify search methods into a single `search()` method with configurable algorithm via `SearchOptions`
- Maintain backward compatibility for benchmarking by keeping implementations accessible (as private methods)
- Improve type safety with a dedicated `LonLat` type alias
- Enable future extensibility (new algorithms, distance units, visibility computation strategies) without breaking the API

**Non-Goals:**

- Implementing Lee's algorithm (reserved for future change)
- Adding input validation with Zod (deferred to future change)
- Modifying visibility graph construction logic
- Supporting polygon inner rings (holes) or coordinate wrapping

## Decisions

### 1. New types file structure

**Decision:** Create `src/types.ts` with `LonLat` type alias and `SearchOptions` interface.

```typescript
export type LonLat = [number, number];

export interface SearchOptions {
  shortestPathAlgorithm?: ShortestPathAlgorithm;
}

export const SHORTEST_PATH_ALGORITHMS = {
  A_STAR: 'a*',
  DIJKSTRA: 'dijkstra',
} as const;

export type ShortestPathAlgorithm = (typeof SHORTEST_PATH_ALGORITHMS)[keyof typeof SHORTEST_PATH_ALGORITHMS];

export const DefaultSearchOptions: SearchOptions = {
  shortestPathAlgorithm: SHORTEST_PATH_ALGORITHMS.A_STAR,
};
```

**Rationale:** Centralizes type definitions in a dedicated file following the project's convention of separating utilities and models. Using `as const` enables tree-shakeable constants and automatic type inference.

**Alternative considered:** Adding types directly to `VisibilityGraph.ts` — rejected for violating single-responsibility principle and making exports less explicit.

---

### 2. Algorithm selection with fallback

**Decision:** Invalid `shortestPathAlgorithm` values fallback to `'a*'` without throwing errors.

**Rationale:** Per user requirement, no input validation is performed at this stage. This simplifies the implementation and defers validation to a future Zod-based solution.

**Alternative considered:** Throw on invalid algorithm — rejected per user requirement.

---

### 3. Private method naming

**Decision:** Rename `searchAStar` → `_searchAStar` and `searchDijkstra` → `_searchDijkstra`.

**Rationale:** The underscore prefix is required by the project's linting rules (see AGENTS.md). This clearly marks these methods as internal while preserving the implementations for benchmarking and future algorithm additions.

---

### 4. Return type change

**Decision:** Change return type from `Promise<number[][]>` to `Promise<LonLat[]>`.

**Rationale:** Provides stronger type semantics and improves API usability. Users can use `LonLat` type for their own code.

**Alternative considered:** Keep `number[][]` — rejected in favor of stronger typing per user request.

---

### 5. Search options default value

**Decision:** Use a default parameter: `search(distanceMax: number, options: SearchOptions = DefaultSearchOptions)`.

**Rationale:** Simplifies the calling API for common use cases while allowing optional configuration.

---

## Risks / Trade-offs

**[Risk] Breaking API change** → Users must migrate from `searchAStar()` / `searchDijkstra()` calls. Mitigation: Document migration path clearly in CHANGELOG and README. This is an accepted breaking change for version 0.2.0.

**[Risk] Test suite requires updates** → Tests in `VisibilityGraph.spec.ts` and `test/visibilityGraphUtils.ts` must use the new interface. Mitigation: Update all test files to use `search()` with options.

**[Risk] Benchmark code divergence** → Benchmarks should use the same unified interface to ensure fair algorithm comparison. Mitigation: Update `benchmark/pathfinding.ts` to use `search()` with configurable algorithm.
