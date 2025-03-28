/*
 * @FilePath: \kjlordervue\src\utils\mathUtil\matrix4.ts
 * @Description:
 * @Author: lzr
 * @Version: 0.0.1
 * @LastEditors: lzr
 * @LastEditTime: 2025-01-11 11:57:48
 */
import { Vector4 } from "./vector4";
import { Euler } from "./euler";
import { degToRad } from "./mathUtil";

// prettier-ignore
class Matrix4 {
  public elements: number[];
  constructor() {
    this.elements = [
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1,
    ]
  }
  // 这里是列主序
  set(
    n11: number, n12: number, n13: number, n14: number,
    n21: number, n22: number, n23: number, n24: number,
    n31: number, n32: number, n33: number, n34: number,
    n41: number, n42: number, n43: number, n44: number,
  ) {
    const te = this.elements
    te[0] = n11; te[4] = n12; te[8] = n13; te[12] = n14
    te[1] = n21; te[5] = n22; te[9] = n23; te[13] = n24
    te[2] = n31; te[6] = n32; te[10] = n33; te[14] = n34
    te[3] = n41; te[7] = n42; te[11] = n43; te[15] = n44
  }

  /**
   * 运算
   */
  dot(m: Readonly<Matrix4>): Matrix4 {
    const tempMatrix = new Matrix4()
    const te = tempMatrix.elements
    const ae = this.elements
    const be = m.elements

    // 取出每行的元素
    const a11 = ae[ 0 ], a12 = ae[ 4 ], a13 = ae[ 8 ], a14 = ae[ 12 ];
		const a21 = ae[ 1 ], a22 = ae[ 5 ], a23 = ae[ 9 ], a24 = ae[ 13 ];
		const a31 = ae[ 2 ], a32 = ae[ 6 ], a33 = ae[ 10 ], a34 = ae[ 14 ];
		const a41 = ae[ 3 ], a42 = ae[ 7 ], a43 = ae[ 11 ], a44 = ae[ 15 ];

		const b11 = be[ 0 ], b12 = be[ 4 ], b13 = be[ 8 ], b14 = be[ 12 ];
		const b21 = be[ 1 ], b22 = be[ 5 ], b23 = be[ 9 ], b24 = be[ 13 ];
		const b31 = be[ 2 ], b32 = be[ 6 ], b33 = be[ 10 ], b34 = be[ 14 ];
		const b41 = be[ 3 ], b42 = be[ 7 ], b43 = be[ 11 ], b44 = be[ 15 ];

    const c11 = a11 * b11 + a12 * b21 + a13 * b31 + a14 * b41
    const c12 = a11 * b12 + a12 * b22 + a13 * b32 + a14 * b42
    const c13 = a11 * b13 + a12 * b23 + a13 * b33 + a14 * b43
    const c14 = a11 * b14 + a12 * b24 + a13 * b34 + a14 * b44

    const c21 = a21 * b11 + a22 * b21 + a23 * b31 + a24 * b41
    const c22 = a21 * b12 + a22 * b22 + a23 * b32 + a24 * b42
    const c23 = a21 * b13 + a22 * b23 + a23 * b33 + a24 * b43
    const c24 = a21 * b14 + a22 * b24 + a23 * b34 + a24 * b44

    const c31 = a31 * b11 + a32 * b21 + a33 * b31 + a34 * b41
    const c32 = a31 * b12 + a32 * b22 + a33 * b32 + a34 * b42
    const c33 = a31 * b13 + a32 * b23 + a33 * b33 + a34 * b43
    const c34 = a31 * b14 + a32 * b24 + a33 * b34 + a34 * b44

    const c41 = a41 * b11 + a42 * b21 + a43 * b31 + a44 * b41
    const c42 = a41 * b12 + a42 * b22 + a43 * b32 + a44 * b42
    const c43 = a41 * b13 + a42 * b23 + a43 * b33 + a44 * b43
    const c44 = a41 * b14 + a42 * b24 + a43 * b34 + a44 * b44

    // 进行列存储
    te[0]  = c11; te[1]  = c21; te[2]  = c31; te[3]  = c41
    te[4]  = c12; te[5]  = c22; te[6]  = c32; te[7]  = c42
    te[8]  = c13; te[9]  = c23; te[10] = c33; te[11] = c43
    te[12] = c14; te[13] = c24; te[14] = c34; te[15] = c44
    return tempMatrix
  }

  transpose(): Matrix4 {
    const tempMatrix = new Matrix4()
    const te = tempMatrix.elements
    const ae = this.elements

    te[0] = ae[0]; te[1] = ae[4]; te[2] = ae[8]; te[3] = ae[12]
    te[4] = ae[1]; te[5] = ae[5]; te[6] = ae[9]; te[7] = ae[13]
    te[8] = ae[2]; te[9] = ae[6]; te[10] = ae[10]; te[11] = ae[14]
    te[12] = ae[3]; te[13] = ae[7]; te[14] = ae[11]; te[15] = ae[15]
    return tempMatrix
  }

