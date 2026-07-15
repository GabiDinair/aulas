# Diário de Aulas

Sistema de gestão de aulas de violino — versão de demonstração visual e funcional, sem backend.

## Rodando localmente

```bash
npm install
npm run dev
```

Abre em `http://localhost:5173`. Todos os dados (professora, turmas, alunos, agenda) são mockados em memória em `src/data/mockData.js` e `src/context/AgendaContext.jsx` — nada é persistido ao recarregar a página.

## Estrutura

- `src/pages/Login.jsx` — tela de entrada (login, cadastro, recuperação de senha — apenas visual)
- `src/layouts/AppLayout.jsx` — sidebar e cabeçalho do painel
- `src/pages/Agenda.jsx` + `src/components/DayPanel.jsx` — calendário mensal e detalhe do dia (confirmar/cancelar aula, anotar o que foi trabalhado)
- `src/pages/Turmas.jsx` / `TurmaDetalhe.jsx` — turmas e seus alunos
- `src/pages/Alunos.jsx` + `src/components/AlunoCard.jsx` — alunos individuais e de turmas

## Próximos passos

Este é o primeiro passo (front-end de demonstração). O segundo passo será integrar um backend em Express para persistir professores, turmas, alunos e o histórico de aulas.
