### Requirement: Construct visibility graph from GeoJSON inputs

The `VisibilityGraph` constructor SHALL accept a GeoJSON `Feature<Point>` as the start, an array of `Feature<Polygon | MultiPolygon>` as restricted areas, and an array of `Feature<Point>` as targets. It SHALL extract all polygon vertices and boundary edges, normalise polygon winding to clockwise, and flag concave vertices.

#### Scenario: Single polygon obstacle

- **WHEN** a `VisibilityGraph` is constructed with one rectangular polygon and one target
- **THEN** the internal `_edges` array SHALL contain exactly 4 edges and `_points` SHALL contain the 4 polygon corners plus the start and target

#### Scenario: MultiPolygon obstacle

- **WHEN** a `Feature<MultiPolygon>` with 2 polygons is passed as a restricted area
- **THEN** both polygons SHALL be flattened and processed independently, producing edges and points for each

#### Scenario: Clockwise normalisation

- **WHEN** a polygon ring is provided in counter-clockwise winding order
- **THEN** the constructor SHALL reverse it so all rings are clockwise before further processing

#### Scenario: Concave vertex detection

- **WHEN** a non-convex polygon is provided
- **THEN** concave vertices SHALL have `isConcave === true` after construction

---

### Requirement: Export shortest path as coordinate array

The unified `search` method SHALL return `Promise<LonLat[]>` where `LonLat` is a type alias for `[number, number]` representing `[longitude, latitude]`. The array SHALL be ordered from start to target. An empty array SHALL be returned when no path is found within `distanceMax`.

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

The unified `search` method SHALL yield to the Node.js event loop at least once every 10 search iterations by awaiting a `setTimeout(0)` promise, ensuring the service remains responsive during long-running searches. This applies regardless of which `shortestPathAlgorithm` is selected.

#### Scenario: Event loop yield

- **WHEN** a search runs for more than 10 iterations
- **THEN** `waitNextEventloopCycle` SHALL be called at least once before the search completes

#### Scenario: Short search still yields

- **WHEN** a search completes in fewer than 10 iterations
- **THEN** `waitNextEventloopCycle` SHALL still be called exactly once (modulo starts at `=== 1`)
