import { useEffect, useState } from 'react'
import './toast.css'

function Toast({ message, type = 'info', onClose }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!message) return
    setVisible(true)
    const timer = setTimeout(() => {
      setVisible(false)
      if (onClose) setTimeout(onClose, 300)
    }, 3500)
    return () => clearTimeout(timer)
  }, [message, onClose])

  if (!message) return null

  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ'
  }

  return (
    <div className={`toast toast-${type} ${visible ? 'visible' : ''}`}>
      <span className="toast-icon">{icons[type]}</span>
      <span className="toast-message">{message}</span>
      <button
        className="toast-close"
        onClick={() => {
          setVisible(false)
          if (onClose) setTimeout(onClose, 300)
        }}
        aria-label="Close notification"
      >
        ×
      </button>
    </div>
  )
}

export { Toast }
export default Toast
