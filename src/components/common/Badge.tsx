import { dueDateInfo } from '../../lib/dueDate'
import './Badge.css'

type Tone = 'success' | 'info' | 'warning' | 'orange' | 'danger' | 'neutral'

const STATUS_TONE: Record<string, Tone> = {
  'Concluída': 'success',
  'Concluído': 'success',
  'Entregue': 'success',
  'Aprovado': 'success',
  'Em andamento': 'info',
  'Em revisão': 'info',
  'Em revisão interna': 'info',
  'Em produção': 'info',
  'Aguardando': 'warning',
  'Aguardando cliente': 'warning',
  'Aguardando aprovação': 'warning',
  'Aguardando terceiro': 'warning',
  'Ajustes solicitados': 'warning',
  'Bloqueado': 'orange',
  'Bloqueadora': 'orange',
  'Em atenção': 'orange',
  'Atrasada': 'danger',
  'Atrasado': 'danger',
  'Vermelho': 'danger',
  'Amarelo': 'warning',
  'Verde': 'success',
  'Não iniciada': 'neutral',
  'Não iniciado': 'neutral',
  'Cancelada': 'neutral',
  'Cancelado': 'neutral',
  'Planejamento': 'neutral',
  'Baixa': 'success',
  'Baixo': 'success',
  'Média': 'warning',
  'Médio': 'warning',
  'Alta': 'danger',
  'Alto': 'danger',
  'Bloqueia minha operação': 'danger',
  'Encerrado': 'neutral',
  'Aberto': 'info',
  'Resolvida': 'success',
}

export function StatusBadge({ status }: { status: string | null | undefined }) {
  if (!status) return <span className="badge badge-neutral">—</span>
  const tone = STATUS_TONE[status] ?? 'neutral'
  return <span className={`badge badge-${tone}`}>{status}</span>
}

export function ResponsibleBadge({ responsible }: { responsible: string | null | undefined }) {
  if (!responsible) return <span className="badge badge-neutral">—</span>
  const tone: Tone = responsible === 'Cliente' ? 'warning' : responsible === 'C.O.R.E.' ? 'info' : 'neutral'
  return <span className={`badge badge-${tone}`}>{responsible}</span>
}

export function ImpactBadge({ impact }: { impact: 'No prazo' | 'Atenção necessária' | 'Cronograma impactado' }) {
  const tone: Tone = impact === 'No prazo' ? 'success' : impact === 'Atenção necessária' ? 'warning' : 'danger'
  return <span className={`badge badge-${tone}`}>{impact}</span>
}

export function DueDateBadge({ expectedDate, status }: { expectedDate: string | null; status: string }) {
  const info = dueDateInfo(expectedDate, status)
  if (!info) return <span className="due-plain">{expectedDate ?? '—'}</span>
  return (
    <span className={`due-badge due-${info.tone}`}>
      {expectedDate} · {info.label}
    </span>
  )
}
