import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Clock, MapPin, Music2, Plus, Users2 } from 'lucide-react'
import { useAppData } from '../context/AppDataContext'
import { alunosDaTurma } from '../data/helpers'
import NovaTurmaModal from '../components/NovaTurmaModal'
import './Turmas.css'

export default function Turmas() {
  const navigate = useNavigate()
  const { turmas, alunosTurma } = useAppData()
  const [modalAberto, setModalAberto] = useState(false)

  return (
    <div className="turmas-page">
      <div className="page-heading page-heading-row">
        <div>
          <h2>Minhas turmas</h2>
          <p>{turmas.length} turmas ativas neste semestre</p>
        </div>
        <button className="btn-adicionar" onClick={() => setModalAberto(true)}>
          <Plus size={16} strokeWidth={2} /> Nova turma
        </button>
      </div>

      <div className="turmas-grid">
        {turmas.map((turma) => {
          const alunos = alunosDaTurma(alunosTurma, turma.id)
          return (
            <button
              key={turma.id}
              className={`turma-card cor-${turma.cor}`}
              onClick={() => navigate(`/dashboard/turmas/${turma.id}`)}
            >
              <div className="turma-card-icon">
                <Music2 size={20} strokeWidth={1.6} />
              </div>
              <h3>{turma.nome}</h3>
              <div className="turma-card-info">
                <span><Clock size={14} strokeWidth={1.7} /> {turma.diaSemanaNome}, {turma.horario} · {turma.frequencia === 'quinzenal' ? 'quinzenal' : 'semanal'}</span>
                <span><MapPin size={14} strokeWidth={1.7} /> {turma.local}</span>
                <span><Users2 size={14} strokeWidth={1.7} /> {alunos.length} alunos</span>
              </div>
              <div className="turma-card-avatars">
                {alunos.slice(0, 5).map((a) => (
                  <span key={a.id} className="mini-avatar">{a.nome[0]}</span>
                ))}
                {alunos.length > 5 && <span className="mini-avatar mini-avatar-more">+{alunos.length - 5}</span>}
              </div>
            </button>
          )
        })}
      </div>

      {modalAberto && <NovaTurmaModal onClose={() => setModalAberto(false)} />}
    </div>
  )
}
