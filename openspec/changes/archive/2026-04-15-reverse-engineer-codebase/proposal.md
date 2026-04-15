## Why

The project has an operational codebase with no corresponding OpenSpec documentation. Before making any modifications, a spec-driven baseline is needed so that future changes can be proposed, designed, and tracked through OpenSpec with full context.

## What Changes

- No code changes — this is a documentation-only change
- Creates OpenSpec specs capturing the current behaviour of all existing capabilities
- Establishes `openspec/config.yaml` project context so future `openspec instructions` calls are well-informed

## Capabilities

### New Capabilities

- `visibility-graph`: Core class that builds a visibility graph from GeoJSON obstacles and runs pathfinding searches (constructor, `searchAStar`, `searchDijkstra`)
- `pathfinding-algorithms`: A\* and Dijkstra search algorithms operating on the lazy visibility graph, including event-loop yielding strategy
- `geometry-utils`: Geometric primitives used during graph construction and search — haversine distance, edge intersection, orientation, tangency, concavity detection, polygon winding
- `data-models`: Internal data structures — `NodePoint` (graph vertex with concavity tracking), `Edge` (polygon boundary segment), `FlatQueue` (binary-heap priority queue)

### Modified Capabilities

<!-- No existing specs — this is the initial baseline -->

## Impact

- No runtime code is affected
- Adds `openspec/changes/reverse-engineer-codebase/` artifacts
- Adds `openspec/specs/<capability>/spec.md` for each capability listed above
- Enriches `openspec/config.yaml` with project context and rules
