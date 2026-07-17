import { useState } from 'react'
import WireframeShell from './WireframeShell'
import { Card, CardHeader, StatCard, Badge, ProgressBar, SectionTitle, Btn, Table } from './ui'

const NAV = [
  { icon: <GridIcon />, label: 'Tableau de bord' },
  { icon: <UsersIcon />, label: 'Mes étudiants' },
  { icon: <FileIcon />, label: 'Validation sujets' },
  { icon: <ClipboardIcon />, label: 'Documents & Revue' },
  { icon: <MessageIcon />, label: 'Messagerie', badge: 4 },
  { icon: <StarIcon />, label: 'Grilles d\'évaluation' },
  { icon: <BellIcon />, label: 'Alertes', badge: 2 },
]

const STUDENTS = [
  { name: 'Ahmed Benali', project: 'Gestion stocks ML', progress: 64, status: 'En cours', lastSub: '10 Mai', alert: false },
  { name: 'Sara Kaci', project: 'App mobile e-santé', progress: 82, status: 'En cours', lastSub: '09 Mai', alert: false },
  { name: 'Mohamed Hamdi', project: 'Plateforme e-learning', progress: 35, status: 'Retard', lastSub: '01 Avr', alert: true },
  { name: 'Yasmine Ait', project: 'Chatbot RH IA', progress: 91, status: 'Avancé', lastSub: '12 Mai', alert: false },
  { name: 'Karim Bou', project: 'Réseau IoT smart home', progress: 48, status: 'En cours', lastSub: '05 Mai', alert: false },
]

export default function SupervisorDashboard() {
  const [active, setActive] = useState(0)
  const [selectedStudent, setSelectedStudent] = useState(0)

  return (
    <WireframeShell
      roleLabel="Encadrant"
      roleColor="#059669"
      userName="Dr. Karim Meziane"
      navItems={NAV}
      activeNav={active}
      onNavChange={setActive}
      notifCount={4}
    >
      {active === 0 && <SupervisorHome setActive={setActive} />}
      {active === 1 && <StudentList selectedStudent={selectedStudent} setSelectedStudent={setSelectedStudent} />}
      {active === 2 && <SubjectValidation />}
      {active === 3 && <DocumentReview />}
      {active === 4 && <Messaging />}
      {active === 5 && <EvaluationGrid />}
      {active === 6 && <Alerts />}
    </WireframeShell>
  )
}

