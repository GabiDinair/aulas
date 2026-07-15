import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function RotaProtegida({ children }) {
  const { autenticado, carregando } = useAuth()

  if (carregando) {
    return <div className="auth-loading">Carregando...</div>
  }

  if (!autenticado) {
    return <Navigate to="/" replace />
  }

  return children
}
