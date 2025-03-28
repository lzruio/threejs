// 复合曲线
import { Curve } from "./curve";
import { Vector4 } from "../vector4";
import { LineCurve, EllipseCurve } from "../curves";

export class CurvePath extends Curve {
  public curves: Curve[];
  public autoClose: boolean;

  public cacheLengths: number[] = [];
  public needsUpdate: boolean = false;

  constructor() {
    super();

    this.curves = [];
    this.autoClose = false;
  }

  add(curve: Curve) {
    this.curves.push(curve);
  }

  closePath() {
    const startPoint = this.curves[0].getPoint(0);
    const endPoint = this.curves[this.curves.length - 1].getPoint(1);

    if (!startPoint.equals(endPoint)) {
      this.add(new LineCurve(endPoint, startPoint));
    }

    return this;
  }

  // 按长度均匀分布
  getPoint(t: number): Vector4 | null {
    const totalLength = this.getLength();
    const targetLength = t * totalLength;

    const curveLengths = this.getCurveLengths();
    for (let i = 0; i < curveLengths.length; i++) {
      if (curveLengths[i] >= targetLength) {
        const curve = this.curves[i];
        const diff = curveLengths[i] - targetLength;
        const u = 1 - diff / curve.getLength();
        return curve.getPointAt(u);
      }
    }
    return null;
  }

  getLength() {
    const lengths = this.getCurveLengths();
    return lengths[lengths.length - 1];
  }

  updateArcLengths() {
    this.needsUpdate = true;
    this.cacheLengths = null;
    this.getCurveLengths();
  }

  getCurveLengths() {
    if (this.cacheLengths && this.cacheLengths.length === this.curves.length) {
      return this.cacheLengths;
    }

    const lengths = [];
    let sums = 0;
    for (let i = 0; i < this.curves.length; i++) {
      sums += this.curves[i].getLength();
      lengths.push(sums);
    }
    this.cacheLengths = lengths;
    return lengths;
  }

  // 根据长度均匀获取
  getSpacedPoints(divisions: number = 40) {
    const points = [];
    for (let i = 0; i <= divisions; i++) {
      points.push(this.getPoint(i / divisions));
    }
    if (this.autoClose) {
      points.push(points[0]);
    }
    return points;
  }

  // 根据参数均匀获取
  getPoints(divisions: number = 12) {
    const points = [];
    let last: Vector4 | null = null;
    for (const curve of this.curves) {
      const resolution =
        curve instanceof EllipseCurve
          ? divisions * 2
          : curve instanceof LineCurve
          ? 1
          : divisions;
      const pts = curve.getPoints(resolution);
      // 去重
      for (const point of pts) {
        if (last?.equals(point)) continue; // 跳过重复点
        points.push(point);
        last = point;
      }
    }

    if (
      this.autoClose &&
      points.length > 1 &&
      !points[points.length - 1].equals(points[0])
    ) {
      points.push(points[0]);
    }
    return points;
  }

  copy(source: CurvePath) {
    super.copy(source);
    this.curves = [];
    for (let i = 0; i < source.curves.length; i++) {
      this.curves.push(source.curves[i].clone());
    }
    this.autoClose = source.autoClose;
    return this;
  }
}
