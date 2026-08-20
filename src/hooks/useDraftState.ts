import { useEffect, useState } from 'react'

/**
 * Estado de formulário persistido em localStorage sob `key`.
 * Sobrevive a recarga de página (aba descartada pelo navegador, F5 acidental, etc.).
 * Chame `clearDraft()` após salvar com sucesso para não reaproveitar dados antigos.
 */
export function useDraftState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key)
      if (!stored) return initial
      const parsed = JSON.parse(stored)
      // Só aceita chaves que existem no formulário atual — evita reaproveitar
      // campos de um rascunho salvo antes de uma mudança no formato dos dados.
      const merged = { ...initial }
      for (const k of Object.keys(initial as object)) {
        if (k in parsed) (merged as Record<string, unknown>)[k] = parsed[k]
      }
      return merged
    } catch {
      return initial
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // localStorage indisponível (modo privado etc.) — segue sem persistir
    }
  }, [key, value])

  function clearDraft() {
    localStorage.removeItem(key)
  }

  return [value, setValue, clearDraft] as const
}
