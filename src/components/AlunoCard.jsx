import { useNavigate } from 'react-router-dom'
import { differenceInYears, format } from 'date-fns'
import { aniversarioInfo, avatarDe, calcularFrequenciaAluno, LIMIAR_ATENCAO_FREQUENCIA, MIN_AULAS_PARA_FREQUENCIA } from '../data/helpers'
import { useAppData } from '../context/AppDataContext'
import './AlunoCard.css'

export default function AlunoCard({ aluno, rodape, destaque, atencao }) {
  const navigate = useNavigate()
  const { hoje, aulas } = useAppData()
  const avatar = avatarDe(aluno.id, aluno.nome)
  const idade = differenceInYears(hoje, new Date(aluno.nascimento))
  const aniversario = aniversarioInfo(aluno.nascimento, hoje)
  const frequencia = calcularFrequenciaAluno(aulas, aluno)
  const temHistorico = frequencia.total >= MIN_AULAS_PARA_FREQUENCIA
  const frequenciaBaixa = temHistorico && frequencia.frequenciaPct < LIMIAR_ATENCAO_FREQUENCIA

  return (
    <div
      className={'aluno-card' + (aniversario ? ' aniversario' : '')}
      onClick={() => navigate(`/dashboard/alunos/${aluno.id}`)}
      role="button"
      tabIndex={0}
    >
      {aniversario && (
        <div className="aluno-card-badge">
          {aniversario.hoje ? '🎂 Hoje!' : '🎉 Semana de aniversário'}
        </div>
      )}
      {!aniversario && destaque && <div className="aluno-card-badge destaque">🏆 Destaque da turma</div>}
      {!aniversario && !destaque && (atencao || frequenciaBaixa) && (
        <div className="aluno-card-badge atencao">⚠️ Muitas faltas</div>
      )}

      <div className="aluno-card-top">
        <div className="aluno-avatar" style={{ background: avatar.bg, color: avatar.text }}>
          {avatar.iniciais}
        </div>
        <div>
          <h3 className="aluno-nome">{aluno.nome}</h3>
          <p className="aluno-nascimento">
            {format(new Date(aluno.nascimento), 'dd/MM/yyyy')} · {idade} anos
          </p>
        </div>
      </div>

      <div className="aluno-nivel">
        <span className={`nivel-tag nivel-${aluno.nivel.toLowerCase()}`}>{aluno.nivel}</span>
      </div>

      <div className="aluno-progresso">
        <div className="aluno-progresso-label">
          <span>Progresso musical</span>
          <span>{aluno.progresso}%</span>
        </div>
        <div className="progresso-track">
          <div className="progresso-fill" style={{ width: `${aluno.progresso}%` }} />
        </div>
      </div>

      <div className="aluno-frequencia">
        <div className="aluno-progresso-label">
          <span>Frequência</span>
          <span>{temHistorico ? `${frequencia.frequenciaPct}%` : '—'}</span>
        </div>
        {temHistorico ? (
          <div className="progresso-track">
            <div
              className={'frequencia-fill' + (frequenciaBaixa ? ' baixa' : '')}
              style={{ width: `${frequencia.frequenciaPct}%` }}
            />
          </div>
        ) : (
          <p className="aluno-frequencia-vazia">Ainda sem aulas suficientes registradas</p>
        )}
      </div>

      {rodape && <div className="aluno-card-rodape">{rodape}</div>}
    </div>
  )
}