  // 逆矩阵
  inverse(): Matrix4 {
    const tempMatrix = new Matrix4()
    const te = tempMatrix.elements
    const ae = this.elements

    // 取出每行的元素
    const n11 = ae[ 0 ], n12 = ae[ 4 ], n13 = ae[ 8 ],  n14 = ae[ 12 ];
		const n21 = ae[ 1 ], n22 = ae[ 5 ], n23 = ae[ 9 ],  n24 = ae[ 13 ];
		const n31 = ae[ 2 ], n32 = ae[ 6 ], n33 = ae[ 10 ], n34 = ae[ 14 ];
		const n41 = ae[ 3 ], n42 = ae[ 7 ], n43 = ae[ 11 ], n44 = ae[ 15 ];

    const t11 = n23 * n34 * n42 - n24 * n33 * n42 + n24 * n32 * n43 - n22 * n34 * n43 - n23 * n32 * n44 + n22 * n33 * n44
		const	t12 = n14 * n33 * n42 - n13 * n34 * n42 - n14 * n32 * n43 + n12 * n34 * n43 + n13 * n32 * n44 - n12 * n33 * n44
		const	t13 = n13 * n24 * n42 - n14 * n23 * n42 + n14 * n22 * n43 - n12 * n24 * n43 - n13 * n22 * n44 + n12 * n23 * n44
		const	t14 = n14 * n23 * n32 - n13 * n24 * n32 - n14 * n22 * n33 + n12 * n24 * n33 + n13 * n22 * n34 - n12 * n23 * n34

    const det = n11 * t11 + n21 * t12 + n31 * t13 + n41 * t14;

    if ( det === 0 ){
      tempMatrix.set(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0)
      return tempMatrix
    }

    const detInv = 1 / det
    te[ 0 ] = t11 * detInv;
		te[ 1 ] = ( n24 * n33 * n41 - n23 * n34 * n41 - n24 * n31 * n43 + n21 * n34 * n43 + n23 * n31 * n44 - n21 * n33 * n44 ) * detInv;
		te[ 2 ] = ( n22 * n34 * n41 - n24 * n32 * n41 + n24 * n31 * n42 - n21 * n34 * n42 - n22 * n31 * n44 + n21 * n32 * n44 ) * detInv;
		te[ 3 ] = ( n23 * n32 * n41 - n22 * n33 * n41 - n23 * n31 * n42 + n21 * n33 * n42 + n22 * n31 * n43 - n21 * n32 * n43 ) * detInv;

		te[ 4 ] = t12 * detInv;
		te[ 5 ] = ( n13 * n34 * n41 - n14 * n33 * n41 + n14 * n31 * n43 - n11 * n34 * n43 - n13 * n31 * n44 + n11 * n33 * n44 ) * detInv;
		te[ 6 ] = ( n14 * n32 * n41 - n12 * n34 * n41 - n14 * n31 * n42 + n11 * n34 * n42 + n12 * n31 * n44 - n11 * n32 * n44 ) * detInv;
		te[ 7 ] = ( n12 * n33 * n41 - n13 * n32 * n41 + n13 * n31 * n42 - n11 * n33 * n42 - n12 * n31 * n43 + n11 * n32 * n43 ) * detInv;

		te[ 8 ] = t13 * detInv;
		te[ 9 ] = ( n14 * n23 * n41 - n13 * n24 * n41 - n14 * n21 * n43 + n11 * n24 * n43 + n13 * n21 * n44 - n11 * n23 * n44 ) * detInv;
		te[ 10 ] = ( n12 * n24 * n41 - n14 * n22 * n41 + n14 * n21 * n42 - n11 * n24 * n42 - n12 * n21 * n44 + n11 * n22 * n44 ) * detInv;
		te[ 11 ] = ( n13 * n22 * n41 - n12 * n23 * n41 - n13 * n21 * n42 + n11 * n23 * n42 + n12 * n21 * n43 - n11 * n22 * n43 ) * detInv;

		te[ 12 ] = t14 * detInv;
		te[ 13 ] = ( n13 * n24 * n31 - n14 * n23 * n31 + n14 * n21 * n33 - n11 * n24 * n33 - n13 * n21 * n34 + n11 * n23 * n34 ) * detInv;
		te[ 14 ] = ( n14 * n22 * n31 - n12 * n24 * n31 - n14 * n21 * n32 + n11 * n24 * n32 + n12 * n21 * n34 - n11 * n22 * n34 ) * detInv;
		te[ 15 ] = ( n12 * n23 * n31 - n13 * n22 * n31 + n13 * n21 * n32 - n11 * n23 * n32 - n12 * n21 * n33 + n11 * n22 * n33 ) * detInv;

    return tempMatrix
  }

