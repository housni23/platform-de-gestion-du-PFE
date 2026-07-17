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
  onNavChange: (index: number) => void
  onLogout: () => void
  children: ReactNode
  notifCount?: number
}

export default function WireframeShell({
  roleLabel, roleColor, userName, navItems, activeNav, onNavChange, onLogout, children, notifCount = 0,
}: WireframeShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  const selectNav = (index: number) => {
    onNavChange(index)
    setMobileOpen(false)
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`}>
        <div className="brand-block">
          <div className="brand-mark" aria-hidden="true">E</div>
          <div>
            <strong>GestPFE</strong>
            <span>ENSA Marrakech</span>
          </div>
        </div>

        <div className="user-card">
          <div className="avatar" style={{ color: roleColor, background: `${roleColor}18`, borderColor: `${roleColor}55` }}>
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="user-copy">
            <strong>{userName}</strong>
            <span style={{ color: roleColor }}>{roleLabel}</span>
          </div>
        </div>

        <nav className="sidebar-nav" aria-label="Navigation principale">
          {navItems.map((item, index) => (
            <button
              key={item.label}
              type="button"
              className={activeNav === index ? 'active' : ''}
              onClick={() => selectNav(index)}
              style={activeNav === index ? { color: roleColor, borderLeftColor: roleColor, background: `${roleColor}12` } : undefined}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
              {item.badge ? <b style={{ background: roleColor }}>{item.badge}</b> : null}
            </button>
          ))}
        </nav>

        <button className="logout-button" type="button" onClick={onLogout}>↪ Déconnexion</button>
      </aside>

      {mobileOpen && <button className="sidebar-backdrop" aria-label="Fermer le menu" onClick={() => setMobileOpen(false)} />}

      <main className="main-panel">
        <header className="topbar">
          <button className="menu-button" type="button" onClick={() => setMobileOpen(true)} aria-label="Ouvrir le menu">☰</button>
          <div>
            <strong>{navItems[activeNav]?.label}</strong>
            <span>Année universitaire 2026–2027</span>
          </div>
          <div className="topbar-spacer" />
          <div className="notification-indicator" title={`${notifCount} notification(s) non lue(s)`}>
            ♢{notifCount > 0 && <b>{notifCount}</b>}
          </div>
        </header>
        <section className="page-content">{children}</section>
      </main>
    </div>
  )
}
