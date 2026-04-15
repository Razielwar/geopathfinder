# GeoPathFinder

[![CI/CD](https://github.com/Razielwar/geopathfinder/actions/workflows/ci.yml/badge.svg)](https://github.com/Razielwar/geopathfinder/actions/workflows/ci.yml)
[![npm version](https://badge.fury.io/js/geopathfinder.svg)](https://badge.fury.io/js/geopathfinder)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

GeoPathFinder is a **TypeScript library for geodesic-aware pathfinding using visibility graphs with GeoJSON inputs**. It solves the multi-destination visibility graph pathfinding problem on geodetic coordinates:

- Accepts geographic coordinates (latitude/longitude)
- Supports multiple destination targets in a single query
- Avoids polygonal obstacles (restricted areas)
- Returns shortest paths using geodesic distance calculations

## Key Innovation

Unlike traditional visibility graph implementations that pre-compute the entire graph, GeoPathFinder uses **lazy evaluation**: the visibility graph is built step-by-step during the search process, only generating visibility edges when needed. This approach dramatically improves performance by avoiding wasted computation.

## Features

- **Geodesic-aware**: Uses Haversine formula for accurate distance calculations on Earth
- **Multi-target support**: Find paths to multiple destinations in one search
- **Performance optimizations**:
  - Lazy visibility graph construction
  - Concave vertex filtering (reduces unnecessary edges)
  - Tangency checking to exclude inward-pointing lines
  - A\* search with heuristic guidance
- **GeoJSON integration**: Direct support for GeoJSON Point and Polygon features
- **Event loop aware**: Long operations yield to event loop to prevent blocking

## Key Differences

The key difference with what is existing currently about visibility graph implementation on the web is the performance as we do not build the whole visibility graph but build it step by step on the need when searching the best solution. It allows to avoid wasting time.

## Benchmark Results

The following benchmarks were run on an Intel i7-13850HX (2.10 GHz) with Node.js v24. Tests measure operations per second (higher is better).

### Test Scenarios

| Scenario | Polygons | Vertices | Targets |
| -------- | -------- | -------- | ------- |
| Small    | 2        | 12       | 1       |
| Medium   | 7        | 40       | 2       |
| Large    | 15       | 93       | 3       |
| XLarge   | 32       | 187      | 4       |
| XXLarge  | ~60      | ~370     | 5       |

### Results

| Scenario | Graph Construction | A\* Search  | Dijkstra    |
| -------- | ------------------ | ----------- | ----------- |
| Small    | 79,255 ops/sec     | 802 ops/sec | 451 ops/sec |
| Medium   | 200,686 ops/sec    | 830 ops/sec | 212 ops/sec |
| Large    | 107,762 ops/sec    | 778 ops/sec | 81 ops/sec  |
| XLarge   | 81,699 ops/sec     | 77 ops/sec  | 36 ops/sec  |
| XXLarge  | 52,702 ops/sec     | 22 ops/sec  | 15 ops/sec  |

### Key Findings

- **A\* is ~2x faster than Dijkstra** across all scenarios due to heuristic guidance
- **Graph construction is very fast** (sub-millisecond for all scenarios) thanks to lazy evaluation
- **Search complexity scales** with graph size, as expected for visibility graph algorithms

### Comparison with Other Libraries

GeoPathFinder differs from similar libraries (like [rowanwins/visibility-graph](https://github.com/rowanwins/visibility-graph)) in its approach:

| Feature            | GeoPathFinder    | rowanwins/visibility-graph |
| ------------------ | ---------------- | -------------------------- |
| Graph Construction | Lazy (on-demand) | Eager (pre-computed)       |
| Pathfinding        | Built-in A\*     | ngraph.path                |
| Geodesic support   | Yes (Haversine)  | Planar only                |

The lazy evaluation approach means we only compute visibility edges when needed during the search, avoiding wasted computation when exploring only a fraction of the graph.

### Run Benchmarks

```bash
yarn bench:pathfinding
```

### Profiling

To analyze CPU and memory usage in detail:

```bash
yarn clinic:doctor   # Doctor report
yarn clinic:flame    # Flame graph
```

## Installation

```bash
yarn add geopathfinder
```

or

```bash
npm install geopathfinder
```

## Usage

### Basic Example

```typescript
import { VisibilityGraph } from 'geopathfinder';
import type { Feature, Point, Polygon } from 'geojson';

const start: Feature<Point> = {
  type: 'Feature',
  geometry: {
    type: 'Point',
    coordinates: [0, 0],
  },
  properties: {},
};

const targets: Feature<Point>[] = [
  {
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [10, 10],
    },
    properties: {},
  },
];

const obstacles: Feature<Polygon>[] = [
  {
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [5, 5],
          [6, 5],
          [6, 6],
          [5, 6],
          [5, 5],
        ],
      ],
    },
    properties: {},
  },
];

const graph = new VisibilityGraph(start, obstacles, targets);

// Search for the shortest path with a maximum distance of 2 000 000 m (2000 km)
graph.searchAStar(2_000_000).then((path) => {
  console.log(path);
});
```

## API

### VisibilityGraph

```typescript
new VisibilityGraph(start, restrictedAreas, targets);
```

**Constructor Parameters:**

| Parameter         | Type                                 | Description                  |
| ----------------- | ------------------------------------ | ---------------------------- |
| `start`           | `Feature<Point>`                     | Starting point (origin)      |
| `restrictedAreas` | `Feature<Polygon \| MultiPolygon>[]` | Array of polygonal obstacles |
| `targets`         | `Feature<Point>[]`                   | Array of destination points  |

**Methods:**

| Method                        | Returns               | Description                                            |
| ----------------------------- | --------------------- | ------------------------------------------------------ |
| `searchAStar(distanceMax)`    | `Promise<number[][]>` | Find shortest path using A\* algorithm                 |
| `searchDijkstra(distanceMax)` | `Promise<number[][]>` | Find shortest path using Dijkstra's algorithm (legacy) |

**Parameters:**

- `distanceMax` (number): Maximum search distance in **metres**. Search terminates early if all paths exceed this threshold.

**Return Value:**

Returns a Promise that resolves to an array of coordinate pairs `[[lon, lat], ...]` representing the path from start to target. Returns `[]` if no path is found within distanceMax.

**Example:**

```typescript
const graph = new VisibilityGraph(start, obstacles, targets);
const path = await graph.searchAStar(2_000_000); // 2000 km in metres
// path: [[0, 0], [5.1, 4.8], [10, 10]]
```

## Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

This project uses **OpenSpec** with Kilo Code to manage non-trivial changes. See [doc/OPENSPEC-GUIDE.md](doc/OPENSPEC-GUIDE.md) for the full workflow.

## Future Improvements

- Implementation of Lee's algorithm to detect valid paths using clockwise order for performance improvements.
- Support for holes in polygons.
- **Cached visibility edges**: Store discovered visibility edges during lazy evaluation. When the environment (obstacles) is static but multiple searches are needed (different start/target positions), cached edges can be reused for faster subsequent searches. This hybrid approach combines lazy evaluation's benefits with incremental graph building.

## Known Limitations

- Polygon edges crossing the date line (±180°) or poles (±90°) may not be handled correctly
- GeoJSON Polygon "holes" (inner rings) are not currently supported
- Targets placed inside restricted areas are not detected (caller should validate)

## Algorith description

### Visibility Graph Generation

**Visibility graphs** are used to determine which points (nodes) are directly visible to each other — meaning a straight line between them does not intersect any obstacles (edges or polygons).

Algorithms for Visibility Determination

- **Naive Approach (O(n²))**:
  For each point, check against all other points whether the connecting line intersects any existing edge.

- **Optimized Approach — Lee’s Algorithm (O(n log n))**:
  More efficient than the naive approach. **_Not implemented yet_**

#### Optimization Techniques

To reduce the complexity of the visibility graph:

- Ignore concave vertices of polygons — these are less likely to contribute to valid paths.

- Exclude lines directed into obstacles — such paths are infeasible.

- Lazy Evaluation of visibility links — generate connections only when required during the search.

Applying these optimizations can significantly reduce the number of visibility edges. For example, in the figure below, five links are removed by filtering out concave vertices and inward-pointing lines, leaving only the valid visibility edges (in blue).

![Visibility Graph Optimisation](./doc/visibility-graph-optimisation.png)

Below is a visual representation of the environment after applying all visibility graph optimizations. Obstacles are shown in grey, the start position is marked in black, and the target position is marked in green. The blue lines represent the computed visibility graph, incorporating all previously described optimizations (e.g., excluding concave vertices and inward-facing lines).

As a result, the graph is significantly reduced in complexity, focusing only on meaningful visibility connections.

![Visibility Graph Calculation](./doc/visibility-graph-calculation.png)

### Search Algorithm

To perform pathfinding within the graph, several algorithms can be used:

- **Dijkstra’s Algorithm**: A classic approach that guarantees the shortest path but may be inefficient in large graphs.

- **A (A-Star) Algorithm**: Currently implemented in this project. It improves efficiency by using a heuristic — specifically, the Haversine distance from the current node to the closest landing point — to guide the search.

**Distance max Constraint**

To prevent the algorithm from exploring the entire graph when no solution is possible, we introduce a maximum search distance (Dmax). The search will terminate early if all candidate paths exceed this threshold.

## References

- Visibility Graphs Overview: [Smith College – Visibility Graphs](https://www.science.smith.edu/~istreinu/Teaching/Courses/274/Spring98/Projects/Philip/fp/visibility.htm)

- Related Topics:
  - [Reduced Visibility Graphs](https://www.cs.cmu.edu/~motionplanning/lecture/Chap5-RoadMap-Methods_howie.pdf)
  - [Lee’s Algorithm (O(n² log n))](https://dav.ee/papers/Visibility_Graph_Algorithm.pdf)
  - [Visibility graphs by Haarika Koneru](https://www.cs.kent.edu/~dragan/ST-Spring2016/visibility%20graphs.pdf)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
