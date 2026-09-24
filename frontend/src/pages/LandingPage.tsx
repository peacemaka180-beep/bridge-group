import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  Cpu,
  HeartPulse,
  Palette,
  Sprout,
  TrendingUp,
  Zap,
} from 'lucide-react'
import type { AppNavigationHandler } from '../App'
import { categories } from '../data/mockData'
import InspirationalQuotes, { inspirationalPortraits } from '../components/InspirationalQuotes'

const categoryIconMap = {
  Technology: Cpu,
  Agriculture: Sprout,
  Healthcare: HeartPulse,
  'Creative Arts': Palette,
  'Renewable Energy': Zap,
} as const

const pillars = [
  {
    title: 'Co-Build, Not Just Fund',
    description:
      'Bridge Group works alongside every innovator. We help refine, build, and scale each project — not just write a check.',
    image:
      'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=900&q=80',
  },
  {
    title: 'Connect to Giants',
    description:
      'We link innovators to corporate experts, business owners, and investors who bring decades of industry experience.',
    image:
      'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=900&q=80',
  },
  {
    title: 'Shared Returns',
    description:
      'When an innovation grows, returns flow back to investors through equity and revenue sharing. Everyone wins together.',
    image:
      'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=900&q=80',
  },
]

const steps = [
  {
    title: 'Submit your idea',
    description: 'Share your innovation with a category, problem, and proposed solution.',
    accent: '01',
  },
  {
    title: 'We co-build with you',
    description: 'Bridge Group assigns a team to help refine, prototype, and prepare your project for investment.',
    accent: '02',
  },
  {
    title: 'Get matched with investors',
    description: 'Vetted investors and corporate experts discover your project and reach out in real time.',
    accent: '03',
  },
  {
    title: 'Grow together',
    description: 'Track milestones, receive funding, and share returns as your innovation scales.',
    accent: '04',
  },
]

const testimonials = [
  {
    quote:
      'Bridge Group helped us turn a promising pilot into a serious growth story. We felt supported before the money even arrived.',
    name: 'Amara Okafor',
    role: 'Founder, FarmSense',
    image:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
  },
  {
    quote:
      'The platform made it easy to spot strong opportunities, understand the upside, and track actual performance with clarity.',
    name: 'James Mwangi',
    role: 'Investor, Horizon Capital',
    image:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
  },
  {
    quote:
      'The combination of capital access and strategic guidance was exactly what we needed at the early-stage growth point.',
    name: 'Dr. Laila Hassan',
    role: 'Founder, PulseCheck',
    image:
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
  },
]

const financialHighlights = [
  { label: 'Capital deployed', value: '$2.4M', detail: 'Across 41 active projects' },
  { label: 'Average ROI', value: '19%', detail: 'Projected and tracked' },
  { label: 'Portfolio strength', value: '86%', detail: 'Across investment categories' },
  { label: 'Payout performance', value: '7.2%', detail: 'Quarterly share distributions' },
]

const investmentSteps = [
  {
    title: 'Browse vetted innovations',
    description: 'Filter by category, stage, and ROI projection. Every project is Bridge Group-approved.',
    accent: '01',
  },
  {
    title: 'Follow and connect',
    description: 'Bookmark projects to your watchlist and start real-time chats with innovators.',
    accent: '02',
  },
  {
    title: 'Commit capital',
    description: 'Invest with clear equity and revenue-sharing terms. No payments from innovators — returns come from growth.',
    accent: '03',
  },
  {
    title: 'Track your portfolio',
    description: 'Monitor ROI, revenue shares, and milestone progress with live charts and dashboards.',
    accent: '04',
  },
]

type LandingPageProps = {
  onNavigate: AppNavigationHandler
}

