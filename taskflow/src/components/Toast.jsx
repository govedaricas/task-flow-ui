import { useEffect, useState } from 'react'

function Toast({ message, type, onClose }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!message) return
    setVisible(true)
    const timer = setTimeout(() => {
      setVisible(false)
      setTimeout(onClose, 300)
    }, 3500)
    return () => clearTimeout(timer)
  }, [message])

  if (!message) return null

  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      padding: '12px 16px',
      borderRadius: '10px',
      minWidth: '220px',
      maxWidth: '340px',
      background: type === 'success' ? '#f0faf4' : '#fff1f1',
      border: `0.5px solid ${type === 'success' ? '#6fcf97' : '#f09595'}`,
      boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(10px)',
      transition: 'opacity 0.3s ease, transform 0.3s ease',
    }}>
      <div style={{
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        flexShrink: 0,
        background: type === 'success' ? '#27ae60' : '#e24b4a',
      }} />
      <span style={{
        fontSize: '13px',
        color: type === 'success' ? '#1a7a40' : '#a32d2d',
        lineHeight: '1.4',
      }}>
        {message}
      </span>
      <button
        onClick={() => { setVisible(false); setTimeout(onClose, 300) }}
        style={{
          marginLeft: 'auto',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: '16px',
          lineHeight: 1,
          color: type === 'success' ? '#6fcf97' : '#f09595',
          padding: '0 2px',
          flexShrink: 0,
        }}
      >
        ×
      </button>
    </div>
  )
}

export default Toast
