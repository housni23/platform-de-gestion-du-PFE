import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import type { AuthUser } from '../api'
import { apiRequest, downloadFile } from '../api'
import WireframeShell from './WireframeShell'
import { Btn, Card, CardHeader, ProgressBar, StatCard, Table } from './ui'
import { Field, Icon, Notice, StatusBadge, formatDate, fullName } from './dashboardHelpers'

interface PfeRow { id: number; student: string; project: string; supervisor: string; dept: string; progress: number; status: string; company?: string }
interface SupervisorLoad { id: number; name: string; count: number; max: number }
interface DefenseRow { id: number; pfe_id: number; date: string; room: string; status: string; duration_minutes: number; pfe: { student: { first_name: string; last_name: string }; title: string }; jury_members: Array<{ role: string; user: { first_name: string; last_name: string } }> }
interface ModificationRequestRow {
  id: number; reason: string; status: string; created_at: string;
  pfe: { id: number; title: string; student: { first_name: string; last_name: string } };
}
interface ChefData {
  filiere: { id: number; name: string; code: string }; pfes: PfeRow[]; validations: PfeRow[]; modification_requests: ModificationRequestRow[]; supervisor_loads: SupervisorLoad[]; defenses: DefenseRow[];
  kpis: { total_pfes: number; in_progress: number; delayed: number; pending_validations: number; scheduled_defenses: number };
}

const NAV = [
  { icon: <Icon symbol="⌂" />, label: 'Tableau de bord' },
  { icon: <Icon symbol="▤" />, label: 'PFE de la filière' },
  { icon: <Icon symbol="✓" />, label: 'Validations finales' },
  { icon: <Icon symbol="♙" />, label: 'Affectations' },
  { icon: <Icon symbol="◇" />, label: 'Soutenances' },
  { icon: <Icon symbol="↧" />, label: 'Exports' },
]

export default function LiveChefDashboard({ user, onLogout }: { user: AuthUser; onLogout: () => void }) {
  const [active, setActive] = useState(0)
  const [data, setData] = useState<ChefData | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const load = useCallback(async () => {
    setError('')
    try { setData(await apiRequest<ChefData>('/chef/dashboard')) }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Chargement impossible.') }
  }, [])
  useEffect(() => { void load() }, [load])
  const flash = (message: string) => { setSuccess(message); window.setTimeout(() => setSuccess(''), 3500) }

  return <WireframeShell
    roleLabel="Chef de filière" roleColor="#d97706" userName={`${user.first_name} ${user.last_name}`} navItems={NAV}
    activeNav={active} onNavChange={setActive} onLogout={onLogout} notifCount={data?.kpis.pending_validations || 0}
  >
    {error && <Notice kind="error">{error}</Notice>}
    {success && <Notice kind="success">{success}</Notice>}
    {!data && !error && <Notice>Chargement de l’espace filière…</Notice>}
    {data && active === 0 && <ChefHome data={data} />}
    {data && active === 1 && <PfeList data={data} />}
    {data && active === 2 && <FinalValidations data={data} reload={load} flash={flash} setError={setError} />}
    {data && active === 3 && <Assignments data={data} reload={load} flash={flash} setError={setError} />}
    {data && active === 4 && <Defenses user={user} data={data} reload={load} flash={flash} setError={setError} />}
    {data && active === 5 && <Exports data={data} setError={setError} />}
  </WireframeShell>
}

