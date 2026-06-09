import { createContext, useContext, useState, useEffect } from 'react'
import { db } from '../firebase/config'
import { doc, onSnapshot, setDoc } from 'firebase/firestore'

const AppContext = createContext()

export const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
export const EXP_CATS = ['Bat repair','Ball box','New gloves','New pad','New bat','Helmet','Ground fee','Jersey','Other']

export function AppProvider({ children }) {
  const [members, setMembers] = useState([])
  const [expenses, setExpenses] = useState({})
  const [oldBalance, setOldBalance] = useState(0)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'gcc', 'data'), (snap) => {
      if (snap.exists()) {
        const d = snap.data()
        if (d.members) setMembers(d.members)
        if (d.expenses) setExpenses(d.expenses)
        if (d.oldBalance !== undefined) setOldBalance(d.oldBalance)
      } else {
        // fresh start — empty data
        setDoc(doc(db, 'gcc', 'data'), {
          members: [],
          expenses: {},
          oldBalance: 0
        })
      }
      setLoading(false)
    })
    return () => unsub()
  }, [])

  const saveData = async (newMembers, newExpenses, newOldBalance) => {
    const payload = {
      members: newMembers ?? members,
      expenses: newExpenses ?? expenses,
      oldBalance: newOldBalance ?? oldBalance
    }
    await setDoc(doc(db, 'gcc', 'data'), payload)
  }

  // ── computed ──────────────────────────────────────────────────────
  const monthlyCollection = MONTHS.map((_, mi) =>
    members.reduce((s, m) => s + (m.paid[mi] || 0), 0)
  )

  const monthlyExpenses = MONTHS.map((_, mi) =>
    Object.values(expenses).reduce((s, row) => s + (row[mi] || 0), 0)
  )

  const runningBalance = (() => {
    let b = oldBalance
    return MONTHS.map((_, i) => {
      if (monthlyCollection[i] === 0 && i > 0) return null
      b = b + monthlyCollection[i] - monthlyExpenses[i]
      return b
    })
  })()

  const currentBalance = [...runningBalance].reverse().find(v => v !== null) ?? oldBalance

  return (
    <AppContext.Provider value={{
      members, setMembers,
      expenses, setExpenses,
      oldBalance, setOldBalance,
      loading,
      isAdmin, setIsAdmin,
      monthlyCollection,
      monthlyExpenses,
      runningBalance,
      currentBalance,
      saveData,
      MONTHS,
      EXP_CATS
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)