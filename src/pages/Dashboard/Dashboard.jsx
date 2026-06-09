import { useApp } from '../../context/AppContext'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  TrendingUp, TrendingDown, Target,
  Calendar, BarChart2, Trophy,
  AlertTriangle, Zap, ChevronRight
} from 'lucide-react'
import './Dashboard.css'

function useCountUp(target, duration = 1600) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (!target) return
    let start = 0
    const step = target / (duration / 16)
    const t = setInterval(() => {
      start += step
      if (start >= target) { setVal(target); clearInterval(t) }
      else setVal(Math.floor(start))
    }, 16)
    return () => clearInterval(t)
  }, [target])
  return val
}

function SVGBarChart({ data }) {
  const W = 360, H = 120, pL = 4, pR = 4, pT = 8, pB = 22
  const cW = W - pL - pR, cH = H - pT - pB
  const max = Math.max(...data.flatMap(d => [d.col, d.exp]), 1)
  const slotW = cW / data.length
  const bW = slotW * 0.28
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', display: 'block' }}>
      {[0.5, 1].map(p => (
        <line key={p} x1={pL} y1={pT + cH*(1-p)} x2={W-pR} y2={pT + cH*(1-p)}
          stroke="rgba(255,255,255,0.04)" strokeWidth={1} />
      ))}
      {data.map((d, i) => {
        const cx = pL + i * slotW + slotW / 2
        const colH = Math.max((d.col / max) * cH, d.col > 0 ? 3 : 0)
        const expH = Math.max((d.exp / max) * cH, d.exp > 0 ? 3 : 0)
        return (
          <g key={i}>
            <rect x={cx-bW-1} y={pT+cH-colH} width={bW} height={colH} rx={3} fill="#22c55e" opacity={0.9} />
            <rect x={cx+1} y={pT+cH-expH} width={bW} height={expH} rx={3} fill="#ef4444" opacity={0.8} />
            <text x={cx} y={H-5} textAnchor="middle" fontSize={8.5} fill="#3d4d3d" fontWeight="600">{d.month}</text>
          </g>
        )
      })}
    </svg>
  )
}

const EXP_COLORS = {
  'Bat repair': '#f59e0b', 'Ball box': '#3b82f6',
  'New gloves': '#8b5cf6', 'New pad': '#06b6d4',
  'New bat': '#ec4899', 'Helmet': '#f97316', 'Other': '#6b7280'
}

