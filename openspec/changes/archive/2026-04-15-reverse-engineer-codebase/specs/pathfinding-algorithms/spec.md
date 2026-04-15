## ADDED Requirements

### Requirement: A\* search with geodesic heuristic

`searchAStar` SHALL implement the A\* algorithm using haversine distance to the nearest target as the admissible heuristic. The priority of each node in the open set SHALL be `g + h` where `g` is the actual geodesic distance from start and `h` is the minimum haversine distance to any unclaimed target.

#### Scenario: Heuristic guides search toward target

- **WHEN** `searchAStar` is called with a direct line-of-sight path to the target
- **THEN** it SHALL reach the target in fewer iterations than `searchDijkstra` on the same graph

#### Scenario: Nodes beyond distanceMax are pruned

- **WHEN** the estimated total distance `g + h` for a node exceeds `distanceMax`
- **THEN** that node SHALL NOT be added to the open set

#### Scenario: Heuristic is cached per node

- **WHEN** a node's heuristic value has already been computed
- **THEN** it SHALL be read from `heuristicMap` without recomputing

---

### Requirement: Dijkstra search as exhaustive baseline

`searchDijkstra` SHALL implement Dijkstra's algorithm without a heuristic. Every reachable node within `distanceMax` SHALL be explored in order of increasing geodesic distance from start until the first target is found or the open set is exhausted.

#### Scenario: First target terminates search

- **WHEN** `searchDijkstra` dequeues a node whose `isTarget` flag is true
- **THEN** the search SHALL immediately stop and reconstruct the path

#### Scenario: Duplicate nodes in queue are skipped

- **WHEN** a node is dequeued that has already been marked as visited
- **THEN** it SHALL be skipped without re-processing

---

### Requirement: Lazy visibility edge construction

Both algorithms SHALL build visibility edges on-demand during the search by calling `_processPointChildren`. No edges between non-adjacent points SHALL be pre-computed at construction time.

#### Scenario: Children computed per iteration

- **WHEN** a node is dequeued during search
- **THEN** `_processPointChildren` SHALL be called to find its visible, unvisited neighbours

#### Scenario: Concave points excluded from children

- **WHEN** `_processPointChildren` scans candidate neighbours
- **THEN** any point with `isConcave === true` SHALL be excluded from the result

---

### Requirement: Path reconstruction via predecessor array

Both algorithms SHALL maintain a `predecessors` integer array mapping each node id to the id of the node it was reached from. After search, `_buildPath` SHALL walk this array backward from the found target to the start and return the reversed sequence of coordinates.

#### Scenario: Path is start-to-target ordered

- **WHEN** `_buildPath` is called with a found target id
- **THEN** the returned array SHALL begin with the start coordinates and end with the target coordinates
