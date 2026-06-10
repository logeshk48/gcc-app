import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { Plus, X, Receipt } from 'lucide-react'
import './Expenses.css'

const EXP_COLORS = {
  'Bat repair':  '#f59e0b',
  'Ball box':    '#3b82f6',
  'New gloves':  '#8b5cf6',
  'New pad':     '#06b6d4',
  'New bat':     '#ec4899',
  'Helmet':      '#f97316',
  'Ground fee':  '#22c55e',
  'Jersey':      '#a855f7',
  'Other':       '#6b7280',
}

export default function Expenses() {
  const { expenses, setExpenses, saveData, loading, MONTHS, EXP_CATS, isAdmin } = useApp()
  const [selMonth, setSelMonth] = useState('all')
  const [showAdd, setShowAdd] = useState(false)
  const [addCat, setAddCat] = useState(EXP_CATS[0])
  const [addMonth, setAddMonth] = useState(new Date().getMonth())
  const [addAmount, setAddAmount] = useState('')
  const [addNote, setAddNote] = useState('')
  const [saving, setSaving] = useState(false)

  // compute totals
  const monthlyTotals = MONTHS.map((_, mi) =>
    Object.values(expenses).reduce((s, row) => s + (row[mi] || 0), 0)
  )

  const grandTotal = monthlyTotals.reduce((a, b) => a + b, 0)

  const filteredTotal = selMonth === 'all'
    ? grandTotal
    : monthlyTotals[parseInt(selMonth)]

  // category totals for selected month/all
  const catTotals = EXP_CATS.map(cat => {
    const row = expenses[cat] || new Array(12).fill(0)
    const total = selMonth === 'all'
      ? row.reduce((a, b) => a + b, 0)
      : (row[parseInt(selMonth)] || 0)
    return { cat, total }
  }).filter(c => c.total > 0).sort((a, b) => b.total - a.total)

  // expense list items
  const expItems = []
  const monthRange = selMonth === 'all'
    ? MONTHS.map((_, i) => i)
    : [parseInt(selMonth)]

  for (const mi of monthRange) {
    EXP_CATS.forEach(cat => {
      const val = expenses[cat]?.[mi] || 0
      if (val > 0) expItems.push({ cat, amount: val, monthIdx: mi })
    })
  }

  // sort by month desc
  expItems.sort((a, b) => b.monthIdx - a.monthIdx)

  const handleAdd = async () => {
    const amt = parseInt(addAmount)
    if (!amt || amt <= 0) return
    setSaving(true)
    const next = { ...expenses }
    if (!next[addCat]) next[addCat] = new Array(12).fill(0)
    else next[addCat] = [...next[addCat]]
    next[addCat][addMonth] += amt
    setExpenses(next)
    await saveData(undefined, next, undefined)
    setAddAmount('')
    setAddNote('')
    setShowAdd(false)
    setSaving(false)
  }

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>

      {/* ── HEADER ── */}
      <div className="exp-header">
        <div className="exp-header-top">
          <div>
            <div className="exp-title">Expenses</div>
            <div className="exp-subtitle">
              ₹{grandTotal.toLocaleString()} total · {Object.values(expenses).flat().filter(v => v > 0).length} entries
            </div>
          </div>
          {isAdmin && (
            <button className="exp-add-btn" onClick={() => setShowAdd(true)}>
              <Plus size={18} strokeWidth={2.5} />
            </button>
          )}
        </div>

        {/* month filter */}
        <div className="exp-month-filters">
          <button
            className={`exp-month-chip ${selMonth === 'all' ? 'active' : 'inactive'}`}
            onClick={() => setSelMonth('all')}>
            All
          </button>
          {MONTHS.map((m, i) => {
            const hasData = monthlyTotals[i] > 0
            const isActive = selMonth === String(i)
            return (
              <button key={i}
                className={`exp-month-chip ${isActive ? 'active' : hasData ? 'has-data' : 'inactive'}`}
                onClick={() => setSelMonth(String(i))}>
                {m}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── BODY ── */}
      <div className="exp-body">

        {/* summary row */}
        <div className="exp-summary-row">
          {[
            { label: selMonth === 'all' ? 'Total Spent' : `${MONTHS[parseInt(selMonth)]} Total`, val: `₹${filteredTotal.toLocaleString()}`, color: 'var(--red)' },
            { label: 'Categories', val: catTotals.length, color: 'var(--t1)' },
            { label: 'Peak Month', val: monthlyTotals.some(v=>v>0) ? MONTHS[monthlyTotals.indexOf(Math.max(...monthlyTotals))] : '—', color: 'var(--amber)' },
          ].map((s, i) => (
            <div key={i} className="exp-summary-item">
              <div className="exp-summary-label">{s.label}</div>
              <div className="exp-summary-val" style={{ color: s.color }}>{s.val}</div>
            </div>
          ))}
        </div>

        {/* empty state */}
        {!loading && expItems.length === 0 && (
          <div className="exp-empty">
            <Receipt size={48} color="var(--t3)" strokeWidth={1.5} />
            <div className="exp-empty-title">
              {grandTotal === 0 ? 'No expenses yet' : 'No expenses this month'}
            </div>
            <div className="exp-empty-sub">
              {isAdmin ? 'Tap + to add an expense' : 'Admin has not added expenses yet'}
            </div>
          </div>
        )}

        {/* category breakdown */}
        {catTotals.length > 0 && (
          <>
            <div className="exp-section-label">By Category</div>
            {catTotals.map((c, i) => {
              const color = EXP_COLORS[c.cat] || '#6b7280'
              const pct = Math.round((c.total / filteredTotal) * 100)
              return (
                <div key={i} className="exp-cat-row">
                  <div className="exp-cat-top">
                    <div className="exp-cat-left">
                      <div className="exp-cat-dot" style={{ background: color }} />
                      <span className="exp-cat-name">{c.cat}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span className="exp-cat-pct">{pct}%</span>
                      <span className="exp-cat-amount" style={{ color }}>
                        ₹{c.total.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="exp-cat-bar-bg">
                    <div className="exp-cat-bar-fill"
                      style={{ width: `${pct}%`, background: color }} />
                  </div>
                </div>
              )
            })}
            <div className="exp-divider" />
          </>
        )}

        {/* expense list */}
        {expItems.length > 0 && (
          <>
            <div className="exp-section-label">
              {selMonth === 'all' ? 'All Entries' : `${MONTHS[parseInt(selMonth)]} Entries`}
            </div>
            {expItems.map((e, i) => {
              const color = EXP_COLORS[e.cat] || '#6b7280'
              return (
                <div key={i} className="exp-item-row">
                  <div className="exp-item-icon" style={{ background: `${color}15` }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: color }} />
                  </div>
                  <div className="exp-item-info">
                    <div className="exp-item-cat">{e.cat}</div>
                    <div className="exp-item-month">{MONTHS[e.monthIdx]} 2026</div>
                  </div>
                  <div className="exp-item-amount">−₹{e.amount.toLocaleString()}</div>
                </div>
              )
            })}
          </>
        )}
      </div>

      {/* ── ADD EXPENSE SHEET ── */}
      {showAdd && (
        <>
          <div
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(0,0,0,0.7)',
              zIndex: 200, backdropFilter: 'blur(4px)',
              animation: 'fadeIn 0.2s ease'
            }}
            onClick={() => setShowAdd(false)}
          />
          <div style={{
            position: 'fixed', bottom: 0,
            left: '50%', transform: 'translateX(-50%)',
            width: '100%', maxWidth: 430,
            background: '#0f160f',
            borderRadius: '24px 24px 0 0',
            borderTop: '1px solid rgba(239,68,68,0.2)',
            zIndex: 201,
            animation: 'slideUp 0.3s ease',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ width: 36, height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 4, margin: '12px auto 0' }} />

            <div style={{
              padding: '16px 20px 12px',
              borderBottom: '1px solid rgba(255,255,255,0.05)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--t1)' }}>Add Expense</div>
              <button onClick={() => setShowAdd(false)} style={{
                width: 30, height: 30, borderRadius: 10,
                background: 'rgba(255,255,255,0.06)',
                border: 'none', color: 'var(--t2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
              }}>
                <X size={16} />
              </button>
            </div>

            <div style={{ padding: '16px 20px 40px' }}>

              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, color: 'var(--t2)', fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 }}>Category</div>
                <select
                  value={addCat}
                  onChange={e => setAddCat(e.target.value)}
                  style={{
                    width: '100%', background: 'rgba(255,255,255,0.05)',
                    border: '1.5px solid rgba(255,255,255,0.08)',
                    borderRadius: 14, padding: '12px 16px',
                    fontSize: 15, color: '#fff', boxSizing: 'border-box',
                    appearance: 'none'
                  }}>
                  {EXP_CATS.map(c => (
                    <option key={c} value={c} style={{ background: '#0f160f' }}>{c}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, color: 'var(--t2)', fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 }}>Month</div>
                <select
                  value={addMonth}
                  onChange={e => setAddMonth(parseInt(e.target.value))}
                  style={{
                    width: '100%', background: 'rgba(255,255,255,0.05)',
                    border: '1.5px solid rgba(255,255,255,0.08)',
                    borderRadius: 14, padding: '12px 16px',
                    fontSize: 15, color: '#fff', boxSizing: 'border-box',
                    appearance: 'none'
                  }}>
                  {MONTHS.map((m, i) => (
                    <option key={i} value={i} style={{ background: '#0f160f' }}>{m}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, color: 'var(--t2)', fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 }}>Amount (₹)</div>
                <input
                  type="number"
                  placeholder="0"
                  value={addAmount}
                  onChange={e => setAddAmount(e.target.value)}
                  style={{
                    width: '100%', background: 'rgba(255,255,255,0.05)',
                    border: '1.5px solid rgba(255,255,255,0.08)',
                    borderRadius: 14, padding: '12px 16px',
                    fontSize: 15, color: '#fff', boxSizing: 'border-box'
                  }}
                />
              </div>

              <button
                onClick={handleAdd}
                disabled={saving || !addAmount}
                style={{
                  width: '100%', padding: 15,
                  background: saving || !addAmount ? 'rgba(239,68,68,0.3)' : 'var(--red)',
                  color: '#fff', fontSize: 15, fontWeight: 800,
                  border: 'none', borderRadius: 16,
                  cursor: saving || !addAmount ? 'not-allowed' : 'pointer',
                  marginTop: 8, transition: 'all 0.2s'
                }}>
                {saving ? 'Saving...' : 'Add Expense'}
              </button>
            </div>
          </div>
        </>
      )}

    </div>
  )
}