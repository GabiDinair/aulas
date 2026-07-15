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
    const { motivo } = req.body ?? {}
    const aula = await buscarAulaDoProfessor(req.params.id, req.professorId)
    if (!aula) return res.status(404).json({ erro: 'Aula não encontrada.' })

    await prisma.aula.update({
      where: { id: aula.id },
      data: { status: 'cancelada', motivoCancelamento: motivo ?? null },
    })
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
