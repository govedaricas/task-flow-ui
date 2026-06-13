import API_BASE from '../config'
import { getToken, clearTokens } from '../utils/token'
import { refreshAccessToken } from './auth'

let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) prom.reject(error)
    else prom.resolve(token)
  })
  failedQueue = []
}

const api = async (endpoint, options = {}) => {
  try {
    const res = await fetch(`${API_BASE}/${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`,
        ...options.headers
      }
    })

    const data = await res.json()

    if (res.ok) return data

    // If 401, try to refresh token
    if (res.status === 401) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then(token => {
          return api(endpoint, options)
        })
      }

      isRefreshing = true
      try {
        const newToken = await refreshAccessToken()
        processQueue(null, newToken)
        isRefreshing = false
        return api(endpoint, options)
      } catch (err) {
        processQueue(err, null)
        isRefreshing = false
        clearTokens()
        window.location.href = '/login'
        throw new Error('Session expired. Please login again.')
      }
    }

    throw new Error(data?.title || `Request failed: ${res.status}`)
  } catch (error) {
    throw error
  }
}

export default api