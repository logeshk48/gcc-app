import { useApp } from '../../context/AppContext'
import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  TrendingUp, TrendingDown, Target,
  Calendar, BarChart2, Trophy,
  AlertTriangle, Zap, ChevronRight
} from 'lucide-react'
import './Dashboard.css'

function useCountUp(target, duration = 2000) {
  const [val, setVal] = useState(0)
  const prev = useRef(0)
  useEffect(() => {
    if (!target && target !== 0) return
    const from = prev.current
    prev.current = target
    let start = from
    const diff = target - from
    if (diff === 0) return
    const step = diff / (duration / 16)
    const t = setInterval(() => {
      start += step
      if ((step > 0 && start >= target) || (step < 0 && start <= target)) {
        setVal(target); clearInterval(t)
      } else {
        setVal(Math.floor(start))
      }
    }, 16)
    return () => clearInterval(t)
  }, [target])
  return val
}

function Skeleton({ w = '100%', h = 20, r = 8 }) {
  return <div className="skeleton" style={{ width: w, height: h, borderRadius: r }} />
}

function SVGBarChart({ data }) {
  const W = 360, H = 120, pL = 4, pR = 4, pT = 10, pB = 22
  const cW = W - pL - pR, cH = H - pT - pB
  const max = Math.max(...data.flatMap(d => [d.col, d.exp]), 1)
  const slotW = cW / data.length
  const bW = slotW * 0.3
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', display: 'block' }}>
      <defs>
        <linearGradient id="colGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#22c55e" stopOpacity={1} />
          <stop offset="100%" stopColor="#16a34a" stopOpacity={0.8} />
        </linearGradient>
        <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ef4444" stopOpacity={1} />
          <stop offset="100%" stopColor="#dc2626" stopOpacity={0.8} />
        </linearGradient>
      </defs>
      {[0.33, 0.66, 1].map(p => (
        <line key={p}
          x1={pL} y1={pT + cH * (1-p)}
          x2={W-pR} y2={pT + cH * (1-p)}
          stroke="rgba(255,255,255,0.04)" strokeWidth={1} strokeDasharray="3 3" />
      ))}
      {data.map((d, i) => {
        const cx = pL + i * slotW + slotW / 2
        const colH = Math.max((d.col / max) * cH, d.col > 0 ? 4 : 0)
        const expH = Math.max((d.exp / max) * cH, d.exp > 0 ? 4 : 0)
        return (
          <g key={i}>
            <rect x={cx-bW-1} y={pT+cH-colH} width={bW} height={colH} rx={4} fill="url(#colGrad)" />
            <rect x={cx+1} y={pT+cH-expH} width={bW} height={expH} rx={4} fill="url(#expGrad)" />
            <text x={cx} y={H-5} textAnchor="middle" fontSize={8} fill="rgba(255,255,255,0.18)" fontWeight="600">{d.month}</text>
          </g>
        )
      })}
    </svg>
  )
}

function SVGSparkline({ data }) {
  if (data.length < 2) return null
  const W = 360, H = 72, pL = 4, pR = 4, pT = 8, pB = 8
  const cW = W - pL - pR, cH = H - pT - pB
  const vals = data.map(d => d.net)
  const min = Math.min(...vals), max = Math.max(...vals)
  const range = max - min || 1
  const pts = data.map((d, i) => ({
    x: pL + (i / (data.length-1)) * cW,
    y: pT + cH - ((d.net - min) / range) * cH
  }))
  const line = pts.map((p, i) => `${i===0?'M':'L'}${p.x},${p.y}`).join(' ')
  const area = `${line} L${pts[pts.length-1].x},${pT+cH} L${pts[0].x},${pT+cH} Z`
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', display: 'block' }}>
      <defs>
        <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#22c55e" stopOpacity={0.3} />
          <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#sparkGrad)" />
      <path d={line} fill="none" stroke="#22c55e" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={3} fill="#05080a" stroke="#22c55e" strokeWidth={2} />
      ))}
    </svg>
  )
}

const EXP_COLORS = {
  'Bat repair': '#f59e0b', 'Ball box': '#3b82f6',
  'New gloves': '#8b5cf6', 'New pad': '#06b6d4',
  'New bat': '#ec4899', 'Helmet': '#f97316',
  'Ground fee': '#22c55e', 'Jersey': '#a855f7', 'Other': '#6b7280'
}

