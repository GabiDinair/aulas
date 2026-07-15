import { useState } from 'react'
import Modal from './Modal'
import CampoMoeda from './CampoMoeda'
import { useAppData } from '../context/AppDataContext'
import { CORES_TURMA_PRESET, DIAS_SEMANA } from '../data/helpers'

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
    mensalidade: 0,
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

        <button type="submit" className="modal-submit">Criar turma</button>
      </form>
    </Modal>
  )
}
