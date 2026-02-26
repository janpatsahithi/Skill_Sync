import { NavLink, Link } from "react-router-dom";
import BrandLogo from './BrandLogo'

export default function Navbar() {
  const linkClass = ({ isActive }) =>
    isActive
      ? "text-primary font-semibold"
      : "text-muted-foreground hover:text-primary transition";

  return (
    <header className="fixed top-0 w-full z-50 border-b border-white/60 bg-white/80 backdrop-blur-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        
        {/* Logo */}
        <BrandLogo to="/" textSize="text-xl" iconSize="w-10 h-10" />

        {/* Nav */}
        <nav className="hidden md:flex items-center gap-6">
          <NavLink to="/" className={linkClass}>About</NavLink>
          <NavLink to="/app/dashboard" className={linkClass}>Dashboard</NavLink>
          <NavLink to="/app/learning-path" className={linkClass}>Learning</NavLink>
          <NavLink to="/app/job-recommendations" className={linkClass}>Jobs</NavLink>
          <NavLink to="/app/ai-advisor" className={linkClass}>AI Coach</NavLink>
          <NavLink to="/register" className={linkClass}>Sign Up</NavLink>
        </nav>

        {/* Auth */}
        <div className="flex items-center gap-4">
          <Link to="/login" className="text-sm text-muted-foreground hover:text-primary">
            Login
          </Link>
          <Link
            to="/register"
            className="px-4 py-2 rounded-full gradient-primary text-white text-sm font-medium"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </header>
  );
}


