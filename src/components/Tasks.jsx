import { useEffect, useState, useMemo } from 'react'
import { getAllTasks, updateTaskStatus, createTask, updateTask, deleteTask, getTaskAuditLogs } from '../api/tasks'
import { Toast } from './Toast'
import { useLoading } from './LoadingContext'
import signalRService from '../utils/signalr'
import './tasks.css'

const STATUS_OPTIONS = {
  1: { name: 'New',         color: '#6b7280' },
  2: { name: 'In Progress', color: '#f59e0b' },
  3: { name: 'On Hold',     color: '#8b5cf6' },
  4: { name: 'Completed',        color: '#10b981' },
  5: { name: 'Cancelled',   color: '#ef4444' },
}

const PRIORITY_OPTIONS = {
  1: { name: 'Low',      cls: 'priority-1' },
  2: { name: 'Medium',   cls: 'priority-2' },
  3: { name: 'High',     cls: 'priority-3' },
  4: { name: 'Critical', cls: 'priority-4' },
}

const Tasks = ({ onStatsUpdate }) => {
  const { setLoading } = useLoading()

  // ── Data ──────────────────────────────────────────────
  const [tasks, setTasks] = useState([])

  // ── Drag & drop ───────────────────────────────────────
  const [dragTaskId,  setDragTaskId]  = useState(null)
  const [dragOverCol, setDragOverCol] = useState(null)

  // ── Filters ───────────────────────────────────────────
  const [showFilters,  setShowFilters]  = useState(false)
  const [searchTerm,   setSearchTerm]   = useState('')
  const [filterName,   setFilterName]   = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterPriority, setFilterPriority] = useState('')
  const [filterCreatedAt, setFilterCreatedAt] = useState('')
  const [pageNumber, setPageNumber] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalCount, setTotalCount] = useState(0)
  const [filterVersion, setFilterVersion] = useState(0)

  // ── Modals ────────────────────────────────────────────
  const [showModal,           setShowModal]           = useState(false)
  const [showDeleteConfirm,   setShowDeleteConfirm]   = useState(false)
  const [showTaskDetails,     setShowTaskDetails]     = useState(false)
  const [selectedTaskToDelete, setSelectedTaskToDelete] = useState(null)
  const [selectedTask,        setSelectedTask]        = useState(null)
  const [editingTask,         setEditingTask]         = useState(null)

  // ── Audit ─────────────────────────────────────────────
  const [auditLogs,       setAuditLogs]       = useState([])
  const [loadingAudit,    setLoadingAudit]    = useState(false)
  const [showAuditHistory, setShowAuditHistory] = useState(false)

  // ── Toast ─────────────────────────────────────────────
  const [toast, setToast] = useState(null)

  // ── Form ──────────────────────────────────────────────
  const [formData, setFormData] = useState({
    name: '', description: '', projectId: 1, dueDate: '', isActive: true,
  })

  // ─────────────────────────────────────────────────────
  // SignalR + initial fetch
  // ─────────────────────────────────────────────────────
  useEffect(() => {
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
                onHoldTasks: projectStats.stats.onHoldCount ?? projectStats.stats.OnHoldCount ?? projectStats.stats.onHold ?? 0,
                cancelledTasks: projectStats.stats.cancelledCount ?? projectStats.stats.CancelledCount ?? projectStats.stats.cancelled ?? 0,
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

  useEffect(() => {
    fetchTasks(pageNumber, pageSize)
  }, [pageNumber, pageSize, filterVersion])

  // ─────────────────────────────────────────────────────
  // Filtered tasks (client-side, instant feedback)
  // ─────────────────────────────────────────────────────
  const filteredTasks = tasks
  const activeFilterCount = [searchTerm, filterName, filterStatus, filterPriority, filterCreatedAt].filter(Boolean).length

  const groupedTasks = useMemo(() => {
    const g = { 1: [], 2: [], 3: [], 4: [], 5: [] }
    filteredTasks.forEach(t => { if (g[t.taskStatusId]) g[t.taskStatusId].push(t) })
    return g
  }, [filteredTasks])

  // ─────────────────────────────────────────────────────
  // API helpers
  // ─────────────────────────────────────────────────────
  const fetchTasks = async (page = pageNumber, size = pageSize) => {
    setLoading(true)
    try {
      const query = {
        pageNumber: page,
        pageSize: size,
        searchTerm: searchTerm || undefined,
        name: filterName || undefined,
        taskStatusId: filterStatus ? Number(filterStatus) : undefined,
        taskPriorityId: filterPriority ? Number(filterPriority) : undefined,
        createdAt: filterCreatedAt ? new Date(filterCreatedAt).toISOString() : undefined,
      }

      const data = await getAllTasks(query)
      const items = Array.isArray(data?.items)
        ? data.items
        : Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data)
            ? data
            : []

      setTasks(items)
      setTotalCount(data?.totalCount ?? data?.totalItems ?? items.length)
      setPageNumber(data?.pageNumber ?? page)
      setPageSize(data?.pageSize ?? size)
    } catch {
      showToast('Error fetching tasks', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (taskId, newStatusId) => {
    // Optimistic update
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, taskStatusId: newStatusId } : t))
    try {
      await updateTaskStatus(taskId, newStatusId)
      showToast('Status updated', 'success')
    } catch {
      showToast('Error updating status', 'error')
      fetchTasks() // revert
    }
  }

  const confirmDeleteTask = async () => {
    if (!selectedTaskToDelete) return
    setLoading(true)
    try {
      await deleteTask(selectedTaskToDelete.id)
      setTasks(prev => prev.filter(t => t.id !== selectedTaskToDelete.id))
      showToast('Task deleted successfully', 'success')
    } catch {
      showToast('Error deleting task', 'error')
    } finally {
      setSelectedTaskToDelete(null)
      setShowDeleteConfirm(false)
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.name.trim()) { showToast('Task name is required', 'error'); return }
    setLoading(true)
    try {
      if (editingTask) {
        await updateTask({ id: editingTask.id, ...formData })
        setTasks(prev => prev.map(t => t.id === editingTask.id ? { ...t, ...formData } : t))
        showToast('Task updated successfully', 'success')
      } else {
        const newTaskId = await createTask(formData)
        setTasks(prev => [...prev, {
          id: newTaskId, taskStatusId: 1, taskPriorityId: 2,
          ...formData, createdAt: new Date().toISOString(),
        }])
        showToast('Task created successfully', 'success')
      }
      setShowModal(false)
    } catch {
      showToast('Error saving task', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleViewAuditHistory = async () => {
    if (!selectedTask) return
    setLoadingAudit(true)
    setShowAuditHistory(true)
    try {
      const logs = await getTaskAuditLogs(selectedTask.id)
      setAuditLogs(Array.isArray(logs) ? logs : [])
    } catch {
      setAuditLogs([])
      showToast('Error loading audit logs', 'error')
    } finally {
      setLoadingAudit(false)
    }
  }

  // ─────────────────────────────────────────────────────
  // Drag & drop
  // ─────────────────────────────────────────────────────
  const handleDragStart = (e, taskId) => {
    setDragTaskId(taskId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragEnd = () => {
    setDragTaskId(null)
    setDragOverCol(null)
  }

  const handleDragOver = (e, statusId) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverCol(statusId)
  }

  const handleDrop = async (e, targetStatusId) => {
    e.preventDefault()
    setDragOverCol(null)
    if (!dragTaskId) return
    const task = tasks.find(t => t.id === dragTaskId)
    if (task && task.taskStatusId !== targetStatusId) {
      await handleStatusChange(dragTaskId, targetStatusId)
    }
    setDragTaskId(null)
  }

  // ─────────────────────────────────────────────────────
  // UI helpers
  // ─────────────────────────────────────────────────────
  const showToast = (message, type) => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const openAddModal = () => {
    setEditingTask(null)
    setFormData({ name: '', description: '', projectId: 1, dueDate: '', isActive: true })
    setShowModal(true)
  }

  const openEditModal = (task) => {
    setEditingTask(task)
    setFormData({
      name: task.name, description: task.description || '',
      projectId: task.projectId,
      dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
      isActive: task.isActive,
    })
    setShowModal(true)
  }

  const openTaskDetails = (task) => {
    setSelectedTask(task)
    setShowTaskDetails(true)
    setShowAuditHistory(false)
    setAuditLogs([])
  }

  const clearFilters = () => {
    setFilterName('')
    setFilterStatus('')
    setFilterPriority('')
    setFilterCreatedAt('')
    setSearchTerm('')
    setPageNumber(1)
    setFilterVersion(v => v + 1)
  }

  const applyFilters = () => {
    setPageNumber(1)
    setFilterVersion(v => v + 1)
  }

  const formatDate = (d) => {
    if (!d) return null
    const dt = new Date(d)
    const diff = Math.ceil((dt - new Date()) / (1000 * 60 * 60 * 24))
    return { label: dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }), overdue: diff < 0 }
  }

  // ─────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────
  return (
    <div className="tasks-container">

      {/* ── Top bar ── */}
      <div className="tasks-topbar">
        <div className="tasks-topbar-left">
          <h1 className="tasks-title">Tasks</h1>
        </div>
        <div className="tasks-topbar-right">
          <div className="search-wrap">
            <span className="search-icon">⌕</span>
            <input
              type="text"
              className="search-input"
              placeholder="Search tasks…"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && applyFilters()}
            />
          </div>
          <button
            className={`btn-filters ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(v => !v)}
          >
            ⚙ Filters
            {activeFilterCount > 0 && <span className="filter-badge">{activeFilterCount}</span>}
          </button>
          <button className="btn-apply-search" onClick={applyFilters}>
            Search
          </button>
          <button className="btn-add-task" onClick={openAddModal}>
            + New task
          </button>
        </div>
      </div>

      {/* ── Filter panel ── */}
      {showFilters && (
        <div className="filter-panel">
          <div className="filter-group">
            <label>Name contains</label>
            <input type="text" placeholder="Task name…" value={filterName} onChange={e => setFilterName(e.target.value)} />
          </div>
          <div className="filter-group">
            <label>Status</label>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="">All statuses</option>
              {Object.entries(STATUS_OPTIONS).map(([id, s]) =>
                <option key={id} value={id}>{s.name}</option>
              )}
            </select>
          </div>
          <div className="filter-group">
            <label>Priority</label>
            <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
              <option value="">All priorities</option>
              {Object.entries(PRIORITY_OPTIONS).map(([id, p]) =>
                <option key={id} value={id}>{p.name}</option>
              )}
            </select>
          </div>
          <div className="filter-group">
            <label>Created after</label>
            <input type="date" value={filterCreatedAt} onChange={e => setFilterCreatedAt(e.target.value)} />
          </div>
          <div className="filter-group filter-actions">
            <button className="btn-clear-filters" onClick={clearFilters}>✕ Clear</button>
          </div>
        </div>
      )}

      {/* ── Kanban board ── */}
      <div className="tasks-kanban">
        {[1, 2, 3, 4, 5].map(statusId => {
          const col = STATUS_OPTIONS[statusId]
          const colTasks = groupedTasks[statusId]
          const isOver = dragOverCol === statusId

          return (
            <div
              key={statusId}
              className={`kanban-column ${isOver ? 'drag-over' : ''}`}
              onDragOver={e => handleDragOver(e, statusId)}
              onDragLeave={() => setDragOverCol(null)}
              onDrop={e => handleDrop(e, statusId)}
            >
              {/* Column header */}
              <div className="column-header" style={{ borderTopColor: col.color }}>
                <span className="column-dot" style={{ background: col.color }} />
                <span className="column-name">{col.name}</span>
                <span className="column-count">{colTasks.length}</span>
              </div>

              {/* Cards */}
              <div className="column-tasks">
                {colTasks.length === 0 ? (
                  <div className="empty-drop-zone">
                    {isOver ? 'Drop here' : 'No tasks'}
                  </div>
                ) : (
                  colTasks.map(task => {
                    const due = formatDate(task.dueDate)
                    const prio = PRIORITY_OPTIONS[task.taskPriorityId]
                    const isDragging = dragTaskId === task.id

                    return (
                      <div
                        key={task.id}
                        className={`task-card ${isDragging ? 'is-dragging' : ''}`}
                        style={{ borderLeftColor: col.color }}
                        draggable
                        onDragStart={e => handleDragStart(e, task.id)}
                        onDragEnd={handleDragEnd}
                        onClick={() => openTaskDetails(task)}
                      >
                        {/* Card header */}
                        <div className="card-header">
                          <span className="card-title">{task.name}</span>
                          <div className="card-actions" onClick={e => e.stopPropagation()}>
                            <button
                              className="card-btn edit"
                              title="Edit"
                              onClick={() => openEditModal(task)}
                            >✎</button>
                            <button
                              className="card-btn delete"
                              title="Delete"
                              onClick={() => { setSelectedTaskToDelete(task); setShowDeleteConfirm(true) }}
                            >✕</button>
                          </div>
                        </div>

                        {/* Description */}
                        {task.description && (
                          <p className="card-desc">{task.description}</p>
                        )}

                        {/* Footer meta */}
                        <div className="card-footer">
                          {prio && <span className={`card-priority ${prio.cls}`}>{prio.name}</span>}
                          {due && (
                            <span className={`card-due ${due.overdue ? 'overdue' : ''}`}>
                              📅 {due.label}
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })
                )}

                {/* Drop indicator when dragging over a non-empty column */}
                {isOver && colTasks.length > 0 && (
                  <div className="drop-indicator" />
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className="pagination-bar">
        <div className="pagination-info">Showing {tasks.length} of {totalCount} tasks</div>
        <div className="pagination-controls">
          <button className="pagination-btn" disabled={pageNumber <= 1} onClick={() => setPageNumber(p => Math.max(p - 1, 1))}>
            Previous
          </button>
          <span className="pagination-text">Page {pageNumber} of {Math.max(1, Math.ceil(totalCount / pageSize))}</span>
          <button className="pagination-btn" disabled={pageNumber >= Math.max(1, Math.ceil(totalCount / pageSize))} onClick={() => setPageNumber(p => p + 1)}>
            Next
          </button>
          <select className="pagination-select" value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPageNumber(1) }}>
            {[10, 20, 50].map(size => (
              <option key={size} value={size}>{size} / page</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Create / Edit modal ── */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingTask ? 'Edit task' : 'New task'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit} className="task-form">
              <div className="form-group">
                <label htmlFor="name">Task name *</label>
                <input id="name" name="name" type="text" value={formData.name}
                  onChange={handleInputChange} placeholder="Enter task name" maxLength="100" required />
              </div>
              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea id="description" name="description" value={formData.description}
                  onChange={handleInputChange} placeholder="Optional description" rows="3" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="dueDate">Due date</label>
                  <input id="dueDate" name="dueDate" type="date" value={formData.dueDate} onChange={handleInputChange} />
                </div>
                <div className="form-group form-group-checkbox">
                  <label htmlFor="isActive">
                    <input id="isActive" name="isActive" type="checkbox" checked={formData.isActive} onChange={handleInputChange} />
                    Active
                  </label>
                </div>
              </div>
              <div className="form-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-submit">
                  {editingTask ? 'Update task' : 'Create task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete confirm ── */}
      {showDeleteConfirm && (
        <div className="confirm-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="confirm-modal" onClick={e => e.stopPropagation()}>
            <h2>Delete task</h2>
            <p>Are you sure you want to delete <strong>{selectedTaskToDelete?.name}</strong>? This cannot be undone.</p>
            <div className="confirm-actions">
              <button className="btn-cancel" onClick={() => setShowDeleteConfirm(false)}>No, keep it</button>
              <button className="btn-submit confirm-delete" onClick={confirmDeleteTask}>Yes, delete</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Task details modal ── */}
      {showTaskDetails && selectedTask && (
        <div className="modal-overlay" onClick={() => setShowTaskDetails(false)}>
          <div className="modal-content task-details-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Task details</h2>
              <button className="modal-close" onClick={() => setShowTaskDetails(false)}>✕</button>
            </div>

            <div className="task-details-content">
              <div className="task-info-section">
                <div className="task-info-header">
                  <h3>{selectedTask.name}</h3>
                  <span className={`status-badge status-${selectedTask.taskStatusId}`}>
                    {STATUS_OPTIONS[selectedTask.taskStatusId]?.name}
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
                      <span className="meta-label">Due date</span>
                      <span className="meta-value">{new Date(selectedTask.dueDate).toLocaleDateString()}</span>
                    </div>
                  )}
                  {selectedTask.taskPriorityId && (
                    <div className="meta-item">
                      <span className="meta-label">Priority</span>
                      <span className={`priority-badge ${PRIORITY_OPTIONS[selectedTask.taskPriorityId]?.cls}`}>
                        {PRIORITY_OPTIONS[selectedTask.taskPriorityId]?.name}
                      </span>
                    </div>
                  )}
                  <div className="meta-item">
                    <span className="meta-label">Created</span>
                    <span className="meta-value">{new Date(selectedTask.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">Active</span>
                    <span className="meta-value">{selectedTask.isActive ? 'Yes' : 'No'}</span>
                  </div>
                </div>
              </div>

              <div className="task-actions-section">
                <button className="btn-history" onClick={handleViewAuditHistory} disabled={loadingAudit}>
                  {loadingAudit ? 'Loading…' : '📋 View history'}
                </button>
              </div>

              {showAuditHistory && (
                <div className="audit-logs-section">
                  <h4>Audit history</h4>
                  {auditLogs.length === 0 ? (
                    <div className="no-audit-logs"><p>No audit logs available</p></div>
                  ) : (
                    <div className="audit-table-container">
                      <table className="audit-table">
                        <thead>
                          <tr>
                            <th>User</th><th>Action</th><th>Timestamp</th><th>Changes</th>
                          </tr>
                        </thead>
                        <tbody>
                          {auditLogs.map(log => (
                            <tr key={log.id}>
                              <td className="user-cell"><span className="user-name">{log.userName || 'Unknown'}</span></td>
                              <td className="action-cell">
                                <span className={`action-badge action-${log.action.toLowerCase()}`}>{log.action}</span>
                              </td>
                              <td className="timestamp-cell">{new Date(log.timestamp).toLocaleString()}</td>
                              <td className="changes-cell">
                                {log.changes ? (
                                  <details className="changes-details">
                                    <summary>View changes</summary>
                                    <pre className="changes-content">{log.changes}</pre>
                                  </details>
                                ) : <span className="no-changes">—</span>}
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
              <button className="btn-cancel" onClick={() => setShowTaskDetails(false)}>Close</button>
              <button className="btn-submit" onClick={() => { setShowTaskDetails(false); openEditModal(selectedTask) }}>
                Edit task
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
