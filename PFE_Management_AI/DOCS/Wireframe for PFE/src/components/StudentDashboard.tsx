import { useState } from 'react'
import WireframeShell from './WireframeShell'
import { Card, CardHeader, StatCard, Badge, ProgressBar, SectionTitle, Btn, Timeline } from './ui'

const NAV = [
  { icon: <GridIcon />, label: 'Tableau de bord' },
  { icon: <FileIcon />, label: 'Fiche PFE' },
  { icon: <TrendingIcon />, label: 'Suivi & Progrès' },
  { icon: <MessageIcon />, label: 'Supervision', badge: 3 },
  { icon: <FolderIcon />, label: 'Documents' },
  { icon: <CalendarIcon />, label: 'Soutenance' },
  { icon: <BellIcon />, label: 'Notifications', badge: 5 },
]

export default function StudentDashboard() {
  const [active, setActive] = useState(0)

  return (
    <WireframeShell
      roleLabel="Étudiant"
      roleColor="#2563eb"
      userName="Ahmed Benali"
      navItems={NAV}
      activeNav={active}
      onNavChange={setActive}
      notifCount={5}
    >
      {active === 0 && <StudentHome />}
      {active === 1 && <FichePFE />}
      {active === 2 && <ProgressTracking />}
      {active === 3 && <Supervision />}
      {active === 4 && <Documents />}
      {active === 5 && <Defense />}
      {active === 6 && <Notifications />}
    </WireframeShell>
  )
}

