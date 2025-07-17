import { isConcave } from '../utils/geometryUtils';

export class NodePoint {
  public readonly x: number;
  public readonly y: number;
  public prevPoint: NodePoint | null = null;
  public nextPoint: NodePoint | null = null;
  public isConcave = false;

  constructor(
    coords: number[],
    public readonly id: number,
    public readonly isTarget = false
  ) {
    this.x = coords[0]!;
    this.y = coords[1]!;
  }

  computeConcave() {
    this.isConcave = isConcave(this);
  }

  toCoords(): number[] {
    return [this.x, this.y];
  }
}
