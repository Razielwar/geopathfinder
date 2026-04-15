## ADDED Requirements

### Requirement: Haversine geodesic distance

`haversineDistance` SHALL compute the great-circle distance in kilometres between two `NodePoint` values using the Haversine formula and the Earth radius constant from `@turf/turf` (converted from metres to kilometres).

#### Scenario: Distance between identical points

- **WHEN** both arguments are the same point
- **THEN** the result SHALL be `0`

#### Scenario: Known distance check

- **WHEN** called with two points approximately 1 degree of latitude apart at the equator
- **THEN** the result SHALL be approximately 111 km

---

### Requirement: Line segment intersection detection

`edgeIntersect` SHALL return `true` if and only if segment `p1q1` and segment `p2q2` intersect, using the cross-product orientation test. Collinear overlapping segments SHALL also return `true`.

#### Scenario: Crossing segments

- **WHEN** two segments clearly cross each other
- **THEN** `edgeIntersect` SHALL return `true`

#### Scenario: Non-crossing segments

- **WHEN** two segments do not cross and are not collinear-overlapping
- **THEN** `edgeIntersect` SHALL return `false`

#### Scenario: Collinear overlapping segments

- **WHEN** both segments lie on the same line and share a range
- **THEN** `edgeIntersect` SHALL return `true`

---

### Requirement: Orientation of ordered triplet

`orientation` SHALL return `1` for clockwise, `-1` for counter-clockwise, and `0` for collinear, using the cross-product `(q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x)`.

#### Scenario: Clockwise triplet

- **WHEN** points form a clockwise turn
- **THEN** `orientation` SHALL return `1`

#### Scenario: Collinear points

- **WHEN** all three points are on the same line
- **THEN** `orientation` SHALL return `0`

---

### Requirement: Tangency check for smooth path routing

`areTangent(p, q)` SHALL return `true` when the line `pq` is tangent (or collinear) to the polygon corner at both `p` and `q`. A point without `prevPoint`/`nextPoint` (start or target) SHALL always be considered tangent. This prevents the path from crossing through a polygon corner rather than going around it.

#### Scenario: Line tangent to both corners

- **WHEN** the line `pq` does not cross into either polygon at `p` or `q`
- **THEN** `areTangent` SHALL return `true`

#### Scenario: Line crosses a corner

- **WHEN** the line `pq` would enter the polygon at one of the corners
- **THEN** `areTangent` SHALL return `false`

#### Scenario: Start or target point (no polygon membership)

- **WHEN** either `p` or `q` has no `prevPoint`
- **THEN** `isTangent` for that point SHALL return `true`

---

### Requirement: Concavity detection for polygon vertices

`isConcave` SHALL return `true` for a `NodePoint` that has both `prevPoint` and `nextPoint` and where `orientation(prev, p, next) <= 0` (i.e. clockwise or collinear), indicating the vertex points inward and is not a useful waypoint.

#### Scenario: Convex vertex

- **WHEN** a polygon vertex is convex (outward-pointing)
- **THEN** `isConcave` SHALL return `false`

#### Scenario: Concave vertex

- **WHEN** a polygon vertex is concave (inward-pointing)
- **THEN** `isConcave` SHALL return `true`

---

### Requirement: Polygon clockwise normalisation

`makePolygonClockwise` SHALL reverse the coordinate array of a polygon ring if `isPolygonClockwise` returns `false`, ensuring all rings are in clockwise winding order. `isPolygonClockwise` SHALL use the Shoelace formula (signed area) to determine winding.

#### Scenario: Already clockwise ring

- **WHEN** the ring is already clockwise
- **THEN** `makePolygonClockwise` SHALL return it unchanged

#### Scenario: Counter-clockwise ring

- **WHEN** the ring is counter-clockwise
- **THEN** `makePolygonClockwise` SHALL return the reversed array
