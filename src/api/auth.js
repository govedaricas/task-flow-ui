import API_BASE from '../config'
import { saveTokens, getRefreshToken } from '../utils/token'

export const registerUser = async (form) => {
  const res = await fetch(`${API_BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(form)
  })
  return await res.json()
}

export const loginUser = async (form) => {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(form)
  })
  const data = await res.json()
  if (data.responseModel?.success) {
    saveTokens(data.responseModel.token, data.responseModel.refreshToken)
  }
  return data
}

export const refreshAccessToken = async () => {
  const token = getRefreshToken()
  const currentToken = localStorage.getItem('token')
  if (!token || !currentToken) throw new Error('No refresh token available')
  
  const res = await fetch(`${API_BASE}/api/tokens/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accessToken: currentToken, refreshToken: token })
  })
  
  if (!res.ok) throw new Error('Token refresh failed')
  const data = await res.json()
  if (data.accessToken) {
    saveTokens(data.accessToken, data.refreshToken)
    return data.accessToken
  }
  throw new Error('Invalid refresh response')
}