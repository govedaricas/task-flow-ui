import { useState } from 'react'
import { registerUser } from './api/auth'
import { useNavigate } from 'react-router-dom'
import validateRegister from './utils/validateRegister'

const initialForm = {
  username: '', password: '', firstName: '',
  lastName: '', email: '', isActive: true
}

const placeholders = {
  username: 'ana_maric',
  firstName: 'Ana',
  lastName: 'Marić',
  email: 'ana@example.com',
  password: 'min. 8 characters',
}

function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState({})
  const [message, setMessage] = useState('')
  const [msgType, setMsgType] = useState('')

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async () => {
    const e = validateRegister(form)
    if (Object.keys(e).length > 0) return setErrors(e)
    setErrors({})

    try {
      await registerUser(form)
      setMsgType('success')
      setMessage('Registration successful!')
    } catch (err) {
      setMsgType('error')
      setMessage(err.message)
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
          <button className="tab" onClick={() => navigate('/login')}>Sign in</button>
          <button className="tab active">Create account</button>
        </div>

        <div className="row-2">
          {['firstName', 'lastName'].map((field) => (
            <div className="field" key={field}>
              <label>{field === 'firstName' ? 'First name' : 'Last name'}</label>
              <input
                name={field}
                type="text"
                placeholder={placeholders[field]}
                value={form[field]}
                onChange={handleChange}
              />
              {errors[field] && <span className="error">{errors[field]}</span>}
            </div>
          ))}
        </div>

        {['email', 'username', 'password'].map((field) => (
          <div className="field" key={field}>
            <label>{field.charAt(0).toUpperCase() + field.slice(1)}</label>
            <input
              name={field}
              type={field === 'password' ? 'password' : field === 'email' ? 'email' : 'text'}
              placeholder={placeholders[field]}
              value={form[field]}
              onChange={handleChange}
            />
            {errors[field] && <span className="error">{errors[field]}</span>}
          </div>
        ))}

        <button className="submit-btn" onClick={handleSubmit}>Create account</button>

        {message && <p className={`message ${msgType}`}>{message}</p>}
      </div>
    </div>

  )
}

export default Register