import { createRouter, createWebHistory } from 'vue-router'
import MatchList from '../components/MatchList.vue'
import SetupView from '../components/SetupView.vue'
import Touchpad from '../components/Touchpad.vue'

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            name: 'match-list',
            component: MatchList
        },
        {
            path: '/setup',
            name: 'setup',
            component: SetupView
        },
        {
            path: '/scoring',
            name: 'scoring',
            component: Touchpad
        }
    ]
})

export default router
