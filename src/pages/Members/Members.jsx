import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { Search, Plus, X, Check, Users } from 'lucide-react'
import './Members.css'

const AVATAR_COLORS = [
  ['#0d2b1a','#22c55e'], ['#1a0d2b','#a855f7'],
  ['#2b1a0d','#f59e0b'], ['#0d1a2b','#3b82f6'],
  ['#2b0d1a','#ec4899'], ['#0d2b2b','#06b6d4'],
]

function getColor(name) {
  const i = name.charCodeAt(0) % AVATAR_COLORS.length
  return AVATAR_COLORS[i]
}

function getMemberStatus(member, curMonth) {
  const paidMonths = member.paid.filter(v => v > 0).length
  if (paidMonths === 0) return 'inactive'
  if (paidMonths >= curMonth + 1) return 'paid'
  return 'partial'
}

const STATUS_STYLES = {
  paid:     { label: 'Paid',     bg: 'rgba(34,197,94,0.12)',   color: '#22c55e' },
  partial:  { label: 'Partial',  bg: 'rgba(245,158,11,0.12)',  color: '#f59e0b' },
  inactive: { label: 'Inactive', bg: 'rgba(255,255,255,0.06)', color: '#475569' },
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

  const filtered = members.filter(m => {
    const matchSearch = m.name.toLowerCase().includes(search.toLowerCase())
    const status = getMemberStatus(m, curMonth)
    const matchFilter = filter === 'all' || status === filter
    return matchSearch && matchFilter
  })

  const counts = {
    all: members.length,
    paid: members.filter(m => getMemberStatus(m, curMonth) === 'paid').length,
    partial: members.filter(m => getMemberStatus(m, curMonth) === 'partial').length,
    inactive: members.filter(m => getMemberStatus(m, curMonth) === 'inactive').length,
  }

  const handleAdd = async () => {
    if (!newName.trim()) return
    setSaving(true)
    const paid = new Array(12).fill(0)
    const next = [...members, { name: newName.trim(), paid, joinMonth: newJoin }]
    setMembers(next)
    await saveData(next, undefined, undefined)
    setNewName('')
    setNewJoin(0)
    setShowAdd(false)
    setSaving(false)
  }

  const handleRemove = async (idx) => {
    if (!window.confirm(`Remove ${members[idx].name}?`)) return
    const next = members.filter((_, i) => i !== idx)
    setMembers(next)
    await saveData(next, undefined, undefined)
    setSelected(null)
  }

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>

      {/* ── HEADER ── */}
      <div className="members-header">
        <div className="members-header-top">
          <div>
            <div className="members-title">Squad</div>
            <div className="members-count">{members.length} members · {counts.paid} paid this month</div>
          </div>
          {isAdmin && (
            <button className="members-add-btn" onClick={() => setShowAdd(true)}>
              <Plus size={18} strokeWidth={2.5} />
            </button>
          )}
        </div>

        {/* search */}
        <div className="members-search">
          <Search size={15} className="members-search-icon" />
          <input
            placeholder="Search member..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* filters */}
        <div className="members-filters">
          {[
            { key: 'all', label: `All (${counts.all})` },
            { key: 'paid', label: `Paid (${counts.paid})` },
            { key: 'partial', label: `Partial (${counts.partial})` },
            { key: 'inactive', label: `Inactive (${counts.inactive})` },
          ].map(f => (
            <button key={f.key}
              className={`filter-chip ${filter === f.key ? 'active' : 'inactive'}`}
              onClick={() => setFilter(f.key)}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── LIST ── */}
      <div className="members-list">
        {loading && (
          <div style={{ padding: '40px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[1,2,3].map(i => (
              <div key={i} style={{ height: 90, borderRadius: 18, background: 'rgba(255,255,255,0.03)', animation: 'shimmer 1.8s infinite' }} />
            ))}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="empty-state">
            <div style={{ marginBottom: 12, opacity: 0.2 }}>
              <Users size={48} color="var(--green)" />
            </div>
            <div className="empty-title">
              {members.length === 0 ? 'No members yet' : 'No results found'}
            </div>
            <div className="empty-sub">
              {members.length === 0
                ? isAdmin ? 'Tap + to add your first player' : 'Admin has not added members yet'
                : 'Try a different search or filter'
              }
            </div>
          </div>
        )}

        {!loading && filtered.map((m, i) => {
          const status = getMemberStatus(m, curMonth)
          const ss = STATUS_STYLES[status]
          const [bg, fg] = getColor(m.name)
          const totalPaid = m.paid.reduce((s, v) => s + v, 0)
          const paidMonths = m.paid.filter(v => v > 0).length

          return (
            <div key={i} className="member-card"
              onClick={() => setSelected({ ...m, _idx: members.indexOf(m) })}>
              <div className="member-card-top">
                <div className="member-avatar" style={{ background: bg, color: fg }}>
                  {m.name.charAt(0).toUpperCase()}
                </div>
                <div className="member-info">
                  <div className="member-name">{m.name}</div>
                  <div className="member-sub">{paidMonths} months paid · ₹{totalPaid.toLocaleString()} total</div>
                </div>
                <div className="member-badge" style={{ background: ss.bg, color: ss.color }}>
                  {ss.label}
                </div>
              </div>

              {/* month dots */}
              <div className="member-months">
                {MONTHS.map((mo, mi) => (
                  <div key={mi} className="month-dot"
                    title={mo}
                    style={{ background: m.paid[mi] > 0 ? 'var(--green)' : 'rgba(255,255,255,0.07)' }}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* ── ADD MEMBER SHEET ── */}
      {showAdd && (
        <>
          <div className="sheet-overlay" onClick={() => setShowAdd(false)} />
          <div className="sheet">
            <div className="sheet-handle" />
            <div className="sheet-header">
              <div className="sheet-title">Add Member</div>
              <button className="sheet-close" onClick={() => setShowAdd(false)}>
                <X size={16} />
              </button>
            </div>
            <div className="sheet-body">
              <div className="input-group">
                <div className="input-label">Player Name</div>
                <input
                  className="input-field"
                  placeholder="Enter full name"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="input-group">
                <div className="input-label">Joining Month</div>
                <select
                  className="input-field"
                  value={newJoin}
                  onChange={e => setNewJoin(parseInt(e.target.value))}
                  style={{ appearance: 'none' }}
                >
                  {MONTHS.map((m, i) => (
                    <option key={i} value={i} style={{ background: '#0f160f' }}>{m}</option>
                  ))}
                </select>
              </div>
              <button className="primary-btn" onClick={handleAdd} disabled={saving}>
                {saving ? 'Adding...' : 'Add Player'}
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── MEMBER DETAIL SHEET ── */}
      {selected && (
        <>
          <div className="sheet-overlay" onClick={() => setSelected(null)} />
          <div className="sheet">
            <div className="sheet-handle" />
            <div className="sheet-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div className="member-avatar"
                  style={{
                    width: 36, height: 36, borderRadius: 10, fontSize: 14,
                    background: getColor(selected.name)[0],
                    color: getColor(selected.name)[1]
                  }}>
                  {selected.name.charAt(0).toUpperCase()}
                </div>
                <div className="sheet-title">{selected.name}</div>
              </div>
              <button className="sheet-close" onClick={() => setSelected(null)}>
                <X size={16} />
              </button>
            </div>
            <div className="sheet-body">

              {/* stats row */}
              <div style={{ display: 'flex', gap: 0, marginBottom: 20, padding: '14px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                {[
                  { label: 'Total Paid', val: `₹${selected.paid.reduce((s,v)=>s+v,0).toLocaleString()}`, color: 'var(--green)' },
                  { label: 'Months', val: `${selected.paid.filter(v=>v>0).length}/12`, color: 'var(--t1)' },
                  { label: 'Status', val: STATUS_STYLES[getMemberStatus(selected, curMonth)].label, color: STATUS_STYLES[getMemberStatus(selected, curMonth)].color },
                ].map((s, i, arr) => (
                  <div key={i} style={{
                    flex: 1,
                    paddingLeft: i > 0 ? 14 : 0,
                    marginLeft: i > 0 ? 14 : 0,
                    borderLeft: i > 0 ? '1px solid rgba(255,255,255,0.05)' : 'none'
                  }}>
                    <div style={{ fontSize: 10, color: 'var(--t3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>{s.label}</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: s.color }}>{s.val}</div>
                  </div>
                ))}
              </div>

              {/* payment grid */}
              <div style={{ fontSize: 11, color: 'var(--t2)', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>
                Payment Grid
              </div>
              <div className="payment-grid">
                {MONTHS.map((mo, mi) => {
                  const paid = selected.paid[mi] > 0
                  return (
                    <div key={mi} className={`payment-cell ${paid ? 'paid' : 'unpaid'}`}>
                      {paid && <Check size={12} strokeWidth={3} />}
                      <span>{mo}</span>
                    </div>
                  )
                })}
              </div>

              {isAdmin && (
                <button className="danger-btn" onClick={() => handleRemove(selected._idx)}>
                  Remove Member
                </button>
              )}
            </div>
          </div>
        </>
      )}

    </div>
  )
}