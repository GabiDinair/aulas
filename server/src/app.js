import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import express from 'express'
import cors from 'cors'
import { prisma } from './db.js'
import authRoutes from './routes/auth.js'
import turmasRoutes from './routes/turmas.js'
import alunosRoutes from './routes/alunos.js'
import aulasRoutes from './routes/aulas.js'
import pagamentosRoutes from './routes/pagamentos.js'
import materiaisRoutes from './routes/materiais.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const distPath = path.join(__dirname, '..', '..', 'dist')

const app = express()

app.use(cors())
app.use(express.json())

app.get('/api/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`
    res.json({ status: 'ok', banco: 'conectado' })
  } catch (err) {
    res.status(500).json({ status: 'erro', mensagem: err.message })
  }
})

app.use('/api/auth', authRoutes)
app.use('/api/turmas', turmasRoutes)
app.use('/api/alunos', alunosRoutes)
app.use('/api/aulas', aulasRoutes)
app.use('/api/pagamentos', pagamentosRoutes)
app.use('/api/materiais', materiaisRoutes)

// Qualquer rota /api/* não reconhecida cai aqui (em vez de servir o HTML do front)
app.use('/api', (req, res) => {
  res.status(404).json({ erro: 'Rota não encontrada' })
})

// Fora do Vercel (ex: dev local), o próprio Express também serve o build do React (dist/)
const indexHtml = path.join(distPath, 'index.html')
if (fs.existsSync(indexHtml)) {
  app.use(express.static(distPath))
  app.get(/^(?!\/api).*/, (req, res) => {
    res.sendFile(indexHtml)
  })
}

// Handler de erro genérico — captura qualquer exceção não tratada nas rotas
app.use((err, req, res, next) => {
  console.error(err)
  if (res.headersSent) return next(err)
  res.status(500).json({ erro: 'Erro interno do servidor.' })
})

export default app
