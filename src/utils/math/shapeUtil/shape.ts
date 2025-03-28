/*
 * @FilePath: \kjlordervue\src\utils\mathUtilPlus\shape\shape.ts
 * @Description:
 * @Author: lzr
 * @Version: 0.0.1
 * @LastEditors: lzr
 * @LastEditTime: 2025-01-13 11:32:07
 */
import { Path } from "./path";

export class Shape extends Path {
  private holes: Path[] = [];

  getPointsHoles(divisions: number = 20) {
    const holesPts = [];
    for (let i = 0, l = this.holes.length; i < l; i++) {
      holesPts[i] = this.holes[i].getPoints(divisions);
    }
    return holesPts;
  }

  extractPoints(divisions: number = 20) {
    return {
      shape: this.getPoints(divisions),
      holes: this.getPointsHoles(divisions),
    };
  }

  copy(source: Shape) {
    super.copy(source);
    this.holes = [];
    for (let i = 0; i < source.holes.length; i++) {
      const hole = source.holes[i];
      this.holes.push(hole.clone());
    }
    return this;
  }
}