function SupervisorHome({ setActive }: { setActive: (i: number) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        <StatCard label="Étudiants encadrés" value="5" color="#059669" sub="Année 2024–2025" icon={<UsersIcon />} />
        <StatCard label="Progression moy." value="64%" color="#2563eb" sub="Tous étudiants" icon={<TrendingIcon />} />
        <StatCard label="Sujets à valider" value="2" color="#d97706" sub="En attente" icon={<ClipboardIcon />} />
        <StatCard label="Alertes inactivité" value="1" color="#ef4444" sub="+ 30 jours sans soumission" icon={<BellIcon />} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16 }}>
        <Card>
          <CardHeader title="Vue d'ensemble des étudiants" action={<Btn small variant="secondary" onClick={() => setActive(1)}>Voir tout</Btn>} />
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--muted)' }}>
                  {['Étudiant', 'Sujet', 'Progression', 'Dernière soumission', 'Statut'].map(h => (
                    <th key={h} style={{ padding: '7px 12px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {STUDENTS.map((s, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border)', background: s.alert ? '#fff5f5' : 'transparent' }}>
                    <td style={{ padding: '9px 12px', fontSize: 12, fontWeight: 600 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {s.alert && <span style={{ color: '#ef4444' }}>⚠</span>}
                        {s.name}
                      </div>
                    </td>
                    <td style={{ padding: '9px 12px', fontSize: 11.5, color: 'var(--muted-foreground)', maxWidth: 180 }}>{s.project}</td>
                    <td style={{ padding: '9px 12px', minWidth: 120 }}>
                      <ProgressBar value={s.progress} color={s.progress > 70 ? '#059669' : s.progress > 45 ? '#2563eb' : '#ef4444'} />
                    </td>
                    <td style={{ padding: '9px 12px', fontSize: 11.5, color: 'var(--muted-foreground)' }}>{s.lastSub}</td>
                    <td style={{ padding: '9px 12px' }}>
                      <Badge label={s.status} variant={s.status === 'Retard' ? 'error' : s.status === 'Avancé' ? 'success' : 'info'} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Card>
            <CardHeader title="À faire" />
            <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 7 }}>
              <TodoItem icon="🟡" text="Valider sujet — Mohamed Hamdi" action="Valider" />
              <TodoItem icon="🟡" text="Valider sujet — Karim Bou" action="Valider" />
              <TodoItem icon="🔴" text="Revoir rapport #3 — Sara Kaci" action="Examiner" />
              <TodoItem icon="🔵" text="Remplir grille évaluation — Yasmine Ait" action="Remplir" />
            </div>
          </Card>
          <Card>
            <CardHeader title="Prochaines réunions" />
            <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <MeetingRow name="Ahmed Benali" date="20 Mai, 10h" topic="Revue rapport #3" />
              <MeetingRow name="Sara Kaci" date="21 Mai, 14h" topic="Soutenance blanche" />
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

function StudentList({ selectedStudent, setSelectedStudent }: { selectedStudent: number; setSelectedStudent: (i: number) => void }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 16 }}>
      {/* Student list */}
      <Card style={{ display: 'flex', flexDirection: 'column' }}>
        <CardHeader title="Étudiants (5)" />
        <div style={{ flex: 1 }}>
          {STUDENTS.map((s, i) => (
            <button key={i} onClick={() => setSelectedStudent(i)} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 12px', background: selectedStudent === i ? '#f0fdf4' : 'transparent',
              borderLeft: selectedStudent === i ? '3px solid #059669' : '3px solid transparent',
              border: 'none', borderBottom: '1px solid var(--border)', cursor: 'pointer', textAlign: 'left',
            }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12, color: '#059669', flexShrink: 0 }}>
                {s.name[0]}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                  {s.alert && <span style={{ color: '#ef4444', fontSize: 11 }}>⚠</span>}
                  {s.name}
                </div>
                <div style={{ fontSize: 10.5, color: 'var(--muted-foreground)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.project}</div>
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: s.progress > 70 ? '#059669' : '#d97706' }}>{s.progress}%</span>
            </button>
          ))}
        </div>
      </Card>

      {/* Student detail */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Card>
          <CardHeader
            title={STUDENTS[selectedStudent].name}
            subtitle={STUDENTS[selectedStudent].project}
            action={<Badge label={STUDENTS[selectedStudent].status} variant={STUDENTS[selectedStudent].status === 'Retard' ? 'error' : 'success'} />}
          />
          <div style={{ padding: '14px 16px' }}>
            <ProgressBar value={STUDENTS[selectedStudent].progress} color="#059669" label="Progression globale" />
            {STUDENTS[selectedStudent].alert && (
              <div style={{ marginTop: 10, padding: '8px 12px', background: '#fee2e2', borderRadius: 6, fontSize: 12, color: '#991b1b', display: 'flex', alignItems: 'center', gap: 6 }}>
                ⚠ Aucune soumission depuis plus de 30 jours — relance automatique envoyée
              </div>
            )}
          </div>
        </Card>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Card>
            <CardHeader title="Derniers documents" action={<Btn small variant="secondary">Voir tous</Btn>} />
            <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <DocRow name="Rapport #3" date="28 Avr" badge={<Badge label="À valider" variant="warning" />} />
              <DocRow name="Rapport #2" date="31 Mars" badge={<Badge label="Validé" variant="success" />} />
              <DocRow name="Convention" date="01 Fév" badge={<Badge label="Validé" variant="success" />} />
            </div>
          </Card>
          <Card>
            <CardHeader title="Feedback rapide" />
            <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <textarea
                style={{ width: '100%', height: 80, padding: '8px', fontSize: 12, borderRadius: 5, border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)', resize: 'none' }}
                placeholder="Laisser un commentaire..."
              />
              <div style={{ display: 'flex', gap: 6 }}>
                <Btn small color="#059669">Valider</Btn>
                <Btn small color="#ef4444" variant="secondary">Demander révision</Btn>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

function SubjectValidation() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SectionTitle>Validation des sujets</SectionTitle>
      {[
        { student: 'Mohamed Hamdi', title: 'Plateforme e-learning adaptative', company: 'EduTech DZ', submitted: '05 Mai 2025' },
        { student: 'Karim Bou', title: 'Réseau IoT pour la maison intelligente', company: 'SmartHome SA', submitted: '08 Mai 2025' },
      ].map((sub, i) => (
        <Card key={i}>
          <CardHeader title={sub.title} subtitle={`Proposé par ${sub.student} — soumis le ${sub.submitted}`} />
          <div style={{ padding: '14px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--muted-foreground)', marginBottom: 3 }}>Étudiant</div>
              <div style={{ fontSize: 12.5, fontWeight: 600 }}>{sub.student}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--muted-foreground)', marginBottom: 3 }}>Organisme</div>
              <div style={{ fontSize: 12.5 }}>{sub.company}</div>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <div style={{ fontSize: 11, color: 'var(--muted-foreground)', marginBottom: 4 }}>Commentaire (facultatif)</div>
              <textarea style={{ width: '100%', height: 60, padding: '7px 10px', fontSize: 12, borderRadius: 5, border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)', resize: 'none' }} placeholder="Ajouter des remarques..." />
            </div>
          </div>
          <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
            <Btn color="#059669">✓ Valider le sujet</Btn>
            <Btn color="#d97706" variant="secondary">Demander modifications</Btn>
            <Btn color="#ef4444" variant="secondary">✗ Refuser</Btn>
          </div>
        </Card>
      ))}
    </div>
  )
}

