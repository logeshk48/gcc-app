import { HashRouter as Router, Routes, Route, NavLink, useLocation } from 'react-router-dom'
import { LayoutDashboard, Users, Receipt, ShieldCheck } from 'lucide-react'
import './index.css'
import Dashboard from './pages/Dashboard/Dashboard'
import Members from './pages/Members/Members'
import Expenses from './pages/Expenses/Expenses'
import Admin from './pages/Admin/Admin'

function BottomNav() {
  const location = useLocation()
  const tabs = [
    { to: '/',         icon: LayoutDashboard, label: 'Home'     },
    { to: '/members',  icon: Users,           label: 'Squad'    },
    { to: '/expenses', icon: Receipt,         label: 'Expenses' },
    { to: '/admin',    icon: ShieldCheck,     label: 'Admin'    },
  ]
  return (
    <div style={{
      position: 'fixed', bottom: 20,
      left: '50%', transform: 'translateX(-50%)',
      width: 'calc(100% - 32px)', maxWidth: 398,
      background: 'rgba(9,13,15,0.92)',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 28, display: 'flex', zIndex: 100,
      padding: '8px 4px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
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
              padding: '8px 4px', textDecoration: 'none', gap: 4,
              borderRadius: 20,
              background: active ? 'rgba(34,197,94,0.1)' : 'transparent',
              transition: 'all 0.2s ease', margin: '0 2px',
            }}>
            <t.icon size={19} strokeWidth={active ? 2.5 : 1.8}
              color={active ? 'var(--green)' : 'var(--t3)'} />
            <span style={{
              fontSize: 10, fontWeight: active ? 700 : 400,
              color: active ? 'var(--green)' : 'var(--t3)',
              letterSpacing: 0.3,
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
      <div style={{ paddingBottom: 90 }}>
        <Routes>
          <Route path="/"         element={<Dashboard />} />
          <Route path="/members"  element={<Members />}   />
          <Route path="/expenses" element={<Expenses />}  />
          <Route path="/admin"    element={<Admin />}     />
        </Routes>
        <BottomNav />
      </div>
    </Router>
  )
}