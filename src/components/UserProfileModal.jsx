import { useState, useEffect } from 'react'
import api from '../api/api'
import './UserProfileModal.css'

// Parse JWT token to get user claims
const parseJwt = (token) => {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(window.atob(base64))
  } catch {
    return null
  }
}

const getUserFromToken = () => {
  const token = localStorage.getItem('token')
  if (!token) return null
  const payload = parseJwt(token)
  if (!payload) return null
  return {
    id: payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'],
    username: payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'],
    email: payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'],
  }
}

const UserProfileModal = ({ onClose }) => {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [formData, setFormData] = useState({
    id: '',
    username: '',
    firstName: '',
    lastName: '',
    email: '',
    isActive: true,
    roleIds: []
  })

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const tokenUser = getUserFromToken()
        if (!tokenUser?.id) throw new Error('Could not get user ID from token')

        const user = await api(`api/users/${tokenUser.id}`)
        setFormData({
          id: user.id,
          username: user.username || '',
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          email: user.email || '',
          isActive: user.isActive ?? true,
          roleIds: user.roles?.map(r => r.id) || []
        })
      } catch (err) {
        setError('Failed to load user data.')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchUser()
  }, [])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(false)
    try {
      await api('api/users', {
        method: 'PUT',
        body: JSON.stringify(formData)
      })
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError('Failed to update profile. Please try again.')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="profile-modal-overlay" onClick={onClose} />

      <div className="profile-modal">
        <div className="profile-modal-header">
          <div className="profile-modal-avatar">👤</div>
          <div className="profile-modal-title">
            <h2>Edit Profile</h2>
            <p>Update your account information</p>
          </div>
          <button className="profile-modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="profile-modal-body">
          {loading ? (
            <div className="profile-modal-loading">Loading...</div>
          ) : (
            <form onSubmit={handleSubmit} className="profile-form">
              <div className="profile-field">
                <label htmlFor="profile-username">Username</label>
                <input
                  id="profile-username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  placeholder="Username"
                />
              </div>

              <div className="profile-form-row">
                <div className="profile-field">
                  <label htmlFor="profile-firstName">First Name</label>
                  <input
                    id="profile-firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                    placeholder="First name"
                  />
                </div>
                <div className="profile-field">
                  <label htmlFor="profile-lastName">Last Name</label>
                  <input
                    id="profile-lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                    placeholder="Last name"
                  />
                </div>
              </div>

              <div className="profile-field">
                <label htmlFor="profile-email">Email</label>
                <input
                  id="profile-email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="email@example.com"
                />
              </div>

              <label className="profile-checkbox-label">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleChange}
                />
                Active Account
              </label>

              {error && <div className="profile-message error">{error}</div>}
              {success && <div className="profile-message success">✓ Profile updated successfully!</div>}

              <div className="profile-form-actions">
                <button type="button" className="profile-btn-cancel" onClick={onClose}>
                  Cancel
                </button>
                <button type="submit" className="profile-btn-save" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  )
}

export default UserProfileModal
