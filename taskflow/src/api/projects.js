import api from './api'

export const getAllProjects = async () => {
  return await api('api/projects/search', {
    method: 'POST',
    body: JSON.stringify({ pageNumber: 1, pageSize: 100 })
  })
}

export const getProjectById = async (id) => {
  return await api(`api/projects/${id}`)
}