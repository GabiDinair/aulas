import { useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CalendarX2, CheckCircle2, Clock, MapPin, Pencil, Plus, RotateCcw, Users2, XCircle } from 'lucide-react'
import { useAppData } from '../context/AppDataContext'
import { MOTIVOS_CANCELAMENTO, alunosDaTurma } from '../data/helpers'
import AdicionarAulaModal from './AdicionarAulaModal'
import './DayPanel.css'

const STATUS_LABEL = {
  confirmada: 'Confirmada',
  pendente: 'Pendente',
  cancelada: 'Cancelada',
  concluida: 'Concluída',
}

const MOTIVO_LABEL = Object.fromEntries(MOTIVOS_CANCELAMENTO.map((m) => [m.id, m.label]))

function EscopoRadio({ escopo, setEscopo }) {
  return (
    <div className="aula-escopo">
      <label>
        <input type="radio" checked={escopo === 'unico'} onChange={() => setEscopo('unico')} />
        Somente esta aula
      </label>
      <label>
        <input type="radio" checked={escopo === 'futuras'} onChange={() => setEscopo('futuras')} />
        Esta e as próximas aulas
      </label>
    </div>
  )
}

function AulaCard({ aula }) {
  const { confirmarAula, cancelarAula, reagendarAula, editarAula, salvarAnotacoes, salvarFaltasTurma, alunosTurma } = useAppData()
  const [anotacoes, setAnotacoes] = useState(aula.anotacoes)
  const [salvo, setSalvo] = useState(true)
  const [escolhendoMotivo, setEscolhendoMotivo] = useState(false)
  const [escopoCancelar, setEscopoCancelar] = useState('unico')
  const [remarcando, setRemarcando] = useState(false)
  const [novaData, setNovaData] = useState(aula.date)
  const [novoHorario, setNovoHorario] = useState(aula.horario)
  const [editando, setEditando] = useState(false)
  const [dataEdicao, setDataEdicao] = useState(aula.date)
  const [horarioEdicao, setHorarioEdicao] = useState(aula.horario)
  const [duracaoEdicao, setDuracaoEdicao] = useState(aula.duracao)
  const [escopoEdicao, setEscopoEdicao] = useState('unico')
  const [erroEdicao, setErroEdicao] = useState('')

  function handleSalvar() {
    salvarAnotacoes(aula.id, anotacoes)
    setSalvo(true)
  }

  function handleCancelar(motivo) {
    cancelarAula(aula.id, motivo, escopoCancelar)
    setEscolhendoMotivo(false)
  }

  function handleConfirmarReagendamento() {
    if (!novaData) return
    reagendarAula(aula.id, novaData, novoHorario)
    setRemarcando(false)
  }

  async function handleConfirmarEdicao() {
    setErroEdicao('')
    try {
      await editarAula(aula.id, { date: dataEdicao, horario: horarioEdicao, duracao: duracaoEdicao, escopo: escopoEdicao })
      setEditando(false)
    } catch (err) {
      setErroEdicao(err.message)
    }
  }

  const turmaAlunos = aula.tipo === 'turma' ? alunosDaTurma(alunosTurma, aula.turmaId) : []

  function toggleFalta(alunoId) {
    const atual = aula.faltasAlunos ?? []
    const novo = atual.includes(alunoId) ? atual.filter((id) => id !== alunoId) : [...atual, alunoId]
    salvarFaltasTurma(aula.id, novo)
  }

  const nenhumaAcaoAberta = !escolhendoMotivo && !remarcando && !editando

  return (
    <div className={`aula-card status-${aula.status}`}>
      <div className="aula-card-header">
        <div className="aula-horario">
          <Clock size={15} strokeWidth={1.7} />
          <span>{aula.horario}</span>
          <span className="aula-duracao">· {aula.duracao} min</span>
        </div>
        <span className={`badge badge-${aula.status}`}>{STATUS_LABEL[aula.status]}</span>
      </div>

      <h3 className="aula-titulo">{aula.titulo}</h3>

      <div className="aula-meta">
        <span><Users2 size={14} strokeWidth={1.7} /> {aula.qtdAlunos} aluno{aula.qtdAlunos === 1 ? '' : 's'}</span>
        {aula.local && <span><MapPin size={14} strokeWidth={1.7} /> {aula.local}</span>}
      </div>

      {aula.remarcadaDe && aula.status !== 'cancelada' && (
        <p className="aula-remarcada-nota">Remarcada de {format(new Date(aula.remarcadaDe + 'T00:00:00'), 'dd/MM')}</p>
      )}

      {aula.status === 'cancelada' ? (
        <div className="aula-cancelada-aviso">
          <CalendarX2 size={15} strokeWidth={1.7} />
          <span>{MOTIVO_LABEL[aula.motivoCancelamento] ?? 'Aula cancelada.'}</span>
        </div>
      ) : (
        <label className="aula-anotacoes">
          <span>O que foi trabalhado</span>
          <textarea
            rows={2}
            placeholder="Ex: escalas, repertório, técnica de arco..."
            value={anotacoes}
            onChange={(e) => {
              setAnotacoes(e.target.value)
              setSalvo(false)
            }}
          />
        </label>
      )}

      {aula.tipo === 'turma' && aula.status !== 'cancelada' && turmaAlunos.length > 0 && (
        <div className="aula-chamada">
          <span>Chamada — quem faltou?</span>
          <div className="aula-chamada-lista">
            {turmaAlunos.map((aluno) => {
              const faltou = aula.faltasAlunos?.includes(aluno.id)
              return (
                <button
                  key={aluno.id}
                  type="button"
                  className={'chip-chamada' + (faltou ? ' faltou' : '')}
                  onClick={() => toggleFalta(aluno.id)}
                >
                  {aluno.nome.split(' ')[0]}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {editando && (
        <div className="aula-remarcar-picker">
          <p>Editar dia, horário e duração</p>
          <div className="aula-remarcar-campos">
            <input type="date" value={dataEdicao} onChange={(e) => setDataEdicao(e.target.value)} />
            <input type="time" value={horarioEdicao} onChange={(e) => setHorarioEdicao(e.target.value)} />
            <input
              type="number"
              min="15"
              step="5"
              value={duracaoEdicao}
              onChange={(e) => setDuracaoEdicao(e.target.value)}
            />
          </div>
          {dataEdicao === aula.date && <EscopoRadio escopo={escopoEdicao} setEscopo={setEscopoEdicao} />}
          {dataEdicao !== aula.date && (
            <p className="aula-edicao-aviso">Mudando o dia, a alteração vale só para esta aula.</p>
          )}
          {erroEdicao && <p className="login-erro">{erroEdicao}</p>}
          <div className="aula-remarcar-actions">
            <button type="button" className="btn-mini btn-confirmar" onClick={handleConfirmarEdicao}>
              Salvar
            </button>
            <button type="button" className="link-voltar" onClick={() => setEditando(false)}>
              Voltar
            </button>
          </div>
        </div>
      )}

      {escolhendoMotivo && (
        <div className="aula-motivo-picker">
          <p>Aplicar a:</p>
          <EscopoRadio escopo={escopoCancelar} setEscopo={setEscopoCancelar} />
          <p>Qual foi o motivo do cancelamento?</p>
          {MOTIVOS_CANCELAMENTO.map((m) => (
            <button key={m.id} type="button" className="btn-motivo" onClick={() => handleCancelar(m.id)}>
              {m.label}
            </button>
          ))}
          <button type="button" className="link-voltar" onClick={() => setEscolhendoMotivo(false)}>
            Voltar
          </button>
        </div>
      )}

      {remarcando && (
        <div className="aula-remarcar-picker">
          <p>Escolha o novo dia e horário</p>
          <div className="aula-remarcar-campos">
            <input type="date" value={novaData} onChange={(e) => setNovaData(e.target.value)} />
            <input type="time" value={novoHorario} onChange={(e) => setNovoHorario(e.target.value)} />
          </div>
          <div className="aula-remarcar-actions">
            <button type="button" className="btn-mini btn-confirmar" onClick={handleConfirmarReagendamento}>
              Confirmar novo dia
            </button>
            <button type="button" className="link-voltar" onClick={() => setRemarcando(false)}>
              Voltar
            </button>
          </div>
        </div>
      )}

      {nenhumaAcaoAberta && (
        <div className="aula-actions">
          {aula.status === 'pendente' && (
            <button className="btn-mini btn-confirmar" onClick={() => confirmarAula(aula.id)}>
              <CheckCircle2 size={14} strokeWidth={1.8} /> Confirmar aula
            </button>
          )}
          {(aula.status === 'pendente' || aula.status === 'confirmada') && (
            <button className="btn-mini" onClick={() => setEditando(true)}>
              <Pencil size={13} strokeWidth={1.8} /> Editar
            </button>
          )}
          {(aula.status === 'pendente' || aula.status === 'confirmada') && (
            <button className="btn-mini btn-cancelar" onClick={() => setEscolhendoMotivo(true)}>
              <XCircle size={14} strokeWidth={1.8} /> Cancelar
            </button>
          )}
          {aula.status === 'cancelada' && (
            <button className="btn-mini btn-reagendar" onClick={() => setRemarcando(true)}>
              <RotateCcw size={14} strokeWidth={1.8} /> Reagendar
            </button>
          )}
          {aula.status !== 'cancelada' && (
            <button className="btn-mini btn-salvar" onClick={handleSalvar} disabled={salvo}>
              {salvo ? 'Salvo' : 'Salvar anotações'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default function DayPanel({ dataStr, aulas }) {
  const data = new Date(dataStr + 'T00:00:00')
  const [modalAberto, setModalAberto] = useState(false)

  return (
    <aside className="day-panel fade-in">
      <div className="day-panel-header">
        <div className="day-panel-header-topo">
          <div>
            <p className="day-panel-eyebrow">{format(data, 'EEEE', { locale: ptBR })}</p>
            <h2 className="day-panel-date">{format(data, "d 'de' MMMM", { locale: ptBR })}</h2>
          </div>
          <button className="icon-btn" onClick={() => setModalAberto(true)} aria-label="Adicionar aula">
            <Plus size={17} strokeWidth={2} />
          </button>
        </div>
      </div>

      <div className="day-panel-list">
        {aulas.length === 0 && (
          <div className="day-panel-empty">
            <p>Nenhuma aula agendada para este dia.</p>
          </div>
        )}
        {aulas.map((aula) => (
          <AulaCard key={aula.id} aula={aula} />
        ))}
      </div>

      {modalAberto && <AdicionarAulaModal dataStr={dataStr} onClose={() => setModalAberto(false)} />}
    </aside>
  )
}
