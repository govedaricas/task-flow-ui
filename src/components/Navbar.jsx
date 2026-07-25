import { useAuth } from './AuthContext'
import './navbar.css'

const Navbar = ({ activeView, onNavigate }) => {
  const { logout } = useAuth()

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-logo">
          <span className="logo-icon">📋</span>
          <span className="logo-text">TaskFlow</span>
        </div>

        <ul className="nav-menu">
          <li className={`nav-item ${activeView === 'tasks' ? 'active' : ''}`}>
            <button onClick={() => onNavigate('tasks')} className="nav-link">
              <span className="nav-icon">✓</span>
              <span className="nav-label">Tasks</span>
            </button>
          </li>
          <li className={`nav-item ${activeView === 'projects' ? 'active' : ''}`}>
            <button onClick={() => onNavigate('projects')} className="nav-link">
              <span className="nav-icon">📁</span>
              <span className="nav-label">Projects</span>
            </button>
          </li>
        </ul>

        <div className="navbar-actions">
          <button onClick={logout} className="logout-btn">
            <span>🚪</span>
            <span className="nav-label">Logout</span>
          </button>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
