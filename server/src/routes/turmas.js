import { Router } from 'express'
import { prisma } from '../db.js'
import { autenticar } from '../middleware/auth.js'
import { asyncHandler } from '../lib/asyncHandler.js'
import { formatarData } from '../lib/agenda.js'

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

async function buscarTurmaDoProfessor(id, professorId) {
  const turma = await prisma.turma.findUnique({ where: { id } })
  if (!turma || turma.professorId !== professorId) return null
  return turma
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

router.patch(
  '/:id',
  autenticar,
  asyncHandler(async (req, res) => {
    const turma = await buscarTurmaDoProfessor(req.params.id, req.professorId)
    if (!turma) return res.status(404).json({ erro: 'Turma não encontrada.' })

    const { nome, diaSemana, horario, duracao, local, cor, frequencia, quinzenaOffset, mensalidade } = req.body ?? {}

    if (!nome?.trim() || !local?.trim() || diaSemana === undefined || !horario || !duracao) {
      return res.status(400).json({ erro: 'Preencha nome, dia da semana, horário, duração e local.' })
    }

    const novoDiaSemana = Number(diaSemana)
    const novoHorario = horario
    const novaDuracao = Number(duracao)
    const novaFrequencia = frequencia === 'quinzenal' ? 'quinzenal' : 'semanal'
    const novoOffset = Number(quinzenaOffset) || 0

    const mudouPadrao =
      novoDiaSemana !== turma.diaSemana || novaFrequencia !== turma.frequencia || novoOffset !== turma.quinzenaOffset

    const atualizada = await prisma.turma.update({
      where: { id: turma.id },
      data: {
        nome: nome.trim(),
        diaSemana: novoDiaSemana,
        horario: novoHorario,
        duracao: novaDuracao,
        local: local.trim(),
        cor: cor || turma.cor,
        frequencia: novaFrequencia,
        quinzenaOffset: novoOffset,
        mensalidade: Number(mensalidade) || 0,
      },
    })

    const hojeStr = formatarData(new Date())

    if (mudouPadrao) {
      // O dia/frequência mudou: apaga as próximas aulas ainda não concluídas/canceladas
      // pra que sejam geradas de novo no padrão certo na próxima consulta da agenda.
      await prisma.aula.deleteMany({
        where: { turmaId: turma.id, date: { gt: hojeStr }, status: { in: ['confirmada', 'pendente'] } },
      })
    } else {
      await prisma.aula.updateMany({
        where: { turmaId: turma.id, date: { gt: hojeStr }, status: { not: 'cancelada' } },
        data: { horario: novoHorario, duracao: novaDuracao },
      })
    }

    res.json(serializarTurma(atualizada))
  })
)

router.delete(
  '/:id',
  autenticar,
  asyncHandler(async (req, res) => {
    const turma = await buscarTurmaDoProfessor(req.params.id, req.professorId)
    if (!turma) return res.status(404).json({ erro: 'Turma não encontrada.' })

    const qtdAlunos = await prisma.aluno.count({ where: { turmaId: turma.id } })
    if (qtdAlunos > 0) {
      return res.status(400).json({
        erro: 'Esta turma ainda tem alunos vinculados. Remova ou mova os alunos antes de excluir a turma.',
      })
    }

    await prisma.turma.delete({ where: { id: turma.id } })
    res.status(204).end()
  })
)

export default router
