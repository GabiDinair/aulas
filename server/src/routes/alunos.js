import { Router } from 'express'
import { prisma } from '../db.js'
import { autenticar } from '../middleware/auth.js'
import { asyncHandler } from '../lib/asyncHandler.js'
import { formatarData } from '../lib/agenda.js'

const router = Router()

router.get(
  '/',
  autenticar,
  asyncHandler(async (req, res) => {
    const alunos = await prisma.aluno.findMany({
      where: { professorId: req.professorId },
      orderBy: { criadoEm: 'asc' },
    })
    res.json(alunos)
  })
)

router.post(
  '/',
  autenticar,
  asyncHandler(async (req, res) => {
    const {
      turmaId,
      nome,
      nascimento,
      nivel,
      inicioViolino,
      telefone,
      diaSemana,
      horario,
      local,
      frequencia,
      quinzenaOffset,
      mensalidade,
    } = req.body ?? {}

    if (!nome?.trim() || !nascimento) {
      return res.status(400).json({ erro: 'Preencha nome e data de nascimento.' })
    }

    if (turmaId) {
      const turma = await prisma.turma.findUnique({ where: { id: turmaId } })
      if (!turma || turma.professorId !== req.professorId) {
        return res.status(404).json({ erro: 'Turma não encontrada.' })
      }
    } else if (diaSemana === undefined || !horario) {
      return res.status(400).json({ erro: 'Informe o dia da semana e o horário do aluno individual.' })
    }

    const aluno = await prisma.aluno.create({
      data: {
        professorId: req.professorId,
        turmaId: turmaId || null,
        nome: nome.trim(),
        nascimento,
        nivel: nivel || 'Iniciante',
        progresso: 0,
        inicioViolino: inicioViolino || null,
        inicioAulas: formatarData(new Date()),
        telefone: telefone || null,
        diaSemana: turmaId ? null : Number(diaSemana),
        horario: turmaId ? null : horario,
        local: turmaId ? null : local?.trim() || 'A definir',
        frequencia: turmaId ? null : frequencia === 'quinzenal' ? 'quinzenal' : 'semanal',
        quinzenaOffset: turmaId ? null : Number(quinzenaOffset) || 0,
        mensalidade: turmaId ? null : Number(mensalidade) || 0,
      },
    })

    res.status(201).json(aluno)
  })
)

export default router
