import { useCallback, useEffect, useState, type FormEvent } from 'react'
import type { AuthUser } from '../api'
import { apiRequest, downloadFile } from '../api'
import WireframeShell from './WireframeShell'
import { Btn, Card, CardHeader, ProgressBar, StatCard, Table } from './ui'
import { Field, Icon, Notice, StatusBadge, formatDate, fullName } from './dashboardHelpers'

interface StudentRow { id: number; pfe_id: number; name: string; project: string; progress: number; status: string; last_submission_at?: string; inactive_days?: number; alert: boolean }
interface PFEValidation { id: number; title: string; status: string; student: { first_name: string; last_name: string }; entreprise?: { name: string } }
interface DocumentRow { id: number; name: string; type: string; version: number; status: string; comments?: string; created_at: string; pfe: { student: { first_name: string; last_name: string } } }
interface AppointmentRow { id: number; scheduled_at: string; location?: string; agenda?: string; status: string; pfe: { student: { first_name: string; last_name: string } } }
interface DefenseRow { id: number; date: string; room: string; status: string; pfe: { student: { first_name: string; last_name: string } }; evaluations: Array<{ evaluator_id: number; score: string; comments?: string }> }
interface MessageRow { id: number; sender_id: number; message: string; created_at: string; sender: { first_name: string; last_name: string } }
interface ModificationRequestRow {
  id: number; reason: string; status: string; created_at: string;
  pfe: { id: number; title: string; student: { first_name: string; last_name: string } };
}
interface SupervisorData {
  students: StudentRow[]; subject_validations: PFEValidation[]; modification_requests: ModificationRequestRow[]; documents_review: DocumentRow[]; appointments: AppointmentRow[]; defenses: DefenseRow[]; alerts: StudentRow[];
  kpis: { students_count: number; average_progress: number; pending_validations: number; pending_documents: number; alerts_count: number };
}

const NAV = [
  { icon: <Icon symbol="⌂" />, label: 'Tableau de bord' },
  { icon: <Icon symbol="♙" />, label: 'Étudiants suivis' },
  { icon: <Icon symbol="✓" />, label: 'Validation des sujets' },
  { icon: <Icon symbol="▣" />, label: 'Documents' },
  { icon: <Icon symbol="◇" />, label: 'Rendez-vous' },
  { icon: <Icon symbol="✉" />, label: 'Messagerie' },
  { icon: <Icon symbol="★" />, label: 'Évaluations' },
]

export default function LiveSupervisorDashboard({ user, onLogout }: { user: AuthUser; onLogout: () => void }) {
  const [active, setActive] = useState(0)
  const [data, setData] = useState<SupervisorData | null>(null)
  const [selectedPfe, setSelectedPfe] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const load = useCallback(async () => {
    setError('')
    try { setData(await apiRequest<SupervisorData>('/supervisor/dashboard')) }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Chargement impossible.') }
  }, [])
  useEffect(() => { void load() }, [load])
  const flash = (message: string) => { setSuccess(message); window.setTimeout(() => setSuccess(''), 3500) }
  const openMessages = (pfeId: number) => { setSelectedPfe(pfeId); setActive(5) }

  return <WireframeShell
    roleLabel="Encadrant" roleColor="#059669" userName={`${user.first_name} ${user.last_name}`} navItems={NAV}
    activeNav={active} onNavChange={setActive} onLogout={onLogout} notifCount={(data?.kpis.pending_validations || 0) + (data?.kpis.pending_documents || 0)}
  >
    {error && <Notice kind="error">{error}</Notice>}
    {success && <Notice kind="success">{success}</Notice>}
    {!data && !error && <Notice>Chargement de l’espace encadrant…</Notice>}
    {data && active === 0 && <SupervisorHome data={data} openMessages={openMessages} />}
    {data && active === 1 && <Students data={data} openMessages={openMessages} />}
    {data && active === 2 && <Validations data={data} reload={load} flash={flash} setError={setError} />}
    {data && active === 3 && <DocumentReviews data={data} reload={load} flash={flash} setError={setError} />}
    {data && active === 4 && <Appointments data={data} reload={load} flash={flash} setError={setError} />}
    {data && active === 5 && <Messages data={data} selectedPfe={selectedPfe} selectPfe={setSelectedPfe} setError={setError} />}
    {data && active === 6 && <Evaluations user={user} data={data} reload={load} flash={flash} setError={setError} />}
  </WireframeShell>
}

