import { useCallback, useEffect, useState, type FormEvent } from 'react'
import type { AuthUser } from '../api'
import { apiRequest } from '../api'
import WireframeShell from './WireframeShell'
import { Btn, Card, CardHeader, ProgressBar, StatCard, Table } from './ui'
import { Field, Icon, Notice, StatusBadge, formatDate, fullName } from './dashboardHelpers'

interface UserRow { id: number; first_name: string; last_name: string; email: string; is_active: boolean; last_login_at?: string; role?: { name: string }; filiere?: { id: number; name: string; code: string } }
interface RoleRow { id: number; name: string; users_count: number }
interface DepartmentRow { id: number; name: string; code: string; pfes_count: number }
interface AcademicYear { id: number; label: string; start_date: string; end_date: string }
interface AuditRow { id: number; action: string; metadata?: Record<string, unknown>; ip_address?: string; created_at: string; user?: { first_name: string; last_name: string } }
interface ModificationRequestRow {
  id: number; reason: string; status: string; created_at: string;
  pfe: { id: number; title: string; student: { first_name: string; last_name: string }; filiere?: { code: string } };
}
interface AdminData {
  users: { data: UserRow[]; current_page: number; last_page: number; total: number }; roles_list: RoleRow[]; departments: DepartmentRow[]; academic_years: AcademicYear[]; logs: AuditRow[];
  modification_requests: ModificationRequestRow[];
  global_progress: Array<{ dept: string; code: string; total: number; validated: number; progress: number }>;
  kpis: { total_users: number; active_users: number; active_pfes: number; depts_count: number; completion_rate: number; pending_modification_requests: number };
}

const NAV = [
  { icon: <Icon symbol="⌂" />, label: 'Vue globale' },
  { icon: <Icon symbol="♙" />, label: 'Utilisateurs' },
  { icon: <Icon symbol="◆" />, label: 'Rôles & accès' },
  { icon: <Icon symbol="▦" />, label: 'Filières' },
  { icon: <Icon symbol="◇" />, label: 'Années universitaires' },
  { icon: <Icon symbol="≡" />, label: 'Journal d’audit' },
]

export default function LiveAdminDashboard({ user, onLogout }: { user: AuthUser; onLogout: () => void }) {
  const [active, setActive] = useState(0)
  const [data, setData] = useState<AdminData | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const load = useCallback(async () => {
    setError('')
    try { setData(await apiRequest<AdminData>('/admin/dashboard')) }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Chargement impossible.') }
  }, [])
  useEffect(() => { void load() }, [load])
  const flash = (message: string) => { setSuccess(message); window.setTimeout(() => setSuccess(''), 3500) }

  return <WireframeShell roleLabel="Super Admin" roleColor="#7c3aed" userName={`${user.first_name} ${user.last_name}`} navItems={NAV} activeNav={active} onNavChange={setActive} onLogout={onLogout} notifCount={data?.kpis.pending_modification_requests || 0}>
    {error && <Notice kind="error">{error}</Notice>}
    {success && <Notice kind="success">{success}</Notice>}
    {!data && !error && <Notice>Chargement de l’administration…</Notice>}
    {data && active === 0 && <AdminHome data={data} reload={load} flash={flash} setError={setError} />}
    {data && active === 1 && <Users data={data} reload={load} flash={flash} setError={setError} />}
    {data && active === 2 && <Roles data={data} />}
    {data && active === 3 && <Departments data={data} reload={load} flash={flash} setError={setError} />}
    {data && active === 4 && <AcademicYears data={data} reload={load} flash={flash} setError={setError} />}
    {data && active === 5 && <AuditLogs data={data} />}
  </WireframeShell>
}

