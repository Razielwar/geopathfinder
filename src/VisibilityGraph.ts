import type { Feature, MultiPolygon, Point, Polygon } from 'geojson';
import { FlatQueue } from './utils/FlatQueue';
import { NodePoint } from './model/NodePoint';
import { Edge } from './model/Edge';
import { areTangent, edgeIntersect, haversineDistance, makePolygonClockwise } from './utils/geometryUtils';

function isPolygon(feature: Feature<Polygon | MultiPolygon>): feature is Feature<Polygon> {
  return feature.geometry.type === 'Polygon';
}

/**
 * Processing path planning is a very long processing that might block Node event loop for a long time. This
 *  induce major problems (no more I/O, no response from service API, etc). To avoid that we should force periodically
 *  path planning process to 'yield' current process to leave other event time to run.
 *
 *  Nota : each calls to this methods (with await) force node eventloop to complete a event loop cycle before to continue
 *  processing. It should be done frequently enough to ensure service is not block for a too long time but not too often
 *  because waiting for end of event loop induce small waste of time that could induce lost of processing performance
 *  if it is done too many times per seconds.
 *
 * see : https://snyk.io/blog/nodejs-how-even-quick-async-functions-can-block-the-event-loop-starve-io/
 */
function waitNextEventloopCycle() {
  return new Promise<void>((resolve) => {
    setTimeout(() => resolve(), 0);
  });
}

export class VisibilityGraph {
  private readonly _startPoint: NodePoint;
  private readonly _nbTargets: number;
  private _points: NodePoint[] = [];
  private _edges: Edge[] = [];

  // TODO see how to manage point around longitude -180/180 and latitude around -90/90

  public constructor(start: Feature<Point>, restrictedAreas: Feature<Polygon | MultiPolygon>[], targets: Feature<Point>[]) {
    // TODO: remove targeted points not reachable = points on restricted areas => can be done in caller to avoid doing it multiple times
    // add target points to array of points
    targets.forEach((target) => {
      this._createPoint(target.geometry.coordinates, true);
    });
    this._nbTargets = targets.length;

    // add start point to array of points
    this._startPoint = this._createPoint(start.geometry.coordinates);

    // TODO see how to manage inner polygons (polygons made of external and internal definition)
    // flatten coords of all polygons
    const polygonCoords = restrictedAreas.flatMap((feature) => {
      if (isPolygon(feature)) {
        return feature.geometry.coordinates.map((polygon) => makePolygonClockwise(polygon));
      }
      return (feature as Feature<MultiPolygon>).geometry.coordinates.flat().map((polygon) => makePolygonClockwise(polygon));
    });

    // extract edges and points from restrictedAreas
    for (const polygonCoord of polygonCoords) {
      const firstPoint = this._createPoint(polygonCoord[0]!);
      let prevPoint = firstPoint;
      // do not iterate to the last point as it is equal to the first point
      for (let ii = 1; ii < polygonCoord.length - 1; ii++) {
        const currentPoint = this._createPoint(polygonCoord[ii]!);
        this._createEdge(prevPoint, currentPoint);
        prevPoint = currentPoint;
      }

      // save closing edge: assumption in geojson first point is equal to last point
      this._createEdge(prevPoint, firstPoint);
    }

    // Detect all concave points to avoid linking them, this is an optimisation of the visibility graph
    // to limit the number of points as they are useless
    this._points.forEach((point) => point.computeConcave());

    console.info(
      `visibilityGraph nbEdges=${this._edges.length} nbPoints=${this._points.length} nbConcave=${this._points.filter((p) => p.isConcave).length}`
    );
  }

