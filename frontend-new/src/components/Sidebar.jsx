import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  FileText,
  BookOpen,
  Briefcase,
  Bot,
  Users,
  MessageSquare,
  User,
  Settings,
  Target,
  LogOut,
  Sparkles,
} from 'lucide-react'
import BrandLogo from './BrandLogo'

const sections = [
  {
    title: 'CORE',
    items: [
      { path: '/app/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { path: '/app/skills', label: 'Skills', icon: FileText },
      { path: '/app/job-recommendations', label: 'Job Recommendations', icon: Briefcase },
      { path: '/app/ai-advisor', label: 'AI Advisor', icon: Bot },
      { path: '/app/learning-path', label: 'Learning', icon: BookOpen },
    ],
  },
  {
    title: 'COLLABORATE',
    items: [
      { path: '/app/collaborate', label: 'Overview', icon: LayoutDashboard },
      { path: '/app/collaborate/projects', label: 'Projects', icon: FileText },
      { path: '/app/collaborate/opportunities', label: 'Opportunities', icon: Target },
      { path: '/app/collaborate/my-teams', label: 'My Teams', icon: Users },
      { path: '/app/community', label: 'Community', icon: MessageSquare },
    ],
  },
  {
    title: 'ACCOUNT',
    items: [
      { path: '/app/profile', label: 'Profile', icon: User },
      { path: '/app/settings', label: 'Settings', icon: Settings },
    ],
  },
]

const Sidebar = ({ user, onLogout }) => {
  const location = useLocation()

  return (
    <aside className="w-full md:fixed md:left-0 md:top-0 md:h-full md:w-72 border-b md:border-b-0 md:border-r border-primary/15 bg-[#FADADD]/95 backdrop-blur-sm shadow-lg md:shadow-xl flex flex-col">
      <div className="p-6 border-b border-primary/15">
        <BrandLogo
          to="/app/dashboard"
          showTagline
          textSize="text-3xl"
          iconSize="w-11 h-11"
          className="w-full"
        />
      </div>

      <nav className="px-4 py-4 space-y-5 flex-1 overflow-y-auto">
        {sections.map((section) => (
          <div key={section.title}>
            <p className="px-2 mb-2 text-[11px] font-semibold tracking-[0.12em] text-text-secondary/80 uppercase">
              {section.title}
            </p>
            <div className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon
                const isActive =
                  location.pathname === item.path ||
                  location.pathname.startsWith(`${item.path}/`)
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`group flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-white/70 text-text-primary shadow-sm border border-primary/20'
                        : 'text-text-secondary hover:bg-white/55 hover:text-text-primary hover:shadow-sm'
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 mr-3 transition-transform duration-200 ${
                        isActive ? 'text-primary' : 'text-text-secondary group-hover:text-primary group-hover:scale-105'
                      }`}
                    />
                    {item.label}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="w-full p-4 md:p-6 border-t border-primary/15 bg-white/35">
        <div className="mb-3">
          <p className="text-sm font-medium text-text-primary">{user?.name || 'User'}</p>
          <p className="text-xs text-text-secondary truncate">{user?.email || ''}</p>
        </div>
        <button
          onClick={onLogout}
          className="flex items-center justify-center w-full px-4 py-2 text-sm rounded-md border border-primary/20 text-text-secondary hover:text-text-primary hover:bg-white/70 transition-all duration-200"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
          <Sparkles className="w-3 h-3 ml-2 text-primary/80" />
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
