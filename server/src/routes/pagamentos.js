import { Router } from 'express'
import { prisma } from '../db.js'
import { autenticar } from '../middleware/auth.js'
import { asyncHandler } from '../lib/asyncHandler.js'

const router = Router()

router.get(
  '/',
  autenticar,
  asyncHandler(async (req, res) => {
    const pagamentos = await prisma.pagamento.findMany({
      where: { aluno: { professorId: req.professorId } },
    })
    res.json(pagamentos)
  })
)

router.post(
  '/',
  autenticar,
  asyncHandler(async (req, res) => {
    const { alunoId, mes, valor, dataPagamento } = req.body ?? {}
    if (!alunoId || !mes || !dataPagamento) {
      return res.status(400).json({ erro: 'Informe aluno, mês e data do pagamento.' })
    }

    const aluno = await prisma.aluno.findUnique({ where: { id: alunoId } })
    if (!aluno || aluno.professorId !== req.professorId) {
      return res.status(404).json({ erro: 'Aluno não encontrado.' })
    }

    const registro = await prisma.pagamento.upsert({
      where: { alunoId_mes: { alunoId, mes } },
      update: { valor: Number(valor), dataPagamento },
      create: { alunoId, mes, valor: Number(valor), dataPagamento },
    })

    res.status(201).json(registro)
  })
)

router.delete(
  '/:alunoId/:mes',
  autenticar,
  asyncHandler(async (req, res) => {
    const { alunoId, mes } = req.params
    const aluno = await prisma.aluno.findUnique({ where: { id: alunoId } })
    if (!aluno || aluno.professorId !== req.professorId) {
      return res.status(404).json({ erro: 'Aluno não encontrado.' })
    }

    await prisma.pagamento.deleteMany({ where: { alunoId, mes } })
    res.status(204).end()
  })
)

export default router
