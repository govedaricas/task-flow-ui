import { useEffect, useState } from 'react'
import { getAllTasks, updateTaskStatus, createTask, updateTask, deleteTask, getTaskAuditLogs } from '../api/tasks'
import { Toast } from './Toast'
import { useLoading } from './LoadingContext'
import signalRService from '../utils/signalr'
import './tasks.css'

const Tasks = ({ onStatsUpdate }) => {
  const { setLoading } = useLoading()
  const [tasks, setTasks] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showTaskDetails, setShowTaskDetails] = useState(false)
  const [selectedTaskToDelete, setSelectedTaskToDelete] = useState(null)
  const [selectedTask, setSelectedTask] = useState(null)
  const [auditLogs, setAuditLogs] = useState([])
  const [loadingAudit, setLoadingAudit] = useState(false)
  const [showAuditHistory, setShowAuditHistory] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [toast, setToast] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    projectId: 1,
    dueDate: '',
    isActive: true
  })

  const statusOptions = {
    1: { name: 'New', color: '#6b7280' },
    2: { name: 'In Progress', color: '#f59e0b' },
    3: { name: 'On Hold', color: '#8b5cf6' },
    4: { name: 'Done', color: '#10b981' },
    5: { name: 'Cancelled', color: '#ef4444' }
  }

  const priorityOptions = {
    1: { name: 'Low', icon: '↓' },
    2: { name: 'Medium', icon: '→' },
    3: { name: 'High', icon: '↑' },
    4: { name: 'Critical', icon: '↑' },
  }

  const getStatusIdFromName = (statusName) => {
    const statusMap = {
      'To Do': 1,
      'New': 1,
      'In Progress': 2,
      'InProgress': 2,
      'On Hold': 3,
      'OnHold': 3,
      'Done': 4,
      'Completed': 4,
      'Cancelled': 5
    }
    return statusMap[statusName] || 1
  }

  useEffect(() => {
    fetchTasks()

    // Initialize SignalR connection
    const initSignalR = async () => {
      const token = localStorage.getItem('token')

      // Only try to connect if we have a token
      if (!token) {
        console.log('No token found, skipping SignalR connection')
        return
      }

      try {
        // First test if backend is reachable
        const isBackendReachable = await signalRService.testConnection()
        if (!isBackendReachable) {
          console.log('Backend not reachable, skipping SignalR connection')
          return
        }

        await signalRService.startConnection()

        // Listen for project statistics changes
        signalRService.on('ProjectStatisticsChanged', (projectStats) => {
        console.log('Received project statistics update:', projectStats)
        if (onStatsUpdate && projectStats.stats) {
            onStatsUpdate({
                toDoTasks: projectStats.stats.todoCount ?? projectStats.stats.TodoCount ?? 0,
                inProgressTasks: projectStats.stats.inProgressCount ?? projectStats.stats.InProgressCount ?? 0,
                completedTasks: projectStats.stats.doneCount ?? projectStats.stats.DoneCount ?? 0,
                lastActivityAt: projectStats.stats.lastActivityAt ?? projectStats.stats.LastActivityAt
            })
        }
    })
        // Listen for task status changes
        signalRService.on('TaskStatusChanged', (data) => {
        console.log('Received task status change:', data)
        setTasks(prevTasks =>
            prevTasks.map(task =>
                task.id === data.taskId
                    ? { ...task, taskStatusId: parseInt(data.status) }
                    : task
            )
        )
        showToast(`Task "${data.title}" status updated`, 'info')
        })

        // Listen for task comments
        signalRService.on('TaskCommentAdded', (data) => {
          console.log('Received task comment:', data)
          showToast(`New comment on "${data.title}": ${data.comment}`, 'info')
        })
      } catch (error) {
        console.error('Failed to initialize SignalR:', error)
      }
    }

    initSignalR()

    // Cleanup SignalR connection on unmount
    return () => {
      signalRService.stopConnection()
    }
  }, [onStatsUpdate])

  const fetchTasks = async () => {
    setLoading(true)
    try {
      const data = await getAllTasks()
      setTasks(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching tasks:', error)
      showToast('Error fetching tasks', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleAddTask = () => {
    setEditingTask(null)
    setFormData({
      name: '',
      description: '',
      projectId: 1,
      dueDate: '',
      isActive: true
    })
    setShowModal(true)
  }

  const handleEditTask = (task) => {
    setEditingTask(task)
    setFormData({
      name: task.name,
      description: task.description || '',
      projectId: task.projectId,
      dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
      isActive: task.isActive
    })
    setShowModal(true)
  }

  const handleViewTask = (task) => {
    setSelectedTask(task)
    setShowTaskDetails(true)
    setShowAuditHistory(false) // Reset audit history view
    setAuditLogs([]) // Clear previous audit logs
  }

  const handleViewAuditHistory = async () => {
    if (!selectedTask) return

    setLoading(true)
    setLoadingAudit(true)
    setShowAuditHistory(true)

    try {
      const logs = await getTaskAuditLogs(selectedTask.id)
      setAuditLogs(Array.isArray(logs) ? logs : [])
    } catch (error) {
      console.error('Error fetching audit logs:', error)
      setAuditLogs([])
      showToast('Error loading audit logs', 'error')
    } finally {
      setLoadingAudit(false)
      setLoading(false)
    }
  }

  const handleDeleteTask = (task) => {
    setSelectedTaskToDelete(task)
    setShowDeleteConfirm(true)
  }

  const confirmDeleteTask = async () => {
    if (!selectedTaskToDelete) return

    setLoading(true)
    try {
      await deleteTask(selectedTaskToDelete.id)
      setTasks(tasks.filter(t => t.id !== selectedTaskToDelete.id))
      showToast('Task deleted successfully', 'success')
    } catch (error) {
      console.error('Error deleting task:', error)
      showToast('Error deleting task', 'error')
    } finally {
      setSelectedTaskToDelete(null)
      setShowDeleteConfirm(false)
      setLoading(false)
    }
  }

  const cancelDeleteTask = () => {
    setSelectedTaskToDelete(null)
    setShowDeleteConfirm(false)
  }

  const handleStatusChange = async (taskId, newStatusId) => {
    setLoading(true)
    try {
      await updateTaskStatus(taskId, newStatusId)
      setTasks(tasks.map(task => task.id === taskId ? { ...task, taskStatusId: newStatusId } : task))
      showToast('Status updated', 'success')
    } catch (error) {
      console.error('Error updating status:', error)
      showToast('Error updating status', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      showToast('Task name is required', 'error')
      return
    }

    setLoading(true)
    try {
      if (editingTask) {
        await updateTask({
          id: editingTask.id,
          ...formData
        })
        setTasks(tasks.map(t => t.id === editingTask.id ? { ...t, ...formData } : t))
        showToast('Task updated successfully', 'success')
      } else {
        const newTaskId = await createTask(formData)
        const newTask = {
          id: newTaskId,
          taskStatusId: 1,
          taskPriorityId: 2,
          ...formData,
          createdAt: new Date()
        }
        setTasks([...tasks, newTask])
        showToast('Task created successfully', 'success')
      }
      setShowModal(false)
    } catch (error) {
      console.error('Error saving task:', error)
      showToast('Error saving task', 'error')
    } finally {
      setLoading(false)
    }
  }

  const showToast = (message, type) => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const groupedTasks = {
    1: tasks.filter(t => t.taskStatusId === 1),
    2: tasks.filter(t => t.taskStatusId === 2),
    3: tasks.filter(t => t.taskStatusId === 3),
    4: tasks.filter(t => t.taskStatusId === 4),
    5: tasks.filter(t => t.taskStatusId === 5)
  }

  return (
    <div className="tasks-container">
      <div className="tasks-header">
        <div>
          <h1>Tasks</h1>
          <p className="tasks-subtitle">Manage and track your tasks</p>
        </div>
        <button className="btn-add-task" onClick={handleAddTask}>
          <span>+</span> Add New Task
        </button>
      </div>

      <div className="tasks-kanban">
        {[1, 2, 3, 4, 5].map(statusId => (
          <div key={statusId} className="kanban-column">
            <div className="column-header" style={{ borderTopColor: statusOptions[statusId].color }}>
              <span className="column-status-dot" style={{ backgroundColor: statusOptions[statusId].color }}></span>
              <h3>{statusOptions[statusId].name}</h3>
              <span className="column-count">{groupedTasks[statusId].length}</span>
            </div>

            <div className="column-tasks">
              {groupedTasks[statusId].length === 0 ? (
                <div className="empty-state">
                  <p>No tasks</p>
                </div>
              ) : (
                groupedTasks[statusId].map(task => (
                  <div
                    key={task.id}
                    className="task-card"
                    style={{ borderLeftColor: statusOptions[statusId].color }}
                  >
                    <div className="task-card-header">
                      <h4 className="task-name" onClick={() => handleViewTask(task)}>{task.name}</h4>
                      <div className="task-actions">
                        <button
                          className="btn-icon edit"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEditTask(task)
                          }}
                          title="Edit task"
                        >
                          ✎
                        </button>
                        <button
                          className="btn-icon delete"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteTask(task)
                          }}
                          title="Delete task"
                        >
                          ✕
                        </button>
                      </div>
                    </div>

                    {task.description && (
                      <p className="task-description">{task.description}</p>
                    )}

                    <div className="task-meta">
                      {task.dueDate && (
                        <div className="task-due-date">
                          📅 {new Date(task.dueDate).toLocaleDateString()}
                        </div>
                      )}
                      {task.taskPriorityId && (
                        <div className={`task-priority priority-${task.taskPriorityId}`}>
                          {priorityOptions[task.taskPriorityId]?.icon} {priorityOptions[task.taskPriorityId]?.name}
                        </div>
                      )}
                    </div>

                    <select
                      className="task-status-select"
                      value={task.taskStatusId}
                      onChange={(e) => {
                        e.stopPropagation()
                        handleStatusChange(task.id, parseInt(e.target.value))
                      }}
                    >
                      <option value={1}>To Do</option>
                      <option value={2}>In Progress</option>
                      <option value={3}>On Hold</option>
                      <option value={4}>Done</option>
                      <option value={5}>Cancelled</option>
                    </select>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingTask ? 'Edit Task' : 'Create New Task'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>

            <form onSubmit={handleSubmit} className="task-form">
              <div className="form-group">
                <label htmlFor="name">Task Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter task name"
                  maxLength="100"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Enter task description"
                  maxLength="100"
                  rows="3"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="dueDate">Due Date</label>
                  <input
                    type="date"
                    id="dueDate"
                    name="dueDate"
                    value={formData.dueDate}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="isActive">
                    <input
                      type="checkbox"
                      id="isActive"
                      name="isActive"
                      checked={formData.isActive}
                      onChange={handleInputChange}
                    />
                    Active
                  </label>
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-submit">
                  {editingTask ? 'Update Task' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="confirm-overlay" onClick={cancelDeleteTask}>
          <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-header">
              <h2>Delete Task</h2>
            </div>
            <p className="confirm-message">
              Are you sure you want to delete <strong>{selectedTaskToDelete?.name}</strong>? This action cannot be undone.
            </p>
            <div className="confirm-actions">
              <button className="btn-cancel" onClick={cancelDeleteTask}>
                No, keep it
              </button>
              <button className="btn-submit confirm-delete" onClick={confirmDeleteTask}>
                Yes, delete
              </button>
            </div>
          </div>
        </div>
      )}

      {showTaskDetails && selectedTask && (
        <div className="modal-overlay" onClick={() => setShowTaskDetails(false)}>
          <div className="modal-content task-details-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Task Details</h2>
              <button className="modal-close" onClick={() => setShowTaskDetails(false)}>✕</button>
            </div>

            <div className="task-details-content">
              <div className="task-info-section">
                <div className="task-info-header">
                  <h3>{selectedTask.name}</h3>
                  <span className={`status-badge status-${selectedTask.taskStatusId}`}>
                    {statusOptions[selectedTask.taskStatusId]?.name}
                  </span>
                </div>

                {selectedTask.description && (
                  <div className="task-description">
                    <h4>Description</h4>
                    <p>{selectedTask.description}</p>
                  </div>
                )}

                <div className="task-meta-grid">
                  {selectedTask.dueDate && (
                    <div className="meta-item">
                      <span className="meta-label">Due Date:</span>
                      <span className="meta-value">{new Date(selectedTask.dueDate).toLocaleDateString()}</span>
                    </div>
                  )}
                  {selectedTask.taskPriorityId && (
                    <div className="meta-item">
                      <span className="meta-label">Priority:</span>
                      <span className={`priority-badge priority-${selectedTask.taskPriorityId}`}>
                        {priorityOptions[selectedTask.taskPriorityId]?.icon} {priorityOptions[selectedTask.taskPriorityId]?.name}
                      </span>
                    </div>
                  )}
                  <div className="meta-item">
                    <span className="meta-label">Created:</span>
                    <span className="meta-value">{new Date(selectedTask.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">Active:</span>
                    <span className="meta-value">{selectedTask.isActive ? 'Yes' : 'No'}</span>
                  </div>
                </div>
              </div>

              <div className="task-actions-section">
                <button
                  className="btn-history"
                  onClick={handleViewAuditHistory}
                  disabled={loadingAudit}
                >
                  {loadingAudit ? 'Loading...' : '📋 View History'}
                </button>
              </div>

              {showAuditHistory && (
                <div className="audit-logs-section">
                  <h4>Audit History</h4>
                  {auditLogs.length === 0 ? (
                    <div className="no-audit-logs">
                      <p>No audit logs available</p>
                    </div>
                  ) : (
                    <div className="audit-table-container">
                      <table className="audit-table">
                        <thead>
                          <tr>
                            <th>User</th>
                            <th>Action</th>
                            <th>Timestamp</th>
                            <th>Changes</th>
                          </tr>
                        </thead>
                        <tbody>
                          {auditLogs.map(log => (
                            <tr key={log.id}>
                              <td className="user-cell">
                                <span className="user-name">{log.userName || 'Unknown'}</span>
                              </td>
                              <td className="action-cell">
                                <span className={`action-badge action-${log.action.toLowerCase()}`}>
                                  {log.action}
                                </span>
                              </td>
                              <td className="timestamp-cell">
                                {new Date(log.timestamp).toLocaleString()}
                              </td>
                              <td className="changes-cell">
                                {log.changes ? (
                                  <details className="changes-details">
                                    <summary>View changes</summary>
                                    <pre className="changes-content">{log.changes}</pre>
                                  </details>
                                ) : (
                                  <span className="no-changes">-</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowTaskDetails(false)}>
                Close
              </button>
              <button className="btn-submit" onClick={() => {
                setShowTaskDetails(false)
                handleEditTask(selectedTask)
              }}>
                Edit Task
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  )
}

export default Tasks