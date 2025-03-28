import type { Transfer } from './IPlugin'
import { getBoardRefCodes } from '@/http/api'
import { isFloatEqual } from '@/utils/math/mathUtil'
import { KJLDataChange } from './KJLDataChange'
import log from '@/utils/log'
class CustomAttrPlugin implements Transfer {
  name = 'CustomAttrPlugin'
  description = '生成必要属性的插件'
  kjlDataChange: KJLDataChange
  constructor(kjlDataChange: KJLDataChange) {
    this.kjlDataChange = kjlDataChange
  }
  translateData(data: any): any {
    const boardRefCodes = this.kjlDataChange.boardRefCodes
    data.forEach((module: any) => {
      // id字符化
      module.ParentId = module.ParentId.toString()
      module.ObjID = module.ObjID.toString()

      // 重新生成 modelBrandGoodCode编码
      if (module?.Info?.Info) {
        module.Info.Info = this.caseInsensitiveProxy(module.Info.Info)
        const info = this.parseObjDesc(module)
        module.Info.Info.modelBrandGoodCode = info.modelBrandGoodCode
      }

      // 生成板件类型
      const boardRefCode = boardRefCodes.find((code) => code === module.ObjRefCode)
      if (boardRefCode) {
        module.ObjType = 'Board'
        module.PanelThickness = this.calcThickness(module)
        this.reverseTexture(module)
        module.PlankTowardType = this.calcPlankTowardType(module)
      } else if (this.isHoleModule(module)) {
        // 孔洞
        module.ObjType = 'Hole'
      } else if (this.isGrooveModule(module)) {
        // 槽口
        module.ObjType = 'Groove'
      } else if (this.isDoorBoard(module)) {
        // 门板
        module.ObjType = 'DoorBoard'
      }
    })
    return data
  }

  reverseTexture(module: any) {
    const reverseObjRefCodes = ['KuWLBBT', 'KuHBT', 'KuSBT', 'Ku18BBT', 'KuCTSB']
    if (reverseObjRefCodes.includes(module?.ObjRefCode)) {
      if (module?.TextureCode?.includes('R')) {
        module.TextureCode = module.TextureCode.replace('R', 'N')
      } else if (module?.TextureCode?.includes('N')) {
        module.TextureCode = module.TextureCode.replace('N', 'R')
      }
    }
  }

  isHoleModule(module: any) {
    const keyWord = ['ZJ', 'GD', 'YSFX']
    return keyWord.every((word) => module.ObjDesc?.includes(word))
  }
  isGrooveModule(module: any) {
    return module.Info?.Info?.modelBrandGoodCode?.startsWith('Groove_')
  }
  // 门板
  isDoorBoard(module: any) {
    const doorCodeList = ['GJ_CMGJ_', 'GJ_FMGJ_', 'GJ_MXHQGJ_', 'GJ_PKGJ_']
    const Info = module?.Info?.Info
    if (!Info) return false
    const isDoor = doorCodeList.some((code) => Info.modelBrandGoodCode?.startsWith(code))
    return isDoor
  }

  // 计算板件类型
  calcPlankTowardType(module: any) {
    // XY平面上的板
    if (isFloatEqual(module?.PanelThickness, module?.ObjHeight)) {
      // 竖纹
      if (module.TextureCode?.includes('R')) {
        return '横板竖纹'
      } else if (module.TextureCode?.includes('N')) {
        return '横板横纹'
      }
    }
    // YZ平面上的板
    else if (isFloatEqual(module?.PanelThickness, module?.ObjWidth)) {
      // 竖纹
      if (module.TextureCode?.includes('N')) {
        return '竖板竖纹'
      } else if (module.TextureCode?.includes('R')) {
        return '竖板横纹'
      }
    }
    // XZ平面上的板
    else if (isFloatEqual(module?.PanelThickness, module?.ObjDepth)) {
      // 竖纹
      if (module.TextureCode?.includes('R')) {
        return '背板竖纹'
      } else if (module.TextureCode?.includes('N')) {
        return '背板横纹'
      }
    }
    return ''
  }

  // 计算厚度
  calcThickness(module: any) {
    const X = module.ObjWidth
    const Y = module.ObjDepth
    const Z = module.ObjHeight
    // 最小值即为厚度
    return Math.min(X, Y, Z)
  }

  // 解析ObjDesc
  parseObjDesc(module: any) {
    const ObjDesc = module.ObjDesc
    const data: any = {}
    if (ObjDesc) {
      try {
        const parts = ObjDesc.split('!')
        parts.forEach((part: any) => {
          const keyValue = part.split(':=')
          const key = keyValue[0]?.trim()
          const value = keyValue[1]?.trim()
          data[key] = value
        })
      } catch (e) {
        console.log('解析ObjDesc失败')
        console.log(e)
      }
    }
    return data
  }

  // 不区分大小写的代理对象
  caseInsensitiveProxy(obj: any) {
    return new Proxy(obj, {
      get(target, prop) {
        const propStr = prop
        // 如果属性存在，直接返回
        if (propStr in target) {
          return target[propStr]
        }
        // 如果不是字符串，直接返回
        if (typeof propStr !== 'string') {
          return undefined
        }
        // 尝试以不区分大小写的方式访问属性
        const propLower = propStr?.toLowerCase()
        const key = Object.keys(target).find((k) => k.toLowerCase() === propLower)
        return key ? target[key] : undefined
      },
      set(target, prop, value) {
        // 如果属性存在，直接设置
        if (prop in target) {
          target[prop] = value
          return true
        }
        // 如果不是字符串，直接返回
        if (typeof prop !== 'string') {
          return false
        }

        // 尝试以不区分大小写的方式设置属性
        const propLower = prop.toLowerCase()
        const key = Object.keys(target).find((k) => k.toLowerCase() === propLower)
        if (key) {
          target[key] = value
        } else {
          target[prop] = value
        }
        return true
      },
    })
  }
}

export { CustomAttrPlugin }
