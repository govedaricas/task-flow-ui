import API_BASE from '../config'
import { getToken } from '../utils/token'

const api = async (endpoint, options = {}) => {
  const res = await fetch(`${API_BASE}/${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getToken()}`,
      ...options.headers
    }
  })

  const data = await res.json()

  if (!res.ok) 
    throw new Error(data?.title || 'Request failed.')

    return data
}

export default api