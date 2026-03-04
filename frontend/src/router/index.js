import { createRouter, createWebHistory } from 'vue-router'
import MatchList from '../components/MatchList.vue'
import SetupView from '../components/SetupView.vue'
import Touchpad from '../components/Touchpad.vue'
import AdminLogin from '../components/admin/AdminLogin.vue'
import AdminLayout from '../components/admin/AdminLayout.vue'
import AdminDashboard from '../components/admin/AdminDashboard.vue'
import AdminMatchForm from '../components/admin/AdminMatchForm.vue'
import AdminMatchDetail from '../components/admin/AdminMatchDetail.vue'
import { useAdminStore } from '../stores/adminStore'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'match-list',
      component: MatchList,
    },
    {
      path: '/setup',
      name: 'setup',
      component: SetupView,
    },
    {
      path: '/scoring',
      name: 'scoring',
      component: Touchpad,
    },
    {
      path: '/admin/login',
      name: 'admin-login',
      component: AdminLogin,
    },
    {
      path: '/admin',
      component: AdminLayout,
      redirect: '/admin/dashboard',
      children: [
        {
          path: 'dashboard',
          name: 'admin-dashboard',
          component: AdminDashboard,
        },
        {
          path: 'match/new',
          name: 'admin-match-new',
          component: AdminMatchForm,
        },
        {
          path: 'match/:id',
          name: 'admin-match-detail',
          component: AdminMatchDetail,
        },
      ],
    },
  ],
})

router.beforeEach(async (to) => {
  const adminStore = useAdminStore()
  const authenticated = await adminStore.checkAuth()

  // Guard /admin routes
  if (to.path.startsWith('/admin') && to.path !== '/admin/login') {
    if (!authenticated) {
      return { name: 'admin-login', query: { redirect: to.fullPath } }
    }
    // Only admins can visit admin board
    if (adminStore.role !== 'admin') {
      return { path: '/' }
    }
  }

  // Guard umpire routes (/, /setup, /scoring)
  const isUmpireRoute = ['match-list', 'setup', 'scoring'].includes(to.name)
  if (isUmpireRoute && !authenticated) {
    return { name: 'admin-login', query: { redirect: to.fullPath } }
  }
})

export default router
