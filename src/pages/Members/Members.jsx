import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { Search, Plus, X, Check, Users } from 'lucide-react'
import './Members.css'

const AVATAR_COLORS = [
  ['#0d2b1a','#22c55e'], ['#1a0d2b','#a855f7'],
  ['#2b1a0d','#f59e0b'], ['#0d1a2b','#3b82f6'],
  ['#2b0d1a','#ec4899'], ['#0d2b2b','#06b6d4'],
  ['#1a2b0d','#84cc16'], ['#2b0d0d','#f97316'],
]

function getColor(name) {
  const i = name.charCodeAt(0) % AVATAR_COLORS.length
  return AVATAR_COLORS[i]
}

function getStatus(member, curMonth) {
  const totalPaid = member.paid.reduce((s, v) => s + v, 0)
  const paidMonths = member.paid.filter(v => v > 0).length
  const expectedTotal = (curMonth + 1) * 100
  if (paidMonths === 0 && totalPaid === 0) return 'inactive'
  if (totalPaid >= 1200 || totalPaid >= expectedTotal || paidMonths >= curMonth + 1) return 'paid'
  return 'partial'
}

const STATUS = {
  paid:     { label: 'Paid',     color: '#22c55e', bg: 'rgba(34,197,94,0.12)',   border: 'rgba(34,197,94,0.2)'   },
  partial:  { label: 'Partial',  color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.2)'  },
  inactive: { label: 'Inactive', color: '#475569', bg: 'rgba(255,255,255,0.06)', border: 'rgba(255,255,255,0.08)' },
}

