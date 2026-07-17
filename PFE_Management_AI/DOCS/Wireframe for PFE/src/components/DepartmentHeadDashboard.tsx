import { useState } from 'react'
import WireframeShell from './WireframeShell'
import { Card, CardHeader, StatCard, Badge, ProgressBar, SectionTitle, Btn } from './ui'

const NAV = [
  { icon: <GridIcon />, label: 'Tableau de bord' },
  { icon: <LayersIcon />, label: 'Tous les PFEs' },
  { icon: <CheckIcon />, label: 'Validations' },
  { icon: <UsersIcon />, label: 'Affectation encadrants' },
  { icon: <CalendarIcon />, label: 'Planning soutenances' },
  { icon: <BarChartIcon />, label: 'Statistiques' },
  { icon: <DownloadIcon />, label: 'Export données' },
]

const PFEDATA = [
  { student: 'Ahmed Benali', supervisor: 'Dr. Meziane', project: 'Gestion stocks ML', progress: 64, status: 'En cours', dept: 'IA' },
  { student: 'Sara Kaci', supervisor: 'Dr. Meziane', project: 'App mobile e-santé', progress: 82, status: 'En cours', dept: 'IA' },
  { student: 'Mohamed Hamdi', supervisor: 'Dr. Meziane', project: 'Plateforme e-learning', progress: 35, status: 'Retard', dept: 'GL' },
  { student: 'Yasmine Ait', supervisor: 'Dr. Meziane', project: 'Chatbot RH IA', progress: 91, status: 'Avancé', dept: 'IA' },
  { student: 'Karim Bou', supervisor: 'Pr. Hadj', project: 'Réseau IoT smart home', progress: 48, status: 'En cours', dept: 'RT' },
  { student: 'Nadia Cherif', supervisor: 'Pr. Hadj', project: 'Cybersécurité SOC', progress: 72, status: 'En cours', dept: 'SI' },
  { student: 'Omar Ziani', supervisor: 'Dr. Amari', project: 'Blockchain finance décentralisée', progress: 29, status: 'Retard', dept: 'GL' },
  { student: 'Fatima Tahir', supervisor: 'Dr. Amari', project: 'Analyse données médicales', progress: 77, status: 'En cours', dept: 'IA' },
]

export default function DepartmentHeadDashboard() {
  const [active, setActive] = useState(0)

  return (
    <WireframeShell
      roleLabel="Chef de Filière"
      roleColor="#d97706"
      userName="Pr. Amina Bouzid"
      navItems={NAV}
      activeNav={active}
      onNavChange={setActive}
      notifCount={3}
    >
      {active === 0 && <DeptHome setActive={setActive} />}
      {active === 1 && <AllPFEs />}
      {active === 2 && <Validations />}
      {active === 3 && <SupervisorAssignment />}
      {active === 4 && <DefensePlanning />}
      {active === 5 && <Statistics />}
      {active === 6 && <ExportData />}
    </WireframeShell>
  )
}

