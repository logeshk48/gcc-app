import { HashRouter as Router, Routes, Route, NavLink, useLocation } from 'react-router-dom'
import { LayoutDashboard, Users, Receipt, ShieldCheck } from 'lucide-react'
import './index.css'
import Dashboard from './pages/Dashboard'
import Members from './pages/Members'
import Expenses from './pages/Expenses'
import Admin from './pages/Admin'

function BottomNav() {
  const location = useLocation()
  const tabs = [
    { to: '/', icon: LayoutDashboard, label: 'Home' },
    { to: '/members', icon: Users, label: 'Squad' },
    { to: '/expenses', icon: Receipt, label: 'Expenses' },
    { to: '/admin', icon: ShieldCheck, label: 'Admin' },
  ]
  return (
    <div style={{
      position: 'fixed', bottom: 0,
      left: '50%', transform: 'translateX(-50%)',
      width: '100%', maxWidth: 430,
      background: 'rgba(6,10,6,0.95)',
      backdropFilter: 'blur(20px)',
      borderTop: '1px solid rgba(34,197,94,0.1)',
      display: 'flex', zIndex: 100,
      paddingBottom: 'env(safe-area-inset-bottom)'
    }}>
      {tabs.map(t => {
        const active = t.to === '/'
          ? location.pathname === '/'
          : location.pathname.startsWith(t.to)
        return (
          <NavLink key={t.to} to={t.to} end={t.to === '/'}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              padding: '10px 0 14px', textDecoration: 'none',
              gap: 4, position: 'relative'
            }}>
            {active && (
              <div style={{
                position: 'absolute', top: 0, left: '50%',
                transform: 'translateX(-50%)',
                width: 32, height: 2,
                background: 'var(--green)',
                borderRadius: '0 0 4px 4px',
                boxShadow: '0 0 8px var(--green)'
              }} />
            )}
            <t.icon
              size={20} strokeWidth={active ? 2.5 : 1.8}
              color={active ? 'var(--green)' : 'var(--t3)'}
            />
            <span style={{
              fontSize: 10, fontWeight: active ? 700 : 400,
              color: active ? 'var(--green)' : 'var(--t3)',
              letterSpacing: 0.3
            }}>{t.label}</span>
          </NavLink>
        )
      })}
    </div>
  )
}

export default function App() {
  return (
    <Router>
      <div style={{ paddingBottom: 72 }}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/members" element={<Members />} />
          <Route path="/expenses" element={<Expenses />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
        <BottomNav />
      </div>
    </Router>
  )
}