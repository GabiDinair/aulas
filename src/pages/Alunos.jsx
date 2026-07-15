import { useState } from 'react'
import { Plus, UserRound, Users2 } from 'lucide-react'
import { useAppData } from '../context/AppDataContext'
import AlunoCard from '../components/AlunoCard'
import NovoAlunoModal from '../components/NovoAlunoModal'
import './Alunos.css'

export default function Alunos() {
  const { turmas, alunosIndividuais, alunosTurma } = useAppData()
  const [modalAberto, setModalAberto] = useState(false)

  return (
    <div className="alunos-page">
      <div className="page-heading page-heading-row">
        <div>
          <h2>Meus alunos</h2>
          <p>{alunosIndividuais.length + alunosTurma.length} alunos ao todo</p>
        </div>
        <button className="btn-adicionar" onClick={() => setModalAberto(true)}>
          <Plus size={16} strokeWidth={2} /> Novo aluno
        </button>
      </div>

      <section className="alunos-secao">
        <div className="alunos-secao-titulo">
          <UserRound size={18} strokeWidth={1.7} />
          <h3>Alunos individuais</h3>
          <span className="contagem">{alunosIndividuais.length}</span>
        </div>
        <div className="alunos-grid">
          {alunosIndividuais.map((aluno) => (
            <AlunoCard
              key={aluno.id}
              aluno={aluno}
              rodape={`Aula particular · ${aluno.local}`}
            />
          ))}
        </div>
      </section>

      <section className="alunos-secao">
        <div className="alunos-secao-titulo">
          <Users2 size={18} strokeWidth={1.7} />
          <h3>Alunos de turmas</h3>
          <span className="contagem">{alunosTurma.length}</span>
        </div>

        {turmas.map((turma) => {
          const alunos = alunosTurma.filter((a) => a.turmaId === turma.id)
          if (alunos.length === 0) return null
          return (
            <div key={turma.id} className="turma-subgrupo">
              <p className="turma-subgrupo-titulo">{turma.nome}</p>
              <div className="alunos-grid">
                {alunos.map((aluno) => (
                  <AlunoCard key={aluno.id} aluno={aluno} rodape={turma.nome} />
                ))}
              </div>
            </div>
          )
        })}
      </section>

      {modalAberto && <NovoAlunoModal onClose={() => setModalAberto(false)} />}
    </div>
  )
}
