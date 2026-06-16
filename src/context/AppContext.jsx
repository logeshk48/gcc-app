import { createContext, useContext, useState, useEffect } from 'react'
import { db } from '../firebase/config'
import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore'

const AppContext = createContext()

export const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
export const EXP_CATS = ['Bat repair','Ball box','New gloves','New pad','New bat','Helmet','Ground fee','Jersey','Other']

export function AppProvider({ children }) {
  const year = new Date().getFullYear()
  const [members, setMembers] = useState([])
  const [expenses, setExpenses] = useState({})
  const [oldBalance, setOldBalance] = useState(0)
  const [monthlyRate, setMonthlyRate] = useState(100)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    setLoading(true)

    const run = async () => {
      // check current year format first
      const newSnap = await getDoc(doc(db, 'gcc', `data_${year}`))
      if (newSnap.exists()) {
        const d = newSnap.data()
        if (d.members) setMembers(d.members)
        else setMembers([])
        if (d.expenses) setExpenses(d.expenses)
        else setExpenses({})
        if (d.oldBalance !== undefined) setOldBalance(d.oldBalance)
        else setOldBalance(0)
        if (d.monthlyRate !== undefined) setMonthlyRate(d.monthlyRate)
        else setMonthlyRate(100)
      } else {
        // try old 'data' format migration (for 2026)
        const oldSnap = await getDoc(doc(db, 'gcc', 'data'))
        if (oldSnap.exists()) {
          const oldData = oldSnap.data()
          const payload = { ...oldData, monthlyRate: oldData.monthlyRate ?? 100 }
          await setDoc(doc(db, 'gcc', `data_${year}`), payload)
          if (oldData.members) setMembers(oldData.members)
          else setMembers([])
          if (oldData.expenses) setExpenses(oldData.expenses)
          else setExpenses({})
          if (oldData.oldBalance !== undefined) setOldBalance(oldData.oldBalance)
          else setOldBalance(0)
          setMonthlyRate(oldData.monthlyRate ?? 100)
        } else {
          // new year — carry over balance + copy members from previous year
          const prevSnap = await getDoc(doc(db, 'gcc', `data_${year - 1}`))
          let carryOver = 0
          let prevMembers = []
          if (prevSnap.exists()) {
            const p = prevSnap.data()
            prevMembers = p.members || []
            const pExpenses = p.expenses || {}
            const pOldBal = p.oldBalance || 0
            const pRate = p.monthlyRate || 100
            const pCol = MONTHS.reduce((s, _, mi) =>
              s + prevMembers.reduce((ms, m) => ms + (m.paid?.[mi] || 0), 0), 0)
            const pExp = MONTHS.reduce((s, _, mi) =>
              s + Object.values(pExpenses).reduce((es, row) => es + (row?.[mi] || 0), 0), 0)
            carryOver = pOldBal + pCol - pExp
            if (carryOver < 0) carryOver = 0
            // copy members with fresh payment record
            prevMembers = prevMembers.map(m => ({
              name: m.name,
              paid: new Array(12).fill(0),
              joinMonth: 0
            }))
          }
          const newData = {
            members: prevMembers,
            expenses: {},
            oldBalance: carryOver,
            monthlyRate: 100
          }
          await setDoc(doc(db, 'gcc', `data_${year}`), newData)
          setMembers(prevMembers)
          setExpenses({})
          setOldBalance(carryOver)
          setMonthlyRate(100)
        }
      }
      setLoading(false)
    }

    run()

    // live listener
    const unsub = onSnapshot(doc(db, 'gcc', `data_${year}`), (snap) => {
      if (snap.exists()) {
        const d = snap.data()
        if (d.members) setMembers(d.members)
        if (d.expenses) setExpenses(d.expenses)
        if (d.oldBalance !== undefined) setOldBalance(d.oldBalance)
        if (d.monthlyRate !== undefined) setMonthlyRate(d.monthlyRate)
      }
    })

    return () => unsub()
  }, [])

  const saveData = async (newMembers, newExpenses, newOldBalance, newMonthlyRate) => {
    const payload = {
      members: newMembers ?? members,
      expenses: newExpenses ?? expenses,
      oldBalance: newOldBalance ?? oldBalance,
      monthlyRate: newMonthlyRate ?? monthlyRate
    }
    await setDoc(doc(db, 'gcc', `data_${year}`), payload)
  }

  const resetData = async () => {
    const empty = { members: [], expenses: {}, oldBalance: 0, monthlyRate: 100 }
    await setDoc(doc(db, 'gcc', `data_${year}`), empty)
    setMembers([])
    setExpenses({})
    setOldBalance(0)
    setMonthlyRate(100)
  }

  const monthlyCollection = MONTHS.map((_, mi) =>
    members.reduce((s, m) => s + (m.paid?.[mi] || 0), 0)
  )

  const monthlyExpenses = MONTHS.map((_, mi) =>
    Object.values(expenses).reduce((s, row) => s + (row?.[mi] || 0), 0)
  )

  const runningBalance = (() => {
    let b = oldBalance
    return MONTHS.map((_, i) => {
      if (monthlyCollection[i] === 0 && monthlyExpenses[i] === 0) return null
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
      monthlyRate, setMonthlyRate,
      loading,
      isAdmin, setIsAdmin,
      monthlyCollection,
      monthlyExpenses,
      runningBalance,
      currentBalance,
      saveData,
      resetData,
      MONTHS,
      EXP_CATS,
      year,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)