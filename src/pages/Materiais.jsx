import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronRight, FileText, Folder, Trash2, Upload } from 'lucide-react'
import { useAppData } from '../context/AppDataContext'
import { pastasDaCategoria } from '../data/helpers'
import NovoMaterialModal from '../components/NovoMaterialModal'
import './Materiais.css'

function formatarTamanho(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function ArquivoCard({ m, abrirMaterial, removerMaterial }) {
  return (
    <div className="material-card">
      <div className="material-icon">
        <FileText size={22} strokeWidth={1.5} />
      </div>
      <div className="material-info">
        <p className="material-nome" title={m.nome}>{m.nome}</p>
        <p className="material-meta">
          {formatarTamanho(m.tamanho)} · {format(new Date(m.criadoEm), 'dd/MM/yyyy', { locale: ptBR })}
        </p>
      </div>
      <div className="material-actions">
        <button className="material-abrir" onClick={() => abrirMaterial(m.id)}>Abrir</button>
        <button className="material-remover" onClick={() => removerMaterial(m.id)} aria-label="Remover">
          <Trash2 size={15} strokeWidth={1.7} />
        </button>
      </div>
    </div>
  )
}

export default function Materiais() {
  const { materiais, abrirMaterial, removerMaterial } = useAppData()
  const [modalAberto, setModalAberto] = useState(false)
  const [categoriaAberta, setCategoriaAberta] = useState(null)
  const [pastaAberta, setPastaAberta] = useState(null)

  const categorias = useMemo(() => {
    const contagem = new Map()
    for (const m of materiais) {
      contagem.set(m.categoria, (contagem.get(m.categoria) ?? 0) + 1)
    }
    return [...contagem.entries()]
  }, [materiais])

  const pastas = useMemo(
    () => (categoriaAberta ? pastasDaCategoria(materiais, categoriaAberta) : []),
    [materiais, categoriaAberta]
  )

  const arquivosSoltos = useMemo(
    () => (categoriaAberta ? materiais.filter((m) => m.categoria === categoriaAberta && !m.tag) : []),
    [materiais, categoriaAberta]
  )

  const arquivosDaPasta = useMemo(
    () =>
      categoriaAberta && pastaAberta
        ? materiais.filter((m) => m.categoria === categoriaAberta && m.tag === pastaAberta)
        : [],
    [materiais, categoriaAberta, pastaAberta]
  )

  function abrirCategoria(nome) {
    setCategoriaAberta(nome)
    setPastaAberta(null)
  }

  function voltarParaCategorias() {
    setCategoriaAberta(null)
    setPastaAberta(null)
  }

  return (
    <div className="materiais-page">
      <div className="page-heading page-heading-row">
        <div>
          <h2>Materiais e métodos</h2>
          <p>Organize partituras, métodos e apoio didático em categorias e pastas</p>
        </div>
        <button className="btn-adicionar" onClick={() => setModalAberto(true)}>
          <Upload size={16} strokeWidth={2} /> Adicionar material
        </button>
      </div>

      {categoriaAberta && (
        <div className="materiais-breadcrumb">
          <button onClick={voltarParaCategorias}>Materiais</button>
          <ChevronRight size={13} strokeWidth={2} />
          {pastaAberta ? (
            <>
              <button onClick={() => setPastaAberta(null)}>{categoriaAberta}</button>
              <ChevronRight size={13} strokeWidth={2} />
              <span>{pastaAberta}</span>
            </>
          ) : (
            <span>{categoriaAberta}</span>
          )}
        </div>
      )}

      {materiais.length === 0 && (
        <div className="materiais-dropzone" onClick={() => setModalAberto(true)}>
          <FileText size={32} strokeWidth={1.4} />
          <p>Nenhum material ainda. Clique para anexar seu primeiro PDF ou método.</p>
        </div>
      )}

      {materiais.length > 0 && !categoriaAberta && (
        <div className="pastas-grid">
          {categorias.map(([nome, qtd]) => (
            <button key={nome} className="pasta-card" onClick={() => abrirCategoria(nome)}>
              <div className="pasta-card-icon">
                <Folder size={22} strokeWidth={1.5} />
              </div>
              <div>
                <p className="pasta-card-nome">{nome}</p>
                <p className="pasta-card-qtd">{qtd} arquivo{qtd === 1 ? '' : 's'}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {categoriaAberta && !pastaAberta && (
        <>
          {pastas.length > 0 && (
            <div className="materiais-grupo">
              <p className="materiais-grupo-titulo">Pastas</p>
              <div className="pastas-grid">
                {pastas.map(([nome, qtd]) => (
                  <button key={nome} className="pasta-card" onClick={() => setPastaAberta(nome)}>
                    <div className="pasta-card-icon">
                      <Folder size={22} strokeWidth={1.5} />
                    </div>
                    <div>
                      <p className="pasta-card-nome">{nome}</p>
                      <p className="pasta-card-qtd">{qtd} arquivo{qtd === 1 ? '' : 's'}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="materiais-grupo">
            {pastas.length > 0 && <p className="materiais-grupo-titulo">Arquivos soltos</p>}
            {arquivosSoltos.length === 0 ? (
              pastas.length === 0 && (
                <div className="day-panel-empty">
                  <p>Nenhum arquivo nessa categoria ainda.</p>
                </div>
              )
            ) : (
              <div className="materiais-grid">
                {arquivosSoltos.map((m) => (
                  <ArquivoCard key={m.id} m={m} abrirMaterial={abrirMaterial} removerMaterial={removerMaterial} />
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {categoriaAberta && pastaAberta && (
        <div className="materiais-grid">
          {arquivosDaPasta.map((m) => (
            <ArquivoCard key={m.id} m={m} abrirMaterial={abrirMaterial} removerMaterial={removerMaterial} />
          ))}
        </div>
      )}

      {modalAberto && (
        <NovoMaterialModal
          onClose={() => setModalAberto(false)}
          categoriaPadrao={categoriaAberta ?? undefined}
          pastaPadrao={pastaAberta ?? undefined}
        />
      )}
    </div>
  )
}
