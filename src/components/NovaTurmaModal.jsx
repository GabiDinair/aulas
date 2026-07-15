import { useState } from 'react'
import Modal from './Modal'
import { useAppData } from '../context/AppDataContext'
import { DIAS_SEMANA } from '../data/helpers'

const CORES = [
  { id: 'sand', valor: 'var(--sand)' },
  { id: 'rose', valor: 'var(--rose)' },
  { id: 'sage', valor: 'var(--sage)' },
  { id: 'gold', valor: 'var(--gold)' },
]

export default function NovaTurmaModal({ onClose }) {
  const { criarTurma } = useAppData()
  const [form, setForm] = useState({
    nome: '',
    diaSemana: '2',
    horario: '16:00',
    duracao: '45',
    local: '',
    frequencia: 'semanal',
    cor: 'sand',
    mensalidade: '',
  })

  function atualizar(campo, valor) {
    setForm((prev) => ({ ...prev, [campo]: valor }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.nome.trim() || !form.local.trim()) return
    criarTurma({ ...form, quinzenaOffset: 0, mensalidade: Number(form.mensalidade) || 0 })
    onClose()
  }

  return (
    <Modal titulo="Criar nova turma" onClose={onClose}>
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
          <span>Mensalidade por aluno (R$)</span>
          <input
            type="number"
            min="0"
            step="10"
            placeholder="Ex: 220"
            value={form.mensalidade}
            onChange={(e) => atualizar('mensalidade', e.target.value)}
          />
        </label>

        <label className="form-field">
          <span>Cor de identificação</span>
          <div className="color-options">
            {CORES.map((c) => (
              <button
                type="button"
                key={c.id}
                className={'color-dot' + (form.cor === c.id ? ' selected' : '')}
                style={{ background: c.valor }}
                onClick={() => atualizar('cor', c.id)}
                aria-label={c.id}
              />
            ))}
          </div>
        </label>

        <button type="submit" className="modal-submit">Criar turma</button>
      </form>
    </Modal>
  )
}
