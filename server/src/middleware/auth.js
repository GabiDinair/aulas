import jwt from 'jsonwebtoken'

export function autenticar(req, res, next) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ erro: 'Token não informado' })
  }
  const token = header.slice(7)
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    req.professorId = payload.sub
    next()
  } catch {
    return res.status(401).json({ erro: 'Token inválido ou expirado' })
  }
}
