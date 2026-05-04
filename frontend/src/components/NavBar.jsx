import { Link, useLocation } from 'react-router-dom'
import { Eye, BarChart3, Zap } from 'lucide-react'

export default function NavBar() {
  const location = useLocation()

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-4 glass border-b border-white/5">
      <Link to="/" className="flex items-center gap-2 group">
        <div className="w-8 h-8 rounded-lg bg-gold flex items-center justify-center group-hover:glow-gold transition-all">
          <Eye size={16} className="text-navy font-bold" />
        </div>
        <span className="text-white font-bold text-lg tracking-tight">
          Kirana<span className="text-gradient">Lens</span>
        </span>
        <span className="text-xs text-white/30 font-mono ml-1 hidden sm:block">v1.0</span>
      </Link>

      <div className="flex items-center gap-6">
        <Link
          to="/assess"
          className={`text-sm font-medium transition-colors ${
            location.pathname === '/assess' ? 'text-gold' : 'text-white/60 hover:text-white'
          }`}
        >
          New Assessment
        </Link>
        <div className="flex items-center gap-2 text-xs text-white/30 font-mono">
          <div className="w-1.5 h-1.5 rounded-full bg-risk-low animate-pulse" />
          System Online
        </div>
        <Link
          to="/assess"
          className="flex items-center gap-2 px-4 py-2 bg-gold hover:bg-gold-light text-navy text-sm font-bold rounded-lg transition-all hover:glow-gold"
        >
          <Zap size={14} />
          Assess Store
        </Link>
      </div>
    </nav>
  )
}
