function apenasDigitos(str) {
  return (str || '').replace(/\D/g, '').slice(0, 11)
}

function formatarTelefone(digitos) {
  const ddd = digitos.slice(0, 2)
  const nono = digitos.slice(2, 3)
  const resto = digitos.slice(3, 11)
  return [ddd, nono, resto].filter(Boolean).join(' ')
}

// Input estilo "maquininha", igual ao de dinheiro: dígitos entram e se organizam em DDD, 9 e número
export default function CampoTelefone({ value, onChange, placeholder, id }) {
  function handleChange(e) {
    onChange(formatarTelefone(apenasDigitos(e.target.value)))
  }

  return (
    <input
      id={id}
      type="tel"
      inputMode="numeric"
      placeholder={placeholder ?? '61 9 84913140'}
      value={value ?? ''}
      onChange={handleChange}
    />
  )
}
