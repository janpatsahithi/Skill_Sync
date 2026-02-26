import { Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import FloatingAI from './FloatingAI'
import Sidebar from './Sidebar'

const Layout = () => {
  const { user, logout } = useAuth()

  return (
    <div className="min-h-screen animate-fade-in" style={{ background: 'linear-gradient(135deg, #fdf2f8 0%, #fce7f3 50%, #fbcfe8 100%)' }}>
      <Sidebar user={user} onLogout={logout} />

      <main className="md:ml-72 p-4 md:p-8 animate-fade-in min-h-screen" style={{ background: 'linear-gradient(to bottom right, #FFF7F9, #FADADD)' }}>
        <Outlet />
      </main>

      <FloatingAI />
    </div>
  )
}

export default Layout
