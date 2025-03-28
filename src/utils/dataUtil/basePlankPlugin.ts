/*
 * @Author: lzr 259867057@qq.com
 * @Date: 2025-03-11 08:27:02
 * @LastEditors: lzr 259867057@qq.com
 * @LastEditTime: 2025-03-13 11:31:48
 * @FilePath: \kdPlankCheck\src\utils\dataUtil\basePlankPlugin.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import type { Transfer } from './IPlugin'
import { KJLDataChange } from './KJLDataChange'
import { Vector4, Euler, Matrix4, roundVec } from '@/utils/math'
import guid from 'guid'
import { genAbPoints, fillAbPoints } from './abPoint'
import { strToVector4 } from './common'
import log from '@/utils/log'

// 构建基础板的插件
export class BasePlankPlugin implements Transfer {
  name = 'BasePlankPlugin'
  description = '构建基础板的插件'
  kjlDataChange: KJLDataChange
  constructor(kjlDataChange: KJLDataChange) {
    this.kjlDataChange = kjlDataChange
  }

  translateData(data: any): any {
    const basePlanks: any[] = []
    for (const module of data) {
      if (module.ObjType === 'Board') {
        const basePlank = this.calcBasePlank(module)
        if (basePlank) {
          basePlanks.push(basePlank)
        }
      }
    }
    data.push(...basePlanks)
    return data
  }
  // 计算基础板
  calcBasePlank(module: any) {
    try {
      // 相对位置的基础板
      const basePlank: any = this.calcBasePlankRelativePos(module)

      basePlank.Info.Info.modelBrandGoodCode = module.Info.Info.modelBrandGoodCode
      basePlank.ObjRefCode = module.ObjRefCode
      basePlank.TextureName = module.TextureName
      basePlank.Info.Info.BDType2 = module.Info.Info.BDType2
      basePlank.PlankTowardType = ''
      if (module.PlankTowardType?.includes('竖纹')) {
        basePlank.PlankTowardType = '竖纹'
      } else if (module.PlankTowardType?.includes('横纹')) {
        basePlank.PlankTowardType = '横纹'
      }

      // 生成异形点
      basePlank.PLOutLinePoints = genAbPoints(module, basePlank)
      // 扩展异形点
      basePlank.PLOutLinePoints = fillAbPoints(basePlank.PLOutLinePoints, 20)

      const parentR = Matrix4.RotationFromEuler(
        new Euler(module.ObjPosOX, module.ObjPosOY, module.ObjPosOZ, 'ZXY'),
      )

      // 绝对坐标
      const Pos = new Vector4(module.ObjPosX, module.ObjPosY, module.ObjPosZ, 1)
      const L2W = Matrix4.Translation(Pos.x, Pos.y, Pos.z).dot(parentR)
      const AbsPos = L2W.dotVec(basePlank.relativePos as Vector4)

      basePlank.ObjPosX = AbsPos.x
      basePlank.ObjPosY = AbsPos.y
      basePlank.ObjPosZ = AbsPos.z

      // 绝对欧拉角
      const childR = Matrix4.RotationFromEuler(basePlank.relativeRot as Euler)
      const R = parentR.dot(childR)
      const euler = Euler.FromRotationMatrix(R, 'ZXY')
      basePlank.ObjPosOX = euler.x
      basePlank.ObjPosOY = euler.y
      basePlank.ObjPosOZ = euler.z

      // 在世界的朝向向量
      basePlank.towardVecInWorld = roundVec(R.dotVec(strToVector4('Z+')), 0)

      return basePlank
    } catch (error) {
      log.error('计算基础板失败', error)
      return null
    }
  }

  // 计算基础板的相对位置
  calcBasePlankRelativePos(module: any) {
    const basePlank: any = {}
    basePlank.ObjID = guid.raw()
    basePlank.ParentId = module.ObjID
    basePlank.ObjName = module.ObjName
    basePlank.ObjType = 'JCBoard'
    // 维度
    basePlank.ObjWidth = 0
    basePlank.ObjDepth = 0
    basePlank.ObjHeight = 0

    basePlank.relativePos = new Vector4(0, 0, 0, 1)
    basePlank.relativeRot = new Euler(0, 0, 0, 'ZXY')
    basePlank.Info = {
      Info: {},
    }
    const relativeRot = new Euler(0, 0, 0, 'ZXY')

    // 相对于父物体的旋转角度
    if (module.PlankTowardType === '横板横纹') {
      relativeRot.x = 0
      relativeRot.y = 0
      relativeRot.z = 0
      basePlank.ObjWidth = module.ObjWidth
      basePlank.ObjDepth = module.ObjDepth
      basePlank.ObjHeight = module.ObjHeight
      basePlank.relativePos.x = 0
      basePlank.relativePos.y = 0
      basePlank.relativePos.z = 0
    } else if (module.PlankTowardType === '横板竖纹') {
      relativeRot.x = 0
      relativeRot.y = 0
      relativeRot.z = 90
      basePlank.ObjWidth = module.ObjDepth
      basePlank.ObjDepth = module.ObjWidth
      basePlank.ObjHeight = module.ObjHeight
      basePlank.relativePos.x = 0 + module.ObjWidth
      basePlank.relativePos.y = 0
      basePlank.relativePos.z = 0
    } else if (module.PlankTowardType === '竖板竖纹') {
      relativeRot.x = 0
      relativeRot.y = -90
      relativeRot.z = 0
      basePlank.ObjWidth = module.ObjHeight
      basePlank.ObjDepth = module.ObjDepth
      basePlank.ObjHeight = module.ObjWidth
      basePlank.relativePos.x = 0 + module.ObjWidth
      basePlank.relativePos.y = 0
      basePlank.relativePos.z = 0
    } else if (module.PlankTowardType === '竖板横纹') {
      relativeRot.x = 90
      relativeRot.y = -90
      relativeRot.z = 0
      basePlank.ObjWidth = module.ObjDepth
      basePlank.ObjDepth = module.ObjHeight
      basePlank.ObjHeight = module.ObjWidth
      basePlank.relativePos.x = 0 + module.ObjWidth
      basePlank.relativePos.y = 0 + module.ObjDepth
      basePlank.relativePos.z = 0
    } else if (module.PlankTowardType === '背板竖纹') {
      relativeRot.x = 0
      relativeRot.y = -90
      relativeRot.z = -90
      basePlank.ObjWidth = module.ObjHeight
      basePlank.ObjDepth = module.ObjWidth
      basePlank.ObjHeight = module.ObjDepth
      basePlank.relativePos.x = 0
      basePlank.relativePos.y = 0
      basePlank.relativePos.z = 0
    } else if (module.PlankTowardType === '背板横纹') {
      relativeRot.x = 90
      relativeRot.y = 0
      relativeRot.z = 0
      basePlank.ObjWidth = module.ObjWidth
      basePlank.ObjDepth = module.ObjHeight
      basePlank.ObjHeight = module.ObjDepth
      basePlank.relativePos.x = 0
      basePlank.relativePos.y = 0 + module.ObjDepth
      basePlank.relativePos.z = 0
    } else {
      throw new Error('板件朝向类型错误')
    }
    basePlank.relativeRot = relativeRot

    return basePlank
  }
}
