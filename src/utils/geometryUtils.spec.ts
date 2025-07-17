import { expect, describe, it } from '@jest/globals';

import * as turf from '@turf/turf';
import { cloneDeep } from 'lodash';
import {
  edgeIntersect,
  haversineDistance,
  isConcave,
  isPolygonClockwise,
  isTangent,
  makePolygonClockwise,
  onSegment,
  orientation,
} from './geometryUtils';
import { NodePoint } from '../model/NodePoint';

function point(coords: number[]): NodePoint {
  return new NodePoint(coords, 0);
}

function polygonVertice(prev: number[], vertice: number[], next: number[]): NodePoint {
  const prevPoint = new NodePoint(prev, 0);
  const nextPoint = new NodePoint(next, 0);
  const verticePoint = new NodePoint(vertice, 0);
  verticePoint.prevPoint = prevPoint;
  verticePoint.nextPoint = nextPoint;

  return verticePoint;
}

describe('Geometry utils Tests', () => {
  describe('onSegment tests', () => {
    it.each([
      ['line horizontal', [0, 0], [1, 0], [2, 0]],
      ['line vertical', [0, 0], [0, 1], [0, 2]],
      ['line with positive slope', [0, 0], [1, 1], [2, 2]],
      ['line with negative slope', [0, 0], [1, -1], [2, -2]],
      ['line with first merged points', [0, 0], [0, 0], [1, 1]],
      ['line with third merged points', [0, 0], [1, 1], [1, 1]],
    ])('Call onSegment return true - %s', (name, p: number[], q: number[], r: number[]) => {
      expect(onSegment(point(p), point(q), point(r))).toBe(true);
    });

    it.each([
      ['line horizontal point right', [0, 0], [2, 0], [1, 0]],
      ['line horizontal point left', [0, 0], [-2, 0], [1, 0]],
      ['line vertical point up', [0, 0], [0, 3], [0, 2]],
      ['line vertical point down', [0, 0], [0, -3], [0, 2]],
      ['line with positive slope up right', [0, 0], [3, 3], [2, 2]],
      ['line with positive slope down left', [0, 0], [3, -3], [2, 2]],
      ['line with negative slope down right', [0, 0], [3, -3], [2, -2]],
      ['line with negative slope up left', [0, 0], [-1, 1], [2, -2]],
    ])('Call onSegment return false - %s', (name, p: number[], q: number[], r: number[]) => {
      expect(onSegment(point(p), point(q), point(r))).toBe(false);
    });
  });

  describe('orientation tests', () => {
    it.each<[string, number, number[], number[], number[]]>([
      ['clockwise', 1, [0, 0], [1, 1], [2, 0]],
      ['collinear', 0, [0, 0], [1, 1], [2, 2]],
      ['counterclockwise', -1, [0, 0], [1, 0], [2, 2]],
      ['clockwise precision meter', 1, [0, 0], [1e-5, 1e-5], [2e-5, 0]],
      ['collinear precision meter', 0, [0, 0], [1e-5, 1e-5], [2e-5, 2e-5]],
      ['counterclockwise precision meter', -1, [0, 0], [1e-5, 0], [2e-5, 2e-5]],
    ])('Call orientation %s', (name, expected, p: number[], q: number[], r: number[]) => {
      expect(orientation(point(p), point(q), point(r))).toBe(expected);
    });
  });

  describe('edgeIntersect tests', () => {
    it.each([
      [
        [
          [0, 0],
          [0, 5],
        ],
        [
          [-5, 3],
          [5, 3],
        ],
        true,
        'crossing vertical and horizontal line',
      ],
      [
        [
          [-5, 0],
          [5, 0],
        ],
        [
          [0, 5],
          [0, -5],
        ],
        true,
        'crossing horizontal and vertical line',
      ],
      [
        [
          [-5, 0],
          [5, 0],
        ],
        [
          [0, -5],
          [0, 5],
        ],
        true,
        'crossing horizontal and vertical line',
      ],
      [
        [
          [5, 0],
          [-5, 0],
        ],
        [
          [0, -5],
          [0, 5],
        ],
        true,
        'crossing horizontal and vertical line',
      ],
      [
        [
          [0, 0],
          [0, 5],
        ],
        [
          [0, 3],
          [3, 3],
        ],
        true,
        'crossing p1 q1 p2 collinear',
      ],
      [
        [
          [0, 0],
          [0, 5],
        ],
        [
          [0, 3],
          [0, 10],
        ],
        true,
        'crossing p1 q1 p2 q2 collinear, p2 between p1 q1',
      ],
      [
        [
          [0, 0],
          [0, 5],
        ],
        [
          [0, 10],
          [0, 3],
        ],
        true,
        'crossing p1 q1 p2 q2 collinear, q2 between p1 q1',
      ],
      [
        [
          [0, 0],
          [0, 5],
        ],
        [
          [1, 0],
          [1, 5],
        ],
        false,
        'collinear segments not crossing',
      ],
      [
        [
          [0, 0],
          [0, 5],
        ],
        [
          [0, 6],
          [0, 10],
        ],
        false,
        'not crossing vertical and horizontal line',
      ],
      [
        [
          [0, 0],
          [5, 5],
        ],
        [
          [0, 1],
          [-5, 5],
        ],
        false,
        'not crossing',
      ],
    ])('Call edgeIntersect between %o and %o expect %s - %s', (ab: number[][], cd: number[][], expected) => {
      expect(edgeIntersect(point(ab[0]!), point(ab[1]!), point(cd[0]!), point(cd[1]!))).toBe(expected);
    });
  });

  describe('distance tests', () => {
    it.each([
      [
        [0, 0],
        [1, 1],
      ],
      [
        [0, 0],
        [1e-1, 1e-1],
      ],
      [
        [0, 0],
        [1e-2, 1e-2],
      ],
      [
        [0, 0],
        [1e-3, 1e-3],
      ],
      [
        [0, 0],
        [1e-4, 1e-4],
      ],
      [
        [0, 0],
        [1e-5, 1e-5],
      ],
      [
        [0, 0],
        [1e-6, 1e-6],
      ],
      [
        [0, 0],
        [1e-7, 1e-7],
      ],
    ])('Verify distance with turf compute from %p to %p', (p: number[], q: number[]) => {
      const turfComputedDistance = turf.distance(turf.point(p), turf.point(q), { units: 'kilometers' });
      expect(haversineDistance(point(p), point(q))).toBeCloseTo(turfComputedDistance, 1e-5); // cm precision
    });
  });

  describe('isPolygonClockwise tests', () => {
    it('Call isPolygonClockwise return true if polygon coords are defined in clockwise order', () => {
      const coords = [
        [0, 0],
        [0, 1],
        [1, 1],
        [1, 0],
        [0, 0],
      ];
      expect(isPolygonClockwise(coords)).toBe(true);
    });

    it('Call isPolygonClockwise return false if polygon coords are defined in counterclockwise order', () => {
      const coords = [
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 1],
        [0, 0],
      ];
      expect(isPolygonClockwise(coords)).toBe(false);
    });
  });

  describe('makePolygonClockwise tests', () => {
    it('Call makePolygonClockwise with a clockwise polygon return the same polygon without reversing its coords', () => {
      const coords = [
        [0, 0],
        [0, 1],
        [1, 1],
        [1, 0],
        [0, 0],
      ];
      const expectedCoords = cloneDeep(coords);
      expect(makePolygonClockwise(coords)).toEqual(expectedCoords);
    });

    it('Call makePolygonClockwise with a counterclockwise polygon return a clockwise polygon', () => {
      const coords = [
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 1],
        [0, 0],
      ];
      const expectedCoords = cloneDeep(coords).reverse();
      expect(makePolygonClockwise(coords)).toEqual(expectedCoords);
    });
  });

  describe('isConcave tests', () => {
    it.each([
      [true, 'concave angle 270°', [0, 0], [1, -1], [2, 0]],
      [false, 'not concave angle 90°', [0, 0], [1, 1], [2, 0]],
      [true, 'collinear corner cas considered concave', [0, 0], [1, 0], [2, 0]],
    ])('Call isConcave return %s - %s', (expected, name, p: number[], q: number[], r: number[]) => {
      expect(isConcave(polygonVertice(p, q, r))).toBe(expected);
    });
  });

  describe('isTangent tests', () => {
    it.each([
      [true, 'tangent', [-1, 0], [0, 0], [0, 1], [1, 1]],
      [true, 'collinear to rs', [-1, 1], [0, 0], [0, 1], [1, 1]],
      [true, 'collinear to qr', [0, 2], [0, 0], [0, 1], [1, 1]],
      [false, 'enter in corner qrs', [-1, 2], [0, 0], [0, 1], [1, 1]],
    ])('Call isTangent return %s - %s', (expected, name, p: number[], q: number[], r: number[], s: number[]) => {
      expect(isTangent(point(p), polygonVertice(q, r, s))).toBe(expected);
    });
  });
});
