/*
 * @FilePath: \kjlordervue\src\utils\mathUtilPlus\curves\LineCurve.ts
 * @Description:
 * @Author: lzr
 * @Version: 0.0.1
 * @LastEditors: lzr
 * @LastEditTime: 2025-01-13 11:37:37
 */
import { Vector4 } from "../vector4";
import { Curve } from "../shapeUtil";
export class LineCurve extends Curve {
  v1: Vector4;
  v2: Vector4;
  constructor(v1: Vector4, v2: Vector4) {
    super();
    this.v1 = v1;
    this.v2 = v2;
  }

  getPoint(t: number): Vector4 | null {
    if (t === 1) {
      return this.v2;
    } else {
      return this.v1.add(this.v2.sub(this.v1).scale(t));
    }
  }

  getPointAt(u: number): Vector4 {
    return this.getPoint(u);
  }

  getTangent(t: number): Vector4 {
    return this.v2.sub(this.v1).normalize();
  }

  getTangentAt(u: number): Vector4 {
    return this.getTangent(u);
  }

  copy(source: LineCurve): this {
    super.copy(source);
    this.v1.copy(source.v1);
    this.v2.copy(source.v2);
    return this;
  }
}
