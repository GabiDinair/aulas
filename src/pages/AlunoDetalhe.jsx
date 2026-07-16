import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ArrowLeft, Cake, CalendarCheck2, CalendarX2, Download, MessageCircle, Music, Pencil, Sparkles, TrendingUp } from 'lucide-react'
import { useAppData } from '../context/AppDataContext'
import { useAuth } from '../context/AuthContext'
import NovoAlunoModal from '../components/NovoAlunoModal'
import {
  aniversarioInfo,
  avatarDe,
  calcularFrequenciaAluno,
  calcularIdade,
  contarAulasConcluidas,
  formatarTempoDesde,
  historicoDeAulas,
  LIMIAR_ATENCAO_FREQUENCIA,
  linkWhatsapp,
  MIN_AULAS_PARA_FREQUENCIA,
  MOTIVO_FALTA_LABEL,
} from '../data/helpers'
import './AlunoDetalhe.css'

function mesDeStr(dataStr) {
  return dataStr.slice(0, 7)
}

export default function AlunoDetalhe() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { hoje, alunosIndividuais, alunosTurma, turmas, aulas } = useAppData()
  const { professor } = useAuth()
  const [mesRelatorio, setMesRelatorio] = useState(format(hoje, 'yyyy-MM'))
  const [modalEditarAberto, setModalEditarAberto] = useState(false)

  const alunoIndividual = alunosIndividuais.find((a) => a.id === id)
  const alunoTurma = alunosTurma.find((a) => a.id === id)
  const aluno = alunoIndividual ?? alunoTurma
  const turma = alunoTurma ? turmas.find((t) => t.id === alunoTurma.turmaId) : null

  const historico = useMemo(() => {
    if (!aluno) return []
    return historicoDeAulas(aulas, { alunoId: id, turmaId: turma?.id })
  }, [aulas, aluno, id, turma])

  const totalAulas = useMemo(() => {
    if (!aluno) return 0
    return contarAulasConcluidas(aulas, alunoIndividual ? { alunoId: id } : { turmaId: turma?.id })
  }, [aulas, aluno, alunoIndividual, id, turma])

  const mesesDisponiveis = useMemo(() => {
    const meses = new Set(historico.map((h) => mesDeStr(h.date)))
    meses.add(format(hoje, 'yyyy-MM'))
    return [...meses].sort().reverse()
  }, [historico, hoje])

  if (!aluno) {
    return (
      <div className="aluno-detalhe-page">
        <p>Aluno não encontrado.</p>
      </div>
    )
  }

  const avatar = avatarDe(aluno.id, aluno.nome)
  const idade = calcularIdade(aluno.nascimento, hoje)
  const aniversario = aniversarioInfo(aluno.nascimento, hoje)
  const tempoProfessora = formatarTempoDesde(aluno.inicioAulas, hoje)
  const frequencia = calcularFrequenciaAluno(aulas, aluno)
  const temHistoricoFrequencia = frequencia.total >= MIN_AULAS_PARA_FREQUENCIA
  const frequenciaBaixa = temHistoricoFrequencia && frequencia.frequenciaPct < LIMIAR_ATENCAO_FREQUENCIA
  const linkWhatsappContato = linkWhatsapp(
    aluno.telefone,
    `Olá! Aqui é a ${professor?.nome ?? 'sua professora'} 🎻 Notei algumas faltas nas últimas aulas de violino do(a) ${aluno.nome}. Está tudo bem? Vamos combinar de remarcar? 💛`
  )

  function exportarRelatorio() {
    const aulasDoMes = historico.filter((h) => mesDeStr(h.date) === mesRelatorio)
    const nomeMes = format(new Date(mesRelatorio + '-01T00:00:00'), "MMMM 'de' yyyy", { locale: ptBR })
    const linhas = [
      `Relatório de aulas — ${aluno.nome}`,
      `Mês de referência: ${nomeMes}`,
      turma ? `Turma: ${turma.nome}` : 'Aula particular',
      '',
      aulasDoMes.length === 0
        ? 'Nenhum registro de aula neste mês.'
        : 'O que foi trabalhado em cada aula (e faltas, quando houver):',
      '',
      ...aulasDoMes
        .slice()
        .sort((a, b) => a.date.localeCompare(b.date))
        .map((a) => {
          const dataFmt = format(new Date(a.date + 'T00:00:00'), 'dd/MM (EEEE)', { locale: ptBR })
          return a.tipo === 'falta'
            ? `• ${dataFmt} — FALTOU (${MOTIVO_FALTA_LABEL[a.motivo] ?? 'motivo não informado'})`
            : `• ${dataFmt} — ${a.anotacoes}`
        }),
      '',
      `Total de aulas realizadas com a professora até hoje: ${totalAulas}`,
      '',
      '— Gerado pelo Diário de Aulas',
    ]
    const blob = new Blob([linhas.join('\n')], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `relatorio-${aluno.nome.toLowerCase().replace(/\s+/g, '-')}-${mesRelatorio}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="aluno-detalhe-page">
      <button className="voltar-btn" onClick={() => navigate(-1)}>
        <ArrowLeft size={16} strokeWidth={1.8} /> Voltar
      </button>

      <div className={'aluno-hero' + (aniversario ? ' aniversario' : '')}>
        {aniversario && (
          <div className="aluno-hero-confete" aria-hidden="true">
            {'🎈🎉🎂🎈🎉'.split('').map((e, i) => (
              <span key={i} style={{ '--i': i }}>{e}</span>
            ))}
          </div>
        )}
        <div className="aluno-hero-top">
          <div className="aluno-hero-avatar" style={{ background: avatar.bg, color: avatar.text }}>
            {avatar.iniciais}
          </div>
          <div className="aluno-hero-nome">
            <h2>{aluno.nome} {aniversario && <span className="aniversario-tag">{aniversario.hoje ? '🎂 Aniversário hoje!' : '🎉 Aniversário nesta semana'}</span>}</h2>
            <span className={`nivel-tag nivel-${aluno.nivel.toLowerCase()}`}>{aluno.nivel}</span>
            {turma && <span className="turma-tag">{turma.nome}</span>}
            {!turma && <span className="turma-tag">Aula particular · {aluno.local}</span>}
          </div>
          <button className="icon-btn" onClick={() => setModalEditarAberto(true)} aria-label="Editar aluno">
            <Pencil size={15} strokeWidth={1.8} />
          </button>
        </div>

        <div className="aluno-progresso aluno-hero-progresso">
          <div className="aluno-progresso-label">
            <span>Progresso musical</span>
            <span>{aluno.progresso}%</span>
          </div>
          <div className="progresso-track">
            <div className="progresso-fill" style={{ width: `${aluno.progresso}%` }} />
          </div>
        </div>
      </div>

      <div className="aluno-info-grid">
        <div className="info-card">
          <Cake size={18} strokeWidth={1.6} />
          <div>
            <p className="info-label">Data de nascimento</p>
            <p className="info-valor">{format(new Date(aluno.nascimento + 'T00:00:00'), 'dd/MM/yyyy')} · {idade} anos</p>
          </div>
        </div>
        <div className="info-card">
          <Sparkles size={18} strokeWidth={1.6} />
          <div>
            <p className="info-label">Aluno(a) da professora desde</p>
            <p className="info-valor">
              {aluno.inicioAulas ? format(new Date(aluno.inicioAulas + 'T00:00:00'), 'MM/yyyy') : '—'}
              {tempoProfessora && ` · há ${tempoProfessora}`}
            </p>
          </div>
        </div>
        <div className="info-card">
          <CalendarCheck2 size={18} strokeWidth={1.6} />
          <div>
            <p className="info-label">Aulas já realizadas</p>
            <p className="info-valor">{totalAulas} aulas</p>
          </div>
        </div>
        <div className={'info-card' + (frequenciaBaixa ? ' info-card-alerta' : '')}>
          <TrendingUp size={18} strokeWidth={1.6} />
          <div>
            <p className="info-label">Frequência</p>
            <p className="info-valor">
              {temHistoricoFrequencia
                ? `${frequencia.frequenciaPct}% de presença · ${frequencia.faltas} falta${frequencia.faltas === 1 ? '' : 's'}`
                : 'Ainda sem histórico suficiente'}
            </p>
          </div>
        </div>
      </div>

      {frequenciaBaixa && (
        <div className="alerta-faltas">
          <div>
            <p className="alerta-faltas-titulo">⚠️ Atenção: frequência abaixo do esperado</p>
            <p className="alerta-faltas-texto">
              {aluno.nome} teve {frequencia.faltas} falta{frequencia.faltas === 1 ? '' : 's'}
              {frequencia.faltasCimaHora > 0 ? ` (${frequencia.faltasCimaHora} em cima da hora)` : ''} — vale a pena conversar.
            </p>
          </div>
          {linkWhatsappContato ? (
            <a className="btn-adicionar btn-whatsapp" href={linkWhatsappContato} target="_blank" rel="noreferrer">
              <MessageCircle size={16} strokeWidth={2} /> Chamar no WhatsApp
            </a>
          ) : (
            <p className="alerta-faltas-sem-telefone">Cadastre o telefone do aluno para poder chamar no WhatsApp.</p>
          )}
        </div>
      )}

      <div className="relatorio-bar">
        <div>
          <h3 className="secao-titulo">Diário de anotações</h3>
          <p className="relatorio-hint">O que foi trabalhado em cada aula — e os dias em que houve falta.</p>
        </div>
        <div className="relatorio-actions">
          <select value={mesRelatorio} onChange={(e) => setMesRelatorio(e.target.value)}>
            {mesesDisponiveis.map((m) => (
              <option key={m} value={m}>
                {format(new Date(m + '-01T00:00:00'), "MMMM 'de' yyyy", { locale: ptBR })}
              </option>
            ))}
          </select>
          <button className="btn-adicionar" onClick={exportarRelatorio}>
            <Download size={16} strokeWidth={2} /> Exportar relatório
          </button>
        </div>
      </div>

      <div className="historico-lista">
        {historico.length === 0 && (
          <div className="day-panel-empty">
            <p>Ainda não há registros para este aluno.</p>
          </div>
        )}
        {historico.map((item) => (
          <div key={item.id} className={'historico-item' + (item.tipo === 'falta' ? ' historico-item-falta' : '')}>
            <div className="historico-data">
              {item.tipo === 'falta' ? <CalendarX2 size={14} strokeWidth={1.7} /> : <Music size={14} strokeWidth={1.7} />}
              {format(new Date(item.date + 'T00:00:00'), "dd 'de' MMMM", { locale: ptBR })}
            </div>
            {item.tipo === 'falta' ? (
              <p className="historico-falta-texto">Faltou — {MOTIVO_FALTA_LABEL[item.motivo] ?? 'motivo não informado'}</p>
            ) : (
              <p>{item.anotacoes}</p>
            )}
          </div>
        ))}
      </div>

      {modalEditarAberto && (
        <NovoAlunoModal
          alunoExistente={aluno}
          onClose={() => setModalEditarAberto(false)}
          onExcluido={() => navigate('/dashboard/alunos')}
        />
      )}
    </div>
  )
}
