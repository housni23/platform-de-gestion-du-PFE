import type { ReactNode } from 'react'
import { Badge } from './ui'

export function Icon({ symbol }: { symbol: string }) {
  return <span aria-hidden="true" style={{ fontSize: 15 }}>{symbol}</span>
}

export function Field({ label, children, full = false }: { label: string; children: ReactNode; full?: boolean }) {
  return <div className={`field ${full ? 'full' : ''}`}><label>{label}</label>{children}</div>
}

export function Notice({ children, kind = 'info' }: { children: ReactNode; kind?: 'info' | 'error' | 'success' }) {
  return <div className={`callout ${kind === 'info' ? '' : kind}`} role={kind === 'error' ? 'alert' : 'status'}>{children}</div>
}

export function StatusBadge({ status }: { status?: string | null }) {
  const normalized = status || 'Non défini'
  const variant = normalized.includes('Validé') || normalized.includes('Approuv') || normalized === 'Confirmé' || normalized === 'Terminé'
    ? 'success'
    : normalized.includes('Refus') || normalized.includes('Rejet') || normalized.includes('Retard')
      ? 'error'
      : normalized.includes('attente') || normalized.includes('Soumis') || normalized.includes('Modification')
        ? 'warning'
        : normalized.includes('Brouillon') || normalized.includes('faire')
          ? 'draft'
          : 'info'
  return <Badge label={normalized} variant={variant} />
}

export function formatDate(value?: string | null, withTime = false): string {
  if (!value) return 'Non planifiée'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  }).format(date)
}

export function fullName(user?: { first_name?: string; last_name?: string } | null): string {
  return user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : 'Non affecté'
}

export function moneylessSize(size?: number | null): string {
  if (!size) return '—'
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} Ko`
  return `${(size / 1024 / 1024).toFixed(1)} Mo`
}
