import { useMemo, useState } from 'react'
import { addMonths, format, startOfMonth, subMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronDown, ChevronLeft, ChevronRight, CircleCheck, CircleDollarSign, Clock3, Undo2 } from 'lucide-react'
import { useAppData } from '../context/AppDataContext'
import { avatarDe, formatarMoeda, listaAlunosComMensalidade } from '../data/helpers'
import RegistrarPagamentoLinha from '../components/RegistrarPagamentoLinha'
import './Carteira.css'

const ALUNOS_INDIVIDUAIS_LABEL = 'Alunos individuais'

function agruparPorTurma(lista, getTurmaNome) {
  const mapa = new Map()
  for (const item of lista) {
    const chave = getTurmaNome(item) ?? ALUNOS_INDIVIDUAIS_LABEL
    if (!mapa.has(chave)) mapa.set(chave, [])
    mapa.get(chave).push(item)
  }
  const entradas = [...mapa.entries()]
  entradas.sort((a, b) => {
    if (a[0] === ALUNOS_INDIVIDUAIS_LABEL) return 1
    if (b[0] === ALUNOS_INDIVIDUAIS_LABEL) return -1
    return 0
  })
  return entradas
}

function BlocoPagamento({ chave, titulo, subtitulo, aberto, onToggle, children }) {
  return (
    <div className="pagamento-bloco">
      <button className="pagamento-bloco-header" onClick={() => onToggle(chave)}>
        <div>
          <p className="pagamento-bloco-titulo">{titulo}</p>
          <p className="pagamento-bloco-sub">{subtitulo}</p>
        </div>
        <ChevronDown size={17} strokeWidth={2} className={'pagamento-bloco-chevron' + (aberto ? ' aberto' : '')} />
      </button>
      {aberto && <div className="pagamento-bloco-conteudo">{children}</div>}
    </div>
  )
}

