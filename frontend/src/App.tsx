import { useState } from 'react'
import AdminDashboard from './pages/AdminDashboard'
import AdminReviewPage from './pages/AdminReviewPage'
import AuthPage from './pages/AuthPage'
import DepartmentReviewPage from './pages/DepartmentReviewPage'
import IdeaRequestPage from './pages/IdeaRequestPage'
import InnovatorDashboard from './pages/InnovatorDashboard'
import InvestorDashboard from './pages/InvestorDashboard'
import LandingPage from './pages/LandingPage'
import ProjectApprovalPage from './pages/ProjectApprovalPage'
import ProjectDetail from './pages/ProjectDetail'
import { projects } from './data/mockData'

export type AppPage = 'landing' | 'investor' | 'innovator' | 'admin' | 'admin-review' | 'idea-request' | 'department-review' | 'auth' | 'project-detail' | 'project-approval'
export type AppNavigationHandler = (page: AppPage, projectId?: string) => void

function App() {
  const [page, setPage] = useState<AppPage>('landing')
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(projects[0]?.id ?? null)

  const handleNavigate: AppNavigationHandler = (nextPage, projectId) => {
    if (projectId) {
      setSelectedProjectId(projectId)
    }
    setPage(nextPage)
  }

  if (page === 'investor') {
    return <InvestorDashboard onNavigate={handleNavigate} />
  }

  if (page === 'innovator') {
    return <InnovatorDashboard onNavigate={handleNavigate} />
  }

  if (page === 'idea-request') {
    return <IdeaRequestPage onNavigate={handleNavigate} />
  }

  if (page === 'admin') {
    return <AdminDashboard onNavigate={handleNavigate} />
  }

  if (page === 'admin-review') {
    return <AdminReviewPage onNavigate={handleNavigate} />
  }

  if (page === 'department-review') {
    return <DepartmentReviewPage onNavigate={handleNavigate} ideaId={selectedProjectId ?? projects[0]?.id ?? 'idea-1'} />
  }

  if (page === 'project-approval') {
    return <ProjectApprovalPage onNavigate={handleNavigate} ideaId={selectedProjectId ?? projects[0]?.id ?? 'idea-1'} />
  }

  if (page === 'auth') {
    return <AuthPage onNavigate={handleNavigate} />
  }

  if (page === 'project-detail') {
    return <ProjectDetail projectId={selectedProjectId ?? projects[0].id} onNavigate={handleNavigate} />
  }

  return <LandingPage onNavigate={handleNavigate} />
}

export default App
