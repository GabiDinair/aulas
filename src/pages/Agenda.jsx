import { useMemo, useState } from 'react'
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useAppData } from '../context/AppDataContext'
import { alunosDaTurma } from '../data/helpers'
import DayPanel from '../components/DayPanel'
import BirthdayBanner from '../components/BirthdayBanner'
import './Agenda.css'

const DIAS_HEADER = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export default function Agenda() {
  const { hoje, aulas, turmas, alunosIndividuais, alunosTurma } = useAppData()
  const [mesAtual, setMesAtual] = useState(startOfMonth(hoje))
  const [diaSelecionado, setDiaSelecionado] = useState(format(hoje, 'yyyy-MM-dd'))

  function enriquecerAula(aula) {
    if (aula.tipo === 'turma') {
      const turma = turmas.find((t) => t.id === aula.turmaId)
      return {
        ...aula,
        titulo: turma?.nome ?? 'Turma',
        local: turma?.local,
        qtdAlunos: alunosDaTurma(alunosTurma, aula.turmaId).length,
        cor: turma?.cor ?? 'sand',
      }
    }
    const aluno = alunosIndividuais.find((a) => a.id === aula.alunoId)
    return {
      ...aula,
      titulo: aluno?.nome ?? 'Aluno',
      local: aluno?.local,
      qtdAlunos: 1,
      cor: 'gold',
    }
  }

  const aulasEnriquecidas = useMemo(
    () => aulas.map(enriquecerAula),
    [aulas, turmas, alunosIndividuais, alunosTurma]
  )

  const dias = useMemo(() => {
    const inicioGrid = startOfWeek(startOfMonth(mesAtual), { weekStartsOn: 0 })
    const fimGrid = endOfWeek(endOfMonth(mesAtual), { weekStartsOn: 0 })
    return eachDayOfInterval({ start: inicioGrid, end: fimGrid })
  }, [mesAtual])

  const aulasPorDia = useMemo(() => {
    const mapa = new Map()
    for (const aula of aulasEnriquecidas) {
      if (!mapa.has(aula.date)) mapa.set(aula.date, [])
      mapa.get(aula.date).push(aula)
    }
    for (const lista of mapa.values()) lista.sort((a, b) => a.horario.localeCompare(b.horario))
    return mapa
  }, [aulasEnriquecidas])

  const aulasDoDiaSelecionado = aulasPorDia.get(diaSelecionado) ?? []

  return (
    <div>
      <BirthdayBanner />
      <div className="agenda-page">
        <div className="agenda-calendar">
          <div className="agenda-toolbar">
            <div className="agenda-toolbar-nav">
              <button className="icon-btn" onClick={() => setMesAtual((m) => subMonths(m, 1))} aria-label="Mês anterior">
                <ChevronLeft size={18} strokeWidth={1.7} />
              </button>
              <h2 className="agenda-month">{format(mesAtual, 'MMMM yyyy', { locale: ptBR })}</h2>
              <button className="icon-btn" onClick={() => setMesAtual((m) => addMonths(m, 1))} aria-label="Próximo mês">
                <ChevronRight size={18} strokeWidth={1.7} />
              </button>
            </div>
            <button
              className="btn-hoje"
              onClick={() => {
                setMesAtual(startOfMonth(hoje))
                setDiaSelecionado(format(hoje, 'yyyy-MM-dd'))
              }}
            >
              Hoje
            </button>
          </div>

          <div className="agenda-legend">
            <span className="legend-item"><i className="dot confirmada" />Confirmada</span>
            <span className="legend-item"><i className="dot pendente" />Pendente</span>
            <span className="legend-item"><i className="dot cancelada" />Cancelada</span>
            <span className="legend-item"><i className="dot concluida" />Concluída</span>
          </div>

          <div className="agenda-grid-header">
            {DIAS_HEADER.map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>

          <div className="agenda-grid">
            {dias.map((dia) => {
              const chave = format(dia, 'yyyy-MM-dd')
              const aulasDia = aulasPorDia.get(chave) ?? []
              const foraDoMes = !isSameMonth(dia, mesAtual)
              const selecionado = isSameDay(dia, new Date(diaSelecionado + 'T00:00:00'))
              const totalAlunos = aulasDia
                .filter((a) => a.status !== 'cancelada')
                .reduce((acc, a) => acc + a.qtdAlunos, 0)

              return (
                <button
                  key={chave}
                  className={
                    'agenda-day' +
                    (foraDoMes ? ' fora-do-mes' : '') +
                    (isToday(dia) ? ' hoje' : '') +
                    (selecionado ? ' selecionado' : '')
                  }
                  onClick={() => setDiaSelecionado(chave)}
                >
                  <span className="agenda-day-number">{format(dia, 'd')}</span>
                  <div className="agenda-day-pills">
                    {aulasDia.slice(0, 3).map((a) => (
                      <span key={a.id} className={`pill pill-${a.status}`}>
                        {a.horario} · {a.titulo.split(' ').slice(0, 2).join(' ')}
                      </span>
                    ))}
                    {aulasDia.length > 3 && <span className="pill pill-more">+{aulasDia.length - 3}</span>}
                  </div>
                  {aulasDia.length > 0 && (
                    <span className="agenda-day-total">
                      {totalAlunos} aluno{totalAlunos === 1 ? '' : 's'}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        <DayPanel dataStr={diaSelecionado} aulas={aulasDoDiaSelecionado} />
      </div>
    </div>
  )
}
