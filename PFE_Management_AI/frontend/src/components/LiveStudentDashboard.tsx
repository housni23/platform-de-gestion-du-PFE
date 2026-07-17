import { useCallback, useEffect, useState, type FormEvent } from 'react'
import type { AuthUser } from '../api'
import { apiRequest, downloadFile } from '../api'
import WireframeShell from './WireframeShell'
import { Btn, Card, CardHeader, ProgressBar, StatCard, Table, Timeline } from './ui'
import { Field, Icon, Notice, StatusBadge, formatDate, fullName, moneylessSize } from './dashboardHelpers'

interface Milestone { id: number; name: string; progress: number; status: string; due_date?: string | null }
interface Company { id: number; name: string; sector?: string; address?: string; city?: string; contact_phone?: string; supervisor_name?: string; supervisor_email?: string }
interface DocumentItem { id: number; name: string; original_name?: string; type: string; version: number; status: string; comments?: string; size?: number; created_at: string }
interface NotificationItem { id: number; title: string; content?: string; type: string; action_url?: string; is_read: boolean; created_at: string }
interface Report { id: number; percentage: number; description: string; created_at: string }
interface Appointment { id: number; scheduled_at: string; location?: string; agenda?: string; status: string; response?: string }
interface Defense { id: number; date: string; room: string; status: string; jury_members?: Array<{ role: string; user: { first_name: string; last_name: string } }> }
interface ModificationRequest {
  id: number; reason: string; status: string; decision_note?: string | null; created_at: string; decided_at?: string | null;
  decider?: { first_name: string; last_name: string } | null;
}
interface Pfe {
  id: number; title: string; description?: string; status: string; refusal_reason?: string; start_date?: string; end_date?: string;
  filiere_id: number; academic_year_id: number; entreprise?: Company; academic_supervisor?: { first_name: string; last_name: string; email: string };
  filiere?: { id: number; name: string; code: string }; academic_year?: { id: number; label: string }; milestones: Milestone[];
}
interface StudentDashboardData {
  pfe: Pfe | null; reports: Report[]; documents: DocumentItem[]; notifications: NotificationItem[]; soutenance: Defense | null; appointments: Appointment[];
  modification_request: ModificationRequest | null;
  kpis: { progress: number; status: string; reports_count: number; days_left: number | null; defense_date: string | null; unread_notifications: number };
  references: { filieres: Array<{ id: number; name: string; code: string }>; academic_years: Array<{ id: number; label: string }> };
}
interface MessageItem { id: number; message: string; created_at: string; sender: { first_name: string; last_name: string }; sender_id: number }

const NAV = [
  { icon: <Icon symbol="⌂" />, label: 'Tableau de bord' },
  { icon: <Icon symbol="▤" />, label: 'Fiche PFE' },
  { icon: <Icon symbol="↗" />, label: 'Suivi & progrès' },
  { icon: <Icon symbol="✉" />, label: 'Encadrement' },
  { icon: <Icon symbol="▣" />, label: 'Documents' },
  { icon: <Icon symbol="◇" />, label: 'Soutenance' },
  { icon: <Icon symbol="♢" />, label: 'Notifications' },
]

