import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User } from '@/types'
import { authApi, userApi } from '@/api'
import { useCartStore } from '@/store/cart'

export const useUserStore = defineStore('user', () => {
  // 状态
  const token = ref<string | null>(null)
  const userInfo = ref<User | null>(null)
  
  // 计算属性
  const isLoggedIn = computed(() => !!token.value)
  const isAdmin = computed(() => userInfo.value?.role === 'ADMIN')
  
  // 登录
  async function login(username: string, password: string) {
    const res = await authApi.login({ username, password })
    const data = res.data.data
    token.value = data.token
    userInfo.value = data.userInfo
    // 切换账号后重置并重新拉取购物车，避免上一个账号的购物车状态残留
    const cartStore = useCartStore()
    cartStore.resetCart()
    await cartStore.fetchCart()
    return data
  }
  
  // 注册
  async function register(data: { username: string; password: string; email?: string; nickname?: string }) {
    const res = await authApi.register(data)
    const result = res.data.data
    token.value = result.token
    userInfo.value = result.userInfo
    // 新账号注册后重置并拉取购物车（新账号应为空），避免残留上一个账号的购物车数据
    const cartStore = useCartStore()
    cartStore.resetCart()
    await cartStore.fetchCart()
    return result
  }
  
  // 登出
  function logout() {
    token.value = null
    userInfo.value = null
    // 登出时清空本地购物车状态，避免下次登录/注册时残留上一个账号的数据
    useCartStore().resetCart()
  }
  
  // 获取用户信息
  async function fetchUserInfo() {
    if (!token.value) return
    try {
      const res = await userApi.getProfile()
      userInfo.value = res.data.data
    } catch (error) {
      logout()
    }
  }
  
  // 更新用户信息
  async function updateUserInfo(data: Partial<User>) {
    const res = await userApi.updateProfile(data)
    userInfo.value = res.data.data
    return res.data.data
  }
  
  // 充值
  async function recharge(amount: number) {
    await userApi.recharge(amount)
    await fetchUserInfo()
  }
  
  return {
    token,
    userInfo,
    isLoggedIn,
    isAdmin,
    login,
    register,
    logout,
    fetchUserInfo,
    updateUserInfo,
    recharge
  }
}, {
  persist: {
    key: 'steam-user',
    paths: ['token', 'userInfo']
  }
})
