import { createRouter, createWebHistory } from 'vue-router'
import MatchList from '../views/umpire/MatchListView.vue'
import SetupView from '../views/umpire/SetupView.vue'
import Touchpad from '../views/umpire/TouchpadView.vue'
import AdminLogin from '../views/admin/LoginView.vue'
import AdminLayout from '../components/admin/AdminLayout.vue'
import AdminDashboard from '../views/admin/DashboardView.vue'
import AdminMatchForm from '../views/admin/MatchFormView.vue'
import AdminMatchDetail from '../views/admin/MatchDetailView.vue'
import PublicView from '../views/public/PublicView.vue'
import { useAdminStore } from '../stores/adminStore'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/umpire/match-list',
    },
    {
      path: '/umpire',
      name: 'umpire',
      redirect: '/umpire/match-list',
      children: [
        {
          path: 'match-list',
          name: 'umpire-match-list',
          component: MatchList,
        },
        {
          path: 'setup/:id?',
          name: 'umpire-setup',
          component: SetupView,
        },
        {
          path: 'scoring/:id?',
          name: 'umpire-scoring',
          component: Touchpad,
        },
      ],
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
    {
      path: '/public',
      name: 'public',
      component: PublicView,
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
      return { name: 'umpire-match-list' }
    }
  }

  // Guard umpire routes
  if (to.path.startsWith('/umpire')) {
    if (!authenticated) {
      return { name: 'admin-login', query: { redirect: to.fullPath } }
    }
  }
})

export default router
