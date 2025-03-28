// 处理虚拟板的插件
import type { Transfer } from './IPlugin'
import { KJLDataChange } from './KJLDataChange'
import log from '@/utils/log'
// 处理虚拟板的插件,根据板件类型生成虚拟路径
export class VirtualPlankPlugin implements Transfer {
  name = 'VirtualPlankPlugin'
  description = '处理虚拟板的插件'
  kjlDataChange: KJLDataChange
  constructor(kjlDataChange: KJLDataChange) {
    this.kjlDataChange = kjlDataChange
  }
  translateData(data: any): any {
    const virtualPlanks: any[] = []
    for (const module of data) {
      if (module.ObjType === 'JCBoard' && module.Info.Info.BDImportModelType?.trim()) {
        const virtualPlank = this.calcVirtualPlank(module)
        if (virtualPlank) {
          virtualPlanks.push(virtualPlank)
        }
      }
    }
    data.push(...virtualPlanks)
    return data
  }
  // 计算虚拟板
  calcVirtualPlank(module: any) {
    const virtualPlank: any = {}
    return null
  }
}
