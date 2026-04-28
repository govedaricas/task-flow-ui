import { useState } from 'react'
import Navbar from './Navbar'
import Tasks from './Tasks'
import Projects from './Projects'
import Statistics from './Statistics'
import './dashboard.css'

const Dashboard = () => {
  const [activeView, setActiveView] = useState('tasks')
  const [statsUpdate, setStatsUpdate] = useState(null)

  const handleStatsUpdate = (newStats) => {
    setStatsUpdate(newStats)
  }

  const renderView = () => {
    switch (activeView) {
      case 'tasks':
        return <Tasks onStatsUpdate={handleStatsUpdate} />
      case 'projects':
        return <Projects />
      default:
        return <Tasks onStatsUpdate={handleStatsUpdate} />
    }
  }

  return (
    <div className="dashboard-container">
      <Navbar activeView={activeView} onNavigate={setActiveView} />
      <div className="dashboard-layout">
        <main className="main-content">
          {renderView()}
        </main>
        <aside className="sidebar-stats">
          <Statistics statsUpdate={statsUpdate} />
        </aside>
      </div>
    </div>
  )
}

export default Dashboard