function AdminHome({ data, reload, flash, setError }: ActionProps) {
  const decideModification = async (requestId: number, decision: 'Approuvée' | 'Rejetée') => {
    const note = decision === 'Approuvée' ? window.prompt('Note facultative pour l’étudiant :') : window.prompt('Motif obligatoire du refus :')
    if (note === null || (decision === 'Rejetée' && !note.trim())) return
    try {
      await apiRequest(`/admin/modification-requests/${requestId}/decision`, { method: 'POST', body: JSON.stringify({ decision, decision_note: note || null }) })
      flash(decision === 'Approuvée' ? 'La fiche PFE a été rouverte.' : 'La demande a été refusée.'); await reload()
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Action impossible.') }
  }
  return <div className="page-stack">
    <div className="stats-grid"><StatCard label="Utilisateurs" value={data.kpis.total_users} sub={`${data.kpis.active_users} actifs`} color="#7c3aed" /><StatCard label="PFE actifs" value={data.kpis.active_pfes} color="#2563eb" /><StatCard label="Filières" value={data.kpis.depts_count} color="#d97706" /><StatCard label="Taux validé" value={`${data.kpis.completion_rate}%`} color="#059669" /></div>
    <Card><CardHeader title="Progression multi-filières" /><div style={{ padding: 16, display: 'grid', gap: 14 }}>{data.global_progress.map((item) => <ProgressBar key={item.code} value={item.progress} label={`${item.code} — ${item.dept} (${item.validated}/${item.total} validés)`} color="#7c3aed" />)}</div></Card>
    <Card><CardHeader title={`Demandes de modification (${data.modification_requests.length})`} subtitle="Le Super Admin peut autoriser ou refuser la réouverture d’une fiche validée." /><div style={{ padding: 14, display: 'grid', gap: 12 }}>{data.modification_requests.map((item) => <div key={item.id} className="callout"><div className="button-row" style={{ justifyContent: 'space-between' }}><strong>{item.pfe.title}</strong><StatusBadge status={item.status} /></div><div style={{ marginTop: 5 }}>{fullName(item.pfe.student)} — {item.pfe.filiere?.code || 'Filière non définie'} — demande du {formatDate(item.created_at)}</div><div style={{ margin: '8px 0 10px' }}>{item.reason}</div><div className="button-row"><Btn small onClick={() => void decideModification(item.id, 'Approuvée')}>Autoriser la modification</Btn><Btn small variant="secondary" onClick={() => void decideModification(item.id, 'Rejetée')}>Refuser</Btn></div></div>)}{!data.modification_requests.length && <Notice kind="success">Aucune demande de modification en attente.</Notice>}</div></Card>
    <Card><CardHeader title="Dernières actions sensibles" /><Table headers={['Date', 'Utilisateur', 'Action', 'IP']} rows={data.logs.slice(0, 10).map((item) => [formatDate(item.created_at, true), fullName(item.user), item.action, item.ip_address || '—'])} /></Card>
  </div>
}

function Users({ data, reload, flash, setError }: ActionProps) {
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', role_name: 'Etudiant', filiere_id: '', password: '' })
  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }))
  const create = async (event: FormEvent) => {
    event.preventDefault()
    try {
      await apiRequest('/admin/users', { method: 'POST', body: JSON.stringify({ ...form, filiere_id: form.filiere_id ? Number(form.filiere_id) : null, password: form.password || null }) })
      setForm({ first_name: '', last_name: '', email: '', role_name: 'Etudiant', filiere_id: '', password: '' }); flash('Compte créé.'); await reload()
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Création impossible.') }
  }
  const toggle = async (user: UserRow) => {
    if (!window.confirm(`${user.is_active ? 'Désactiver' : 'Réactiver'} le compte de ${fullName(user)} ?`)) return
    try { await apiRequest(`/admin/users/${user.id}/toggle`, { method: 'PATCH' }); flash('Statut du compte modifié.'); await reload() }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Action impossible.') }
  }
  const changeRole = async (user: UserRow) => {
    const roleName = window.prompt('Nouveau rôle : Etudiant, Encadrant, Chef de filiere ou Super Admin', user.role?.name || 'Etudiant')
    if (!roleName || !data.roles_list.some((role) => role.name === roleName)) return setError('Le rôle saisi n’est pas valide.')
    let filiereId: number | null = null
    if (roleName === 'Chef de filiere') {
      const selected = window.prompt(`Identifiant de filière : ${data.departments.map((item) => `${item.id}=${item.code}`).join(', ')}`, String(user.filiere?.id || ''))
      if (!selected) return
      filiereId = Number(selected)
    }
    try { await apiRequest(`/admin/users/${user.id}/role`, { method: 'PUT', body: JSON.stringify({ role_name: roleName, filiere_id: filiereId }) }); flash('Rôle modifié et sessions révoquées.'); await reload() }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Modification impossible.') }
  }
  return <div className="page-stack"><div className="page-title"><div><h1>Gestion des utilisateurs</h1><p>Activation, désactivation et création contrôlée des comptes.</p></div></div><Card><CardHeader title="Créer un compte" subtitle="Les utilisateurs Google peuvent être créés sans mot de passe local." /><form className="form-grid" onSubmit={create}><Field label="Prénom"><input required value={form.first_name} onChange={(event) => update('first_name', event.target.value)} /></Field><Field label="Nom"><input required value={form.last_name} onChange={(event) => update('last_name', event.target.value)} /></Field><Field label="E-mail institutionnel"><input required type="email" value={form.email} onChange={(event) => update('email', event.target.value)} /></Field><Field label="Rôle"><select value={form.role_name} onChange={(event) => update('role_name', event.target.value)}>{data.roles_list.map((role) => <option key={role.id}>{role.name}</option>)}</select></Field>{form.role_name === 'Chef de filiere' && <Field label="Filière"><select required value={form.filiere_id} onChange={(event) => update('filiere_id', event.target.value)}><option value="">Sélectionner…</option>{data.departments.map((item) => <option key={item.id} value={item.id}>{item.code} — {item.name}</option>)}</select></Field>}<Field label="Mot de passe local (facultatif)"><input type="password" minLength={12} value={form.password} onChange={(event) => update('password', event.target.value)} /></Field><div className="form-actions"><Btn type="submit">Créer le compte</Btn></div></form></Card><Card><CardHeader title={`Comptes (${data.users.total})`} /><Table headers={['Utilisateur', 'E-mail', 'Rôle', 'Filière', 'Dernière connexion', 'Statut', 'Actions']} rows={data.users.data.map((item) => [fullName(item), item.email, item.role?.name || 'Aucun', item.filiere?.code || '—', formatDate(item.last_login_at, true), <StatusBadge status={item.is_active ? 'Actif' : 'Inactif'} />, <div className="button-row"><Btn small variant="secondary" onClick={() => void changeRole(item)}>Changer rôle</Btn><Btn small variant="secondary" onClick={() => void toggle(item)}>{item.is_active ? 'Désactiver' : 'Réactiver'}</Btn></div>])} /></Card></div>
}

