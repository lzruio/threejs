import { Vector4, Euler, Matrix4 } from '@/utils/math'
import { AABB } from './AABB'
import { getModuleById, traverseTreeBySubModules } from '@/utils/treeUtil'

interface IModule {
  ObjID: string
  ParentId: string
  ObjName: string
  // 模型的类型
  modelType: ModuleType
  ObjRefCode: string
  // 异形路径
  PLOutLinePoints: PLOutLinePoint[]

  // 相对的位置和坐标
  Dim: Vector4
  AbsPos: Vector4
  AbsRot: Euler
  relativePos: Vector4
  relativeRot: Euler
  SubModules: Module[]
  // 模型信息
  Info: ModuleInfo

  // 材质
  texture: string
  // 朝向向量
  towardVecInWorld: Vector4
  towardVecInParent: Vector4
  // 参数
  parameters: ModuleParameters
}

// 实际的模型
class Module implements IModule {
  // 模型id
  ObjID: string
  // 父id
  ParentId: string
  // 模型名称
  ObjName: string
  // 模型类型
  modelType: ModuleType
  // 模型参考码
  ObjRefCode: string
  // 异形路径
  PLOutLinePoints: PLOutLinePoint[] = []
  // 大小
  Dim: Vector4
  // 位置
  AbsPos: Vector4
  relativePos: Vector4
  // 旋转
  AbsRot: Euler
  relativeRot: Euler
  // 子模型
  SubModules: Module[] = []
  // 材质
  texture: string
  // 纹路类型
  textureType: TextureType

  // 朝向向量(孔,板,槽的增长方向)
  towardVecInWorld: Vector4
  towardVecInParent: Vector4

  // 参数
  parameters: ModuleParameters = new ModuleParameters()
  // 附加字段
  Info: ModuleInfo
  constructor() {
    this.ObjRefCode = ''
    this.modelType = ModuleType.unknown

    this.ObjID = ''
    this.ParentId = ''
    this.ObjName = ''
    this.Info = new ModuleInfo()
    this.Dim = new Vector4(0, 0, 0, 1)
    this.AbsPos = new Vector4(0, 0, 0, 1)
    this.AbsRot = new Euler(0, 0, 0, 'ZXY')
    this.relativePos = new Vector4(0, 0, 0, 1)
    this.relativeRot = new Euler(0, 0, 0, 'ZXY')
    this.towardVecInWorld = new Vector4(0, 0, 1, 1)
    this.towardVecInParent = new Vector4(0, 0, 1, 1)

    // 默认没有纹路
    this.texture = ''
    this.textureType = TextureType.unknown
  }

  // 局部转世界的旋转矩阵
  get LocalToWorldRotMatrix(): Matrix4 {
    const euler = new Euler(this.AbsRot.x, this.AbsRot.y, this.AbsRot.z, 'ZXY')
    const R = Matrix4.RotationFromEuler(euler)
    return R
  }
  // 局部转世界的平移矩阵
  get LocalToWorldTransMatrix(): Matrix4 {
    const T = Matrix4.TranslationFromVector(this.AbsPos)
    return T
  }
  // 局部转世界矩阵
  get LocalToWorldMatrix(): Matrix4 {
    const R = this.LocalToWorldRotMatrix
    const T = this.LocalToWorldTransMatrix
    return T.dot(R)
  }

  // 世界转局部旋转矩阵
  get WorldToLocalRotMatrix(): Matrix4 {
    const euler = new Euler(-this.AbsRot.x, -this.AbsRot.y, -this.AbsRot.z, 'YXZ')
    const R = Matrix4.RotationFromEuler(euler)
    return R
  }
  // 世界转局部平移矩阵
  get WorldToLocalTransMatrix(): Matrix4 {
    const Pos = new Vector4(-this.AbsPos.x, -this.AbsPos.y, -this.AbsPos.z, 1)
    const T = Matrix4.TranslationFromVector(Pos)
    return T
  }
  // 世界转局部矩阵
  get WorldToLocalMatrix(): Matrix4 {
    const R = this.WorldToLocalRotMatrix
    const T = this.WorldToLocalTransMatrix
    return R.dot(T)
  }

  // 获取aabb盒子
  get AABB(): AABB {
    const origin = new Vector4(0, 0, 0, 1)
    return AABB.fromVector(origin, this.Dim).transform(this.LocalToWorldMatrix)
  }

  // 根据id查找本棵树下的模型
  getModelById(id: string): Module | null {
    return getModuleById(id, [this])
  }
  // 进行深度遍历
  traverse(callback: (module: Module) => void) {
    traverseTreeBySubModules(this, callback)
  }
}

// 参数
class ModuleParameters {
  // 孔洞的直径
  holeDiameter?: number
  // 孔洞的高度
  holeHeight?: number

  // 槽的深度
  grooveDepth?: number
  // 槽的宽度
  grooveWidth?: number
  // 槽的长度
  grooveLength?: number
  // 槽的延伸方向
  grooveInWorldToward?: Vector4
  // 槽的局部方向
  grooveInParentToward?: Vector4
}

// 异形点
class PLOutLinePoint {
  public X: number
  public Y: number
  public Z: number
  public Type: PLOutLinePointType

  constructor() {
    this.X = 0
    this.Y = 0
    this.Z = 0
    this.Type = PLOutLinePointType.Normal
  }
}

// 模型信息
class ModuleInfo {
  Info: InfoDetail = new InfoDetail()
}
class InfoDetail {
  KuName: string = ''
  KdSceneId: string = ''
  KDParentSceneID: string = ''
  modelBrandGoodCode: string = ''
  BDImportModelType: string = ''
  BDType2: string = ''
}

enum PLOutLinePointType {
  // 普通点
  Normal = 0,
  // 弧线点
  Arc = 1,
}

export enum ModuleType {
  // 未知
  unknown = '',
  // 本程序中的基础板件
  JCBoard = 'JCBoard',
  // KD8的基础板件
  Board = 'Board',
  // 孔
  Hole = 'Hole',
  // 槽
  Groove = 'Groove',
  // 门板
  DoorBoard = 'DoorBoard',
}

// 绘制的模型类型
export enum MeshType {
  // 板
  Board = '板',
  BoardEdge = '板边',
  // 孔
  Hole = '孔',
  HoleEdge = '孔边',
  // 槽
  Groove = '槽',
  GrooveEdge = '槽边',
  // 标记
  Mark = '标记',
}

// 纹路类型
export enum TextureType {
  // 未知
  unknown = '',
  // 竖纹
  Vertical = '竖纹',
  // 横纹
  Horizontal = '横纹',
}

export { Module, PLOutLinePoint, PLOutLinePointType, ModuleInfo, InfoDetail }
