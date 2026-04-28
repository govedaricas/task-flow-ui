import { useEffect, useState } from 'react'
import { getAllProjects } from '../api/projects'

const Projects = () => {
  const [projects, setProjects] = useState([])

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const data = await getAllProjects()
        setProjects(data.data || [])
      } catch (error) {
        console.error('Error fetching projects:', error)
      }
    }
    fetchProjects()
  }, [])

  return (
    <div>
      <h2>Projects</h2>
      <ul>
        {projects.map(project => (
          <li key={project.id} style={{ marginBottom: '10px', border: '1px solid #ccc', padding: '10px' }}>
            <h3>{project.name}</h3>
            <p>{project.description}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default Projects