function DeptHome({ setActive }: { setActive: (i: number) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
        <StatCard label="Total PFEs" value="8" color="#d97706" sub="Année 2024–2025" icon={<LayersIcon />} />
        <StatCard label="En cours" value="6" color="#2563eb" sub="75% du total" icon={<TrendingIcon />} />
        <StatCard label="En retard" value="2" color="#ef4444" sub="Alerte requise" icon={<AlertIcon />} />
        <StatCard label="Sujets à valider" value="3" color="#d97706" sub="En attente" icon={<CheckIcon />} />
        <StatCard label="Soutenances planif." value="4" color="#059669" sub="Juin 2025" icon={<CalendarIcon />} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 16 }}>
        <Card>
          <CardHeader title="Vue globale département" action={<Btn small variant="secondary" onClick={() => setActive(1)}>Voir tout</Btn>} />
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--muted)' }}>
                  {['Étudiant', 'Encadrant', 'Spécialité', 'Progression', 'Statut'].map(h => (
                    <th key={h} style={{ padding: '7px 12px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PFEDATA.map((p, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border)', background: p.status === 'Retard' ? '#fffbeb' : 'transparent' }}>
                    <td style={{ padding: '8px 12px', fontSize: 12.5, fontWeight: 600 }}>{p.student}</td>
                    <td style={{ padding: '8px 12px', fontSize: 11.5, color: 'var(--muted-foreground)' }}>{p.supervisor}</td>
                    <td style={{ padding: '8px 12px' }}><span style={{ fontSize: 11, background: 'var(--secondary)', padding: '2px 7px', borderRadius: 10, color: '#d97706', fontWeight: 600 }}>{p.dept}</span></td>
                    <td style={{ padding: '8px 12px', minWidth: 110 }}>
                      <ProgressBar value={p.progress} color={p.progress > 70 ? '#059669' : p.progress > 45 ? '#2563eb' : '#ef4444'} />
                    </td>
                    <td style={{ padding: '8px 12px' }}>
                      <Badge label={p.status} variant={p.status === 'Retard' ? 'error' : p.status === 'Avancé' ? 'success' : 'info'} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Card>
            <CardHeader title="Répartition par statut" />
            <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <ProgressBar value={75} color="#2563eb" label="En cours (6)" />
              <ProgressBar value={12} color="#059669" label="Terminé (1)" />
              <ProgressBar value={25} color="#ef4444" label="En retard (2)" />
            </div>
          </Card>
          <Card>
            <CardHeader title="Actions requises" />
            <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 7 }}>
              <ActionItem text="Valider 3 conventions en attente" color="#d97706" />
              <ActionItem text="Planifier 4 soutenances restantes" color="#2563eb" />
              <ActionItem text="Affecter encadrant à 1 sujet" color="#7c3aed" />
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

function AllPFEs() {
  const [filter, setFilter] = useState('Tous')
  const statuses = ['Tous', 'En cours', 'Retard', 'Avancé']
  const filtered = filter === 'Tous' ? PFEDATA : PFEDATA.filter(p => p.status === filter)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <SectionTitle>Tous les PFEs</SectionTitle>
        <div style={{ flex: 1 }} />
        {statuses.map(s => (
          <button key={s} onClick={() => setFilter(s)} style={{
            padding: '4px 12px', borderRadius: 20, fontSize: 11.5, fontWeight: filter === s ? 700 : 400,
            background: filter === s ? '#d97706' : 'var(--muted)',
            color: filter === s ? 'white' : 'var(--muted-foreground)',
            border: 'none', cursor: 'pointer',
          }}>{s}</button>
        ))}
        <input placeholder="Rechercher..." style={{ padding: '5px 10px', borderRadius: 5, border: '1px solid var(--border)', fontSize: 12, background: 'var(--background)', outline: 'none' }} />
      </div>
      <Card>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--muted)' }}>
              {['Étudiant', 'Sujet', 'Encadrant', 'Filière', 'Progression', 'Statut', 'Actions'].map(h => (
                <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((p, i) => (
              <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '9px 12px', fontSize: 12.5, fontWeight: 600 }}>{p.student}</td>
                <td style={{ padding: '9px 12px', fontSize: 11.5, color: 'var(--muted-foreground)', maxWidth: 160 }}>{p.project}</td>
                <td style={{ padding: '9px 12px', fontSize: 11.5 }}>{p.supervisor}</td>
                <td style={{ padding: '9px 12px' }}><span style={{ fontSize: 11, background: 'var(--secondary)', padding: '2px 7px', borderRadius: 10, color: '#d97706', fontWeight: 700 }}>{p.dept}</span></td>
                <td style={{ padding: '9px 12px', minWidth: 100 }}><ProgressBar value={p.progress} color={p.progress > 70 ? '#059669' : p.progress > 45 ? '#2563eb' : '#ef4444'} /></td>
                <td style={{ padding: '9px 12px' }}><Badge label={p.status} variant={p.status === 'Retard' ? 'error' : p.status === 'Avancé' ? 'success' : 'info'} /></td>
                <td style={{ padding: '9px 12px' }}><Btn small variant="secondary">Voir</Btn></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}

function Validations() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <SectionTitle>Validations en attente</SectionTitle>
      {[
        { student: 'Karim Bou', title: 'Réseau IoT pour la maison intelligente', supervisor: 'Dr. Meziane', company: 'SmartHome SA', type: 'Sujet PFE' },
        { student: 'Omar Ziani', title: 'Blockchain finance décentralisée', supervisor: 'Pr. Hadj', company: 'FinTech DZ', type: 'Convention de stage' },
        { student: 'Nadia Cherif', title: 'Cybersécurité SOC', supervisor: 'Pr. Hadj', company: 'SecureNet', type: 'Sujet PFE' },
      ].map((v, i) => (
        <Card key={i}>
          <CardHeader title={v.title} subtitle={`${v.student} · ${v.supervisor} · ${v.company}`} action={<Badge label={v.type} variant="info" />} />
          <div style={{ padding: '12px 16px', display: 'flex', gap: 8 }}>
            <Btn color="#059669">✓ Valider définitivement</Btn>
            <Btn color="#d97706" variant="secondary">Demander modification</Btn>
            <Btn color="#ef4444" variant="secondary">✗ Refuser</Btn>
          </div>
        </Card>
      ))}
    </div>
  )
}

function SupervisorAssignment() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <SectionTitle>Affectation des encadrants</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16 }}>
        <Card>
          <CardHeader title="PFEs et leurs encadrants" action={<Btn small>Réaffecter</Btn>} />
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--muted)' }}>
                {['Étudiant', 'Sujet', 'Encadrant actuel', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '7px 12px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PFEDATA.map((p, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '8px 12px', fontSize: 12.5 }}>{p.student}</td>
                  <td style={{ padding: '8px 12px', fontSize: 11.5, color: 'var(--muted-foreground)' }}>{p.project}</td>
                  <td style={{ padding: '8px 12px', fontSize: 12 }}>{p.supervisor}</td>
                  <td style={{ padding: '8px 12px' }}><Btn small variant="secondary">Modifier</Btn></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <Card>
          <CardHeader title="Charge par encadrant" />
          <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { name: 'Dr. Meziane', count: 4, max: 6 },
              { name: 'Pr. Hadj', count: 2, max: 6 },
              { name: 'Dr. Amari', count: 2, max: 6 },
            ].map((enc, i) => (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 12 }}>{enc.name}</span>
                  <span style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>{enc.count}/{enc.max}</span>
                </div>
                <ProgressBar value={Math.round(enc.count / enc.max * 100)} color="#d97706" />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}

