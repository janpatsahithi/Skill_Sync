import { useEffect, useRef, useState } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import BrandLogo from './BrandLogo'

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const linkClass = ({ isActive }) =>
    isActive
      ? "text-primary font-semibold"
      : "text-muted-foreground hover:text-primary transition";

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const PublicNav = () => (
    <>
      <nav className="hidden md:flex items-center gap-8">
        <a href="#core-features" className="text-muted-foreground hover:text-primary transition">Features</a>
        <a href="#how-it-works" className="text-muted-foreground hover:text-primary transition">How It Works</a>
        <a href="#about" className="text-muted-foreground hover:text-primary transition">About</a>
      </nav>
      <div className="flex items-center gap-4">
        <Link to="/login" className="text-sm text-muted-foreground hover:text-primary">
          Login
        </Link>
        <Link
          to="/register"
          className="px-4 py-2 rounded-full text-white text-sm font-medium bg-gradient-to-r from-fuchsia-500 to-blue-500 hover:scale-105"
        >
          Get Started
        </Link>
      </div>
    </>
  );

  const AuthenticatedNav = () => (
    <>
      <nav className="hidden md:flex items-center gap-6">
        <NavLink to="/app/dashboard" className={linkClass}>Dashboard</NavLink>
        <NavLink to="/app/analysis/result" className={linkClass}>Analyze</NavLink>
        <NavLink to="/app/learning-path" className={linkClass}>Learning</NavLink>
        <NavLink to="/app/job-recommendations" className={linkClass}>Jobs</NavLink>
        <NavLink to="/app/ai-advisor" className={linkClass}>AI Coach</NavLink>
        <NavLink to="/app/collaborate" className={linkClass}>Collaborate</NavLink>
      </nav>

      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setProfileOpen((v) => !v)}
          className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-primary/5"
        >
          <span>{user?.name || "Profile"}</span>
          <ChevronDown className="h-4 w-4" />
        </button>
        {profileOpen && (
          <div className="absolute right-0 mt-2 w-44 rounded-xl border border-slate-200 bg-white shadow-lg">
            <Link
              to="/app/profile"
              className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
              onClick={() => setProfileOpen(false)}
            >
              Profile
            </Link>
            <Link
              to="/app/settings"
              className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
              onClick={() => setProfileOpen(false)}
            >
              Settings
            </Link>
            <button
              onClick={handleLogout}
              className="block w-full px-4 py-2 text-left text-sm text-rose-600 hover:bg-rose-50"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </>
  );

  return (
    <header className="fixed top-0 w-full z-50 border-b border-white/60 bg-white/80 backdrop-blur-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        
        {/* Logo */}
        <BrandLogo to="/" textSize="text-xl" iconSize="w-10 h-10" />

        {user ? <AuthenticatedNav /> : <PublicNav />}
      </div>
    </header>
  );
}


