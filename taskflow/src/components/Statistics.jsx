import { useEffect, useState } from 'react'
import api from '../api/api'

const Statistics = () => {
  const [stats, setStats] = useState({ totalTasks: 0, totalProjects: 0 })

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const tasks = await api('api/tasks')
        const projects = await api('api/projects/search', {
          method: 'POST',
          body: JSON.stringify({ pageNumber: 1, pageSize: 1000 })
        })
        setStats({
          totalTasks: tasks.length,
          totalProjects: projects.data?.length || 0
        })
      } catch (error) {
        console.error('Error fetching stats:', error)
      }
    }
    fetchStats()
  }, [])

  return (
    <div style={{ width: '200px', background: '#e0e0e0', padding: '20px', position: 'fixed', right: 0, top: 0, height: '100vh' }}>
      <h3>Statistics</h3>
      <p>Total Tasks: {stats.totalTasks}</p>
      <p>Total Projects: {stats.totalProjects}</p>
    </div>
  )
}

export default Statistics