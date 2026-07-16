import { differenceInYears, endOfWeek, intervalToDuration, isSameDay, isWithinInterval, setYear, startOfWeek } from 'date-fns'

export const CATEGORIAS_MATERIAL_PADRAO = ['Partituras', 'Métodos', 'Teoria', 'Material de apoio']

// Pastas existentes dentro de uma categoria — derivadas do campo "tag" dos materiais já enviados
export function pastasDaCategoria(materiais, categoria) {
  const contagem = new Map()
  for (const m of materiais) {
    if (m.categoria !== categoria || !m.tag) continue
    contagem.set(m.tag, (contagem.get(m.tag) ?? 0) + 1)
  }
  return [...contagem.entries()].sort((a, b) => a[0].localeCompare(b[0]))
}

export const DIAS_SEMANA = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado']

export function primeiroNome(nomeCompleto) {
  return (nomeCompleto || '').trim().split(' ')[0] || nomeCompleto
}

// Presets de cor para turmas — o valor salvo tanto pode ser uma dessas chaves quanto um hex livre (#RRGGBB)
export const CORES_TURMA_PRESET = {
  sand: '#EAD9B8',
  rose: '#E3C6BD',
  sage: '#B9C7AB',
  gold: '#C9A66B',
  lavanda: '#D9C7E8',
  ceu: '#C9DCE3',
  terracota: '#DDA98C',
  menta: '#A8D9C4',
  ameixa: '#C4A3C9',
  mostarda: '#E0C25A',
}

export function corDaTurma(cor) {
  if (!cor) return CORES_TURMA_PRESET.sand
  if (cor.startsWith('#')) return cor
  return CORES_TURMA_PRESET[cor] ?? CORES_TURMA_PRESET.sand
}

export const avatarPalette = [
  { bg: '#EAD9B8', text: '#93732F' },
  { bg: '#E3C6BD', text: '#9C5A4B' },
  { bg: '#B9C7AB', text: '#52683F' },
  { bg: '#D9C7E8', text: '#6C4B8C' },
  { bg: '#C9DCE3', text: '#3F6B78' },
  { bg: '#E6D3AB', text: '#8A6428' },
]

function iniciaisDe(nome) {
  return nome
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('')
}

function hashSeed(id) {
  const str = String(id)
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) | 0
  }
  return Math.abs(hash)
}

// Cor/iniciais do avatar são só decorativas — derivadas do id pra ficarem estáveis sem precisar guardar no banco
export function avatarDe(id, nome) {
  const idx = hashSeed(id) % avatarPalette.length
  return { ...avatarPalette[idx], iniciais: iniciaisDe(nome) }
}

export function linkWhatsapp(telefone, mensagem) {
  const digitos = (telefone || '').replace(/\D/g, '')
  if (!digitos) return null
  const comPais = digitos.startsWith('55') ? digitos : `55${digitos}`
  return `https://wa.me/${comPais}?text=${encodeURIComponent(mensagem)}`
}

export const MOTIVOS_CANCELAMENTO = [
  { id: 'aluno_cima_hora', label: 'Aluno cancelou em cima da hora' },
  { id: 'aluno_indisponivel', label: 'Aluno avisou que não poderia vir' },
  { id: 'professora_indisponivel', label: 'Eu não pude dar aula' },
]

export const MOTIVO_FALTA_LABEL = {
  aluno_cima_hora: 'Aluno cancelou em cima da hora',
  aluno_indisponivel: 'Aluno avisou que não poderia vir',
  professora_indisponivel: 'Professora precisou cancelar a aula',
  aluno_ausente: 'Aluno faltou (turma teve aula normalmente)',
}

export const LIMIAR_ATENCAO_FREQUENCIA = 80
export const MIN_AULAS_PARA_FREQUENCIA = 3

// --- Helpers de consulta (recebem as listas atuais do contexto) ---
export function alunosDaTurma(alunosTurmaList, turmaId) {
  return alunosTurmaList.filter((a) => a.turmaId === turmaId)
}

