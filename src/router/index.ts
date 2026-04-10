import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', redirect: '/my-day' },
    { path: '/my-day', component: () => import('@/views/MyDayView.vue') },
    { path: '/inbox', component: () => import('@/views/InboxView.vue') },
    { path: '/projects/:id', component: () => import('@/views/ProjectView.vue') },
    { path: '/tags/:name', component: () => import('@/views/TagView.vue') },
    { path: '/reports', component: () => import('@/views/ReportsView.vue') },
    { path: '/timeline', component: () => import('@/views/TimelineView.vue') },
  ],
})

export default router
