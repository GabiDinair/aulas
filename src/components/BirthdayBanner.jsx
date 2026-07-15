import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { PartyPopper } from 'lucide-react'
import { aniversarioInfo } from '../data/helpers'
import { useAppData } from '../context/AppDataContext'
import './BirthdayBanner.css'

export default function BirthdayBanner() {
  const { hoje, alunosIndividuais, alunosTurma } = useAppData()
  const navigate = useNavigate()

  const aniversariantes = useMemo(() => {
    const todos = [...alunosIndividuais, ...alunosTurma]
    return todos
      .map((aluno) => {
        const info = aniversarioInfo(aluno.nascimento, hoje)
        return info ? { aluno, info } : null
      })
      .filter(Boolean)
      .sort((a, b) => a.info.data - b.info.data)
  }, [alunosIndividuais, alunosTurma, hoje])

  if (aniversariantes.length === 0) return null

  return (
    <div className="birthday-banner fade-in-up">
      <div className="birthday-banner-icon">
        <PartyPopper size={20} strokeWidth={1.7} />
      </div>
      <div className="birthday-banner-content">
        <p className="birthday-banner-title">🎉 Aniversários desta semana</p>
        <div className="birthday-banner-list">
          {aniversariantes.map(({ aluno, info }) => (
            <button key={aluno.id} className="birthday-chip" onClick={() => navigate(`/dashboard/alunos/${aluno.id}`)}>
              🎂 {aluno.nome}
              <span>
                {info.hoje ? 'hoje!' : format(info.data, "EEEE (dd/MM)", { locale: ptBR })} · completa {info.idadeNova} anos
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
