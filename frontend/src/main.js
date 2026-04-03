import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { getOrCreateSessionId } from './lib/sessionId'
import './style.css'

window.__umpireSessionId = getOrCreateSessionId()

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
