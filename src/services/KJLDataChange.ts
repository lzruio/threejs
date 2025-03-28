/*
 * @Author: lzr 259867057@qq.com
 * @Date: 2025-03-10 16:20:07
 * @LastEditors: lzr 259867057@qq.com
 * @LastEditTime: 2025-03-10 16:49:19
 * @FilePath: \kdPlankCheck\src\services\KJLDataChange.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import type { Transfer } from './dataPlugins'
import { kdDataToModule, calcRelative } from '@/utils/kd8DataUtil'
import { Module } from '@/types'
import { CalcBoardTypePlugin, GroupingModulePlugin, FilterModulePlugin } from './dataPlugins'
class KJLDataChange {
  private Transfers: Map<string, Transfer> = new Map()

  public addTransfer(transfer: Transfer) {
    this.Transfers.set(transfer.name, transfer)
    return this
  }
  public translateData(data: any): Module[] {
    let modules = kdDataToModule(data)
    for (const transfer of this.Transfers.values()) {
      modules = transfer.translateData(modules)
    }
    return modules
  }

  // 获取插件
  public getTransfer(name: string) {
    return this.Transfers.get(name)
  }

  // 自上到下，更新子模型的相对坐标
  public updateRelativePosition(modules: Module[]) {
    calcRelative(modules)
  }
}

const kjlDataChange = new KJLDataChange()
const calcTypePlugin = new CalcBoardTypePlugin(kjlDataChange)
const groupPlugin = new GroupingModulePlugin(kjlDataChange)
const filterPlugin = new FilterModulePlugin(kjlDataChange)
kjlDataChange.addTransfer(calcTypePlugin)
kjlDataChange.addTransfer(groupPlugin)
kjlDataChange.addTransfer(filterPlugin)

export { kjlDataChange, KJLDataChange }