function SupervisorHome({ data, openMessages }: { data: SupervisorData; openMessages: (id: number) => void }) {
  return <div className="page-stack">
    <div className="stats-grid">
      <StatCard label="Étudiants suivis" value={data.kpis.students_count} color="#059669" />
      <StatCard label="Progression moyenne" value={`${data.kpis.average_progress}%`} color="#2563eb" />
      <StatCard label="Validations en attente" value={data.kpis.pending_validations + data.kpis.pending_documents} color="#d97706" />
      <StatCard label="Alertes d’inactivité" value={data.kpis.alerts_count} color="#dc2626" />
    </div>
    <Card><CardHeader title="Vue synthétique des étudiants" /><Table headers={['Étudiant', 'Sujet', 'Progression', 'Statut', 'Dernière activité', 'Action']} rows={data.students.map((item) => [item.name, item.project, <ProgressBar value={item.progress} color={item.alert ? '#dc2626' : '#059669'} />, <StatusBadge status={item.status} />, formatDate(item.last_submission_at), <Btn small variant="secondary" onClick={() => openMessages(item.pfe_id)}>Contacter</Btn>])} />{!data.students.length && <div className="table-empty">Aucun PFE affecté.</div>}</Card>
    {data.alerts.length > 0 && <Card><CardHeader title="Alertes automatiques" /><div style={{ padding: 14, display: 'grid', gap: 8 }}>{data.alerts.map((item) => <Notice key={item.pfe_id} kind="error"><strong>{item.name}</strong> — {item.inactive_days == null ? 'aucune activité enregistrée' : `${item.inactive_days} jours sans dépôt`}.</Notice>)}</div></Card>}
  </div>
}

function Students({ data, openMessages }: { data: SupervisorData; openMessages: (id: number) => void }) {
  return <div className="page-stack"><div className="page-title"><div><h1>Étudiants suivis</h1><p>Progression calculée à partir des jalons déclarés.</p></div></div>{data.students.map((item) => <Card key={item.pfe_id}><CardHeader title={item.name} subtitle={item.project} action={<StatusBadge status={item.status} />} /><div style={{ padding: 16, display: 'grid', gap: 12 }}><ProgressBar value={item.progress} label="Progression globale" color={item.alert ? '#dc2626' : '#059669'} /><div className="button-row"><Btn small onClick={() => openMessages(item.pfe_id)}>Ouvrir la messagerie</Btn>{item.alert && <span style={{ color: '#991b1b', fontSize: 12 }}>Inactivité détectée</span>}</div></div></Card>)}</div>
}

