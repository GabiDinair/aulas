import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useAuth } from './AuthContext'

const AppDataContext = createContext(null)

export function AppDataProvider({ children }) {
  const { token } = useAuth()
  const hoje = useMemo(() => new Date(), [])

  const [turmas, setTurmas] = useState([])
  const [alunosIndividuais, setAlunosIndividuais] = useState([])
  const [alunosTurma, setAlunosTurma] = useState([])
  const [aulas, setAulas] = useState([])
  const [pagamentos, setPagamentos] = useState([])
  const [materiais, setMateriais] = useState([])
  const [carregando, setCarregando] = useState(true)

  async function chamarApi(caminho, opcoes = {}) {
    const res = await fetch(caminho, {
      ...opcoes,
      headers: { ...(opcoes.headers || {}), Authorization: `Bearer ${token}` },
    })
    if (res.status === 204) return null
    const dados = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(dados.erro || 'Não foi possível completar a ação.')
    return dados
  }

  function separarAlunos(lista) {
    setAlunosIndividuais(lista.filter((a) => !a.turmaId))
    setAlunosTurma(lista.filter((a) => a.turmaId))
  }

  async function recarregarAulas() {
    const aulasResp = await chamarApi('/api/aulas')
    setAulas(aulasResp)
  }

  useEffect(() => {
    if (!token) {
      setTurmas([])
      setAlunosIndividuais([])
      setAlunosTurma([])
      setAulas([])
      setPagamentos([])
      setMateriais([])
      setCarregando(false)
      return
    }

    let cancelado = false
    setCarregando(true)

    Promise.all([
      chamarApi('/api/turmas'),
      chamarApi('/api/alunos'),
      chamarApi('/api/aulas'),
      chamarApi('/api/pagamentos'),
      chamarApi('/api/materiais'),
    ])
      .then(([turmasResp, alunosResp, aulasResp, pagamentosResp, materiaisResp]) => {
        if (cancelado) return
        setTurmas(turmasResp)
        separarAlunos(alunosResp)
        setAulas(aulasResp)
        setPagamentos(pagamentosResp)
        setMateriais(materiaisResp)
      })
      .finally(() => {
        if (!cancelado) setCarregando(false)
      })

    return () => {
      cancelado = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  // --- Aulas / agenda ---
  async function confirmarAula(id) {
    const atualizada = await chamarApi(`/api/aulas/${id}/confirmar`, { method: 'PATCH' })
    setAulas((prev) => prev.map((a) => (a.id === id ? atualizada : a)))
  }

  async function cancelarAula(id, motivo) {
    const atualizada = await chamarApi(`/api/aulas/${id}/cancelar`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ motivo }),
    })
    setAulas((prev) => prev.map((a) => (a.id === id ? atualizada : a)))
  }

  async function reagendarAula(id, novaData, novoHorario) {
    const atualizada = await chamarApi(`/api/aulas/${id}/reagendar`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ novaData, novoHorario }),
    })
    setAulas((prev) =>
      prev.map((a) => (a.id === id ? atualizada : a)).sort((a, b) => (a.date + a.horario).localeCompare(b.date + b.horario))
    )
  }

  async function salvarAnotacoes(id, texto) {
    const atualizada = await chamarApi(`/api/aulas/${id}/anotacoes`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texto }),
    })
    setAulas((prev) => prev.map((a) => (a.id === id ? atualizada : a)))
  }

  async function salvarFaltasTurma(id, faltasAlunos) {
    const atualizada = await chamarApi(`/api/aulas/${id}/faltas`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ faltasAlunos }),
    })
    setAulas((prev) => prev.map((a) => (a.id === id ? atualizada : a)))
  }

  // --- Cadastro de turmas e alunos ---
  async function criarTurma(dados) {
    const nova = await chamarApi('/api/turmas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados),
    })
    setTurmas((prev) => [...prev, nova])
    await recarregarAulas()
    return nova
  }

  async function criarAlunoIndividual(dados) {
    const novo = await chamarApi('/api/alunos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...dados, turmaId: null }),
    })
    setAlunosIndividuais((prev) => [...prev, novo])
    await recarregarAulas()
    return novo
  }

  async function criarAlunoTurma(turmaId, dados) {
    const novo = await chamarApi('/api/alunos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...dados, turmaId }),
    })
    setAlunosTurma((prev) => [...prev, novo])
    return novo
  }

  // --- Materiais ---
  async function adicionarMateriais(arquivos, { categoria, tag } = {}) {
    const novos = []
    for (const arquivo of arquivos) {
      const formData = new FormData()
      formData.append('arquivo', arquivo)
      formData.append('categoria', categoria ?? 'Sem categoria')
      formData.append('tag', tag ?? '')
      const criado = await chamarApi('/api/materiais', { method: 'POST', body: formData })
      novos.push(criado)
    }
    setMateriais((prev) => [...novos, ...prev])
  }

  async function abrirMaterial(id) {
    const res = await fetch(`/api/materiais/${id}/arquivo`, { headers: { Authorization: `Bearer ${token}` } })
    if (!res.ok) throw new Error('Não foi possível abrir o arquivo.')
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')
    setTimeout(() => URL.revokeObjectURL(url), 60000)
  }

  async function removerMaterial(id) {
    await chamarApi(`/api/materiais/${id}`, { method: 'DELETE' })
    setMateriais((prev) => prev.filter((m) => m.id !== id))
  }

  // --- Carteira / pagamentos ---
  async function registrarPagamento(alunoId, mes, valor, dataPagamento) {
    const registro = await chamarApi('/api/pagamentos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ alunoId, mes, valor, dataPagamento }),
    })
    setPagamentos((prev) => {
      const existe = prev.some((p) => p.alunoId === alunoId && p.mes === mes)
      return existe ? prev.map((p) => (p.alunoId === alunoId && p.mes === mes ? registro : p)) : [...prev, registro]
    })
  }

  async function removerPagamento(alunoId, mes) {
    await chamarApi(`/api/pagamentos/${alunoId}/${mes}`, { method: 'DELETE' })
    setPagamentos((prev) => prev.filter((p) => !(p.alunoId === alunoId && p.mes === mes)))
  }

  const value = {
    hoje,
    carregando,
    turmas,
    alunosIndividuais,
    alunosTurma,
    aulas,
    materiais,
    pagamentos,
    registrarPagamento,
    removerPagamento,
    confirmarAula,
    cancelarAula,
    reagendarAula,
    salvarAnotacoes,
    salvarFaltasTurma,
    criarTurma,
    criarAlunoIndividual,
    criarAlunoTurma,
    adicionarMateriais,
    abrirMaterial,
    removerMaterial,
  }

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
}

export function useAppData() {
  const ctx = useContext(AppDataContext)
  if (!ctx) throw new Error('useAppData deve ser usado dentro de um AppDataProvider')
  return ctx
}