function DocumentReview() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SectionTitle>Revue de documents</SectionTitle>
      <Card>
        <CardHeader title="Documents soumis par les étudiants" subtitle="Cliquer sur un document pour le commenter" />
        <Table
          headers={['Étudiant', 'Document', 'Version', 'Soumis le', 'Statut', 'Actions']}
          rows={[
            ['Ahmed Benali', 'Rapport PFE', 'v3', '10 Mai', <Badge label="En attente" variant="warning" />, <div style={{ display: 'flex', gap: 4 }}><Btn small>Examiner</Btn><Btn small variant="secondary">Annoter</Btn></div>],
            ['Sara Kaci', 'Rapport mensuel #3', 'v1', '09 Mai', <Badge label="En attente" variant="warning" />, <div style={{ display: 'flex', gap: 4 }}><Btn small>Examiner</Btn><Btn small variant="secondary">Annoter</Btn></div>],
            ['Yasmine Ait', 'Présentation soutenance', 'v2', '12 Mai', <Badge label="Validé" variant="success" />, <Btn small variant="secondary">Voir</Btn>],
            ['Mohamed Hamdi', 'Rapport mensuel #2', 'v1', '01 Avr', <Badge label="Retard" variant="error" />, <Btn small variant="secondary">Voir</Btn>],
          ]}
        />
      </Card>
    </div>
  )
}

