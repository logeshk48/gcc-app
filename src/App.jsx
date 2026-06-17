import { HashRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import './index.css'
import Dashboard from './pages/Dashboard/Dashboard'
import Members from './pages/Members/Members'
import Expenses from './pages/Expenses/Expenses'
import Admin from './pages/Admin/Admin'
import BottomNav from './components/BottomNav'

function AnimatedRoutes() {
  const location = useLocation()
  const [displayLocation, setDisplayLocation] = useState(location)
  const [transitionStage, setTransitionStage] = useState('fadeIn')

  useEffect(() => {
    if (location !== displayLocation) {
      setTransitionStage('fadeOut')
    }
  }, [location])

  return (
    <div
      style={{
        animation: transitionStage === 'fadeIn'
          ? 'pageIn 0.3s cubic-bezier(0.16,1,0.3,1) both'
          : 'pageOut 0.15s ease both',
      }}
      onAnimationEnd={() => {
        if (transitionStage === 'fadeOut') {
          setDisplayLocation(location)
          setTransitionStage('fadeIn')
        }
      }}
    >
      <Routes location={displayLocation}>
        <Route path="/"         element={<Dashboard />} />
        <Route path="/members"  element={<Members />}   />
        <Route path="/expenses" element={<Expenses />}  />
        <Route path="/admin"    element={<Admin />}     />
      </Routes>
    </div>
  )
}

export default function App() {
  return (
    <Router>
      <div style={{ paddingBottom: 90 }}>
        <AnimatedRoutes />
        <BottomNav />
      </div>
    </Router>
  )
}