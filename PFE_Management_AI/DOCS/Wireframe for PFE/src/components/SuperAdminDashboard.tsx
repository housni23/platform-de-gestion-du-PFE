import { useState } from 'react'
import WireframeShell from './WireframeShell'
import { Card, CardHeader, StatCard, Badge, SectionTitle, Btn, ProgressBar } from './ui'

const NAV = [
  { icon: <GridIcon />, label: 'Tableau de bord' },
  { icon: <UsersIcon />, label: 'Gestion utilisateurs' },
  { icon: <ShieldIcon />, label: 'Gestion des rôles' },
  { icon: <SettingsIcon />, label: 'Configuration plateforme' },
  { icon: <GlobeIcon />, label: 'Supervision globale' },
  { icon: <BellIcon />, label: 'Paramètres système' },
  { icon: <ActivityIcon />, label: 'Audit & Logs' },
]

const USERS = [
  { name: 'Ahmed Benali', email: 'a.benali@etu.univ.dz', role: 'Étudiant', dept: 'IA', status: 'Actif', lastLogin: '12 Mai' },
  { name: 'Sara Kaci', email: 's.kaci@etu.univ.dz', role: 'Étudiant', dept: 'IA', status: 'Actif', lastLogin: '11 Mai' },
  { name: 'Mohamed Hamdi', email: 'm.hamdi@etu.univ.dz', role: 'Étudiant', dept: 'GL', status: 'Inactif', lastLogin: '01 Avr' },
  { name: 'Dr. Karim Meziane', email: 'k.meziane@univ.dz', role: 'Encadrant', dept: 'IA', status: 'Actif', lastLogin: '12 Mai' },
  { name: 'Pr. Amina Bouzid', email: 'a.bouzid@univ.dz', role: 'Chef de filière', dept: 'GI', status: 'Actif', lastLogin: '10 Mai' },
  { name: 'Pr. Hadj Samir', email: 's.hadj@univ.dz', role: 'Encadrant', dept: 'RT', status: 'Actif', lastLogin: '09 Mai' },
]

export default function SuperAdminDashboard() {
  const [active, setActive] = useState(0)

  return (
    <WireframeShell
      roleLabel="Super Admin"
      roleColor="#7c3aed"
      userName="Admin Système"
      navItems={NAV}
      activeNav={active}
      onNavChange={setActive}
      notifCount={2}
    >
      {active === 0 && <AdminHome />}
      {active === 1 && <UserManagement />}
      {active === 2 && <RoleManagement />}
      {active === 3 && <PlatformConfig />}
      {active === 4 && <GlobalSupervision />}
      {active === 5 && <SystemSettings />}
      {active === 6 && <AuditLogs />}
    </WireframeShell>
  )
}

function AdminHome() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
        <StatCard label="Utilisateurs totaux" value="124" color="#7c3aed" sub="Actifs: 118" icon={<UsersIcon />} />
        <StatCard label="PFEs actifs" value="42" color="#2563eb" sub="Année 2024–2025" icon={<LayersIcon />} />
        <StatCard label="Départements" value="5" color="#d97706" sub="Filières actives" icon={<GlobeIcon />} />
        <StatCard label="Taux de complétion" value="68%" color="#059669" sub="Tous départements" icon={<TrendingIcon />} />
        <StatCard label="Alertes système" value="2" color="#ef4444" sub="À traiter" icon={<AlertIcon />} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Card>
          <CardHeader title="Répartition des utilisateurs par rôle" />
          <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { role: 'Étudiants', count: 98, total: 124, color: '#2563eb' },
              { role: 'Encadrants', count: 18, total: 124, color: '#059669' },
              { role: 'Chefs de filière', count: 5, total: 124, color: '#d97706' },
              { role: 'Super Admins', count: 3, total: 124, color: '#7c3aed' },
            ].map((r, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: r.color, flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: 12 }}>{r.role}</span>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: r.color, minWidth: 20, textAlign: 'right' }}>{r.count}</span>
                <div style={{ width: 80, height: 5, background: 'var(--muted)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ width: `${Math.round(r.count / r.total * 100)}%`, height: '100%', background: r.color }} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader title="Activité récente" />
          <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 7 }}>
            {[
              { time: 'Il y a 5 min', text: 'Nouvel utilisateur enregistré: Yasmine Ait', type: 'user' },
              { time: 'Il y a 1h', text: 'Rôle encadrant attribué à Dr. Amari', type: 'role' },
              { time: 'Hier 16:30', text: 'Campagne PFE 2025 activée', type: 'config' },
              { time: 'Hier 09:00', text: 'Sauvegarde automatique effectuée', type: 'system' },
              { time: '10 Mai', text: 'Export Excel généré — Chef de filière Bouzid', type: 'export' },
            ].map((a, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, paddingBottom: 6, borderBottom: i < 4 ? '1px solid var(--border)' : 'none' }}>
                <span style={{ fontSize: 15 }}>{{ user: '👤', role: '🔑', config: '⚙️', system: '💾', export: '📊' }[a.type as string]}</span>
                <div>
                  <div style={{ fontSize: 12 }}>{a.text}</div>
                  <div style={{ fontSize: 10.5, color: 'var(--muted-foreground)' }}>{a.time}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        <Card>
          <CardHeader title="Santé du système" />
          <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <SystemHealthRow label="Serveur web" status="Opérationnel" color="#059669" />
            <SystemHealthRow label="Base de données" status="Opérationnel" color="#059669" />
            <SystemHealthRow label="Service e-mail" status="Opérationnel" color="#059669" />
            <SystemHealthRow label="Détection plagiat" status="Dégradé" color="#d97706" />
            <SystemHealthRow label="Sauvegarde auto" status="Opérationnel" color="#059669" />
          </div>
        </Card>
        <Card>
          <CardHeader title="Stockage" />
          <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <ProgressBar value={58} color="#7c3aed" label="Espace utilisé (58 GB / 100 GB)" />
            <div style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>Documents: 42 GB · Backups: 16 GB</div>
          </div>
        </Card>
        <Card>
          <CardHeader title="Actions rapides" />
          <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 7 }}>
            <Btn small color="#7c3aed">+ Créer utilisateur</Btn>
            <Btn small variant="secondary">Nouvelle campagne PFE</Btn>
            <Btn small variant="secondary">Exporter tous les PFEs</Btn>
            <Btn small variant="secondary">Lancer sauvegarde</Btn>
          </div>
        </Card>
      </div>
    </div>
  )
}

