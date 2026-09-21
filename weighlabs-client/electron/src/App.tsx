import { Route, Routes, BrowserRouter } from 'react-router-dom'
import './App.css'
import Login from './pages/Login.tsx'
import AppPage from './pages/App.tsx'
import Frame from './components/Frame.tsx'

function App() {
  return (
      <Frame>
            <BrowserRouter>
                <Routes>
                    <Route path='/' Component={Login} />
                    <Route path='/app' Component={AppPage} />
                </Routes>
            </BrowserRouter>
      </Frame>
  )
}

export default App
