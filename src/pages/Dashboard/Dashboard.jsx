import { useApp } from '../../context/AppContext'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  TrendingUp, TrendingDown, Target,
  Calendar, BarChart2, Trophy, ChevronRight
} from 'lucide-react'
import './Dashboard.css'

function useCountUp(target, duration = 1800) {
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

function Skeleton({ w = '100%', h = 20, r = 8 }) {
  return <div className="skeleton" style={{ width: w, height: h, borderRadius: r }} />
}

function SVG3DBarChart({ data }) {
  const W = 340, H = 160
  const pL = 8, pR = 16, pT = 10, pB = 24
  const cW = W - pL - pR, cH = H - pT - pB
  const max = Math.max(...data.flatMap(d => [d.col, d.exp]), 1)
  const slotW = cW / data.length
  const bW = Math.min(slotW * 0.28, 18)
  const depth = 5

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', display: 'block' }}>
      {[0.25, 0.5, 0.75, 1].map(p => (
        <line key={p}
          x1={pL} y1={pT + cH * (1-p)}
          x2={W-pR} y2={pT + cH * (1-p)}
          stroke="rgba(255,255,255,0.04)" strokeWidth={1} strokeDasharray="3 3" />
      ))}
      {data.map((d, i) => {
        const cx = pL + i * slotW + slotW / 2
        const colH = Math.max((d.col / max) * cH, d.col > 0 ? 4 : 0)
        const expH = Math.max((d.exp / max) * cH, d.exp > 0 ? 4 : 0)
        const cx1 = cx - bW - 2
        const cx2 = cx + 2
        return (
          <g key={i}>
            {d.col > 0 && <>
              <rect x={cx1} y={pT+cH-colH} width={bW} height={colH} rx={2} fill="#22c55e" />
              <polygon points={`${cx1+bW},${pT+cH-colH} ${cx1+bW+depth},${pT+cH-colH-depth} ${cx1+bW+depth},${pT+cH-depth} ${cx1+bW},${pT+cH}`} fill="#16a34a" />
              <polygon points={`${cx1},${pT+cH-colH} ${cx1+depth},${pT+cH-colH-depth} ${cx1+bW+depth},${pT+cH-colH-depth} ${cx1+bW},${pT+cH-colH}`} fill="#4ade80" />
            </>}
            {d.exp > 0 && <>
              <rect x={cx2} y={pT+cH-expH} width={bW} height={expH} rx={2} fill="#ef4444" />
              <polygon points={`${cx2+bW},${pT+cH-expH} ${cx2+bW+depth},${pT+cH-expH-depth} ${cx2+bW+depth},${pT+cH-depth} ${cx2+bW},${pT+cH}`} fill="#b91c1c" />
              <polygon points={`${cx2},${pT+cH-expH} ${cx2+depth},${pT+cH-expH-depth} ${cx2+bW+depth},${pT+cH-expH-depth} ${cx2+bW},${pT+cH-expH}`} fill="#fca5a5" />
            </>}
            <text x={cx} y={H-6} textAnchor="middle" fontSize={9}
              fill="rgba(255,255,255,0.25)" fontWeight="600">{d.month}</text>
          </g>
        )
      })}
    </svg>
  )
}

