import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Logo from '../components/Logo'
import { useAuth } from '../context/AuthContext'
import './Login.css'

const INSTRUMENTOS = ['Violino', 'Viola', 'Violoncelo', 'Piano', 'Violão', 'Guitarra', 'Canto', 'Flauta', 'Bateria', 'Outro']

export default function Login() {
  const navigate = useNavigate()
  const { login, registrar } = useAuth()
  const [modo, setModo] = useState('entrar') // 'entrar' | 'cadastro' | 'recuperar'
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [nome, setNome] = useState('')
  const [instrumento, setInstrumento] = useState('Violino')
  const [instrumentoOutro, setInstrumentoOutro] = useState('')
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [recuperarEnviado, setRecuperarEnviado] = useState(false)

  function trocarModo(novoModo) {
    setModo(novoModo)
    setErro('')
  }

  async function handleEntrar(e) {
    e.preventDefault()
    setErro('')
    setEnviando(true)
    try {
      await login(email, senha)
      navigate('/dashboard')
    } catch (err) {
      setErro(err.message)
    } finally {
      setEnviando(false)
    }
  }

  async function handleCadastro(e) {
    e.preventDefault()
    setErro('')
    setEnviando(true)
    try {
      const instrumentoFinal = instrumento === 'Outro' ? instrumentoOutro.trim() : instrumento
      await registrar(nome, email, senha, instrumentoFinal)
      navigate('/dashboard')
    } catch (err) {
      setErro(err.message)
    } finally {
      setEnviando(false)
    }
  }

  function handleRecuperar(e) {
    e.preventDefault()
    setRecuperarEnviado(true)
  }

  return (
    <div className="login-page">
      <div className="login-notes" aria-hidden="true">
        <span className="note note-1">♪</span>
        <span className="note note-2">♫</span>
        <span className="note note-3">♪</span>
        <span className="note note-4">𝄞</span>
      </div>

      <div className="login-card fade-in-up">
        <div className="login-brand">
          <Logo size={52} />
          <h1 className="login-title">Diário de Aulas</h1>
          <p className="login-tagline">A melodia começa aqui</p>
        </div>

        {modo === 'entrar' && (
          <form className="login-form" onSubmit={handleEntrar}>
            <label className="field">
              <span>Email</span>
              <input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </label>
            <label className="field">
              <span>Senha</span>
              <input
                type="password"
                placeholder="••••••••"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                autoComplete="current-password"
                required
              />
            </label>

            {erro && <p className="login-erro">{erro}</p>}

            <button type="submit" className="btn btn-primary" disabled={enviando}>
              {enviando ? 'Entrando...' : 'Entrar'}
            </button>

            <div className="login-links">
              <button type="button" className="link-btn" onClick={() => trocarModo('cadastro')}>
                Criar cadastro
              </button>
              <button type="button" className="link-btn subtle" onClick={() => trocarModo('recuperar')}>
                Esqueci minha senha
              </button>
            </div>
          </form>
        )}

        {modo === 'cadastro' && (
          <form className="login-form" onSubmit={handleCadastro}>
            <label className="field">
              <span>Nome completo</span>
              <input
                type="text"
                placeholder="Seu nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
              />
            </label>
            <label className="field">
              <span>Email</span>
              <input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>
            <label className="field">
              <span>Senha</span>
              <input
                type="password"
                placeholder="Crie uma senha (mín. 6 caracteres)"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                minLength={6}
                required
              />
            </label>
            <label className="field">
              <span>Qual instrumento você ensina?</span>
              <select value={instrumento} onChange={(e) => setInstrumento(e.target.value)}>
                {INSTRUMENTOS.map((i) => (
                  <option key={i} value={i}>{i}</option>
                ))}
              </select>
            </label>
            {instrumento === 'Outro' && (
              <label className="field">
                <span>Qual?</span>
                <input
                  type="text"
                  placeholder="Ex: Saxofone"
                  value={instrumentoOutro}
                  onChange={(e) => setInstrumentoOutro(e.target.value)}
                  required
                />
              </label>
            )}

            {erro && <p className="login-erro">{erro}</p>}

            <button type="submit" className="btn btn-primary" disabled={enviando}>
              {enviando ? 'Criando...' : 'Criar cadastro'}
            </button>
            <div className="login-links login-links-center">
              <button type="button" className="link-btn subtle" onClick={() => trocarModo('entrar')}>
                Voltar para o login
              </button>
            </div>
          </form>
        )}

        {modo === 'recuperar' && (
          <form className="login-form" onSubmit={handleRecuperar}>
            {recuperarEnviado ? (
              <p className="login-hint">
                Essa funcionalidade ainda não está disponível nesta versão. Por enquanto, fale com o suporte para redefinir sua senha.
              </p>
            ) : (
              <>
                <p className="login-hint">
                  Informe seu email cadastrado e enviaremos as instruções para redefinir sua senha.
                </p>
                <label className="field">
                  <span>Email</span>
                  <input type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                </label>
                <button type="submit" className="btn btn-primary">Enviar instruções</button>
              </>
            )}
            <div className="login-links login-links-center">
              <button type="button" className="link-btn subtle" onClick={() => trocarModo('entrar')}>
                Voltar para o login
              </button>
            </div>
          </form>
        )}
      </div>

      <p className="login-footer">Versão de demonstração · dados fictícios</p>
    </div>
  )
}
