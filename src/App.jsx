import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { AppDataProvider } from './context/AppDataContext'
import RotaProtegida from './components/RotaProtegida'
import AppLayout from './layouts/AppLayout'
import Login from './pages/Login'
import Agenda from './pages/Agenda'
import Turmas from './pages/Turmas'
import TurmaDetalhe from './pages/TurmaDetalhe'
import Alunos from './pages/Alunos'
import AlunoDetalhe from './pages/AlunoDetalhe'
import Materiais from './pages/Materiais'
import Carteira from './pages/Carteira'

export default function App() {
  return (
    <AuthProvider>
      <AppDataProvider>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route
            path="/dashboard"
            element={
              <RotaProtegida>
                <AppLayout />
              </RotaProtegida>
            }
          >
            <Route index element={<Navigate to="agenda" replace />} />
            <Route path="agenda" element={<Agenda />} />
            <Route path="turmas" element={<Turmas />} />
            <Route path="turmas/:id" element={<TurmaDetalhe />} />
            <Route path="alunos" element={<Alunos />} />
            <Route path="alunos/:id" element={<AlunoDetalhe />} />
            <Route path="materiais" element={<Materiais />} />
            <Route path="carteira" element={<Carteira />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppDataProvider>
    </AuthProvider>
  )
}
