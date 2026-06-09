import { createContext, useContext, useState, useEffect } from 'react'
import { db } from '../firebase/config'
import { doc, onSnapshot, setDoc, collection } from 'firebase/firestore'

const AppContext = createContext()

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

const DEFAULT_MEMBERS = [
  {name:'Jegan',paid:[100,100,100,100,0,0,0,0,0,0,0,0]},
  {name:'Mei',paid:[100,100,100,0,0,0,0,0,0,0,0,0]},
  {name:'Sampath',paid:[100,100,100,100,100,0,0,0,0,0,0,0]},
  {name:'Jana',paid:[100,100,100,100,0,0,0,0,0,0,0,0]},
  {name:'Santhosh',paid:[100,0,0,0,0,0,0,0,0,0,0,0]},
  {name:'Bharath',paid:[100,100,0,0,0,0,0,0,0,0,0,0]},
  {name:'Subbu',paid:[100,100,100,100,100,0,0,0,0,0,0,0]},
  {name:'Shanmugam',paid:[100,100,100,100,0,0,0,0,0,0,0,0]},
  {name:'Shankar',paid:[100,100,100,100,0,0,0,0,0,0,0,0]},
  {name:'Logesh',paid:[100,100,100,100,0,0,0,0,0,0,0,0]},
  {name:'Ravi',paid:[100,0,0,0,0,0,0,0,0,0,0,0]},
  {name:'Kamal',paid:[100,100,100,100,100,0,0,0,0,0,0,0]},
  {name:'Sasi',paid:[100,0,0,0,0,0,0,0,0,0,0,0]},
  {name:'Britto',paid:[100,100,100,100,0,0,0,0,0,0,0,0]},
  {name:'Boobathi',paid:[100,100,100,100,100,100,0,0,0,0,0,0]},
  {name:'Vijay',paid:[100,100,100,100,100,100,0,0,0,0,0,0]},
  {name:'Kumar',paid:[100,100,100,100,100,0,0,0,0,0,0,0]},
  {name:'Prasath',paid:[1200,0,0,0,0,0,0,0,0,0,0,0]},
  {name:'Kavin',paid:[100,100,100,100,0,0,0,0,0,0,0,0]},
  {name:'Prabhu',paid:[100,100,100,0,0,0,0,0,0,0,0,0]},
  {name:'Rudhresh',paid:[100,0,0,0,0,0,0,0,0,0,0,0]},
  {name:'Aravindh',paid:[100,0,0,0,0,0,0,0,0,0,0,0]},
  {name:'Hari Prasath',paid:[100,100,100,100,0,0,0,0,0,0,0,0]},
  {name:'Bala',paid:[100,0,0,0,0,0,0,0,0,0,0,0]},
  {name:'Sakthi',paid:[100,100,100,100,100,0,0,0,0,0,0,0]},
  {name:'Vignesh',paid:[100,100,0,0,0,0,0,0,0,0,0,0]},
  {name:'Infant Raja',paid:[100,0,0,0,0,0,0,0,0,0,0,0]},
  {name:'Abu',paid:[100,0,0,0,0,0,0,0,0,0,0,0]},
  {name:'Prakash',paid:[100,100,100,100,100,0,0,0,0,0,0,0]},
  {name:'Vaira',paid:[100,0,0,0,0,0,0,0,0,0,0,0]},
  {name:'Megavannan',paid:[100,100,100,100,100,0,0,0,0,0,0,0]},
]

const DEFAULT_EXPENSES = {
  'Bat repair': [2300,0,0,0,0,0,0,0,0,0,0,0],
  'Ball box':   [450,0,2040,510,1740,0,0,0,0,0,0,0],
  'New gloves': [0,0,2200,0,1000,0,0,0,0,0,0,0],
  'New pad':    [0,0,0,0,0,0,0,0,0,0,0,0],
  'New bat':    [0,0,0,0,0,0,0,0,0,0,0,0],
  'Helmet':     [0,0,0,0,0,0,0,0,0,0,0,0],
  'Other':      [85,0,200,0,0,0,0,0,0,0,0,0],
}

export function AppProvider({ children }) {
  const [members, setMembers] = useState(DEFAULT_MEMBERS)
  const [expenses, setExpenses] = useState(DEFAULT_EXPENSES)
  const [oldBalance] = useState(3950)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'gcc', 'data'), (snap) => {
      if (snap.exists()) {
        const d = snap.data()
        if (d.members) setMembers(d.members)
        if (d.expenses) setExpenses(d.expenses)
      } else {
        setDoc(doc(db, 'gcc', 'data'), {
          members: DEFAULT_MEMBERS,
          expenses: DEFAULT_EXPENSES,
          oldBalance: 3950
        })
      }
      setLoading(false)
    })
    return () => unsub()
  }, [])

  const saveData = async (newMembers, newExpenses) => {
    await setDoc(doc(db, 'gcc', 'data'), {
      members: newMembers ?? members,
      expenses: newExpenses ?? expenses,
      oldBalance
    })
  }

  // computed
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
      oldBalance, loading,
      isAdmin, setIsAdmin,
      monthlyCollection,
      monthlyExpenses,
      runningBalance,
      currentBalance,
      saveData,
      MONTHS
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)