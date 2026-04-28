export const saveTokens = (token, refreshToken) => {
  localStorage.setItem('token', token)
  localStorage.setItem('refreshToken', refreshToken)
}

export const getToken = () => localStorage.getItem('token')
export const getRefreshToken = () => localStorage.getItem('refreshToken')
export const clearTokens = () => localStorage.removeItem('token') || localStorage.removeItem('refreshToken')