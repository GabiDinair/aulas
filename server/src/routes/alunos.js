import { Router } from 'express'
import { prisma } from '../db.js'
import { autenticar } from '../middleware/auth.js'
import { asyncHandler } from '../lib/asyncHandler.js'
import { formatarData } from '../lib/agenda.js'

const router = Router()

async function buscarAlunoDoProfessor(id, professorId) {
  const aluno = await prisma.aluno.findUnique({ where: { id } })
  if (!aluno || aluno.professorId !== professorId) return null
  return aluno
}

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
      inicioAulas,
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
        inicioAulas: inicioAulas || formatarData(new Date()),
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

router.patch(
  '/:id',
  autenticar,
  asyncHandler(async (req, res) => {
    const aluno = await buscarAlunoDoProfessor(req.params.id, req.professorId)
    if (!aluno) return res.status(404).json({ erro: 'Aluno não encontrado.' })

    const {
      turmaId,
      nome,
      nascimento,
      nivel,
      progresso,
      inicioAulas,
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

    const eraIndividual = !aluno.turmaId
    const seraIndividual = !turmaId
    if (eraIndividual !== seraIndividual) {
      return res.status(400).json({
        erro: 'Não é possível trocar entre aluno individual e aluno de turma por aqui. Exclua e cadastre de novo nesse caso.',
      })
    }

    const dados = {
      nome: nome.trim(),
      nascimento,
      nivel: nivel || aluno.nivel,
      progresso: progresso !== undefined ? Number(progresso) : aluno.progresso,
      inicioAulas: inicioAulas || aluno.inicioAulas,
      telefone: telefone || null,
    }

    const hojeStr = formatarData(new Date())

    if (turmaId) {
      const turma = await prisma.turma.findUnique({ where: { id: turmaId } })
      if (!turma || turma.professorId !== req.professorId) {
        return res.status(404).json({ erro: 'Turma não encontrada.' })
      }
      dados.turmaId = turmaId
    } else {
      if (diaSemana === undefined || !horario) {
        return res.status(400).json({ erro: 'Informe o dia da semana e o horário do aluno individual.' })
      }
      const novoDiaSemana = Number(diaSemana)
      const novaFrequencia = frequencia === 'quinzenal' ? 'quinzenal' : 'semanal'
      const novoOffset = Number(quinzenaOffset) || 0
      const mudouPadrao =
        novoDiaSemana !== aluno.diaSemana || novaFrequencia !== aluno.frequencia || novoOffset !== aluno.quinzenaOffset

      dados.diaSemana = novoDiaSemana
      dados.horario = horario
      dados.local = local?.trim() || 'A definir'
      dados.frequencia = novaFrequencia
      dados.quinzenaOffset = novoOffset
      dados.mensalidade = Number(mensalidade) || 0

      if (mudouPadrao) {
        await prisma.aula.deleteMany({
          where: { alunoId: aluno.id, date: { gt: hojeStr }, status: { in: ['confirmada', 'pendente'] } },
        })
      } else {
        await prisma.aula.updateMany({
          where: { alunoId: aluno.id, date: { gt: hojeStr }, status: { not: 'cancelada' } },
          data: { horario },
        })
      }
    }

    const atualizado = await prisma.aluno.update({ where: { id: aluno.id }, data: dados })
    res.json(atualizado)
  })
)

router.delete(
  '/:id',
  autenticar,
  asyncHandler(async (req, res) => {
    const aluno = await buscarAlunoDoProfessor(req.params.id, req.professorId)
    if (!aluno) return res.status(404).json({ erro: 'Aluno não encontrado.' })

    await prisma.aluno.delete({ where: { id: aluno.id } })
    res.status(204).end()
  })
)

export default router
