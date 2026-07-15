import { Router } from 'express'
import { prisma } from '../db.js'
import { autenticar } from '../middleware/auth.js'
import { asyncHandler } from '../lib/asyncHandler.js'

const DIAS_SEMANA = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado']

const router = Router()

function serializarTurma(t) {
  return {
    id: t.id,
    nome: t.nome,
    diaSemana: t.diaSemana,
    diaSemanaNome: DIAS_SEMANA[t.diaSemana],
    horario: t.horario,
    duracao: t.duracao,
    local: t.local,
    cor: t.cor,
    frequencia: t.frequencia,
    quinzenaOffset: t.quinzenaOffset,
    mensalidade: t.mensalidade,
    criadoEm: t.criadoEm,
  }
}

router.get(
  '/',
  autenticar,
  asyncHandler(async (req, res) => {
    const turmas = await prisma.turma.findMany({
      where: { professorId: req.professorId },
      orderBy: { criadoEm: 'asc' },
    })
    res.json(turmas.map(serializarTurma))
  })
)

router.post(
  '/',
  autenticar,
  asyncHandler(async (req, res) => {
    const { nome, diaSemana, horario, duracao, local, cor, frequencia, quinzenaOffset, mensalidade } = req.body ?? {}

    if (!nome?.trim() || !local?.trim() || diaSemana === undefined || !horario || !duracao) {
      return res.status(400).json({ erro: 'Preencha nome, dia da semana, horário, duração e local.' })
    }

    const turma = await prisma.turma.create({
      data: {
        professorId: req.professorId,
        nome: nome.trim(),
        diaSemana: Number(diaSemana),
        horario,
        duracao: Number(duracao),
        local: local.trim(),
        cor: cor || 'sand',
        frequencia: frequencia === 'quinzenal' ? 'quinzenal' : 'semanal',
        quinzenaOffset: Number(quinzenaOffset) || 0,
        mensalidade: Number(mensalidade) || 0,
      },
    })

    res.status(201).json(serializarTurma(turma))
  })
)

export default router
