import { HashRouter as Router, Routes, Route, NavLink, useLocation } from 'react-router-dom'
import { LayoutDashboard, Users, Receipt, ShieldCheck } from 'lucide-react'
import { useApp } from './context/AppContext'
import { useState } from 'react'
import './index.css'
import Dashboard from './pages/Dashboard/Dashboard'
import Members from './pages/Members/Members'
import Expenses from './pages/Expenses/Expenses'
import Admin from './pages/Admin/Admin'

function SecretReset() {
  const { resetData } = useApp()
  const [taps, setTaps] = useState(0)
  const [visible, setVisible] = useState(false)
  const [confirmed, setConfirmed] = useState(false)

  const handleTap = () => {
    const next = taps + 1
    setTaps(next)
    if (next >= 5) {
      setVisible(true)
      setTaps(0)
    }
  }

  const handleReset = async () => {
    if (!confirmed) {
      setConfirmed(true)
      return
    }
    await resetData()
    setVisible(false)
    setConfirmed(false)
  }

  return (
    <>
      {/* invisible tap zone on title */}
      <div
        onClick={handleTap}
        style={{
          position: 'fixed', top: 0, left: 0,
          width: 60, height: 60, zIndex: 9999,
          cursor: 'default'
        }}
      />

      {/* reset modal */}
      {visible && (
        <>
          <div
            onClick={() => { setVisible(false); setConfirmed(false) }}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(0,0,0,0.7)',
              zIndex: 10000,
              backdropFilter: 'blur(4px)'
            }}
          />
          <div style={{
            position: 'fixed',
            top: '50%', left: '50%',
            transform: 'translate(-50%,-50%)',
            background: '#0f160f',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 20,
            padding: '24px 20px',
            width: 300,
            zIndex: 10001,
            textAlign: 'center'
          }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', marginBottom: 8 }}>
              Reset All Data?
            </div>
            <div style={{ fontSize: 13, color: 'var(--t2)', marginBottom: 20 }}>
              This will permanently delete all members, payments and expenses from Firebase.
            </div>
            {confirmed && (
              <div style={{ fontSize: 12, color: 'var(--red)', marginBottom: 12, fontWeight: 600 }}>
                Tap again to confirm — this cannot be undone!
              </div>
            )}
            <button
              onClick={handleReset}
              style={{
                width: '100%', padding: '13px',
                background: confirmed ? 'var(--red)' : 'rgba(239,68,68,0.15)',
                color: confirmed ? '#fff' : 'var(--red)',
                border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: 14, fontSize: 14,
                fontWeight: 800, cursor: 'pointer',
                marginBottom: 8, transition: 'all 0.2s'
              }}>
              {confirmed ? 'Yes, Delete Everything' : 'Reset Data'}
            </button>
            <button
              onClick={() => { setVisible(false); setConfirmed(false) }}
              style={{
                width: '100%', padding: '13px',
                background: 'rgba(255,255,255,0.05)',
                color: 'var(--t2)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 14, fontSize: 14,
                fontWeight: 700, cursor: 'pointer'
              }}>
              Cancel
            </button>
          </div>
        </>
      )}
    </>
  )
}

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
        <SecretReset />
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