function Messaging() {
  const [active2, setActive2] = useState(0)
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 0, height: 'calc(100vh - 160px)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
      <div style={{ background: 'var(--card)', borderRight: '1px solid var(--border)' }}>
        <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', fontSize: 12, fontWeight: 700 }}>Conversations</div>
        {STUDENTS.map((s, i) => (
          <button key={i} onClick={() => setActive2(i)} style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px',
            background: active2 === i ? '#f0fdf4' : 'transparent', borderLeft: active2 === i ? '3px solid #059669' : '3px solid transparent',
            border: 'none', borderBottom: '1px solid var(--border)', cursor: 'pointer',
          }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 11, color: '#059669' }}>{s.name[0]}</div>
            <div style={{ flex: 1, textAlign: 'left' }}>
              <div style={{ fontSize: 12, fontWeight: 600 }}>{s.name.split(' ')[0]}</div>
              <div style={{ fontSize: 10, color: 'var(--muted-foreground)' }}>Tap pour écrire...</div>
            </div>
            {i < 2 && <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#059669' }} />}
          </button>
        ))}
      </div>
      <div style={{ background: 'var(--card)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', fontSize: 12.5, fontWeight: 700 }}>{STUDENTS[active2].name}</div>
        <div style={{ flex: 1, padding: '12px 14px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ alignSelf: 'flex-start', background: 'var(--muted)', padding: '8px 12px', borderRadius: 10, maxWidth: '70%', fontSize: 12 }}>Bonjour {STUDENTS[active2].name.split(' ')[0]}, avez-vous finalisé le rapport?</div>
          <div style={{ alignSelf: 'flex-end', background: '#059669', color: 'white', padding: '8px 12px', borderRadius: 10, maxWidth: '70%', fontSize: 12 }}>Oui Dr. Meziane, je l&apos;ai soumis hier soir.</div>
        </div>
        <div style={{ padding: '10px 14px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
          <input placeholder="Écrire..." style={{ flex: 1, padding: '7px 10px', borderRadius: 5, border: '1px solid var(--border)', fontSize: 12, background: 'var(--background)', color: 'var(--foreground)', outline: 'none' }} />
          <Btn color="#059669">Envoyer</Btn>
        </div>
      </div>
    </div>
  )
}

function EvaluationGrid() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 700 }}>
      <SectionTitle>Grille d'évaluation finale</SectionTitle>
      <Card>
        <CardHeader title="Grille encadrant — Yasmine Ait Mohamed" subtitle="PFE: Chatbot RH IA" action={<Badge label="À compléter" variant="warning" />} />
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[
            { critere: 'Maîtrise technique du sujet', coef: 4 },
            { critere: 'Qualité du rapport écrit', coef: 3 },
            { critere: 'Présentation et soutenance', coef: 3 },
            { critere: 'Investissement et sérieux', coef: 2 },
            { critere: 'Respect des délais', coef: 2 },
            { critere: 'Travail en équipe / Communication', coef: 1 },
          ].map((c, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1, fontSize: 12.5 }}>{c.critere}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 10.5, color: 'var(--muted-foreground)' }}>Coef. {c.coef}</span>
                <input type="number" min={0} max={20} placeholder="—" style={{ width: 54, padding: '4px 7px', borderRadius: 4, border: '1px solid var(--border)', fontSize: 12.5, textAlign: 'center', background: 'var(--background)' }} />
                <span style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>/20</span>
              </div>
            </div>
          ))}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontWeight: 700, fontSize: 13 }}>Note finale calculée</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#059669' }}>—/20</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn color="#059669">Soumettre l'évaluation</Btn>
            <Btn variant="secondary">Sauvegarder brouillon</Btn>
          </div>
        </div>
      </Card>
    </div>
  )
}

function Alerts() {
  return (
    <div style={{ maxWidth: 640 }}>
      <SectionTitle>Alertes automatiques</SectionTitle>
      <Card>
        {[
          { icon: '🔴', text: 'Mohamed Hamdi — aucune soumission depuis 40 jours', action: 'Envoyer relance', urgent: true },
          { icon: '🟡', text: 'Ahmed Benali — rapport mensuel #4 non soumis (dû dans 3j)', action: 'Voir', urgent: false },
        ].map((a, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
            background: a.urgent ? '#fff5f5' : 'transparent',
            borderBottom: '1px solid var(--border)',
            borderLeft: a.urgent ? '3px solid #ef4444' : '3px solid transparent',
          }}>
            <span style={{ fontSize: 16 }}>{a.icon}</span>
            <div style={{ flex: 1, fontSize: 12.5 }}>{a.text}</div>
            <Btn small variant={a.urgent ? 'primary' : 'secondary'} color={a.urgent ? '#ef4444' : undefined}>{a.action}</Btn>
          </div>
        ))}
      </Card>
    </div>
  )
}

// Helpers
function TodoItem({ icon, text, action }: { icon: string; text: string; action: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span>{icon}</span>
      <span style={{ flex: 1, fontSize: 12 }}>{text}</span>
      <Btn small variant="secondary">{action}</Btn>
    </div>
  )
}

function MeetingRow({ name, date, topic }: { name: string; date: string; topic: string }) {
  return (
    <div style={{ paddingBottom: 7, borderBottom: '1px solid var(--border)' }}>
      <div style={{ fontSize: 12.5, fontWeight: 600 }}>{name}</div>
      <div style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>{date} · {topic}</div>
    </div>
  )
}

function DocRow({ name, date, badge }: { name: string; date: string; badge: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 6, borderBottom: '1px solid var(--border)' }}>
      <span style={{ fontSize: 13 }}>📄</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12 }}>{name}</div>
        <div style={{ fontSize: 10.5, color: 'var(--muted-foreground)' }}>{date}</div>
      </div>
      {badge}
    </div>
  )
}

// Icons
function GridIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg> }
function UsersIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> }
function FileIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> }
function ClipboardIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg> }
function MessageIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> }
function StarIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> }
function BellIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg> }
function TrendingIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg> }
