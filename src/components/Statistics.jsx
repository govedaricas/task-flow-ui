import { useEffect, useState } from 'react'
import api from '../api/api'
import { getAllTasks } from '../api/tasks'
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
    onHoldTasks: 0,
    cancelledTasks: 0,
    toDoTasks: 0
  })
  const [user, setUser] = useState(null)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [collapsed, setCollapsed] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true)
      try {
        const tasksResponse = await getAllTasks({ pageNumber: 1, pageSize: 1000 })
        const projects = await api('api/projects/search', {
          method: 'POST',
          body: JSON.stringify({ pageNumber: 1, pageSize: 1000 })
        })

        const taskList = Array.isArray(tasksResponse.items)
          ? tasksResponse.items
          : Array.isArray(tasksResponse.data)
            ? tasksResponse.data
            : Array.isArray(tasksResponse)
              ? tasksResponse
              : []

        setStats({
          totalTasks: taskList.length,
          totalProjects: projects.data?.length || 0,
          toDoTasks: taskList.filter(t => t.taskStatusId === 1).length,
          inProgressTasks: taskList.filter(t => t.taskStatusId === 2).length,
          onHoldTasks: taskList.filter(t => t.taskStatusId === 3).length,
          completedTasks: taskList.filter(t => t.taskStatusId === 4).length,
          cancelledTasks: taskList.filter(t => t.taskStatusId === 5).length
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
        } catch {
          // fall through to the localStorage fallback below
        }

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
        completedTasks: statsUpdate.completedTasks != null ? Number(statsUpdate.completedTasks) : prevStats.completedTasks,
        inProgressTasks: statsUpdate.inProgressTasks != null ? Number(statsUpdate.inProgressTasks) : prevStats.inProgressTasks,
        onHoldTasks: statsUpdate.onHoldTasks != null ? Number(statsUpdate.onHoldTasks) : prevStats.onHoldTasks,
        cancelledTasks: statsUpdate.cancelledTasks != null ? Number(statsUpdate.cancelledTasks) : prevStats.cancelledTasks,
        toDoTasks: statsUpdate.toDoTasks != null ? Number(statsUpdate.toDoTasks) : prevStats.toDoTasks
      }))
    }
  }, [statsUpdate])

  const totalTasksNum = Number(stats.totalTasks) || 0
  const completedTasksNum = Number(stats.completedTasks) || 0
  const progressPct = totalTasksNum > 0
    ? Math.round(Math.min(Math.max((completedTasksNum / totalTasksNum) * 100, 0), 100))
    : 0

  return (
    <>
      <div className="statistics-panel">

        {/* Mobile-only: tap to expand the full stats below */}
        <button
          type="button"
          className="stats-toggle"
          onClick={() => setCollapsed(c => !c)}
          aria-expanded={!collapsed}
        >
          <span className="stats-toggle-summary">
            📊 {stats.totalTasks} tasks · {progressPct}% done
          </span>
          <span className="stats-toggle-icon">{collapsed ? '▾' : '▴'}</span>
        </button>

        <div className={`stats-body ${collapsed ? 'collapsed' : ''}`}>

        {/* Clickable user card */}
        <div
          className="user-card user-card-clickable"
          onClick={() => setShowProfileModal(true)}
          title="Click to edit profile"
        >
          <div className="user-avatar">👤</div>
          <div className="user-info">
            <h4 className="user-name">{user?.name || 'Profile'}</h4>
            <p className="user-email">{user?.email || 'user@example.com'}</p>
          </div>
          <span className="user-edit-hint">✎</span>
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
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)' }}>
            ⏸
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.onHoldTasks}</div>
            <div className="stat-label">On Hold</div>
          </div>
        </div>

        <div className="stat-item">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)' }}>
            ✕
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.cancelledTasks}</div>
            <div className="stat-label">Cancelled</div>
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
            <div className="progress-fill" style={{ width: `${progressPct}%` }}></div>
          </div>
          <div className="progress-text">{progressPct}%</div>
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
