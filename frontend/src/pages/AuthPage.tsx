import { ArrowRight, BriefcaseBusiness, Sparkles, UserCircle2 } from 'lucide-react'
import { useState } from 'react'
import type { AppNavigationHandler } from '../App'
import { bootstrapAdmin, confirmPasswordReset, login as apiLogin, register as apiRegister, requestPasswordReset } from '../lib/api'
import { saveSession } from '../lib/auth'

type AuthPageProps = {
  onNavigate: AppNavigationHandler
  resetToken?: string
}

type Role = 'investor' | 'innovator' | 'admin'
type Mode = 'signin' | 'signup' | 'forgot' | 'reset' | 'adminSetup'

// The landing page saves which button was clicked under "bg_auth_intent".
// Read it (without deleting it) so the form opens on the right role and tab.
function readIntent(): { role: Role; mode: Mode } {
  const fallback = { role: 'investor' as Role, mode: 'signin' as Mode }
  try {
    const raw = localStorage.getItem('bg_auth_intent')
    if (!raw) return fallback
    const parsed = JSON.parse(raw) as { role?: string; mode?: string }
    const mode: Mode = parsed.mode === 'register' ? 'signup' : 'signin'
    const role: Role = parsed.role === 'innovator' || parsed.role === 'investor' ? parsed.role : 'investor'
    return { role, mode }
  } catch {
    return fallback
  }
}

