import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { FileText, Trash2, Upload } from 'lucide-react'
import { useAppData } from '../context/AppDataContext'
import NovoMaterialModal from '../components/NovoMaterialModal'
import './Materiais.css'

function formatarTamanho(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function Materiais() {
  const { materiais, abrirMaterial, removerMaterial } = useAppData()
  const [modalAberto, setModalAberto] = useState(false)
  const [filtro, setFiltro] = useState(null)

  const categorias = useMemo(() => {
    const contagem = new Map()
    for (const m of materiais) {
      contagem.set(m.categoria, (contagem.get(m.categoria) ?? 0) + 1)
    }
    return [...contagem.entries()]
  }, [materiais])

  const materiaisFiltrados = filtro ? materiais.filter((m) => m.categoria === filtro) : materiais

  const grupos = useMemo(() => {
    const mapa = new Map()
    for (const m of materiaisFiltrados) {
      if (!mapa.has(m.categoria)) mapa.set(m.categoria, [])
      mapa.get(m.categoria).push(m)
    }
    return [...mapa.entries()]
  }, [materiaisFiltrados])

  return (
    <div className="materiais-page">
      <div className="page-heading page-heading-row">
        <div>
          <h2>Materiais e métodos</h2>
          <p>Organize partituras, métodos e apoio didático por categoria</p>
        </div>
        <button className="btn-adicionar" onClick={() => setModalAberto(true)}>
          <Upload size={16} strokeWidth={2} /> Adicionar material
        </button>
      </div>

      {categorias.length > 0 && (
        <div className="categoria-filtros">
          <button className={'categoria-chip' + (filtro === null ? ' active' : '')} onClick={() => setFiltro(null)}>
            Todos <span>{materiais.length}</span>
          </button>
          {categorias.map(([nome, qtd]) => (
            <button
              key={nome}
              className={'categoria-chip' + (filtro === nome ? ' active' : '')}
              onClick={() => setFiltro(nome)}
            >
              {nome} <span>{qtd}</span>
            </button>
          ))}
        </div>
      )}

      {materiais.length === 0 ? (
        <div className="materiais-dropzone" onClick={() => setModalAberto(true)}>
          <FileText size={32} strokeWidth={1.4} />
          <p>Nenhum material ainda. Clique para anexar seu primeiro PDF ou método.</p>
        </div>
      ) : (
        grupos.map(([categoria, itens]) => (
          <div key={categoria} className="materiais-grupo">
            <p className="materiais-grupo-titulo">{categoria}</p>
            <div className="materiais-grid">
              {itens.map((m) => (
                <div key={m.id} className="material-card">
                  <div className="material-icon">
                    <FileText size={22} strokeWidth={1.5} />
                  </div>
                  <div className="material-info">
                    <p className="material-nome" title={m.nome}>{m.nome}</p>
                    <p className="material-meta">
                      {formatarTamanho(m.tamanho)} · {format(new Date(m.criadoEm), 'dd/MM/yyyy', { locale: ptBR })}
                    </p>
                    {m.tag && <span className="material-tag">{m.tag}</span>}
                  </div>
                  <div className="material-actions">
                    <button className="material-abrir" onClick={() => abrirMaterial(m.id)}>Abrir</button>
                    <button className="material-remover" onClick={() => removerMaterial(m.id)} aria-label="Remover">
                      <Trash2 size={15} strokeWidth={1.7} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {modalAberto && <NovoMaterialModal onClose={() => setModalAberto(false)} />}
    </div>
  )
}
