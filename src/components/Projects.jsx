import { useEffect, useState } from 'react'
import { getAllProjects } from '../api/projects'
import { Toast } from './Toast'
import './projects.css'

const Projects = () => {
  const [projects, setProjects] = useState([])
  const [toast, setToast] = useState(null)

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      const data = await getAllProjects()
      setProjects(data.data || [])
    } catch (error) {
      console.error('Error fetching projects:', error)
      showToast('Error fetching projects', 'error')
    }
  }

  const showToast = (message, type) => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  return (
    <div className="projects-container">
      <div className="projects-header">
        <div>
          <h1>Projects</h1>
          <p className="projects-subtitle">Manage your projects and view details</p>
        </div>
      </div>

      <div className="projects-grid">
        {projects.length === 0 ? (
          <div className="empty-state">
            <p>📁 No projects yet</p>
            <p className="empty-text">Start by creating a new project</p>
          </div>
        ) : (
          projects.map(project => (
            <div key={project.id} className="project-card">
              <div className="project-card-header">
                <div className="project-icon">📁</div>
                <h3 className="project-name">{project.name}</h3>
              </div>

              {project.description && (
                <p className="project-description">{project.description}</p>
              )}

              <div className="project-meta">
                <span className="project-badge">Active</span>
              </div>

              <div className="project-actions">
                <button className="btn-action view">View</button>
                <button className="btn-action edit">Edit</button>
              </div>
            </div>
          ))
        )}
      </div>

      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  )
}

export default Projects