function DefensePlanning() {
  const defenses = [
    { student: 'Yasmine Ait', date: '22 Juin', time: '09h00', room: 'Amphi A', jury: 'Bouzid, Meziane, Ouali' },
    { student: 'Ahmed Benali', date: '22 Juin', time: '10h00', room: 'Amphi B', jury: 'Bouzid, Meziane, Amari' },
    { student: 'Sara Kaci', date: '23 Juin', time: '09h00', room: 'Salle 12', jury: 'Hadj, Meziane, Bouzid' },
    { student: 'Nadia Cherif', date: '23 Juin', time: '11h00', room: 'Amphi A', jury: 'Bouzid, Hadj, Amari' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <SectionTitle>Planning des soutenances</SectionTitle>
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn small variant="secondary">+ Planifier soutenance</Btn>
          <Btn small>Envoyer convocations</Btn>
        </div>
      </div>
      <Card>
        <CardHeader title="Soutenances planifiées — Juin 2025" />
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--muted)' }}>
              {['Étudiant', 'Date', 'Heure', 'Salle', 'Jury', 'Statut', 'Actions'].map(h => (
                <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {defenses.map((d, i) => (
              <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '9px 12px', fontSize: 12.5, fontWeight: 600 }}>{d.student}</td>
                <td style={{ padding: '9px 12px', fontSize: 12 }}>{d.date}</td>
                <td style={{ padding: '9px 12px', fontSize: 12 }}>{d.time}</td>
                <td style={{ padding: '9px 12px', fontSize: 12 }}>{d.room}</td>
                <td style={{ padding: '9px 12px', fontSize: 11, color: 'var(--muted-foreground)' }}>{d.jury}</td>
                <td style={{ padding: '9px 12px' }}><Badge label="Confirmé" variant="success" /></td>
                <td style={{ padding: '9px 12px' }}><div style={{ display: 'flex', gap: 4 }}><Btn small variant="secondary">Modifier</Btn><Btn small variant="secondary">Convoc.</Btn></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}

function Statistics() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SectionTitle>Statistiques & Rapports</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        <StatCard label="Taux d'avancement moyen" value="62%" color="#2563eb" icon={<TrendingIcon />} />
        <StatCard label="PFEs en retard" value="25%" color="#ef4444" sub="2 sur 8" icon={<AlertIcon />} />
        <StatCard label="Taux validation sujets" value="85%" color="#059669" icon={<CheckIcon />} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Card>
          <CardHeader title="Répartition par filière" />
          <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { label: 'IA (Intelligence Artificielle)', count: 4, color: '#2563eb' },
              { label: 'GL (Génie Logiciel)', count: 2, color: '#d97706' },
              { label: 'RT (Réseaux & Télécoms)', count: 1, color: '#059669' },
              { label: 'SI (Systèmes d\'Information)', count: 1, color: '#7c3aed' },
            ].map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: s.color, flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: 12 }}>{s.label}</span>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: s.color }}>{s.count}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader title="Progression par encadrant" />
          <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <ProgressBar value={68} color="#2563eb" label="Dr. Meziane (moy. 4 étudiants)" />
            <ProgressBar value={60} color="#059669" label="Pr. Hadj (moy. 2 étudiants)" />
            <ProgressBar value={53} color="#d97706" label="Dr. Amari (moy. 2 étudiants)" />
          </div>
        </Card>
      </div>
    </div>
  )
}