export default function Dashboard() {
  const { currentBalance, monthlyCollection, monthlyExpenses, members, expenses, loading, MONTHS } = useApp()
  const navigate = useNavigate()

  const totalCol = monthlyCollection.reduce((a, b) => a + b, 0)
  const totalExp = monthlyExpenses.reduce((a, b) => a + b, 0)
  const activeMembers = members.filter(m => m.paid.some(p => p > 0)).length
  const curMonth = new Date().getMonth()

  const pendingMembers = members.filter(m => {
    const paid = m.paid.filter(v => v > 0).length
    return paid < curMonth + 1 && paid > 0
  }).slice(0, 3)

  const topContributors = [...members]
    .map(m => ({ name: m.name, total: m.paid.reduce((s, v) => s + v, 0) }))
    .filter(m => m.total > 0)
    .sort((a, b) => b.total - a.total)
    .slice(0, 3)

  const recentExpenses = []
  for (let mi = curMonth; mi >= 0 && recentExpenses.length < 5; mi--) {
    Object.entries(expenses).forEach(([cat, vals]) => {
      if (vals[mi] > 0 && recentExpenses.length < 5)
        recentExpenses.push({ cat, amount: vals[mi], month: MONTHS[mi] })
    })
  }

  const targetPerMonth = members.length * 100
  const avgMonthlyCol = totalCol / (monthlyCollection.filter(v => v > 0).length || 1)
  const monthsLeft = 12 - curMonth - 1
  const colPct = Math.min(Math.round((totalCol / (targetPerMonth * 12)) * 100), 100)

  const bal = useCountUp(loading ? 0 : currentBalance)
  const col = useCountUp(loading ? 0 : totalCol)
  const exp = useCountUp(loading ? 0 : totalExp)

  const chartData = MONTHS.map((m, i) => ({
    month: m, col: monthlyCollection[i],
    exp: monthlyExpenses[i],
    net: monthlyCollection[i] - monthlyExpenses[i]
  })).filter(d => d.col > 0 || d.exp > 0)

  const medals = ['#fbbf24', '#94a3b8', '#b45309']

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', paddingBottom: 40 }}>

      {/* ── HERO ── */}
      <div className="dash-hero">
        <div className="dash-hero-bg" />
        <div className="dash-hero-label">Club Balance · 2026</div>
        {loading
          ? <div style={{ height: 64, width: 200, borderRadius: 12, background: 'rgba(34,197,94,0.06)', animation: 'shimmer 1.8s infinite' }} />
          : <div className="dash-hero-balance">₹{bal.toLocaleString()}</div>
        }
        <div className="dash-hero-live">
          <div className="dash-hero-dot" />
          <span style={{ fontSize: 12, color: 'var(--t2)' }}>Live · Updated just now</span>
        </div>
        <div className="dash-hero-stats">
          {[
            { label: 'Carry-over', val: '₹3,950', color: 'var(--t1)' },
            { label: '2026 Net', val: `${totalCol-totalExp>=0?'+':''}₹${(totalCol-totalExp).toLocaleString()}`, color: totalCol-totalExp>=0?'var(--green)':'var(--red)' },
            { label: 'Players', val: activeMembers, color: 'var(--t1)' },
            { label: 'Dues', val: pendingMembers.length, color: pendingMembers.length>0?'var(--amber)':'var(--green)' },
          ].map((s, i, arr) => (
            <div key={i} className="dash-hero-stat" style={{
              paddingRight: i < arr.length-1 ? 10 : 0,
              marginRight: i < arr.length-1 ? 10 : 0,
              borderRight: i < arr.length-1 ? '1px solid rgba(255,255,255,0.06)' : 'none'
            }}>
              <div className="dash-hero-stat-label">{s.label}</div>
              <div className="dash-hero-stat-val" style={{ color: s.color }}>{s.val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── SEASON PROGRESS ── */}
      <div className="dash-section">
        <div className="dash-section-header">
          <div className="dash-section-left">
            <div className="dash-section-label">Season Progress</div>
            <div className="dash-section-title">2026 at a Glance</div>
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: 'var(--t2)', fontWeight: 600 }}>Collection Target</span>
            <span style={{ fontSize: 12, color: 'var(--green)', fontWeight: 700 }}>{colPct}%</span>
          </div>
          <div className="dash-progress-bar-bg">
            <div className="dash-progress-bar-fill" style={{ width: `${colPct}%` }} />
          </div>
          <div style={{ fontSize: 10, color: 'var(--t3)', marginTop: 4 }}>
            ₹{totalCol.toLocaleString()} of ₹{(targetPerMonth * 12).toLocaleString()} annual target
          </div>
        </div>

        <div className="dash-stat-row">
          {[
            { icon: Target, label: 'Avg/Month', val: `₹${Math.round(avgMonthlyCol).toLocaleString()}`, color: 'var(--green)' },
            { icon: Calendar, label: 'Months Left', val: monthsLeft, color: 'var(--amber)' },
            { icon: BarChart2, label: 'Peak Month', val: MONTHS[monthlyCollection.indexOf(Math.max(...monthlyCollection))], color: 'var(--blue)' },
          ].map((s, i) => (
            <div key={i} className="dash-stat-item">
              <div className="dash-stat-icon-row">
                <s.icon size={12} color={s.color} strokeWidth={2.5} />
                <span className="dash-stat-icon-label">{s.label}</span>
              </div>
              <div className="dash-stat-value" style={{ color: s.color }}>{s.val}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="dash-divider" />

      {/* ── FINANCE OVERVIEW ── */}
      <div className="dash-section">
        <div className="dash-section-header">
          <div className="dash-section-left">
            <div className="dash-section-label">Finance</div>
            <div className="dash-section-title">Collection vs Expenses</div>
          </div>
        </div>

        <div className="dash-finance-row">
          <div className="dash-finance-col">
            <div className="dash-finance-label">
              <TrendingUp size={13} color="#22c55e" strokeWidth={2.5} />
              <span className="dash-finance-label-text">Collected</span>
            </div>
            <div className="dash-finance-value" style={{ color: 'var(--green)' }}>₹{col.toLocaleString()}</div>
          </div>
          <div className="dash-finance-col">
            <div className="dash-finance-label">
              <TrendingDown size={13} color="#ef4444" strokeWidth={2.5} />
              <span className="dash-finance-label-text">Expenses</span>
            </div>
            <div className="dash-finance-value" style={{ color: 'var(--red)' }}>₹{exp.toLocaleString()}</div>
          </div>
        </div>

        {loading
          ? <div style={{ height: 120, borderRadius: 8, background: 'rgba(255,255,255,0.03)', animation: 'shimmer 1.8s infinite' }} />
          : <SVGBarChart data={chartData} />
        }
        <div style={{ display: 'flex', gap: 16, marginTop: 6 }}>
          {[['#22c55e','Collection'],['#ef4444','Expenses']].map(([c,l]) => (
            <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 6, height: 6, borderRadius: 2, background: c }} />
              <span style={{ fontSize: 10, color: 'var(--t2)', fontWeight: 500 }}>{l}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="dash-divider" />

      {/* ── TOP CONTRIBUTORS ── */}
      <div className="dash-section">
        <div className="dash-section-header">
          <div className="dash-section-left">
            <div className="dash-section-label">Squad</div>
            <div className="dash-section-title">Top Contributors</div>
          </div>
          <button className="dash-see-all" onClick={() => navigate('/members')}>
            See all <ChevronRight size={12} />
          </button>
        </div>

        {topContributors.map((m, i) => {
          const pct = Math.round((m.total / topContributors[0].total) * 100)
          return (
            <div key={i} className="dash-contributor-row">
              <div className="dash-contributor-top">
                <div className="dash-contributor-left">
                  <div className="dash-contributor-medal" style={{ background: `${medals[i]}18`, border: `1px solid ${medals[i]}35` }}>
                    <Trophy size={13} color={medals[i]} strokeWidth={2.5} />
                  </div>
                  <span className="dash-contributor-name">{m.name}</span>
                </div>
                <span className="dash-contributor-amount" style={{ color: medals[i] }}>₹{m.total.toLocaleString()}</span>
              </div>
              <div className="dash-bar">
                <div className="dash-bar-fill" style={{ width: `${pct}%`, background: medals[i] }} />
              </div>
            </div>
          )
        })}
      </div>

      <div className="dash-divider" />

      {/* ── PENDING DUES ── */}
      {pendingMembers.length > 0 && (
        <>
          <div className="dash-section">
            <div className="dash-section-header">
              <div className="dash-section-left">
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                  <AlertTriangle size={13} color="var(--amber)" strokeWidth={2.5} />
                  <div className="dash-section-label" style={{ marginBottom: 0 }}>Dues Pending</div>
                </div>
                <div className="dash-section-title">Members Behind</div>
              </div>
              <button className="dash-see-all" onClick={() => navigate('/members')}>
                See all <ChevronRight size={12} />
              </button>
            </div>

            {pendingMembers.map((m, i) => {
              const paid = m.paid.filter(v => v > 0).length
              const behind = curMonth + 1 - paid
              return (
                <div key={i} className="dash-due-row">
                  <div className="dash-due-avatar">{m.name.charAt(0)}</div>
                  <div>
                    <div className="dash-due-name">{m.name}</div>
                    <div className="dash-due-sub">{behind} month{behind > 1 ? 's' : ''} behind · ₹{behind * 100} due</div>
                  </div>
                  <div className="dash-due-right">{paid}/{curMonth+1} paid</div>
                </div>
              )
            })}
          </div>
          <div className="dash-divider" />
        </>
      )}

      {/* ── RECENT EXPENSES ── */}
      <div className="dash-section">
        <div className="dash-section-header">
          <div className="dash-section-left">
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
              <Zap size={13} color="var(--red)" strokeWidth={2.5} />
              <div className="dash-section-label" style={{ marginBottom: 0 }}>Recent</div>
            </div>
            <div className="dash-section-title">Latest Expenses</div>
          </div>
          <button className="dash-see-all" onClick={() => navigate('/expenses')}>
            See all <ChevronRight size={12} />
          </button>
        </div>

        {recentExpenses.map((e, i) => {
          const color = EXP_COLORS[e.cat] || '#6b7280'
          return (
            <div key={i} className="dash-exp-row">
              <div className="dash-exp-left">
                <div className="dash-exp-icon" style={{ background: `${color}15` }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: color }} />
                </div>
                <div>
                  <div className="dash-exp-cat">{e.cat}</div>
                  <div className="dash-exp-month">{e.month} 2026</div>
                </div>
              </div>
              <div className="dash-exp-amount">−₹{e.amount.toLocaleString()}</div>
            </div>
          )
        })}
      </div>

      <div style={{ height: 24 }} />
    </div>
  )
}