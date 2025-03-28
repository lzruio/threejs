import { Vector4 } from "../vector4";
//曲线基类
export class Curve {
  public type: string;
  public arcLengthDivisions: number;

  public needsUpdate: boolean = false;
  public cacheArcLengths: number[] = [];

  constructor() {
    this.arcLengthDivisions = 200;
  }

  // 参数化曲线
  getPoint(t: number): Vector4 | null {
    console.warn("THREE.Curve: .getPoint() not implemented.");
    return null;
  }

  // 均匀分布
  getPointAt(u: number): Vector4 | null {
    const t = this.getUtoTmapping(u);
    return this.getPoint(t);
  }

  getPoints(divisions: number = 5) {
    const points = [];
    for (let d = 0; d <= divisions; d++) {
      points.push(this.getPoint(d / divisions));
    }
    return points;
  }

  getSpacedPoints(divisions: number = 5) {
    const points = [];
    for (let d = 0; d <= divisions; d++) {
      points.push(this.getPointAt(d / divisions));
    }
    return points;
  }

  getLength() {
    const lengths = this.getLengths();
    return lengths[lengths.length - 1];
  }

  getLengths(divisions: number = this.arcLengthDivisions) {
    if (
      this.cacheArcLengths &&
      this.cacheArcLengths.length === divisions + 1 &&
      !this.needsUpdate
    ) {
      return this.cacheArcLengths;
    }
    this.needsUpdate = false;
    const cache = [];
    let current: Vector4;
    let last: Vector4 = this.getPoint(0);
    let sum = 0;
    cache.push(0);

    for (let p = 1; p <= divisions; p++) {
      current = this.getPoint(p / divisions);
      sum += current.distanceTo(last);
      cache.push(sum);
      last = current;
    }
    this.cacheArcLengths = cache;
    return cache;
  }

  updateArcLengths() {
    this.needsUpdate = true;
    this.getLengths();
  }

  getUtoTmapping(u: number, distance?: number) {
    // 计算弧长
    const arcLengths = this.getLengths();
    const totalArcLength = arcLengths[arcLengths.length - 1];
    const targetArcLength = distance ? distance : u * totalArcLength;

    // 查找
    let low = 0,
      high = arcLengths.length - 1;
    let i: number;
    while (low <= high) {
      i = Math.floor(low + (high - low) / 2);
      const comparison = arcLengths[i] - targetArcLength;
      if (comparison < 0) {
        low = i + 1;
      } else if (comparison > 0) {
        high = i - 1;
      } else {
        high = i;
        break;
      }
    }
    i = high;
    if (arcLengths[i] === targetArcLength) {
      return i / (arcLengths.length - 1);
    }

    // 线性插值
    const lengthBefore = arcLengths[i];
    const lengthAfter = arcLengths[i + 1];
    const segmentLength = lengthAfter - lengthBefore;
    const segmentFraction = (targetArcLength - lengthBefore) / segmentLength;
    const t = (i + segmentFraction) / (arcLengths.length - 1);
    return t;
  }

  getTangent(t: number) {
    const delta = 0.0001;
    let t1 = t - delta;
    let t2 = t + delta;
    if (t1 < 0) t1 = 0;
    if (t2 > 1) t2 = 1;
    const pt1 = this.getPoint(t1);
    const pt2 = this.getPoint(t2);

    const tangent = pt2.sub(pt1).normalize();

    return tangent;
  }

  getTangentAt(u: number) {
    const t = this.getUtoTmapping(u);
    return this.getTangent(t);
  }

  copy(source: Curve) {
    this.arcLengthDivisions = source.arcLengthDivisions;
    return this;
  }

  clone<T extends Curve>() {
    return new (this.constructor as new () => T)().copy(this);
  }
  // Frenet标架问题
}
