/*
 * @Author: lzr 259867057@qq.com
 * @Date: 2025-03-11 10:05:56
 * @LastEditors: lzr 259867057@qq.com
 * @LastEditTime: 2025-03-21 10:37:11
 * @FilePath: \kdPlankCheck\src\stores\scene.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { defineStore } from 'pinia'
import { ModuleType } from '@/types'
import type { Module, CabinetData, BoardData } from '@/types'
import * as treeUtil from '@/utils/treeUtil'

export const useSceneStore = defineStore('scene', () => {
  // 本次的模型数据
  const modules: Ref<Module[]> = ref([])

  // 柜子列表
  const cabinets = computed(() => {
    const cabinetData: CabinetData[] = []
    for (let i = 0; i < modules.value.length; i++) {
      const module = modules.value[i]
      cabinetData.push({
        key: module.ObjID,
        index: i + 1,
        name: module.ObjName,
        width: module.Dim.x,
        depth: module.Dim.y,
        height: module.Dim.z,
      })
    }
    return cabinetData
  })

  // 板件列表
  const boards = computed(() => {
    const boardData: BoardData[] = []
    let i = 1
    treeUtil.traverseTreeBySubModules(modules.value, (module: Module) => {
      if (module.modelType === ModuleType.JCBoard) {
        boardData.push({
          key: module.ObjID,
          index: i,
          name: module.ObjName,
          length: module.Dim.x,
          width: module.Dim.y,
          thickness: module.Dim.z,
          textureType: module.textureType,
        })
        i++
      }
    })
    return boardData
  })

  const getModules = () => {
    return modules.value
  }
  const setModules = (data: Module[]) => {
    modules.value = data
  }

  // 当前选中的模型ID
  const currentModelID = ref<string | null>(null)
  // 设置当前选中的模型ID
  const setCurrentModelID = (id: string) => {
    currentModelID.value = id
  }
  // 获取当前选中的模型ID
  const getCurrentModelID = () => {
    return currentModelID.value
  }

  // 当前选中的柜体
  const currentCabinet = ref<Module | null>(null)
  // 设置当前选中的柜体
  const setCurrentCabinetByID = (id: string) => {
    const cabinet = modules.value.find((module) => module.ObjID === id)
    if (cabinet) {
      currentCabinet.value = cabinet
    }
  }
  // 获取当前选中的柜体
  const getCurrentCabinet = () => {
    return currentCabinet.value
  }

  // 当前选中的板件
  const currentPlank = ref<Module | null>(null)

  // 设置当前选中的板件
  const setCurrentPlankByID = (id: string) => {
    const plank = treeUtil.getModuleById(id, modules.value)
    if (plank) {
      currentPlank.value = plank
    }
  }

  // 获取当前选中的板件
  const getCurrentPlank = () => {
    return currentPlank.value
  }

  // 根据id获取模型
  const getModuleById = (id: string) => {
    return treeUtil.getModuleById(id, modules.value)
  }

  return {
    cabinets,
    boards,
    currentCabinet,
    currentPlank,
    getModules,
    setModules,
    setCurrentCabinetByID,
    getCurrentCabinet,
    setCurrentPlankByID,
    getCurrentPlank,
    getModuleById,
    setCurrentModelID,
    getCurrentModelID,
  }
})