function LandingPage({ onNavigate }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-[#f7f1ea] text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-[#f7f1ea]/80 backdrop-blur-md">
        <div className="container-shell flex h-20 items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f97316] text-sm font-bold text-white shadow-md">
              BG
            </div>
            <div>
              <p className="text-lg font-bold tracking-tight text-slate-900">Bridge Group</p>
            </div>
          </div>

          <nav className="hidden items-center gap-8 text-sm font-medium text-slate-700 md:flex">
            <a href="#mission" className="transition hover:text-slate-950">Mission</a>
            <a href="#categories" className="transition hover:text-slate-950">Categories</a>
            <a href="#how" className="transition hover:text-slate-950">How It Works</a>
          </nav>

          <div className="flex items-center gap-3">
            <button className="brand-button-secondary hidden sm:inline-flex" onClick={() => onNavigate('auth')}>
              Sign In
            </button>
            <button className="brand-button-primary" onClick={() => onNavigate('auth')}>
              Get Started Today
            </button>
          </div>
        </div>
      </header>

      <main>
        <section className="container-shell pb-16 pt-10 md:pt-16">
          <div className="grid items-center gap-10 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-orange-700">
                <BadgeCheck className="h-3.5 w-3.5" />
                Trusted ecosystem for builders and backers
              </div>

              <h1 className="max-w-xl text-4xl font-extrabold tracking-[-0.05em] text-slate-900 sm:text-5xl lg:text-6xl">
                Where bold ideas meet the capital and expertise to grow.
              </h1>

              <p className="mt-5 max-w-xl text-lg leading-8 text-slate-700">
                Bridge Group pairs young innovators with corporate experts and investors across Technology,
                Agriculture, Healthcare, Creative Arts, and Renewable Energy. We co-build every project and
                connect it to the partners it needs to scale.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <button className="brand-button-primary" onClick={() => onNavigate('auth')}>
                  Join as Innovator
                  <ArrowRight className="h-4 w-4" />
                </button>
                <button className="brand-button-secondary" onClick={() => onNavigate('auth')}>
                  Join as Investor
                </button>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-slate-600">
                <span className="rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 font-medium">Trusted by founders</span>
                <span className="rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 font-medium">Corporate partners</span>
                <span className="rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 font-medium">Impact investors</span>
              </div>

              <div className="mt-10 grid grid-cols-3 gap-4">
                <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">
                  <div className="text-2xl font-extrabold tracking-tight text-slate-900">41</div>
                  <div className="mt-1 text-sm text-slate-600">Active Projects</div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">
                  <div className="text-2xl font-extrabold tracking-tight text-slate-900">$2.4M</div>
                  <div className="mt-1 text-sm text-slate-600">Capital Deployed</div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">
                  <div className="text-2xl font-extrabold tracking-tight text-slate-900">156</div>
                  <div className="mt-1 text-sm text-slate-600">Members</div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="pl-2 md:pl-10">
                <div className="soft-card overflow-hidden">
                  <div
                    className="h-64 w-full bg-cover bg-center"
                    style={{
                      backgroundImage:
                        "url('https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80')",
                    }}
                  />

                  <div className="space-y-5 p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Portfolio Snapshot</p>
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-3xl font-extrabold tracking-tight text-slate-900">+19%</span>
                          <span className="text-sm font-medium text-emerald-600">ROI</span>
                        </div>
                      </div>
                      <div className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                        Live</div>
                    </div>

                    <div className="space-y-3 text-sm text-slate-700">
                      {[
                        { name: 'SolarKiosk', value: '81% funded' },
                        { name: 'PulseCheck', value: '84% funded' },
                        { name: 'PayLink', value: '85% funded' },
                        { name: 'FarmSense', value: '70% funded' },
                      ].map((item) => (
                        <div key={item.name} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                          <span className="font-medium text-slate-800">{item.name}</span>
                          <span className="text-slate-600">{item.value}</span>
                        </div>
                      ))}
                    </div>

                    <div className="rounded-2xl border border-orange-100 bg-orange-50 p-4">
                      <div className="flex items-center justify-between text-sm text-slate-700">
                        <span>Invested</span>
                        <span className="font-semibold text-slate-900">$200K</span>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-sm text-slate-700">
                        <span>Returns</span>
                        <span className="font-semibold text-slate-900">$38K</span>
                      </div>
                      <div className="mt-3 border-t border-orange-100 pt-3 text-sm text-slate-700">
                        <div className="flex items-center justify-between">
                          <span>Total Value</span>
                          <span className="text-lg font-bold text-slate-900">$238K</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f97316]/10 text-[#f97316]">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">New partnership</p>
                    <p className="text-sm text-slate-600">Horizon Capital + FarmSense</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="mission" className="container-shell py-8 md:py-16">
          <div className="mb-8 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Mission</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
              Co-Build, Not Just Fund
            </h2>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {pillars.map((pillar) => (
              <article key={pillar.title} className="soft-card overflow-hidden">
                <div
                  className="h-52 w-full bg-cover bg-center"
                  style={{ backgroundImage: `url('${pillar.image}')` }}
                />
                <div className="space-y-3 p-6">
                  <h3 className="text-2xl font-extrabold tracking-tight text-slate-900">{pillar.title}</h3>
                  <p className="text-base leading-7 text-slate-600">{pillar.description}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="categories" className="container-shell py-16">
          <div className="mb-10 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Categories</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
              Innovation Categories
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
              Explore vetted projects across five fields of innovation — each with its own community board.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
            {categories.map((category) => {
              const Icon = categoryIconMap[category.name as keyof typeof categoryIconMap] ?? BriefcaseBusiness

              return (
                <article key={category.id} className="soft-card p-5">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl" style={{ backgroundColor: `${category.color}1A`, color: category.color }}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <h3 className="text-xl font-extrabold tracking-tight text-slate-900">{category.name}</h3>
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                      {category.project_count} projects
                    </span>
                  </div>
                  <p className="min-h-[100px] text-sm leading-6 text-slate-600">{category.description}</p>
                  <button
                    className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-900 hover:text-orange-600"
                    onClick={() => onNavigate('project-detail', category.id)}
                  >
                    Explore projects
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </article>
              )
            })}
          </div>

          <div className="mt-8 rounded-[28px] border border-slate-200 bg-[#111827] px-6 py-5 text-center text-white shadow-[0_18px_50px_rgba(17,24,39,0.18)]">
            Every project is vetted and co-managed by Bridge Group
          </div>
        </section>

        <section className="container-shell py-16">
          <div className="mb-10 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Financial structure</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
              A revenue-ready model built for trust, growth, and upside.
            </h2>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {financialHighlights.map((item) => (
              <div key={item.label} className="soft-card p-6">
                <p className="text-sm text-slate-500">{item.label}</p>
                <div className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900">{item.value}</div>
                <p className="mt-2 text-sm text-slate-600">{item.detail}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="how" className="container-shell py-16">
          <div className="mb-10 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">How Bridge Group Works</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
              A simple path from idea to impact — for innovators and investors alike.
            </h2>
          </div>

          <div className="grid gap-9 lg:grid-cols-2">
            <div className="soft-card p-7">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#f97316]/10 text-[#f97316]">
                  <BriefcaseBusiness className="h-5 w-5" />
                </div>
                <h3 className="text-2xl font-extrabold tracking-tight text-slate-900">For Innovators</h3>
              </div>

              <div className="space-y-5">
                {steps.map((item) => (
                  <div key={item.title} className="flex gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#f97316] text-sm font-bold text-white">
                      {item.accent}
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-slate-900">{item.title}</h4>
                      <p className="mt-1 text-sm leading-6 text-slate-600">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="soft-card p-7">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <h3 className="text-2xl font-extrabold tracking-tight text-slate-900">For Investors &amp; Experts</h3>
              </div>

              <div className="space-y-5">
                {investmentSteps.map((item) => (
                  <div key={item.title} className="flex gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white">
                      {item.accent}
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-slate-900">{item.title}</h4>
                      <p className="mt-1 text-sm leading-6 text-slate-600">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="container-shell pb-16">
          <InspirationalQuotes
            eyebrow="Ideas that move us"
            heading="A little wisdom for the work ahead"
            className="border-transparent bg-transparent p-0 shadow-none"
            quotes={[
              { person: 'Warren Buffett', title: 'Investor', quote: 'Someone’s sitting in the shade today because someone planted a tree a long time ago.', image: inspirationalPortraits.warrenBuffett },
              { person: 'Confucius', title: 'Wisdom teacher', quote: 'The superior man is modest in his speech, but exceeds in his actions.', image: inspirationalPortraits.confucius },
              { person: 'Mencius', title: 'Philosopher', quote: 'The great man is he who does not lose his childlike heart.', image: inspirationalPortraits.mencius },
            ]}
          />
        </section>

        <section className="container-shell py-16">
          <div className="mb-10 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Testimonials</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
              Founders and investors trust the Bridge Group model.
            </h2>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {testimonials.map((item) => (
              <article key={item.name} className="soft-card p-6">
                <div className="flex items-center gap-4">
                  <img src={item.image} alt={item.name} className="h-14 w-14 rounded-full object-cover" />
                  <div>
                    <h3 className="text-lg font-extrabold text-slate-900">{item.name}</h3>
                    <p className="text-sm text-slate-500">{item.role}</p>
                  </div>
                </div>
                <p className="mt-5 text-base leading-7 text-slate-600">“{item.quote}”</p>
              </article>
            ))}
          </div>
        </section>

        <section className="container-shell py-16">
          <div className="soft-card overflow-hidden bg-[#f9f5f1] p-8 md:p-12">
            <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Ready to build the future?</p>
                <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 md:text-5xl">
                  Whether you have an idea that needs wings or capital looking for impact — Bridge Group is your bridge.
                </h2>
              </div>

              <div className="flex flex-col gap-4 sm:flex-row lg:justify-end">
                <button className="brand-button-primary" onClick={() => onNavigate('auth')}>
                  Get Started Today
                  <ArrowRight className="h-4 w-4" />
                </button>
                <button className="brand-button-secondary" onClick={() => onNavigate('auth')}>Sign In</button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200/80 bg-[#f5efe9]">
        <div className="container-shell flex flex-col gap-6 py-8 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xl font-extrabold tracking-tight text-slate-900">Bridge Group</p>
            <p className="mt-1 text-sm text-slate-600">Connecting innovators with industry giants.</p>
          </div>

          <div className="flex flex-wrap items-center gap-5 text-sm text-slate-600">
            <a href="#mission" className="transition hover:text-slate-900">Mission</a>
            <a href="#categories" className="transition hover:text-slate-900">Categories</a>
            <a href="#how" className="transition hover:text-slate-900">How It Works</a>
          </div>

          <p className="text-sm text-slate-500">© 2026 Bridge Group.</p>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage
