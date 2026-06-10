import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import {
  Lock, ShieldCheck, Plus, X, Check,
  Wallet, AlertTriangle, ChevronRight,
  Eye, EyeOff, LogOut
} from 'lucide-react'
import './Admin.css'

const DEFAULT_PASSWORD = 'gcc2026'

const AVATAR_COLORS = [
  ['#0d2b1a','#22c55e'], ['#1a0d2b','#a855f7'],
  ['#2b1a0d','#f59e0b'], ['#0d1a2b','#3b82f6'],
  ['#2b0d1a','#ec4899'], ['#0d2b2b','#06b6d4'],
]

const EXP_COLORS = {
  'Bat repair': '#f59e0b', 'Ball box': '#3b82f6',
  'New gloves': '#8b5cf6', 'New pad': '#06b6d4',
  'New bat': '#ec4899', 'Helmet': '#f97316',
  'Ground fee': '#22c55e', 'Jersey': '#a855f7', 'Other': '#6b7280'
}

function getColor(name) {
  const i = name.charCodeAt(0) % AVATAR_COLORS.length
  return AVATAR_COLORS[i]
}

function Toast({ msg }) {
  return <div className="success-toast">{msg}</div>
}

export default function Admin() {
  const {
    members, setMembers,
    expenses, setExpenses,
    oldBalance, setOldBalance,
    isAdmin, setIsAdmin,
    saveData, resetData,
    MONTHS, EXP_CATS
  } = useApp()

  // login
  const [pw, setPw] = useState('')
  const [pwError, setPwError] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [adminPw, setAdminPw] = useState(DEFAULT_PASSWORD)

  // sheets
  const [sheet, setSheet] = useState(null)
  const [selMember, setSelMember] = useState(null)

  // pay amount
  const [payAmount, setPayAmount] = useState('100')
  const [payMonthIdx, setPayMonthIdx] = useState(null)
  const [showPayInput, setShowPayInput] = useState(false)

  // forms
  const [newName, setNewName] = useState('')
  const [newJoin, setNewJoin] = useState(0)
  const [expCat, setExpCat] = useState(EXP_CATS[0])
  const [expMonth, setExpMonth] = useState(new Date().getMonth())
  const [expAmount, setExpAmount] = useState('')
  const [newBalance, setNewBalance] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const [resetConfirm, setResetConfirm] = useState(false)

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }

  const closeSheet = () => {
    setSheet(null)
    setSelMember(null)
    setNewName('')
    setNewJoin(0)
    setExpAmount('')
    setNewBalance('')
    setNewPw('')
    setConfirmPw('')
    setResetConfirm(false)
    setSaving(false)
    setShowPayInput(false)
    setPayAmount('100')
  }

  // ── LOGIN ──
  const handleLogin = () => {
    if (pw === adminPw) {
      setIsAdmin(true)
      setPwError('')
      setPw('')
    } else {
      setPwError('Wrong password. Try again.')
    }
  }

  // ── ADD MEMBER ──
  const handleAddMember = async () => {
    if (!newName.trim()) return
    setSaving(true)
    const paid = new Array(12).fill(0)
    const next = [...members, { name: newName.trim(), paid, joinMonth: newJoin }]
    setMembers(next)
    await saveData(next, undefined, undefined)
    showToast(`${newName.trim()} added!`)
    closeSheet()
  }

  // ── CELL TAP ──
  const handleCellTap = (memberIdx, monthIdx) => {
    const current = members[memberIdx].paid[monthIdx]
    if (current > 0) {
      // already paid — toggle off
      handleTogglePay(memberIdx, monthIdx, 0)
    } else {
      // show amount input
      setPayMonthIdx(monthIdx)
      setPayAmount('100')
      setShowPayInput(true)
    }
  }

  // ── TOGGLE PAYMENT ──
  const handleTogglePay = async (memberIdx, monthIdx, amount) => {
    const next = members.map((m, i) => {
      if (i !== memberIdx) return m
      const paid = [...m.paid]
      paid[monthIdx] = amount
      return { ...m, paid }
    })
    setMembers(next)
    await saveData(next, undefined, undefined)
    setSelMember({ ...next[memberIdx], _idx: memberIdx })
    setShowPayInput(false)
    if (amount > 0) showToast(`₹${amount} marked for ${MONTHS[monthIdx]}`)
    else showToast(`${MONTHS[monthIdx]} payment removed`)
  }

  // ── REMOVE MEMBER ──
  const handleRemoveMember = async (idx) => {
    const name = members[idx].name
    const next = members.filter((_, i) => i !== idx)
    setMembers(next)
    await saveData(next, undefined, undefined)
    showToast(`${name} removed`)
    closeSheet()
  }

  // ── ADD EXPENSE ──
  const handleAddExpense = async () => {
    const amt = parseInt(expAmount)
    if (!amt || amt <= 0) return
    setSaving(true)
    const next = { ...expenses }
    if (!next[expCat]) next[expCat] = new Array(12).fill(0)
    else next[expCat] = [...next[expCat]]
    next[expCat][expMonth] += amt
    setExpenses(next)
    await saveData(undefined, next, undefined)
    showToast(`₹${amt} added to ${expCat}`)
    closeSheet()
  }

  // ── EDIT BALANCE ──
  const handleEditBalance = async () => {
    const val = parseInt(newBalance)
    if (isNaN(val)) return
    setSaving(true)
    setOldBalance(val)
    await saveData(undefined, undefined, val)
    showToast('Balance updated!')
    closeSheet()
  }

  // ── CHANGE PASSWORD ──
  const handleChangePw = () => {
    if (!newPw || newPw.length < 4) {
      setPwError('Password must be at least 4 characters')
      return
    }
    if (newPw !== confirmPw) {
      setPwError('Passwords do not match')
      return
    }
    setAdminPw(newPw)
    showToast('Password changed!')
    closeSheet()
  }

  // ── RESET ──
  const handleReset = async () => {
    if (!resetConfirm) {
      setResetConfirm(true)
      return
    }
    await resetData()
    showToast('All data reset!')
    closeSheet()
  }

  // ── LOCKED STATE ──
  if (!isAdmin) {
    return (
      <div className="admin-locked">
        <div className="admin-lock-icon">
          <Lock size={32} color="var(--green)" strokeWidth={2} />
        </div>
        <div className="admin-lock-title">Admin Access</div>
        <div className="admin-lock-sub">Enter password to manage club data</div>
        <div className="admin-lock-form">
          <div style={{ position: 'relative' }}>
            <input
              className="admin-pw-input"
              type={showPw ? 'text' : 'password'}
              placeholder="Enter password"
              value={pw}
              onChange={e => { setPw(e.target.value); setPwError('') }}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              autoFocus
            />
            <button
              onClick={() => setShowPw(!showPw)}
              style={{
                position: 'absolute', right: 14, top: '50%',
                transform: 'translateY(-60%)',
                background: 'none', border: 'none',
                color: 'var(--t3)', cursor: 'pointer', padding: 4
              }}>
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {pwError && <div className="admin-pw-error">{pwError}</div>}
          <button className="admin-login-btn" onClick={handleLogin}>
            Login
          </button>
        </div>
      </div>
    )
  }

  // ── UNLOCKED STATE ──
  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>

      {toast && <Toast msg={toast} />}

      {/* ── HEADER ── */}
      <div className="admin-header">
        <div className="admin-header-top">
          <div>
            <div className="admin-title">Admin</div>
            <div style={{ fontSize: 12, color: 'var(--t2)', marginTop: 2 }}>
              Full access enabled
            </div>
          </div>
          <div className="admin-badge">
            <ShieldCheck size={12} strokeWidth={2.5} />
            Logged in
          </div>
        </div>
      </div>

      <div className="admin-body">

        {/* ── QUICK ACTIONS ── */}
        <div className="admin-section">
          <div className="admin-section-label">Quick Actions</div>
          <div className="admin-action-row">
            <button className="admin-action-btn"
              style={{ background: 'rgba(34,197,94,0.1)', color: 'var(--green)', border: '1px solid rgba(34,197,94,0.2)' }}
              onClick={() => setSheet('add-member')}>
              <Plus size={15} strokeWidth={2.5} /> Add Member
            </button>
            <button className="admin-action-btn"
              style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--red)', border: '1px solid rgba(239,68,68,0.2)' }}
              onClick={() => setSheet('add-expense')}>
              <Plus size={15} strokeWidth={2.5} /> Add Expense
            </button>
          </div>
        </div>

        {/* ── MEMBERS ── */}
        <div className="admin-section">
          <div className="admin-section-label">Members ({members.length})</div>
          {members.length === 0 && (
            <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--t3)', fontSize: 13 }}>
              No members yet — tap Add Member
            </div>
          )}
          {members.map((m, i) => {
            const [bg, fg] = getColor(m.name)
            const paidCount = m.paid.filter(v => v > 0).length
            const total = m.paid.reduce((s, v) => s + v, 0)
            return (
              <div key={i} className="admin-member-row"
                onClick={() => { setSelMember({ ...m, _idx: i }); setSheet('member-detail') }}>
                <div className="admin-member-avatar" style={{ background: bg, color: fg }}>
                  {m.name.charAt(0).toUpperCase()}
                </div>
                <div className="admin-member-info">
                  <div className="admin-member-name">{m.name}</div>
                  <div className="admin-member-sub">{paidCount} months · ₹{total.toLocaleString()}</div>
                </div>
                <div className="admin-member-dots">
                  {MONTHS.map((_, mi) => (
                    <div key={mi} className="admin-member-dot"
                      style={{ background: m.paid[mi] > 0 ? 'var(--green)' : 'rgba(255,255,255,0.08)' }} />
                  ))}
                </div>
                <ChevronRight size={14} color="var(--t3)" />
              </div>
            )
          })}
        </div>

        {/* ── RECENT EXPENSES ── */}
        <div className="admin-section">
          <div className="admin-section-label">Recent Expenses</div>
          {Object.entries(expenses)
            .flatMap(([cat, vals]) =>
              vals.map((v, mi) => v > 0 ? { cat, amount: v, mi } : null).filter(Boolean)
            )
            .sort((a, b) => b.mi - a.mi)
            .slice(0, 5)
            .map((e, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', background: 'var(--card)',
                border: '1px solid rgba(255,255,255,0.05)',
                borderRadius: 12, marginBottom: 8
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 10,
                  background: `${EXP_COLORS[e.cat] || '#6b7280'}18`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  <div style={{ width: 7, height: 7, borderRadius: 2, background: EXP_COLORS[e.cat] || '#6b7280' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)' }}>{e.cat}</div>
                  <div style={{ fontSize: 11, color: 'var(--t3)' }}>{MONTHS[e.mi]} 2026</div>
                </div>
                <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--red)', fontVariantNumeric: 'tabular-nums' }}>
                  −₹{e.amount.toLocaleString()}
                </div>
              </div>
            ))
          }
          {Object.values(expenses).flat().filter(v => v > 0).length === 0 && (
            <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--t3)', fontSize: 13 }}>
              No expenses yet
            </div>
          )}
        </div>

        {/* ── SETTINGS ── */}
        <div className="admin-section">
          <div className="admin-section-label">Settings</div>

          <div className="settings-row"
            onClick={() => { setNewBalance(String(oldBalance)); setSheet('edit-balance') }}>
            <div className="settings-row-left">
              <div className="settings-row-icon" style={{ background: 'rgba(59,130,246,0.1)' }}>
                <Wallet size={15} color="var(--blue)" strokeWidth={2} />
              </div>
              <div>
                <div className="settings-row-label">Old Balance</div>
                <div className="settings-row-sub">Carry-over · ₹{oldBalance.toLocaleString()}</div>
              </div>
            </div>
            <ChevronRight size={14} color="var(--t3)" />
          </div>

          <div className="settings-row" onClick={() => setSheet('change-pw')}>
            <div className="settings-row-left">
              <div className="settings-row-icon" style={{ background: 'rgba(34,197,94,0.1)' }}>
                <Lock size={15} color="var(--green)" strokeWidth={2} />
              </div>
              <div>
                <div className="settings-row-label">Change Password</div>
                <div className="settings-row-sub">Update admin password</div>
              </div>
            </div>
            <ChevronRight size={14} color="var(--t3)" />
          </div>

          <div className="danger-zone" onClick={() => setSheet('reset')}>
            <div className="settings-row-left">
              <div className="settings-row-icon" style={{ background: 'rgba(239,68,68,0.1)' }}>
                <AlertTriangle size={15} color="var(--red)" strokeWidth={2} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--red)' }}>Reset All Data</div>
                <div style={{ fontSize: 11, color: 'rgba(239,68,68,0.5)', marginTop: 1 }}>Permanently delete everything</div>
              </div>
            </div>
            <ChevronRight size={14} color="var(--red)" />
          </div>

          <button className="logout-btn"
            onClick={() => { setIsAdmin(false); setPw('') }}>
            <LogOut size={15} style={{ marginRight: 6, verticalAlign: 'middle' }} />
            Logout
          </button>
        </div>

      </div>

      {/* ══════════════ SHEETS ══════════════ */}
      {sheet && (
        <>
          <div className="admin-sheet-overlay" onClick={closeSheet} />
          <div className="admin-sheet">
            <div className="admin-sheet-handle" />

            {/* ── ADD MEMBER ── */}
            {sheet === 'add-member' && (
              <>
                <div className="admin-sheet-header">
                  <div className="admin-sheet-title">Add Member</div>
                  <button className="admin-sheet-close" onClick={closeSheet}><X size={16} /></button>
                </div>
                <div className="admin-sheet-body">
                  <label className="input-label-admin">Player Name</label>
                  <input className="input-field-admin" placeholder="Enter full name"
                    value={newName} onChange={e => setNewName(e.target.value)} autoFocus />
                  <label className="input-label-admin">Joining Month</label>
                  <select className="input-field-admin" value={newJoin}
                    onChange={e => setNewJoin(parseInt(e.target.value))}
                    style={{ appearance: 'none' }}>
                    {MONTHS.map((m, i) => (
                      <option key={i} value={i} style={{ background: '#0c130c' }}>{m}</option>
                    ))}
                  </select>
                  <button className="primary-btn-admin" onClick={handleAddMember} disabled={saving}>
                    {saving ? 'Adding...' : 'Add Player'}
                  </button>
                </div>
              </>
            )}

            {/* ── MEMBER DETAIL ── */}
            {sheet === 'member-detail' && selMember && (
              <>
                <div className="admin-sheet-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div className="admin-member-avatar"
                      style={{
                        width: 34, height: 34, borderRadius: 10, fontSize: 13,
                        background: getColor(selMember.name)[0],
                        color: getColor(selMember.name)[1]
                      }}>
                      {selMember.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="admin-sheet-title">{selMember.name}</div>
                  </div>
                  <button className="admin-sheet-close" onClick={closeSheet}><X size={16} /></button>
                </div>
                <div className="admin-sheet-body">

                  {/* stats */}
                  <div style={{
                    display: 'flex', gap: 0, marginBottom: 20,
                    paddingBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.05)'
                  }}>
                    {[
                      { label: 'Total Paid', val: `₹${selMember.paid.reduce((s,v)=>s+v,0).toLocaleString()}`, color: 'var(--green)' },
                      { label: 'Months Paid', val: `${selMember.paid.filter(v=>v>0).length}/12`, color: 'var(--t1)' },
                    ].map((s, i) => (
                      <div key={i} style={{
                        flex: 1,
                        paddingLeft: i > 0 ? 16 : 0,
                        marginLeft: i > 0 ? 16 : 0,
                        borderLeft: i > 0 ? '1px solid rgba(255,255,255,0.05)' : 'none'
                      }}>
                        <div style={{ fontSize: 10, color: 'var(--t3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>{s.label}</div>
                        <div style={{ fontSize: 18, fontWeight: 800, color: s.color }}>{s.val}</div>
                      </div>
                    ))}
                  </div>

                  {/* payment grid */}
                  <div style={{ fontSize: 11, color: 'var(--t2)', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>
                    Tap month to toggle payment
                  </div>
                  <div className="payment-grid-admin">
                    {MONTHS.map((mo, mi) => {
                      const paid = selMember.paid[mi] > 0
                      return (
                        <div key={mi}
                          className={`payment-cell-admin ${paid ? 'paid' : 'unpaid'}`}
                          onClick={() => handleCellTap(selMember._idx, mi)}>
                          {paid && <Check size={10} strokeWidth={3} />}
                          <span>{mo}</span>
                          {paid && (
                            <span style={{ fontSize: 9, opacity: 0.8 }}>
                              ₹{selMember.paid[mi]}
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  {/* amount input popup */}
                  {showPayInput && (
                    <div style={{
                      background: 'rgba(34,197,94,0.06)',
                      border: '1px solid rgba(34,197,94,0.2)',
                      borderRadius: 16, padding: 16, marginBottom: 16
                    }}>
                      <div style={{ fontSize: 12, color: 'var(--green)', fontWeight: 700, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>
                        {MONTHS[payMonthIdx]} — Enter Amount
                      </div>
                      {/* quick amount buttons */}
                      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                        {[100, 200, 500, 1200].map(amt => (
                          <button key={amt}
                            onClick={() => setPayAmount(String(amt))}
                            style={{
                              flex: 1, padding: '8px 4px',
                              borderRadius: 10, border: 'none',
                              background: payAmount === String(amt) ? 'var(--green)' : 'rgba(255,255,255,0.05)',
                              color: payAmount === String(amt) ? '#000' : 'var(--t2)',
                              fontSize: 12, fontWeight: 700, cursor: 'pointer'
                            }}>
                            ₹{amt}
                          </button>
                        ))}
                      </div>
                      <input
                        className="input-field-admin"
                        type="number"
                        placeholder="Custom amount"
                        value={payAmount}
                        onChange={e => setPayAmount(e.target.value)}
                        style={{ marginBottom: 10 }}
                      />
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          onClick={() => setShowPayInput(false)}
                          style={{
                            flex: 1, padding: 12,
                            background: 'rgba(255,255,255,0.04)',
                            color: 'var(--t2)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer'
                          }}>
                          Cancel
                        </button>
                        <button
                          onClick={() => handleTogglePay(selMember._idx, payMonthIdx, parseInt(payAmount) || 100)}
                          style={{
                            flex: 1, padding: 12,
                            background: 'var(--green)', color: '#000',
                            border: 'none', borderRadius: 12,
                            fontSize: 13, fontWeight: 800, cursor: 'pointer'
                          }}>
                          Save ₹{payAmount}
                        </button>
                      </div>
                    </div>
                  )}

                  <button className="danger-btn-admin"
                    onClick={() => handleRemoveMember(selMember._idx)}>
                    Remove Member
                  </button>
                </div>
              </>
            )}

            {/* ── ADD EXPENSE ── */}
            {sheet === 'add-expense' && (
              <>
                <div className="admin-sheet-header">
                  <div className="admin-sheet-title">Add Expense</div>
                  <button className="admin-sheet-close" onClick={closeSheet}><X size={16} /></button>
                </div>
                <div className="admin-sheet-body">
                  <label className="input-label-admin">Category</label>
                  <select className="input-field-admin" value={expCat}
                    onChange={e => setExpCat(e.target.value)} style={{ appearance: 'none' }}>
                    {EXP_CATS.map(c => (
                      <option key={c} value={c} style={{ background: '#0c130c' }}>{c}</option>
                    ))}
                  </select>
                  <label className="input-label-admin">Month</label>
                  <select className="input-field-admin" value={expMonth}
                    onChange={e => setExpMonth(parseInt(e.target.value))} style={{ appearance: 'none' }}>
                    {MONTHS.map((m, i) => (
                      <option key={i} value={i} style={{ background: '#0c130c' }}>{m}</option>
                    ))}
                  </select>
                  <label className="input-label-admin">Amount (₹)</label>
                  <input className="input-field-admin" type="number" placeholder="0"
                    value={expAmount} onChange={e => setExpAmount(e.target.value)} />
                  <button className="primary-btn-admin"
                    onClick={handleAddExpense}
                    disabled={saving || !expAmount}>
                    {saving ? 'Saving...' : 'Add Expense'}
                  </button>
                </div>
              </>
            )}

            {/* ── EDIT BALANCE ── */}
            {sheet === 'edit-balance' && (
              <>
                <div className="admin-sheet-header">
                  <div className="admin-sheet-title">Edit Old Balance</div>
                  <button className="admin-sheet-close" onClick={closeSheet}><X size={16} /></button>
                </div>
                <div className="admin-sheet-body">
                  <div style={{ fontSize: 13, color: 'var(--t2)', marginBottom: 16 }}>
                    Carry-over balance from 2025 added to the total club balance.
                  </div>
                  <label className="input-label-admin">Balance (₹)</label>
                  <input className="input-field-admin" type="number"
                    placeholder="e.g. 3950"
                    value={newBalance}
                    onChange={e => setNewBalance(e.target.value)} autoFocus />
                  <button className="primary-btn-admin" onClick={handleEditBalance} disabled={saving}>
                    {saving ? 'Saving...' : 'Update Balance'}
                  </button>
                </div>
              </>
            )}

            {/* ── CHANGE PASSWORD ── */}
            {sheet === 'change-pw' && (
              <>
                <div className="admin-sheet-header">
                  <div className="admin-sheet-title">Change Password</div>
                  <button className="admin-sheet-close" onClick={closeSheet}><X size={16} /></button>
                </div>
                <div className="admin-sheet-body">
                  <label className="input-label-admin">New Password</label>
                  <input className="input-field-admin" type="password"
                    placeholder="Min 4 characters"
                    value={newPw}
                    onChange={e => { setNewPw(e.target.value); setPwError('') }} autoFocus />
                  <label className="input-label-admin">Confirm Password</label>
                  <input className="input-field-admin" type="password"
                    placeholder="Repeat password"
                    value={confirmPw}
                    onChange={e => { setConfirmPw(e.target.value); setPwError('') }} />
                  {pwError && (
                    <div style={{ fontSize: 12, color: 'var(--red)', marginBottom: 12, fontWeight: 600 }}>
                      {pwError}
                    </div>
                  )}
                  <button className="primary-btn-admin" onClick={handleChangePw}>
                    Change Password
                  </button>
                </div>
              </>
            )}

            {/* ── RESET ── */}
            {sheet === 'reset' && (
              <>
                <div className="admin-sheet-header">
                  <div className="admin-sheet-title" style={{ color: 'var(--red)' }}>Reset All Data</div>
                  <button className="admin-sheet-close" onClick={closeSheet}><X size={16} /></button>
                </div>
                <div className="admin-sheet-body">
                  <div style={{ textAlign: 'center', padding: '20px 0' }}>
                    <AlertTriangle size={40} color="var(--red)" strokeWidth={1.5}
                      style={{ marginBottom: 12 }} />
                    <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--t1)', marginBottom: 8 }}>
                      Are you sure?
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--t2)', marginBottom: 24 }}>
                      This will permanently delete all members, payments and expenses. This cannot be undone.
                    </div>
                    {resetConfirm && (
                      <div style={{ fontSize: 12, color: 'var(--red)', fontWeight: 700, marginBottom: 12 }}>
                        Tap again to confirm deletion!
                      </div>
                    )}
                    <button className="danger-btn-admin"
                      style={{ marginTop: 0 }} onClick={handleReset}>
                      {resetConfirm ? 'Yes, Delete Everything' : 'Reset All Data'}
                    </button>
                    <button style={{
                      width: '100%', padding: 13, marginTop: 8,
                      background: 'rgba(255,255,255,0.04)',
                      color: 'var(--t2)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 16, fontSize: 14, fontWeight: 700, cursor: 'pointer'
                    }} onClick={closeSheet}>
                      Cancel
                    </button>
                  </div>
                </div>
              </>
            )}

          </div>
        </>
      )}

    </div>
  )
}