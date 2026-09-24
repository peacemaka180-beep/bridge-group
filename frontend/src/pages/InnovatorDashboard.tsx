import { ArrowRight, Bell, CalendarClock, ChartColumn, Rocket, Target } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { API_BASE_URL } from '../config'
import type { AppNavigationHandler } from '../App'
import DashboardLayout from '../components/DashboardLayout'
import InspirationalQuotes, { inspirationalPortraits } from '../components/InspirationalQuotes'
import ProjectCard from '../components/ProjectCard'
import StatCard from '../components/ui/StatCard'
import { categories, milestones, profiles, projects } from '../data/mockData'

type InnovatorDashboardProps = {
  onNavigate: AppNavigationHandler
}

const isFirstTimeFounder = () => {
  const storageValue = localStorage.getItem('bg_first_time_founder')
  return storageValue === null ? true : storageValue === 'true'
}

function InnovatorDashboard({ onNavigate }: InnovatorDashboardProps) {
  const currentProfile = profiles.find((profile) => profile.is_innovator && !profile.is_investor) ?? profiles[0]
  const [backendProjects, setBackendProjects] = useState<any[]>([])
  const [backendIdeas, setBackendIdeas] = useState<any[]>([])
  const [communityFeedData, setCommunityFeedData] = useState<any[]>([])
  const [activeCategory, setActiveCategory] = useState<'all' | string>('all')
  const firstTimeFounder = isFirstTimeFounder()

  useEffect(() => {
    const token = localStorage.getItem('bg_token')
    if (!token) return

    const loadFounderData = async () => {
      try {
        const [projectsResponse, ideasResponse, communityResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/api/projects`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE_URL}/api/ideas`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE_URL}/api/community/posts`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ])

        if (projectsResponse.ok) {
          const projectsData = await projectsResponse.json()
          setBackendProjects(projectsData.projects ?? [])
        }

        if (ideasResponse.ok) {
          const ideasData = await ideasResponse.json()
          setBackendIdeas(ideasData.ideas ?? [])
        }

        if (communityResponse.ok) {
          const communityData = await communityResponse.json()
          setCommunityFeedData(communityData.posts ?? [])
        }
      } catch (error) {
        console.error('Founder dashboard data load failed:', error)
      }
    }

    loadFounderData()
  }, [])

  const portfolioProjects = backendProjects.length
    ? backendProjects.filter((project) => project.innovator_id === Number(currentProfile.id.split('-')[1] || 1) || project.innovator_id === currentProfile.id)
    : projects.filter((project) => project.innovator_id === currentProfile.id)

  const totalRaised = portfolioProjects.reduce((sum, project) => sum + Number(project.funding_raised || 0), 0)
  const totalGoal = portfolioProjects.reduce((sum, project) => sum + Number(project.funding_goal || 0), 0)
  const avgRoi = portfolioProjects.reduce((sum, project) => sum + Number(project.roi_projection || 0), 0) / Math.max(1, portfolioProjects.length)

  const latestMilestones = milestones
    .filter((milestone) => portfolioProjects.some((project) => project.id === milestone.project_id))
    .slice(0, 3)

  const communityCategories = useMemo(
    () => [{ id: 'all', name: 'All categories' }, ...categories.map((category) => ({ id: category.id, name: category.name }))],
    [],
  )

  const communityFeed = useMemo(() => {
    const source = communityFeedData.length ? communityFeedData : []
    return activeCategory === 'all'
      ? source
      : source.filter((post) => post.category === activeCategory)
  }, [activeCategory, communityFeedData])

  const founderTasks = [
    { title: 'Refine pitch deck', detail: 'Add traction proof and risk summary', status: 'Ready' },
    { title: 'Update funding target', detail: 'Align the ask with your current milestone', status: 'Next' },
    { title: 'Book mentor review', detail: 'Schedule product and market feedback', status: 'Planned' },
    { title: 'Share traction update', detail: 'Send customer proof and usage stats', status: 'Scheduled' },
  ]

  const milestoneTracker = [
    { title: 'Prototype validation', progress: 82, due: 'Sep 24', label: 'Completed' },
    { title: 'Pilot launch', progress: 64, due: 'Oct 05', label: 'In progress' },
    { title: 'Investor brief', progress: 39, due: 'Oct 19', label: 'Queued' },
  ]

  const founderMetrics = [
    { label: 'User engagement', value: '+24%', change: 'from last month', tone: 'emerald' },
    { label: 'Conversion rate', value: '18.6%', change: 'pilot to waiting list', tone: 'orange' },
    { label: 'Retention', value: '72%', change: 'active 30-day users', tone: 'sky' },
    { label: 'Review sentiment', value: '4.8/5', change: 'mentor feedback score', tone: 'violet' },
  ]

  const founderFeed = [
    {
      author: 'Amara Okafor',
      role: 'Founder • FarmSense',
      time: '2 hours ago',
      text: 'We just validated the crop-stress alert flow with 18 farmers. The response was overwhelming, and the retention signal is climbing.',
      image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=900&q=80',
      tags: ['traction', 'rural innovation'],
    },
    {
      author: 'Lena K.',
      role: 'Founder • CareLink',
      time: '6 hours ago',
      text: 'Building a stronger clinic feedback loop this week. The first volunteer testers gave us clear insight into usability and trust.',
      image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80',
      tags: ['usability', 'healthtech'],
    },
    {
      author: 'Ibrahim S.',
      role: 'Founder • SolarHub',
      time: '1 day ago',
      text: 'Small wins matter: we closed two more pilot conversations and improved our clean-energy pitch story for community partners.',
      image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=900&q=80',
      tags: ['community', 'energy'],
    },
  ]

  const motivationalNotes = [
    {
      person: 'Sun Tzu',
      title: 'Ancient strategist',
      quote: 'The supreme art of war is to subdue the enemy without fighting.',
      image: inspirationalPortraits.sunTzu,
    },
    {
      person: 'Confucius',
      title: 'Wisdom teacher',
      quote: 'It does not matter how slowly you go as long as you do not stop.',
      image: inspirationalPortraits.confucius,
    },
    {
      person: 'Mencius',
      title: 'Philosopher',
      quote: 'When heaven is about to entrust a great task to a person, it first tests their heart with hardship.',
      image: inspirationalPortraits.mencius,
    },
    {
      person: 'Naruto Uzumaki',
      title: 'Anime inspiration',
      quote: 'It is not the face that makes someone a hero; it is the heart.',
      image: inspirationalPortraits.naruto,
    },
    {
      person: 'Monkey D. Luffy',
      title: 'Anime inspiration',
      quote: 'I don’t want to conquer anything. I just think the guy with the most freedom in the world is the pirate king.',
      image: inspirationalPortraits.luffy,
    },
    { person: 'Confucius', title: 'Wisdom teacher', quote: 'The superior man is modest in his speech, but exceeds in his actions.', image: inspirationalPortraits.confucius },
    { person: 'Mencius', title: 'Philosopher', quote: 'The great man is he who does not lose his childlike heart.', image: inspirationalPortraits.mencius },
    { person: 'Sun Tzu', title: 'Ancient strategist', quote: 'Victorious warriors win first and then go to war.', image: inspirationalPortraits.sunTzu },
  ]

  const [editableMilestones, setEditableMilestones] = useState([
    { title: 'Prototype validation', progress: 82, due: 'Sep 24', label: 'Completed' },
    { title: 'Pilot launch', progress: 64, due: 'Oct 05', label: 'In progress' },
    { title: 'Investor brief', progress: 39, due: 'Oct 19', label: 'Queued' },
  ])

  const [founderGoals, setFounderGoals] = useState([
    { title: 'Close 2 pilot partnerships', target: '2', deadline: 'Oct 12', owner: 'Founder' },
    { title: 'Reach 200 engaged users', target: '200', deadline: 'Oct 22', owner: 'Product' },
    { title: 'Secure mentor review', target: '1', deadline: 'Nov 04', owner: 'Growth' },
  ])

  const [notifications, setNotifications] = useState([
    { title: 'Investor note received', detail: 'Your final traction deck is being reviewed by 3 investors.', time: '8m ago', type: 'insight' },
    { title: 'Mentor check-in scheduled', detail: 'Product and growth mentor review is set for tomorrow morning.', time: '1h ago', type: 'team' },
    { title: 'Milestone update moved', detail: 'Pilot launch target was adjusted after community feedback.', time: '3h ago', type: 'progress' },
  ])

  const [feedback, setFeedback] = useState([
    { investor: 'Maya Chen', note: 'Strong clarity around user pain. Evidence is convincing but the pricing model needs stronger proof.', priority: 'High' },
    { investor: 'Eze Okafor', note: 'The product narrative is compelling. Focus on community trust and operational scale before the next round.', priority: 'Medium' },
    { investor: 'Naomi Reed', note: 'The market opportunity feels real. The main gap is deeper proof of retention beyond the pilot stage.', priority: 'High' },
  ])

  const [comments, setComments] = useState([
    { author: 'Alex', text: 'Great traction update. The user stories are landing well with early testers.', time: '14m ago' },
    { author: 'Mina', text: 'I love the way the pitch is tightening. The community narrative is becoming much clearer.', time: '43m ago' },
  ])

  const [newComment, setNewComment] = useState('')
  const [newGoal, setNewGoal] = useState({ title: '', target: '', deadline: '', owner: 'Founder' })

  const updateMilestone = (index: number, field: 'title' | 'progress' | 'due' | 'label', value: string | number) => {
    setEditableMilestones((current) =>
      current.map((item, itemIndex) => (itemIndex === index ? { ...item, [field]: value } : item)),
    )
  }

  const addComment = () => {
    if (!newComment.trim()) return
    setComments((current) => [{ author: 'You', text: newComment.trim(), time: 'Just now' }, ...current])
    setNewComment('')
  }

  const addGoal = () => {
    if (!newGoal.title.trim() || !newGoal.target.trim() || !newGoal.deadline.trim()) return
    setFounderGoals((current) => [
      ...current,
      {
        title: newGoal.title.trim(),
        target: newGoal.target.trim(),
        deadline: newGoal.deadline.trim(),
        owner: newGoal.owner,
      },
    ])
    setNewGoal({ title: '', target: '', deadline: '', owner: 'Founder' })
  }

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

  return (
    <DashboardLayout title="Innovator dashboard" subtitle="Project overview" onNavigate={onNavigate} onBack={() => onNavigate('landing')}>
      <div className="space-y-6">
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
                <button
                  className="rounded-full bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
                  onClick={() => onNavigate('idea-request')}
                >
                  Submit idea
                </button>
                <button
                  className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-orange-200 hover:text-orange-600"
                  onClick={() => onNavigate('auth')}
                >
                  Book guidance
                </button>
              </div>
            </div>
          </section>
        )}

        <section className="grid gap-4 lg:grid-cols-4">
          <StatCard title="Active projects" value={String(portfolioProjects.length)} change="2 in final push" trend="up" accent="orange" />
          <StatCard title="Funding raised" value={`$${totalRaised.toLocaleString()}`} change="Across 3 rounds" trend="up" accent="green" />
          <StatCard title="Target goal" value={`$${totalGoal.toLocaleString()}`} change="Need 14% closure" trend="neutral" accent="slate" />
          <StatCard title="Avg. ROI" value={`${avgRoi.toFixed(0)}%`} change="Portfolio target" trend="up" accent="amber" />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-5 rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Pipeline</p>
                <h3 className="mt-2 text-xl font-extrabold text-slate-900">My projects</h3>
              </div>
              <button className="rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white">New project</button>
            </div>

            {portfolioProjects.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                <p className="text-lg font-extrabold text-slate-900">Your founder workspace is ready.</p>
                <p className="mt-2 text-sm text-slate-600">
                  Start by submitting your first idea, then track review progress and move your solution toward milestones.
                </p>
                <button
                  className="mt-4 rounded-full bg-[#f97316] px-4 py-2 text-sm font-semibold text-white"
                  onClick={() => onNavigate('idea-request')}
                >
                  Create first idea request
                </button>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {portfolioProjects.map((project) => (
                  <ProjectCard key={project.id} project={project} onSelect={(projectId) => onNavigate('project-detail', projectId)} />
                ))}
              </div>
            )}

            <div className="mt-4 flex justify-end">
              <button
                className="rounded-full bg-[#f97316] px-4 py-2 text-sm font-semibold text-white"
                onClick={() => onNavigate('idea-request')}
              >
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
              {latestMilestones.map((milestone) => (
                <div key={milestone.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 text-orange-700">
                      <Target className="h-4 w-4" />
                    </div>
                    <span className="rounded-full bg-white px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-600">
                      {milestone.status}
                    </span>
                  </div>
                  <h4 className="mt-3 text-lg font-bold text-slate-900">{milestone.title}</h4>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{milestone.description}</p>
                  <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                    <CalendarClock className="h-3.5 w-3.5" />
                    {new Date(milestone.target_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
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
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Founder action board</p>
                <h3 className="mt-2 text-xl font-extrabold text-slate-900">What to do next</h3>
              </div>
            </div>

            <div className="space-y-3">
              {founderTasks.map((task) => (
                <div key={task.title} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div>
                    <p className="font-semibold text-slate-900">{task.title}</p>
                    <p className="text-sm text-slate-600">{task.detail}</p>
                  </div>
                  <span className="rounded-full bg-orange-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-orange-700">
                    {task.status}
                  </span>
                </div>
              ))}
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

        <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Community</p>
              <h3 className="mt-2 text-xl font-extrabold text-slate-900">Category conversations</h3>
            </div>
            <button className="rounded-full bg-[#f97316] px-3 py-1.5 text-xs font-semibold text-white">Start topic</button>
          </div>

          <div className="mb-4 flex flex-wrap gap-2">
            {communityCategories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => setActiveCategory(category.id)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${activeCategory === category.id ? 'bg-slate-900 text-white' : 'border border-slate-200 bg-slate-50 text-slate-600'}`}
              >
                {category.name}
              </button>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {communityFeed.map((post) => (
              <div key={post.id} className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img src={post.author_avatar} alt={post.author_name} className="h-10 w-10 rounded-full object-cover" />
                    <div>
                      <p className="font-semibold text-slate-900">{post.author_name}</p>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">{post.author_role}</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-orange-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-orange-700">{post.replies} replies</span>
                </div>
                <h4 className="mt-4 text-lg font-extrabold text-slate-900">{post.title}</h4>
                <p className="mt-2 text-sm leading-6 text-slate-600">{post.content}</p>
                <div className="mt-3 flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                  <span>{new Date(post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  <button className="text-orange-600">Join discussion</button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Milestone progress</p>
                <h3 className="mt-2 text-xl font-extrabold text-slate-900">Roadmap tracker</h3>
              </div>
            </div>

            <div className="space-y-4">
              {editableMilestones.map((item, index) => (
                <div key={`${item.title}-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <input
                      value={item.title}
                      onChange={(event) => updateMilestone(index, 'title', event.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-2 py-1.5 text-sm font-semibold text-slate-900 outline-none"
                    />
                    <input
                      value={item.label}
                      onChange={(event) => updateMilestone(index, 'label', event.target.value)}
                      className="w-24 rounded-xl border border-slate-200 bg-white px-2 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-600 outline-none"
                    />
                  </div>
                  <div className="mb-2 h-2.5 overflow-hidden rounded-full bg-slate-200">
                    <div className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-400" style={{ width: `${item.progress}%` }} />
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={item.progress}
                      onChange={(event) => updateMilestone(index, 'progress', Number(event.target.value))}
                      className="w-full accent-orange-500"
                    />
                    <div className="flex items-center justify-between gap-2 text-sm text-slate-600">
                      <span>{item.progress}% complete</span>
                      <input
                        value={item.due}
                        onChange={(event) => updateMilestone(index, 'due', event.target.value)}
                        className="w-20 rounded-xl border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600 outline-none"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Founder analytics</p>
              <h3 className="mt-2 text-xl font-extrabold text-slate-900">Real performance signals</h3>
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
                  <div key={`${signal.label}-${signal.value}`} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2">
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
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Notifications</p>
                <h3 className="mt-2 text-xl font-extrabold text-slate-900">Founder updates</h3>
              </div>
            </div>

            <div className="space-y-3">
              {notifications.map((item) => (
                <div key={item.title} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 text-orange-700">
                    <Bell className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold text-slate-900">{item.title}</p>
                      <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">{item.type}</span>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">{item.detail}</p>
                    <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Comments</p>
                <h3 className="mt-2 text-xl font-extrabold text-slate-900">Team feedback</h3>
              </div>
            </div>

            <div className="space-y-3">
              {comments.map((item) => (
                <div key={`${item.author}-${item.time}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-slate-900">{item.author}</p>
                    <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">{item.time}</span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-700">{item.text}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 space-y-3">
              <textarea
                value={newComment}
                onChange={(event) => setNewComment(event.target.value)}
                rows={3}
                placeholder="Add a quick team update or feedback..."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-orange-300"
              />
              <button
                type="button"
                onClick={addComment}
                className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
              >
                Post comment
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

        <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Investor feedback</p>
              <h3 className="mt-2 text-xl font-extrabold text-slate-900">Actual feedback loop</h3>
            </div>

            <div className="space-y-3">
              {feedback.map((item) => (
                <div key={item.investor} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-slate-900">{item.investor}</p>
                    <span className="rounded-full bg-orange-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-orange-700">
                      {item.priority}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-700">{item.note}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Goals</p>
              <h3 className="mt-2 text-xl font-extrabold text-slate-900">Custom founder timeline</h3>
            </div>

            <div className="space-y-3">
              {founderGoals.map((goal) => (
                <div key={`${goal.title}-${goal.deadline}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-slate-900">{goal.title}</p>
                    <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">{goal.owner}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-sm text-slate-600">
                    <span>Target: {goal.target}</span>
                    <span>Deadline: {goal.deadline}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 space-y-3 rounded-2xl border border-dashed border-orange-200 bg-orange-50 p-4">
              <input
                value={newGoal.title}
                onChange={(event) => setNewGoal((current) => ({ ...current, title: event.target.value }))}
                placeholder="Goal title"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none"
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  value={newGoal.target}
                  onChange={(event) => setNewGoal((current) => ({ ...current, target: event.target.value }))}
                  placeholder="Target"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none"
                />
                <input
                  value={newGoal.deadline}
                  onChange={(event) => setNewGoal((current) => ({ ...current, deadline: event.target.value }))}
                  placeholder="Deadline"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none"
                />
              </div>
              <button
                type="button"
                onClick={addGoal}
                className="rounded-full bg-[#f97316] px-4 py-2 text-sm font-semibold text-white"
              >
                Add goal
              </button>
            </div>
          </div>
        </section>

        <InspirationalQuotes quotes={motivationalNotes} eyebrow="Motivation wall" />

        <section className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
              <Rocket className="h-4 w-4 text-orange-600" />
              Launch support
            </div>
            <h3 className="mt-3 text-2xl font-extrabold text-slate-900">Bridge Group Advisory</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">Connect with marketing, operations, and product mentors as you move toward the next funding round.</p>
            <button className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-orange-600" onClick={() => onNavigate('auth')}>
              Book a session
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
              <Bell className="h-4 w-4 text-emerald-600" />
              Investor updates
            </div>
            <h3 className="mt-3 text-2xl font-extrabold text-slate-900">2 new messages</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">Your investors are actively reviewing traction updates and asking for operational details ahead of the next call.</p>
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
    </DashboardLayout>
  )
}

export default InnovatorDashboard
