import api from './api'

export const getAllTasks = async () => {
  return await api('api/tasks')
}

export const getTaskById = async (id) => {
  return await api(`api/tasks/${id}`)
}

export const updateTaskStatus = async (id, statusId) => {
  return await api(`api/tasks/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ taskStatusId: statusId })
  })
}