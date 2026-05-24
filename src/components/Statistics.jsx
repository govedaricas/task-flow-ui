import { useEffect, useState } from 'react'
import api from '../api/api'
import UserProfileModal from './UserProfileModal'
import { useLoading } from './LoadingContext'
import './statistics.css'

const Statistics = ({ statsUpdate }) => {
  const { setLoading } = useLoading()
  const [stats, setStats] = useState({
    totalTasks: 0,
    totalProjects: 0,
    completedTasks: 0,
    inProgressTasks: 0,
    toDoTasks: 0
  })
  const [user, setUser] = useState(null)
  const [showProfileModal, setShowProfileModal] = useState(false)

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true)
      try {
        const tasks = await api('api/tasks')
        const projects = await api('api/projects/search', {
          method: 'POST',
          body: JSON.stringify({ pageNumber: 1, pageSize: 1000 })
        })

        const taskList = Array.isArray(tasks) ? tasks : []
        setStats({
          totalTasks: taskList.length,
          totalProjects: projects.data?.length || 0,
          completedTasks: taskList.filter(t => t.taskStatusId === 4).length,
          inProgressTasks: taskList.filter(t => t.taskStatusId === 2 || t.taskStatusId === 3).length,
          toDoTasks: taskList.filter(t => t.taskStatusId === 1).length
        })
      } catch (error) {
        console.error('Error fetching stats:', error)
      } finally {
        setLoading(false)
      }
    }

    const getUserInfo = () => {
      const token = localStorage.getItem('token')
      if (token) {
        // Parse JWT to get username from claims
        try {
          const payload = JSON.parse(window.atob(token.split('.')[1]))
          const username = payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name']
          const email = payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress']
          if (username) {
            setUser({ name: username, email: email || 'user@example.com' })
            return
          }
        } catch {}

        // Fallback to localStorage userInfo
        const userInfo = localStorage.getItem('userInfo')
        if (userInfo) {
          setUser(JSON.parse(userInfo))
        } else {
          setUser({ name: 'User', email: 'user@example.com' })
        }
      }
    }

    fetchStats()
    getUserInfo()
  }, [])

  useEffect(() => {
    if (statsUpdate) {
      setStats(prevStats => ({
        ...prevStats,
        completedTasks: statsUpdate.completedTasks,
        inProgressTasks: statsUpdate.inProgressTasks,
        toDoTasks: statsUpdate.toDoTasks
      }))
    }
  }, [statsUpdate])

  return (
    <>
      <div className="statistics-panel">

        {/* Clickable user card */}
        <div
          className="user-card"
          onClick={() => setShowProfileModal(true)}
          style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
          onMouseEnter={e => {
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(59,130,246,0.15)'
            e.currentTarget.style.borderColor = '#93c5fd'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)'
            e.currentTarget.style.borderColor = '#e2e8f0'
          }}
          title="Click to edit profile"
        >
          <div className="user-avatar">👤</div>
          <div className="user-info">
            <h4 className="user-name">{user?.name || 'Profile'}</h4>
            <p className="user-email">{user?.email || 'user@example.com'}</p>
          </div>
          {/* Edit hint icon */}
          <span style={{ color: '#94a3b8', fontSize: '16px', marginLeft: 'auto' }}>✎</span>
        </div>

        <div className="stats-divider"></div>

        <div className="stat-item">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' }}>
            📋
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalTasks}</div>
            <div className="stat-label">Total Tasks</div>
          </div>
        </div>

        <div className="stat-item">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
            ✓
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.completedTasks}</div>
            <div className="stat-label">Completed</div>
          </div>
        </div>

        <div className="stat-item">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>
            ⚡
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.inProgressTasks}</div>
            <div className="stat-label">In Progress</div>
          </div>
        </div>

        <div className="stat-item">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)' }}>
            ◯
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.toDoTasks}</div>
            <div className="stat-label">To Do</div>
          </div>
        </div>

        <div className="stats-divider"></div>

        <div className="stat-item">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' }}>
            📁
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalProjects}</div>
            <div className="stat-label">Projects</div>
          </div>
        </div>

        <div className="progress-bar">
          <div className="progress-label">Overall Progress</div>
          <div className="progress-container">
            <div
              className="progress-fill"
              style={{
                width: stats.totalTasks > 0 ? `${(stats.completedTasks / stats.totalTasks) * 100}%` : '0%'
              }}
            ></div>
          </div>
          <div className="progress-text">
            {stats.totalTasks > 0 ? `${Math.round((stats.completedTasks / stats.totalTasks) * 100)}%` : '0%'}
          </div>
        </div>
      </div>

      {showProfileModal && (
        <UserProfileModal onClose={() => setShowProfileModal(false)} />
      )}
    </>
  )
}

export default Statistics
