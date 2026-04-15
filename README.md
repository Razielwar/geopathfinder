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

TO BE COMPLETED
benchmark results
link to other libraries

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

// Search for the shortest path with a maximum distance of 2000 km
graph.searchAStar(2000).then((path) => {
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

- `distanceMax` (number): Maximum search distance in kilometers. Search terminates early if all paths exceed this threshold.

**Return Value:**

Returns a Promise that resolves to an array of coordinate pairs `[[lon, lat], ...]` representing the path from start to target. Returns `[]` if no path is found within distanceMax.

**Example:**

```typescript
const graph = new VisibilityGraph(start, obstacles, targets);
const path = await graph.searchAStar(2000);
// path: [[0, 0], [5.1, 4.8], [10, 10]]
```

## Future Improvements

- Implementation of Lee's algorithm to detect valid paths using clockwise order for performance improvements.
- Support for holes in polygons.

## Known Limitations

- Polygon edges crossing the date line (±180°) or poles (±90°) may not be handled correctly
- GeoJSON Polygon "holes" (inner rings) are not currently supported
- Targets placed inside restricted areas are not detected (caller should validate)

## Performance

### Practical Performance

- **Small graphs** (10-50 targets, <100 polygon vertices): constructor <10ms, search 10-100ms
- **Medium graphs** (50-200 targets, 100-500 vertices): constructor 20-100ms, search 100-500ms
- Lazy evaluation typically explores only 10-30% of possible visibility edges

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
