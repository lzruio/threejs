<!--
 * @Author: lzr 259867057@qq.com
 * @Date: 2025-03-13 16:02:10
 * @LastEditors: lzr 259867057@qq.com
 * @LastEditTime: 2025-03-19 09:28:18
 * @FilePath: \kdPlankCheck\src\components\plankDetail\threeJsScene.vue
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
-->
<template>
  <div :ref="(el) => (containerRef = el as Element)"></div>
</template>
<script setup lang="ts">

import { Module } from '@/types'

import log from '@/utils/log'

import { subThreeService } from '@/hooks/useSubThreejs'
import { useSubThreejs } from '@/hooks/useSubThreejs'
import { useSceneStore } from '@/stores/scene'
const containerRef = ref<Element | null>(null);

const { drawPlankHolesAndGrooves } = useSubThreejs()

// 初始化
onMounted(() => {
  if (containerRef.value) {
    // 初始化
    subThreeService.start(containerRef.value, false);
  }
})

let currentPlank = null as Module | null;
// 跳转到本组件时
onActivated(() => {
  const sceneStore = useSceneStore();
  const JCB = sceneStore.currentPlank;
  if (!JCB || currentPlank === JCB) return;
  currentPlank = JCB;
  drawPlankHolesAndGrooves(JCB)
})



</script>
