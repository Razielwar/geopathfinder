import type { NodePoint } from './NodePoint';

/**
 * Class used by VisibilityGraph to compute restricted areas
 */
export class Edge {
  public constructor(
    public readonly p1: NodePoint,
    public readonly p2: NodePoint
  ) {}

  public containsPoint(point: NodePoint) {
    return this.p1 === point || this.p2 === point;
  }
}
