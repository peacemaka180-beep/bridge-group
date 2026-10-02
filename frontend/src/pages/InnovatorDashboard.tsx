import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { ArrowRight, Bell, CalendarClock, ChartColumn, Rocket, Target, Video, X } from 'lucide-react'
import { API_BASE_URL } from '../config'
import type { AppNavigationHandler } from '../App'
import DashboardLayout from '../components/DashboardLayout'
import ProjectCard from '../components/ProjectCard'
import StatCard from '../components/ui/StatCard'
import { categories } from '../data/mockData'
import { clearSession, getToken, getUser } from '../lib/auth'

type InnovatorDashboardProps = {
  onNavigate: AppNavigationHandler
}

const isFirstTimeFounder = () => {
  const storageValue = localStorage.getItem('bg_first_time_founder')
  return storageValue === null ? true : storageValue === 'true'
}

const fieldClass =
  'w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-orange-500 focus:bg-white focus:outline-none'
const labelClass = 'text-xs font-bold uppercase tracking-wider text-slate-500'

const fmtDate = (value?: string) =>
  value ? new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''
const fmtDateTime = (value?: string) =>
  value
    ? new Date(value).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
    : ''

// Keeps a value in this browser so edits survive a refresh.
function usePersistentState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key)
      return raw ? (JSON.parse(raw) as T) : initial
    } catch {
      return initial
    }
  })
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      /* storage full or blocked: ignore */
    }
  }, [key, value])
  return [value, setValue] as const
}

function Avatar({ src, name }: { src?: string | null; name?: string | null }) {
  if (src) return <img src={src} alt={name ?? ''} className="h-10 w-10 rounded-full object-cover" />
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-sm font-bold text-slate-600">
      {String(name ?? '?').charAt(0).toUpperCase()}
    </div>
  )
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4"
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[24px] border border-slate-200 bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-extrabold text-slate-900">{title}</h3>
          <button type="button" aria-label="Close" className="rounded-full p-1 text-slate-500 hover:bg-slate-100" onClick={onClose}>
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