function StudentHome() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        <StatCard label="Progression globale" value="64%" color="#2563eb" sub="En cours" icon={<TrendingIcon />} />
        <StatCard label="Statut sujet" value="Validé" color="#059669" sub="Depuis le 12 mars" icon={<CheckIcon />} />
        <StatCard label="Rapports soumis" value="3" color="#d97706" sub="sur 5 attendus" icon={<FileIcon />} />
        <StatCard label="Jours avant soutenance" value="42" color="#7c3aed" sub="22 juin 2025" icon={<CalendarIcon />} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16 }}>
        {/* PFE Summary */}
        <Card>
          <CardHeader title="Mon PFE" subtitle="Résumé de la fiche" action={<Btn variant="secondary" small>Voir fiche complète</Btn>} />
          <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <InfoRow label="Titre" value="Système de gestion intelligente des stocks via ML" />
              <InfoRow label="Organisme" value="TechCorp Algérie — Informatique" />
              <InfoRow label="Encadrant académique" value="Dr. Karim Meziane" />
              <InfoRow label="Encadrant entreprise" value="M. Samir Hadj" />
              <InfoRow label="Date début" value="01 Février 2025" />
              <InfoRow label="Date fin prévue" value="30 Juin 2025" />
            </div>
            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: 11, color: 'var(--muted-foreground)', marginBottom: 6 }}>Statut du sujet</div>
              <Badge label="✓ Validé" variant="success" />
            </div>
          </div>
        </Card>

        {/* Timeline + notifications */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Card>
            <CardHeader title="Jalons PFE" />
            <div style={{ padding: '16px' }}>
              <Timeline
                steps={['Cahier des charges', 'Conception', 'Implémentation', 'Rédaction', 'Soutenance']}
                active={2}
              />
            </div>
          </Card>

          <Card>
            <CardHeader title="Alertes & Rappels" />
            <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <AlertRow icon="🔴" text="Rapport mensuel dû dans 3 jours" />
              <AlertRow icon="🟡" text="Réunion avec encadrant demain 10h" />
              <AlertRow icon="🔵" text="Nouveau commentaire sur votre rapport v2" />
            </div>
          </Card>
        </div>
      </div>

      {/* Progress bars */}
      <Card>
        <CardHeader title="Progression par jalon" />
        <div style={{ padding: '14px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <ProgressBar value={100} color="#059669" label="Cahier des charges" />
          <ProgressBar value={85} color="#059669" label="Conception" />
          <ProgressBar value={55} color="#2563eb" label="Implémentation" />
          <ProgressBar value={20} color="#d97706" label="Rédaction du rapport" />
        </div>
      </Card>
    </div>
  )
}

function FichePFE() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 800 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Fiche PFE</h1>
          <p style={{ fontSize: 12, color: 'var(--muted-foreground)', margin: '4px 0 0' }}>Informations complètes sur votre projet de fin d'études</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn variant="secondary">Exporter PDF</Btn>
          <Btn>Modifier</Btn>
        </div>
      </div>

      <Card>
        <CardHeader title="Informations générales" />
        <div style={{ padding: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <FormField label="Titre du PFE" value="Système de gestion intelligente des stocks via ML" full />
          <FormField label="Filière" value="Génie Informatique" />
          <FormField label="Spécialité" value="Intelligence Artificielle" />
          <FormField label="Année académique" value="2024–2025" />
        </div>
      </Card>

      <Card>
        <CardHeader title="Organisme d'accueil" />
        <div style={{ padding: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <FormField label="Nom de l'entreprise" value="TechCorp Algérie" />
          <FormField label="Secteur" value="Technologies de l'Information" />
          <FormField label="Adresse" value="Rue des Frères, Alger, Algérie" />
          <FormField label="Contact entreprise" value="+213 23 456 789" />
        </div>
      </Card>

      <Card>
        <CardHeader title="Encadrement" />
        <div style={{ padding: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <FormField label="Encadrant académique" value="Dr. Karim Meziane" />
          <FormField label="Email encadrant" value="k.meziane@univ-alger.dz" />
          <FormField label="Encadrant entreprise" value="M. Samir Hadj" />
          <FormField label="Email encadrant entreprise" value="s.hadj@techcorp.dz" />
        </div>
      </Card>

      <Card>
        <CardHeader title="Dates & Statut" />
        <div style={{ padding: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
          <FormField label="Date de début" value="01/02/2025" />
          <FormField label="Date de fin prévue" value="30/06/2025" />
          <div>
            <div style={{ fontSize: 11, color: 'var(--muted-foreground)', marginBottom: 5, fontWeight: 600 }}>Statut</div>
            <Badge label="✓ Validé" variant="success" />
          </div>
        </div>
      </Card>
    </div>
  )
}

function ProgressTracking() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SectionTitle>Suivi de Progression</SectionTitle>

      <Card>
        <CardHeader title="Chronologie des jalons" subtitle="Vue globale de votre avancement" />
        <div style={{ padding: '24px 20px' }}>
          <Timeline steps={['Cahier des charges', 'Conception', 'Implémentation', 'Rédaction', 'Soutenance']} active={2} />
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Card>
          <CardHeader title="Progression globale" action={<span style={{ fontSize: 20, fontWeight: 700, color: '#2563eb' }}>64%</span>} />
          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <ProgressBar value={100} color="#059669" label="Cahier des charges" />
            <ProgressBar value={85} color="#059669" label="Conception" />
            <ProgressBar value={55} color="#2563eb" label="Implémentation" />
            <ProgressBar value={20} color="#d97706" label="Rédaction" />
            <ProgressBar value={0} color="#d1d8e8" label="Soutenance" />
          </div>
        </Card>

        <Card>
          <CardHeader title="Rapports périodiques" action={<Btn small>+ Soumettre rapport</Btn>} />
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                  {['Rapport', 'Période', 'Soumis le', 'Statut'].map(h => (
                    <th key={h} style={{ padding: '7px 12px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ['Rapport #1', 'Fév 2025', '28/02/2025', <Badge label="Validé" variant="success" />],
                  ['Rapport #2', 'Mars 2025', '31/03/2025', <Badge label="Validé" variant="success" />],
                  ['Rapport #3', 'Avr 2025', '28/04/2025', <Badge label="En attente" variant="warning" />],
                  ['Rapport #4', 'Mai 2025', '—', <Badge label="À soumettre" variant="draft" />],
                ].map((row, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                    {row.map((cell, j) => <td key={j} style={{ padding: '8px 12px', fontSize: 12 }}>{cell}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader title="Journal de bord (Logbook)" action={<Btn small>+ Ajouter entrée</Btn>} />
        <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { date: '12 Mai 2025', text: 'Finalisation du module de prédiction — tests unitaires passent à 92%' },
            { date: '08 Mai 2025', text: 'Réunion avec encadrant entreprise. Points discutés: API REST & format données' },
            { date: '02 Mai 2025', text: 'Début de l\'intégration du modèle ML avec le back-end Flask' },
          ].map((e, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, paddingBottom: 8, borderBottom: i < 2 ? '1px solid var(--border)' : 'none' }}>
              <span style={{ fontSize: 11, color: 'var(--muted-foreground)', whiteSpace: 'nowrap', marginTop: 1, minWidth: 90 }}>{e.date}</span>
              <span style={{ fontSize: 12, color: 'var(--foreground)' }}>{e.text}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

function Supervision() {
  const [msg, setMsg] = useState('')
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16, height: '100%' }}>
      {/* Messaging */}
      <Card style={{ display: 'flex', flexDirection: 'column' }}>
        <CardHeader title="Messagerie — Dr. Karim Meziane" subtitle="Encadrant académique" />
        <div style={{ flex: 1, padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto', minHeight: 300 }}>
          <ChatBubble from="them" name="Dr. Meziane" text="Bonjour Ahmed, j'ai examiné votre rapport #2. Bonne progression générale. Quelques points à améliorer sur la section conception." time="08 Mai, 14:30" />
          <ChatBubble from="me" text="Merci Dr. Meziane. J'ai pris note. Je vais réviser la section 3.2 concernant le diagramme de classes." time="08 Mai, 15:10" />
          <ChatBubble from="them" name="Dr. Meziane" text="Parfait. N'oubliez pas de soumettre le rapport #3 avant fin du mois." time="08 Mai, 15:25" />
          <ChatBubble from="me" text="Entendu, je le soumettrai avant le 28 mai." time="09 Mai, 09:00" />
        </div>
        <div style={{ padding: '10px 14px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
          <input
            value={msg}
            onChange={e => setMsg(e.target.value)}
            placeholder="Écrire un message..."
            style={{
              flex: 1, padding: '8px 12px', borderRadius: 6,
              border: '1px solid var(--border)', fontSize: 12,
              background: 'var(--background)', color: 'var(--foreground)',
              outline: 'none',
            }}
          />
          <Btn>Envoyer</Btn>
        </div>
      </Card>

      {/* Side panels */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Card>
          <CardHeader title="Demander une réunion" />
          <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <FormField label="Date souhaitée" value="20/05/2025" />
            <FormField label="Créneau" value="10h00 – 11h00" />
            <FormField label="Objet" value="Revue du rapport #3" />
            <Btn style={{ marginTop: 4 }}>Envoyer la demande</Btn>
          </div>
        </Card>

        <Card>
          <CardHeader title="Historique des feedbacks" />
          <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { date: '28 Avr', text: 'Architecture bien structurée. Améliorer les justifications de choix technologiques.', color: '#059669' },
              { date: '31 Mars', text: 'Rapport #2 accepté avec réserves sur la partie analyse comparative.', color: '#d97706' },
              { date: '28 Fév', text: 'Très bon départ. Rapport #1 approuvé.', color: '#059669' },
            ].map((f, i) => (
              <div key={i} style={{ paddingBottom: 8, borderBottom: i < 2 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ fontSize: 10, color: 'var(--muted-foreground)', marginBottom: 2 }}>{f.date}</div>
                <div style={{ fontSize: 11.5, color: 'var(--foreground)', lineHeight: 1.4 }}>{f.text}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}

function Documents() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <SectionTitle>Mes Documents</SectionTitle>
        <Btn>+ Déposer un fichier</Btn>
      </div>

      <Card>
        <CardHeader title="Documents soumis" />
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--muted)' }}>
                {['Document', 'Type', 'Version', 'Taille', 'Soumis le', 'Statut', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'var(--muted-foreground)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ['Rapport PFE', 'PDF', 'v3', '2.4 MB', '10 Mai 2025', <Badge label="Validé" variant="success" />, <Btn small variant="secondary">Voir</Btn>],
                ['Convention de stage', 'PDF', 'v1', '350 KB', '01 Fév 2025', <Badge label="Validé" variant="success" />, <Btn small variant="secondary">Voir</Btn>],
                ['Rapport mensuel #3', 'PDF', 'v1', '1.1 MB', '28 Avr 2025', <Badge label="En attente" variant="warning" />, <Btn small variant="secondary">Voir</Btn>],
                ['Présentation soutenance', 'PPTX', 'v1', '4.7 MB', '08 Mai 2025', <Badge label="Brouillon" variant="draft" />, <Btn small variant="secondary">Voir</Btn>],
              ].map((row, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                  {row.map((cell, j) => <td key={j} style={{ padding: '9px 12px', fontSize: 12 }}>{cell}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <CardHeader title="Zone de dépôt" subtitle="PDF, DOCX, PPTX — max 10 MB" />
        <div style={{
          margin: '14px 16px',
          border: '2px dashed var(--border)',
          borderRadius: 8,
          padding: '32px',
          textAlign: 'center',
          background: 'var(--muted)',
        }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>📂</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--foreground)', marginBottom: 4 }}>Glisser-déposer ici</div>
          <div style={{ fontSize: 11, color: 'var(--muted-foreground)', marginBottom: 12 }}>ou</div>
          <Btn variant="secondary">Parcourir les fichiers</Btn>
        </div>
      </Card>
    </div>
  )
}

function Defense() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 700 }}>
      <SectionTitle>Soutenance</SectionTitle>

      <Card>
        <CardHeader title="Informations de soutenance" />
        <div style={{ padding: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <FormField label="Date" value="22 Juin 2025" />
          <FormField label="Heure" value="10h00" />
          <FormField label="Salle" value="Amphithéâtre B — Bât. Informatique" />
          <FormField label="Durée" value="45 minutes" />
        </div>
      </Card>

      <Card>
        <CardHeader title="Composition du jury" />
        <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { role: 'Président', name: 'Pr. Amina Bouzid', dept: 'Chef de filière — Génie Info' },
            { role: 'Encadrant', name: 'Dr. Karim Meziane', dept: 'Maître de conférences' },
            { role: 'Examinateur', name: 'Dr. Rachid Ouali', dept: 'Département IA' },
          ].map((j, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: i < 2 ? '1px solid var(--border)' : 'none' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#e8edf5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, color: '#1e3a5f' }}>
                {j.name[0]}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12.5, fontWeight: 600 }}>{j.name}</div>
                <div style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>{j.dept}</div>
              </div>
              <Badge label={j.role} variant="info" />
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader title="Dépôt des documents finaux" />
        <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Badge label="✓ Soumis" variant="success" />
            <span style={{ fontSize: 12 }}>Rapport final v3 — soumis le 10 Mai 2025</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Badge label="À soumettre" variant="warning" />
            <span style={{ fontSize: 12 }}>Présentation PowerPoint (date limite : 15 Juin 2025)</span>
            <Btn small>Déposer</Btn>
          </div>
        </div>
      </Card>
    </div>
  )
}

function Notifications() {
  return (
    <div style={{ maxWidth: 640 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <SectionTitle>Notifications</SectionTitle>
        <Btn variant="ghost" small>Tout marquer comme lu</Btn>
      </div>
      <Card>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {[
            { icon: '🔴', text: 'Rapport mensuel #4 à soumettre avant le 31 Mai', time: 'Il y a 2h', unread: true },
            { icon: '💬', text: 'Nouveau commentaire de Dr. Meziane sur votre rapport v3', time: 'Hier, 14:30', unread: true },
            { icon: '✅', text: 'Votre rapport #3 a été accepté', time: '28 Avr 2025', unread: false },
            { icon: '📅', text: 'Réunion confirmée pour le 20 Mai à 10h00', time: '15 Mai 2025', unread: false },
            { icon: '📄', text: 'Convention de stage générée — disponible en téléchargement', time: '01 Fév 2025', unread: false },
          ].map((n, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 14px',
              background: n.unread ? '#eff6ff' : 'transparent',
              borderBottom: '1px solid var(--border)',
              borderLeft: n.unread ? '3px solid #2563eb' : '3px solid transparent',
            }}>
              <span style={{ fontSize: 16 }}>{n.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12.5, color: 'var(--foreground)', fontWeight: n.unread ? 600 : 400 }}>{n.text}</div>
                <div style={{ fontSize: 11, color: 'var(--muted-foreground)', marginTop: 2 }}>{n.time}</div>
              </div>
              {n.unread && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#2563eb', marginTop: 4, flexShrink: 0 }} />}
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

// Small helpers
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: 'var(--muted-foreground)', fontWeight: 600, marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
      <div style={{ fontSize: 12.5, color: 'var(--foreground)' }}>{value}</div>
    </div>
  )
}

function FormField({ label, value, full }: { label: string; value: string; full?: boolean }) {
  return (
    <div style={full ? { gridColumn: '1 / -1' } : {}}>
      <div style={{ fontSize: 11, color: 'var(--muted-foreground)', fontWeight: 600, marginBottom: 4 }}>{label}</div>
      <div style={{
        padding: '7px 10px', borderRadius: 5,
        border: '1px solid var(--border)',
        fontSize: 12.5, color: 'var(--foreground)',
        background: 'var(--background)',
      }}>
        {value}
      </div>
    </div>
  )
}

function AlertRow({ icon, text }: { icon: string; text: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
      <span>{icon}</span>
      <span style={{ fontSize: 12, color: 'var(--foreground)', lineHeight: 1.4 }}>{text}</span>
    </div>
  )
}

function ChatBubble({ from, text, name, time }: { from: 'me' | 'them'; text: string; name?: string; time: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: from === 'me' ? 'flex-end' : 'flex-start' }}>
      {name && <span style={{ fontSize: 10, color: 'var(--muted-foreground)', marginBottom: 3 }}>{name}</span>}
      <div style={{
        maxWidth: '75%', padding: '8px 12px', borderRadius: 10,
        background: from === 'me' ? '#2563eb' : 'var(--muted)',
        color: from === 'me' ? 'white' : 'var(--foreground)',
        fontSize: 12.5, lineHeight: 1.5,
      }}>
        {text}
      </div>
      <span style={{ fontSize: 10, color: 'var(--muted-foreground)', marginTop: 3 }}>{time}</span>
    </div>
  )
}

// Icons
function GridIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg> }
function FileIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> }
function TrendingIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg> }
function MessageIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> }
function FolderIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg> }
function CalendarIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> }
function BellIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg> }
function CheckIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg> }
