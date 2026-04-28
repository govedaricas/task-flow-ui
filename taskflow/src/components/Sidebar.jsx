import { useAuth } from './AuthContext'

const Sidebar = ({ onNavigate }) => {
  const { logout } = useAuth()

  return (
    <div style={{ width: '200px', background: '#f0f0f0', padding: '20px' }}>
      <h2>TaskFlow</h2>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        <li><button onClick={() => onNavigate('tasks')}>Tasks</button></li>
        <li><button onClick={() => onNavigate('projects')}>Projects</button></li>
      </ul>
      <button onClick={logout} style={{ marginTop: '20px' }}>Logout</button>
    </div>
  )
}

export default Sidebar