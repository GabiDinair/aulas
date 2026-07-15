// Ponto de entrada usado apenas em desenvolvimento local (fora do Vercel).
// Na Vercel, "api/index.js" importa "app.js" diretamente como função serverless.
import app from './app.js'

const PORT = process.env.PORT || 4000
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`)
})
