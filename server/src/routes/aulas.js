import { Router } from 'express'
import { prisma } from '../db.js'
import { autenticar } from '../middleware/auth.js'
import { asyncHandler } from '../lib/asyncHandler.js'
import { formatarData, garantirOcorrencias, serializarAula } from '../lib/agenda.js'

const router = Router()

async function buscarAulaDoProfessor(id, professorId) {
  const aula = await prisma.aula.findUnique({ where: { id }, include: { faltas: true } })
  if (!aula || aula.professorId !== professorId) return null
  return aula
}

async function recarregarESerializar(id) {
  const aula = await prisma.aula.findUnique({ where: { id }, include: { faltas: true } })
  return serializarAula(aula, formatarData(new Date()))
}

router.get(
  '/',
  autenticar,
  asyncHandler(async (req, res) => {
    await garantirOcorrencias(prisma, req.professorId)

    const aulas = await prisma.aula.findMany({
      where: { professorId: req.professorId },
      include: { faltas: true },
      orderBy: [{ date: 'asc' }, { horario: 'asc' }],
    })

    const hojeStr = formatarData(new Date())
    res.json(aulas.map((a) => serializarAula(a, hojeStr)))
  })
)

// Cria uma aula avulsa (fora do padrão recorrente) pra um aluno ou turma já existente
router.post(
  '/',
  autenticar,
  asyncHandler(async (req, res) => {
    const { tipo, turmaId, alunoId, date, horario, duracao } = req.body ?? {}

    if (!date || !horario || (tipo !== 'turma' && tipo !== 'individual')) {
      return res.status(400).json({ erro: 'Informe tipo, data e horário da aula.' })
    }

    let duracaoFinal = Number(duracao) || 45

    if (tipo === 'turma') {
      const turma = await prisma.turma.findUnique({ where: { id: turmaId } })
      if (!turma || turma.professorId !== req.professorId) {
        return res.status(404).json({ erro: 'Turma não encontrada.' })
      }
      const existente = await prisma.aula.findFirst({ where: { turmaId, date } })
      if (existente) return res.status(409).json({ erro: 'Já existe uma aula nesse dia para essa turma.' })
      duracaoFinal = Number(duracao) || turma.duracao
    } else {
      const aluno = await prisma.aluno.findUnique({ where: { id: alunoId } })
      if (!aluno || aluno.professorId !== req.professorId) {
        return res.status(404).json({ erro: 'Aluno não encontrado.' })
      }
      const existente = await prisma.aula.findFirst({ where: { alunoId, date } })
      if (existente) return res.status(409).json({ erro: 'Já existe uma aula nesse dia para esse aluno.' })
    }

    const aula = await prisma.aula.create({
      data: {
        professorId: req.professorId,
        tipo,
        turmaId: tipo === 'turma' ? turmaId : null,
        alunoId: tipo === 'individual' ? alunoId : null,
        date,
        horario,
        duracao: duracaoFinal,
        status: tipo === 'turma' ? 'confirmada' : 'pendente',
      },
    })

    res.status(201).json(await recarregarESerializar(aula.id))
  })
)

router.patch(
  '/:id/confirmar',
  autenticar,
  asyncHandler(async (req, res) => {
    const aula = await buscarAulaDoProfessor(req.params.id, req.professorId)
    if (!aula) return res.status(404).json({ erro: 'Aula não encontrada.' })

    await prisma.aula.update({ where: { id: aula.id }, data: { status: 'confirmada' } })
    res.json(await recarregarESerializar(aula.id))
  })
)

