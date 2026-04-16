## ADDED Requirements

### Requirement: Unified search interface with configurable algorithm

The `search` method SHALL accept a `distanceMax` parameter and an optional `SearchOptions` object. When `SearchOptions.shortestPathAlgorithm` is omitted or invalid, it SHALL default to A\* algorithm.

#### Scenario: Default algorithm is A\*

- **WHEN** `search(distanceMax)` is called without options
- **THEN** it SHALL behave identically to the internal A\* algorithm

#### Scenario: Explicit A\* selection

- **WHEN** `search(distanceMax, { shortestPathAlgorithm: 'a*' })` is called
- **THEN** it SHALL execute the A\* algorithm and return the path

#### Scenario: Dijkstra algorithm selection

- **WHEN** `search(distanceMax, { shortestPathAlgorithm: 'dijkstra' })` is called
- **THEN** it SHALL execute the Dijkstra algorithm and return the path

#### Scenario: Invalid algorithm falls back to A\*

- **WHEN** `search(distanceMax, { shortestPathAlgorithm: 'invalid' })` is called
- **THEN** it SHALL fall back to and execute the A\* algorithm

---

### Requirement: Search returns LonLat array

The `search` method SHALL return `Promise<LonLat[]>` where `LonLat` is a type alias for `[number, number]` representing `[longitude, latitude]`.

#### Scenario: Path found with coordinates

- **WHEN** a path exists within `distanceMax`
- **THEN** the returned array SHALL contain `LonLat` pairs ordered from start to target

#### Scenario: No path returns empty array

- **WHEN** no path exists within `distanceMax`
- **THEN** the returned array SHALL be empty (`LonLat[]`)

---

### Requirement: SearchOptions exports

The `SearchOptions` interface, `ShortestPathAlgorithm` type, and `SHORTEST_PATH_ALGORITHMS` constants SHALL be exported from the main package entry point.

#### Scenario: Constants are importable

- **WHEN** a user imports `{ SHORTEST_PATH_ALGORITHMS }` from the package
- **THEN** `SHORTEST_PATH_ALGORITHMS.A_STAR` equals `'a*'` and `SHORTEST_PATH_ALGORITHMS.DIJKSTRA` equals `'dijkstra'`

#### Scenario: SearchOptions is importable

- **WHEN** a user imports `{ SearchOptions }` from the package
- **THEN** the type is usable with `shortestPathAlgorithm?: ShortestPathAlgorithm`
