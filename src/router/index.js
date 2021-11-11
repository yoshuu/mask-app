import { createRouter, createWebHashHistory  } from 'vue-router'

const routes = [
  {
    name: 'Index',
    path: '/',
    component: () => import('/@/views/Index.vue'),
  },

]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

export default router
