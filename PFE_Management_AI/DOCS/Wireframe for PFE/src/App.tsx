import { useState } from 'react'
import StudentDashboard from './components/StudentDashboard'
import SupervisorDashboard from './components/SupervisorDashboard'
import DepartmentHeadDashboard from './components/DepartmentHeadDashboard'
import SuperAdminDashboard from './components/SuperAdminDashboard'

type Role = 'student' | 'supervisor' | 'chef' | 'admin'

const ROLES: { id: Role; label: string; sublabel: string; color: string }[] = [
  { id: 'student', label: 'Étudiant', sublabel: 'Espace PFE', color: '#2563eb' },
  { id: 'supervisor', label: 'Encadrant', sublabel: 'Supervision', color: '#059669' },
  { id: 'chef', label: 'Chef de Filière', sublabel: 'Département', color: '#d97706' },
  { id: 'admin', label: 'Super Admin', sublabel: 'Administration', color: '#7c3aed' },
]

export default function App() {
  const [role, setRole] = useState<Role>('student')

  const activeRole = ROLES.find(r => r.id === role)!

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      {/* Top role switcher bar */}
      <div style={{ background: 'var(--primary)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div className="flex items-center gap-0 px-6" style={{ height: '44px' }}>
          <div className="flex items-center gap-2 mr-8">
            <div style={{ width: 22, height: 22, background: 'rgba(255,255,255,0.15)', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>
              </svg>
            </div>
            <span style={{ color: 'white', fontWeight: 700, fontSize: 13, letterSpacing: '0.01em' }}>
              GestPFE
            </span>
          </div>
          <div className="flex items-center gap-1 flex-1">
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginRight: 6 }}>VUE RÔLE :</span>
            {ROLES.map(r => (
              <button
                key={r.id}
                onClick={() => setRole(r.id)}
                style={{
                  padding: '4px 14px',
                  borderRadius: 4,
                  fontSize: 12,
                  fontWeight: role === r.id ? 700 : 400,
                  background: role === r.id ? 'rgba(255,255,255,0.18)' : 'transparent',
                  color: role === r.id ? 'white' : 'rgba(255,255,255,0.6)',
                  border: role === r.id ? '1px solid rgba(255,255,255,0.3)' : '1px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {r.label}
              </button>
            ))}
          </div>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>
            Wireframe · Année 2024–2025
          </div>
        </div>
      </div>

      {/* Active role content */}
      {role === 'student' && <StudentDashboard />}
      {role === 'supervisor' && <SupervisorDashboard />}
      {role === 'chef' && <DepartmentHeadDashboard />}
      {role === 'admin' && <SuperAdminDashboard />}
    </div>
  )
}
