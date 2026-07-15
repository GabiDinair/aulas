const MESES_JANELA_FUTURA = 3
const EPOCA = new Date(2024, 0, 7) // domingo de referência para paridade de semanas quinzenais

export function formatarData(d) {
  const ano = d.getFullYear()
  const mes = String(d.getMonth() + 1).padStart(2, '0')
  const dia = String(d.getDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
}

function ocorreNaSemana(dia, frequencia, offset = 0) {
  if (frequencia !== 'quinzenal') return true
  const diffDias = Math.round((dia - EPOCA) / (1000 * 60 * 60 * 24))
  const numSemana = Math.floor(diffDias / 7)
  return Math.abs(numSemana + offset) % 2 === 0
}

export function calcularOcorrencias({ diaSemana, frequencia, quinzenaOffset }, inicio, fim) {
  const datas = []
  const cursor = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate())
  const fimNormalizado = new Date(fim.getFullYear(), fim.getMonth(), fim.getDate())
  while (cursor <= fimNormalizado) {
    if (cursor.getDay() === diaSemana && ocorreNaSemana(cursor, frequencia, quinzenaOffset ?? 0)) {
      datas.push(formatarData(cursor))
    }
    cursor.setDate(cursor.getDate() + 1)
  }
  return datas
}

export function statusEfetivo(aula, hojeStr) {
  if (aula.status === 'cancelada') return 'cancelada'
  return aula.date < hojeStr ? 'concluida' : aula.status
}

export function serializarAula(aula, hojeStr) {
  return {
    id: aula.id,
    date: aula.date,
    horario: aula.horario,
    duracao: aula.duracao,
    tipo: aula.tipo,
    turmaId: aula.turmaId,
    alunoId: aula.alunoId,
    status: statusEfetivo(aula, hojeStr),
    motivoCancelamento: aula.motivoCancelamento,
    anotacoes: aula.anotacoes,
    remarcadaDe: aula.remarcadaDe,
    faltasAlunos: (aula.faltas ?? []).map((f) => f.alunoId),
  }
}

export async function garantirOcorrencias(prisma, professorId) {
  const hoje = new Date()
  const hojeMeiaNoite = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate())
  const fim = new Date(hojeMeiaNoite)
  fim.setMonth(fim.getMonth() + MESES_JANELA_FUTURA)

  const turmas = await prisma.turma.findMany({ where: { professorId } })
  for (const turma of turmas) {
    const inicio = new Date(turma.criadoEm)
    const datas = calcularOcorrencias(turma, inicio, fim)
    if (datas.length === 0) continue

    const existentes = await prisma.aula.findMany({
      where: { turmaId: turma.id, date: { in: datas } },
      select: { date: true },
    })
    const jaExistem = new Set(existentes.map((e) => e.date))
    const novasDatas = datas.filter((d) => !jaExistem.has(d))
    if (novasDatas.length === 0) continue

    await prisma.aula.createMany({
      data: novasDatas.map((date) => ({
        professorId,
        turmaId: turma.id,
        date,
        horario: turma.horario,
        duracao: turma.duracao,
        tipo: 'turma',
        status: 'confirmada',
      })),
    })
  }

  const alunosIndividuais = await prisma.aluno.findMany({ where: { professorId, turmaId: null } })
  for (const aluno of alunosIndividuais) {
    if (aluno.diaSemana === null || aluno.diaSemana === undefined) continue
    const inicio = new Date(aluno.criadoEm)
    const datas = calcularOcorrencias(
      { diaSemana: aluno.diaSemana, frequencia: aluno.frequencia, quinzenaOffset: aluno.quinzenaOffset },
      inicio,
      fim
    )
    if (datas.length === 0) continue

    const existentes = await prisma.aula.findMany({
      where: { alunoId: aluno.id, date: { in: datas } },
      select: { date: true },
    })
    const jaExistem = new Set(existentes.map((e) => e.date))
    const novasDatas = datas.filter((d) => !jaExistem.has(d))
    if (novasDatas.length === 0) continue

    await prisma.aula.createMany({
      data: novasDatas.map((date) => ({
        professorId,
        alunoId: aluno.id,
        date,
        horario: aluno.horario,
        duracao: 45,
        tipo: 'individual',
        status: 'pendente',
      })),
    })
  }
}
