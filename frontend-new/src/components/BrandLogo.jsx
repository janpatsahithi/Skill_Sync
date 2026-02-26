import { Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'

const BrandLogo = ({
  to = '/',
  showTagline = false,
  textSize = 'text-2xl',
  iconSize = 'w-10 h-10',
  className = '',
  textClassName = '',
}) => {
  return (
    <Link to={to} className={`inline-flex items-center gap-3 ${className}`}>
      <div
        className={`relative ${iconSize} rounded-xl flex items-center justify-center text-white shadow-md`}
        style={{ background: 'linear-gradient(135deg, #EC4899 0%, #3B82F6 100%)' }}
      >
        <span className="text-sm font-extrabold tracking-tight">SS</span>
        <Sparkles className="absolute -top-1 -right-1 w-3 h-3 text-pink-200" />
      </div>
      <div>
        <p className={`font-extrabold leading-none bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent ${textSize} ${textClassName}`}>
          SkillSync
        </p>
        {showTagline && <p className="text-xs text-slate-600 mt-1">Intelligent Support Platform</p>}
      </div>
    </Link>
  )
}

export default BrandLogo
