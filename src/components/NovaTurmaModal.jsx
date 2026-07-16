import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import Modal from './Modal'
import CampoMoeda from './CampoMoeda'
import { useAppData } from '../context/AppDataContext'
import { CORES_TURMA_PRESET, DIAS_SEMANA } from '../data/helpers'

export default function NovaTurmaModal({ onClose, turmaExistente, onExcluida }) {
  const { criarTurma, editarTurma, removerTurma } = useAppData()
  const editando = Boolean(turmaExistente)
  const [form, setForm] = useState(() =>
    turmaExistente
      ? {
          nome: turmaExistente.nome,
          diaSemana: String(turmaExistente.diaSemana),
          horario: turmaExistente.horario,
          duracao: String(turmaExistente.duracao),
          local: turmaExistente.local,
          frequencia: turmaExistente.frequencia,
          cor: turmaExistente.cor,
          mensalidade: turmaExistente.mensalidade,
        }
      : {
          nome: '',
          diaSemana: '2',
          horario: '16:00',
          duracao: '45',
          local: '',
          frequencia: 'semanal',
          cor: 'sand',
          mensalidade: 0,
        }
  )
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false)

  function atualizar(campo, valor) {
    setForm((prev) => ({ ...prev, [campo]: valor }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.nome.trim() || !form.local.trim()) return
    setErro('')
    setEnviando(true)
    try {
      const dados = { ...form, quinzenaOffset: 0, mensalidade: Number(form.mensalidade) || 0 }
      if (editando) {
        await editarTurma(turmaExistente.id, dados)
      } else {
        await criarTurma(dados)
      }
      onClose()
    } catch (err) {
      setErro(err.message)
    } finally {
      setEnviando(false)
    }
  }

  async function handleExcluir() {
    setErro('')
    setEnviando(true)
    try {
      await removerTurma(turmaExistente.id)
      onClose()
      onExcluida?.()
    } catch (err) {
      setErro(err.message)
      setEnviando(false)
    }
  }

  return (
    <Modal titulo={editando ? 'Editar turma' : 'Criar nova turma'} onClose={onClose}>
      <form className="form-grid" onSubmit={handleSubmit}>
        <label className="form-field">
          <span>Nome da turma</span>
          <input
            type="text"
            placeholder="Ex: Turma Suzuki Avançado"
            value={form.nome}
            onChange={(e) => atualizar('nome', e.target.value)}
            required
          />
        </label>

        <div className="form-row">
          <label className="form-field">
            <span>Dia da semana</span>
            <select value={form.diaSemana} onChange={(e) => atualizar('diaSemana', e.target.value)}>
              {DIAS_SEMANA.map((dia, idx) => (
                <option key={dia} value={idx}>{dia}</option>
              ))}
            </select>
          </label>
          <label className="form-field">
            <span>Horário</span>
            <input type="time" value={form.horario} onChange={(e) => atualizar('horario', e.target.value)} required />
          </label>
        </div>

        <div className="form-row">
          <label className="form-field">
            <span>Duração (min)</span>
            <input
              type="number"
              min="15"
              step="5"
              value={form.duracao}
              onChange={(e) => atualizar('duracao', e.target.value)}
              required
            />
          </label>
          <label className="form-field">
            <span>Local</span>
            <input
              type="text"
              placeholder="Ex: Estúdio Central · Sala 2"
              value={form.local}
              onChange={(e) => atualizar('local', e.target.value)}
              required
            />
          </label>
        </div>

        <label className="form-field">
          <span>Frequência das aulas</span>
          <div className="form-toggle">
            <button
              type="button"
              className={form.frequencia === 'semanal' ? 'active' : ''}
              onClick={() => atualizar('frequencia', 'semanal')}
            >
              Semanal (1x/semana)
            </button>
            <button
              type="button"
              className={form.frequencia === 'quinzenal' ? 'active' : ''}
              onClick={() => atualizar('frequencia', 'quinzenal')}
            >
              Quinzenal (2x/mês)
            </button>
          </div>
        </label>

        <label className="form-field">
          <span>Mensalidade por aluno</span>
          <CampoMoeda value={form.mensalidade} onChange={(v) => atualizar('mensalidade', v)} />
        </label>

        <label className="form-field">
          <span>Cor de identificação</span>
          <div className="color-options">
            {Object.entries(CORES_TURMA_PRESET).map(([id, hex]) => (
              <button
                type="button"
                key={id}
                className={'color-dot' + (form.cor === id ? ' selected' : '')}
                style={{ background: hex }}
                onClick={() => atualizar('cor', id)}
                aria-label={id}
              />
            ))}
            <label className="color-dot color-dot-custom" style={{ background: form.cor.startsWith('#') ? form.cor : undefined }}>
              <input
                type="color"
                value={form.cor.startsWith('#') ? form.cor : '#c9a66b'}
                onChange={(e) => atualizar('cor', e.target.value)}
              />
              <span>+</span>
            </label>
          </div>
        </label>

        {editando && (mudouPadrao(form, turmaExistente)) && (
          <p className="form-hint">
            Mudar dia/frequência vai reorganizar as próximas aulas ainda não concluídas dessa turma.
          </p>
        )}

        {erro && <p className="login-erro">{erro}</p>}

        <button type="submit" className="modal-submit" disabled={enviando}>
          {enviando ? 'Salvando...' : editando ? 'Salvar alterações' : 'Criar turma'}
        </button>

        {editando && !confirmandoExclusao && (
          <button type="button" className="btn-excluir" onClick={() => setConfirmandoExclusao(true)}>
            <Trash2 size={14} strokeWidth={1.8} /> Excluir turma
          </button>
        )}

        {editando && confirmandoExclusao && (
          <div className="confirmar-exclusao">
            <p>Tem certeza? Isso só funciona se a turma não tiver mais alunos vinculados.</p>
            <div className="confirmar-exclusao-actions">
              <button type="button" className="btn-excluir-confirmar" onClick={handleExcluir} disabled={enviando}>
                Sim, excluir
              </button>
              <button type="button" className="link-voltar" onClick={() => setConfirmandoExclusao(false)}>
                Cancelar
              </button>
            </div>
          </div>
        )}
      </form>
    </Modal>
  )
}

function mudouPadrao(form, turmaExistente) {
  return (
    Number(form.diaSemana) !== turmaExistente.diaSemana ||
    form.frequencia !== turmaExistente.frequencia
  )
}
