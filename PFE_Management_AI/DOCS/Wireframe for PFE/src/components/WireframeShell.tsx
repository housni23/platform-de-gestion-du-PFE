import { useState, type ReactNode } from 'react'

interface NavItem {
  icon: ReactNode
  label: string
  badge?: number
}

interface WireframeShellProps {
  roleLabel: string
  roleColor: string
  userName: string
  navItems: NavItem[]
  activeNav: number
  onNavChange: (i: number) => void
  children: ReactNode
  notifCount?: number
}

export default function WireframeShell({
  roleLabel, roleColor, userName, navItems, activeNav, onNavChange, children, notifCount = 0
}: WireframeShellProps) {
  const [sidebarOpen] = useState(true)

  return (
    <div className="flex" style={{ height: 'calc(100vh - 44px)' }}>
      {/* Sidebar */}
      <div style={{
        width: sidebarOpen ? 220 : 56,
        background: 'var(--card)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        transition: 'width 0.2s',
      }}>
        {/* User card */}
        <div style={{ padding: '16px 14px 12px', borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2">
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: roleColor + '22',
              border: `2px solid ${roleColor}55`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 700, color: roleColor, flexShrink: 0,
            }}>
              {userName[0]}
            </div>
            {sidebarOpen && (
              <div className="min-w-0">
                <div style={{ fontWeight: 600, fontSize: 12, color: 'var(--foreground)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{userName}</div>
                <div style={{ fontSize: 10, color: roleColor, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{roleLabel}</div>
              </div>
            )}
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '8px 0', overflowY: 'auto' }}>
          {navItems.map((item, i) => (
            <button
              key={i}
              onClick={() => onNavChange(i)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: sidebarOpen ? '8px 14px' : '8px',
                justifyContent: sidebarOpen ? 'flex-start' : 'center',
                background: activeNav === i ? roleColor + '14' : 'transparent',
                borderLeft: activeNav === i ? `3px solid ${roleColor}` : '3px solid transparent',
                cursor: 'pointer',
                border: 'none',
                borderLeftWidth: 3,
                transition: 'all 0.1s',
              }}
            >
              <span style={{ color: activeNav === i ? roleColor : 'var(--muted-foreground)', flexShrink: 0, display: 'flex' }}>
                {item.icon}
              </span>
              {sidebarOpen && (
                <span style={{
                  fontSize: 12.5,
                  fontWeight: activeNav === i ? 600 : 400,
                  color: activeNav === i ? roleColor : 'var(--foreground)',
                  flex: 1,
                  textAlign: 'left',
                }}>
                  {item.label}
                </span>
              )}
              {sidebarOpen && item.badge ? (
                <span style={{
                  background: roleColor,
                  color: 'white',
                  fontSize: 10,
                  fontWeight: 700,
                  borderRadius: 10,
                  padding: '1px 6px',
                  minWidth: 18,
                  textAlign: 'center',
                }}>
                  {item.badge}
                </span>
              ) : null}
            </button>
          ))}
        </nav>

        {/* Footer */}
        {sidebarOpen && (
          <div style={{ padding: '12px 14px', borderTop: '1px solid var(--border)' }}>
            <button style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 8,
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: 'var(--muted-foreground)', fontSize: 12, padding: '4px 0',
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Déconnexion
            </button>
          </div>
        )}
      </div>

      {/* Main area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Top bar */}
        <div style={{
          height: 48,
          background: 'var(--card)',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 20px',
          gap: 12,
          flexShrink: 0,
        }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--foreground)', flex: 1 }}>
            {navItems[activeNav]?.label}
          </div>
          {/* Search */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'var(--muted)', borderRadius: 6, padding: '5px 10px',
            border: '1px solid var(--border)',
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--muted-foreground)" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <span style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>Rechercher...</span>
          </div>
          {/* Notification bell */}
          <div style={{ position: 'relative', cursor: 'pointer' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--muted-foreground)" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            {notifCount > 0 && (
              <span style={{
                position: 'absolute', top: -4, right: -4,
                background: '#ef4444', color: 'white',
                fontSize: 9, fontWeight: 700, borderRadius: '50%',
                width: 14, height: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>{notifCount}</span>
            )}
          </div>
        </div>

        {/* Page content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          {children}
        </div>
      </div>
    </div>
  )
}
