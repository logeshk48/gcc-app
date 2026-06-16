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
  const { expenses, setExpenses, saveData, loading, MONTHS, EXP_CATS, isAdmin, year } = useApp()
  const [selMonth, setSelMonth] = useState('all')
  const [showAdd, setShowAdd] = useState(false)
  const [addCat, setAddCat] = useState(EXP_CATS[0])
  const [addMonth, setAddMonth] = useState(new Date().getMonth())
  const [addAmount, setAddAmount] = useState('')
  const [saving, setSaving] = useState(false)

  const monthlyTotals = MONTHS.map((_, mi) =>
    Object.values(expenses).reduce((s, row) => s + (row[mi] || 0), 0)
  )

  const grandTotal = monthlyTotals.reduce((a, b) => a + b, 0)

  const filteredTotal = selMonth === 'all'
    ? grandTotal
    : monthlyTotals[parseInt(selMonth)]

  const catTotals = EXP_CATS.map(cat => {
    const row = expenses[cat] || new Array(12).fill(0)
    const total = selMonth === 'all'
      ? row.reduce((a, b) => a + b, 0)
      : (row[parseInt(selMonth)] || 0)
    return { cat, total }
  }).filter(c => c.total > 0).sort((a, b) => b.total - a.total)

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
  expItems.sort((a, b) => b.monthIdx - a.monthIdx)

  const peakMonth = monthlyTotals.some(v => v > 0)
    ? MONTHS[monthlyTotals.indexOf(Math.max(...monthlyTotals))]
    : '—'

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
    setShowAdd(false)
    setSaving(false)
  }

  return (
    <div className="epage">

      {/* ── HEADER ── */}
      <div className="epage-header">
        <div className="epage-header-inner">
          <div>
            <div className="epage-tag">
              <div className="epage-tag-dot" />
              Season {year}
            </div>
            <div className="epage-h1">
              Club<br /><span>Expenses</span>
            </div>
            <div className="epage-subtitle">
              {Object.values(expenses).flat().filter(v => v > 0).length} entries recorded
            </div>
          </div>
          {isAdmin && (
            <button className="epage-add-btn" onClick={() => setShowAdd(true)}>
              <Plus size={20} strokeWidth={2.5} />
            </button>
          )}
        </div>
      </div>

      {/* ── BIG TOTAL ── */}
      <div className="epage-total-wrap">
        <div className="epage-total-label">
          {selMonth === 'all' ? 'Total Spent' : `${MONTHS[parseInt(selMonth)]} Expenses`}
        </div>
        <div className="epage-total-val">
          ₹{filteredTotal.toLocaleString()}
        </div>
        <div className="epage-total-sub">
          {selMonth === 'all'
            ? `across ${catTotals.length} categories · peak month ${peakMonth}`
            : `${catTotals.length} categories this month`
          }
        </div>
      </div>

      {/* ── MONTH FILTERS ── */}
      <div className="epage-months">
        <button
          className={`epage-mchip ${selMonth === 'all' ? 'on' : 'off'}`}
          onClick={() => setSelMonth('all')}>
          All time
        </button>
        {MONTHS.map((m, i) => {
          const hasData = monthlyTotals[i] > 0
          const isActive = selMonth === String(i)
          return (
            <button key={i}
              className={`epage-mchip ${isActive ? 'on' : hasData ? 'data' : 'off'}`}
              onClick={() => setSelMonth(String(i))}>
              {m}
            </button>
          )
        })}
      </div>

      {/* ── BODY ── */}
      <div className="epage-body">

        {/* summary row */}
        {grandTotal > 0 && (
          <div className="epage-summary" style={{ marginBottom: 28 }}>
            {[
              { label: 'Total',      val: `₹${filteredTotal.toLocaleString()}`, color: 'var(--red)'   },
              { label: 'Categories', val: catTotals.length,                     color: '#fff'          },
              { label: 'Peak Month', val: peakMonth,                            color: 'var(--amber)'  },
            ].map((s, i) => (
              <div key={i} className="epage-summary-item">
                <div className="epage-summary-label">{s.label}</div>
                <div className="epage-summary-val" style={{ color: s.color }}>{s.val}</div>
              </div>
            ))}
          </div>
        )}

        {/* loading */}
        {loading && [1,2,3].map(i => <div key={i} className="eskeleton" />)}

        {/* empty */}
        {!loading && expItems.length === 0 && (
          <div className="epage-empty">
            <div className="epage-empty-icon">
              <Receipt size={28} color="var(--red)" strokeWidth={1.5} />
            </div>
            <div className="epage-empty-title">
              {grandTotal === 0 ? 'No expenses yet' : 'Nothing this month'}
            </div>
            <div className="epage-empty-sub">
              {isAdmin ? 'Tap + to record an expense' : 'Admin has not added expenses yet'}
            </div>
          </div>
        )}

        {/* category breakdown */}
        {catTotals.length > 0 && (
          <>
            <div className="epage-section-label">By Category</div>
            {catTotals.map((c, i) => {
              const color = EXP_COLORS[c.cat] || '#6b7280'
              const pct = Math.round((c.total / (filteredTotal || 1)) * 100)
              return (
                <div key={i} className="ecat-row" style={{ animationDelay: `${i * 0.05}s` }}>
                  <div className="ecat-top">
                    <div className="ecat-left">
                      <div className="ecat-icon" style={{ background: `${color}12` }}>
                        <div style={{ width: 10, height: 10, borderRadius: 3, background: color }} />
                      </div>
                      <span className="ecat-name">{c.cat}</span>
                    </div>
                    <div className="ecat-right">
                      <span className="ecat-pct">{pct}%</span>
                      <span className="ecat-amount" style={{ color }}>
                        ₹{c.total.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="ecat-bar-bg">
                    <div className="ecat-bar-fill" style={{ width: `${pct}%`, background: color }} />
                  </div>
                </div>
              )
            })}
            <div className="epage-divider" />
          </>
        )}

        {/* expense list */}
        {expItems.length > 0 && (
          <>
            <div className="epage-section-label">
              {selMonth === 'all' ? 'All Entries' : `${MONTHS[parseInt(selMonth)]} Entries`}
            </div>
            {expItems.map((e, i) => {
              const color = EXP_COLORS[e.cat] || '#6b7280'
              return (
                <div key={i} className="eitem" style={{ animationDelay: `${i * 0.04}s` }}>
                  <div className="eitem-icon" style={{ background: `${color}10` }}>
                    <div style={{ width: 10, height: 10, borderRadius: 3, background: color }} />
                  </div>
                  <div className="eitem-info">
                    <div className="eitem-cat">{e.cat}</div>
                    <div className="eitem-month">{MONTHS[e.monthIdx]} {year}</div>
                  </div>
                  <div className="eitem-amount">−₹{e.amount.toLocaleString()}</div>
                </div>
              )
            })}
          </>
        )}

      </div>

      {/* ══ ADD SHEET ══ */}
      {showAdd && (
        <>
          <div className="esheet-overlay" onClick={() => setShowAdd(false)} />
          <div className="esheet">
            <div className="esheet-handle" />
            <div className="esheet-header">
              <div className="esheet-title">Add Expense</div>
              <button className="esheet-close" onClick={() => setShowAdd(false)}>
                <X size={15} />
              </button>
            </div>
            <div className="esheet-body">
              <label className="eform-label">Category</label>
              <select className="eform-input" value={addCat}
                onChange={e => setAddCat(e.target.value)}
                style={{ appearance: 'none' }}>
                {EXP_CATS.map(c => (
                  <option key={c} value={c} style={{ background: '#080a08' }}>{c}</option>
                ))}
              </select>

              <label className="eform-label">Month</label>
              <select className="eform-input" value={addMonth}
                onChange={e => setAddMonth(parseInt(e.target.value))}
                style={{ appearance: 'none' }}>
                {MONTHS.map((m, i) => (
                  <option key={i} value={i} style={{ background: '#080a08' }}>{m}</option>
                ))}
              </select>

              <label className="eform-label">Amount (₹)</label>
              <input className="eform-input" type="number" placeholder="0"
                value={addAmount} onChange={e => setAddAmount(e.target.value)} />

              <button className="eform-btn" onClick={handleAdd}
                disabled={saving || !addAmount}>
                {saving ? 'Saving...' : 'Add Expense'}
              </button>
            </div>
          </div>
        </>
      )}

    </div>
  )
}