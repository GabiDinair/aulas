import { useEffect, useMemo, useRef, useState } from 'react'
import { Upload } from 'lucide-react'
import Modal from './Modal'
import { useAppData } from '../context/AppDataContext'
import { CATEGORIAS_MATERIAL_PADRAO, pastasDaCategoria } from '../data/helpers'

const OUTRA = '__outra__'
const SEM_PASTA = '__sem_pasta__'

export default function NovoMaterialModal({ onClose, categoriaPadrao, pastaPadrao }) {
  const { materiais, adicionarMateriais } = useAppData()
  const inputRef = useRef(null)

  const categoriasExistentes = useMemo(() => {
    const usadas = materiais.map((m) => m.categoria).filter(Boolean)
    return [...new Set([...CATEGORIAS_MATERIAL_PADRAO, ...usadas])]
  }, [materiais])

  const [categoria, setCategoria] = useState(categoriaPadrao ?? categoriasExistentes[0] ?? OUTRA)
  const [categoriaCustom, setCategoriaCustom] = useState('')
  const [pasta, setPasta] = useState(pastaPadrao ?? SEM_PASTA)
  const [pastaCustom, setPastaCustom] = useState('')
  const [arquivos, setArquivos] = useState([])

  const pastasExistentes = useMemo(
    () => pastasDaCategoria(materiais, categoria).map(([nome]) => nome),
    [materiais, categoria]
  )

  // Se trocar de categoria, a pasta escolhida antes pode não existir mais nessa categoria nova
  useEffect(() => {
    if (pasta !== SEM_PASTA && pasta !== OUTRA && !pastasExistentes.includes(pasta)) {
      setPasta(SEM_PASTA)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoria])

  function handleSubmit(e) {
    e.preventDefault()
    if (arquivos.length === 0) return
    const categoriaFinal = categoria === OUTRA ? categoriaCustom.trim() || 'Sem categoria' : categoria
    const pastaFinal = pasta === SEM_PASTA ? '' : pasta === OUTRA ? pastaCustom.trim() : pasta
    adicionarMateriais(arquivos, { categoria: categoriaFinal, tag: pastaFinal })
    onClose()
  }

  return (
    <Modal titulo="Adicionar material" onClose={onClose}>
      <form className="form-grid" onSubmit={handleSubmit}>
        <label className="form-field">
          <span>Categoria</span>
          <select value={categoria} onChange={(e) => setCategoria(e.target.value)}>
            {categoriasExistentes.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
            <option value={OUTRA}>+ Nova categoria...</option>
          </select>
        </label>

        {categoria === OUTRA && (
          <label className="form-field">
            <span>Nome da nova categoria</span>
            <input
              type="text"
              placeholder="Ex: Repertório de recital"
              value={categoriaCustom}
              onChange={(e) => setCategoriaCustom(e.target.value)}
              autoFocus
            />
          </label>
        )}

        <label className="form-field">
          <span>Pasta (opcional, pra agrupar arquivos parecidos)</span>
          <select value={pasta} onChange={(e) => setPasta(e.target.value)}>
            <option value={SEM_PASTA}>Sem pasta — arquivo solto</option>
            {pastasExistentes.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
            <option value={OUTRA}>+ Nova pasta...</option>
          </select>
        </label>

        {pasta === OUTRA && (
          <label className="form-field">
            <span>Nome da nova pasta</span>
            <input
              type="text"
              placeholder="Ex: Canon in D, Escalas..."
              value={pastaCustom}
              onChange={(e) => setPastaCustom(e.target.value)}
              autoFocus
            />
          </label>
        )}

        <label className="form-field">
          <span>Arquivo(s)</span>
          <div className="file-picker">
            <button type="button" className="file-picker-btn" onClick={() => inputRef.current?.click()}>
              Escolher arquivos
            </button>
            <span className="file-picker-nome">
              {arquivos.length > 0 ? arquivos.map((f) => f.name).join(', ') : 'Nenhum arquivo escolhido'}
            </span>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
            multiple
            hidden
            onChange={(e) => setArquivos(Array.from(e.target.files ?? []))}
          />
        </label>

        <button type="submit" className="modal-submit" disabled={arquivos.length === 0}>
          <Upload size={16} strokeWidth={2} style={{ marginRight: 6, verticalAlign: -3 }} />
          Adicionar material
        </button>
      </form>
    </Modal>
  )
}
