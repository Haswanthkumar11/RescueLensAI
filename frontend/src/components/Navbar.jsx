import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Radar, Menu, X, User, LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { PERMISSIONS, hasPermission } from '../constants/permissions'

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { isAuthenticated, role, signOut } = useAuth()
  const navigate = useNavigate()

  const navLinks = [
    { to: '/about', label: 'About', public: true },
    { to: '/upload', label: 'Analyze', permission: PERMISSIONS.CAN_ANALYZE },
    { to: '/history', label: role === 'viewer' ? 'My History' : 'Dashboard', permission: PERMISSIONS.CAN_VIEW_HISTORY },
    { to: '/responder-dashboard', label: 'Responder', permission: PERMISSIONS.CAN_VIEW_RESPONDER_DASHBOARD },
    { to: '/incident-management', label: 'Dispatches', permission: PERMISSIONS.CAN_MANAGE_INCIDENTS },
    { to: '/user-management', label: 'Users', permission: PERMISSIONS.CAN_MANAGE_USERS },
    { to: '/system-settings', label: 'Settings', permission: PERMISSIONS.CAN_VIEW_SETTINGS },
  ]

  const visibleLinks = navLinks.filter((link) => {
    if (link.public) return true
    if (!isAuthenticated) return false
    return hasPermission(role, link.permission)
  })

  const handleLogout = async () => {
    setMenuOpen(false)
    await signOut()
    navigate('/')
  }

  return (
    <header className="sticky top-0 z-50 border-b border-navy-border bg-navy/80 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2 font-display text-lg font-semibold" onClick={() => setMenuOpen(false)}>
          <span className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-alert-red/15 text-alert-red">
            <Radar size={18} strokeWidth={2.2} />
            <span className="absolute inset-0 rounded-lg ring-1 ring-alert-red/30 animate-pulseGlow" />
          </span>
          RescueLens <span className="text-scan-cyan">AI</span>
        </Link>

        <div className="hidden items-center gap-1 sm:flex">
          {visibleLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `rounded-lg px-4 py-2 font-mono text-sm uppercase tracking-wide transition ${
                  isActive ? 'bg-navy-light text-scan-cyan' : 'text-paper/70 hover:bg-navy-light hover:text-paper'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </div>

        <div className="hidden items-center gap-2 sm:flex">
          {isAuthenticated ? (
            <>
              <Link to="/profile" className="btn-secondary !py-2 !px-4 text-sm">
                <User size={16} /> Profile
              </Link>
              <button type="button" onClick={handleLogout} className="btn-primary !py-2 !px-4 text-sm">
                <LogOut size={16} /> Logout
              </button>
            </>
          ) : (
            <Link to="/login" className="btn-primary !py-2 !px-4 text-sm">
              Log in
            </Link>
          )}
        </div>

        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-paper/80 hover:bg-navy-light sm:hidden"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {menuOpen && (
        <div className="border-t border-navy-border px-6 py-4 sm:hidden">
          <div className="flex flex-col gap-1">
            {visibleLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `rounded-lg px-4 py-3 font-mono text-sm uppercase tracking-wide transition ${
                    isActive ? 'bg-navy-light text-scan-cyan' : 'text-paper/70 hover:bg-navy-light hover:text-paper'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}

            {isAuthenticated ? (
              <>
                <Link
                  to="/profile"
                  onClick={() => setMenuOpen(false)}
                  className="btn-secondary mt-3 w-full justify-center !py-2.5 text-sm"
                >
                  <User size={16} /> Profile
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="btn-primary mt-2 w-full justify-center !py-2.5 text-sm"
                >
                  <LogOut size={16} /> Logout
                </button>
              </>
            ) : (
              <Link
                to="/login"
                onClick={() => setMenuOpen(false)}
                className="btn-primary mt-3 w-full justify-center !py-2.5 text-sm"
              >
                Log in
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
