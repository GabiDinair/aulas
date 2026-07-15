import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { BookOpen, CalendarDays, LogOut, Music2, Users, UserRound, Wallet } from 'lucide-react'
import Logo from '../components/Logo'
import { useAuth } from '../context/AuthContext'
import './AppLayout.css'

const NAV_ITEMS = [
  { to: '/dashboard/agenda', label: 'Agenda', icon: CalendarDays },
  { to: '/dashboard/turmas', label: 'Turmas', icon: Music2 },
  { to: '/dashboard/alunos', label: 'Alunos', icon: Users },
  { to: '/dashboard/materiais', label: 'Materiais', icon: BookOpen },
  { to: '/dashboard/carteira', label: 'Minha Carteira', icon: Wallet },
]

export default function AppLayout() {
  const navigate = useNavigate()
  const { professor, logout } = useAuth()

  function handleSair() {
    logout()
    navigate('/')
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <Logo size={38} />
          <div>
            <p className="sidebar-title">Diário de Aulas</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => 'sidebar-link' + (isActive ? ' active' : '')}
            >
              <Icon size={18} strokeWidth={1.6} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <button className="sidebar-logout" onClick={handleSair}>
          <LogOut size={17} strokeWidth={1.6} />
          <span>Sair</span>
        </button>
      </aside>

      <div className="app-main">
        <header className="app-topbar">
          <div>
            <p className="topbar-eyebrow">Bem-vinda de volta</p>
            <h1 className="topbar-title">Diário de Aulas</h1>
          </div>
          <div className="topbar-profile">
            <div className="topbar-info">
              <p className="topbar-name">{professor?.nome}</p>
              <p className="topbar-role">{professor?.titulo}</p>
            </div>
            <div className="avatar avatar-lg">
              <UserRound size={20} strokeWidth={1.6} />
            </div>
          </div>
        </header>

        <main className="app-content fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