function UserManagement() {
  const [search, setSearch] = useState('')
  const filtered = USERS.filter(u => u.name.toLowerCase().includes(search.toLowerCase()) || u.role.toLowerCase().includes(search.toLowerCase()))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <SectionTitle>Gestion des utilisateurs</SectionTitle>
        <div style={{ flex: 1 }} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher utilisateur..."
          style={{ padding: '5px 10px', borderRadius: 5, border: '1px solid var(--border)', fontSize: 12, background: 'var(--background)', outline: 'none', width: 200 }}
        />
        <Btn color="#7c3aed">+ Créer utilisateur</Btn>
      </div>
      <Card>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--muted)' }}>
              {['Utilisateur', 'Email', 'Rôle', 'Département', 'Statut', 'Dernière connexion', 'Actions'].map(h => (
                <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'var(--muted-foreground)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((u, i) => (
              <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '9px 12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 11, color: '#7c3aed' }}>{u.name[0]}</div>
                    <span style={{ fontSize: 12.5, fontWeight: 600 }}>{u.name}</span>
                  </div>
                </td>
                <td style={{ padding: '9px 12px', fontSize: 11.5, color: 'var(--muted-foreground)' }}>{u.email}</td>
                <td style={{ padding: '9px 12px' }}>
                  <Badge label={u.role} variant={u.role === 'Super Admin' ? 'error' : u.role === 'Chef de filière' ? 'warning' : u.role === 'Encadrant' ? 'success' : 'info'} />
                </td>
                <td style={{ padding: '9px 12px', fontSize: 12 }}>{u.dept}</td>
                <td style={{ padding: '9px 12px' }}>
                  <Badge label={u.status} variant={u.status === 'Actif' ? 'success' : 'draft'} />
                </td>
                <td style={{ padding: '9px 12px', fontSize: 11.5, color: 'var(--muted-foreground)' }}>{u.lastLogin}</td>
                <td style={{ padding: '9px 12px' }}>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <Btn small variant="secondary">Modifier</Btn>
                    <Btn small variant="secondary" color="#ef4444">{u.status === 'Actif' ? 'Désactiver' : 'Activer'}</Btn>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}

function RoleManagement() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 800 }}>
      <SectionTitle>Gestion des rôles</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {[
          { role: 'Encadrant', color: '#059669', count: 18, desc: 'Supervision des PFEs, validation des rapports et évaluation finale.', users: ['Dr. K. Meziane', 'Pr. S. Hadj', 'Dr. B. Amari'] },
          { role: 'Chef de filière', color: '#d97706', count: 5, desc: 'Gestion département, validation sujets, planification soutenances.', users: ['Pr. A. Bouzid', 'Pr. M. Tali', 'Dr. S. Rahi'] },
        ].map((r, i) => (
          <Card key={i}>
            <CardHeader
              title={r.role}
              subtitle={`${r.count} utilisateurs actifs`}
              action={<div style={{ width: 10, height: 10, borderRadius: '50%', background: r.color }} />}
            />
            <div style={{ padding: '12px 14px' }}>
              <p style={{ fontSize: 12, color: 'var(--muted-foreground)', marginBottom: 10, lineHeight: 1.5 }}>{r.desc}</p>
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 10.5, color: 'var(--muted-foreground)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 5 }}>Membres (échantillon)</div>
                {r.users.map((u, j) => (
                  <div key={j} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid var(--border)', fontSize: 12 }}>
                    <span>{u}</span>
                    <Btn small variant="secondary" color="#ef4444">Révoquer</Btn>
                  </div>
                ))}
              </div>
              <Btn small color={r.color}>+ Attribuer ce rôle</Btn>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

function PlatformConfig() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 700 }}>
      <SectionTitle>Configuration de la plateforme</SectionTitle>

      <Card>
        <CardHeader title="Année académique & Campagne PFE" />
        <div style={{ padding: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <FormField label="Année académique active" value="2024–2025" />
          <FormField label="Statut campagne" value="Ouverte" badge={<Badge label="Active" variant="success" />} />
          <FormField label="Début dépôt de sujets" value="01 Novembre 2024" />
          <FormField label="Fin dépôt de sujets" value="31 Janvier 2025" />
          <FormField label="Début des stages" value="01 Février 2025" />
          <FormField label="Date limite soumission rapport" value="15 Juin 2025" />
          <FormField label="Période des soutenances" value="16 – 30 Juin 2025" />
          <FormField label="Clôture campagne" value="15 Juillet 2025" />
        </div>
        <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border)' }}>
          <Btn color="#7c3aed">Sauvegarder la configuration</Btn>
        </div>
      </Card>

      <Card>
        <CardHeader title="Départements & Filières" action={<Btn small>+ Ajouter filière</Btn>} />
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--muted)' }}>
              {['Filière', 'Code', 'Chef de filière', 'PFEs actifs', 'Statut'].map(h => (
                <th key={h} style={{ padding: '7px 12px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              ['Intelligence Artificielle', 'IA', 'Pr. Bouzid', 4, 'Active'],
              ['Génie Logiciel', 'GL', 'Pr. Tali', 2, 'Active'],
              ['Réseaux & Télécoms', 'RT', 'Dr. Rahi', 1, 'Active'],
              ["Systèmes d'Information", 'SI', 'Pr. Hadj', 1, 'Active'],
            ].map((row, i) => (
              <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                {row.map((cell, j) => (
                  <td key={j} style={{ padding: '8px 12px', fontSize: 12 }}>
                    {j === 4 ? <Badge label={cell as string} variant="success" /> : cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}

function GlobalSupervision() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SectionTitle>Supervision globale — Tous départements</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        <StatCard label="Total PFEs" value="42" color="#7c3aed" icon={<LayersIcon />} />
        <StatCard label="Complétés" value="8" color="#059669" sub="19%" icon={<CheckIcon />} />
        <StatCard label="En cours" value="28" color="#2563eb" sub="67%" icon={<TrendingIcon />} />
        <StatCard label="En retard" value="6" color="#ef4444" sub="14%" icon={<AlertIcon />} />
      </div>

      <Card>
        <CardHeader title="Progression par département" />
        <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { dept: 'Intelligence Artificielle', total: 18, done: 4, prog: 71 },
            { dept: 'Génie Logiciel', total: 12, done: 2, prog: 52 },
            { dept: 'Réseaux & Télécoms', total: 7, done: 1, prog: 68 },
            { dept: "Systèmes d'Information", total: 5, done: 1, prog: 74 },
          ].map((d, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 12, minWidth: 200 }}>{d.dept}</span>
              <span style={{ fontSize: 11, color: 'var(--muted-foreground)', minWidth: 50 }}>{d.total} PFEs</span>
              <div style={{ flex: 1 }}>
                <ProgressBar value={d.prog} color={d.prog > 65 ? '#059669' : '#d97706'} />
              </div>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: '#7c3aed', minWidth: 35 }}>{d.prog}%</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

function SystemSettings() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 700 }}>
      <SectionTitle>Paramètres système</SectionTitle>

      <Card>
        <CardHeader title="Notifications" />
        <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { label: 'Rappel soumission rapport (J-7)', enabled: true },
            { label: 'Alerte inactivité étudiant (30j)', enabled: true },
            { label: 'Notification validation sujet', enabled: true },
            { label: 'Email convocation soutenance', enabled: true },
            { label: 'Résumé hebdomadaire superviseurs', enabled: false },
          ].map((n, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: 12.5 }}>{n.label}</span>
              <div style={{
                width: 36, height: 20, borderRadius: 10,
                background: n.enabled ? '#7c3aed' : 'var(--muted)',
                position: 'relative', cursor: 'pointer', flexShrink: 0,
              }}>
                <div style={{
                  width: 14, height: 14, borderRadius: '50%', background: 'white',
                  position: 'absolute', top: 3, left: n.enabled ? 18 : 3, transition: 'left 0.2s',
                }} />
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader title="Règles métier" />
        <div style={{ padding: '14px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <FormField label="Formats acceptés (rapports)" value="PDF, DOCX" />
          <FormField label="Taille max fichier" value="10 MB" />
          <FormField label="Délai inactivité (alerte)" value="30 jours" />
          <FormField label="Délai relance auto" value="7 jours après alerte" />
          <FormField label="Langue interface par défaut" value="Français" />
          <FormField label="Langue secondaire" value="Arabe" />
        </div>
        <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border)' }}>
          <Btn color="#7c3aed">Enregistrer les paramètres</Btn>
        </div>
      </Card>
    </div>
  )
}

function AuditLogs() {
  const logs = [
    { time: '12 Mai 2025 14:32', user: 'Dr. Meziane', action: 'Validation rapport', detail: 'Rapport #3 — Ahmed Benali', type: 'success' },
    { time: '12 Mai 2025 11:15', user: 'Admin Système', action: 'Attribution rôle', detail: 'Encadrant → Dr. Amari Rachid', type: 'info' },
    { time: '11 Mai 2025 16:45', user: 'Pr. Bouzid', action: 'Export Excel', detail: 'Liste PFEs 2024–2025', type: 'info' },
    { time: '11 Mai 2025 09:00', user: 'Système', action: 'Sauvegarde automatique', detail: 'Backup_20250511.tar.gz — 2.1GB', type: 'success' },
    { time: '10 Mai 2025 18:22', user: 'Sara Kaci', action: 'Dépôt document', detail: 'Rapport_final_v3.pdf — 2.4 MB', type: 'info' },
    { time: '10 Mai 2025 10:00', user: 'Admin Système', action: 'Désactivation compte', detail: 'Utilisateur: ex.stagiaire@univ.dz', type: 'warning' },
    { time: '09 Mai 2025 14:00', user: 'Système', action: 'Erreur service', detail: 'Service plagiat: timeout (3 tentatives)', type: 'error' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <SectionTitle>Journal d'audit</SectionTitle>
        <div style={{ flex: 1 }} />
        <Btn small variant="secondary">⬇ Exporter logs</Btn>
      </div>
      <Card>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--muted)' }}>
              {['Horodatage', 'Utilisateur', 'Action', 'Détail', 'Type'].map(h => (
                <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {logs.map((l, i) => (
              <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '8px 12px', fontSize: 11, color: 'var(--muted-foreground)', whiteSpace: 'nowrap', fontFamily: 'monospace' }}>{l.time}</td>
                <td style={{ padding: '8px 12px', fontSize: 12 }}>{l.user}</td>
                <td style={{ padding: '8px 12px', fontSize: 12, fontWeight: 600 }}>{l.action}</td>
                <td style={{ padding: '8px 12px', fontSize: 11.5, color: 'var(--muted-foreground)' }}>{l.detail}</td>
                <td style={{ padding: '8px 12px' }}>
                  <Badge label={l.type} variant={l.type === 'success' ? 'success' : l.type === 'error' ? 'error' : l.type === 'warning' ? 'warning' : 'info'} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}

// Helpers
function FormField({ label, value, badge }: { label: string; value: string; badge?: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: 'var(--muted-foreground)', fontWeight: 600, marginBottom: 4 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 5, border: '1px solid var(--border)', fontSize: 12.5, color: 'var(--foreground)', background: 'var(--background)' }}>
        <span style={{ flex: 1 }}>{value}</span>
        {badge}
      </div>
    </div>
  )
}

function SystemHealthRow({ label, status, color }: { label: string; status: string; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 6, borderBottom: '1px solid var(--border)' }}>
      <span style={{ fontSize: 12 }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <div style={{ width: 7, height: 7, borderRadius: '50%', background: color }} />
        <span style={{ fontSize: 11, color, fontWeight: 600 }}>{status}</span>
      </div>
    </div>
  )
}

// Icons
function GridIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg> }
function UsersIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> }
function ShieldIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> }
function SettingsIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg> }
function GlobeIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg> }
function BellIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg> }
function ActivityIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> }
function LayersIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg> }
function TrendingIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg> }
function AlertIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> }
function CheckIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg> }
