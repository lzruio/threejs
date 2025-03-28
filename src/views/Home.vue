<template>
  <div class="h-10">
    <HomeHeader />
  </div>
  <div class="flex-1 overflow-auto bg-gray-100 p-1">
    <HomeMain />
  </div>
</template>
<script setup lang="ts">
import HomeHeader from '@/components/homeHeader.vue'
import HomeMain from '@/components/homeMain.vue'
</script>