function ChefHome({ data }: { data: ChefData }) {
  return <div className="page-stack">
    <div className="page-title"><div><h1>{data.filiere.name}</h1><p>Pilotage académique de la filière {data.filiere.code}.</p></div></div>
    <div className="stats-grid">
      <StatCard label="PFE suivis" value={data.kpis.total_pfes} color="#d97706" />
      <StatCard label="En cours" value={data.kpis.in_progress} color="#059669" />
      <StatCard label="Validations finales" value={data.kpis.pending_validations} color="#2563eb" />
      <StatCard label="Soutenances" value={data.kpis.scheduled_defenses} color="#7c3aed" />
    </div>
    <Card><CardHeader title="État des PFE" /><Table headers={['Étudiant', 'Sujet', 'Encadrant', 'Progression', 'Statut']} rows={data.pfes.map((pfe) => [pfe.student, pfe.project, pfe.supervisor, <ProgressBar value={pfe.progress} color={pfe.progress < 40 ? '#dc2626' : '#d97706'} />, <StatusBadge status={pfe.status} />])} /></Card>
    <Card><CardHeader title="Charge des encadrants" /><div style={{ padding: 16, display: 'grid', gap: 12 }}>{data.supervisor_loads.map((item) => <ProgressBar key={item.id} value={Math.round(100 * item.count / item.max)} label={`${item.name} — ${item.count}/${item.max} PFE`} color={item.count >= item.max ? '#dc2626' : '#059669'} />)}</div></Card>
  </div>
}

function PfeList({ data }: { data: ChefData }) {
  const [filter, setFilter] = useState('Tous')
  const [query, setQuery] = useState('')
  const rows = useMemo(() => data.pfes.filter((pfe) => (filter === 'Tous' || pfe.status === filter) && `${pfe.student} ${pfe.project} ${pfe.supervisor}`.toLowerCase().includes(query.toLowerCase())), [data.pfes, filter, query])
  const statuses = ['Tous', ...Array.from(new Set(data.pfes.map((pfe) => pfe.status)))]
  return <div className="page-stack"><div className="page-title"><div><h1>PFE de la filière</h1><p>Vue filtrable par statut, étudiant ou encadrant.</p></div></div><Card><div className="form-grid"><Field label="Rechercher"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Étudiant, sujet, encadrant…" /></Field><Field label="Statut"><select value={filter} onChange={(event) => setFilter(event.target.value)}>{statuses.map((status) => <option key={status}>{status}</option>)}</select></Field></div><Table headers={['Étudiant', 'Sujet', 'Entreprise', 'Encadrant', 'Progression', 'Statut']} rows={rows.map((pfe) => [pfe.student, pfe.project, pfe.company || '—', pfe.supervisor, `${pfe.progress}%`, <StatusBadge status={pfe.status} />])} />{!rows.length && <div className="table-empty">Aucun résultat.</div>}</Card></div>
}

