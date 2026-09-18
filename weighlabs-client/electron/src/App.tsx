import { Route, Routes, BrowserRouter } from 'react-router-dom'
import './App.css'
import Login from './pages/Login.tsx'

function App() {
  return (
      <>
          <BrowserRouter>
              <Routes>
                  <Route path='/' Component={Login} />
              </Routes>
          </BrowserRouter>
    </>
  )
}

export default App
