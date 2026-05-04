import { Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing'
import Assess from './pages/Assess'
import Dashboard from './pages/Dashboard'
import NavBar from './components/NavBar'

export default function App() {
  return (
    <div className="min-h-screen bg-navy">
      <NavBar />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/assess" element={<Assess />} />
        <Route path="/dashboard/:id" element={<Dashboard />} />
      </Routes>
    </div>
  )
}
