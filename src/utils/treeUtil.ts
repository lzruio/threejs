/*
 * @Author: lzr 259867057@qq.com
 * @Date: 2025-03-10 16:19:53
 * @LastEditors: lzr 259867057@qq.com
 * @LastEditTime: 2025-03-12 11:11:48
 * @FilePath: \kdPlankCheck\src\utils\treeUtil.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import type { Module } from '@/types'

// 递归遍历, 深度优先,通过回调函数处理每个子节点
export function traverseTreeBy(tree: any, callback: (node: any) => void) {
  tree.forEach((node: any) => {
    callback(node)
    if (node.subModels) {
      traverseTreeBy(node.subModels, callback)
    }
  })
}
// SubModules
export function traverseTreeBySubModules(tree: any, callback: (node: any) => void) {
  tree.forEach((node: any) => {
    callback(node)
    if (node.SubModules) {
      traverseTreeBySubModules(node.SubModules, callback)
    }
  })
}
// children
export function traverseTreeByChildren(tree: any, callback: (node: any) => void) {
  tree.forEach((node: any) => {
    callback(node)
    if (node.children) {
      traverseTreeByChildren(node.children, callback)
    }
  })
}

// 传入父节点和子节点的深度遍历函数
export function traverseModuleTree(
  sub: Module[],
  parent: Module | null,
  callback: (sub: Module[], parent: Module | null) => void,
) {
  callback(sub, parent)
  if (sub.length > 0) {
    sub.forEach((sub) => {
      traverseModuleTree(sub.SubModules, sub, callback)
    })
  }
}

// 根据id获取节点
export function getModuleById(id: string, data: Module[]) {
  let module: Module | null = null
  traverseTreeBySubModules(data, (node) => {
    if (node.ObjID === id) {
      module = node
    }
  })
  return module
}
