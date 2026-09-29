import './App.css'
import { Route, Routes } from "react-router-dom"
import { GoogleOAuthProvider } from '@react-oauth/google'
import { AuthProvider } from './context/AuthContext'
import Home from "./pages/Home"
import Search from "./pages/Search"
import AddBook from './pages/AddBook'
import Viewbook from './pages/Viewbook'
import ScannerSearch from './pages/ScannerSearch'
import Login from './pages/Login'
import Signup from './pages/Signup'
import AccountDashboard from './pages/AccountDashboard'
import GenreOrganizer from './pages/GenreOrganizer'
import AdminPanel from './pages/AdminPanel'

// Google OAuth Client ID (from environment or default placeholder)
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '1089234567890-demo.apps.googleusercontent.com';

function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <div className='min-h-screen w-full bg-[#030303] text-white'>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/search" element={<Search />} />
            <Route path="/add" element={<AddBook />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="/admin/panel" element={<AdminPanel />} />
            <Route path="/admin/genres" element={<GenreOrganizer />} />
            <Route path="/genres" element={<GenreOrganizer />} />
            <Route path="/book/:id" element={<Viewbook />} />
            <Route path="/scan" element={<ScannerSearch />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/account" element={<AccountDashboard />} />
          </Routes>
        </div>
      </AuthProvider>
    </GoogleOAuthProvider>
  )
}

export default App
