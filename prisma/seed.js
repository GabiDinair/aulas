import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const email = 'gabriella@exemplo.com'
  const existente = await prisma.professor.findUnique({ where: { email } })
  if (existente) {
    console.log('Professora de exemplo já existe, nada a fazer.')
    return
  }

  const senhaHash = await bcrypt.hash('violino123', 10)
  const professor = await prisma.professor.create({
    data: {
      nome: 'Professora Gabriella',
      titulo: 'Professora de Violino',
      email,
      senhaHash,
    },
  })

  console.log('Professora criada:', professor.email, '(senha: violino123)')
}

main()
  .catch((err) => {
    console.error(err)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
