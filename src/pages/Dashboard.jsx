import { useApp } from '../context/AppContext'
import { useEffect, useState, useRef } from 'react'
import { TrendingUp, TrendingDown, Users, Wallet } from 'lucide-react'

// count-up hook
function useCountUp(target, duration = 1200) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (!target) return
    let start = 0
    const step = target / (duration / 16)
    const timer = setInterval(() => {
      start += step
      if (start >= target) { setVal(target); clearInterval(timer) }
      else setVal(Math.floor(start))
    }, 16)
    return () => clearInterval(timer)
  }, [target])
  return val
}

// mini bar chart
function BarChart({ collection, expenses, months }) {
  const max = Math.max(...collection, ...expenses, 1)
  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 80 }}>
        {months.map((m, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <div style={{ width: '100%', display: 'flex', gap: 1, alignItems: 'flex-end', height: 64 }}>
              <div style={{
                flex: 1, borderRadius: '3px 3px 0 0',
                background: collection[i] > 0 ? '#22c55e' : 'rgba(255,255,255,0.05)',
                height: `${(collection[i] / max) * 100}%`,
                minHeight: collection[i] > 0 ? 4 : 0,
                transition: 'height 0.8s ease'
              }} />
              <div style={{
                flex: 1, borderRadius: '3px 3px 0 0',
                background: expenses[i] > 0 ? '#ef4444' : 'rgba(255,255,255,0.05)',
                height: `${(expenses[i] / max) * 100}%`,
                minHeight: expenses[i] > 0 ? 4 : 0,
                transition: 'height 0.8s ease'
              }} />
            </div>
            <span style={{ fontSize: 8, color: 'var(--text-muted)' }}>{m}</span>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-secondary)' }}>
          <div style={{ width: 8, height: 8, borderRadius: 2, background: '#22c55e' }} /> Collection
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-secondary)' }}>
          <div style={{ width: 8, height: 8, borderRadius: 2, background: '#ef4444' }} /> Expenses
        </div>
      </div>
    </div>
  )
}

// skeleton loader
function Skeleton({ width = '100%', height = 20, radius = 8 }) {
  return (
    <div style={{
      width, height,
      borderRadius: radius,
      background: 'linear-gradient(90deg, rgba(255,255,255,0.05) 25%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.05) 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.5s infinite'
    }} />
  )
}

export default function Dashboard() {
  const { currentBalance, monthlyCollection, monthlyExpenses, members, loading, MONTHS } = useApp()
  const balance = useCountUp(loading ? 0 : currentBalance)
  const totalCol = monthlyCollection.reduce((a, b) => a + b, 0)
  const totalExp = monthlyExpenses.reduce((a, b) => a + b, 0)
  const activeMembers = members.filter(m => m.paid.some(p => p > 0)).length
  const colCount = useCountUp(loading ? 0 : totalCol)
  const expCount = useCountUp(loading ? 0 : totalExp)

  // pending dues
  const curMonth = new Date().getMonth()
  const pending = members.filter(m => {
    const paid = m.paid.filter(v => v > 0).length
    return paid < curMonth + 1 && paid > 0
  }).length

  return (
    <div style={{ padding: '16px 16px 20px' }}>

      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0 }
          100% { background-position: 200% 0 }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px) }
          to { opacity: 1; transform: translateY(0) }
        }
      `}</style>

      {/* Hero Balance Card */}
      <div style={{
        background: 'linear-gradient(135deg, #0d2b1a 0%, #0a1f14 100%)',
        border: '1px solid rgba(34,197,94,0.2)',
        borderRadius: 24,
        padding: '28px 24px',
        marginBottom: 16,
        animation: 'fadeUp 0.5s ease',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* glow */}
        <div style={{
          position: 'absolute', top: -40, right: -40,
          width: 150, height: 150, borderRadius: '50%',
          background: 'rgba(34,197,94,0.08)', pointerEvents: 'none'
        }} />
        <div style={{ fontSize: 12, color: 'rgba(34,197,94,0.7)', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>
          Current Balance
        </div>
        {loading ? <Skeleton height={48} width={200} radius={12} /> : (
          <div style={{ fontSize: 44, fontWeight: 800, color: '#fff', letterSpacing: -1, lineHeight: 1 }}>
            ₹{balance.toLocaleString()}
          </div>
        )}
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 8 }}>
          Includes ₹3,950 carry-over from 2025
        </div>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16, animation: 'fadeUp 0.5s ease 0.1s both' }}>
        {[
          { label: 'Collected', value: `₹${colCount.toLocaleString()}`, icon: <TrendingUp size={16} />, color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
          { label: 'Expenses', value: `₹${expCount.toLocaleString()}`, icon: <TrendingDown size={16} />, color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
          { label: 'Members', value: activeMembers, icon: <Users size={16} />, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
          { label: 'Pending dues', value: pending, icon: <Wallet size={16} />, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
        ].map((s, i) => (
          <div key={i} style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 16,
            padding: '14px 16px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <div style={{ background: s.bg, color: s.color, borderRadius: 8, padding: 6, display: 'flex' }}>
                {s.icon}
              </div>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.label}</span>
            </div>
            {loading ? <Skeleton height={24} width={80} /> : (
              <div style={{ fontSize: 22, fontWeight: 700, color: '#fff' }}>{s.value}</div>
            )}
          </div>
        ))}
      </div>

      {/* Chart */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 20,
        padding: '16px',
        marginBottom: 16,
        animation: 'fadeUp 0.5s ease 0.2s both'
      }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
          Monthly Overview
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Collection vs Expenses 2026</div>
        {loading ? <Skeleton height={80} radius={12} style={{ marginTop: 12 }} /> : (
          <BarChart collection={monthlyCollection} expenses={monthlyExpenses} months={MONTHS} />
        )}
      </div>

      {/* Recent months summary */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 20,
        padding: '16px',
        animation: 'fadeUp 0.5s ease 0.3s both'
      }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12 }}>
          Month Summary
        </div>
        {MONTHS.map((m, i) => {
          const col = monthlyCollection[i]
          const exp = monthlyExpenses[i]
          if (col === 0 && exp === 0) return null
          const net = col - exp
          return (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 0',
              borderBottom: '1px solid var(--border)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: 'rgba(255,255,255,0.05)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)'
                }}>{m}</div>
                <div>
                  <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>
                    ₹{col.toLocaleString()} collected
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    ₹{exp.toLocaleString()} spent
                  </div>
                </div>
              </div>
              <div style={{
                fontSize: 13, fontWeight: 700,
                color: net >= 0 ? '#22c55e' : '#ef4444'
              }}>
                {net >= 0 ? '+' : ''}₹{net.toLocaleString()}
              </div>
            </div>
          )
        })}
      </div>

    </div>
  )
}