## ADDED Requirements

### Requirement: NodePoint represents a graph vertex

`NodePoint` SHALL store a graph vertex with a unique numeric `id`, `x` (longitude) and `y` (latitude) coordinates, an `isTarget` flag, and optional `prevPoint` / `nextPoint` references to its neighbours in the polygon ring. It SHALL expose `computeConcave()` to set `isConcave` and `toCoords()` to return `[x, y]`.

#### Scenario: Construction from coordinate array

- **WHEN** a `NodePoint` is constructed with `coords = [lng, lat]`, `id`, and optional `isTarget`
- **THEN** `x` SHALL equal `lng`, `y` SHALL equal `lat`, and `isTarget` SHALL default to `false`

#### Scenario: toCoords returns longitude-latitude pair

- **WHEN** `toCoords()` is called
- **THEN** it SHALL return `[x, y]` (i.e. `[longitude, latitude]`)

#### Scenario: computeConcave delegates to geometryUtils

- **WHEN** `computeConcave()` is called after `prevPoint` and `nextPoint` are set
- **THEN** `isConcave` SHALL reflect the result of `isConcave(this)` from `geometryUtils`

---

### Requirement: Edge represents a polygon boundary segment

`Edge` SHALL store a directed boundary segment between two `NodePoint` values (`p1`, `p2`). It SHALL expose `containsPoint(point)` which returns `true` if `point` is either endpoint.

#### Scenario: containsPoint with endpoint

- **WHEN** `containsPoint` is called with one of the edge's own endpoints
- **THEN** it SHALL return `true`

#### Scenario: containsPoint with unrelated point

- **WHEN** `containsPoint` is called with a point that is neither endpoint
- **THEN** it SHALL return `false`

---

### Requirement: FlatQueue is a min-heap priority queue

`FlatQueue<T>` SHALL implement a binary min-heap. `push(id, priority)` SHALL insert an item in O(log n). `pop()` SHALL remove and return the item with the lowest priority value in O(log n). `peek()` and `peekValue()` SHALL return the head item/value without removing it. `clear()` SHALL reset the queue to empty in O(1). The `length` getter SHALL return the current number of items.

#### Scenario: Pop returns lowest priority first

- **WHEN** items are pushed with different priorities
- **THEN** `pop()` SHALL return them in ascending priority order

#### Scenario: Empty queue returns undefined

- **WHEN** `pop()` or `peek()` is called on an empty queue
- **THEN** both SHALL return `undefined`

#### Scenario: clear resets length to zero

- **WHEN** `clear()` is called after pushing items
- **THEN** `length` SHALL be `0` and `pop()` SHALL return `undefined`
