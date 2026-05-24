import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from './components/AuthContext'
import { useLoading } from './components/LoadingContext'
import { loginUser } from './api/auth'
import validateLogin from './utils/validateLogin'
import Toast from './components/Toast'

const initialForm = { username: '', password: '' }

function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const { loading, setLoading } = useLoading()
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState({})
  const [toast, setToast] = useState({ message: '', type: '' })

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async () => {
    const e = validateLogin(form)
    if (Object.keys(e).length > 0) return setErrors(e)
    setErrors({})

    setLoading(true)
    try {
      const res = await loginUser(form)
      login(res.responseModel.token)
      navigate('/dashboard')
    } catch (err) {
      setToast({ message: err.message, type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-root">
      <div className="brand">
        <div className="brand-mark">
          <svg viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
            <rect x="2" y="2" width="6" height="6" rx="1.5" />
            <rect x="10" y="2" width="6" height="6" rx="1.5" />
            <rect x="2" y="10" width="6" height="6" rx="1.5" />
            <rect x="10" y="10" width="3" height="6" rx="1" />
            <rect x="13" y="10" width="3" height="3" rx="1" />
          </svg>
        </div>
        <span className="brand-name">taskflow</span>
      </div>

      <div className="card">
        <div className="tabs">
          <button className="tab active">Sign in</button>
          <button className="tab" onClick={() => navigate('/register')}>Create account</button>
        </div>

        {['username', 'password'].map((field) => (
          <div className="field" key={field}>
            <label>{field.charAt(0).toUpperCase() + field.slice(1)}</label>
            <input
              name={field}
              type={field === 'password' ? 'password' : 'text'}
              placeholder={field === 'password' ? '••••••••' : 'your_username'}
              value={form[field]}
              onChange={handleChange}
            />
            {errors[field] && <span className="error">{errors[field]}</span>}
          </div>
        ))}

        <button className="submit-btn" onClick={handleSubmit} disabled={loading}>
          {loading ? 'Signing in...' : 'Sign in'}
        </button>

        <p className="hint-accent">
          Forgot password?{' '}
          <a href="#" style={{ color: 'var(--color-text-secondary)', textDecoration: 'underline', textUnderlineOffset: '2px' }}>
            Reset it
          </a>
        </p>
      </div>

      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: '', type: '' })}
      />

    </div>

  )
}

export default Login