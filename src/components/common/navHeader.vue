<!--
 * @Author: lzr 259867057@qq.com
 * @Date: 2025-03-08 09:11:22
 * @LastEditors: lzr 259867057@qq.com
 * @LastEditTime: 2025-03-13 15:46:56
 * @FilePath: \kdPlankCheck\src\components\common\navHeader.vue
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
-->
<!-- 公共头部导航栏样式 -->
<template>
  <div class="bg-white shadow-sm h-full z-50">
    <div class="mx-auto px-4 sm:px-6 lg:px-8 h-full w-full">
      <div class="flex items-center justify-between h-full w-full">
        <!-- 暴露左中右插槽 -->
        <div class="flex-shrink-0">
          <slot name="left" />
        </div>

        <div class="absolute left-1/2 transform -translate-x-1/2">
          <slot name="center" />
        </div>

        <div class="flex-shrink-0 ml-auto"> <!-- 添加 ml-auto -->
          <slot name="right" />
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
</script>
