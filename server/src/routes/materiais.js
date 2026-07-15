import { Router } from 'express'
import multer from 'multer'
import { put, del } from '@vercel/blob'
import { prisma } from '../db.js'
import { autenticar } from '../middleware/auth.js'
import { asyncHandler } from '../lib/asyncHandler.js'

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } })

const router = Router()

function serializarMaterial(m) {
  return {
    id: m.id,
    nome: m.nome,
    tamanho: m.tamanho,
    tipo: m.tipo,
    categoria: m.categoria,
    tag: m.tag,
    criadoEm: m.criadoEm,
  }
}

router.get(
  '/',
  autenticar,
  asyncHandler(async (req, res) => {
    const materiais = await prisma.material.findMany({
      where: { professorId: req.professorId },
      orderBy: { criadoEm: 'desc' },
    })
    res.json(materiais.map(serializarMaterial))
  })
)

router.post(
  '/',
  autenticar,
  upload.single('arquivo'),
  asyncHandler(async (req, res) => {
    if (!req.file) return res.status(400).json({ erro: 'Nenhum arquivo enviado.' })

    const nomeSeguro = req.file.originalname.replace(/[^\w.\-]+/g, '_')
    const blob = await put(`materiais/${req.professorId}/${Date.now()}-${nomeSeguro}`, req.file.buffer, {
      access: 'public',
      contentType: req.file.mimetype,
    })

    const material = await prisma.material.create({
      data: {
        professorId: req.professorId,
        nome: req.file.originalname,
        tamanho: req.file.size,
        tipo: req.file.mimetype,
        categoria: req.body.categoria || 'Sem categoria',
        tag: req.body.tag || '',
        caminhoArquivo: blob.url,
      },
    })

    res.status(201).json(serializarMaterial(material))
  })
)

router.get(
  '/:id/arquivo',
  autenticar,
  asyncHandler(async (req, res) => {
    const material = await prisma.material.findUnique({ where: { id: req.params.id } })
    if (!material || material.professorId !== req.professorId) return res.status(404).end()
    res.redirect(material.caminhoArquivo)
  })
)

router.delete(
  '/:id',
  autenticar,
  asyncHandler(async (req, res) => {
    const material = await prisma.material.findUnique({ where: { id: req.params.id } })
    if (!material || material.professorId !== req.professorId) {
      return res.status(404).json({ erro: 'Material não encontrado.' })
    }

    await prisma.material.delete({ where: { id: material.id } })
    await del(material.caminhoArquivo).catch(() => {})
    res.status(204).end()
  })
)

export default router
