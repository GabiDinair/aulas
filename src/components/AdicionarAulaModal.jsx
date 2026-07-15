import { useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Modal from './Modal'
import { useAppData } from '../context/AppDataContext'

export default function AdicionarAulaModal({ dataStr, onClose }) {
  const { turmas, alunosIndividuais, criarAulaAvulsa } = useAppData()
  const [tipo, setTipo] = useState(alunosIndividuais.length > 0 ? 'individual' : 'turma')
  const [turmaId, setTurmaId] = useState(turmas[0]?.id ?? '')
  const [alunoId, setAlunoId] = useState(alunosIndividuais[0]?.id ?? '')
  const [horario, setHorario] = useState('15:00')
  const [duracao, setDuracao] = useState('45')
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)

  const dataFormatada = format(new Date(dataStr + 'T00:00:00'), "dd 'de' MMMM", { locale: ptBR })

  async function handleSubmit(e) {
    e.preventDefault()
    setErro('')
    if (tipo === 'turma' && !turmaId) return setErro('Escolha uma turma.')
    if (tipo === 'individual' && !alunoId) return setErro('Escolha um aluno.')

    setEnviando(true)
    try {
      await criarAulaAvulsa({
        tipo,
        turmaId: tipo === 'turma' ? turmaId : undefined,
        alunoId: tipo === 'individual' ? alunoId : undefined,
        date: dataStr,
        horario,
        duracao,
      })
      onClose()
    } catch (err) {
      setErro(err.message)
    } finally {
      setEnviando(false)
    }
  }

  const semOpcoes = turmas.length === 0 && alunosIndividuais.length === 0

  return (
    <Modal titulo={`Adicionar aula — ${dataFormatada}`} onClose={onClose}>
      {semOpcoes ? (
        <p className="login-hint">Cadastre uma turma ou um aluno antes de adicionar uma aula avulsa.</p>
      ) : (
        <form className="form-grid" onSubmit={handleSubmit}>
          <div className="form-toggle">
            <button
              type="button"
              className={tipo === 'individual' ? 'active' : ''}
              onClick={() => setTipo('individual')}
              disabled={alunosIndividuais.length === 0}
            >
              Aluno individual
            </button>
            <button
              type="button"
              className={tipo === 'turma' ? 'active' : ''}
              onClick={() => setTipo('turma')}
              disabled={turmas.length === 0}
            >
              Turma
            </button>
          </div>

          {tipo === 'turma' ? (
            <label className="form-field">
              <span>Turma</span>
              <select value={turmaId} onChange={(e) => setTurmaId(e.target.value)}>
                {turmas.map((t) => (
                  <option key={t.id} value={t.id}>{t.nome}</option>
                ))}
              </select>
            </label>
          ) : (
            <label className="form-field">
              <span>Aluno</span>
              <select value={alunoId} onChange={(e) => setAlunoId(e.target.value)}>
                {alunosIndividuais.map((a) => (
                  <option key={a.id} value={a.id}>{a.nome}</option>
                ))}
              </select>
            </label>
          )}

          <div className="form-row">
            <label className="form-field">
              <span>Horário</span>
              <input type="time" value={horario} onChange={(e) => setHorario(e.target.value)} required />
            </label>
            <label className="form-field">
              <span>Duração (min)</span>
              <input
                type="number"
                min="15"
                step="5"
                value={duracao}
                onChange={(e) => setDuracao(e.target.value)}
                required
              />
            </label>
          </div>

          {erro && <p className="login-erro">{erro}</p>}

          <button type="submit" className="modal-submit" disabled={enviando}>
            {enviando ? 'Adicionando...' : 'Adicionar aula'}
          </button>
        </form>
      )}
    </Modal>
  )
}