function FinalValidations({ data, reload, flash, setError }: ActionProps) {
  const decide = async (pfeId: number, status: string) => {
    const comments = status === 'Validé' ? window.prompt('Commentaire facultatif :') : window.prompt('Motif obligatoire :')
    if (comments === null || (status !== 'Validé' && !comments.trim())) return
    try { await apiRequest(`/chef/pfes/${pfeId}/final-decision`, { method: 'POST', body: JSON.stringify({ status, comments: comments || null }) }); flash('Décision finale enregistrée.'); await reload() }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Action impossible.') }
  }
  const decideModification = async (requestId: number, decision: 'Approuvée' | 'Rejetée') => {
    const note = decision === 'Approuvée' ? window.prompt('Note facultative pour l’étudiant :') : window.prompt('Motif obligatoire du refus :')
    if (note === null || (decision === 'Rejetée' && !note.trim())) return
    try {
      await apiRequest(`/chef/modification-requests/${requestId}/decision`, { method: 'POST', body: JSON.stringify({ decision, decision_note: note || null }) })
      flash(decision === 'Approuvée' ? 'La fiche PFE a été rouverte.' : 'La demande a été refusée.'); await reload()
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Action impossible.') }
  }
  return <div className="page-stack">
    <div className="page-title"><div><h1>Validations finales</h1><p>Décisions finales et demandes de réouverture des fiches validées.</p></div></div>
    <Card><CardHeader title="Sujets validés par les encadrants" /><div style={{ padding: 14, display: 'grid', gap: 12 }}>{data.validations.map((pfe) => <div key={pfe.id} className="callout"><strong>{pfe.project}</strong><div style={{ margin: '4px 0 10px' }}>{pfe.student} — {pfe.company || 'Organisme non précisé'}</div><div className="button-row"><Btn onClick={() => void decide(pfe.id, 'Validé')}>Valider définitivement</Btn><Btn variant="secondary" onClick={() => void decide(pfe.id, 'Modifications demandées')}>Demander des modifications</Btn><Btn variant="secondary" onClick={() => void decide(pfe.id, 'Refusé')}>Refuser</Btn></div></div>)}{!data.validations.length && <Notice kind="success">Aucun sujet en attente de validation finale.</Notice>}</div></Card>
    <Card><CardHeader title="Demandes de modification" subtitle={`Demandes concernant les PFE de la filière ${data.filiere.code}.`} /><div style={{ padding: 14, display: 'grid', gap: 12 }}>{data.modification_requests.map((item) => <div key={item.id} className="callout"><div className="button-row" style={{ justifyContent: 'space-between' }}><strong>{item.pfe.title}</strong><StatusBadge status={item.status} /></div><div style={{ marginTop: 5 }}>{fullName(item.pfe.student)} — demande du {formatDate(item.created_at)}</div><div style={{ margin: '8px 0 10px' }}>{item.reason}</div><div className="button-row"><Btn small onClick={() => void decideModification(item.id, 'Approuvée')}>Autoriser la modification</Btn><Btn small variant="secondary" onClick={() => void decideModification(item.id, 'Rejetée')}>Refuser</Btn></div></div>)}{!data.modification_requests.length && <Notice kind="success">Aucune demande de modification en attente.</Notice>}</div></Card>
  </div>
}

function Assignments({ data, reload, flash, setError }: ActionProps) {
  const [pfeId, setPfeId] = useState(String(data.pfes[0]?.id || ''))
  const [supervisorId, setSupervisorId] = useState(String(data.supervisor_loads[0]?.id || ''))
  const assign = async (event: FormEvent) => {
    event.preventDefault()
    try { await apiRequest(`/chef/pfes/${pfeId}/supervisor`, { method: 'POST', body: JSON.stringify({ supervisor_id: Number(supervisorId) }) }); flash('Encadrant affecté.'); await reload() }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Affectation impossible.') }
  }
  return <div className="page-stack"><div className="page-title"><div><h1>Affectation des encadrants</h1><p>Le système contrôle le rôle, la filière et la capacité maximale.</p></div></div><Card><CardHeader title="Nouvelle affectation / réaffectation" /><form className="form-grid" onSubmit={assign}><Field label="PFE"><select required value={pfeId} onChange={(event) => setPfeId(event.target.value)}>{data.pfes.map((pfe) => <option key={pfe.id} value={pfe.id}>{pfe.student} — {pfe.project}</option>)}</select></Field><Field label="Encadrant"><select required value={supervisorId} onChange={(event) => setSupervisorId(event.target.value)}>{data.supervisor_loads.map((item) => <option key={item.id} value={item.id} disabled={item.count >= item.max}>{item.name} ({item.count}/{item.max})</option>)}</select></Field><div className="form-actions"><Btn type="submit">Affecter</Btn></div></form></Card><Card><CardHeader title="Charge actuelle" /><Table headers={['Encadrant', 'PFE affectés', 'Capacité', 'Disponibilité']} rows={data.supervisor_loads.map((item) => [item.name, item.count, item.max, <StatusBadge status={item.count >= item.max ? 'Complet' : 'Disponible'} />])} /></Card></div>
}

function Defenses({ user, data, reload, flash, setError }: { user: AuthUser } & ActionProps) {
  const eligible = data.pfes.filter((pfe) => pfe.status === 'Validé' && !data.defenses.some((defense) => defense.pfe_id === pfe.id))
  const juryOptions = [{ id: user.id, name: `${user.first_name} ${user.last_name}` }, ...data.supervisor_loads.map((item) => ({ id: item.id, name: item.name }))]
  const [pfeId, setPfeId] = useState(String(eligible[0]?.id || ''))
  const [date, setDate] = useState('')
  const [room, setRoom] = useState('')
  const [president, setPresident] = useState(String(user.id))
  const [rapporteur, setRapporteur] = useState(String(juryOptions.find((item) => item.id !== user.id)?.id || ''))
  const [examiner, setExaminer] = useState(String(juryOptions.find((item) => item.id !== user.id && String(item.id) !== rapporteur)?.id || ''))
  useEffect(() => {
    if (!eligible.some((pfe) => String(pfe.id) === pfeId)) setPfeId(String(eligible[0]?.id || ''))
  }, [eligible, pfeId])
  const schedule = async (event: FormEvent) => {
    event.preventDefault(); const ids = [president, rapporteur, examiner]
    if (new Set(ids).size !== ids.length) return setError('Les trois membres du jury doivent être distincts.')
    try {
      await apiRequest('/chef/defenses', { method: 'POST', body: JSON.stringify({ pfe_id: Number(pfeId), date, room, duration_minutes: 45, jury: [{ user_id: Number(president), role: 'Président' }, { user_id: Number(rapporteur), role: 'Rapporteur' }, { user_id: Number(examiner), role: 'Examinateur' }] }) })
      flash('Soutenance planifiée et notifications créées.'); setDate(''); setRoom(''); await reload()
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Planification impossible.') }
  }
  const memberSelect = (value: string, setter: (value: string) => void) => <select required value={value} onChange={(event) => setter(event.target.value)}>{juryOptions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
  return <div className="page-stack"><div className="page-title"><div><h1>Planification des soutenances</h1><p>Contrôle automatique des conflits de salle et de jury.</p></div></div><Card><CardHeader title="Planifier une soutenance" /><form className="form-grid" onSubmit={schedule}><Field label="PFE" full><select required value={pfeId} onChange={(event) => setPfeId(event.target.value)}><option value="">Sélectionner…</option>{eligible.map((pfe) => <option key={pfe.id} value={pfe.id}>{pfe.student} — {pfe.project}</option>)}</select></Field><Field label="Date et heure"><input required type="datetime-local" value={date} onChange={(event) => setDate(event.target.value)} /></Field><Field label="Salle"><input required value={room} onChange={(event) => setRoom(event.target.value)} /></Field><Field label="Président">{memberSelect(president, setPresident)}</Field><Field label="Rapporteur">{memberSelect(rapporteur, setRapporteur)}</Field><Field label="Examinateur">{memberSelect(examiner, setExaminer)}</Field><div className="form-actions"><Btn type="submit" disabled={!eligible.length}>Planifier</Btn></div></form></Card><Card><CardHeader title="Planning" /><Table headers={['Étudiant', 'Date', 'Salle', 'Jury', 'Statut']} rows={data.defenses.map((defense) => [fullName(defense.pfe.student), formatDate(defense.date, true), defense.room, defense.jury_members.map((member) => `${member.role}: ${fullName(member.user)}`).join(' · '), <StatusBadge status={defense.status} />])} />{!data.defenses.length && <div className="table-empty">Aucune soutenance planifiée.</div>}</Card></div>
}

function Exports({ data, setError }: { data: ChefData; setError: (message: string) => void }) {
  return <div className="page-stack"><div className="page-title"><div><h1>Exports et reporting</h1><p>Données de pilotage de la filière {data.filiere.code}.</p></div></div><Card><CardHeader title="Liste complète des PFE" subtitle="Fichier CSV UTF-8 compatible avec Excel" /><div style={{ padding: 16 }}><Btn onClick={() => void downloadFile('/chef/exports/pfes.csv', `pfes-${data.filiere.code}.csv`).catch((reason: Error) => setError(reason.message))}>Télécharger pour Excel</Btn></div></Card><Card><CardHeader title="Indicateurs rapides" /><div className="stats-grid" style={{ padding: 16 }}><StatCard label="Total" value={data.kpis.total_pfes} /><StatCard label="En cours" value={data.kpis.in_progress} color="#059669" /><StatCard label="À risque" value={data.kpis.delayed} color="#dc2626" /><StatCard label="Soutenances" value={data.kpis.scheduled_defenses} color="#7c3aed" /></div></Card></div>
}

interface ActionProps { data: ChefData; reload: () => Promise<void>; flash: (message: string) => void; setError: (message: string) => void }