export default function LiveStudentDashboard({ user, onLogout }: { user: AuthUser; onLogout: () => void }) {
  const [active, setActive] = useState(0)
  const [data, setData] = useState<StudentDashboardData | null>(null)
  const [messages, setMessages] = useState<MessageItem[]>([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setError('')
    try { setData(await apiRequest<StudentDashboardData>('/student/dashboard')) }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Chargement impossible.') }
    finally { setLoading(false) }
  }, [])

  const loadMessages = useCallback(async () => {
    if (!data?.pfe) return
    try { setMessages(await apiRequest<MessageItem[]>('/student/messages')) }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Messagerie indisponible.') }
  }, [data?.pfe])

  useEffect(() => { void load() }, [load])
  useEffect(() => { if (active === 3) void loadMessages() }, [active, loadMessages])

  const flash = (message: string) => {
    setSuccess(message)
    window.setTimeout(() => setSuccess(''), 3500)
  }

  const userName = `${user.first_name} ${user.last_name}`
  return (
    <WireframeShell
      roleLabel="Étudiant" roleColor="#2563eb" userName={userName} navItems={NAV}
      activeNav={active} onNavChange={setActive} onLogout={onLogout} notifCount={data?.kpis.unread_notifications || 0}
    >
      {error && <Notice kind="error">{error}</Notice>}
      {success && <Notice kind="success">{success}</Notice>}
      {loading && <Notice>Chargement de votre espace…</Notice>}
      {!loading && data && active === 0 && <StudentHome data={data} onNavigate={setActive} />}
      {!loading && data && active === 1 && <PfeEditor data={data} onUpdated={load} flash={flash} setError={setError} />}
      {!loading && data && active === 2 && <ProgressSection data={data} onUpdated={load} flash={flash} setError={setError} />}
      {!loading && data && active === 3 && <SupervisionSection currentUserId={user.id} data={data} messages={messages} reloadMessages={loadMessages} reload={load} flash={flash} setError={setError} />}
      {!loading && data && active === 4 && <DocumentsSection data={data} reload={load} flash={flash} setError={setError} />}
      {!loading && data && active === 5 && <DefenseSection defense={data.soutenance} />}
      {!loading && data && active === 6 && <NotificationsSection notifications={data.notifications} reload={load} setError={setError} />}
    </WireframeShell>
  )
}

function StudentHome({ data, onNavigate }: { data: StudentDashboardData; onNavigate: (index: number) => void }) {
  const pfe = data.pfe
  const firstIncomplete = pfe?.milestones.findIndex((milestone) => milestone.progress < 100) ?? 0
  const activeMilestone = firstIncomplete === -1 ? (pfe?.milestones.length || 0) : firstIncomplete
  return <div className="page-stack">
    {!pfe && <Notice>Votre fiche PFE n’est pas encore créée. <button type="button" onClick={() => onNavigate(1)}>Commencer maintenant</button>.</Notice>}
    <div className="stats-grid">
      <StatCard label="Progression globale" value={`${data.kpis.progress}%`} sub="Calculée depuis les jalons" color="#2563eb" />
      <StatCard label="Statut du sujet" value={data.kpis.status} sub={pfe?.refusal_reason || 'Workflow de validation'} color={data.kpis.status.includes('Validé') ? '#059669' : '#d97706'} />
      <StatCard label="Comptes rendus" value={data.kpis.reports_count} sub="Dépôts horodatés" color="#7c3aed" />
      <StatCard label="Jours restants" value={data.kpis.days_left ?? '—'} sub={formatDate(data.kpis.defense_date)} color="#0f766e" />
    </div>
    {pfe && <div className="two-column">
      <Card>
        <CardHeader title="Mon projet de fin d’études" action={<Btn variant="secondary" small onClick={() => onNavigate(1)}>Ouvrir la fiche</Btn>} />
        <div className="form-grid">
          <Info label="Sujet" value={pfe.title} full />
          <Info label="Filière" value={pfe.filiere?.name || '—'} />
          <Info label="Organisme" value={pfe.entreprise?.name || '—'} />
          <Info label="Encadrant académique" value={fullName(pfe.academic_supervisor)} />
          <Info label="Encadrant professionnel" value={pfe.entreprise?.supervisor_name || '—'} />
          <Info label="Période" value={`${formatDate(pfe.start_date)} — ${formatDate(pfe.end_date)}`} full />
        </div>
      </Card>
      <Card>
        <CardHeader title="État du dossier" />
        <div style={{ padding: 16, display: 'grid', gap: 14 }}>
          <StatusBadge status={pfe.status} />
          <ProgressBar value={data.kpis.progress} color="#2563eb" label="Avancement moyen" />
          <div style={{ color: 'var(--muted-foreground)', fontSize: 12 }}>{data.notifications.filter((item) => !item.is_read).length} notification(s) à consulter.</div>
        </div>
      </Card>
    </div>}
    {pfe?.milestones?.length ? <Card><CardHeader title="Jalons du PFE" /><div style={{ padding: 20 }}><Timeline steps={pfe.milestones.map((item) => item.name)} active={activeMilestone} /></div></Card> : null}
  </div>
}