function Validations({ data, reload, flash, setError }: ActionProps) {
  const decide = async (pfeId: number, status: string) => {
    const comments = status === 'Validé encadrant' ? window.prompt('Commentaire facultatif :') : window.prompt('Motif obligatoire :')
    if (comments === null || (status !== 'Validé encadrant' && !comments.trim())) return
    try { await apiRequest(`/supervisor/pfes/${pfeId}/subject-decision`, { method: 'POST', body: JSON.stringify({ status, comments: comments || null }) }); flash('Décision enregistrée.'); await reload() }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Action impossible.') }
  }
  const decideModification = async (requestId: number, decision: 'Approuvée' | 'Rejetée') => {
    const note = decision === 'Approuvée' ? window.prompt('Note facultative pour l’étudiant :') : window.prompt('Motif obligatoire du refus :')
    if (note === null || (decision === 'Rejetée' && !note.trim())) return
    try {
      await apiRequest(`/supervisor/modification-requests/${requestId}/decision`, { method: 'POST', body: JSON.stringify({ decision, decision_note: note || null }) })
      flash(decision === 'Approuvée' ? 'La fiche PFE a été rouverte.' : 'La demande a été refusée.'); await reload()
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Action impossible.') }
  }
  return <div className="page-stack">
    <div className="page-title"><div><h1>Validation des sujets</h1><p>Validation initiale et demandes de réouverture des fiches validées.</p></div></div>
    <Card><CardHeader title="Sujets soumis" subtitle="Première étape du circuit de validation." /><div style={{ padding: 14, display: 'grid', gap: 12 }}>{data.subject_validations.map((pfe) => <div key={pfe.id} className="callout"><strong>{pfe.title}</strong><div style={{ margin: '4px 0 10px' }}>{fullName(pfe.student)} — {pfe.entreprise?.name || 'Organisme non précisé'}</div><div className="button-row"><Btn small onClick={() => void decide(pfe.id, 'Validé encadrant')}>Valider</Btn><Btn small variant="secondary" onClick={() => void decide(pfe.id, 'Modifications demandées')}>Demander des modifications</Btn><Btn small variant="secondary" onClick={() => void decide(pfe.id, 'Refusé')}>Refuser</Btn></div></div>)}{!data.subject_validations.length && <Notice kind="success">Aucun sujet soumis en attente.</Notice>}</div></Card>
    <Card><CardHeader title="Demandes de modification" subtitle="Réouverture d’une fiche déjà validée." /><div style={{ padding: 14, display: 'grid', gap: 12 }}>{data.modification_requests.map((item) => <div key={item.id} className="callout"><div className="button-row" style={{ justifyContent: 'space-between' }}><strong>{item.pfe.title}</strong><StatusBadge status={item.status} /></div><div style={{ marginTop: 5 }}>{fullName(item.pfe.student)} — demande du {formatDate(item.created_at)}</div><div style={{ margin: '8px 0 10px' }}>{item.reason}</div><div className="button-row"><Btn small onClick={() => void decideModification(item.id, 'Approuvée')}>Autoriser la modification</Btn><Btn small variant="secondary" onClick={() => void decideModification(item.id, 'Rejetée')}>Refuser</Btn></div></div>)}{!data.modification_requests.length && <Notice kind="success">Aucune demande de modification en attente.</Notice>}</div></Card>
  </div>
}

function DocumentReviews({ data, reload, flash, setError }: ActionProps) {
  const review = async (document: DocumentRow, status: string) => {
    const comments = status === 'Validé' ? window.prompt('Commentaire facultatif :') : window.prompt('Retour obligatoire :')
    if (comments === null || (status !== 'Validé' && !comments.trim())) return
    try { await apiRequest(`/supervisor/documents/${document.id}/review`, { method: 'POST', body: JSON.stringify({ status, comments: comments || null }) }); flash('Retour envoyé à l’étudiant.'); await reload() }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Action impossible.') }
  }
  return <div className="page-stack"><div className="page-title"><div><h1>Documents à examiner</h1><p>Rapports et livrables des PFE encadrés.</p></div></div><Card><Table headers={['Étudiant', 'Document', 'Version', 'Date', 'Statut', 'Actions']} rows={data.documents_review.map((item) => [fullName(item.pfe.student), `${item.name} (${item.type})`, `v${item.version}`, formatDate(item.created_at), <StatusBadge status={item.status} />, <div className="button-row"><Btn small variant="secondary" onClick={() => void downloadFile(`/documents/${item.id}/download`, item.name).catch((reason: Error) => setError(reason.message))}>Ouvrir</Btn><Btn small onClick={() => void review(item, 'Validé')}>Valider</Btn><Btn small variant="secondary" onClick={() => void review(item, 'Modifications demandées')}>Retour</Btn></div>])} />{!data.documents_review.length && <div className="table-empty">Aucun document.</div>}</Card></div>
}

function Appointments({ data, reload, flash, setError }: ActionProps) {
  const respond = async (item: AppointmentRow, status: string) => {
    const response = window.prompt('Message de réponse (facultatif) :')
    if (response === null) return
    try { await apiRequest(`/supervisor/appointments/${item.id}/response`, { method: 'POST', body: JSON.stringify({ status, response: response || null }) }); flash('Réponse enregistrée.'); await reload() }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Réponse impossible.') }
  }
  return <div className="page-stack"><div className="page-title"><div><h1>Rendez-vous de suivi</h1><p>Demandes formulées par les étudiants.</p></div></div><Card><Table headers={['Étudiant', 'Date proposée', 'Lieu', 'Objet', 'Statut', 'Action']} rows={data.appointments.map((item) => [fullName(item.pfe.student), formatDate(item.scheduled_at, true), item.location || 'À distance', item.agenda || 'Suivi général', <StatusBadge status={item.status} />, item.status === 'En attente' ? <div className="button-row"><Btn small onClick={() => void respond(item, 'Confirmé')}>Confirmer</Btn><Btn small variant="secondary" onClick={() => void respond(item, 'Refusé')}>Refuser</Btn></div> : '—'])} />{!data.appointments.length && <div className="table-empty">Aucune demande.</div>}</Card></div>
}

function Messages({ data, selectedPfe, selectPfe, setError }: { data: SupervisorData; selectedPfe: number | null; selectPfe: (id: number) => void; setError: (message: string) => void }) {
  const [messages, setMessages] = useState<MessageRow[]>([])
  const [text, setText] = useState('')
  const current = selectedPfe || data.students[0]?.pfe_id || null
  const loadMessages = useCallback(async () => {
    if (!current) return setMessages([])
    try { setMessages(await apiRequest<MessageRow[]>(`/supervisor/pfes/${current}/messages`)) }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Messagerie indisponible.') }
  }, [current, setError])
  useEffect(() => { void loadMessages() }, [loadMessages])
  const submit = async (event: FormEvent) => {
    event.preventDefault(); if (!current) return
    try { await apiRequest(`/supervisor/pfes/${current}/messages`, { method: 'POST', body: JSON.stringify({ message: text }) }); setText(''); await loadMessages() }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Envoi impossible.') }
  }
  return <div className="page-stack"><div className="page-title"><div><h1>Messagerie</h1><p>Fil de discussion rattaché au PFE.</p></div></div><Card><div className="form-grid"><Field label="Étudiant" full><select value={current || ''} onChange={(e) => selectPfe(Number(e.target.value))}>{data.students.map((item) => <option key={item.pfe_id} value={item.pfe_id}>{item.name} — {item.project}</option>)}</select></Field></div><div style={{ padding: 16, minHeight: 260, maxHeight: 430, overflowY: 'auto', borderTop: '1px solid var(--border)', display: 'grid', gap: 10 }}>{messages.map((item) => <div key={item.id} className="callout"><strong>{fullName(item.sender)}</strong><div>{item.message}</div><small>{formatDate(item.created_at, true)}</small></div>)}{!messages.length && <div className="table-empty">Aucun message.</div>}</div><form style={{ padding: 14, borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }} onSubmit={submit}><input aria-label="Message" required value={text} onChange={(e) => setText(e.target.value)} style={{ flex: 1, border: '1px solid var(--border)', borderRadius: 6, padding: 9 }} /><Btn type="submit">Envoyer</Btn></form></Card></div>
}

function Evaluations({ user, data, reload, flash, setError }: { user: AuthUser; data: SupervisorData; reload: () => Promise<void>; flash: (message: string) => void; setError: (message: string) => void }) {
  return <div className="page-stack"><div className="page-title"><div><h1>Évaluations</h1><p>Grille simplifiée des soutenances auxquelles vous participez.</p></div></div>{data.defenses.map((defense) => <EvaluationForm key={defense.id} user={user} defense={defense} reload={reload} flash={flash} setError={setError} />)}{!data.defenses.length && <Notice>Aucune soutenance affectée.</Notice>}</div>
}

function EvaluationForm({ user, defense, reload, flash, setError }: { user: AuthUser; defense: DefenseRow; reload: () => Promise<void>; flash: (message: string) => void; setError: (message: string) => void }) {
  const existing = defense.evaluations.find((item) => item.evaluator_id === user.id)
  const [score, setScore] = useState(existing?.score || '')
  const [comments, setComments] = useState(existing?.comments || '')
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    try { await apiRequest('/supervisor/evaluations', { method: 'POST', body: JSON.stringify({ soutenance_id: defense.id, score: Number(score), comments: comments || null }) }); flash('Évaluation enregistrée.'); await reload() }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Évaluation impossible.') }
  }
  return <Card><CardHeader title={fullName(defense.pfe.student)} subtitle={`${formatDate(defense.date, true)} — ${defense.room}`} action={<StatusBadge status={existing ? 'Évaluation enregistrée' : defense.status} />} /><form className="form-grid" onSubmit={submit}><Field label="Note /20"><input required type="number" min="0" max="20" step="0.25" value={score} onChange={(e) => setScore(e.target.value)} /></Field><Field label="Commentaires"><textarea value={comments} onChange={(e) => setComments(e.target.value)} /></Field><div className="form-actions"><Btn type="submit">Enregistrer</Btn></div></form></Card>
}

interface ActionProps { data: SupervisorData; reload: () => Promise<void>; flash: (message: string) => void; setError: (message: string) => void }
