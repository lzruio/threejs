import { CurvePath } from "./curvePath";
import { Vector4 } from "../vector4";
import { LineCurve, EllipseCurve } from "../curves";

export class Path extends CurvePath {
  public currentPoint: Vector4;
  constructor(points?: Vector4[]) {
    super();
    this.currentPoint = new Vector4(0, 0, 0, 0);
    if (points) {
      this.setFromPoints(points);
    }
  }
  setFromPoints(points: Vector4[]) {
    this.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      this.lineTo(points[i].x, points[i].y);
    }
    return this;
  }

  moveTo(x: number, y: number) {
    this.currentPoint.set(x, y, 0, 0);
    return this;
  }

  lineTo(x: number, y: number) {
    const curve = new LineCurve(
      this.currentPoint.clone(),
      new Vector4(x, y, 0, 0)
    );
    this.curves.push(curve);
    this.currentPoint.set(x, y, 0, 0);
    return this;
  }

  arc(
    aX: number,
    aY: number,
    aRadius: number,
    aStartAngle: number,
    aEndAngle: number,
    aClockwise: boolean
  ) {
    const x0 = this.currentPoint.x;
    const y0 = this.currentPoint.y;
    this.absarc(aX + x0, aY + y0, aRadius, aStartAngle, aEndAngle, aClockwise);
    return this;
  }

  absarc(
    aX: number,
    aY: number,
    aRadius: number,
    aStartAngle: number,
    aEndAngle: number,
    aClockwise: boolean
  ) {
    this.absellipse(
      aX,
      aY,
      aRadius,
      aRadius,
      aStartAngle,
      aEndAngle,
      aClockwise,
      0
    );
    return this;
  }

  ellipse(
    aX: number,
    aY: number,
    xRadius: number,
    yRadius: number,
    aStartAngle: number,
    aEndAngle: number,
    aClockwise: boolean,
    aRotation: number
  ) {
    const X0 = this.currentPoint.x;
    const Y0 = this.currentPoint.y;
    this.absellipse(
      aX + X0,
      aY + Y0,
      xRadius,
      yRadius,
      aStartAngle,
      aEndAngle,
      aClockwise,
      aRotation
    );
    return this;
  }

  absellipse(
    aX: number,
    aY: number,
    xRadius: number,
    yRadius: number,
    aStartAngle: number,
    aEndAngle: number,
    aClockwise: boolean,
    aRotation: number
  ) {
    const curve = new EllipseCurve(
      aX,
      aY,
      xRadius,
      yRadius,
      aStartAngle,
      aEndAngle,
      aClockwise,
      aRotation
    );
    if (this.curves.length > 0) {
      const firstPoint = curve.getPoint(0);
      if (!firstPoint.equals(this.currentPoint)) {
        this.lineTo(firstPoint.x, firstPoint.y);
      }
    }
    this.curves.push(curve);
    const lastPoint = curve.getPoint(1);
    this.currentPoint.copy(lastPoint);
    return this;
  }
}
