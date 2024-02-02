import Vue from 'vue'
import Router from 'vue-router'
import PayConfirm from '@/pages/PayConfirm'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'PayConfirm',
      component: PayConfirm
    }
  ]
})
