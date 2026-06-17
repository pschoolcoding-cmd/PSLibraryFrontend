import './App.css'
import { Route, Routes } from "react-router-dom"
import Search from "./pages/Search"
import AddBook from './pages/AddBook'
import Viewbook from './pages/Viewbook'
import ScannerSearch from './pages/ScannerSearch'
function App() {

  return (
    <div className='h-full w-full'>
      <Routes>
        <Route path="/" element={<Search />} />
        <Route path="/add" element={<AddBook />} />
        <Route path="/book/:id" element={<Viewbook />} />
        <Route path="/scan" element={<ScannerSearch />} />
      </Routes>
    </div>
  )
}

export default App
