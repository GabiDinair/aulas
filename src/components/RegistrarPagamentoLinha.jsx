import { useState } from 'react'
import { format } from 'date-fns'
import { CheckCircle2, Pencil } from 'lucide-react'
import { avatarDe, formatarMoeda } from '../data/helpers'
import './RegistrarPagamentoLinha.css'

export default function RegistrarPagamentoLinha({ aluno, hoje, onRegistrar }) {
  const [editando, setEditando] = useState(false)
  const [valor, setValor] = useState(aluno.mensalidade)
  const [data, setData] = useState(format(hoje, 'yyyy-MM-dd'))
  const avatar = avatarDe(aluno.id, aluno.nome)

  function marcarComoPago() {
    onRegistrar(aluno.mensalidade, format(hoje, 'yyyy-MM-dd'))
  }

  function confirmarEdicao() {
    onRegistrar(Number(valor) || aluno.mensalidade, data)
    setEditando(false)
  }

  return (
    <div className="pagamento-linha">
      <div className="pagamento-linha-info">
        <div className="mini-avatar-round" style={{ background: avatar.bg, color: avatar.text }}>
          {avatar.iniciais}
        </div>
        <div>
          <p className="pagamento-nome">{aluno.nome}</p>
          <p className="pagamento-sub">{aluno.turmaNome ?? 'Aula particular'}</p>
        </div>
      </div>

      {!editando ? (
        <>
          <span className="pagamento-valor-devido">{formatarMoeda(aluno.mensalidade)}</span>
          <div className="pagamento-linha-actions">
            <button className="btn-mini btn-confirmar" onClick={marcarComoPago}>
              <CheckCircle2 size={14} strokeWidth={1.8} /> Marcar como pago
            </button>
            <button className="icon-btn icon-btn-sm" onClick={() => setEditando(true)} aria-label="Editar valor e data">
              <Pencil size={13} strokeWidth={1.7} />
            </button>
          </div>
        </>
      ) : (
        <div className="pagamento-edicao">
          <input
            type="number"
            min="0"
            step="10"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            className="pagamento-edicao-valor"
          />
          <input type="date" value={data} onChange={(e) => setData(e.target.value)} />
          <button className="btn-mini btn-confirmar" onClick={confirmarEdicao}>Confirmar</button>
          <button className="link-voltar" onClick={() => setEditando(false)}>Voltar</button>
        </div>
      )}
    </div>
  )
}
