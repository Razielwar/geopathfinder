import type { NodePoint } from './NodePoint';

/**
 * Class used by VisibilityGraph to compute restricted areas
 */
export class Edge {
  constructor(
    public p1: NodePoint,
    public p2: NodePoint
  ) {}

  containsPoint(point: NodePoint) {
    return this.p1 === point || this.p2 === point;
  }
}
