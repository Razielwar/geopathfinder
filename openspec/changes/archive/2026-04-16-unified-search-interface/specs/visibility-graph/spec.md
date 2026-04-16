## MODIFIED Requirements

### Requirement: Export shortest path as coordinate array

**FROM:** Both `searchAStar` and `searchDijkstra` SHALL return a `Promise<number[][]>` where each element is a `[longitude, latitude]` pair.

**TO:** The unified `search` method SHALL return a `Promise<LonLat[]>` where `LonLat` is a type alias for `[number, number]` representing `[longitude, latitude]`. The array SHALL be ordered from start to target. An empty array SHALL be returned when no path is found within `distanceMax`.

#### Scenario: Path found

- **WHEN** `search` is called with a valid `distanceMax` and a route exists within that distance
- **THEN** the returned array SHALL start with the start point coordinates and end with the target point coordinates

#### Scenario: No path within distance limit

- **WHEN** the target is reachable but `distanceMax` is smaller than the actual shortest distance
- **THEN** the returned array SHALL be empty (`[]`)

#### Scenario: Target unreachable (surrounded by obstacles)

- **WHEN** the target is fully enclosed by restricted areas
- **THEN** the returned array SHALL be empty (`[]`)

---

### Requirement: Non-blocking async execution

**FROM:** Both search methods SHALL yield to the Node.js event loop at least once every 10 search iterations

**TO:** The unified `search` method SHALL yield to the Node.js event loop at least once every 10 search iterations by awaiting a `setTimeout(0)` promise, ensuring the service remains responsive during long-running searches. This applies regardless of which `shortestPathAlgorithm` is selected.

#### Scenario: Event loop yield

- **WHEN** a search runs for more than 10 iterations
- **THEN** `waitNextEventloopCycle` SHALL be called at least once before the search completes

#### Scenario: Short search still yields

- **WHEN** a search completes in fewer than 10 iterations
- **THEN** `waitNextEventloopCycle` SHALL still be called exactly once (modulo starts at `=== 1`)
