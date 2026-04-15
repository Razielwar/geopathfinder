import type { NodePoint } from '../model/NodePoint';
import { EARTH_RADIUS_METERS } from './constants';

/**
 * Given three collinear points p, q, r, the function checks if
 * point q lies on line segment 'pr'
 */
export function onSegment(p: NodePoint, q: NodePoint, r: NodePoint): boolean {
  return q.x <= Math.max(p.x, r.x) && q.x >= Math.min(p.x, r.x) && q.y <= Math.max(p.y, r.y) && q.y >= Math.min(p.y, r.y);
}

/**
 * To find orientation of ordered triplet (p, q, r).
 * The function returns following values
 * 0 --> p, q and r are collinear
 * 1 --> Clockwise
 * -1 --> Counterclockwise
 * @see https://www.geeksforgeeks.org/orientation-3-ordered-points/
 */
export function orientation(p: NodePoint, q: NodePoint, r: NodePoint) {
  const crossProduct = (q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x);

  if (crossProduct === 0) return 0; // collinear

  return crossProduct < 0 ? 1 : -1; // Clockwise or Counterclockwise
}

const DEGREES_TO_RAD = Math.PI / 180;

/**
 * Compute the distance in metres between two points using the haversine formula.
 * @see https://en.wikipedia.org/wiki/Haversine_formula
 * @see https://www.movable-type.co.uk/scripts/latlong.html
 * @param a first point
 * @param b second point
 * @returns distance in metres
 */
export function haversineDistance(a: NodePoint, b: NodePoint): number {
  const dLat = (b.y - a.y) * DEGREES_TO_RAD;
  const dLon = (b.x - a.x) * DEGREES_TO_RAD;
  const lat1 = a.y * DEGREES_TO_RAD;
  const lat2 = b.y * DEGREES_TO_RAD;

  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);
  const l = sinDLat * sinDLat + sinDLon * sinDLon * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(l), Math.sqrt(1 - l));

  return EARTH_RADIUS_METERS * c;
}

/**
 * Returns true if line segment 'p1q1'
 * and 'p2q2' intersect.
 */
export function edgeIntersect(p1: NodePoint, q1: NodePoint, p2: NodePoint, q2: NodePoint): boolean {
  // Find the four orientations needed for general and
  // special cases
  const o1 = orientation(p1, q1, p2);
  const o2 = orientation(p1, q1, q2);
  const o3 = orientation(p2, q2, p1);
  const o4 = orientation(p2, q2, q1);

  // General case
  if (o1 !== o2 && o3 !== o4) return true;

  // Special Cases when all points are collinear
  // p2 lies on segment p1q1 or q2 lies on segment p1q1
  if (o1 === 0 && o2 === 0) return onSegment(p1, p2, q1) || onSegment(p1, q2, q1);

  return false; // Doesn't fall in any of the above cases
}

/**
 * To know the polygon coordinates are defined clockwise or counterClockWise
 * @see Shoelace formula https://en.wikipedia.org/wiki/Shoelace_formula
 * @see Determinant https://guzintamath.com/textsavvy/2018/05/15/the-determinant-briefly/
 * @param coords the coordinates of the polygon given by geojson with the last point equals to the first one to close the polygon
 */
export function isPolygonClockwise(coords: number[][]) {
  let area = 0.0;

  for (let i = 0, j = 1; i < coords.length - 1; i++, j++) {
    // use of bang as by definition we cannot have undefined values
    area += (coords[j]![1]! + coords[i]![1]!) * (coords[j]![0]! - coords[i]![0]!);
  }

  // Return absolute value
  return area > 0;
}

/**
 * Reverse polygons if they are defined in counterClockWise order
 * @param coords coordinates of the polygon
 * @return coords of the polygon reversed if it was counterClockWise
 */
export function makePolygonClockwise(coords: number[][]): number[][] {
  if (!isPolygonClockwise(coords)) {
    coords.reverse();
  }
  return coords;
}

export function isConcave(p: NodePoint) {
  return p.prevPoint !== null && p.nextPoint !== null && orientation(p.prevPoint, p, p.nextPoint) <= 0;
}

/**
 * Used to know if the line pq is tangent to the corner formed by the edges prev-q - q - next-q
 * Note: we consider also collinear as tangent
 * @param p
 * @param q
 */
export function isTangent(p: NodePoint, q: NodePoint): boolean {
  if (q.prevPoint !== null) {
    // prev and next should go together so we do not check the next for performance purpose
    const o1 = orientation(p, q, q.prevPoint);
    const o2 = orientation(p, q, q.nextPoint!);
    return o1 === o2 || o1 === 0 || o2 === 0;
  }
  return true; // if we do not have prev/next point, point is not part of a polygon so we consider it tangent has we can link it
}

/**
 * Used to know if the line pq is tangent to each polygon corners that behave to p and q
 * @param p
 * @param q
 */
export function areTangent(p: NodePoint, q: NodePoint) {
  return isTangent(p, q) && isTangent(q, p);
}
