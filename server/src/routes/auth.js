import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from '../db.js'
import { autenticar } from '../middleware/auth.js'

const router = Router()

function gerarToken(professor) {
  return jwt.sign({ sub: professor.id }, process.env.JWT_SECRET, { expiresIn: '30d' })
}

function serializarProfessor(professor) {
  return {
    id: professor.id,
    nome: professor.nome,
    email: professor.email,
    titulo: professor.titulo,
    instrumento: professor.instrumento,
  }
}

router.post('/registrar', async (req, res) => {
  const { nome, email, senha, instrumento } = req.body ?? {}
  if (!nome?.trim() || !email?.trim() || !senha || senha.length < 6) {
    return res.status(400).json({ erro: 'Preencha nome, email e uma senha com pelo menos 6 caracteres.' })
  }

  const emailNormalizado = email.trim().toLowerCase()
  const existente = await prisma.professor.findUnique({ where: { email: emailNormalizado } })
  if (existente) {
    return res.status(409).json({ erro: 'Já existe uma conta com este email.' })
  }

  const instrumentoFinal = instrumento?.trim() || 'Violino'
  const senhaHash = await bcrypt.hash(senha, 10)
  const professor = await prisma.professor.create({
    data: {
      nome: nome.trim(),
      email: emailNormalizado,
      senhaHash,
      instrumento: instrumentoFinal,
      titulo: `Professor(a) de ${instrumentoFinal}`,
    },
  })

  res.status(201).json({ token: gerarToken(professor), professor: serializarProfessor(professor) })
})

router.post('/login', async (req, res) => {
  const { email, senha } = req.body ?? {}
  if (!email?.trim() || !senha) {
    return res.status(400).json({ erro: 'Informe email e senha.' })
  }

  const professor = await prisma.professor.findUnique({ where: { email: email.trim().toLowerCase() } })
  if (!professor) {
    return res.status(401).json({ erro: 'Email ou senha incorretos.' })
  }

  const senhaCorreta = await bcrypt.compare(senha, professor.senhaHash)
  if (!senhaCorreta) {
    return res.status(401).json({ erro: 'Email ou senha incorretos.' })
  }

  res.json({ token: gerarToken(professor), professor: serializarProfessor(professor) })
})

router.get('/me', autenticar, async (req, res) => {
  const professor = await prisma.professor.findUnique({ where: { id: req.professorId } })
  if (!professor) return res.status(404).json({ erro: 'Professor não encontrado' })
  res.json({ professor: serializarProfessor(professor) })
})

export default router
