import { type ReactNode } from 'react'

export function Card({ children, className = '', style = {} }: { children: ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <div className={className} style={{
      background: 'var(--card)',
      border: '1px solid var(--border)',
      borderRadius: 8,
      ...style,
    }}>
      {children}
    </div>
  )
}

export function CardHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '14px 16px 12px',
      borderBottom: '1px solid var(--border)',
    }}>
      <div>
        <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--foreground)' }}>{title}</div>
        {subtitle && <div style={{ fontSize: 11, color: 'var(--muted-foreground)', marginTop: 1 }}>{subtitle}</div>}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}

export function StatCard({ label, value, sub, color = '#2563eb', icon }: {
  label: string; value: string | number; sub?: string; color?: string; icon?: ReactNode
}) {
  return (
    <Card style={{ padding: '14px 16px' }}>
      <div className="flex items-start justify-between">
        <div>
          <div style={{ fontSize: 11, color: 'var(--muted-foreground)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{label}</div>
          <div style={{ fontSize: 26, fontWeight: 700, color: color, lineHeight: 1 }}>{value}</div>
          {sub && <div style={{ fontSize: 11, color: 'var(--muted-foreground)', marginTop: 4 }}>{sub}</div>}
        </div>
        {icon && (
          <div style={{
            width: 36, height: 36, borderRadius: 8,
            background: color + '15',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: color,
          }}>
            {icon}
          </div>
        )}
      </div>
    </Card>
  )
}

export function Badge({ label, variant = 'default' }: { label: string; variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'draft' }) {
  const styles: Record<string, React.CSSProperties> = {
    default: { background: 'var(--muted)', color: 'var(--muted-foreground)' },
    success: { background: '#dcfce7', color: '#166534' },
    warning: { background: '#fef9c3', color: '#854d0e' },
    error: { background: '#fee2e2', color: '#991b1b' },
    info: { background: '#dbeafe', color: '#1e40af' },
    draft: { background: '#f1f5f9', color: '#475569' },
  }
  return (
    <span style={{
      ...styles[variant],
      fontSize: 10, fontWeight: 600,
      padding: '2px 8px', borderRadius: 20,
      letterSpacing: '0.04em', whiteSpace: 'nowrap',
    }}>
      {label}
    </span>
  )
}

export function ProgressBar({ value, color = '#2563eb', label }: { value: number; color?: string; label?: string }) {
  return (
    <div>
      {label && (
        <div className="flex justify-between" style={{ marginBottom: 4 }}>
          <span style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>{label}</span>
          <span style={{ fontSize: 11, fontWeight: 600, color }}>{value}%</span>
        </div>
      )}
      <div style={{ height: 6, background: 'var(--muted)', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ width: `${value}%`, height: '100%', background: color, borderRadius: 4, transition: 'width 0.3s' }} />
      </div>
    </div>
  )
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 style={{
      fontSize: 11, fontWeight: 700, color: 'var(--muted-foreground)',
      textTransform: 'uppercase', letterSpacing: '0.08em',
      marginBottom: 10,
    }}>
      {children}
    </h2>
  )
}

export function Btn({ children, variant = 'primary', color, small, onClick }: {
  children: ReactNode; variant?: 'primary' | 'secondary' | 'ghost'; color?: string; small?: boolean; onClick?: () => void
}) {
  const base: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 5,
    borderRadius: 5, cursor: 'pointer', fontWeight: 600, border: '1px solid transparent',
    fontSize: small ? 11 : 12, padding: small ? '4px 10px' : '6px 14px',
    transition: 'all 0.1s',
  }
  const variants: Record<string, React.CSSProperties> = {
    primary: { background: color || 'var(--accent)', color: 'white', borderColor: 'transparent' },
    secondary: { background: 'var(--secondary)', color: 'var(--secondary-foreground)', borderColor: 'var(--border)' },
    ghost: { background: 'transparent', color: 'var(--muted-foreground)', borderColor: 'transparent' },
  }
  return <button style={{ ...base, ...variants[variant] }} onClick={onClick}>{children}</button>
}

export function TableRow({ cells, highlight }: { cells: (string | ReactNode)[]; highlight?: boolean }) {
  return (
    <tr style={{ background: highlight ? 'var(--muted)' : 'transparent', borderBottom: '1px solid var(--border)' }}>
      {cells.map((cell, i) => (
        <td key={i} style={{ padding: '9px 12px', fontSize: 12, color: 'var(--foreground)', whiteSpace: 'nowrap' }}>
          {cell}
        </td>
      ))}
    </tr>
  )
}

export function Table({ headers, rows }: { headers: string[]; rows: (string | ReactNode)[][] }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border)' }}>
            {headers.map((h, i) => (
              <th key={i} style={{
                padding: '8px 12px', textAlign: 'left',
                fontSize: 11, fontWeight: 700, color: 'var(--muted-foreground)',
                textTransform: 'uppercase', letterSpacing: '0.06em',
                background: 'var(--muted)',
              }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => <TableRow key={i} cells={row} />)}
        </tbody>
      </table>
    </div>
  )
}

export function Timeline({ steps, active }: { steps: string[]; active: number }) {
  return (
    <div className="flex items-center gap-0" style={{ width: '100%' }}>
      {steps.map((step, i) => {
        const done = i < active
        const current = i === active
        return (
          <div key={i} className="flex items-center" style={{ flex: 1 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, minWidth: 0 }}>
              <div style={{
                width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                background: done ? '#059669' : current ? '#2563eb' : 'var(--muted)',
                border: `2px solid ${done ? '#059669' : current ? '#2563eb' : 'var(--border)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {done && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                )}
                {current && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'white' }} />}
              </div>
              <span style={{ fontSize: 10, fontWeight: current ? 700 : 500, color: current ? '#2563eb' : done ? '#059669' : 'var(--muted-foreground)', textAlign: 'center', maxWidth: 70 }}>{step}</span>
            </div>
            {i < steps.length - 1 && (
              <div style={{ flex: 1, height: 2, background: done ? '#059669' : 'var(--border)', marginBottom: 18 }} />
            )}
          </div>
        )
      })}
    </div>
  )
}