function SVGAreaChart({ data }) {
  if (data.length < 2) return null
  const W = 340, H = 100, pL = 8, pR = 16, pT = 8, pB = 8
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
        <linearGradient id="ag" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#22c55e" stopOpacity={0.35} />
          <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map(p => (
        <line key={p} x1={pL} y1={pT+cH*p} x2={W-pR} y2={pT+cH*p}
          stroke="rgba(255,255,255,0.04)" strokeWidth={1} strokeDasharray="3 3" />
      ))}
      <path d={area} fill="url(#ag)" />
      <path d={line} fill="none" stroke="#22c55e" strokeWidth={2.5}
        strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={3.5}
          fill="#05080a" stroke="#22c55e" strokeWidth={2} />
      ))}
      {data.map((d, i) => (
        <text key={i}
          x={pL + (i / (data.length-1)) * cW}
          y={H-1} textAnchor="middle" fontSize={9}
          fill="rgba(255,255,255,0.2)" fontWeight="600">{d.month}</text>
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

const TABS = ['Contributors', 'Behind', 'Expenses', 'Monthly']

export default function Dashboard() {
  const {
    currentBalance, monthlyCollection, monthlyExpenses,
    members, expenses, loading, MONTHS, year, oldBalance,
    monthlyRate
  } = useApp()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState(0)

  const totalCol = monthlyCollection.reduce((a, b) => a + b, 0)
  const totalExp = monthlyExpenses.reduce((a, b) => a + b, 0)
  const activeMembers = members.filter(m => m.paid.some(p => p > 0)).length
  const curMonth = new Date().getMonth()

  // ── DUES LOGIC with dynamic monthlyRate ──
  const pendingMembers = members.map(m => {
    const totalPaid = m.paid.reduce((s, v) => s + v, 0)
    // advance paid full year
    if (totalPaid >= monthlyRate * 12) return null
    const firstPaidMonth = m.paid.findIndex(v => v > 0)
    if (firstPaidMonth === -1) return null
    const monthsExpected = curMonth - firstPaidMonth + 1
    const expectedAmount = monthsExpected * monthlyRate
    const dueAmount = expectedAmount - totalPaid
    if (dueAmount <= 0) return null
    return { ...m, dueAmount, monthsExpected, totalPaid }
  }).filter(Boolean)

  const topContributors = [...members]
    .map(m => ({ name: m.name, total: m.paid.reduce((s, v) => s + v, 0) }))
    .filter(m => m.total > 0)
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)

  const recentExpenses = []
  for (let mi = curMonth; mi >= 0 && recentExpenses.length < 5; mi--) {
    Object.entries(expenses).forEach(([cat, vals]) => {
      if (vals[mi] > 0 && recentExpenses.length < 5)
        recentExpenses.push({ cat, amount: vals[mi], month: MONTHS[mi] })
    })
  }

  // use monthlyRate for target calculation
  const targetPerMonth = members.length * monthlyRate
  const avgMonthlyCol = totalCol / (monthlyCollection.filter(v => v > 0).length || 1)
  const monthsLeft = 12 - curMonth - 1
  const colPct = Math.min(Math.round((totalCol / ((targetPerMonth * 12) || 1)) * 100), 100)

  const bal = useCountUp(loading ? 0 : currentBalance)
  const col = useCountUp(loading ? 0 : totalCol)
  const exp = useCountUp(loading ? 0 : totalExp)

  const chartData = MONTHS.map((m, i) => ({
    month: m,
    col: monthlyCollection[i],
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
            Golden Cricket Club · {year}
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
              { label: 'Carry-over', val: `₹${oldBalance.toLocaleString()}`,                                                    color: 'rgba(255,255,255,0.65)' },
              { label: `${year} Net`, val: `${totalCol-totalExp>=0?'+':''}₹${(totalCol-totalExp).toLocaleString()}`,            color: totalCol-totalExp>=0?'#22c55e':'#ef4444' },
              { label: 'Players',    val: activeMembers,                                                                         color: 'rgba(255,255,255,0.65)' },
              { label: 'Dues',       val: pendingMembers.length,                                                                 color: pendingMembers.length>0?'#f59e0b':'#22c55e' },
            ].map((s, i, arr) => (
              <div key={i} className="dash-hero-stat" style={{
                paddingRight: i < arr.length-1 ? 12 : 0,
                marginRight:  i < arr.length-1 ? 12 : 0,
                borderRight:  i < arr.length-1 ? '1px solid rgba(255,255,255,0.08)' : 'none'
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
          <div className="dash-section-title">{year} at a Glance</div>
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
              <div className="dash-finance-value" style={{ color: 'var(--green)' }}>
                ₹{col.toLocaleString()}
              </div>
            </div>
            <div className="dash-finance-col">
              <div className="dash-finance-label">
                <TrendingDown size={12} color="var(--red)" strokeWidth={2.5} />
                <span className="dash-finance-label-text">Expenses</span>
              </div>
              <div className="dash-finance-value" style={{ color: 'var(--red)' }}>
                ₹{exp.toLocaleString()}
              </div>
            </div>
          </div>
          {loading
            ? <Skeleton h={160} r={8} />
            : <SVG3DBarChart data={chartData} />
          }
          <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
            {[['#22c55e','Collection'],['#ef4444','Expenses']].map(([c,l]) => (
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
            ? <Skeleton h={100} r={8} />
            : chartData.length >= 2
              ? <SVGAreaChart data={chartData} />
              : <div style={{ fontSize: 13, color: 'var(--t3)', padding: '16px 0' }}>
                  Not enough data yet
                </div>
          }
        </div>

        <div className="dash-divider" />

        {/* 4 TABS */}
        <div className="dash-section" style={{ animationDelay: '0.2s' }}>
          <div className="dash-tabs">
            {TABS.map((t, i) => (
              <button key={i}
                className={`dash-tab-btn ${activeTab === i ? 'active' : ''}`}
                onClick={() => setActiveTab(i)}>
                {t}
                {i === 1 && pendingMembers.length > 0 && (
                  <span className="dash-tab-badge">{pendingMembers.length}</span>
                )}
              </button>
            ))}
          </div>

          <div className="dash-tab-content">

            {/* TAB 0 — TOP CONTRIBUTORS */}
            {activeTab === 0 && (
              <div>
                {topContributors.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--t3)', fontSize: 13 }}>
                    No data yet
                  </div>
                )}
                {topContributors.map((m, i) => {
                  const pct = Math.round((m.total / topContributors[0].total) * 100)
                  return (
                    <div key={i} className="dash-contributor-row">
                      <div className="dash-contributor-top">
                        <div className="dash-contributor-left">
                          <div className="dash-contributor-medal"
                            style={{ background: `${medals[i]||'#475569'}12`, border: `1px solid ${medals[i]||'#475569'}25` }}>
                            <Trophy size={14} color={medals[i]||'#475569'} strokeWidth={2.5} />
                          </div>
                          <span className="dash-contributor-name">{m.name}</span>
                        </div>
                        <span className="dash-contributor-amount" style={{ color: medals[i]||'var(--t1)' }}>
                          ₹{m.total.toLocaleString()}
                        </span>
                      </div>
                      <div className="dash-bar">
                        <div className="dash-bar-fill" style={{ width: `${pct}%`, background: medals[i]||'var(--green)' }} />
                      </div>
                    </div>
                  )
                })}
                <button className="dash-see-all" onClick={() => navigate('/members')} style={{ marginTop: 12 }}>
                  View all members <ChevronRight size={11} />
                </button>
              </div>
            )}

            {/* TAB 1 — MEMBERS BEHIND */}
            {activeTab === 1 && (
              <div>
                {pendingMembers.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '32px 0' }}>
                    <div style={{ fontSize: 36, marginBottom: 10 }}>🎉</div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--green)', marginBottom: 4 }}>
                      All caught up!
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--t3)' }}>
                      Everyone is up to date
                    </div>
                  </div>
                ) : (
                  <>
                    <div style={{
                      background: 'rgba(245,158,11,0.06)',
                      border: '1px solid rgba(245,158,11,0.15)',
                      borderRadius: 14, padding: '12px 16px',
                      marginBottom: 14, display: 'flex',
                      justifyContent: 'space-between', alignItems: 'center'
                    }}>
                      <div>
                        <div style={{ fontSize: 10, color: 'var(--amber)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 3 }}>
                          Total Outstanding
                        </div>
                        <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--amber)', fontVariantNumeric: 'tabular-nums' }}>
                          ₹{pendingMembers.reduce((s, m) => s + m.dueAmount, 0).toLocaleString()}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 10, color: 'var(--t3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 3 }}>
                          Members
                        </div>
                        <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--t1)' }}>
                          {pendingMembers.length}
                        </div>
                      </div>
                    </div>
                    {pendingMembers.map((m, i) => (
                      <div key={i} className="dash-due-row">
                        <div className="dash-due-avatar">{m.name.charAt(0).toUpperCase()}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="dash-due-name">{m.name}</div>
                          <div className="dash-due-sub">
                            Paid ₹{m.totalPaid} of ₹{m.monthsExpected * monthlyRate} expected
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontSize: 14, fontWeight: 900, color: 'var(--red)', fontVariantNumeric: 'tabular-nums' }}>
                            ₹{m.dueAmount}
                          </div>
                          <div style={{ fontSize: 9, color: 'var(--t3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                            due
                          </div>
                        </div>
                      </div>
                    ))}
                    <button className="dash-see-all" onClick={() => navigate('/members')} style={{ marginTop: 12 }}>
                      View all members <ChevronRight size={11} />
                    </button>
                  </>
                )}
              </div>
            )}

            {/* TAB 2 — LATEST EXPENSES */}
            {activeTab === 2 && (
              <div>
                {recentExpenses.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--t3)', fontSize: 13 }}>
                    No expenses recorded yet
                  </div>
                )}
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
                          <div className="dash-exp-month">{e.month} {year}</div>
                        </div>
                      </div>
                      <div className="dash-exp-amount">−₹{e.amount.toLocaleString()}</div>
                    </div>
                  )
                })}
                <button className="dash-see-all" onClick={() => navigate('/expenses')} style={{ marginTop: 12 }}>
                  View all expenses <ChevronRight size={11} />
                </button>
              </div>
            )}

            {/* TAB 3 — MONTH BY MONTH */}
            {activeTab === 3 && (
              <div>
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
            )}

          </div>
        </div>

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
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--t2)', marginBottom: 6 }}>
              No data yet
            </div>
            <div style={{ fontSize: 13, color: 'var(--t3)', lineHeight: 1.6 }}>
              Login as admin to add members and record payments
            </div>
          </div>
        )}

      </div>
    </div>
  )
}