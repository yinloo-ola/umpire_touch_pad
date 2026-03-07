<template>
  <div class="admin-login-page">
    <div class="admin-login-card">
      <div class="login-logo">
        <span class="logo-icon">🏓</span>
        <h1 class="login-title">Umpire Portal</h1>
        <p class="login-subtitle">Sign in to access matches</p>
      </div>

      <form class="login-form" @submit.prevent="onSubmit">
        <div class="form-group">
          <label for="admin-username">Username</label>
          <input
            id="admin-username"
            v-model="username"
            type="text"
            placeholder="Enter username"
            autocomplete="username"
            required
          />
        </div>

        <div class="form-group">
          <label for="admin-password">Password</label>
          <input
            id="admin-password"
            v-model="password"
            type="password"
            placeholder="Enter password"
            autocomplete="current-password"
            required
          />
        </div>

        <p v-if="error" class="login-error">{{ error }}</p>

        <button id="admin-login-btn" type="submit" class="login-btn" :disabled="loading">
          <span v-if="loading">Signing in…</span>
          <span v-else>Sign In</span>
        </button>
      </form>

      <div class="login-footer">
        <router-link to="/umpire/match-list" class="back-link">← Back to Home</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAdminStore } from '../../stores/adminStore'

const adminStore = useAdminStore()
const router = useRouter()
const route = useRoute()

const username = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

async function onSubmit() {
  error.value = ''
  loading.value = true
  try {
    const role = await adminStore.login(username.value, password.value)
    
    // 1. If there's a redirect query, use it
    if (route.query.redirect) {
      router.push(route.query.redirect)
      return
    }

    // 2. Default redirection based on role
    if (role === 'admin') {
      router.push('/admin/dashboard')
    } else {
      router.push('/umpire/match-list')
    }
  } catch (e) {
    error.value = e.message || 'Login failed'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.admin-login-page {
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
  padding: 1.5rem;
}

.admin-login-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 3rem 2.5rem;
  width: 100%;
  max-width: 420px;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
}

.login-logo {
  text-align: center;
  margin-bottom: 2.5rem;
}

.logo-icon {
  font-size: 3rem;
  display: block;
  margin-bottom: 0.75rem;
}

.login-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #f1f5f9;
  margin-bottom: 0.4rem;
}

.login-subtitle {
  font-size: 0.95rem;
  color: #94a3b8;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.form-group input {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 10px;
  padding: 0.85rem 1rem;
  color: #f1f5f9;
  font-size: 1rem;
  font-family: 'Outfit', sans-serif;
  outline: none;
  transition: border-color 0.2s, background 0.2s;
}

.form-group input::placeholder {
  color: #475569;
}

.form-group input:focus {
  border-color: #219c06;
  background: rgba(33, 156, 6, 0.08);
}

.login-error {
  color: #f87171;
  font-size: 0.9rem;
  text-align: center;
  padding: 0.5rem;
  background: rgba(248, 113, 113, 0.1);
  border-radius: 8px;
  border: 1px solid rgba(248, 113, 113, 0.2);
}

.login-btn {
  background: linear-gradient(135deg, #219c06, #1e8706);
  color: white;
  font-size: 1rem;
  font-weight: 700;
  font-family: 'Outfit', sans-serif;
  padding: 0.9rem;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 15px rgba(33, 156, 6, 0.35);
  margin-top: 0.5rem;
}

.login-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(33, 156, 6, 0.5);
}

.login-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.login-footer {
  text-align: center;
  margin-top: 1.5rem;
}

.back-link {
  color: #64748b;
  font-size: 0.9rem;
  text-decoration: none;
  transition: color 0.2s;
}

.back-link:hover {
  color: #94a3b8;
}
</style>