function PfeEditor({ data, onUpdated, flash, setError }: { data: StudentDashboardData; onUpdated: () => Promise<void>; flash: (message: string) => void; setError: (message: string) => void }) {
  const pfe = data.pfe
  const [busy, setBusy] = useState(false)
  const [requestBusy, setRequestBusy] = useState(false)
  const [requestOpen, setRequestOpen] = useState(false)
  const [requestReason, setRequestReason] = useState('')
  const [form, setForm] = useState(() => ({
    title: pfe?.title || '', description: pfe?.description || '', start_date: pfe?.start_date?.slice(0, 10) || '', end_date: pfe?.end_date?.slice(0, 10) || '',
    filiere_id: String(pfe?.filiere_id || data.references.filieres[0]?.id || ''), academic_year_id: String(pfe?.academic_year_id || data.references.academic_years[0]?.id || ''),
    company_name: pfe?.entreprise?.name || '', company_sector: pfe?.entreprise?.sector || '', company_address: pfe?.entreprise?.address || '', company_city: pfe?.entreprise?.city || '',
    company_phone: pfe?.entreprise?.contact_phone || '', supervisor_name: pfe?.entreprise?.supervisor_name || '', supervisor_email: pfe?.entreprise?.supervisor_email || '',
  }))
  const editable = !pfe || ['Brouillon', 'Refusé', 'Modifications demandées'].includes(pfe.status)
  const latestRequest = data.modification_request
  const requestPending = latestRequest?.status === 'En attente'
  const canRequestModification = pfe?.status === 'Validé' && !requestPending
  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }))

  const save = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setError('')
    try {
      await apiRequest('/student/pfe', { method: 'PUT', body: JSON.stringify({
        title: form.title, description: form.description || null, start_date: form.start_date || null, end_date: form.end_date || null,
        filiere_id: Number(form.filiere_id), academic_year_id: Number(form.academic_year_id),
        company: { name: form.company_name, sector: form.company_sector || null, address: form.company_address || null, city: form.company_city || null, contact_phone: form.company_phone || null, supervisor_name: form.supervisor_name || null, supervisor_email: form.supervisor_email || null },
      }) })
      flash('Fiche PFE enregistrée.'); await onUpdated()
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Enregistrement impossible.') }
    finally { setBusy(false) }
  }

  const submit = async () => {
    if (!window.confirm('Soumettre définitivement ce sujet à votre encadrant ?')) return
    setBusy(true); setError('')
    try { await apiRequest('/student/pfe/submit', { method: 'POST' }); flash('Sujet soumis pour validation.'); await onUpdated() }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Soumission impossible.') }
    finally { setBusy(false) }
  }

  const requestModification = async () => {
    if (requestReason.trim().length < 10) {
      setError('Expliquez précisément la modification demandée en au moins 10 caractères.')
      return
    }
    setRequestBusy(true); setError('')
    try {
      await apiRequest('/student/pfe/modification-request', { method: 'POST', body: JSON.stringify({ reason: requestReason.trim() }) })
      setRequestReason(''); setRequestOpen(false); flash('Demande de modification envoyée.'); await onUpdated()
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Demande impossible.') }
    finally { setRequestBusy(false) }
  }

  return <form className="page-stack" onSubmit={save}>
    <div className="page-title"><div><h1>Fiche PFE</h1><p>Informations officielles de votre projet et de l’organisme d’accueil.</p></div><StatusBadge status={pfe?.status || 'Brouillon'} /></div>
    {pfe?.refusal_reason && <Notice kind="error"><strong>Retour de validation :</strong> {pfe.refusal_reason}</Notice>}
    {!editable && pfe?.status === 'Validé' && <Notice>
      <div style={{ display: 'grid', gap: 8 }}>
        <div><strong>PFE validé — modification verrouillée.</strong> Les données officielles ne peuvent plus être changées sans autorisation.</div>
        {requestPending
          ? <div>Votre demande envoyée le {formatDate(latestRequest?.created_at)} est en attente de décision.</div>
          : <div className="button-row"><Btn small onClick={() => setRequestOpen((current) => !current)}>{requestOpen ? 'Fermer' : 'Demander une modification'}</Btn></div>}
      </div>
    </Notice>}
    {!editable && pfe?.status !== 'Validé' && <Notice><strong>Fiche verrouillée.</strong> Le sujet est actuellement dans le circuit de validation.</Notice>}
    {latestRequest?.status === 'Rejetée' && <Notice kind="error"><strong>Dernière demande refusée :</strong> {latestRequest.decision_note || 'Aucun motif communiqué.'}</Notice>}
    {editable && pfe?.status === 'Modifications demandées' && latestRequest?.status === 'Approuvée' && <Notice kind="success">
      <strong>Modification autorisée.</strong> Corrigez la fiche, enregistrez-la, puis soumettez le sujet à nouveau.
      {latestRequest.decision_note ? <div style={{ marginTop: 6 }}>Note : {latestRequest.decision_note}</div> : null}
    </Notice>}
    {canRequestModification && requestOpen && <Card><CardHeader title="Demande de modification" subtitle="La fiche restera verrouillée jusqu’à l’approbation d’un responsable." /><div className="form-grid">
      <Field label="Motif et changements souhaités" full><textarea value={requestReason} onChange={(event) => setRequestReason(event.target.value)} placeholder="Expliquez ce qui doit être corrigé et pourquoi…" /></Field>
      <div className="form-actions"><Btn variant="secondary" disabled={requestBusy} onClick={() => setRequestOpen(false)}>Annuler</Btn><Btn disabled={requestBusy} onClick={() => void requestModification()}>{requestBusy ? 'Envoi…' : 'Envoyer la demande'}</Btn></div>
    </div></Card>}
    <Card><CardHeader title="Projet" /><div className="form-grid">
      <Field label="Intitulé du PFE" full><input disabled={!editable} required value={form.title} onChange={(e) => update('title', e.target.value)} /></Field>
      <Field label="Description" full><textarea disabled={!editable} value={form.description} onChange={(e) => update('description', e.target.value)} /></Field>
      <Field label="Filière"><select disabled={!editable} required value={form.filiere_id} onChange={(e) => update('filiere_id', e.target.value)}>{data.references.filieres.map((item) => <option key={item.id} value={item.id}>{item.code} — {item.name}</option>)}</select></Field>
      <Field label="Année universitaire"><select disabled={!editable} required value={form.academic_year_id} onChange={(e) => update('academic_year_id', e.target.value)}>{data.references.academic_years.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></Field>
      <Field label="Date de début"><input disabled={!editable} type="date" value={form.start_date} onChange={(e) => update('start_date', e.target.value)} /></Field>
      <Field label="Date de fin prévue"><input disabled={!editable} type="date" value={form.end_date} onChange={(e) => update('end_date', e.target.value)} /></Field>
    </div></Card>
    <Card><CardHeader title="Organisme d’accueil" /><div className="form-grid">
      <Field label="Nom de l’organisme"><input disabled={!editable} required value={form.company_name} onChange={(e) => update('company_name', e.target.value)} /></Field>
      <Field label="Secteur"><input disabled={!editable} value={form.company_sector} onChange={(e) => update('company_sector', e.target.value)} /></Field>
      <Field label="Adresse"><input disabled={!editable} value={form.company_address} onChange={(e) => update('company_address', e.target.value)} /></Field>
      <Field label="Ville"><input disabled={!editable} value={form.company_city} onChange={(e) => update('company_city', e.target.value)} /></Field>
      <Field label="Téléphone"><input disabled={!editable} value={form.company_phone} onChange={(e) => update('company_phone', e.target.value)} /></Field>
      <Field label="Encadrant professionnel"><input disabled={!editable} value={form.supervisor_name} onChange={(e) => update('supervisor_name', e.target.value)} /></Field>
      <Field label="E-mail de l’encadrant professionnel" full><input disabled={!editable} type="email" value={form.supervisor_email} onChange={(e) => update('supervisor_email', e.target.value)} /></Field>
      {editable && <div className="form-actions"><Btn type="submit" disabled={busy}>Enregistrer</Btn>{pfe && <Btn variant="secondary" disabled={busy} onClick={submit}>Soumettre le sujet</Btn>}</div>}
    </div></Card>
  </form>
}

function ProgressSection({ data, onUpdated, flash, setError }: { data: StudentDashboardData; onUpdated: () => Promise<void>; flash: (message: string) => void; setError: (message: string) => void }) {
  const [percentage, setPercentage] = useState('')
  const [description, setDescription] = useState('')
  const [milestoneId, setMilestoneId] = useState('')
  const [busy, setBusy] = useState(false)
  if (!data.pfe) return <Notice>Créez votre fiche PFE avant de déposer un compte rendu.</Notice>
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setError('')
    try {
      await apiRequest('/student/reports', { method: 'POST', body: JSON.stringify({ percentage: Number(percentage), description, milestone_id: milestoneId ? Number(milestoneId) : null }) })
      setPercentage(''); setDescription(''); setMilestoneId(''); flash('Compte rendu ajouté.'); await onUpdated()
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Dépôt impossible.') }
    finally { setBusy(false) }
  }
  return <div className="page-stack">
    <div className="page-title"><div><h1>Suivi et progression</h1><p>Jalons et comptes rendus périodiques horodatés.</p></div></div>
    <Card><CardHeader title="Progression par jalon" /><div style={{ padding: 16, display: 'grid', gap: 14 }}>{data.pfe.milestones.map((item) => <ProgressBar key={item.id} value={item.progress} label={item.name} color={item.progress >= 100 ? '#059669' : '#2563eb'} />)}</div></Card>
    <div className="two-column">
      <Card><CardHeader title="Journal de bord" /><Table headers={['Date', 'Progression', 'Note']} rows={data.reports.map((item) => [formatDate(item.created_at), `${item.percentage}%`, item.description])} />{!data.reports.length && <div className="table-empty">Aucun compte rendu.</div>}</Card>
      <Card><CardHeader title="Nouveau compte rendu" /><form className="form-grid" onSubmit={submit}>
        <Field label="Jalon" full><select value={milestoneId} onChange={(e) => setMilestoneId(e.target.value)}><option value="">Progression générale</option>{data.pfe.milestones.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field>
        <Field label="Progression (%)" full><input required type="number" min="0" max="100" value={percentage} onChange={(e) => setPercentage(e.target.value)} /></Field>
        <Field label="Travaux réalisés, blocages et prochaines étapes" full><textarea required value={description} onChange={(e) => setDescription(e.target.value)} /></Field>
        <div className="form-actions"><Btn type="submit" disabled={busy}>Déposer</Btn></div>
      </form></Card>
    </div>
  </div>
}

function SupervisionSection({ currentUserId, data, messages, reloadMessages, reload, flash, setError }: { currentUserId: number; data: StudentDashboardData; messages: MessageItem[]; reloadMessages: () => Promise<void>; reload: () => Promise<void>; flash: (message: string) => void; setError: (message: string) => void }) {
  const [message, setMessage] = useState('')
  const [date, setDate] = useState('')
  const [location, setLocation] = useState('')
  const [agenda, setAgenda] = useState('')
  if (!data.pfe) return <Notice>Créez votre fiche PFE pour accéder à l’encadrement.</Notice>
  const send = async (event: FormEvent) => {
    event.preventDefault(); setError('')
    try { await apiRequest('/student/messages', { method: 'POST', body: JSON.stringify({ message }) }); setMessage(''); await reloadMessages() }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Envoi impossible.') }
  }
  const appointment = async (event: FormEvent) => {
    event.preventDefault(); setError('')
    try { await apiRequest('/student/appointments', { method: 'POST', body: JSON.stringify({ scheduled_at: date, location: location || null, agenda: agenda || null }) }); setDate(''); setLocation(''); setAgenda(''); flash('Demande de rendez-vous envoyée.'); await reload() }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Demande impossible.') }
  }
  return <div className="page-stack">
    <div className="page-title"><div><h1>Encadrement</h1><p>Échanges et rendez-vous avec {fullName(data.pfe.academic_supervisor)}.</p></div></div>
    <div className="two-column">
      <Card><CardHeader title="Fil de discussion" /><div style={{ padding: 16, display: 'grid', gap: 10, maxHeight: 430, overflowY: 'auto' }}>{messages.map((item) => <div key={item.id} style={{ maxWidth: '80%', justifySelf: item.sender_id === currentUserId ? 'end' : 'start', padding: 10, borderRadius: 8, background: item.sender_id === currentUserId ? '#dbeafe' : 'var(--muted)' }}><strong style={{ fontSize: 11 }}>{fullName(item.sender)}</strong><div style={{ marginTop: 4 }}>{item.message}</div><small style={{ color: 'var(--muted-foreground)' }}>{formatDate(item.created_at, true)}</small></div>)}{!messages.length && <div className="table-empty">Aucun message.</div>}</div><form style={{ padding: 14, borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }} onSubmit={send}><input aria-label="Message" required value={message} onChange={(e) => setMessage(e.target.value)} style={{ flex: 1, border: '1px solid var(--border)', borderRadius: 6, padding: 9 }} /><Btn type="submit">Envoyer</Btn></form></Card>
      <div className="page-stack"><Card><CardHeader title="Demander un rendez-vous" /><form className="form-grid" onSubmit={appointment}><Field label="Date et heure" full><input required type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} /></Field><Field label="Lieu / lien" full><input value={location} onChange={(e) => setLocation(e.target.value)} /></Field><Field label="Ordre du jour" full><textarea value={agenda} onChange={(e) => setAgenda(e.target.value)} /></Field><div className="form-actions"><Btn type="submit">Envoyer</Btn></div></form></Card><Card><CardHeader title="Rendez-vous" /><Table headers={['Date', 'Statut']} rows={data.appointments.map((item) => [formatDate(item.scheduled_at, true), <StatusBadge status={item.status} />])} />{!data.appointments.length && <div className="table-empty">Aucune demande.</div>}</Card></div>
    </div>
  </div>
}

function DocumentsSection({ data, reload, flash, setError }: { data: StudentDashboardData; reload: () => Promise<void>; flash: (message: string) => void; setError: (message: string) => void }) {
  const [file, setFile] = useState<File | null>(null)
  const [type, setType] = useState('Rapport')
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  if (!data.pfe) return <Notice>Créez votre fiche PFE avant de déposer des documents.</Notice>
  const submit = async (event: FormEvent) => {
    event.preventDefault(); if (!file) return; setBusy(true); setError('')
    const body = new FormData(); body.append('file', file); body.append('type', type); if (name) body.append('name', name)
    try { await apiRequest('/student/documents', { method: 'POST', body }); setFile(null); setName(''); flash('Document déposé avec succès.'); await reload() }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Dépôt impossible.') }
    finally { setBusy(false) }
  }
  return <div className="page-stack">
    <div className="page-title"><div><h1>Documents</h1><p>Versions successives, contrôles de format et retours.</p></div></div>
    <Card><CardHeader title="Déposer un document" subtitle="PDF, DOCX, PPTX ou ZIP — 15 Mo maximum" /><form className="form-grid" onSubmit={submit}><Field label="Fichier"><input required type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.zip" onChange={(e) => setFile(e.target.files?.[0] || null)} /></Field><Field label="Type"><select value={type} onChange={(e) => setType(e.target.value)}>{['Rapport', 'Convention', 'Présentation', 'Livrable', 'Rapport final'].map((item) => <option key={item}>{item}</option>)}</select></Field><Field label="Nom lisible" full><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Facultatif" /></Field><div className="form-actions"><Btn type="submit" disabled={busy || !file}>Déposer</Btn></div></form></Card>
    <Card><CardHeader title="Historique des versions" /><Table headers={['Document', 'Type', 'Version', 'Taille', 'Date', 'Statut', 'Action']} rows={data.documents.map((item) => [item.name, item.type, `v${item.version}`, moneylessSize(item.size), formatDate(item.created_at), <StatusBadge status={item.status} />, <Btn small variant="secondary" onClick={() => void downloadFile(`/documents/${item.id}/download`, item.original_name || item.name).catch((reason: Error) => setError(reason.message))}>Télécharger</Btn>])} />{!data.documents.length && <div className="table-empty">Aucun document déposé.</div>}</Card>
  </div>
}

function DefenseSection({ defense }: { defense: Defense | null }) {
  if (!defense) return <Notice>La soutenance n’est pas encore planifiée. Vous recevrez une notification dès sa programmation.</Notice>
  return <div className="page-stack"><div className="page-title"><div><h1>Soutenance</h1><p>Convocation et composition du jury.</p></div><StatusBadge status={defense.status} /></div><Card><CardHeader title="Informations pratiques" /><div className="form-grid"><Info label="Date et heure" value={formatDate(defense.date, true)} /><Info label="Salle" value={defense.room} /><Info label="Composition du jury" value={(defense.jury_members || []).map((member) => `${member.role}: ${fullName(member.user)}`).join(' · ') || 'En cours de constitution'} full /></div></Card></div>
}

function NotificationsSection({ notifications, reload, setError }: { notifications: NotificationItem[]; reload: () => Promise<void>; setError: (message: string) => void }) {
  const markRead = async (id: number) => {
    try { await apiRequest(`/student/notifications/${id}/read`, { method: 'PATCH' }); await reload() }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Mise à jour impossible.') }
  }
  return <div className="page-stack"><div className="page-title"><div><h1>Notifications</h1><p>Rappels, décisions et nouveaux échanges.</p></div></div><Card>{notifications.map((item) => <div key={item.id} style={{ padding: 14, borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12, background: item.is_read ? 'transparent' : '#eff6ff' }}><div style={{ flex: 1 }}><strong>{item.title}</strong><div style={{ marginTop: 3, color: 'var(--muted-foreground)' }}>{item.content}</div><small>{formatDate(item.created_at, true)}</small></div>{!item.is_read && <Btn small variant="secondary" onClick={() => void markRead(item.id)}>Marquer comme lue</Btn>}</div>)}{!notifications.length && <div className="table-empty">Aucune notification.</div>}</Card></div>
}

function Info({ label, value, full = false }: { label: string; value: string; full?: boolean }) {
  return <div style={full ? { gridColumn: '1 / -1' } : undefined}><div style={{ fontSize: 11, color: 'var(--muted-foreground)', fontWeight: 700, marginBottom: 4 }}>{label}</div><div>{value}</div></div>
}
