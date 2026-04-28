import api from './api'

export const getAllTasks = async () => {
  return await api('api/tasks')
}

export const getTaskById = async (id) => {
  return await api(`api/tasks/${id}`)
}

export const createTask = async (task) => {
  return await api('api/tasks', {
    method: 'POST',
    body: JSON.stringify(task)
  })
}

export const updateTask = async (task) => {
  return await api('api/tasks', {
    method: 'PUT',
    body: JSON.stringify(task)
  })
}

export const deleteTask = async (id) => {
  return await api(`api/tasks/${id}`, {
    method: 'DELETE'
  })
}

export const updateTaskStatus = async (id, statusId) => {
  return await api(`api/tasks/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ taskStatusId: statusId })
  })
}

export const getTaskAuditLogs = async (taskId) => {
  return await api(`api/tasks/${taskId}/audit-logs`)
}