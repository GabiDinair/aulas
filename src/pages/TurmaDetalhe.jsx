import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Clock, MapPin, Pencil, Plus, Trophy, Users2 } from 'lucide-react'
import { useAppData } from '../context/AppDataContext'
import { alunosDaTurma, calcularFrequenciaAluno, corDaTurma, LIMIAR_ATENCAO_FREQUENCIA, MIN_AULAS_PARA_FREQUENCIA } from '../data/helpers'
import AlunoCard from '../components/AlunoCard'
import NovoAlunoModal from '../components/NovoAlunoModal'
import NovaTurmaModal from '../components/NovaTurmaModal'
import './TurmaDetalhe.css'

export default function TurmaDetalhe() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { turmas, alunosTurma, aulas } = useAppData()
  const [modalAberto, setModalAberto] = useState(false)
  const [modalEditarAberto, setModalEditarAberto] = useState(false)
  const turma = turmas.find((t) => t.id === id)
  const alunos = alunosDaTurma(alunosTurma, id)

  const { destaqueId, atencaoIds } = useMemo(() => {
    const comHistorico = alunos
      .map((aluno) => ({ aluno, freq: calcularFrequenciaAluno(aulas, aluno) }))
      .filter((x) => x.freq.total >= MIN_AULAS_PARA_FREQUENCIA)

    const destaque = comHistorico
      .slice()
      .sort((a, b) => b.freq.frequenciaPct - a.freq.frequenciaPct || b.aluno.progresso - a.aluno.progresso)[0]

    const atencao = comHistorico.filter((x) => x.freq.frequenciaPct < LIMIAR_ATENCAO_FREQUENCIA)

    return {
      destaqueId: destaque?.aluno.id ?? null,
      atencaoIds: new Set(atencao.map((x) => x.aluno.id)),
    }
  }, [alunos, aulas])

  if (!turma) {
    return (
      <div className="turma-detalhe-page">
        <p>Turma não encontrada.</p>
      </div>
    )
  }

  return (
    <div className="turma-detalhe-page">
      <button className="voltar-btn" onClick={() => navigate('/dashboard/turmas')}>
        <ArrowLeft size={16} strokeWidth={1.8} /> Voltar para turmas
      </button>

      <div className="turma-hero" style={{ '--turma-cor': corDaTurma(turma.cor) }}>
        <div className="turma-hero-topo">
          <h2>{turma.nome}</h2>
          <button className="icon-btn" onClick={() => setModalEditarAberto(true)} aria-label="Editar turma">
            <Pencil size={15} strokeWidth={1.8} />
          </button>
        </div>
        <div className="turma-hero-info">
          <span><Clock size={15} strokeWidth={1.7} /> {turma.diaSemanaNome}, {turma.horario} ({turma.duracao} min) · {turma.frequencia === 'quinzenal' ? 'quinzenal' : 'semanal'}</span>
          <span><MapPin size={15} strokeWidth={1.7} /> {turma.local}</span>
          <span><Users2 size={15} strokeWidth={1.7} /> {alunos.length} alunos</span>
        </div>
        {destaqueId && (
          <div className="turma-destaque-nota">
            <Trophy size={14} strokeWidth={1.8} />
            <span>Aluno destaque: {alunos.find((a) => a.id === destaqueId)?.nome} — menos faltas da turma</span>
          </div>
        )}
      </div>

      <div className="turma-alunos-heading">
        <h3 className="secao-titulo">Alunos da turma</h3>
        <button className="btn-adicionar" onClick={() => setModalAberto(true)}>
          <Plus size={16} strokeWidth={2} /> Adicionar aluno
        </button>
      </div>
      <div className="alunos-grid">
        {alunos.map((aluno) => (
          <AlunoCard
            key={aluno.id}
            aluno={aluno}
            destaque={aluno.id === destaqueId}
            atencao={atencaoIds.has(aluno.id)}
          />
        ))}
      </div>

      {modalAberto && <NovoAlunoModal onClose={() => setModalAberto(false)} turmaIdPadrao={turma.id} />}
      {modalEditarAberto && (
        <NovaTurmaModal
          turmaExistente={turma}
          onClose={() => setModalEditarAberto(false)}
          onExcluida={() => navigate('/dashboard/turmas')}
        />
      )}
    </div>
  )
}
