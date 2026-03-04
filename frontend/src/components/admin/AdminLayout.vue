<template>
  <div class="admin-shell">
    <!-- Top Navigation Bar -->
    <nav class="admin-topbar">
      <div class="topbar-brand">
        <span class="brand-icon">🏓</span>
        <span class="brand-name">Admin Portal</span>
      </div>

      <div class="topbar-nav">
        <router-link id="nav-dashboard" to="/admin/dashboard" class="nav-link">
          <span class="nav-icon">📋</span>
          Dashboard
        </router-link>
        <router-link id="nav-new-match" to="/admin/match/new" class="nav-link">
          <span class="nav-icon">➕</span>
          New Match
        </router-link>
      </div>

      <div class="topbar-actions">
        <router-link to="/" class="exit-btn">
          ← Exit to App
        </router-link>
        <button id="admin-logout-btn" class="logout-btn" @click="onLogout">
          Sign Out
        </button>
      </div>
    </nav>

    <!-- Main Content Area -->
    <main class="admin-content">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useAdminStore } from '../../stores/adminStore'

const router = useRouter()
const adminStore = useAdminStore()

async function onLogout() {
  await adminStore.logout()
  router.push('/admin/login')
}
</script>

<style scoped>
.admin-shell {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  background: #0f172a;
  color: #f1f5f9;
  font-family: 'Outfit', sans-serif;
}

.admin-topbar {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 0 2rem;
  height: 64px;
  background: #1e293b;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 2px 20px rgba(0, 0, 0, 0.3);
  position: sticky;
  top: 0;
  z-index: 100;
  flex-shrink: 0;
}

.topbar-brand {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 1.1rem;
  font-weight: 700;
  color: #f1f5f9;
  min-width: 160px;
}

.brand-icon {
  font-size: 1.4rem;
}

.topbar-nav {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  color: #94a3b8;
  text-decoration: none;
  font-size: 0.95rem;
  font-weight: 500;
  transition: all 0.2s;
}

.nav-link:hover {
  background: rgba(255, 255, 255, 0.06);
  color: #f1f5f9;
}

.nav-link.router-link-active {
  background: rgba(33, 156, 6, 0.15);
  color: #4ade80;
}

.nav-icon {
  font-size: 1rem;
}

.topbar-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.exit-btn {
  color: #64748b;
  font-size: 0.9rem;
  text-decoration: none;
  padding: 0.4rem 0.8rem;
  border-radius: 6px;
  transition: color 0.2s;
}

.exit-btn:hover {
  color: #94a3b8;
}

.logout-btn {
  background: rgba(220, 38, 38, 0.15);
  color: #f87171;
  font-size: 0.85rem;
  font-weight: 600;
  font-family: 'Outfit', sans-serif;
  padding: 0.45rem 1rem;
  border-radius: 8px;
  border: 1px solid rgba(220, 38, 38, 0.25);
  cursor: pointer;
  transition: all 0.2s;
}

.logout-btn:hover {
  background: rgba(220, 38, 38, 0.25);
  color: #fca5a5;
}

.admin-content {
  flex: 1;
  overflow-y: auto;
  padding: 2rem;
}
</style>