  // 矩阵加法
  add(m: Readonly<Matrix4>): Matrix4 {
    const tempMatrix = new Matrix4()
    const te = tempMatrix.elements
    const ae = this.elements
    const be = m.elements

    for (let i = 0; i < 16; i++) {
      te[i] = ae[i] + be[i]
    }
    return tempMatrix
  }

  // 矩阵减法
  sub(m: Readonly<Matrix4>): Matrix4 {
    const tempMatrix = new Matrix4()
    const te = tempMatrix.elements
    const ae = this.elements
    const be = m.elements

    for (let i = 0; i < 16; i++) {
      te[i] = ae[i] - be[i]
    }
    return tempMatrix
  }

  // 矩阵数乘
  mul(s: number): Matrix4 {
    const tempMatrix = new Matrix4()
    const te = tempMatrix.elements
    const ae = this.elements

    for (let i = 0; i < 16; i++) {
      te[i] = ae[i] * s
    }
    return tempMatrix
  }

  // 对应元素相乘
  mulEle(m: Readonly<Matrix4>): Matrix4 {
    const tempMatrix = new Matrix4()
    const te = tempMatrix.elements
    const ae = this.elements
    const be = m.elements

    for (let i = 0; i < 16; i++) {
      te[i] = ae[i] * be[i]
    }
    return tempMatrix
  }

  // 矩阵乘向量
  dotVec(v: Readonly<Vector4>): Vector4 {
    const newV = new Vector4(v.x, v.y, v.z, v.w)
    const x = v.x, y = v.y, z = v.z, w = v.w
    const e = this.elements
		newV.x = e[ 0 ] * x + e[ 4 ] * y + e[ 8 ] * z + e[ 12 ] * w;
		newV.y = e[ 1 ] * x + e[ 5 ] * y + e[ 9 ] * z + e[ 13 ] * w;
		newV.z = e[ 2 ] * x + e[ 6 ] * y + e[ 10 ] * z + e[ 14 ] * w;
		newV.w = e[ 3 ] * x + e[ 7 ] * y + e[ 11 ] * z + e[ 15 ] * w;
    return newV;
  }

  // 克隆
  clone(): Matrix4 {
    return Matrix4.FromArray(this.elements)
  }
  //复制
  copy(m: Readonly<Matrix4>): Matrix4 {
    const te = this.elements
    const me = m.elements
    te[0] = me[0]; te[4] = me[4]; te[8] = me[8]; te[12] = me[12];
    te[1] = me[1]; te[5] = me[5]; te[9] = me[9]; te[13] = me[13];
    te[2] = me[2]; te[6] = me[6]; te[10] = me[10]; te[14] = me[14];
    te[3] = me[3]; te[7] = me[7]; te[11] = me[11]; te[15] = me[15];
    return this
  }

  // 从数组中创建矩阵
  static FromArray(array: number[]): Matrix4 {
    const m = new Matrix4()
    m.elements = array
    return m
  }

  // 单位矩阵
  static Identity(): Matrix4 {
    return new Matrix4()
  }

  // 旋转矩阵
  static RotationX(angle: number): Matrix4 {
    const m = new Matrix4()
    const theta = degToRad(angle)
    const c = Math.cos(theta)
    const s = Math.sin(theta)
    m.set(
      1, 0, 0, 0,
      0, c, -s, 0,
      0, s, c, 0,
      0, 0, 0, 1,
    )
    return m
  }

  // 旋转矩阵
  static RotationY(angle: number): Matrix4 {
    const m = new Matrix4()
    const theta = degToRad(angle)
    const c = Math.cos(theta)
    const s = Math.sin(theta)
    m.set(
      c, 0, s, 0,
      0, 1, 0, 0,
      -s, 0, c, 0,
      0, 0, 0, 1,
    )
    return m
  }

