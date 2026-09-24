import { ArrowRight, BriefcaseBusiness, Sparkles, UserCircle2 } from 'lucide-react'
import { useState } from 'react'
import type { AppNavigationHandler } from '../App'

type AuthPageProps = {
  onNavigate: AppNavigationHandler
}

function AuthPage({ onNavigate }: AuthPageProps) {
  const [selectedRole, setSelectedRole] = useState<'investor' | 'innovator' | 'admin'>('investor')
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [company, setCompany] = useState('')

  const handleRoleSelect = (role: 'investor' | 'innovator' | 'admin') => {
    setSelectedRole(role)
    setCompany('')
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!email.trim() || !password.trim()) { return }
    const activeApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000'
    const endpoint = authMode === 'signup' ? `${activeApiUrl}/api/auth/register` : `${activeApiUrl}/api/auth/login`
    const payload = authMode === 'signup'
      ? { full_name: fullName.trim(), email: email.trim(), password: password, role: selectedRole, company: company.trim() || '', bio: '', avatar_url: '' }
      : { full_name: fullName.trim(), email: email.trim(), password: password, role: selectedRole }
    try {
      const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const data = await response.json()
      if (!response.ok) { throw new Error(data.message || 'Authentication failed.') }
      localStorage.setItem('bg_token', data.token)
      localStorage.setItem('bg_user', JSON.stringify(data.user))
      localStorage.setItem('bg_first_time_investor', String(data.user.role === 'investor'))
      localStorage.setItem('bg_first_time_founder', String(data.user.role === 'innovator'))
      if (data.user.role === 'admin') { onNavigate('admin-review'); return }
      if (data.user.role === 'innovator') { onNavigate('innovator'); return }
      onNavigate('investor')
    } catch (error) {
      console.error('Auth error:', error)
      alert(error instanceof Error ? error.message : 'Authentication failed. Please try again.')
    }
  }

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
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{authMode === 'signin' ? 'Welcome back' : 'Create your account'}</p>
                  <h2 className="mt-2 text-3xl font-extrabold text-slate-900">{authMode === 'signin' ? 'Sign in' : 'Get started'}</h2>
                </div>
                <button type="button" className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700" onClick={() => onNavigate('landing')}>
                  Back
                </button>
              </div>
              <div className="mt-4 flex gap-2 rounded-full border border-slate-200 bg-slate-50 p-1">
                <button type="button" onClick={() => setAuthMode('signin')} className={`flex-1 rounded-full px-3 py-2 text-sm font-semibold transition ${authMode === 'signin' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>
                  Sign In
                </button>
                <button type="button" onClick={() => setAuthMode('signup')} className={`flex-1 rounded-full px-3 py-2 text-sm font-semibold transition ${authMode === 'signup' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>
                  Create Account
                </button>
              </div>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
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
              </div>
              <div className="mt-6 space-y-4">
                {authMode === 'signup' && (
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Full Name</label>
                    <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="John Doe" className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-orange-500 focus:bg-white focus:outline-none" required />
                  </div>
                )}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Email Address</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-orange-500 focus:bg-white focus:outline-none" required />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Password</label>
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="********" className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-orange-500 focus:bg-white focus:outline-none" required />
                </div>
                {authMode === 'signup' && selectedRole === 'investor' && (
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Company / Fund Name</label>
                    <input type="text" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Bridge Capital" className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-orange-500 focus:bg-white focus:outline-none" />
                  </div>
                )}
              </div>
              <button type="submit" className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#f97316] px-4 py-3 text-sm font-bold text-white transition hover:bg-orange-600">
                {authMode === 'signin' ? 'Sign In' : 'Create Account'}
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AuthPage