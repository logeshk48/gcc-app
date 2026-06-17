import { useEffect, useRef, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { LayoutDashboard, Users, Receipt, ShieldCheck } from 'lucide-react'

const tabs = [
  { to: '/',         icon: LayoutDashboard, label: 'Home'     },
  { to: '/members',  icon: Users,           label: 'Squad'    },
  { to: '/expenses', icon: Receipt,         label: 'Expenses' },
  { to: '/admin',    icon: ShieldCheck,     label: 'Admin'    },
]

export default function BottomNav() {
  const location = useLocation()
  const [activeIdx, setActiveIdx] = useState(0)
  const [indicatorStyle, setIndicatorStyle] = useState({})
  const tabRefs = useRef([])

  useEffect(() => {
    const idx = tabs.findIndex(t =>
      t.to === '/'
        ? location.pathname === '/'
        : location.pathname.startsWith(t.to)
    )
    setActiveIdx(idx === -1 ? 0 : idx)
  }, [location.pathname])

  useEffect(() => {
    const el = tabRefs.current[activeIdx]
    if (el) {
      setIndicatorStyle({
        left: el.offsetLeft + 4,
        width: el.offsetWidth - 8,
      })
    }
  }, [activeIdx])

  return (
    <div style={{
      position: 'fixed', bottom: 20,
      left: '50%', transform: 'translateX(-50%)',
      width: 'calc(100% - 32px)', maxWidth: 398,
      background: 'rgba(9,13,15,0.95)',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 28, display: 'flex',
      zIndex: 100, padding: '6px 4px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
    }}>

      {/* sliding green pill */}
      <div style={{
        position: 'absolute',
        top: 6, bottom: 6,
        borderRadius: 22,
        background: 'rgba(34,197,94,0.12)',
        border: '1px solid rgba(34,197,94,0.25)',
        boxShadow: '0 0 12px rgba(34,197,94,0.1)',
        transition: 'all 0.4s cubic-bezier(0.34,1.56,0.64,1)',
        pointerEvents: 'none',
        ...indicatorStyle,
      }} />

      {tabs.map((t, i) => {
        const isActive = i === activeIdx
        return (
          <NavLink
            key={t.to}
            to={t.to}
            end={t.to === '/'}
            ref={el => tabRefs.current[i] = el}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              padding: '6px 4px', textDecoration: 'none', gap: 3,
              borderRadius: 22, margin: '0 2px',
              position: 'relative', zIndex: 1,
            }}
            onClick={() => setActiveIdx(i)}
          >
            <div style={{
              transition: 'transform 0.4s cubic-bezier(0.34,1.56,0.64,1)',
              transform: isActive ? 'translateY(-2px) scale(1.15)' : 'translateY(0) scale(1)',
            }}>
              <t.icon
                size={18}
                strokeWidth={isActive ? 2.5 : 1.8}
                color={isActive ? '#22c55e' : '#3d4d3d'}
                style={{
                  transition: 'all 0.3s ease',
                  filter: isActive ? 'drop-shadow(0 0 5px rgba(34,197,94,0.6))' : 'none',
                  display: 'block',
                }}
              />
            </div>
            <span style={{
              fontSize: 9,
              fontWeight: isActive ? 700 : 500,
              color: isActive ? '#22c55e' : '#3d4d3d',
              letterSpacing: 0.3,
              transition: 'all 0.3s ease',
              transform: isActive ? 'scale(1.05)' : 'scale(1)',
              display: 'block',
            }}>
              {t.label}
            </span>
          </NavLink>
        )
      })}
    </div>
  )
}