  /** *** Replaced by AStar ******* */
  /**
   * Search path to a target using dijkstra algorithm
   * Notes:
   *  - arrays of integer are used to save distance, predecessors and visited as from the benchmark
   *  they are quicker than object, Set and Map
   *  - flatqueue is used for priority queue, we can improve using heapify or changing collection inside it
   *  but it means we have to know the length in advance as this quicker solution does not allow capacity growing
   * @param distanceMax maximum search distance in metres
   */
  public async searchDijkstra(distanceMax: number): Promise<number[][]> {
    // init
    const distanceMap: number[] = [];
    const predecessors: number[] = [];
    const visitedNodes: boolean[] = [];
    const unvisitedNodes: FlatQueue = new FlatQueue(); // unvisited node we *want* to visit
    let targetFound;
    let nbIteration = 0;

    // add start point in priorityQueue and set its distance to 0.0
    distanceMap[this._startPoint.id] = 0;
    unvisitedNodes.push(this._startPoint.id, 0);

    while (unvisitedNodes.length > 0) {
      const currentPointId = unvisitedNodes.pop()!;
      nbIteration++;

      // force event loop cycle every 10 iteration in order to force service to process other event (io etc) so that
      // service is not blocked by this important processing. By experience one iteration last around 10 ms so we target
      // to yield process every 100ms.
      // nota : use module === 1 instand of 0 to ensure at each new search process is yield. These ensure that even
      // if we have a chain of search with less than 10 iteration process is yield regulary.
      if (nbIteration % 10 === 1) {
        await waitNextEventloopCycle(); // processing should be sequentially so await in loop is ok
      }

      // ignore duplicate as it is possible to add multiple time the same node in the queue
      if (!visitedNodes[currentPointId]) {
        // mark node as visited
        visitedNodes[currentPointId] = true;

        // exit if target found
        if (this._points[currentPointId]!.isTarget) {
          targetFound = currentPointId;
          break;
        }

        // get all children of the current point => only visible ones not already visited
        const children = this._processPointChildren(currentPointId, visitedNodes);
        this._searchDijkstraChildren(children, distanceMax, distanceMap, predecessors, currentPointId, unvisitedNodes);
      }
    }
    console.info(`search end at iteration ${nbIteration}`);
    return this._buildPath(targetFound, predecessors);
  }

  private _searchDijkstraChildren(
    children: NodePoint[],
    distanceMax: number,
    distanceMap: number[],
    predecessors: number[],
    currentPointId: number,
    unvisitedNodes: FlatQueue<number>
  ) {
    const currentPoint = this._points[currentPointId]!;
    const currentDistance = distanceMap[currentPointId]!;
    for (const childPoint of children) {
      const distance = currentDistance + haversineDistance(currentPoint, childPoint);
      // update distance and add the node to the queue if distance does not already exist or if a shorter path has been found
      if (distance <= distanceMax && (distanceMap[childPoint.id] === undefined || distanceMap[childPoint.id]! > distance)) {
        distanceMap[childPoint.id] = distance;

        predecessors[childPoint.id] = currentPointId; // used to retrieve the path at the end
        unvisitedNodes.push(childPoint.id, distance);
      }
    }
  }

  /**
   * Search path to a target using A Star algorithm
   * Notes:
   *  - arrays of integer are used to save distance, predecessors and visited as from the benchmark
   *  they are quicker than object, Set and Map
   *  - flatqueue is used for priority queue, we can improve using heapify or changing collection inside it
   *  but it means we have to know the length in advance as this quicker solution does not allow capacity growing
   * @param distanceMax maximum search distance in metres
   */
  public async searchAStar(distanceMax: number): Promise<number[][]> {
    // init
    const distanceMap: number[] = [];
    const heuristicMap: number[] = [];
    const predecessors: number[] = [];
    const visitedNodes: boolean[] = [];
    const unvisitedNodes: FlatQueue = new FlatQueue(); // unvisited node we *want* to visit
    let targetFound;
    let nbIteration = 0;

    // add start point in priorityQueue and set its distance to 0.0
    distanceMap[this._startPoint.id] = 0;
    unvisitedNodes.push(this._startPoint.id, 0);

    while (unvisitedNodes.length > 0) {
      const currentPointId = unvisitedNodes.pop()!;
      nbIteration++;

      // force event loop cycle every 10 iteration in order to force service to process other event (io etc) so that
      // service is not blocked by this important processing. By experience one iteration last around 10 ms so we target
      // to yield process every 100ms.
      // nota : use module === 1 instand of 0 to ensure at each new search process is yield. These ensure that even
      // if we have a chain of search with less than 10 iteration process is yield regulary.
      if (nbIteration % 10 === 1) {
        await waitNextEventloopCycle(); // processing should be sequentially so await in loop is ok
      }

      // ignore duplicate as it is possible to add multiple time the same node in the queue
      if (!visitedNodes[currentPointId]) {
        // mark node as visited
        visitedNodes[currentPointId] = true;

        // exit if target found
        if (this._points[currentPointId]!.isTarget) {
          targetFound = currentPointId;
          break;
        }

        // get all children of the current point => only visible ones not already visited
        const children = this._processPointChildren(currentPointId, visitedNodes);
        this._processAStarChildren(distanceMap, heuristicMap, predecessors, unvisitedNodes, currentPointId, children, distanceMax);
      }
    }
    console.info(`search end at iteration ${nbIteration}`);
    return this._buildPath(targetFound, predecessors);
  }

