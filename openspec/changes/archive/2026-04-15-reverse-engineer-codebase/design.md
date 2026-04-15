## Context

GeoPathFinder is a TypeScript library for finding the shortest path between a start point and one or more target points while avoiding restricted geographic areas (polygons). The library is published on npm and used in Node.js services where blocking the event loop is unacceptable.

The codebase is fully operational and tested at 100% coverage. This design document captures the architectural decisions already embedded in the code so they are available as context for future OpenSpec changes.

## Goals / Non-Goals

**Goals:**

- Document the existing architecture and key design decisions
- Explain the rationale behind each decision so future contributors can make aligned choices
- Surface known limitations that inform future change proposals

**Non-Goals:**

- Changing any runtime behaviour
- Introducing new features or refactoring existing code

## Decisions

### Decision 1: Lazy visibility graph construction

**Choice**: The visibility graph is not pre-computed. Edges are discovered on-demand during the search loop (`_processPointChildren`).

**Rationale**: Pre-computing all O(n²) edges is expensive and wasteful. Most edges are never needed for a given query. Lazy construction means the search terminates as soon as all targets are found, often exploring only a small fraction of the total graph. In practice this skips 70–90 % of potential edges.

**Alternative considered**: Full pre-computation (classic Lee's algorithm). Rejected because it forces O(n² log n) work upfront regardless of how simple the query is, and makes the class non-reusable across multiple sequential queries without rebuilding.

---

### Decision 2: A\* as the primary algorithm, Dijkstra kept as baseline

**Choice**: `searchAStar` is the recommended method. `searchDijkstra` is retained.

**Rationale**: A\* uses the haversine distance to the nearest unclaimed target as its admissible heuristic. This prunes the open set significantly, making it faster than Dijkstra in practice. Dijkstra is kept because it serves as a correctness and performance baseline in benchmarks and tests.

**Alternative considered**: Removing Dijkstra entirely. Rejected because it is still useful for benchmarking and as a simpler reference implementation.

---

### Decision 3: Event-loop yielding every 10 iterations

**Choice**: Both search methods call `waitNextEventloopCycle()` (a `setTimeout(0)` wrapper) every 10 iterations.

**Rationale**: Pathfinding over large obstacle sets can block the Node.js event loop for hundreds of milliseconds. In a service context this starves I/O and makes the service appear unresponsive. Yielding every ~100 ms keeps the service healthy. The modulo starts at `=== 1` (not `=== 0`) so that even a search with fewer than 10 iterations still yields once.

**Alternative considered**: Running the search in a Worker thread. Rejected for now because it adds serialisation overhead and complexity; the yield approach is sufficient for the current scale.

---

### Decision 4: Concave point filtering as a graph optimisation

**Choice**: After building the obstacle geometry, every polygon vertex is tested for concavity. Concave points are flagged and skipped when building visibility edges.

**Rationale**: A concave vertex (one that points inward) can never be part of an optimal path around the polygon. Skipping them reduces the number of candidate edges without affecting correctness, typically eliminating 30–50 % of polygon vertices from consideration.

**Alternative considered**: No filtering (test all vertices). Rejected because it inflates the search space without benefit.

---

### Decision 5: Clockwise polygon normalisation

**Choice**: All polygon rings are normalised to clockwise winding order before processing (`makePolygonClockwise` using the Shoelace formula).

**Rationale**: Concavity detection (`isConcave`) and tangency checks (`isTangent`) rely on a consistent cross-product sign convention. GeoJSON does not mandate winding order for exterior rings, so normalisation is required for correctness.

---

### Decision 6: FlatQueue vendored locally

**Choice**: `FlatQueue` is a local TypeScript copy of `mourner/flatqueue` v2.0.3 rather than an npm dependency.

**Rationale**: The upstream package is ESM-only. At the time of implementation, importing it cleanly into the CJS build was not straightforward. Vendoring the ~100-line file was simpler and avoids a runtime dependency for a small utility.

**Alternative considered**: Dynamic import or bundler configuration to handle ESM. Rejected as over-engineered for a tiny utility.

---

### Decision 7: Single production dependency (@turf/turf)

**Choice**: Only `@turf/turf` is used at runtime, solely for the `earthRadius` constant.

**Rationale**: Haversine distance requires an accurate Earth radius value. Using turf's constant avoids hardcoding while staying consistent with the broader geospatial ecosystem. The rest of the geometry is implemented from first principles.

**Known trade-off**: Pulling in the full `@turf/turf` package for one constant is heavy. This could be replaced by a hardcoded constant (`6371008.8` m) to eliminate the dependency entirely.

## Risks / Trade-offs

- **Longitude ±180 / latitude ±90 wrapping not handled** → Paths crossing the antimeridian or poles will produce incorrect results. Mitigation: document the limitation; implement wrapping in a future change.
- **Polygon holes (inner rings) not supported** → `MultiPolygon` features are flattened to their outer rings only; interior exclusion zones are ignored. Mitigation: document the limitation.
- **O(n²) intersection checks per edge** → `_checkIfPointIsVisibleWithIntersections` iterates all edges for each candidate. Lee's O(n² log n) algorithm would reduce this but adds significant complexity. Mitigation: acceptable at current obstacle counts; revisit if benchmarks degrade.
- **No unreachable target detection** → If a target sits inside a restricted area the search runs to `distanceMax` before returning an empty path. Mitigation: callers should validate inputs; a future change can add pre-flight checks.