function Roles({ data }: { data: AdminData }) {
  return <div className="page-stack"><div className="page-title"><div><h1>Rôles et contrôle d’accès</h1><p>Les routes sont protégées côté serveur par RBAC.</p></div></div><div className="stats-grid">{data.roles_list.map((role) => <StatCard key={role.id} label={role.name} value={role.users_count} color="#7c3aed" />)}</div><Notice>Les rôles se modifient depuis la section Utilisateurs. Toute modification révoque automatiquement les sessions du compte et est enregistrée dans le journal d’audit.</Notice></div>
}

function Departments({ data, reload, flash, setError }: ActionProps) {
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    try { await apiRequest('/admin/filieres', { method: 'POST', body: JSON.stringify({ name, code: code.toUpperCase() }) }); setName(''); setCode(''); flash('Filière ajoutée.'); await reload() }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Création impossible.') }
  }
  return <div className="page-stack"><div className="page-title"><div><h1>Filières</h1><p>Référentiel académique centralisé.</p></div></div><div className="two-column"><Card><CardHeader title="Filières actives" /><Table headers={['Code', 'Nom', 'PFE']} rows={data.departments.map((item) => [item.code, item.name, item.pfes_count])} /></Card><Card><CardHeader title="Ajouter une filière" /><form className="form-grid" onSubmit={submit}><Field label="Code" full><input required maxLength={20} value={code} onChange={(event) => setCode(event.target.value)} /></Field><Field label="Intitulé" full><input required value={name} onChange={(event) => setName(event.target.value)} /></Field><div className="form-actions"><Btn type="submit">Ajouter</Btn></div></form></Card></div></div>
}

function AcademicYears({ data, reload, flash, setError }: ActionProps) {
  const [label, setLabel] = useState('')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    try { await apiRequest('/admin/academic-years', { method: 'POST', body: JSON.stringify({ label, start_date: start, end_date: end }) }); setLabel(''); setStart(''); setEnd(''); flash('Année universitaire ajoutée.'); await reload() }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Création impossible.') }
  }
  return <div className="page-stack"><div className="page-title"><div><h1>Années universitaires</h1><p>Cadre temporel des campagnes PFE.</p></div></div><div className="two-column"><Card><CardHeader title="Historique" /><Table headers={['Année', 'Début', 'Fin']} rows={data.academic_years.map((item) => [item.label, formatDate(item.start_date), formatDate(item.end_date)])} /></Card><Card><CardHeader title="Nouvelle année" /><form className="form-grid" onSubmit={submit}><Field label="Libellé" full><input required value={label} onChange={(event) => setLabel(event.target.value)} placeholder="2027–2028" /></Field><Field label="Début"><input required type="date" value={start} onChange={(event) => setStart(event.target.value)} /></Field><Field label="Fin"><input required type="date" value={end} onChange={(event) => setEnd(event.target.value)} /></Field><div className="form-actions"><Btn type="submit">Ajouter</Btn></div></form></Card></div></div>
}

function AuditLogs({ data }: { data: AdminData }) {
  return <div className="page-stack"><div className="page-title"><div><h1>Journal d’audit</h1><p>Traçabilité des connexions, validations et opérations sensibles.</p></div></div><Card><Table headers={['Date', 'Utilisateur', 'Action', 'Détails', 'Adresse IP']} rows={data.logs.map((item) => [formatDate(item.created_at, true), fullName(item.user), item.action, item.metadata ? JSON.stringify(item.metadata) : '—', item.ip_address || '—'])} />{!data.logs.length && <div className="table-empty">Aucune action enregistrée.</div>}</Card></div>
}

interface ActionProps { data: AdminData; reload: () => Promise<void>; flash: (message: string) => void; setError: (message: string) => void }
