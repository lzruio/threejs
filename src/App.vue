<!--
 * @Author: lzr 259867057@qq.com
 * @Date: 2025-03-07 16:50:17
 * @LastEditors: lzr 259867057@qq.com
 * @LastEditTime: 2025-03-13 16:34:40
 * @FilePath: \kdPlankCheck\src\App.vue
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
-->
<template>
  <div class="min-h-screen flex flex-col ">
    <router-view v-slot="{ Component }">
      <keep-alive include="Home,PlankDetail">
        <component :is="Component" :key="$route.fullPath" />
      </keep-alive>
    </router-view>
  </div>
</template>

<script setup lang="ts">
</script>