  // 旋转矩阵
  static RotationZ(angle: number): Matrix4 {
    const m = new Matrix4()
    const theta = degToRad(angle)
    const c = Math.cos(theta)
    const s = Math.sin(theta)
    m.set(
      c, -s, 0, 0,
      s, c, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1,
    )
    return m
  }
  // 从欧拉角创建旋转矩阵
  static RotationFromEuler(euler: Readonly<Euler>): Matrix4 {
    const m = new Matrix4()
    const te = m.elements
    const x = degToRad(euler.x), y = degToRad(euler.y), z = degToRad(euler.z);
		const a = Math.cos( x ), b = Math.sin( x );
		const c = Math.cos( y ), d = Math.sin( y );
		const e = Math.cos( z ), f = Math.sin( z );

		if ( euler.order === 'XYZ' ) {

			const ae = a * e, af = a * f, be = b * e, bf = b * f;

			te[ 0 ] = c * e;
			te[ 4 ] = - c * f;
			te[ 8 ] = d;

			te[ 1 ] = af + be * d;
			te[ 5 ] = ae - bf * d;
			te[ 9 ] = - b * c;

			te[ 2 ] = bf - ae * d;
			te[ 6 ] = be + af * d;
			te[ 10 ] = a * c;

		} else if ( euler.order === 'YXZ' ) {

			const ce = c * e, cf = c * f, de = d * e, df = d * f;

			te[ 0 ] = ce + df * b;
			te[ 4 ] = de * b - cf;
			te[ 8 ] = a * d;

			te[ 1 ] = a * f;
			te[ 5 ] = a * e;
			te[ 9 ] = - b;

			te[ 2 ] = cf * b - de;
			te[ 6 ] = df + ce * b;
			te[ 10 ] = a * c;

		} else if ( euler.order === 'ZXY' ) {

			const ce = c * e, cf = c * f, de = d * e, df = d * f;

			te[ 0 ] = ce - df * b;
			te[ 4 ] = - a * f;
			te[ 8 ] = de + cf * b;

			te[ 1 ] = cf + de * b;
			te[ 5 ] = a * e;
			te[ 9 ] = df - ce * b;

			te[ 2 ] = - a * d;
			te[ 6 ] = b;
			te[ 10 ] = a * c;

		} else if ( euler.order === 'ZYX' ) {

			const ae = a * e, af = a * f, be = b * e, bf = b * f;

			te[ 0 ] = c * e;
			te[ 4 ] = be * d - af;
			te[ 8 ] = ae * d + bf;

			te[ 1 ] = c * f;
			te[ 5 ] = bf * d + ae;
			te[ 9 ] = af * d - be;

			te[ 2 ] = - d;
			te[ 6 ] = b * c;
			te[ 10 ] = a * c;

		} else if ( euler.order === 'YZX' ) {

			const ac = a * c, ad = a * d, bc = b * c, bd = b * d;

			te[ 0 ] = c * e;
			te[ 4 ] = bd - ac * f;
			te[ 8 ] = bc * f + ad;

			te[ 1 ] = f;
			te[ 5 ] = a * e;
			te[ 9 ] = - b * e;

			te[ 2 ] = - d * e;
			te[ 6 ] = ad * f + bc;
			te[ 10 ] = ac - bd * f;

		} else if ( euler.order === 'XZY' ) {

			const ac = a * c, ad = a * d, bc = b * c, bd = b * d;

			te[ 0 ] = c * e;
			te[ 4 ] = - f;
			te[ 8 ] = d * e;

			te[ 1 ] = ac * f + bd;
			te[ 5 ] = a * e;
			te[ 9 ] = ad * f - bc;

			te[ 2 ] = bc * f - ad;
			te[ 6 ] = b * e;
			te[ 10 ] = bd * f + ac;

		}

		// bottom row
		te[ 3 ] = 0;
		te[ 7 ] = 0;
		te[ 11 ] = 0;

		// last column
		te[ 12 ] = 0;
		te[ 13 ] = 0;
		te[ 14 ] = 0;
		te[ 15 ] = 1;

    return m
  }

  // 平移矩阵
  static Translation(x: number, y: number, z: number): Matrix4 {
    const m = new Matrix4()
    m.set(
      1, 0, 0, x,
      0, 1, 0, y,
      0, 0, 1, z,
      0, 0, 0, 1,
    )
    return m
  }
  // 根据向量创建平移矩阵
  static TranslationFromVector(v: Readonly<Vector4>): Matrix4 {
    return Matrix4.Translation(v.x, v.y, v.z)
  }

  // 缩放矩阵
  static Scaling(x: number, y: number, z: number): Matrix4 {
    const m = new Matrix4()
    m.set(
      x, 0, 0, 0,
      0, y, 0, 0,
      0, 0, z, 0,
      0, 0, 0, 1,
    )
    return m
  }
  // 根据向量创建缩放矩阵
  static ScalingFromVector(v: Readonly<Vector4>): Matrix4 {
    return Matrix4.Scaling(v.x, v.y, v.z)
  }

  // 从矩阵中分解出平移矩阵
  static TranslationFromMatrix(m: Readonly<Matrix4>): Vector4 {
    return new Vector4(m.elements[12], m.elements[13], m.elements[14], m.elements[15])
  }
}

export { Matrix4 };
