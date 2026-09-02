export type DueTone = 'info' | 'neutral' | 'warning' | 'orange' | 'danger'

export interface DueInfo {
  label: string
  tone: DueTone
}

/** Regra visual de prazo (redesign, seção 12): mais de 5 dias = azul,
 * entre 5 e 2 = neutro, 1 dia = amarelo, hoje = laranja, vencido = vermelho.
 * Vermelho só quando efetivamente atrasado, nunca por "estar perto". */
export function dueDateInfo(expectedDate: string | null, status: string): DueInfo | null {
  if (!expectedDate) return null
  if (status === 'Concluída' || status === 'Cancelada') return null

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(expectedDate + 'T00:00:00')
  const days = Math.round((due.getTime() - today.getTime()) / 86400000)

  if (days < 0) return { label: `${Math.abs(days)} dia${Math.abs(days) > 1 ? 's' : ''} em atraso`, tone: 'danger' }
  if (days === 0) return { label: 'Vence hoje', tone: 'orange' }
  if (days === 1) return { label: 'Amanhã', tone: 'warning' }
  if (days <= 5) return { label: `Faltam ${days} dias`, tone: 'neutral' }
  return { label: `Faltam ${days} dias`, tone: 'info' }
}

export function completionInfo(completedAt: string | null, expectedDate: string | null) {
  if (!completedAt) return null
  const date = completedAt.slice(0, 10)
  if (!expectedDate) return { date, late: false }
  return { date, late: date > expectedDate }
}