export default function Carteira() {
  const { hoje, alunosIndividuais, alunosTurma, turmas, pagamentos, registrarPagamento, removerPagamento } = useAppData()
  const [mesAtual, setMesAtual] = useState(startOfMonth(hoje))
  const [visualizacao, setVisualizacao] = useState('pendente')
  const [blocosAbertos, setBlocosAbertos] = useState(() => new Set())

  function toggleBloco(chave) {
    setBlocosAbertos((prev) => {
      const novo = new Set(prev)
      if (novo.has(chave)) novo.delete(chave)
      else novo.add(chave)
      return novo
    })
  }

  const mesStr = format(mesAtual, 'yyyy-MM')

  const todosAlunos = useMemo(
    () => listaAlunosComMensalidade(alunosIndividuais, alunosTurma, turmas).filter((a) => a.mensalidade > 0),
    [alunosIndividuais, alunosTurma, turmas]
  )

  const pagamentosDoMes = useMemo(() => pagamentos.filter((p) => p.mes === mesStr), [pagamentos, mesStr])

  const { pagos, pendentes, totalEsperado, totalRecebido, totalAReceber, pctRecebido } = useMemo(() => {
    const mapaPagamentos = new Map(pagamentosDoMes.map((p) => [p.alunoId, p]))
    const pagosList = []
    const pendentesList = []
    for (const aluno of todosAlunos) {
      const pagamento = mapaPagamentos.get(aluno.id)
      if (pagamento) pagosList.push({ aluno, pagamento })
      else pendentesList.push(aluno)
    }
    const recebido = pagosList.reduce((acc, p) => acc + p.pagamento.valor, 0)
    const aReceber = pendentesList.reduce((acc, a) => acc + a.mensalidade, 0)
    const esperado = recebido + aReceber
    return {
      pagos: pagosList.sort((a, b) => b.pagamento.dataPagamento.localeCompare(a.pagamento.dataPagamento)),
      pendentes: pendentesList.sort((a, b) => b.mensalidade - a.mensalidade),
      totalEsperado: esperado,
      totalRecebido: recebido,
      totalAReceber: aReceber,
      pctRecebido: esperado > 0 ? Math.round((recebido / esperado) * 100) : 0,
    }
  }, [todosAlunos, pagamentosDoMes])

  const blocosPendentes = useMemo(() => agruparPorTurma(pendentes, (a) => a.turmaNome), [pendentes])
  const blocosPagos = useMemo(() => agruparPorTurma(pagos, (p) => p.aluno.turmaNome), [pagos])

  return (
    <div className="carteira-page">
      <div className="page-heading">
        <h2>Minha Carteira</h2>
        <p>Controle simples das mensalidades de alunos e turmas</p>
      </div>

      <div className="carteira-toolbar">
        <div className="agenda-toolbar-nav">
          <button className="icon-btn" onClick={() => setMesAtual((m) => subMonths(m, 1))} aria-label="Mês anterior">
            <ChevronLeft size={18} strokeWidth={1.7} />
          </button>
          <h3 className="agenda-month">{format(mesAtual, 'MMMM yyyy', { locale: ptBR })}</h3>
          <button className="icon-btn" onClick={() => setMesAtual((m) => addMonths(m, 1))} aria-label="Próximo mês">
            <ChevronRight size={18} strokeWidth={1.7} />
          </button>
        </div>
        <button className="btn-hoje" onClick={() => setMesAtual(startOfMonth(hoje))}>Mês atual</button>
      </div>

      <div className="carteira-resumo">
        <div className="carteira-stats">
          <div className="carteira-stat">
            <CircleDollarSign size={18} strokeWidth={1.6} />
            <div>
              <p className="carteira-stat-label">Total esperado</p>
              <p className="carteira-stat-valor">{formatarMoeda(totalEsperado)}</p>
            </div>
          </div>
        </div>

        <div className="carteira-meter">
          <div className="carteira-meter-track">
            {totalEsperado === 0 ? (
              <div className="carteira-meter-vazio" />
            ) : (
              <>
                <div className="carteira-meter-fill recebido" style={{ width: `${pctRecebido}%` }} />
                <div className="carteira-meter-fill pendente" style={{ width: `${100 - pctRecebido}%` }} />
              </>
            )}
          </div>
          <div className="carteira-meter-pct">{pctRecebido}% recebido</div>
        </div>

        <div className="carteira-legendas">
          <button
            className={'carteira-legenda recebido' + (visualizacao === 'recebido' ? ' active' : '')}
            onClick={() => setVisualizacao(visualizacao === 'recebido' ? null : 'recebido')}
          >
            <CircleCheck size={16} strokeWidth={1.8} />
            <div>
              <span className="carteira-legenda-label">Recebido</span>
              <span className="carteira-legenda-valor">{formatarMoeda(totalRecebido)} · {pagos.length} aluno{pagos.length === 1 ? '' : 's'}</span>
            </div>
          </button>
          <button
            className={'carteira-legenda pendente' + (visualizacao === 'pendente' ? ' active' : '')}
            onClick={() => setVisualizacao(visualizacao === 'pendente' ? null : 'pendente')}
          >
            <Clock3 size={16} strokeWidth={1.8} />
            <div>
              <span className="carteira-legenda-label">A receber</span>
              <span className="carteira-legenda-valor">{formatarMoeda(totalAReceber)} · {pendentes.length} aluno{pendentes.length === 1 ? '' : 's'}</span>
            </div>
          </button>
        </div>
      </div>

      {visualizacao === 'pendente' && (
        <div className="carteira-lista">
          <h3 className="secao-titulo">Quem ainda não pagou — {format(mesAtual, "MMMM", { locale: ptBR })}</h3>
          {pendentes.length === 0 ? (
            <div className="day-panel-empty"><p>Todo mundo já pagou este mês! 🎉</p></div>
          ) : (
            blocosPendentes.map(([nomeGrupo, alunosGrupo]) => {
              const chave = `pendente-${nomeGrupo}`
              const subtotal = alunosGrupo.reduce((acc, a) => acc + a.mensalidade, 0)
              return (
                <BlocoPagamento
                  key={chave}
                  chave={chave}
                  titulo={nomeGrupo}
                  subtitulo={`${alunosGrupo.length} aluno${alunosGrupo.length === 1 ? '' : 's'} · ${formatarMoeda(subtotal)}`}
                  aberto={blocosAbertos.has(chave)}
                  onToggle={toggleBloco}
                >
                  {alunosGrupo.map((aluno) => (
                    <RegistrarPagamentoLinha
                      key={aluno.id}
                      aluno={aluno}
                      mesStr={mesStr}
                      hoje={hoje}
                      onRegistrar={(valor, data) => registrarPagamento(aluno.id, mesStr, valor, data)}
                    />
                  ))}
                </BlocoPagamento>
              )
            })
          )}
        </div>
      )}

      {visualizacao === 'recebido' && (
        <div className="carteira-lista">
          <h3 className="secao-titulo">Quem já pagou — {format(mesAtual, "MMMM", { locale: ptBR })}</h3>
          {pagos.length === 0 ? (
            <div className="day-panel-empty"><p>Ninguém pagou ainda este mês.</p></div>
          ) : (
            blocosPagos.map(([nomeGrupo, itensGrupo]) => {
              const chave = `pago-${nomeGrupo}`
              const subtotal = itensGrupo.reduce((acc, p) => acc + p.pagamento.valor, 0)
              return (
                <BlocoPagamento
                  key={chave}
                  chave={chave}
                  titulo={nomeGrupo}
                  subtitulo={`${itensGrupo.length} aluno${itensGrupo.length === 1 ? '' : 's'} · ${formatarMoeda(subtotal)}`}
                  aberto={blocosAbertos.has(chave)}
                  onToggle={toggleBloco}
                >
                  {itensGrupo.map(({ aluno, pagamento }) => {
                    const avatar = avatarDe(aluno.id, aluno.nome)
                    return (
                      <div key={aluno.id} className="pagamento-linha">
                        <div className="pagamento-linha-info">
                          <div className="mini-avatar-round" style={{ background: avatar.bg, color: avatar.text }}>
                            {avatar.iniciais}
                          </div>
                          <div>
                            <p className="pagamento-nome">{aluno.nome}</p>
                            <p className="pagamento-sub">{aluno.turmaNome ?? 'Aula particular'}</p>
                          </div>
                        </div>
                        <div className="pagamento-linha-valor">
                          <span className="pagamento-valor-pago">{formatarMoeda(pagamento.valor)}</span>
                          <span className="pagamento-data">pago em {format(new Date(pagamento.dataPagamento + 'T00:00:00'), 'dd/MM/yyyy')}</span>
                        </div>
                        <button className="btn-mini btn-desfazer" onClick={() => removerPagamento(aluno.id, mesStr)}>
                          <Undo2 size={13} strokeWidth={1.8} /> Desfazer
                        </button>
                      </div>
                    )
                  })}
                </BlocoPagamento>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