  private _processAStarChildren(
    distanceMap: number[],
    heuristicMap: number[],
    predecessors: number[],
    unvisitedNodes: FlatQueue,
    currentPointId: number,
    children: NodePoint[],
    distanceMax: number
  ) {
    const currentPoint = this._points[currentPointId]!;
    const currentDistance = distanceMap[currentPointId]!;

    for (const childPoint of children) {
      const distance = currentDistance + haversineDistance(currentPoint, childPoint);
      // update distance and add the node to the queue if distance does not already exist or if a shorter path has been found
      if (distance <= distanceMax && (distanceMap[childPoint.id] === undefined || distanceMap[childPoint.id]! > distance)) {
        distanceMap[childPoint.id] = distance;

        // compute heuristic : min distance to nearest target
        const childHeuristic = this._computeAStarHeuristic(heuristicMap, childPoint);
        const estimatedMinDist = distance + childHeuristic;
        // do not consider point if estimated distance is greater than distanceMax
        if (estimatedMinDist <= distanceMax) {
          predecessors[childPoint.id] = currentPointId; // used to retrieve the path at the end
          unvisitedNodes.push(childPoint.id, estimatedMinDist);
        }
      }
    }
  }

  private _computeAStarHeuristic(heuristicMap: number[], childPoint: NodePoint) {
    let childHeuristic = heuristicMap[childPoint.id];
    if (childHeuristic === undefined) {
      if (childPoint.isTarget) {
        childHeuristic = 0;
      } else {
        childHeuristic = Number.MAX_VALUE;
        for (let targetIndex = 0; targetIndex < this._nbTargets; targetIndex++) {
          const targetPoint = this._points[targetIndex]!;
          const distToTarget = haversineDistance(childPoint, targetPoint);
          if (distToTarget < childHeuristic) {
            childHeuristic = distToTarget;
          }
        }
      }

      heuristicMap[childPoint.id] = childHeuristic;
    }
    return childHeuristic;
  }

  private _buildPath(targetFound: number | undefined, predecessors: number[]): number[][] {
    const path: number[][] = [];
    if (targetFound !== undefined) {
      path.push(this._points[targetFound]!.toCoords());
      let currentNode = targetFound;
      while (predecessors[currentNode] !== undefined) {
        currentNode = predecessors[currentNode]!;
        path.push(this._points[currentNode]!.toCoords());
      }
    }
    return path.reverse();
  }

  /**
   * Process the children points visible from a point and not already visited
   * @param pointId
   * @param visited
   * @private
   */
  private _processPointChildren(pointId: number, visited: boolean[]): NodePoint[] {
    const children: NodePoint[] = [];
    const fromPoint = this._points[pointId]!;
    for (let id = 0; id < this._points.length; id++) {
      const toPoint = this._points[id]!;
      if (!toPoint.isConcave && !visited[id]) {
        // we first verify if each side of the edge do not cross a polygon by looking if the line is tangent to the polygon
        if (areTangent(fromPoint, toPoint)) {
          // check if point is visible by looking for intersections
          // TODO Optimisation: implements Lee's O(n² log n) algorithm https://github.com/davetcoleman/visibility_graph/blob/master/Visibility_Graph_Algorithm.pdf
          if (!this._checkIfPointIsVisibleWithIntersections(fromPoint, toPoint)) {
            children.push(toPoint);
          }
        }
      }
    }

    return children;
  }

  private _checkIfPointIsVisibleWithIntersections(fromPoint: NodePoint, toPoint: NodePoint) {
    let hasIntersection = false;
    for (const edge of this._edges) {
      // ignore edge containing fromPoint or toPoint otherwise we will always have intersections
      if (!edge.containsPoint(fromPoint) && !edge.containsPoint(toPoint)) {
        if (edgeIntersect(fromPoint, toPoint, edge.p1, edge.p2)) {
          hasIntersection = true;
          break;
        }
      }
    }
    return hasIntersection;
  }

  private _createPoint(coords: number[], isTarget = false): NodePoint {
    const nodeId = this._points.length;
    const point = new NodePoint(coords, nodeId, isTarget);
    this._points.push(point);

    return point;
  }

  private _createEdge(p1: NodePoint, p2: NodePoint) {
    p1.nextPoint = p2;
    p2.prevPoint = p1;
    this._edges.push(new Edge(p1, p2));
  }
}
