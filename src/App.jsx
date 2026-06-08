import './App.css'
import { Route, Routes } from "react-router-dom"
import Search from "./pages/Search"
import AddBook from './pages/AddBook'
function App() {

  return (
    <div className='h-screen w-screen'>
      <Routes>
        <Route path="/" element={<Search />} />
        <Route path="/add" element={<AddBook />} />
      </Routes>
    </div>
  )
}

export default App