export default function Members() {
  const { members, setMembers, saveData, loading, MONTHS, isAdmin } = useApp()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [showAdd, setShowAdd] = useState(false)
  const [selected, setSelected] = useState(null)
  const [newName, setNewName] = useState('')
  const [newJoin, setNewJoin] = useState(0)
  const [saving, setSaving] = useState(false)

  const curMonth = new Date().getMonth()

  const counts = {
    all:      members.length,
    paid:     members.filter(m => getStatus(m, curMonth) === 'paid').length,
    partial:  members.filter(m => getStatus(m, curMonth) === 'partial').length,
    inactive: members.filter(m => getStatus(m, curMonth) === 'inactive').length,
  }

  // ── ALPHABETICAL SORT + FILTER ──
  const filtered = [...members]
    .map((m, i) => ({ ...m, _origIdx: i }))
    .sort((a, b) => a.name.localeCompare(b.name))
    .filter(m => {
      const matchSearch = m.name.toLowerCase().includes(search.toLowerCase())
      const matchFilter = filter === 'all' || getStatus(m, curMonth) === filter
      return matchSearch && matchFilter
    })

  const handleAdd = async () => {
    if (!newName.trim()) return
    setSaving(true)
    const paid = new Array(12).fill(0)
    const next = [...members, { name: newName.trim(), paid, joinMonth: newJoin }]
    setMembers(next)
    await saveData(next, undefined, undefined)
    setNewName(''); setNewJoin(0); setShowAdd(false); setSaving(false)
  }

  const handleRemove = async (idx) => {
    if (!window.confirm(`Remove ${members[idx].name}?`)) return
    const next = members.filter((_, i) => i !== idx)
    setMembers(next)
    await saveData(next, undefined, undefined)
    setSelected(null)
  }

  return (
    <div className="mpage">

      {/* ── HEADER ── */}
      <div className="mpage-header">
        <div className="mpage-header-inner">
          <div>
            <div className="mpage-tag">
              <div className="mpage-tag-dot" />
              Season 2026
            </div>
            <div className="mpage-h1">
              The<br /><span>Squad</span>
            </div>
            <div className="mpage-subtitle">
              {members.length} players · {counts.paid} paid this month
            </div>
          </div>
          {isAdmin && (
            <button className="mpage-add-btn" onClick={() => setShowAdd(true)}>
              <Plus size={20} strokeWidth={2.5} />
            </button>
          )}
        </div>
      </div>

      {/* ── STATS STRIP ── */}
      <div className="mpage-stats">
        {[
          { val: members.length,  label: 'Total'                          },
          { val: counts.paid,     label: 'Paid',     color: '#22c55e'     },
          { val: counts.partial,  label: 'Partial',  color: '#f59e0b'     },
          { val: counts.inactive, label: 'Inactive', color: '#475569'     },
        ].map((s, i) => (
          <div key={i} className="mpage-stat">
            <div className="mpage-stat-val" style={{ color: s.color || '#fff' }}>{s.val}</div>
            <div className="mpage-stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── CONTROLS ── */}
      <div className="mpage-controls">
        <div className="mpage-search">
          <Search size={15} className="mpage-search-icon" />
          <input
            placeholder="Search player..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="mpage-filters">
          {[
            { key: 'all',      label: 'All'      },
            { key: 'paid',     label: 'Paid'     },
            { key: 'partial',  label: 'Partial'  },
            { key: 'inactive', label: 'Inactive' },
          ].map(f => (
            <button key={f.key}
              className={`mpage-chip ${filter === f.key ? 'on' : 'off'}`}
              onClick={() => setFilter(f.key)}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── LIST ── */}
      <div className="mpage-list">

        {loading && [1,2,3,4].map(i => <div key={i} className="mskeleton" />)}

        {!loading && filtered.length === 0 && (
          <div className="mpage-empty">
            <div className="mpage-empty-icon">
              <Users size={28} color="var(--green)" strokeWidth={1.5} />
            </div>
            <div className="mpage-empty-title">
              {members.length === 0 ? 'No players yet' : 'No results'}
            </div>
            <div className="mpage-empty-sub">
              {members.length === 0
                ? isAdmin ? 'Tap + to add your first player' : 'Admin hasn\'t added players yet'
                : 'Try a different search or filter'
              }
            </div>
          </div>
        )}

        {!loading && filtered.map((m, i) => {
          const status = getStatus(m, curMonth)
          const ss = STATUS[status]
          const [bg, fg] = getColor(m.name)
          const total = m.paid.reduce((s, v) => s + v, 0)
          const paidM = m.paid.filter(v => v > 0).length

          return (
            <div key={i}
              className={`mcard status-${status}`}
              style={{ animationDelay: `${i * 0.03}s` }}
              onClick={() => setSelected({ ...m, _idx: m._origIdx })}>

              <div className="mcard-top">
                <div className="mcard-avatar" style={{ background: bg, color: fg }}>
                  {m.name.charAt(0).toUpperCase()}
                </div>
                <div className="mcard-info">
                  <div className="mcard-name">{m.name}</div>
                  <div className="mcard-meta">{paidM} of 12 months paid</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="mcard-amount" style={{ color: ss.color }}>
                    ₹{total.toLocaleString()}
                  </div>
                  <div style={{
                    fontSize: 9, fontWeight: 700, textTransform: 'uppercase',
                    letterSpacing: 1, color: ss.color, marginTop: 3, opacity: 0.8
                  }}>{ss.label}</div>
                </div>
              </div>

              <div className="mcard-dots">
                {MONTHS.map((mo, mi) => (
                  <div key={mi} className="mcard-dot"
                    style={{
                      background: m.paid[mi] > 0 ? ss.color : 'rgba(255,255,255,0.06)'
                    }}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* ══ ADD SHEET ══ */}
      {showAdd && (
        <>
          <div className="msheet-overlay" onClick={() => setShowAdd(false)} />
          <div className="msheet">
            <div className="msheet-handle" />
            <div className="msheet-header">
              <div className="msheet-title">Add Player</div>
              <button className="msheet-close" onClick={() => setShowAdd(false)}>
                <X size={15} />
              </button>
            </div>
            <div className="msheet-body">
              <label className="mform-label">Player Name</label>
              <input className="mform-input" placeholder="Enter full name"
                value={newName} onChange={e => setNewName(e.target.value)}
                autoFocus onKeyDown={e => e.key === 'Enter' && handleAdd()} />
              <label className="mform-label">Joining Month</label>
              <select className="mform-input" value={newJoin}
                onChange={e => setNewJoin(parseInt(e.target.value))}
                style={{ appearance: 'none' }}>
                {MONTHS.map((m, i) => (
                  <option key={i} value={i} style={{ background: '#080e08' }}>{m}</option>
                ))}
              </select>
              <button className="mform-btn" onClick={handleAdd} disabled={saving}>
                {saving ? 'Adding...' : 'Add to Squad'}
              </button>
            </div>
          </div>
        </>
      )}

      {/* ══ DETAIL SHEET ══ */}
      {selected && (() => {
        const status = getStatus(selected, curMonth)
        const ss = STATUS[status]
        const [bg, fg] = getColor(selected.name)
        const total = selected.paid.reduce((s, v) => s + v, 0)
        const paidM = selected.paid.filter(v => v > 0).length
        return (
          <>
            <div className="msheet-overlay" onClick={() => setSelected(null)} />
            <div className="msheet">
              <div className="msheet-handle" />
              <div className="msheet-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div className="mcard-avatar"
                    style={{ width: 40, height: 40, borderRadius: 12, fontSize: 16, background: bg, color: fg }}>
                    {selected.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="msheet-title">{selected.name}</div>
                    <div style={{ fontSize: 11, color: ss.color, fontWeight: 700, marginTop: 1 }}>
                      {ss.label}
                    </div>
                  </div>
                </div>
                <button className="msheet-close" onClick={() => setSelected(null)}>
                  <X size={15} />
                </button>
              </div>

              <div className="msheet-body">

                {/* stats */}
                <div className="mdetail-stats">
                  {[
                    { label: 'Total Paid', val: `₹${total.toLocaleString()}`, color: 'var(--green)' },
                    { label: 'Months',     val: `${paidM}/12`,                color: '#fff'         },
                    { label: 'This Month', val: selected.paid[curMonth] > 0 ? 'Paid' : 'Due',
                      color: selected.paid[curMonth] > 0 ? 'var(--green)' : 'var(--red)' },
                  ].map((s, i) => (
                    <div key={i} className="mdetail-stat">
                      <div className="mdetail-stat-label">{s.label}</div>
                      <div className="mdetail-stat-val" style={{ color: s.color, fontSize: i === 0 ? 18 : 16 }}>
                        {s.val}
                      </div>
                    </div>
                  ))}
                </div>

                {/* payment grid */}
                <div className="mpay-label">Payment History</div>
                <div className="mpay-grid">
                  {MONTHS.map((mo, mi) => {
                    const v = selected.paid[mi]
                    const paid = v > 0
                    return (
                      <div key={mi} className={`mpay-cell ${paid ? 'paid' : 'unpaid'}`}>
                        {paid
                          ? <Check size={11} color="var(--green)" strokeWidth={3} />
                          : <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
                        }
                        <div className="mpay-month">{mo}</div>
                        {paid && <div className="mpay-amt">₹{v}</div>}
                      </div>
                    )
                  })}
                </div>

                {isAdmin && (
                  <button className="mform-danger"
                    onClick={() => handleRemove(selected._idx)}>
                    Remove Player
                  </button>
                )}
              </div>
            </div>
          </>
        )
      })()}

    </div>
  )
}