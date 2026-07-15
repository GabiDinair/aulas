import { createContext, useContext, useEffect, useState } from 'react'

const AuthContext = createContext(null)

async function chamarApi(caminho, opcoes) {
  const res = await fetch(caminho, opcoes)
  const dados = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(dados.erro || 'Algo deu errado. Tente novamente.')
  }
  return dados
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token'))
  const [professor, setProfessor] = useState(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    if (!token) {
      setCarregando(false)
      return
    }
    chamarApi('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
      .then((dados) => setProfessor(dados.professor))
      .catch(() => {
        localStorage.removeItem('token')
        setToken(null)
      })
      .finally(() => setCarregando(false))
  }, [token])

  async function login(email, senha) {
    const dados = await chamarApi('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, senha }),
    })
    localStorage.setItem('token', dados.token)
    setToken(dados.token)
    setProfessor(dados.professor)
  }

  async function registrar(nome, email, senha) {
    const dados = await chamarApi('/api/auth/registrar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, email, senha }),
    })
    localStorage.setItem('token', dados.token)
    setToken(dados.token)
    setProfessor(dados.professor)
  }

  function logout() {
    localStorage.removeItem('token')
    setToken(null)
    setProfessor(null)
  }

  const value = { token, professor, carregando, autenticado: Boolean(token && professor), login, registrar, logout }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de um AuthProvider')
  return ctx
}
