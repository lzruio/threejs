<!--
 * @Author: lzr 259867057@qq.com
 * @Date: 2025-03-13 15:25:01
 * @LastEditors: lzr 259867057@qq.com
 * @LastEditTime: 2025-03-14 14:35:43
 * @FilePath: \kdPlankCheck\src\views\PlankDetail.vue
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
-->
<template>
  <div class="h-10">
    <PlankDetailHeader />
  </div>
  <div class="flex-1 overflow-auto bg-gray-100 p-1 bg-white">
    <PlankMain />
  </div>
</template>
<script setup lang="ts">
import PlankDetailHeader from '@/components/plankDetail/plankHeader.vue'
import PlankMain from '@/components/plankDetail/plankMain.vue'
</script>
