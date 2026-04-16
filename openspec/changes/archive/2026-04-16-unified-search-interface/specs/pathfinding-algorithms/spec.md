## MODIFIED Requirements

### Requirement: A\* search with geodesic heuristic

**FROM:** `searchAStar`  
**TO:** `_searchAStar`

`_searchAStar` SHALL implement the A\* algorithm using haversine distance to the nearest target as the admissible heuristic. The priority of each node in the open set SHALL be `g + h` where `g` is the actual geodesic distance from start and `h` is the minimum haversine distance to any unclaimed target.

#### Scenario: Heuristic guides search toward target

- **WHEN** `_searchAStar` is invoked via `search()` with `{ shortestPathAlgorithm: 'a*' }` and there is a direct line-of-sight path to the target
- **THEN** it SHALL reach the target in fewer iterations than `_searchDijkstra` on the same graph

#### Scenario: Nodes beyond distanceMax are pruned

- **WHEN** the estimated total distance `g + h` for a node exceeds `distanceMax`
- **THEN** that node SHALL NOT be added to the open set

#### Scenario: Heuristic is cached per node

- **WHEN** a node's heuristic value has already been computed
- **THEN** it SHALL be read from `heuristicMap` without recomputing

---

### Requirement: Dijkstra search as exhaustive baseline

**FROM:** `searchDijkstra`  
**TO:** `_searchDijkstra`

`_searchDijkstra` SHALL implement Dijkstra's algorithm without a heuristic. Every reachable node within `distanceMax` SHALL be explored in order of increasing geodesic distance from start until the first target is found or the open set is exhausted.

#### Scenario: First target terminates search

- **WHEN** `_searchDijkstra` dequeues a node whose `isTarget` flag is true
- **THEN** the search SHALL immediately stop and reconstruct the path

#### Scenario: Duplicate nodes in queue are skipped

- **WHEN** a node is dequeued that has already been marked as visited
- **THEN** it SHALL be skipped without re-processing
