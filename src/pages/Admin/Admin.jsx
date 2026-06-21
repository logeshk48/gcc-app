import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import {
  Lock, X, Check,
  Wallet, AlertTriangle, ChevronRight,
  Eye, EyeOff, LogOut, Users, Receipt, Pencil,
  IndianRupee
} from 'lucide-react'
import './Admin.css'

const DEFAULT_PASSWORD = 'gcc2026'

const AVATAR_COLORS = [
  ['#0d2b1a','#22c55e'], ['#1a0d2b','#a855f7'],
  ['#2b1a0d','#f59e0b'], ['#0d1a2b','#3b82f6'],
  ['#2b0d1a','#ec4899'], ['#0d2b2b','#06b6d4'],
  ['#1a2b0d','#84cc16'], ['#2b0d0d','#f97316'],
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
  return <div className="atoast">{msg}</div>
}

export default function Admin() {
  const {
    members, setMembers,
    expenses, setExpenses,
    oldBalance, setOldBalance,
    monthlyRate, setMonthlyRate,
    isAdmin, setIsAdmin,
    saveData, resetData,
    MONTHS, EXP_CATS, year
  } = useApp()

  const [pw, setPw] = useState('')
  const [pwError, setPwError] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [adminPw, setAdminPw] = useState(DEFAULT_PASSWORD)

  const [sheet, setSheet] = useState(null)
  const [selMember, setSelMember] = useState(null)

  // member detail is now a MODAL, not a sheet
  const [showMemberModal, setShowMemberModal] = useState(false)

  const [payAmount, setPayAmount] = useState('100')
  const [payMonthIdx, setPayMonthIdx] = useState(null)
  const [showPayPicker, setShowPayPicker] = useState(false)
  const [payMemberIdx, setPayMemberIdx] = useState(null)

  const [editName, setEditName] = useState('')
  const [showEditName, setShowEditName] = useState(false)

  const [editExp, setEditExp] = useState(null)
  const [editExpAmount, setEditExpAmount] = useState('')

  const [newName, setNewName] = useState('')
  const [newJoin, setNewJoin] = useState(0)
  const [expCat, setExpCat] = useState(EXP_CATS[0])
  const [expMonth, setExpMonth] = useState(new Date().getMonth())
  const [expAmount, setExpAmount] = useState('')
  const [newBalance, setNewBalance] = useState('')
  const [newMonthlyRate, setNewMonthlyRate] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const [resetConfirm, setResetConfirm] = useState(false)

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }

  const openSheet = (name) => {
    setSheet(name)
  }

  const closeSheet = () => {
    setSheet(null)
    setNewName(''); setNewJoin(0)
    setExpAmount(''); setNewBalance('')
    setNewMonthlyRate('')
    setNewPw(''); setConfirmPw('')
    setResetConfirm(false)
    setSaving(false)
    setPwError('')
    setEditExp(null)
    setEditExpAmount('')
  }

  const openMemberModal = (m) => {
    setSelMember(m)
    setShowMemberModal(true)
  }

  const closeMemberModal = () => {
    setShowMemberModal(false)
    setSelMember(null)
    setShowEditName(false)
    setEditName('')
  }

  const closePayPicker = () => {
    setShowPayPicker(false)
    setPayAmount(String(monthlyRate))
    setPayMonthIdx(null)
    setPayMemberIdx(null)
  }

  const handleLogin = () => {
    if (pw === adminPw) {
      setIsAdmin(true); setPwError(''); setPw('')
    } else {
      setPwError('Wrong password. Try again.')
    }
  }

  const handleAddMember = async () => {
    if (!newName.trim()) return
    setSaving(true)
    const paid = new Array(12).fill(0)
    const next = [...members, { name: newName.trim(), paid, joinMonth: newJoin }]
    setMembers(next)
    await saveData(next, undefined, undefined, undefined)
    showToast(`${newName.trim()} added!`)
    closeSheet()
  }

  const handleEditName = async () => {
    if (!editName.trim()) return
    const next = members.map((m, i) =>
      i === selMember._idx ? { ...m, name: editName.trim() } : m
    )
    setMembers(next)
    await saveData(next, undefined, undefined, undefined)
    setSelMember({ ...next[selMember._idx], _idx: selMember._idx })
    showToast('Name updated!')
    setShowEditName(false)
    setEditName('')
  }

  const handleCellTap = (memberIdx, monthIdx) => {
    const current = members[memberIdx].paid[monthIdx]
    if (current > 0) {
      handleTogglePay(memberIdx, monthIdx, 0)
    } else {
      setPayMemberIdx(memberIdx)
      setPayMonthIdx(monthIdx)
      setPayAmount(String(monthlyRate))
      setShowPayPicker(true)
    }
  }

  const handleTogglePay = async (memberIdx, monthIdx, amount) => {
    const next = members.map((m, i) => {
      if (i !== memberIdx) return m
      const paid = [...m.paid]
      paid[monthIdx] = amount
      return { ...m, paid }
    })
    setMembers(next)
    await saveData(next, undefined, undefined, undefined)
    setSelMember({ ...next[memberIdx], _idx: memberIdx })
    closePayPicker()
    if (amount > 0) showToast(`₹${amount} marked for ${MONTHS[monthIdx]}`)
    else showToast(`${MONTHS[monthIdx]} payment removed`)
  }

  const handleSavePay = () => {
    handleTogglePay(payMemberIdx, payMonthIdx, parseInt(payAmount) || monthlyRate)
  }

  const handleRemoveMember = async (idx) => {
    const name = members[idx].name
    const next = members.filter((_, i) => i !== idx)
    setMembers(next)
    await saveData(next, undefined, undefined, undefined)
    showToast(`${name} removed`)
    closeMemberModal()
  }

  const handleAddExpense = async () => {
    const amt = parseInt(expAmount)
    if (!amt || amt <= 0) return
    setSaving(true)
    const next = { ...expenses }
    if (!next[expCat]) next[expCat] = new Array(12).fill(0)
    else next[expCat] = [...next[expCat]]
    next[expCat][expMonth] += amt
    setExpenses(next)
    await saveData(undefined, next, undefined, undefined)
    showToast(`₹${amt} added to ${expCat}`)
    closeSheet()
  }

  const handleEditExpense = async () => {
    const amt = parseInt(editExpAmount)
    if (!amt || amt <= 0) return
    const next = { ...expenses }
    next[editExp.cat] = [...next[editExp.cat]]
    next[editExp.cat][editExp.mi] = amt
    setExpenses(next)
    await saveData(undefined, next, undefined, undefined)
    showToast(`Updated to ₹${amt}`)
    setEditExp(null)
    setEditExpAmount('')
  }

  const handleDeleteExpense = async (cat, mi) => {
    const next = { ...expenses }
    next[cat] = [...next[cat]]
    next[cat][mi] = 0
    setExpenses(next)
    await saveData(undefined, next, undefined, undefined)
    showToast(`${cat} expense removed`)
  }

  const handleEditBalance = async () => {
    const val = parseInt(newBalance)
    if (isNaN(val)) return
    setSaving(true)
    setOldBalance(val)
    await saveData(undefined, undefined, val, undefined)
    showToast('Balance updated!')
    closeSheet()
  }

  const handleEditRate = async () => {
    const val = parseInt(newMonthlyRate)
    if (isNaN(val) || val <= 0) return
    setSaving(true)
    setMonthlyRate(val)
    await saveData(undefined, undefined, undefined, val)
    showToast(`Monthly rate updated to ₹${val}!`)
    closeSheet()
  }

  const handleChangePw = () => {
    if (!newPw || newPw.length < 4) { setPwError('Min 4 characters'); return }
    if (newPw !== confirmPw) { setPwError('Passwords do not match'); return }
    setAdminPw(newPw)
    showToast('Password changed!')
    closeSheet()
  }

  const handleReset = async () => {
    if (!resetConfirm) { setResetConfirm(true); return }
    await resetData()
    showToast('All data reset!')
    closeSheet()
  }

  const sortedMembers = [...members]
    .map((m, i) => ({ ...m, _origIdx: i }))
    .sort((a, b) => a.name.localeCompare(b.name))

  if (!isAdmin) {
    return (
      <div className="alock">
        <div className="alock-bg" />
        <div className="alock-overlay" />
        <div className="alock-content">
          <div className="alock-icon">
            <Lock size={28} color="var(--green)" strokeWidth={2} />
          </div>
          <div className="alock-tag">Admin Access</div>
          <div className="alock-title">Welcome<br />Back</div>
          <div className="alock-sub">Enter your password to continue</div>
          <div className="alock-input-wrap">
            <input
              className="alock-input"
              type={showPw ? 'text' : 'password'}
              placeholder="Enter password"
              value={pw}
              onChange={e => { setPw(e.target.value); setPwError('') }}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              autoFocus
            />
            <button className="alock-eye" onClick={() => setShowPw(!showPw)}>
              {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
          {pwError && <div className="alock-error">{pwError}</div>}
          <button className="alock-btn" onClick={handleLogin}>
            Login to Admin
          </button>
        </div>
      </div>
    )
  }

  const allExpItems = Object.entries(expenses)
    .flatMap(([cat, vals]) =>
      vals.map((v, mi) => v > 0 ? { cat, amount: v, mi } : null).filter(Boolean)
    )
    .sort((a, b) => b.mi - a.mi)

  return (
    <div className="apage">
      {toast && <Toast msg={toast} />}

      {/* ══ MEMBER DETAIL — CENTERED POPUP MODAL ══ */}
      {showMemberModal && selMember && (
        <>
          <div className="amodal-overlay" onClick={closeMemberModal} />
          <div className="amodal">
            <div className="amodal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div className="amember-avatar"
                  style={{ width: 36, height: 36, borderRadius: 11, fontSize: 14,
                    background: getColor(selMember.name)[0],
                    color: getColor(selMember.name)[1] }}>
                  {selMember.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="amodal-title">{selMember.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--t2)', marginTop: 1 }}>
                    ₹{selMember.paid.reduce((s,v)=>s+v,0).toLocaleString()} total · {selMember.paid.filter(v=>v>0).length}/12 months
                  </div>
                </div>
              </div>
              <button className="asheet-close" onClick={closeMemberModal}><X size={15} /></button>
            </div>

            <div className="amodal-body">
              <div style={{ fontSize: 10, color: 'var(--t2)', fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 12 }}>
                Tap month to mark payment
              </div>
              <div className="apay-grid">
                {MONTHS.map((mo, mi) => {
                  const v = members[selMember._idx]?.paid[mi] ?? selMember.paid[mi]
                  const paid = v > 0
                  return (
                    <div key={mi}
                      className={`apay-cell ${paid ? 'paid' : 'unpaid'}`}
                      onClick={() => handleCellTap(selMember._idx, mi)}>
                      {paid
                        ? <Check size={10} color="var(--green)" strokeWidth={3} />
                        : <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
                      }
                      <div className="apay-month">{mo}</div>
                      {paid && <div className="apay-amt">₹{v}</div>}
                    </div>
                  )
                })}
              </div>

              {showEditName ? (
                <div style={{ marginBottom: 16, marginTop: 8 }}>
                  <label className="aform-label">New Name</label>
                  <input className="aform-input"
                    placeholder="Enter new name"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    autoFocus
                    onKeyDown={e => e.key === 'Enter' && handleEditName()}
                  />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => { setShowEditName(false); setEditName('') }}
                      style={{ flex: 1, padding: 11, background: 'rgba(255,255,255,0.04)', color: 'var(--t2)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                      Cancel
                    </button>
                    <button onClick={handleEditName}
                      style={{ flex: 1, padding: 11, background: 'var(--green)', color: '#000', border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>
                      Save Name
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => { setEditName(selMember.name); setShowEditName(true) }}
                  style={{
                    width: '100%', padding: '10px 14px',
                    marginBottom: 12, marginTop: 8,
                    background: 'rgba(59,130,246,0.07)',
                    border: '1px solid rgba(59,130,246,0.15)',
                    borderRadius: 14, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}>
                  <Pencil size={13} color="var(--blue)" strokeWidth={2.5} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--blue)' }}>Edit Name</span>
                </button>
              )}

              <button className="aform-danger"
                onClick={() => handleRemoveMember(selMember._idx)}>
                Remove Member
              </button>
            </div>
          </div>
        </>
      )}

      {/* ══ PAYMENT PICKER MODAL ══ */}
      {showPayPicker && (
        <>
          <div className="apay-modal-overlay" onClick={closePayPicker} />
          <div className="apay-modal">
            <div className="apay-sheet-title">
              {payMonthIdx !== null ? MONTHS[payMonthIdx] : ''} — Select Amount
            </div>
            <div className="apay-quick">
              {[monthlyRate, monthlyRate*2, monthlyRate*5, monthlyRate*12].map(amt => (
                <button key={amt}
                  className={`apay-quick-btn ${payAmount === String(amt) ? 'on' : 'off'}`}
                  onClick={() => setPayAmount(String(amt))}>
                  ₹{amt}
                </button>
              ))}
            </div>
            <input
              className="aform-input"
              type="number"
              placeholder="Custom amount"
              value={payAmount}
              onChange={e => setPayAmount(e.target.value)}
              style={{ marginBottom: 12 }}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={closePayPicker}
                style={{ flex: 1, padding: 13, background: 'rgba(255,255,255,0.04)', color: 'var(--t2)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={handleSavePay}
                style={{ flex: 1, padding: 13, background: 'var(--green)', color: '#000', border: 'none', borderRadius: 14, fontSize: 14, fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 16px rgba(34,197,94,0.3)' }}>
                Save ₹{payAmount}
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── HEADER ── */}
      <div className="apage-header">
        <div className="apage-header-inner">
          <div>
            <div className="apage-tag">
              <div className="apage-tag-dot" />
              Season {year}
            </div>
            <div className="apage-h1">
              Admin<br /><span>Panel</span>
            </div>
            <div className="apage-sub">Manage members, payments & expenses</div>
          </div>
          <button className="apage-logout"
            onClick={() => { setIsAdmin(false); setPw('') }}>
            <LogOut size={13} strokeWidth={2.5} />
            Logout
          </button>
        </div>
      </div>

      <div className="apage-body">

        {/* ── QUICK ACTIONS ── */}
        <div className="asection">
          <div className="asection-label">Quick Actions</div>
          <div className="aquick">
            <button className="aquick-btn"
              style={{ background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.12)' }}
              onClick={() => openSheet('add-member')}>
              <div className="aquick-btn-icon" style={{ background: 'rgba(34,197,94,0.12)' }}>
                <Users size={16} color="var(--green)" strokeWidth={2.5} />
              </div>
              <div>
                <div className="aquick-btn-label" style={{ color: 'var(--green)' }}>Add Member</div>
                <div className="aquick-btn-sub" style={{ color: 'var(--green)' }}>New player</div>
              </div>
            </button>
            <button className="aquick-btn"
              style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.12)' }}
              onClick={() => openSheet('add-expense')}>
              <div className="aquick-btn-icon" style={{ background: 'rgba(239,68,68,0.12)' }}>
                <Receipt size={16} color="var(--red)" strokeWidth={2.5} />
              </div>
              <div>
                <div className="aquick-btn-label" style={{ color: 'var(--red)' }}>Add Expense</div>
                <div className="aquick-btn-sub" style={{ color: 'var(--red)' }}>Record spend</div>
              </div>
            </button>
          </div>
        </div>

        {/* ── MEMBERS ── */}
        <div className="asection">
          <div className="asection-label">Members ({members.length})</div>
          {members.length === 0 && (
            <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--t3)', fontSize: 13 }}>
              No members yet — tap Add Member
            </div>
          )}
          {sortedMembers.map((m, i) => {
            const [bg, fg] = getColor(m.name)
            const paidCount = m.paid.filter(v => v > 0).length
            const total = m.paid.reduce((s, v) => s + v, 0)
            return (
              <div key={i} className="amember-row"
                style={{ animationDelay: `${i * 0.03}s` }}
                onClick={() => openMemberModal({ ...m, _idx: m._origIdx })}>
                <div className="amember-avatar" style={{ background: bg, color: fg }}>
                  {m.name.charAt(0).toUpperCase()}
                </div>
                <div className="amember-info">
                  <div className="amember-name">{m.name}</div>
                  <div className="amember-sub">{paidCount} months · ₹{total.toLocaleString()}</div>
                </div>
                <div className="amember-dots">
                  {MONTHS.map((_, mi) => (
                    <div key={mi} className="amember-dot"
                      style={{ background: m.paid[mi] > 0 ? 'var(--green)' : 'rgba(255,255,255,0.08)' }} />
                  ))}
                </div>
                <ChevronRight size={14} color="var(--t3)" style={{ marginLeft: 4, flexShrink: 0 }} />
              </div>
            )
          })}
        </div>

        {/* ── EXPENSES ── */}
        <div className="asection">
          <div className="asection-label">Expenses ({allExpItems.length})</div>
          {allExpItems.length === 0 && (
            <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--t3)', fontSize: 13 }}>
              No expenses yet
            </div>
          )}
          {allExpItems.map((e, i) => (
            <div key={i} className="aexp-row">
              <div className="aexp-icon"
                style={{ background: `${EXP_COLORS[e.cat] || '#6b7280'}15` }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: EXP_COLORS[e.cat] || '#6b7280' }} />
              </div>
              {editExp && editExp.cat === e.cat && editExp.mi === e.mi ? (
                <div style={{ flex: 1, display: 'flex', gap: 6, alignItems: 'center' }}>
                  <input type="number" value={editExpAmount}
                    onChange={ev => setEditExpAmount(ev.target.value)}
                    autoFocus
                    onKeyDown={ev => ev.key === 'Enter' && handleEditExpense()}
                    style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(34,197,94,0.3)', borderRadius: 10, padding: '7px 10px', fontSize: 14, color: '#fff', fontWeight: 700 }}
                  />
                  <button onClick={handleEditExpense}
                    style={{ padding: '7px 12px', background: 'var(--green)', color: '#000', border: 'none', borderRadius: 10, fontSize: 12, fontWeight: 800, cursor: 'pointer', flexShrink: 0 }}>
                    Save
                  </button>
                  <button onClick={() => { setEditExp(null); setEditExpAmount('') }}
                    style={{ padding: '7px 10px', background: 'rgba(255,255,255,0.06)', color: 'var(--t2)', border: 'none', borderRadius: 10, fontSize: 12, cursor: 'pointer', flexShrink: 0 }}>
                    ✕
                  </button>
                </div>
              ) : (
                <>
                  <div style={{ flex: 1 }}>
                    <div className="aexp-cat">{e.cat}</div>
                    <div className="aexp-month">{MONTHS[e.mi]} {year}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div className="aexp-amount">−₹{e.amount.toLocaleString()}</div>
                    <button onClick={() => { setEditExp(e); setEditExpAmount(String(e.amount)) }}
                      style={{ width: 30, height: 30, borderRadius: 9, background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                      <Pencil size={12} color="var(--blue)" strokeWidth={2.5} />
                    </button>
                    <button onClick={() => handleDeleteExpense(e.cat, e.mi)}
                      style={{ width: 30, height: 30, borderRadius: 9, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                      <X size={12} color="var(--red)" strokeWidth={2.5} />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        {/* ── SETTINGS ── */}
        <div className="asection">
          <div className="asection-label">Settings</div>
          <div className="asetting-row"
            onClick={() => { setNewBalance(String(oldBalance)); openSheet('edit-balance') }}>
            <div className="asetting-left">
              <div className="asetting-icon" style={{ background: 'rgba(59,130,246,0.1)' }}>
                <Wallet size={15} color="var(--blue)" strokeWidth={2} />
              </div>
              <div>
                <div className="asetting-label">Old Balance</div>
                <div className="asetting-sub">Carry-over · ₹{oldBalance.toLocaleString()}</div>
              </div>
            </div>
            <ChevronRight size={14} color="var(--t3)" />
          </div>

          <div className="asetting-row"
            onClick={() => { setNewMonthlyRate(String(monthlyRate)); openSheet('edit-rate') }}>
            <div className="asetting-left">
              <div className="asetting-icon" style={{ background: 'rgba(34,197,94,0.1)' }}>
                <IndianRupee size={15} color="var(--green)" strokeWidth={2} />
              </div>
              <div>
                <div className="asetting-label">Monthly Rate</div>
                <div className="asetting-sub">₹{monthlyRate} per member per month</div>
              </div>
            </div>
            <ChevronRight size={14} color="var(--t3)" />
          </div>

          <div className="asetting-row" onClick={() => openSheet('change-pw')}>
            <div className="asetting-left">
              <div className="asetting-icon" style={{ background: 'rgba(168,85,247,0.1)' }}>
                <Lock size={15} color="#a855f7" strokeWidth={2} />
              </div>
              <div>
                <div className="asetting-label">Change Password</div>
                <div className="asetting-sub">Update admin password</div>
              </div>
            </div>
            <ChevronRight size={14} color="var(--t3)" />
          </div>

          <div className="adanger-row" onClick={() => openSheet('reset')}>
            <div className="asetting-left">
              <div className="asetting-icon" style={{ background: 'rgba(239,68,68,0.1)' }}>
                <AlertTriangle size={15} color="var(--red)" strokeWidth={2} />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--red)', letterSpacing: '-0.2px' }}>
                  Reset All Data
                </div>
                <div style={{ fontSize: 11, color: 'rgba(239,68,68,0.4)', marginTop: 2 }}>
                  Permanently delete everything
                </div>
              </div>
            </div>
            <ChevronRight size={14} color="var(--red)" />
          </div>
        </div>

      </div>

      {/* ══════════ BOTTOM SHEETS (non-member) ══════════ */}
      {sheet && (
        <>
          <div className="asheet-overlay" onClick={closeSheet} />
          <div className="asheet">
            <div className="asheet-handle" />

            {/* ADD MEMBER */}
            {sheet === 'add-member' && (
              <>
                <div className="asheet-header">
                  <div className="asheet-title">Add Member</div>
                  <button className="asheet-close" onClick={closeSheet}><X size={15} /></button>
                </div>
                <div className="asheet-body">
                  <label className="aform-label">Player Name</label>
                  <input className="aform-input" placeholder="Enter full name"
                    value={newName} onChange={e => setNewName(e.target.value)}
                    autoFocus onKeyDown={e => e.key === 'Enter' && handleAddMember()} />
                  <label className="aform-label">Joining Month</label>
                  <select className="aform-input" value={newJoin}
                    onChange={e => setNewJoin(parseInt(e.target.value))}
                    style={{ appearance: 'none' }}>
                    {MONTHS.map((m, i) => (
                      <option key={i} value={i} style={{ background: '#080e08' }}>{m}</option>
                    ))}
                  </select>
                  <button className="aform-btn" onClick={handleAddMember} disabled={saving}>
                    {saving ? 'Adding...' : 'Add to Squad'}
                  </button>
                </div>
              </>
            )}

            {/* ADD EXPENSE */}
            {sheet === 'add-expense' && (
              <>
                <div className="asheet-header">
                  <div className="asheet-title">Add Expense</div>
                  <button className="asheet-close" onClick={closeSheet}><X size={15} /></button>
                </div>
                <div className="asheet-body">
                  <label className="aform-label">Category</label>
                  <select className="aform-input" value={expCat}
                    onChange={e => setExpCat(e.target.value)} style={{ appearance: 'none' }}>
                    {EXP_CATS.map(c => (
                      <option key={c} value={c} style={{ background: '#080e08' }}>{c}</option>
                    ))}
                  </select>
                  <label className="aform-label">Month</label>
                  <select className="aform-input" value={expMonth}
                    onChange={e => setExpMonth(parseInt(e.target.value))} style={{ appearance: 'none' }}>
                    {MONTHS.map((m, i) => (
                      <option key={i} value={i} style={{ background: '#080e08' }}>{m}</option>
                    ))}
                  </select>
                  <label className="aform-label">Amount (₹)</label>
                  <input className="aform-input" type="number" placeholder="0"
                    value={expAmount} onChange={e => setExpAmount(e.target.value)} />
                  <button className="aform-btn" onClick={handleAddExpense}
                    disabled={saving || !expAmount}>
                    {saving ? 'Saving...' : 'Add Expense'}
                  </button>
                </div>
              </>
            )}

            {/* EDIT BALANCE */}
            {sheet === 'edit-balance' && (
              <>
                <div className="asheet-header">
                  <div className="asheet-title">Edit Old Balance</div>
                  <button className="asheet-close" onClick={closeSheet}><X size={15} /></button>
                </div>
                <div className="asheet-body">
                  <div style={{ fontSize: 13, color: 'var(--t2)', marginBottom: 16, lineHeight: 1.5 }}>
                    Carry-over balance from {year - 1} added to total club balance.
                  </div>
                  <label className="aform-label">Balance (₹)</label>
                  <input className="aform-input" type="number"
                    placeholder="e.g. 3950" value={newBalance}
                    onChange={e => setNewBalance(e.target.value)} autoFocus />
                  <button className="aform-btn" onClick={handleEditBalance} disabled={saving}>
                    {saving ? 'Saving...' : 'Update Balance'}
                  </button>
                </div>
              </>
            )}

            {/* EDIT MONTHLY RATE */}
            {sheet === 'edit-rate' && (
              <>
                <div className="asheet-header">
                  <div className="asheet-title">Monthly Rate</div>
                  <button className="asheet-close" onClick={closeSheet}><X size={15} /></button>
                </div>
                <div className="asheet-body">
                  <div style={{ fontSize: 13, color: 'var(--t2)', marginBottom: 16, lineHeight: 1.5 }}>
                    Amount each member pays per month. Currently ₹{monthlyRate}.
                  </div>
                  <label className="aform-label">Rate (₹)</label>
                  <input className="aform-input" type="number"
                    placeholder="e.g. 100" value={newMonthlyRate}
                    onChange={e => setNewMonthlyRate(e.target.value)} autoFocus />
                  <button className="aform-btn" onClick={handleEditRate} disabled={saving}>
                    {saving ? 'Saving...' : 'Update Rate'}
                  </button>
                </div>
              </>
            )}

            {/* CHANGE PASSWORD */}
            {sheet === 'change-pw' && (
              <>
                <div className="asheet-header">
                  <div className="asheet-title">Change Password</div>
                  <button className="asheet-close" onClick={closeSheet}><X size={15} /></button>
                </div>
                <div className="asheet-body">
                  <label className="aform-label">New Password</label>
                  <input className="aform-input" type="password"
                    placeholder="Min 4 characters" value={newPw}
                    onChange={e => { setNewPw(e.target.value); setPwError('') }} autoFocus />
                  <label className="aform-label">Confirm Password</label>
                  <input className="aform-input" type="password"
                    placeholder="Repeat password" value={confirmPw}
                    onChange={e => { setConfirmPw(e.target.value); setPwError('') }} />
                  {pwError && (
                    <div style={{ fontSize: 12, color: 'var(--red)', marginBottom: 12, fontWeight: 600 }}>
                      {pwError}
                    </div>
                  )}
                  <button className="aform-btn" onClick={handleChangePw}>
                    Change Password
                  </button>
                </div>
              </>
            )}

            {/* RESET */}
            {sheet === 'reset' && (
              <>
                <div className="asheet-header">
                  <div className="asheet-title" style={{ color: 'var(--red)' }}>Reset All Data</div>
                  <button className="asheet-close" onClick={closeSheet}><X size={15} /></button>
                </div>
                <div className="asheet-body">
                  <div style={{ textAlign: 'center', padding: '16px 0 24px' }}>
                    <div style={{ width: 56, height: 56, borderRadius: 18, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                      <AlertTriangle size={24} color="var(--red)" strokeWidth={2} />
                    </div>
                    <div style={{ fontSize: 17, fontWeight: 800, color: '#fff', marginBottom: 8, letterSpacing: '-0.3px' }}>
                      Are you sure?
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--t2)', lineHeight: 1.6, marginBottom: 24 }}>
                      This will permanently delete all members, payments and expenses. This cannot be undone.
                    </div>
                    {resetConfirm && (
                      <div style={{ fontSize: 12, color: 'var(--red)', fontWeight: 700, marginBottom: 12 }}>
                        Tap again to confirm!
                      </div>
                    )}
                    <button className="aform-danger" style={{ marginTop: 0 }} onClick={handleReset}>
                      {resetConfirm ? 'Yes, Delete Everything' : 'Reset All Data'}
                    </button>
                    <button style={{ width: '100%', padding: 13, marginTop: 8, background: 'transparent', color: 'var(--t2)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
                      onClick={closeSheet}>
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