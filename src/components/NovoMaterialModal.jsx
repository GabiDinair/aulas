import { useMemo, useState } from 'react'
import { Upload } from 'lucide-react'
import Modal from './Modal'
import { useAppData } from '../context/AppDataContext'
import { CATEGORIAS_MATERIAL_PADRAO, TAGS_MATERIAL_SUGERIDAS } from '../data/helpers'

const OUTRA = '__outra__'

export default function NovoMaterialModal({ onClose }) {
  const { materiais, adicionarMateriais } = useAppData()

  const categoriasExistentes = useMemo(() => {
    const usadas = materiais.map((m) => m.categoria).filter(Boolean)
    return [...new Set([...CATEGORIAS_MATERIAL_PADRAO, ...usadas])]
  }, [materiais])

  const [categoria, setCategoria] = useState(categoriasExistentes[0] ?? OUTRA)
  const [categoriaCustom, setCategoriaCustom] = useState('')
  const [tag, setTag] = useState('')
  const [arquivos, setArquivos] = useState([])

  function handleSubmit(e) {
    e.preventDefault()
    if (arquivos.length === 0) return
    const categoriaFinal = categoria === OUTRA ? categoriaCustom.trim() || 'Sem categoria' : categoria
    adicionarMateriais(arquivos, { categoria: categoriaFinal, tag: tag.trim() })
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
          <span>Estilo / tag (opcional)</span>
          <input
            type="text"
            list="tags-sugeridas"
            placeholder="Ex: Clássica, Popular, Suzuki..."
            value={tag}
            onChange={(e) => setTag(e.target.value)}
          />
          <datalist id="tags-sugeridas">
            {TAGS_MATERIAL_SUGERIDAS.map((t) => (
              <option key={t} value={t} />
            ))}
          </datalist>
        </label>

        <label className="form-field">
          <span>Arquivo(s)</span>
          <input
            type="file"
            accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
            multiple
            onChange={(e) => setArquivos(Array.from(e.target.files ?? []))}
            required
          />
        </label>

        <button type="submit" className="modal-submit">
          <Upload size={16} strokeWidth={2} style={{ marginRight: 6, verticalAlign: -3 }} />
          Adicionar material
        </button>
      </form>
    </Modal>
  )
}
