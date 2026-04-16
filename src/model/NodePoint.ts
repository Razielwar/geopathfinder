import { isConcave } from '../utils/geometryUtils';
import type { LonLat } from '../types';

export class NodePoint {
  public readonly x: number;
  public readonly y: number;
  public prevPoint: NodePoint | null = null;
  public nextPoint: NodePoint | null = null;
  public isConcave = false;

  public constructor(
    coords: number[],
    public readonly id: number,
    public readonly isTarget = false
  ) {
    this.x = coords[0]!;
    this.y = coords[1]!;
  }

  public computeConcave() {
    this.isConcave = isConcave(this);
  }

  public toCoords(): LonLat {
    return [this.x, this.y];
  }
}
