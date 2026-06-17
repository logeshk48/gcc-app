import { HashRouter as Router, Routes, Route } from 'react-router-dom'
import './index.css'
import Dashboard from './pages/Dashboard/Dashboard'
import Members from './pages/Members/Members'
import Expenses from './pages/Expenses/Expenses'
import Admin from './pages/Admin/Admin'
import BottomNav from './components/BottomNav'

export default function App() {
  return (
    <Router>
      <div style={{ paddingBottom: 90 }}>
        <Routes>
          <Route path="/"         element={<Dashboard />} />
          <Route path="/members"  element={<Members />}   />
          <Route path="/expenses" element={<Expenses />}  />
          <Route path="/admin"    element={<Admin />}     />
        </Routes>
        <BottomNav />
      </div>
    </Router>
  )
}