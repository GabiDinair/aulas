import { useState } from 'react'
import Modal from './Modal'
import CampoMoeda from './CampoMoeda'
import { useAppData } from '../context/AppDataContext'
import { DIAS_SEMANA, formatarMoeda } from '../data/helpers'

const NIVEIS = ['Iniciante', 'Intermediário', 'Avançado']

export default function NovoAlunoModal({ onClose, turmaIdPadrao }) {
  const { turmas, criarAlunoIndividual, criarAlunoTurma } = useAppData()
  const [modo, setModo] = useState(turmaIdPadrao ? 'turma' : 'individual')
  const [form, setForm] = useState({
    nome: '',
    nascimento: '',
    nivel: 'Iniciante',
    inicioViolino: '',
    telefone: '',
    diaSemana: '2',
    horario: '15:00',
    local: '',
    frequencia: 'semanal',
    turmaId: turmaIdPadrao ?? turmas[0]?.id ?? '',
    mensalidade: 0,
  })

  function atualizar(campo, valor) {
    setForm((prev) => ({ ...prev, [campo]: valor }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.nome.trim() || !form.nascimento) return

    if (modo === 'individual') {
      criarAlunoIndividual({
        nome: form.nome,
        nascimento: form.nascimento,
        nivel: form.nivel,
        inicioViolino: form.inicioViolino || undefined,
        telefone: form.telefone || undefined,
        diaSemana: form.diaSemana,
        horario: form.horario,
        local: form.local || 'A definir',
        frequencia: form.frequencia,
        quinzenaOffset: 0,
        mensalidade: Number(form.mensalidade) || 0,
      })
    } else {
      if (!form.turmaId) return
      criarAlunoTurma(form.turmaId, {
        nome: form.nome,
        nascimento: form.nascimento,
        nivel: form.nivel,
        inicioViolino: form.inicioViolino || undefined,
        telefone: form.telefone || undefined,
      })
    }
    onClose()
  }

  return (
    <Modal titulo="Adicionar aluno" onClose={onClose}>
      <form className="form-grid" onSubmit={handleSubmit}>
        {!turmaIdPadrao && (
          <div className="form-toggle">
            <button type="button" className={modo === 'individual' ? 'active' : ''} onClick={() => setModo('individual')}>
              Aula individual
            </button>
            <button type="button" className={modo === 'turma' ? 'active' : ''} onClick={() => setModo('turma')}>
              Aluno de turma
            </button>
          </div>
        )}

        <label className="form-field">
          <span>Nome completo</span>
          <input type="text" value={form.nome} onChange={(e) => atualizar('nome', e.target.value)} required />
        </label>

        <div className="form-row">
          <label className="form-field">
            <span>Data de nascimento</span>
            <input type="date" value={form.nascimento} onChange={(e) => atualizar('nascimento', e.target.value)} required />
          </label>
          <label className="form-field">
            <span>Nível</span>
            <select value={form.nivel} onChange={(e) => atualizar('nivel', e.target.value)}>
              {NIVEIS.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </label>
        </div>

        <label className="form-field">
          <span>Início no violino (se já tocava antes)</span>
          <input type="date" value={form.inicioViolino} onChange={(e) => atualizar('inicioViolino', e.target.value)} />
        </label>

        <label className="form-field">
          <span>Telefone (WhatsApp)</span>
          <input
            type="tel"
            placeholder="(11) 98765-4321"
            value={form.telefone}
            onChange={(e) => atualizar('telefone', e.target.value)}
          />
        </label>

        {modo === 'turma' ? (
          <label className="form-field">
            <span>Turma</span>
            <select value={form.turmaId} onChange={(e) => atualizar('turmaId', e.target.value)}>
              {turmas.map((t) => (
                <option key={t.id} value={t.id}>{t.nome}</option>
              ))}
            </select>
            {form.turmaId && (
              <p className="form-hint">
                Mensalidade da turma: {formatarMoeda(turmas.find((t) => t.id === form.turmaId)?.mensalidade)}
              </p>
            )}
          </label>
        ) : (
          <>
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
            <label className="form-field">
              <span>Local</span>
              <input
                type="text"
                placeholder="Ex: Estúdio Central · Sala 3"
                value={form.local}
                onChange={(e) => atualizar('local', e.target.value)}
              />
            </label>
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
              <span>Mensalidade</span>
              <CampoMoeda value={form.mensalidade} onChange={(v) => atualizar('mensalidade', v)} />
            </label>
          </>
        )}

        <button type="submit" className="modal-submit">Adicionar aluno</button>
      </form>
    </Modal>
  )
}
