import { useEffect, useState, type FormEvent } from 'react'
import { completeGoogleLogin, getGoogleUrl, getSession, login, logout, saveSession, verifySession, type AuthUser } from './api'
import LiveStudentDashboard from './components/LiveStudentDashboard'
import LiveSupervisorDashboard from './components/LiveSupervisorDashboard'
import LiveChefDashboard from './components/LiveChefDashboard'
import LiveAdminDashboard from './components/LiveAdminDashboard'
import AiAssistant from './components/AiAssistant'

export default function App() {
  const [user, setUser] = useState<AuthUser | null>(getSession()?.user || null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const initialize = async () => {
      const params = new URLSearchParams(window.location.search)
      const code = params.get('code')
      const state = params.get('state')
      try {
        if (code && state) {
          const session = await completeGoogleLogin(code, state)
          setUser(session.user)
          window.history.replaceState({}, document.title, '/')
        } else if (getSession()) {
          setUser(await verifySession())
        }
      } catch (reason) {
        saveSession(null)
        setUser(null)
        setError(reason instanceof Error ? reason.message : 'La session n’a pas pu être restaurée.')
      } finally {
        setLoading(false)
      }
    }
    void initialize()
  }, [])

  const signOut = async () => {
    await logout()
    setUser(null)
  }

  if (loading) return <div className="loading-screen">Vérification de la session sécurisée…</div>
  if (!user) return <LoginPage initialError={error} onAuthenticated={setUser} />

  const dashboard = user.role === 'student'
    ? <LiveStudentDashboard user={user} onLogout={() => void signOut()} />
    : user.role === 'supervisor'
      ? <LiveSupervisorDashboard user={user} onLogout={() => void signOut()} />
      : user.role === 'chef'
        ? <LiveChefDashboard user={user} onLogout={() => void signOut()} />
        : <LiveAdminDashboard user={user} onLogout={() => void signOut()} />

  return <>{dashboard}<AiAssistant user={user} /></>
}

function LoginPage({ initialError, onAuthenticated }: { initialError: string; onAuthenticated: (user: AuthUser) => void }) {
  const [email, setEmail] = useState('ahmed.benali@edu.uca.ma')
  const [password, setPassword] = useState('DemoPass!2026')
  const [error, setError] = useState(initialError)
  const [busy, setBusy] = useState(false)

  const localLogin = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setError('')
    try { onAuthenticated((await login(email, password)).user) }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Connexion impossible.') }
    finally { setBusy(false) }
  }

  const googleLogin = async () => {
    setBusy(true); setError('')
    try { window.location.assign(await getGoogleUrl()) }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Google OAuth est indisponible.') }
    finally { setBusy(false) }
  }

  return <main className="login-page">
    <section className="login-brand">
      <div className="crest">E</div>
      <h1>Votre PFE, suivi de bout en bout.</h1>
      <p>Un espace institutionnel unique pour les étudiants, encadrants, chefs de filière et l’administration de l’ENSA Marrakech.</p>
      <div className="login-features"><span>✓ Suivi des jalons et comptes rendus</span><span>✓ Documents versionnés et échanges centralisés</span><span>✓ Soutenances, jurys et évaluations sécurisés</span></div>
    </section>
    <section className="login-panel">
      <div className="login-card">
        <h2>Connexion à GestPFE</h2>
        <p>Utilisez votre compte institutionnel UCA pour accéder à votre espace.</p>
        {error && <div className="callout error" role="alert" style={{ marginBottom: 14 }}>{error}</div>}
        <button type="button" className="google-button" onClick={() => void googleLogin()} disabled={busy}>G&nbsp; Continuer avec Google institutionnel</button>
        <div className="login-divider">Mode local de démonstration</div>
        <form className="login-form" onSubmit={localLogin}>
          <div className="field"><label>E-mail</label><input required type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} /></div>
          <div className="field"><label>Mot de passe</label><input required type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} /></div>
          <button type="submit" disabled={busy}>{busy ? 'Connexion…' : 'Se connecter'}</button>
        </form>
        <div className="login-help">Le formulaire local fonctionne uniquement en environnement de développement. En production, désactivez <strong>LOCAL_LOGIN_ENABLED</strong> et configurez Google OAuth.</div>
      </div>
    </section>
  </main>
}
