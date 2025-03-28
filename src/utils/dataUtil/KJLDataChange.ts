/*
 * @Author: lzr 259867057@qq.com
 * @Date: 2025-03-10 16:20:07
 * @LastEditors: lzr 259867057@qq.com
 * @LastEditTime: 2025-03-19 09:17:08
 * @FilePath: \kdPlankCheck\src\services\KJLDataChange.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import type { Transfer } from './IPlugin'
import { getBoardRefCodes } from '@/http/api'
import { CustomAttrPlugin } from './customAttrPlugin'
import { BasePlankPlugin } from './basePlankPlugin'
import { VirtualPlankPlugin } from './virtualPlankPlugin'
import log from '@/utils/log'
import { Module, ModuleInfo, ModuleType, TextureType } from '@/types'
import { Vector4, Euler, Matrix4, roundVec } from '@/utils/math'
import { strToGrowVector4, strToVector4 } from './common'
import { traverseModuleTree, traverseTreeBySubModules } from '@/utils/treeUtil'

class KJLDataChange {
  private Transfers: Map<string, Transfer> = new Map()
  public boardRefCodes: any[] = []
  public addTransfer(transfer: Transfer) {
    this.Transfers.set(transfer.name, transfer)
    return this
  }
  public async translateKDObject(data: any): Promise<any> {
    // 请求必要的数据
    const res = await getBoardRefCodes()
    if (res.status === 200) {
      this.boardRefCodes = res.data
    } else {
      log.error('获取板件编码失败')
      this.boardRefCodes = []
    }
    for (const transfer of this.Transfers.values()) {
      data = transfer.translateData(data)
    }
    return data
  }
  public async translateData(data: any): Promise<Module[]> {
    const kdObj = await this.translateKDObject(data)

    const modules = this.transToModuleData(kdObj)
    let tree = this.buildTree(modules)
    // 过滤掉不包含板件的模块
    tree = this.filterBoardModules(tree)
    calcRelative(tree)
    return tree
  }

  // 获取插件
  public getTransfer(name: string) {
    return this.Transfers.get(name)
  }
  // 转换为模块数据
  transToModuleData(data: any): Module[] {
    if (!data || !data.length) return []
    const modules: Module[] = []
    data.forEach((module: any) => {
      const myModule = new Module()
      myModule.ObjID = module.ObjID
      myModule.ParentId = module.ParentId
      myModule.ObjName = module.Info.Info.KuName || module.ObjName
      myModule.Dim = new Vector4(module.ObjWidth, module.ObjDepth, module.ObjHeight, 1)
      myModule.AbsPos = new Vector4(module.ObjPosX, module.ObjPosY, module.ObjPosZ, 1)
      myModule.AbsRot = new Euler(module.ObjPosOX, module.ObjPosOY, module.ObjPosOZ, 'ZXY')
      myModule.modelType = module.ObjType
      myModule.ObjRefCode = module.ObjRefCode

      myModule.texture = module.TextureName
      myModule.textureType = TextureType.unknown
      if (module.PlankTowardType?.includes('竖纹')) {
        myModule.textureType = TextureType.Vertical
      } else if (module.PlankTowardType?.includes('横纹')) {
        myModule.textureType = TextureType.Horizontal
      }

      myModule.Info = new ModuleInfo()
      myModule.Info.Info.KDParentSceneID = module.Info.Info.kdParentSceneId || ''
      myModule.Info.Info.KdSceneId = module.Info.Info.kdSceneId || ''
      myModule.Info.Info.KuName = module.Info.Info.KuName || ''
      myModule.Info.Info.modelBrandGoodCode = module.Info.Info.modelBrandGoodCode || ''

      // 补单类型
      myModule.Info.Info.BDType2 = module.Info.Info.BDType2 || ''
      // 模型导入字段
      myModule.Info.Info.BDImportModelType = module.Info.Info.BDImportModelType || ''

      // 朝向向量
      if (module.towardVecInWorld) {
        myModule.towardVecInWorld = module.towardVecInWorld
      }

      // 孔的增长方向和朝向
      if (module.ObjType === 'Hole') {
        // 孔的参数
        myModule.parameters.holeDiameter = parseFloat(module.Info.Info.ZJ)
        myModule.parameters.holeHeight = parseFloat(module.Info.Info.GD)
        const towardStr = module.Info.Info.YSFX
        const angleZ = module.ObjPosOZ
        // 孔在世界中的真实朝向
        const R = Matrix4.RotationFromEuler(new Euler(0, 0, angleZ - 180, 'ZXY'))
        myModule.towardVecInWorld = roundVec(R.dotVec(strToVector4(towardStr)), 0)
      }

      // 槽的增长方向和朝向
      if (module.ObjType === 'Groove') {
        const towardStr = module.Info.Info.YSFX
        const angleZ = module.ObjPosOZ
        // 槽在世界中的真实朝向
        const R = Matrix4.RotationFromEuler(new Euler(0, 0, angleZ - 180, 'ZXY'))
        myModule.towardVecInWorld = roundVec(R.dotVec(strToVector4(towardStr)), 0)
        // 槽的参数
        myModule.parameters.grooveDepth = module.Info.Info.Depth
        myModule.parameters.grooveLength = module.Info.Info.Size_x
        myModule.parameters.grooveWidth = module.Info.Info.Size_y
        const growStr = module.Info.Info.LengthAxis
        myModule.parameters.grooveInWorldToward = roundVec(R.dotVec(strToGrowVector4(growStr)), 0)
      }
      // 异形点
      if (module.PLOutLinePoints) {
        myModule.PLOutLinePoints = module.PLOutLinePoints
      }
      modules.push(myModule)
    })
    return modules
  }

  buildTree(data: Module[]): Module[] {
    if (!data || !data.length) return []
    const kdSceneIdMap: { [key: string]: Module } = {} // 用于快速查找节点的映射
    const objIDMap: { [key: string]: Module } = {} // 用于快速查找节点的映射
    const tree: Module[] = [] // 存放最终的树结构
    // 遍历节点列表，将每个节点添加到映射中
    data.forEach((node) => {
      const info = node?.Info?.Info
      if (info) {
        node.SubModules = []
        if (info.KdSceneId && info.KDParentSceneID) {
          kdSceneIdMap[info.KdSceneId] = node
        }
        objIDMap[node.ObjID] = node
      }
    })
    // 遍历节点列表，构建树结构
    data.forEach((node) => {
      const info = node?.Info?.Info
      if (info) {
        if (info.KDParentSceneID === '-1') {
          tree.push(node)
        } else {
          const parentNode = kdSceneIdMap[info.KDParentSceneID]
          if (parentNode) {
            // 更新parentId
            node.ParentId = parentNode.ObjID
            parentNode.SubModules.push(node)
          } else {
            const pNode = objIDMap[node.ParentId]
            if (pNode) {
              // 更新parentId
              node.ParentId = pNode.ObjID
              pNode.SubModules.push(node)
            } else {
              tree.push(node)
            }
          }
        }
      } else {
        tree.push(node)
      }
    })
    return tree
  }

  // 过滤掉不包含板件的模块
  filterBoardModules(modules: Module[]): Module[] {
    const boardModules: Module[] = []
    modules.forEach((module) => {
      // 递归检查子节点是否包含板件
      let hasBoard = false
      traverseTreeBySubModules(module.SubModules, (sub) => {
        if (sub.modelType === ModuleType.JCBoard) {
          hasBoard = true
        }
      })
      if (hasBoard) {
        boardModules.push(module)
      }
    })
    return boardModules
  }
}

export function calcRelative(modules: Module[]) {
  if (!modules || !modules.length) return

  const calcRelativePosAndRot = (sub: Module[], parent: Module | null) => {
    if (!sub || !sub.length) return
    if (!parent) {
      sub.forEach((node) => {
        node.relativePos = node.AbsPos.clone()
        node.relativeRot = node.AbsRot.clone()
      })
    } else {
      const PWToL = parent.WorldToLocalMatrix
      const PWToLR = parent.WorldToLocalRotMatrix
      sub.forEach((module) => {
        module.relativePos = PWToL.dotVec(module.AbsPos)
        const CLToWR = module.LocalToWorldRotMatrix
        const R = PWToLR.dot(CLToWR)
        const euler = Euler.FromRotationMatrix(R, 'ZXY')
        module.relativeRot = new Euler(euler.x, euler.y, euler.z, 'ZXY')
        // 转换为相对朝向
        if (module.towardVecInWorld) {
          module.towardVecInParent = roundVec(PWToLR.dotVec(module.towardVecInWorld), 0)
        }
        if (module.parameters.grooveInWorldToward) {
          module.parameters.grooveInParentToward = roundVec(
            PWToLR.dotVec(module.parameters.grooveInWorldToward),
            0,
          )
        }
      })
    }
  }

  traverseModuleTree(modules, null, (sub, parent) => {
    calcRelativePosAndRot(sub, parent)
  })
}

const kjlDataChange = new KJLDataChange()
const customAttrPlugin = new CustomAttrPlugin(kjlDataChange)
const basePlankPlugin = new BasePlankPlugin(kjlDataChange)
const virtualPlankPlugin = new VirtualPlankPlugin(kjlDataChange)

kjlDataChange.addTransfer(customAttrPlugin)
kjlDataChange.addTransfer(basePlankPlugin)
kjlDataChange.addTransfer(virtualPlankPlugin)

export { kjlDataChange, KJLDataChange }
