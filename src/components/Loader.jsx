import { useLoading } from './LoadingContext'

const Loader = () => {
  const { loading } = useLoading()

  if (!loading) return null

  return (
    <div className="global-loader-overlay">
      <div className="global-loader"></div>
    </div>
  )
}

export default Loader
