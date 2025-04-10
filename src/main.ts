/*
 * @Author: lzr 259867057@qq.com
 * @Date: 2025-03-07 16:50:17
 * @LastEditors: lzr 259867057@qq.com
 * @LastEditTime: 2025-03-10 16:00:43
 * @FilePath: \kdPlankCheck\src\main.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */

import '@/assets/main.css'
import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
