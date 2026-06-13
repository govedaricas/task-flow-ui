import api from './api'

export const getAllTasks = async (query = {}) => {
  const payload = {}
  
  if (query.pageNumber != null) payload.pageNumber = query.pageNumber
  if (query.pageSize != null) payload.pageSize = query.pageSize
  if (query.searchTerm) payload.searchTerm = query.searchTerm
  if (query.name) payload.name = query.name
  if (query.taskStatusId != null) payload.taskStatusId = query.taskStatusId
  if (query.taskPriorityId != null) payload.taskPriorityId = query.taskPriorityId
  if (query.createdAt) payload.createdAt = query.createdAt
  if (query.sortBy) payload.sortBy = query.sortBy
  if (query.sortDescending != null) payload.sortDescending = query.sortDescending

  return await api('api/tasks/search', {
    method: 'POST',
    body: JSON.stringify(payload)
  })
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