function AuthPage({ onNavigate, resetToken }: AuthPageProps) {
  const [intent] = useState(readIntent)
  const [selectedRole, setSelectedRole] = useState<Role>(intent.role)
  const [authMode, setAuthMode] = useState<Mode>(resetToken ? 'reset' : intent.mode)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [bootstrapKey, setBootstrapKey] = useState('')
  const [company, setCompany] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const handleRoleSelect = (role: Role) => {
    setSelectedRole(role)
    setCompany('')
    setErrorMessage('')
  }

  const handleModeSelect = (mode: Mode) => {
    setErrorMessage('')
    setSuccessMessage('')
    if (mode === 'signup' && selectedRole === 'admin') {
      setAuthMode('adminSetup')
      setSelectedRole('admin')
      return
    }
    setAuthMode(mode)
    if (mode === 'adminSetup') setSelectedRole('admin')
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (authMode !== 'reset' && !email.trim()) return
    if (authMode === 'signin' || authMode === 'signup' || authMode === 'reset' || authMode === 'adminSetup') {
      if (!password) return
    }
    if (authMode === 'adminSetup' && (!fullName.trim() || !bootstrapKey.trim())) return
    if (authMode === 'reset' && password !== confirmPassword) {
      setErrorMessage('The passwords do not match.')
      return
    }
    if (authMode === 'reset' && !resetToken) {
      setErrorMessage('This reset link is invalid. Request a new one.')
      return
    }

    setIsSubmitting(true)
    setErrorMessage('')
    setSuccessMessage('')
    try {
      if (authMode === 'forgot') {
        const result = await requestPasswordReset(email.trim())
        setSuccessMessage(result.message)
        return
      }
      if (authMode === 'reset' && resetToken) {
        const result = await confirmPasswordReset(resetToken, password)
        setSuccessMessage(result.message)
        setPassword('')
        setConfirmPassword('')
        setAuthMode('signin')
        window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}#/auth`)
        return
      }

      const data = authMode === 'signup'
        ? await apiRegister({
              full_name: fullName.trim(),
              email: email.trim(),
              password,
              role: selectedRole as 'investor' | 'innovator',
              company: company.trim() || undefined,
            })
        : authMode === 'adminSetup'
          ? await bootstrapAdmin({ key: bootstrapKey.trim(), full_name: fullName.trim(), email: email.trim(), password })
          : await apiLogin(email.trim(), password, selectedRole)

      // Saving the session is what keeps you signed in across refreshes.
      saveSession(data.token, data.user)
      localStorage.removeItem('bg_auth_intent')

      // Each role lands on its own dashboard.
      if (data.user.role === 'admin') {
        onNavigate('admin')
        return
      }
      if (data.user.role === 'innovator') {
        onNavigate('innovator')
        return
      }
      onNavigate('investor')
    } catch (error) {
      console.error('Auth error:', error)
      setErrorMessage(error instanceof Error ? error.message : 'Authentication failed. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const inputClass =
    'mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-orange-500 focus:bg-white focus:outline-none'
  const isAccountForm = authMode === 'signin' || authMode === 'signup'
  const pageTitle = authMode === 'signin' ? 'Sign in' : authMode === 'signup' ? 'Get started' : authMode === 'forgot' ? 'Forgot password' : authMode === 'reset' ? 'Reset password' : 'First Admin setup'
  const hasEmailField = authMode !== 'reset'
  const hasPasswordField = authMode !== 'forgot'

  return (
    <div className="min-h-screen bg-[#f7f1ea] px-4 py-10 text-slate-900">
      <div className="mx-auto max-w-6xl overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.08)]">
        <div className="grid lg:grid-cols-[1.1fr_0.9fr]">
          <div className="bg-[#111827] p-8 text-white md:p-10">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f97316] text-lg font-black text-white">BG</div>
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-slate-300">Bridge Group</p>
                <h1 className="text-2xl font-extrabold">Build what is next</h1>
              </div>
            </div>
            <div className="mt-10 space-y-6">
              <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500/15 text-orange-300">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold">For founders</p>
                    <p className="text-sm text-slate-300">Launch bright ideas, get support, and bring them to market faster.</p>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-300">
                    <BriefcaseBusiness className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold">For investors</p>
                    <p className="text-sm text-slate-300">Find promising opportunities and track growth in real time.</p>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-orange-500/40 bg-orange-500/5 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-300">First time here?</p>
                <p className="mt-2 text-sm text-slate-200">Set up your profile, choose your role, and start building your next move in minutes.</p>
              </div>
            </div>
          </div>
          <div className="p-8 md:p-10">
            <form onSubmit={handleSubmit}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{authMode === 'signin' ? 'Welcome back' : authMode === 'signup' ? 'Create your account' : 'Account access'}</p>
                  <h2 className="mt-2 text-3xl font-extrabold text-slate-900">{pageTitle}</h2>
                </div>
                <button type="button" className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-orange-200" onClick={() => authMode === 'forgot' || authMode === 'reset' || authMode === 'adminSetup' ? handleModeSelect('signin') : onNavigate('landing')}>
                  {authMode === 'forgot' || authMode === 'reset' || authMode === 'adminSetup' ? 'Sign in' : 'Back'}
                </button>
              </div>
              {isAccountForm && (
                <div className="mt-4 flex gap-2 rounded-full border border-slate-200 bg-slate-50 p-1">
                  <button type="button" onClick={() => handleModeSelect('signin')} className={`flex-1 rounded-full px-3 py-2 text-sm font-semibold transition ${authMode === 'signin' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>
                    Sign In
                  </button>
                  <button type="button" onClick={() => handleModeSelect('signup')} className={`flex-1 rounded-full px-3 py-2 text-sm font-semibold transition ${authMode === 'signup' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>
                    Create Account
                  </button>
                </div>
              )}
              {isAccountForm && <div className={`mt-6 grid gap-3 ${authMode === 'signin' ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
                <button type="button" className={`rounded-2xl border p-4 text-left transition ${selectedRole === 'investor' ? 'border-orange-200 bg-orange-50' : 'border-slate-200 bg-slate-50 hover:border-orange-200 hover:bg-orange-50'}`} onClick={() => handleRoleSelect('investor')}>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 text-orange-700">
                      <BriefcaseBusiness className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold">Investor</p>
                      <p className="text-xs text-slate-500">Portfolio</p>
                    </div>
                  </div>
                </button>
                <button type="button" className={`rounded-2xl border p-4 text-left transition ${selectedRole === 'innovator' ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-slate-50 hover:border-orange-200 hover:bg-orange-50'}`} onClick={() => handleRoleSelect('innovator')}>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                      <UserCircle2 className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold">Innovator</p>
                      <p className="text-xs text-slate-500">Ideas</p>
                    </div>
                  </div>
                </button>
                {authMode === 'signin' && (
                  <button type="button" className={`rounded-2xl border p-4 text-left transition ${selectedRole === 'admin' ? 'border-slate-400 bg-slate-100' : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-slate-100'}`} onClick={() => handleRoleSelect('admin')}>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-slate-700">
                        <UserCircle2 className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-semibold">Admin</p>
                        <p className="text-xs text-slate-500">Sign in only</p>
                      </div>
                    </div>
                  </button>
                )}
              </div>}
              <div className="mt-6 space-y-4">
                {(authMode === 'signup' || authMode === 'adminSetup') && (
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Full Name</label>
                    <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="John Doe" autoComplete="name" className={inputClass} required />
                  </div>
                )}
                {hasEmailField && <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Email Address</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" className={inputClass} required />
                </div>}
                {hasPasswordField && <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Password</label>
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="********" autoComplete={authMode === 'signin' ? 'current-password' : 'new-password'} className={inputClass} minLength={authMode === 'signin' ? undefined : 8} required />
                </div>}
                {authMode === 'adminSetup' && <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">One-time setup key</label>
                  <input type="password" value={bootstrapKey} onChange={(e) => setBootstrapKey(e.target.value)} autoComplete="off" className={inputClass} minLength={32} required />
                  <p className="mt-1 text-xs text-slate-500">Use the key configured by the server administrator. Setup closes after the first admin account is created.</p>
                </div>}
                {authMode === 'reset' && <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Confirm new password</label>
                  <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} autoComplete="new-password" className={inputClass} minLength={8} required />
                </div>}
                {authMode === 'signin' && <button type="button" className="text-left text-sm font-semibold text-orange-700 hover:text-orange-800" onClick={() => handleModeSelect('forgot')}>Forgot password?</button>}
                {authMode === 'signin' && selectedRole === 'admin' && <button type="button" className="text-left text-sm font-semibold text-slate-700 hover:text-orange-700" onClick={() => handleModeSelect('adminSetup')}>Create first admin account</button>}
                {authMode === 'signup' && selectedRole === 'investor' && (
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Company / Fund Name</label>
                    <input type="text" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Bridge Capital" className={inputClass} />
                  </div>
                )}
              </div>

              {errorMessage && (
                <p role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                  {errorMessage}
                </p>
              )}
              {successMessage && <p role="status" className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">{successMessage}</p>}

              <button type="submit" disabled={isSubmitting} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#f97316] px-4 py-3 text-sm font-bold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60">
                {isSubmitting ? 'Please wait…' : authMode === 'signin' ? 'Sign In' : authMode === 'signup' ? 'Create Account' : authMode === 'forgot' ? 'Send reset link' : authMode === 'reset' ? 'Reset password' : 'Create admin account'}
                {authMode !== 'forgot' && <ArrowRight className="h-4 w-4" />}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AuthPage