router.patch(
  '/:id/cancelar',
  autenticar,
  asyncHandler(async (req, res) => {
    const { motivo, escopo } = req.body ?? {}
    const aula = await buscarAulaDoProfessor(req.params.id, req.professorId)
    if (!aula) return res.status(404).json({ erro: 'Aula não encontrada.' })

    await prisma.aula.update({
      where: { id: aula.id },
      data: { status: 'cancelada', motivoCancelamento: motivo ?? null },
    })

    if (escopo === 'futuras') {
      const filtroEntidade = aula.tipo === 'turma' ? { turmaId: aula.turmaId } : { alunoId: aula.alunoId }
      await prisma.aula.updateMany({
        where: { ...filtroEntidade, date: { gt: aula.date }, status: { not: 'cancelada' } },
        data: { status: 'cancelada', motivoCancelamento: motivo ?? null },
      })
    }

    res.json(await recarregarESerializar(aula.id))
  })
)

router.patch(
  '/:id/reagendar',
  autenticar,
  asyncHandler(async (req, res) => {
    const { novaData, novoHorario } = req.body ?? {}
    if (!novaData) return res.status(400).json({ erro: 'Informe a nova data.' })

    const aula = await buscarAulaDoProfessor(req.params.id, req.professorId)
    if (!aula) return res.status(404).json({ erro: 'Aula não encontrada.' })

    await prisma.aula.update({
      where: { id: aula.id },
      data: {
        date: novaData,
        horario: novoHorario || aula.horario,
        status: 'confirmada',
        motivoCancelamento: null,
        remarcadaDe: aula.date,
      },
    })
    res.json(await recarregarESerializar(aula.id))
  })
)

// Edita horário/duração de uma aula já agendada (não cancelada), opcionalmente aplicando a todas as próximas
router.patch(
  '/:id/editar',
  autenticar,
  asyncHandler(async (req, res) => {
    const { horario, duracao, escopo } = req.body ?? {}
    const aula = await buscarAulaDoProfessor(req.params.id, req.professorId)
    if (!aula) return res.status(404).json({ erro: 'Aula não encontrada.' })

    const novoHorario = horario || aula.horario
    const novaDuracao = duracao ? Number(duracao) : aula.duracao

    await prisma.aula.update({
      where: { id: aula.id },
      data: { horario: novoHorario, duracao: novaDuracao },
    })

    if (escopo === 'futuras') {
      const filtroEntidade = aula.tipo === 'turma' ? { turmaId: aula.turmaId } : { alunoId: aula.alunoId }
      await prisma.aula.updateMany({
        where: { ...filtroEntidade, date: { gt: aula.date }, status: { not: 'cancelada' } },
        data: { horario: novoHorario, duracao: novaDuracao },
      })

      if (aula.tipo === 'turma') {
        await prisma.turma.update({ where: { id: aula.turmaId }, data: { horario: novoHorario, duracao: novaDuracao } })
      } else {
        await prisma.aluno.update({ where: { id: aula.alunoId }, data: { horario: novoHorario } })
      }
    }

    res.json(await recarregarESerializar(aula.id))
  })
)

router.patch(
  '/:id/anotacoes',
  autenticar,
  asyncHandler(async (req, res) => {
    const { texto } = req.body ?? {}
    const aula = await buscarAulaDoProfessor(req.params.id, req.professorId)
    if (!aula) return res.status(404).json({ erro: 'Aula não encontrada.' })

    await prisma.aula.update({ where: { id: aula.id }, data: { anotacoes: texto ?? '' } })
    res.json(await recarregarESerializar(aula.id))
  })
)

router.patch(
  '/:id/faltas',
  autenticar,
  asyncHandler(async (req, res) => {
    const { faltasAlunos } = req.body ?? {}
    const aula = await buscarAulaDoProfessor(req.params.id, req.professorId)
    if (!aula || aula.tipo !== 'turma') {
      return res.status(404).json({ erro: 'Aula de turma não encontrada.' })
    }

    await prisma.aulaFalta.deleteMany({ where: { aulaId: aula.id } })
    if (Array.isArray(faltasAlunos) && faltasAlunos.length > 0) {
      await prisma.aulaFalta.createMany({
        data: faltasAlunos.map((alunoId) => ({ aulaId: aula.id, alunoId })),
      })
    }
    res.json(await recarregarESerializar(aula.id))
  })
)

export default router
