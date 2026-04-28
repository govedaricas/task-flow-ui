import api from './api'
import { saveTokens } from '../utils/token'

export const registerUser = async (form) => {
  return await api('api/auth/register', {
    method: 'POST',
    body: JSON.stringify(form)
  })
}

  export const loginUser = async (form) => {
  const data = await api('api/auth/login', {
    method: 'POST',
    body: JSON.stringify(form)
  })

  if (data.responseModel?.success) saveTokens(data.responseModel.token, data.responseModel.refreshToken)
  return data
}