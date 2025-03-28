/*
 * @FilePath: \kjlordervue\src\utils\mathUtilPlus\curves\EllipseCurve.ts
 * @Description:
 * @Author: lzr
 * @Version: 0.0.1
 * @LastEditors: lzr
 * @LastEditTime: 2025-01-15 13:54:39
 */

import { Vector4 } from "../vector4";
import { Curve } from "../shapeUtil";
// 椭圆曲线
export class EllipseCurve extends Curve {
  private aX: number;
  private aY: number;
  private xRadius: number;
  private yRadius: number;

  private aStartAngle: number;
  private aEndAngle: number;
  private aClockwise: boolean;
  private aRotation: number;

  constructor(
    aX: number,
    aY: number,
    xRadius: number,
    yRadius: number,
    aStartAngle: number,
    aEndAngle: number,
    aClockwise: boolean,
    aRotation: number
  ) {
    super();
    this.aX = aX;
    this.aY = aY;
    this.xRadius = xRadius;
    this.yRadius = yRadius;
    this.aStartAngle = aStartAngle;
    this.aEndAngle = aEndAngle;
    this.aClockwise = aClockwise;
    this.aRotation = aRotation;
  }

  // 参数式方程
  getPoint(t: number): Vector4 {
    const twoPi = Math.PI * 2;
    // 角度差
    let deltaAngle = this.aEndAngle - this.aStartAngle;

    // 标准化前检查角度差
    const samePoints = Math.abs(deltaAngle) < Number.EPSILON;

    // 标准化角度到 [0, 2π]
    while (deltaAngle < 0) deltaAngle += twoPi;
    while (deltaAngle > twoPi) deltaAngle -= twoPi;

    // 比如startAngle=2π,endAngle=0
    if (deltaAngle < Number.EPSILON) {
      if (samePoints) {
        deltaAngle = 0;
      } else {
        deltaAngle = twoPi;
      }
    }

    // 处理顺时针
    if (this.aClockwise === true && !samePoints) {
      if (deltaAngle === twoPi) {
        deltaAngle = -twoPi;
      } else {
        deltaAngle = deltaAngle - twoPi;
      }
    }

    // 椭圆的参数式方程
    const angle = this.aStartAngle + t * deltaAngle;
    let x = this.aX + this.xRadius * Math.cos(angle);
    let y = this.aY + this.yRadius * Math.sin(angle);

    // 进行矩阵变换
    if (this.aRotation !== 0) {
      const cos = Math.cos(this.aRotation);
      const sin = Math.sin(this.aRotation);

      const tx = x - this.aX;
      const ty = y - this.aY;

      x = tx * cos - ty * sin + this.aX;
      y = tx * sin + ty * cos + this.aY;
    }
    return new Vector4(x, y, 0, 0);
  }

  copy(source: EllipseCurve): this {
    super.copy(source);
    this.aX = source.aX;
    this.aY = source.aY;
    this.xRadius = source.xRadius;
    this.yRadius = source.yRadius;
    this.aStartAngle = source.aStartAngle;
    this.aEndAngle = source.aEndAngle;
    this.aClockwise = source.aClockwise;
    this.aRotation = source.aRotation;
    return this;
  }


}