function InnovatorDashboard({ onNavigate }: InnovatorDashboardProps) {
  const currentUser = getUser()
  const me = Number(currentUser?.id)
  const uid = currentUser?.id ?? 'guest'
  const isAdmin = currentUser?.role === 'admin'
  const firstTimeFounder = isFirstTimeFounder() && !isAdmin

  /* ---------------- data from the backend ---------------- */
  const [backendProjects, setBackendProjects] = useState<any[]>([])
  const [backendIdeas, setBackendIdeas] = useState<any[]>([])
  const [posts, setPosts] = useState<any[]>([])
  const [messages, setMessages] = useState<any[]>([])
  const [calls, setCalls] = useState<any[]>([])
  const [realMilestones, setRealMilestones] = useState<any[]>([])

  /* ---------------- UI state ---------------- */
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [communityQuery, setCommunityQuery] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const [modalError, setModalError] = useState('')

  const [replyTarget, setReplyTarget] = useState<any | null>(null)
  const [replyDraft, setReplyDraft] = useState('')

  const [topicOpen, setTopicOpen] = useState(false)
  const [topicForm, setTopicForm] = useState({ category: '', title: '', content: '' })

  const [guidanceOpen, setGuidanceOpen] = useState(false)
  const [guidanceForm, setGuidanceForm] = useState({ topic: 'Product', preferred_time: '', note: '' })

  const [openThreadId, setOpenThreadId] = useState<number | null>(null)
  const [threadReplies, setThreadReplies] = useState<Record<number, any[]>>({})
  const [threadDraft, setThreadDraft] = useState('')

  /* ---------------- things saved in this browser ---------------- */
  const [editableMilestones, setEditableMilestones] = usePersistentState(`bg_innov_${uid}_roadmap`, [
    { title: 'Prototype validation', progress: 82, due: 'Sep 24', label: 'Completed' },
    { title: 'Pilot launch', progress: 64, due: 'Oct 05', label: 'In progress' },
    { title: 'Investor brief', progress: 39, due: 'Oct 19', label: 'Queued' },
  ])
  const [founderGoals, setFounderGoals] = usePersistentState(`bg_innov_${uid}_goals`, [
    { title: 'Close 2 pilot partnerships', target: '2', deadline: 'Oct 12', owner: 'Founder' },
    { title: 'Reach 200 engaged users', target: '200', deadline: 'Oct 22', owner: 'Product' },
    { title: 'Secure mentor review', target: '1', deadline: 'Nov 04', owner: 'Growth' },
  ])
  const [comments, setComments] = usePersistentState<{ author: string; text: string; time: string }[]>(
    `bg_innov_${uid}_comments`,
    [],
  )
  const [doneTasks, setDoneTasks] = usePersistentState<string[]>(`bg_innov_${uid}_tasks`, [])
  const [newComment, setNewComment] = useState('')
  const [newGoal, setNewGoal] = useState({ title: '', target: '', deadline: '', owner: 'Founder' })

  /* ---------------- helpers ---------------- */
  const showNotice = (text: string) => {
    setNotice(text)
    window.setTimeout(() => setNotice(''), 3000)
  }

  const api = async (path: string, init?: RequestInit) => {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`,
        ...(init?.headers ?? {}),
      },
    })
    if (response.status === 401) {
      clearSession()
      onNavigate('auth')
      throw new Error('Your session expired. Please sign in again.')
    }
    const data = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(data.message || 'Something went wrong.')
    return data
  }

  const run = async (task: () => Promise<void>) => {
    setBusy(true)
    setModalError('')
    try {
      await task()
    } catch (error) {
      const text = error instanceof Error ? error.message : 'Something went wrong.'
      setModalError(text)
      showNotice(text)
    } finally {
      setBusy(false)
    }
  }

  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  /* ---------------- load everything ---------------- */
  useEffect(() => {
    if (!getToken()) return

    const load = async () => {
      const [projectsRes, ideasRes, postsRes, messagesRes, callsRes] = await Promise.allSettled([
        api('/api/projects'),
        api('/api/ideas'),
        api('/api/community/posts'),
        api('/api/messages'),
        api('/api/calls'), // fails quietly until backend/features.js is installed
      ])

      if (projectsRes.status === 'fulfilled') {
        const all: any[] = projectsRes.value.projects ?? []
        setBackendProjects(all)

        // Admins see milestones for every project; founders only for their own.
        const shown = isAdmin ? all : all.filter((project) => Number(project.innovator_id) === me)
        const lists = await Promise.allSettled(shown.map((project) => api(`/api/projects/${project.id}/milestones`)))
        setRealMilestones(
          lists.flatMap((result, index) =>
            result.status === 'fulfilled'
              ? (result.value.milestones ?? []).map((m: any) => ({ ...m, project_title: shown[index].title }))
              : [],
          ),
        )
      }
      if (ideasRes.status === 'fulfilled') setBackendIdeas(ideasRes.value.ideas ?? [])
      if (postsRes.status === 'fulfilled') setPosts(postsRes.value.posts ?? [])
      if (messagesRes.status === 'fulfilled') setMessages(messagesRes.value.messages ?? [])
      if (callsRes.status === 'fulfilled') setCalls(callsRes.value.calls ?? [])
    }

    load().catch((error) => console.error('Founder dashboard data load failed:', error))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* ---------------- derived numbers ---------------- */
  const portfolioProjects = useMemo(
    () => (isAdmin ? backendProjects : backendProjects.filter((project) => Number(project.innovator_id) === me)),
    [backendProjects, me, isAdmin],
  )

  const totalRaised = portfolioProjects.reduce((sum, project) => sum + Number(project.funding_raised || 0), 0)
  const totalGoal = portfolioProjects.reduce((sum, project) => sum + Number(project.funding_goal || 0), 0)
  const avgShare =
    portfolioProjects.reduce((sum, project) => sum + Number(project.revenue_share_pct || 0), 0) /
    Math.max(1, portfolioProjects.length)
  const stillRaising = portfolioProjects.filter(
    (project) => Number(project.funding_raised || 0) < Number(project.funding_goal || 0),
  ).length
  const raisedPct = totalGoal ? Math.round((totalRaised / totalGoal) * 100) : 0

  const latestMilestones = realMilestones.slice(0, 3)

  const incomingMessages = messages.filter((m) => Number(m.receiver_id) === me)
  const incomingPendingCalls = calls.filter((c) => Number(c.receiver_id) === me && c.status === 'pending')
  const upcomingCalls = calls.filter((c) => c.status === 'accepted' && new Date(c.proposed_time).getTime() > Date.now() - 3600_000)
  const outgoingPendingCalls = calls.filter((c) => Number(c.requester_id) === me && c.status === 'pending')

  const updates = [
    ...incomingPendingCalls.map((c) => ({
      id: `call-${c.id}`,
      title: `${c.requester_name} requested a call`,
      detail: `Proposed for ${fmtDateTime(c.proposed_time)}${c.project_title ? ` about ${c.project_title}` : ''}.`,
      time: fmtDate(c.created_at),
      type: 'call',
    })),
    ...incomingMessages.slice(0, 4).map((m) => ({
      id: `msg-${m.id}`,
      title: `New message from ${m.sender_name}`,
      detail: m.content,
      time: fmtDate(m.created_at),
      type: 'message',
    })),
  ]

  const layoutNotifications = updates.map((item) => ({ id: item.id, text: item.title, time: item.time }))

  const postCategories = useMemo(() => {
    const names = new Set<string>(categories.map((category) => category.name))
    posts.forEach((post) => post.category && names.add(post.category))
    return ['all', ...Array.from(names)]
  }, [posts])

  const communityFeed = useMemo(() => {
    const q = communityQuery.trim().toLowerCase()
    return posts.filter((post) => {
      if (activeCategory !== 'all' && post.category !== activeCategory) return false
      if (!q) return true
      return [post.title, post.content, post.author_name].some((value) => String(value ?? '').toLowerCase().includes(q))
    })
  }, [posts, activeCategory, communityQuery])

  const founderTasks = [
    { title: 'Refine pitch deck', detail: 'Add traction proof and risk summary' },
    { title: 'Update funding target', detail: 'Align the ask with your current milestone' },
    { title: 'Book mentor review', detail: 'Schedule product and market feedback' },
    { title: 'Share traction update', detail: 'Send customer proof and usage stats' },
  ]

  const founderMetrics = [
    { label: 'User engagement', value: '+24%', change: 'from last month' },
    { label: 'Conversion rate', value: '18.6%', change: 'pilot to waiting list' },
    { label: 'Retention', value: '72%', change: 'active 30-day users' },
    { label: 'Review sentiment', value: '4.8/5', change: 'mentor feedback score' },
  ]

  const motivationalNotes = [
    { person: 'Sun Tzu', title: 'Ancient strategist', quote: 'The supreme art of war is to subdue the enemy without fighting.', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=500&q=80' },
    { person: 'Confucius', title: 'Wisdom teacher', quote: 'It does not matter how slowly you go as long as you do not stop.', image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=500&q=80' },
    { person: 'Mencius', title: 'Philosopher', quote: 'When heaven is about to entrust a great task to a person, it first tests their heart with hardship.', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=500&q=80' },
    { person: 'Naruto Uzumaki', title: 'Anime inspiration', quote: 'It is not the face that makes someone a hero; it is the heart.', image: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=500&q=80' },
    { person: 'Monkey D. Luffy', title: 'Anime inspiration', quote: 'I don’t want to conquer anything. I just think the guy with the most freedom in the world is the pirate king.', image: 'https://images.unsplash.com/photo-1521119989659-a83eee488004?auto=format&fit=crop&w=500&q=80' },
  ]

  const teamMembers = [
    { name: 'Aisha Bello', role: 'Product lead', focus: 'User insight and iteration' },
    { name: 'Darius James', role: 'Growth lead', focus: 'Pilot acquisition and partnerships' },
    { name: 'Nia Morgan', role: 'Operations', focus: 'Execution and reporting' },
  ]

  const advisors = [
    { name: 'Felix Graham', role: 'Marketing advisor', focus: 'Storytelling and positioning' },
    { name: 'Nora Petrov', role: 'Operations mentor', focus: 'Pilot rollout and process design' },
    { name: 'Kofi Mensah', role: 'Investor connector', focus: 'Capital readiness and introductions' },
  ]

  const liveSignals = [
    { label: 'Active pilots', value: '18', detail: 'across three communities' },
    { label: 'Waitlist', value: '214', detail: 'new signups this week' },
    { label: 'Mentor replies', value: '6', detail: 'in the last 72 hours' },
  ]

  /* ---------------- actions ---------------- */
  const updateMilestone = (index: number, field: 'title' | 'progress' | 'due' | 'label', value: string | number) => {
    setEditableMilestones((current) =>
      current.map((item, itemIndex) => (itemIndex === index ? { ...item, [field]: value } : item)),
    )
  }

  const addComment = () => {
    if (!newComment.trim()) return
    setComments((current) => [
      { author: currentUser?.full_name ?? 'You', text: newComment.trim(), time: new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) },
      ...current,
    ])
    setNewComment('')
  }

  const addGoal = () => {
    if (!newGoal.title.trim() || !newGoal.target.trim() || !newGoal.deadline.trim()) {
      showNotice('Fill in the goal title, target and deadline.')
      return
    }
    setFounderGoals((current) => [...current, { ...newGoal, title: newGoal.title.trim(), target: newGoal.target.trim(), deadline: newGoal.deadline.trim() }])
    setNewGoal({ title: '', target: '', deadline: '', owner: 'Founder' })
  }

  const removeGoal = (index: number) => setFounderGoals((current) => current.filter((_, i) => i !== index))

  const toggleTask = (title: string) =>
    setDoneTasks((current) => (current.includes(title) ? current.filter((t) => t !== title) : [...current, title]))

  const openReply = (message: any) => {
    setReplyTarget(message)
    setReplyDraft('')
    setModalError('')
  }

  const sendReply = () =>
    run(async () => {
      const content = replyDraft.trim()
      if (!replyTarget || !content) throw new Error('Write a message first.')
      const receiverId = Number(replyTarget.sender_id) === me ? replyTarget.receiver_id : replyTarget.sender_id
      await api('/api/messages', {
        method: 'POST',
        body: JSON.stringify({ receiver_id: Number(receiverId), project_id: replyTarget.project_id ?? null, content }),
      })
      const data = await api('/api/messages')
      setMessages(data.messages ?? [])
      setReplyTarget(null)
      showNotice('Message sent.')
    })

  const respondToCall = (id: number, action: 'accept' | 'decline' | 'cancel') =>
    run(async () => {
      const data = await api(`/api/calls/${id}`, { method: 'PATCH', body: JSON.stringify({ action }) })
      setCalls((current) => current.map((c) => (c.id === data.call.id ? data.call : c)))
      showNotice(action === 'accept' ? 'Call accepted. The meeting link is ready.' : action === 'decline' ? 'Request declined.' : 'Request cancelled.')
    })

  const openTopic = () => {
    setTopicForm({ category: postCategories[1] ?? '', title: '', content: '' })
    setModalError('')
    setTopicOpen(true)
  }

  const createTopic = () =>
    run(async () => {
      const { category, title, content } = topicForm
      if (!category || !title.trim() || !content.trim()) throw new Error('Choose a category and fill in the title and message.')
      await api('/api/community/posts', { method: 'POST', body: JSON.stringify({ category, title: title.trim(), content: content.trim() }) })
      const data = await api('/api/community/posts')
      setPosts(data.posts ?? [])
      setActiveCategory('all')
      setTopicOpen(false)
      showNotice('Topic posted.')
    })

  const toggleThread = async (postId: number) => {
    if (openThreadId === postId) {
      setOpenThreadId(null)
      return
    }
    setOpenThreadId(postId)
    setThreadDraft('')
    try {
      const data = await api(`/api/community/posts/${postId}/replies`)
      setThreadReplies((current) => ({ ...current, [postId]: data.replies ?? [] }))
    } catch {
      showNotice('Replies are not available yet. Make sure backend/features.js is installed.')
    }
  }

  const sendThreadReply = (postId: number) =>
    run(async () => {
      const content = threadDraft.trim()
      if (!content) throw new Error('Write a reply first.')
      const data = await api(`/api/community/posts/${postId}/replies`, { method: 'POST', body: JSON.stringify({ content }) })
      setThreadReplies((current) => ({ ...current, [postId]: [...(current[postId] ?? []), data.reply] }))
      setPosts((current) => current.map((p) => (p.id === postId ? { ...p, replies: Number(p.replies || 0) + 1 } : p)))
      setThreadDraft('')
    })

  const openGuidance = () => {
    setGuidanceForm({ topic: 'Product', preferred_time: '', note: '' })
    setModalError('')
    setGuidanceOpen(true)
  }

  const sendGuidance = () =>
    run(async () => {
      await api('/api/guidance', {
        method: 'POST',
        body: JSON.stringify({
          topic: guidanceForm.topic,
          preferred_time: guidanceForm.preferred_time ? fmtDateTime(guidanceForm.preferred_time) : '',
          note: guidanceForm.note.trim(),
        }),
      })
      setGuidanceOpen(false)
      showNotice('Guidance request sent.')
    })

  /* ---------------- page ---------------- */
  return (
    <DashboardLayout
      title="Innovator dashboard"
      subtitle="Project overview"
      onNavigate={onNavigate}
      onBack={() => onNavigate('landing')}
      notifications={layoutNotifications}
      onSearch={(query) => {
        setCommunityQuery(query)
        if (query) scrollTo('community')
      }}
    >
      <div className="space-y-6">
        {isAdmin && (
          <section className="rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900">
            You are viewing this dashboard as an admin. It shows <strong>all {portfolioProjects.length} projects</strong> and
            every idea request on the platform.
          </section>
        )}

        {firstTimeFounder && (
          <section className="rounded-[30px] border border-orange-200 bg-gradient-to-r from-orange-50 via-white to-amber-50 p-6 shadow-sm">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-600">Founder onboarding</p>
                <h2 className="mt-3 text-3xl font-black text-slate-900">Your next big idea deserves a strong first launch.</h2>
                <p className="mt-3 text-sm text-slate-600">
                  Start with a clear problem statement, share your vision, and let the review team guide you toward the right growth path.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button type="button" className="rounded-full bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700" onClick={() => onNavigate('idea-request')}>
                  Submit idea
                </button>
                <button type="button" className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-orange-200 hover:text-orange-600" onClick={openGuidance}>
                  Book guidance
                </button>
              </div>
            </div>
          </section>
        )}

        <section className="grid gap-4 lg:grid-cols-4">
          <StatCard title="Active projects" value={String(portfolioProjects.length)} change={`${stillRaising} still raising`} trend="up" accent="orange" />
          <StatCard title="Funding raised" value={`$${totalRaised.toLocaleString()}`} change={`${raisedPct}% of goal`} trend="up" accent="green" />
          <StatCard title="Target goal" value={`$${totalGoal.toLocaleString()}`} change={`$${Math.max(totalGoal - totalRaised, 0).toLocaleString()} to go`} trend="neutral" accent="slate" />
          <StatCard title="Avg. revenue share" value={`${avgShare.toFixed(1)}%`} change={isAdmin ? 'Across all projects' : 'Across your projects'} trend="up" accent="amber" />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-5 rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Pipeline</p>
                <h3 className="mt-2 text-xl font-extrabold text-slate-900">{isAdmin ? 'All projects' : 'My projects'}</h3>
              </div>
              <button type="button" className="rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700" onClick={() => onNavigate('idea-request')}>
                New project
              </button>
            </div>

            {portfolioProjects.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                <p className="text-lg font-extrabold text-slate-900">{isAdmin ? 'No projects on the platform yet.' : 'Your founder workspace is ready.'}</p>
                <p className="mt-2 text-sm text-slate-600">
                  {isAdmin
                    ? 'Approve an idea from the review page and its project will appear here.'
                    : 'Start by submitting your first idea, then track review progress and move your solution toward milestones.'}
                </p>
                {!isAdmin && (
                  <button type="button" className="mt-4 rounded-full bg-[#f97316] px-4 py-2 text-sm font-semibold text-white" onClick={() => onNavigate('idea-request')}>
                    Create first idea request
                  </button>
                )}
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {portfolioProjects.map((project) => (
                  <ProjectCard key={project.id} project={project} onSelect={(projectId) => onNavigate('project-detail', String(projectId))} />
                ))}
              </div>
            )}

            {backendIdeas.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{isAdmin ? 'All idea requests' : 'My idea requests'}</p>
                <div className="space-y-2">
                  {backendIdeas.map((idea) => (
                    <div key={idea.id} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <div>
                        <p className="font-semibold text-slate-900">{idea.title}</p>
                        <p className="text-xs text-slate-500">{idea.category} · {isAdmin && idea.founder_name ? `${idea.founder_name} · ` : ''}submitted {fmtDate(idea.created_at)}</p>
                      </div>
                      <span className="rounded-full bg-orange-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-orange-700">
                        {idea.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-4 flex justify-end">
              <button type="button" className="rounded-full bg-[#f97316] px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600" onClick={() => onNavigate('idea-request')}>
                Submit new idea request
              </button>
            </div>
          </div>

          <div className="space-y-5 rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Focus</p>
              <h3 className="mt-2 text-xl font-extrabold text-slate-900">Next milestone</h3>
            </div>

            <div className="space-y-4">
              {latestMilestones.length === 0 && (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
                  No milestones recorded for {isAdmin ? 'any project' : 'your projects'} yet.
                </div>
              )}
              {latestMilestones.map((milestone) => (
                <div key={milestone.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 text-orange-700">
                      <Target className="h-4 w-4" />
                    </div>
                    {milestone.status && (
                      <span className="rounded-full bg-white px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-600">
                        {milestone.status}
                      </span>
                    )}
                  </div>
                  <h4 className="mt-3 text-lg font-bold text-slate-900">{milestone.title}</h4>
                  <p className="text-xs text-slate-500">{milestone.project_title}</p>
                  {milestone.description && <p className="mt-1 text-sm leading-6 text-slate-600">{milestone.description}</p>}
                  {milestone.target_date && (
                    <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                      <CalendarClock className="h-3.5 w-3.5" />
                      {new Date(milestone.target_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="rounded-2xl bg-[#111827] p-4 text-white">
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <ChartColumn className="h-4 w-4 text-orange-300" />
                Growth signal
              </div>
              <p className="mt-2 text-3xl font-extrabold">+18.4%</p>
              <p className="mt-1 text-sm text-slate-300">Average traction across active milestones</p>
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Founder action board</p>
              <h3 className="mt-2 text-xl font-extrabold text-slate-900">What to do next</h3>
            </div>

            <div className="space-y-3">
              {founderTasks.map((task) => {
                const done = doneTasks.includes(task.title)
                return (
                  <div key={task.title} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className={done ? 'opacity-50' : ''}>
                      <p className={`font-semibold text-slate-900 ${done ? 'line-through' : ''}`}>{task.title}</p>
                      <p className="text-sm text-slate-600">{task.detail}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleTask(task.title)}
                      className={`rounded-full px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${done ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700 hover:bg-orange-200'}`}
                    >
                      {done ? 'Done' : 'Mark done'}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Traction</p>
              <h3 className="mt-2 text-xl font-extrabold text-slate-900">Momentum snapshot</h3>
            </div>
            <div className="mt-4 space-y-4">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Engagement</p>
                <p className="mt-2 text-3xl font-extrabold text-slate-900">+24%</p>
                <p className="mt-1 text-sm text-slate-600">Across active product signals this month</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Best performing asset</p>
                <p className="mt-2 text-xl font-extrabold text-slate-900">{portfolioProjects[0]?.title ?? 'New idea'}</p>
                <p className="mt-1 text-sm text-slate-600">Strongest traction and investor interest</p>
              </div>
            </div>
          </div>
        </section>

        <section id="inbox" className="grid scroll-mt-6 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Direct messaging</p>
              <h3 className="mt-2 text-xl font-extrabold text-slate-900">One-on-one with investors</h3>
            </div>

            <div className="space-y-3">
              {messages.length === 0 && (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center text-sm text-slate-600">
                  No messages yet. When an investor writes to you, you can reply here.
                </div>
              )}
              {messages.slice(0, 5).map((message) => {
                const mine = Number(message.sender_id) === me
                return (
                  <div key={message.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center gap-3">
                      <Avatar src={mine ? message.receiver_avatar : message.sender_avatar} name={mine ? message.receiver_name : message.sender_name} />
                      <div>
                        <p className="font-semibold text-slate-900">{mine ? `You → ${message.receiver_name}` : message.sender_name}</p>
                        <p className="text-xs text-slate-500">{fmtDateTime(message.created_at)}</p>
                      </div>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-700">{message.content}</p>
                    <div className="mt-3 text-right">
                      <button type="button" className="text-xs font-semibold uppercase tracking-[0.12em] text-orange-600 hover:underline" onClick={() => openReply(message)}>
                        Reply
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Calls</p>
                <h3 className="mt-2 text-xl font-extrabold text-slate-900">Call requests</h3>
              </div>
              <CalendarClock className="h-4 w-4 text-sky-600" />
            </div>

            <div className="space-y-3">
              {calls.length === 0 && (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center text-sm text-slate-600">
                  No call requests yet. When an investor asks for a call, accept or decline it here.
                </div>
              )}

              {incomingPendingCalls.map((call) => (
                <div key={call.id} className="rounded-2xl border border-orange-200 bg-orange-50 p-4">
                  <p className="font-semibold text-slate-900">{call.requester_name} wants a call</p>
                  <p className="mt-1 text-sm text-slate-600">{fmtDateTime(call.proposed_time)}{call.project_title ? ` · ${call.project_title}` : ''}</p>
                  {call.note && <p className="mt-2 text-sm text-slate-700">“{call.note}”</p>}
                  <div className="mt-3 flex gap-2">
                    <button type="button" disabled={busy} className="rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700 disabled:opacity-60" onClick={() => respondToCall(call.id, 'accept')}>
                      Accept
                    </button>
                    <button type="button" disabled={busy} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60" onClick={() => respondToCall(call.id, 'decline')}>
                      Decline
                    </button>
                  </div>
                </div>
              ))}

              {upcomingCalls.map((call) => {
                const other = Number(call.requester_id) === me ? call.receiver_name : call.requester_name
                return (
                  <div key={call.id} className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                    <p className="font-semibold text-slate-900">Call with {other}</p>
                    <p className="mt-1 text-sm text-slate-600">{fmtDateTime(call.proposed_time)}</p>
                    <div className="mt-3 flex items-center gap-3">
                      <a href={call.meeting_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700">
                        <Video className="h-3.5 w-3.5" /> Join call
                      </a>
                      <button type="button" disabled={busy} className="text-xs font-semibold text-slate-500 hover:underline" onClick={() => respondToCall(call.id, 'cancel')}>
                        Cancel
                      </button>
                    </div>
                  </div>
                )
              })}

              {outgoingPendingCalls.map((call) => (
                <div key={call.id} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div>
                    <p className="font-semibold text-slate-900">Waiting on {call.receiver_name}</p>
                    <p className="text-sm text-slate-600">{fmtDateTime(call.proposed_time)}</p>
                  </div>
                  <button type="button" disabled={busy} className="text-xs font-semibold text-slate-500 hover:underline" onClick={() => respondToCall(call.id, 'cancel')}>
                    Cancel
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="community" className="scroll-mt-6 rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Community</p>
              <h3 className="mt-2 text-xl font-extrabold text-slate-900">Category conversations</h3>
            </div>
            <div className="flex items-center gap-2">
              {communityQuery && (
                <button type="button" className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700" onClick={() => setCommunityQuery('')}>
                  Clear search “{communityQuery}”
                </button>
              )}
              <button type="button" className="rounded-full bg-[#f97316] px-3 py-1.5 text-xs font-semibold text-white hover:bg-orange-600" onClick={openTopic}>
                Start topic
              </button>
            </div>
          </div>

          <div className="mb-4 flex flex-wrap gap-2">
            {postCategories.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => setActiveCategory(name)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${activeCategory === name ? 'bg-slate-900 text-white' : 'border border-slate-200 bg-slate-50 text-slate-600'}`}
              >
                {name === 'all' ? 'All categories' : name}
              </button>
            ))}
          </div>

          {communityFeed.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-600">
              No discussions here yet. Use “Start topic” to begin one.
            </div>
          )}

          <div className="grid gap-4 lg:grid-cols-2">
            {communityFeed.map((post) => (
              <div key={post.id} className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar src={post.author_avatar} name={post.author_name} />
                    <div>
                      <p className="font-semibold text-slate-900">{post.author_name}</p>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">{post.author_role}</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-orange-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-orange-700">{post.replies ?? 0} replies</span>
                </div>
                <h4 className="mt-4 text-lg font-extrabold text-slate-900">{post.title}</h4>
                <p className="mt-2 text-sm leading-6 text-slate-600">{post.content}</p>
                <div className="mt-3 flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                  <span>{fmtDate(post.created_at)}</span>
                  <button type="button" className="text-orange-600 hover:underline" onClick={() => toggleThread(post.id)}>
                    {openThreadId === post.id ? 'Hide discussion' : 'Join discussion'}
                  </button>
                </div>

                {openThreadId === post.id && (
                  <div className="mt-4 space-y-3 border-t border-slate-200 pt-4">
                    {(threadReplies[post.id] ?? []).length === 0 && <p className="text-sm text-slate-500">No replies yet. Be the first.</p>}
                    {(threadReplies[post.id] ?? []).map((reply) => (
                      <div key={reply.id} className="rounded-xl border border-slate-200 bg-white p-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-slate-900">{reply.author_name}</p>
                          <span className="text-[10px] uppercase tracking-[0.12em] text-slate-500">{fmtDate(reply.created_at)}</span>
                        </div>
                        <p className="mt-1 text-sm text-slate-700">{reply.content}</p>
                      </div>
                    ))}
                    <textarea value={threadDraft} onChange={(e) => setThreadDraft(e.target.value)} rows={2} placeholder="Write a reply…" className={fieldClass} />
                    <button type="button" disabled={busy} className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-700 disabled:opacity-60" onClick={() => sendThreadReply(post.id)}>
                      Post reply
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Milestone progress</p>
              <h3 className="mt-2 text-xl font-extrabold text-slate-900">Roadmap tracker</h3>
              <p className="mt-1 text-xs text-slate-500">Your edits are saved in this browser.</p>
            </div>

            <div className="space-y-4">
              {editableMilestones.map((item, index) => (
                <div key={index} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <input value={item.title} onChange={(event) => updateMilestone(index, 'title', event.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-2 py-1.5 text-sm font-semibold text-slate-900 outline-none" />
                    <input value={item.label} onChange={(event) => updateMilestone(index, 'label', event.target.value)} className="w-24 rounded-xl border border-slate-200 bg-white px-2 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-600 outline-none" />
                  </div>
                  <div className="mb-2 h-2.5 overflow-hidden rounded-full bg-slate-200">
                    <div className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-400" style={{ width: `${item.progress}%` }} />
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <input type="range" min={0} max={100} value={item.progress} onChange={(event) => updateMilestone(index, 'progress', Number(event.target.value))} className="w-full accent-orange-500" />
                    <div className="flex items-center justify-between gap-2 text-sm text-slate-600">
                      <span>{item.progress}% complete</span>
                      <input value={item.due} onChange={(event) => updateMilestone(index, 'due', event.target.value)} className="w-20 rounded-xl border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600 outline-none" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Founder analytics</p>
              <h3 className="mt-2 text-xl font-extrabold text-slate-900">Performance signals</h3>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {founderMetrics.map((metric) => (
                <div key={metric.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">{metric.label}</p>
                  <p className="mt-2 text-2xl font-extrabold text-slate-900">{metric.value}</p>
                  <p className="mt-1 text-xs text-slate-500">{metric.change}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Live signals</p>
              <div className="mt-3 space-y-3">
                {liveSignals.map((signal) => (
                  <div key={signal.label} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2">
                    <div>
                      <p className="font-semibold text-slate-900">{signal.label}</p>
                      <p className="text-xs text-slate-500">{signal.detail}</p>
                    </div>
                    <span className="text-xl font-extrabold text-slate-900">{signal.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Notifications</p>
              <h3 className="mt-2 text-xl font-extrabold text-slate-900">Founder updates</h3>
            </div>

            <div className="space-y-3">
              {updates.length === 0 && (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center text-sm text-slate-600">
                  You're all caught up. New messages and call requests will show here.
                </div>
              )}
              {updates.map((item) => (
                <div key={item.id} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 text-orange-700">
                    <Bell className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold text-slate-900">{item.title}</p>
                      <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">{item.type}</span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm text-slate-600">{item.detail}</p>
                    <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Comments</p>
              <h3 className="mt-2 text-xl font-extrabold text-slate-900">Team notes</h3>
              <p className="mt-1 text-xs text-slate-500">Private notes, saved in this browser.</p>
            </div>

            <div className="space-y-3">
              {comments.length === 0 && <p className="text-sm text-slate-500">No notes yet.</p>}
              {comments.map((item, index) => (
                <div key={index} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-slate-900">{item.author}</p>
                    <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">{item.time}</span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-700">{item.text}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 space-y-3">
              <textarea value={newComment} onChange={(event) => setNewComment(event.target.value)} rows={3} placeholder="Add a quick team update or note..." className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-orange-300" />
              <button type="button" onClick={addComment} className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700">
                Save note
              </button>
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Team</p>
              <h3 className="mt-2 text-xl font-extrabold text-slate-900">Core crew</h3>
            </div>
            <div className="space-y-3">
              {teamMembers.map((member) => (
                <div key={member.name} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="font-semibold text-slate-900">{member.name}</p>
                  <p className="mt-1 text-sm text-orange-600">{member.role}</p>
                  <p className="mt-2 text-sm text-slate-600">{member.focus}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Advisors</p>
              <h3 className="mt-2 text-xl font-extrabold text-slate-900">Support network</h3>
            </div>
            <div className="space-y-3">
              {advisors.map((advisor) => (
                <div key={advisor.name} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="font-semibold text-slate-900">{advisor.name}</p>
                  <p className="mt-1 text-sm text-sky-600">{advisor.role}</p>
                  <p className="mt-2 text-sm text-slate-600">{advisor.focus}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Goals</p>
            <h3 className="mt-2 text-xl font-extrabold text-slate-900">Custom founder timeline</h3>
            <p className="mt-1 text-xs text-slate-500">Saved in this browser.</p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-3">
              {founderGoals.map((goal, index) => (
                <div key={`${goal.title}-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-slate-900">{goal.title}</p>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">{goal.owner}</span>
                      <button type="button" aria-label="Remove goal" className="text-slate-400 hover:text-rose-600" onClick={() => removeGoal(index)}>
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-sm text-slate-600">
                    <span>Target: {goal.target}</span>
                    <span>Deadline: {goal.deadline}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-3 rounded-2xl border border-dashed border-orange-200 bg-orange-50 p-4">
              <input value={newGoal.title} onChange={(event) => setNewGoal((current) => ({ ...current, title: event.target.value }))} placeholder="Goal title" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none" />
              <div className="grid gap-3 sm:grid-cols-2">
                <input value={newGoal.target} onChange={(event) => setNewGoal((current) => ({ ...current, target: event.target.value }))} placeholder="Target" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none" />
                <input value={newGoal.deadline} onChange={(event) => setNewGoal((current) => ({ ...current, deadline: event.target.value }))} placeholder="Deadline (e.g. Nov 20)" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none" />
              </div>
              <button type="button" onClick={addGoal} className="rounded-full bg-[#f97316] px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600">
                Add goal
              </button>
            </div>
          </div>
        </section>

        <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Motivation wall</p>
            <h3 className="mt-2 text-xl font-extrabold text-slate-900">Wisdom for the road ahead</h3>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {motivationalNotes.map((note) => (
              <div key={note.person} className="rounded-[24px] border border-slate-200 bg-slate-50 p-3">
                <img src={note.image} alt={note.person} className="h-28 w-full rounded-2xl object-cover" />
                <p className="mt-3 text-xs font-semibold uppercase tracking-[0.12em] text-orange-600">{note.title}</p>
                <p className="mt-1 text-base font-extrabold text-slate-900">{note.person}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">“{note.quote}”</p>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
              <Rocket className="h-4 w-4 text-orange-600" />
              Launch support
            </div>
            <h3 className="mt-3 text-2xl font-extrabold text-slate-900">Bridge Group Advisory</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">Connect with marketing, operations, and product mentors as you move toward the next funding round.</p>
            <button type="button" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-orange-600 hover:underline" onClick={openGuidance}>
              Book a session
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
              <Bell className="h-4 w-4 text-emerald-600" />
              Investor updates
            </div>
            <h3 className="mt-3 text-2xl font-extrabold text-slate-900">
              {incomingMessages.length} {incomingMessages.length === 1 ? 'message' : 'messages'}
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {incomingPendingCalls.length > 0
                ? `${incomingPendingCalls.length} call ${incomingPendingCalls.length === 1 ? 'request is' : 'requests are'} waiting for your answer.`
                : 'Investors who message you or ask for a call will appear in your inbox.'}
            </p>
            <button type="button" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-orange-600 hover:underline" onClick={() => scrollTo('inbox')}>
              Open inbox
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
              <Target className="h-4 w-4 text-sky-600" />
              Strategic objective
            </div>
            <h3 className="mt-3 text-2xl font-extrabold text-slate-900">Secure follow-on funding</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">Push final pilot results, document customer proof, and align your next round with market readiness.</p>
          </div>
        </section>
      </div>

      {/* Reply to a message */}
      {replyTarget && (
        <Modal title="Reply" onClose={() => setReplyTarget(null)}>
          <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
            <p className="font-semibold text-slate-900">{replyTarget.sender_name}</p>
            <p className="mt-1 line-clamp-3">{replyTarget.content}</p>
          </div>
          <label className={labelClass}>Your reply</label>
          <textarea value={replyDraft} onChange={(e) => setReplyDraft(e.target.value)} rows={5} className={`mt-1 ${fieldClass}`} placeholder="Write your reply…" />
          {modalError && <p className="mt-3 text-sm font-medium text-rose-600">{modalError}</p>}
          <div className="mt-5 flex justify-end gap-3">
            <button type="button" className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50" onClick={() => setReplyTarget(null)}>Cancel</button>
            <button type="button" disabled={busy} className="rounded-full bg-[#f97316] px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60" onClick={sendReply}>
              {busy ? 'Sending…' : 'Send reply'}
            </button>
          </div>
        </Modal>
      )}

      {/* Start a community topic */}
      {topicOpen && (
        <Modal title="Start a topic" onClose={() => setTopicOpen(false)}>
          <label className={labelClass}>Category</label>
          <select value={topicForm.category} onChange={(e) => setTopicForm({ ...topicForm, category: e.target.value })} className={`mt-1 ${fieldClass}`}>
            {postCategories.filter((name) => name !== 'all').map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
          <label className={`mt-4 block ${labelClass}`}>Title</label>
          <input value={topicForm.title} onChange={(e) => setTopicForm({ ...topicForm, title: e.target.value })} className={`mt-1 ${fieldClass}`} placeholder="What do you want to discuss?" />
          <label className={`mt-4 block ${labelClass}`}>Message</label>
          <textarea value={topicForm.content} onChange={(e) => setTopicForm({ ...topicForm, content: e.target.value })} rows={5} className={`mt-1 ${fieldClass}`} placeholder="Share some context…" />
          {modalError && <p className="mt-3 text-sm font-medium text-rose-600">{modalError}</p>}
          <div className="mt-5 flex justify-end gap-3">
            <button type="button" className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50" onClick={() => setTopicOpen(false)}>Cancel</button>
            <button type="button" disabled={busy} className="rounded-full bg-[#f97316] px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60" onClick={createTopic}>
              {busy ? 'Posting…' : 'Post topic'}
            </button>
          </div>
        </Modal>
      )}

      {/* Book guidance */}
      {guidanceOpen && (
        <Modal title="Book guidance" onClose={() => setGuidanceOpen(false)}>
          <label className={labelClass}>What do you need help with?</label>
          <select value={guidanceForm.topic} onChange={(e) => setGuidanceForm({ ...guidanceForm, topic: e.target.value })} className={`mt-1 ${fieldClass}`}>
            {['Product', 'Marketing', 'Operations', 'Funding readiness', 'Something else'].map((topic) => (
              <option key={topic} value={topic}>{topic}</option>
            ))}
          </select>
          <label className={`mt-4 block ${labelClass}`}>Preferred time (optional)</label>
          <input type="datetime-local" value={guidanceForm.preferred_time} onChange={(e) => setGuidanceForm({ ...guidanceForm, preferred_time: e.target.value })} className={`mt-1 ${fieldClass}`} />
          <label className={`mt-4 block ${labelClass}`}>Notes (optional)</label>
          <textarea value={guidanceForm.note} onChange={(e) => setGuidanceForm({ ...guidanceForm, note: e.target.value })} rows={4} className={`mt-1 ${fieldClass}`} placeholder="Tell the advisor what you're working on…" />
          {modalError && <p className="mt-3 text-sm font-medium text-rose-600">{modalError}</p>}
          <div className="mt-5 flex justify-end gap-3">
            <button type="button" className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50" onClick={() => setGuidanceOpen(false)}>Cancel</button>
            <button type="button" disabled={busy} className="rounded-full bg-[#f97316] px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60" onClick={sendGuidance}>
              {busy ? 'Sending…' : 'Send request'}
            </button>
          </div>
        </Modal>
      )}

      {notice && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm rounded-full bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-lg">
          {notice}
        </div>
      )}
    </DashboardLayout>
  )
}

export default InnovatorDashboard