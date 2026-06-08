import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom'
import { LayoutDashboard, Users, Receipt, Shield } from 'lucide-react'
import './index.css'

// Pages (we'll build these next)
import Dashboard from './pages/Dashboard'
import Members from './pages/Members'
import Expenses from './pages/Expenses'
import Admin from './pages/Admin'

function App() {
  return (
    <Router>
      <div style={{ paddingBottom: 80 }}>

        {/* Header */}
        <div style={{
          background: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--border)',
          padding: '16px 20px',
          position: 'sticky',
          top: 0,
          zIndex: 50
        }}>
          <h1 style={{ color: 'var(--accent-gold)', fontSize: 18, fontWeight: 700 }}>
            🏏 Golden Cricket Club
          </h1>
        </div>

        {/* Pages */}
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/members" element={<Members />} />
          <Route path="/expenses" element={<Expenses />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>

        {/* Bottom Nav */}
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          maxWidth: 480,
          background: 'var(--bg-secondary)',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          zIndex: 50
        }}>
          {[
            { to: '/', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
            { to: '/members', icon: <Users size={20} />, label: 'Members' },
            { to: '/expenses', icon: <Receipt size={20} />, label: 'Expenses' },
            { to: '/admin', icon: <Shield size={20} />, label: 'Admin' },
          ].map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end
              style={({ isActive }) => ({
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '10px 0 14px',
                textDecoration: 'none',
                color: isActive ? 'var(--accent-gold)' : 'var(--text-muted)',
                gap: 4,
                fontSize: 10,
                fontWeight: isActive ? 700 : 400,
                transition: 'color 0.2s'
              })}
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </div>

      </div>
    </Router>
  )
}

export default App