export function calcularFrequenciaAluno(aulas, aluno) {
  if (aluno.turmaId) {
    const aulasTurma = aulas.filter((a) => a.tipo === 'turma' && a.turmaId === aluno.turmaId && a.status === 'concluida')
    let presentes = 0
    let faltas = 0
    for (const a of aulasTurma) {
      if (a.faltasAlunos?.includes(aluno.id)) faltas += 1
      else presentes += 1
    }
    const total = presentes + faltas
    return { presentes, faltas, faltasCimaHora: 0, total, frequenciaPct: total > 0 ? Math.round((presentes / total) * 100) : 100 }
  }

  const aulasAluno = aulas.filter(
    (a) =>
      a.tipo === 'individual' &&
      a.alunoId === aluno.id &&
      (a.status === 'concluida' || (a.status === 'cancelada' && a.motivoCancelamento !== 'professora_indisponivel'))
  )
  let presentes = 0
  let faltas = 0
  let faltasCimaHora = 0
  for (const a of aulasAluno) {
    if (a.status === 'concluida') {
      presentes += 1
    } else {
      faltas += 1
      if (a.motivoCancelamento === 'aluno_cima_hora') faltasCimaHora += 1
    }
  }
  const total = presentes + faltas
  return { presentes, faltas, faltasCimaHora, total, frequenciaPct: total > 0 ? Math.round((presentes / total) * 100) : 100 }
}

export function contarAulasConcluidas(aulas, { alunoId, turmaId }) {
  return aulas.filter((a) => a.status === 'concluida' && (alunoId ? a.alunoId === alunoId : a.turmaId === turmaId)).length
}

export function historicoDeAulas(aulas, { alunoId, turmaId }) {
  const relevantes = turmaId
    ? aulas.filter((a) => a.tipo === 'turma' && a.turmaId === turmaId && (a.status === 'concluida' || a.status === 'cancelada'))
    : aulas.filter((a) => a.tipo === 'individual' && a.alunoId === alunoId && (a.status === 'concluida' || a.status === 'cancelada'))

  const eventos = []
  for (const a of relevantes) {
    if (a.status === 'cancelada') {
      eventos.push({ id: a.id, date: a.date, tipo: 'falta', motivo: a.motivoCancelamento })
    } else if (turmaId && a.faltasAlunos?.includes(alunoId)) {
      eventos.push({ id: a.id, date: a.date, tipo: 'falta', motivo: 'aluno_ausente' })
    } else if (a.anotacoes) {
      eventos.push({ id: a.id, date: a.date, tipo: 'realizada', anotacoes: a.anotacoes })
    }
  }
  return eventos.sort((a, b) => b.date.localeCompare(a.date))
}

// --- Tempo / idade ---
export function formatarTempoDesde(dataStr, hoje) {
  if (!dataStr) return null
  const data = new Date(dataStr + 'T00:00:00')
  if (data > hoje) return 'ainda não iniciado'
  const dur = intervalToDuration({ start: data, end: hoje })
  const partes = []
  if (dur.years) partes.push(`${dur.years} ano${dur.years > 1 ? 's' : ''}`)
  if (dur.months) partes.push(`${dur.months} ${dur.months > 1 ? 'meses' : 'mês'}`)
  if (partes.length === 0) return 'menos de 1 mês'
  return partes.join(' e ')
}

export function calcularIdade(nascimento, hoje) {
  return differenceInYears(hoje, new Date(nascimento + 'T00:00:00'))
}

// --- Aniversário ---
export function aniversarioInfo(nascimento, hoje) {
  const nascimentoDate = new Date(nascimento + 'T00:00:00')
  const inicioSemana = startOfWeek(hoje, { weekStartsOn: 0 })
  const fimSemana = endOfWeek(hoje, { weekStartsOn: 0 })
  const candidatos = [hoje.getFullYear() - 1, hoje.getFullYear(), hoje.getFullYear() + 1].map((ano) =>
    setYear(nascimentoDate, ano)
  )
  const aniversarioEsteAno = candidatos.find((d) => isWithinInterval(d, { start: inicioSemana, end: fimSemana }))
  if (!aniversarioEsteAno) return null
  return {
    data: aniversarioEsteAno,
    idadeNova: differenceInYears(aniversarioEsteAno, nascimentoDate),
    hoje: isSameDay(aniversarioEsteAno, hoje),
  }
}

// --- Financeiro / Carteira ---
export function formatarMoeda(valor) {
  return (valor ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function listaAlunosComMensalidade(alunosIndividuais, alunosTurma, turmas) {
  const individuais = alunosIndividuais.map((a) => ({
    id: a.id,
    nome: a.nome,
    mensalidade: a.mensalidade ?? 0,
    tipo: 'individual',
    turmaNome: null,
  }))
  const deTurma = alunosTurma.map((a) => {
    const turma = turmas.find((t) => t.id === a.turmaId)
    return {
      id: a.id,
      nome: a.nome,
      mensalidade: turma?.mensalidade ?? 0,
      tipo: 'turma',
      turmaNome: turma?.nome ?? null,
    }
  })
  return [...individuais, ...deTurma]
}
