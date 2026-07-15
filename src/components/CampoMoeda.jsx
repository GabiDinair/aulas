import { useState } from 'react'

function centavosParaTexto(centavos) {
  return (centavos / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// Input estilo "maquininha": os dígitos entram pela direita (100 -> R$ 1,00, 22000 -> R$ 220,00)
export default function CampoMoeda({ value, onChange, placeholder, id }) {
  const [centavos, setCentavos] = useState(() => Math.round((value ?? 0) * 100))

  function handleChange(e) {
    const digitos = e.target.value.replace(/\D/g, '').replace(/^0+(?=\d)/, '')
    const novoCentavos = digitos === '' ? 0 : Math.min(Number(digitos), 999999999)
    setCentavos(novoCentavos)
    onChange(novoCentavos / 100)
  }

  return (
    <input
      id={id}
      type="text"
      inputMode="numeric"
      placeholder={placeholder ?? 'R$ 0,00'}
      value={`R$ ${centavosParaTexto(centavos)}`}
      onChange={handleChange}
    />
  )
}
