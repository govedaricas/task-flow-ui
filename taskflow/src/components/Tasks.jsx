import { useEffect, useState } from 'react'
import { getAllTasks, updateTaskStatus } from '../api/tasks'

const Tasks = () => {
  const [tasks, setTasks] = useState([])

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const data = await getAllTasks()
        setTasks(data)
      } catch (error) {
        console.error('Error fetching tasks:', error)
      }
    }
    fetchTasks()
  }, [])

  const handleStatusChange = async (taskId, newStatusId) => {
    try {
      await updateTaskStatus(taskId, newStatusId)
      setTasks(tasks.map(task => task.id === taskId ? { ...task, taskStatusId: newStatusId } : task))
    } catch (error) {
      console.error('Error updating status:', error)
    }
  }

  return (
    <div>
      <h2>Tasks</h2>
      <ul>
        {tasks.map(task => (
          <li key={task.id} style={{ marginBottom: '10px', border: '1px solid #ccc', padding: '10px' }}>
            <h3>{task.name}</h3>
            <p>{task.description}</p>
            <p>Status: {task.taskStatus?.name}</p>
            <select
              value={task.taskStatusId}
              onChange={(e) => handleStatusChange(task.id, Number(e.target.value))}
            >
              {Object.entries(STATUS_OPTIONS).map(([id, status]) => (
                <option key={id} value={id}>
                  {status.name}
                </option>
              ))}
            </select>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default Tasks