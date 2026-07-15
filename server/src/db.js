import { PrismaClient } from '@prisma/client'

// Reaproveita a mesma instância entre invocações da função serverless (evita esgotar conexões do banco)
const global_ = globalThis

export const prisma = global_.__prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') {
  global_.__prisma = prisma
}
