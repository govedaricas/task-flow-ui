import { createContext, useContext, useMemo, useState, useEffect, useCallback } from 'react'

const LoadingContext = createContext()

export const useLoading = () => useContext(LoadingContext)

export const LoadingProvider = ({ children }) => {
  const [pendingRequests, setPendingRequests] = useState(0)
  const [showLoader, setShowLoader] = useState(false)

  useEffect(() => {
  if (pendingRequests === 0) {
    setShowLoader(false)
    return
  }

  if (showLoader) return  

  const timer = setTimeout(() => {
    setShowLoader(true)
  }, 300)

  return () => clearTimeout(timer)
}, [pendingRequests])

  const setLoading = useCallback((active) => {
  setPendingRequests((current) => {
    if (active) return current + 1
    return Math.max(current - 1, 0)
  })
}, [])

const value = useMemo(() => ({ loading: showLoader, setLoading }), [showLoader, setLoading])

  return (
    <LoadingContext.Provider value={value}>
      {children}
    </LoadingContext.Provider>
  )
}
