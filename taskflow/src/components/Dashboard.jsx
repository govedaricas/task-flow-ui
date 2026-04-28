import { useState } from 'react'
import Sidebar from './Sidebar'
import Tasks from './Tasks'
import Projects from './Projects'
import Statistics from './Statistics'

const Dashboard = () => {
  const [activeView, setActiveView] = useState('tasks')

  const renderView = () => {
    switch (activeView) {
      case 'tasks':
        return <Tasks />
      case 'projects':
        return <Projects />
      default:
        return <Tasks />
    }
  }

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <Sidebar onNavigate={setActiveView} />
      <div style={{ flex: 1, padding: '20px' }}>
        {renderView()}
      </div>
      <Statistics />
    </div>
  )
}

export default Dashboard