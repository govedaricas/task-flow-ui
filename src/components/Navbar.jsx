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
              Tasks
            </button>
          </li>
          <li className={`nav-item ${activeView === 'projects' ? 'active' : ''}`}>
            <button onClick={() => onNavigate('projects')} className="nav-link">
              <span className="nav-icon">📁</span>
              Projects
            </button>
          </li>
        </ul>

        <div className="navbar-actions">
          <button onClick={logout} className="logout-btn">
            <span>🚪</span>
            Logout
          </button>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