function ExportData() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 600 }}>
      <SectionTitle>Export de données</SectionTitle>
      {[
        { label: 'Liste complète des PFEs 2024–2025', desc: 'Noms, sujets, encadrants, statuts', formats: ['PDF', 'Excel'] },
        { label: 'Planning des soutenances', desc: 'Dates, horaires, salles, jury', formats: ['PDF', 'Excel'] },
        { label: 'Convocations individuelles', desc: 'Document officiel par étudiant', formats: ['PDF'] },
        { label: 'Rapport de progression globale', desc: 'Statistiques et taux d\'avancement', formats: ['PDF'] },
        { label: 'Procès-verbaux des soutenances', desc: 'PV officiels avec notes', formats: ['PDF', 'Word'] },
      ].map((e, i) => (
        <Card key={i}>
          <div style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', gap: 12 }}>
            <span style={{ fontSize: 20 }}>📊</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{e.label}</div>
              <div style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>{e.desc}</div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {e.formats.map(f => (
                <Btn key={f} small variant="secondary">⬇ {f}</Btn>
              ))}
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}

function ActionItem({ text, color }: { text: string; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingBottom: 6, borderBottom: '1px solid var(--border)' }}>
      <div style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0 }} />
      <span style={{ fontSize: 12 }}>{text}</span>
    </div>
  )
}

// Icons
function GridIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg> }
function LayersIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg> }
function CheckIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg> }
function UsersIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> }
function CalendarIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> }
function BarChartIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg> }
function DownloadIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> }
function AlertIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> }
function TrendingIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg> }