export default function Dashboard() {
  const {
    currentBalance, monthlyCollection, monthlyExpenses,
    members, expenses, loading, MONTHS
  } = useApp()
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
  for (let mi = curMonth; mi >= 0 && recentExpenses.length < 4; mi--) {
    Object.entries(expenses).forEach(([cat, vals]) => {
      if (vals[mi] > 0 && recentExpenses.length < 4)
        recentExpenses.push({ cat, amount: vals[mi], month: MONTHS[mi] })
    })
  }

  const targetPerMonth = members.length * 100
  const avgMonthlyCol = totalCol / (monthlyCollection.filter(v => v > 0).length || 1)
  const monthsLeft = 12 - curMonth - 1
  const colPct = Math.min(Math.round((totalCol / ((targetPerMonth * 12) || 1)) * 100), 100)

  const bal = useCountUp(loading ? 0 : currentBalance)
  const col = useCountUp(loading ? 0 : totalCol)
  const exp = useCountUp(loading ? 0 : totalExp)

  const chartData = MONTHS.map((m, i) => ({
    month: m, col: monthlyCollection[i],
    exp: monthlyExpenses[i],
    net: monthlyCollection[i] - monthlyExpenses[i]
  })).filter(d => d.col > 0 || d.exp > 0)

  const medals = ['#fbbf24', '#cbd5e1', '#b45309']

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>

      {/* ══ HERO ══ */}
      <div className="dash-hero">
        <div className="dash-hero-bg" />
        <div className="dash-hero-overlay" />
        <div className="dash-hero-content">
          <div className="dash-hero-eyebrow">
            <div style={{
              width: 6, height: 6, borderRadius: '50%',
              background: 'var(--green)',
              boxShadow: '0 0 6px var(--green)',
              animation: 'pulse 2s infinite'
            }} />
            Golden Cricket Club · 2026
          </div>
          {loading
            ? <Skeleton w={200} h={62} r={12} />
            : <div className="dash-hero-balance">₹{bal.toLocaleString()}</div>
          }
          <div className="dash-hero-live">
            <div className="dash-hero-live-dot" />
            <span className="dash-hero-live-text">Live · synced with Firebase</span>
          </div>
          <div className="dash-hero-glass">
            {[
              { label: 'Carry-over', val: '₹3,950', color: 'rgba(255,255,255,0.65)' },
              { label: '2026 Net', val: `${totalCol-totalExp>=0?'+':''}₹${(totalCol-totalExp).toLocaleString()}`, color: totalCol-totalExp>=0?'#22c55e':'#ef4444' },
              { label: 'Players', val: activeMembers, color: 'rgba(255,255,255,0.65)' },
              { label: 'Dues', val: pendingMembers.length, color: pendingMembers.length>0?'#f59e0b':'#22c55e' },
            ].map((s, i, arr) => (
              <div key={i} className="dash-hero-stat" style={{
                paddingRight: i < arr.length-1 ? 14 : 0,
                marginRight:  i < arr.length-1 ? 14 : 0,
                borderRight:  i < arr.length-1 ? '1px solid rgba(255,255,255,0.07)' : 'none'
              }}>
                <div className="dash-hero-stat-label">{s.label}</div>
                <div className="dash-hero-stat-val" style={{ color: s.color }}>{s.val}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══ BODY ══ */}
      <div className="dash-body">

        {/* SEASON PROGRESS */}
        <div className="dash-section" style={{ animationDelay: '0.05s' }}>
          <div className="dash-section-eyebrow">Season Progress</div>
          <div className="dash-section-title">2026 at a Glance</div>
          <div className="dash-progress-wrap">
            <div className="dash-progress-top">
              <span className="dash-progress-label">Annual Collection Target</span>
              <span className="dash-progress-pct">{colPct}%</span>
            </div>
            <div className="dash-progress-bg">
              <div className="dash-progress-fill" style={{ width: `${colPct}%` }} />
            </div>
            <div className="dash-progress-sub">
              ₹{totalCol.toLocaleString()} of ₹{(targetPerMonth * 12).toLocaleString()} target
            </div>
          </div>
          <div className="dash-stat-row">
            {[
              { icon: Target,    label: 'Avg / Month', val: `₹${Math.round(avgMonthlyCol).toLocaleString()}`, color: 'var(--green)' },
              { icon: Calendar,  label: 'Months Left',  val: monthsLeft,                                       color: 'var(--amber)' },
              { icon: BarChart2, label: 'Peak Month',   val: monthlyCollection.some(v=>v>0) ? MONTHS[monthlyCollection.indexOf(Math.max(...monthlyCollection))] : '—', color: 'var(--blue)' },
            ].map((s, i) => (
              <div key={i} className="dash-stat-item">
                <div className="dash-stat-icon-row">
                  <s.icon size={11} color={s.color} strokeWidth={2.5} />
                  <span className="dash-stat-icon-label">{s.label}</span>
                </div>
                <div className="dash-stat-value" style={{ color: s.color }}>{s.val}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="dash-divider" />

        {/* FINANCE */}
        <div className="dash-section" style={{ animationDelay: '0.1s' }}>
          <div className="dash-section-eyebrow">Finance</div>
          <div className="dash-section-title">Collection vs Expenses</div>
          <div className="dash-finance-row">
            <div className="dash-finance-col">
              <div className="dash-finance-label">
                <TrendingUp size={12} color="var(--green)" strokeWidth={2.5} />
                <span className="dash-finance-label-text">Collected</span>
              </div>
              <div className="dash-finance-value" style={{ color: 'var(--green)' }}>₹{col.toLocaleString()}</div>
            </div>
            <div className="dash-finance-col">
              <div className="dash-finance-label">
                <TrendingDown size={12} color="var(--red)" strokeWidth={2.5} />
                <span className="dash-finance-label-text">Expenses</span>
              </div>
              <div className="dash-finance-value" style={{ color: 'var(--red)' }}>₹{exp.toLocaleString()}</div>
            </div>
          </div>
          {loading ? <Skeleton h={120} r={8} /> : <SVGBarChart data={chartData} />}
          <div style={{ display: 'flex', gap: 16, marginTop: 10 }}>
            {[['var(--green)', 'Collection'], ['var(--red)', 'Expenses']].map(([c, l]) => (
              <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 6, height: 6, borderRadius: 2, background: c }} />
                <span style={{ fontSize: 10, color: 'var(--t2)', fontWeight: 500 }}>{l}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="dash-divider" />

        {/* NET TREND */}
        <div className="dash-section" style={{ animationDelay: '0.15s' }}>
          <div className="dash-section-eyebrow">Net Trend</div>
          <div className="dash-section-title">Monthly Balance Flow</div>
          {loading
            ? <Skeleton h={72} r={8} />
            : chartData.length >= 2
              ? <SVGSparkline data={chartData} />
              : <div style={{ fontSize: 13, color: 'var(--t3)', padding: '16px 0' }}>Not enough data yet</div>
          }
        </div>

        {/* TOP CONTRIBUTORS */}
        {topContributors.length > 0 && (
          <>
            <div className="dash-divider" />
            <div className="dash-section" style={{ animationDelay: '0.2s' }}>
              <div className="dash-section-header">
                <div>
                  <div className="dash-section-eyebrow">Squad</div>
                  <div className="dash-section-title" style={{ marginBottom: 0 }}>Top Contributors</div>
                </div>
                <button className="dash-see-all" onClick={() => navigate('/members')}>
                  All <ChevronRight size={11} />
                </button>
              </div>
              {topContributors.map((m, i) => {
                const pct = Math.round((m.total / topContributors[0].total) * 100)
                return (
                  <div key={i} className="dash-contributor-row">
                    <div className="dash-contributor-top">
                      <div className="dash-contributor-left">
                        <div className="dash-contributor-medal"
                          style={{ background: `${medals[i]}12`, border: `1px solid ${medals[i]}25` }}>
                          <Trophy size={14} color={medals[i]} strokeWidth={2.5} />
                        </div>
                        <span className="dash-contributor-name">{m.name}</span>
                      </div>
                      <span className="dash-contributor-amount" style={{ color: medals[i] }}>
                        ₹{m.total.toLocaleString()}
                      </span>
                    </div>
                    <div className="dash-bar">
                      <div className="dash-bar-fill" style={{ width: `${pct}%`, background: medals[i] }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* PENDING DUES */}
        {pendingMembers.length > 0 && (
          <>
            <div className="dash-divider" />
            <div className="dash-section" style={{ animationDelay: '0.25s' }}>
              <div className="dash-section-header">
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <AlertTriangle size={11} color="var(--amber)" strokeWidth={2.5} />
                    <div className="dash-section-eyebrow" style={{ marginBottom: 0 }}>Dues Pending</div>
                  </div>
                  <div className="dash-section-title" style={{ marginBottom: 0 }}>Members Behind</div>
                </div>
                <button className="dash-see-all" onClick={() => navigate('/members')}>
                  All <ChevronRight size={11} />
                </button>
              </div>
              {pendingMembers.map((m, i) => {
                const paid = m.paid.filter(v => v > 0).length
                const behind = curMonth + 1 - paid
                return (
                  <div key={i} className="dash-due-row">
                    <div className="dash-due-avatar">{m.name.charAt(0).toUpperCase()}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="dash-due-name">{m.name}</div>
                      <div className="dash-due-sub">{behind} month{behind>1?'s':''} behind · ₹{behind*100} due</div>
                    </div>
                    <div className="dash-due-right">{paid}/{curMonth+1} paid</div>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* RECENT EXPENSES */}
        {recentExpenses.length > 0 && (
          <>
            <div className="dash-divider" />
            <div className="dash-section" style={{ animationDelay: '0.3s' }}>
              <div className="dash-section-header">
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <Zap size={11} color="var(--red)" strokeWidth={2.5} />
                    <div className="dash-section-eyebrow" style={{ marginBottom: 0 }}>Recent</div>
                  </div>
                  <div className="dash-section-title" style={{ marginBottom: 0 }}>Latest Expenses</div>
                </div>
                <button className="dash-see-all" onClick={() => navigate('/expenses')}>
                  All <ChevronRight size={11} />
                </button>
              </div>
              {recentExpenses.map((e, i) => {
                const color = EXP_COLORS[e.cat] || '#6b7280'
                return (
                  <div key={i} className="dash-exp-row">
                    <div className="dash-exp-left">
                      <div className="dash-exp-icon" style={{ background: `${color}10` }}>
                        <div style={{ width: 9, height: 9, borderRadius: 3, background: color }} />
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
          </>
        )}

        {/* MONTH BREAKDOWN */}
        {chartData.length > 0 && (
          <>
            <div className="dash-divider" />
            <div className="dash-section" style={{ animationDelay: '0.35s' }}>
              <div className="dash-section-eyebrow">Breakdown</div>
              <div className="dash-section-title">Month by Month</div>
              {MONTHS.map((m, i) => {
                const c = monthlyCollection[i]
                const e = monthlyExpenses[i]
                if (c === 0 && e === 0) return null
                const net = c - e
                const pct = Math.round((c / (totalCol || 1)) * 100)
                const isMaxExp = e > 0 && e === Math.max(...monthlyExpenses)
                return (
                  <div key={i} className="dash-month-row">
                    <div className="dash-month-top">
                      <div className="dash-month-left">
                        <span className="dash-month-label">{m}</span>
                        <span className="dash-month-col">₹{c.toLocaleString()}</span>
                        {isMaxExp && (
                          <span style={{
                            fontSize: 9, color: 'var(--red)', fontWeight: 700,
                            textTransform: 'uppercase', letterSpacing: 0.8,
                            padding: '2px 6px', background: 'rgba(239,68,68,0.08)',
                            border: '1px solid rgba(239,68,68,0.15)', borderRadius: 5
                          }}>Peak</span>
                        )}
                      </div>
                      <span className="dash-month-net" style={{ color: net>=0?'var(--green)':'var(--red)' }}>
                        {net>=0?'+':''}₹{net.toLocaleString()}
                      </span>
                    </div>
                    <div className="dash-month-bar-bg">
                      <div className="dash-month-bar-fill"
                        style={{ width: `${pct}%`, background: net>=0?'var(--green)':'var(--red)' }} />
                    </div>
                    <div className="dash-month-sub">₹{e.toLocaleString()} in expenses</div>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* EMPTY */}
        {!loading && chartData.length === 0 && members.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 20px' }}>
            <div style={{
              width: 56, height: 56, borderRadius: 18,
              background: 'rgba(34,197,94,0.06)',
              border: '1px solid rgba(34,197,94,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px'
            }}>
              <BarChart2 size={24} color="var(--green)" strokeWidth={1.5} />
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--t2)', marginBottom: 6 }}>No data yet</div>
            <div style={{ fontSize: 13, color: 'var(--t3)', lineHeight: 1.6 }}>
              Login as admin to add members and record payments
            </div>
          </div>
        )}

      </div>
    </div>
  )
}