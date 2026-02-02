import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router"

import Layout from "./components/Layout/Layout"
import HomePage from "./pages/HomePage/HomePage"
import RoomPage from "./pages/RoomPage/RoomPage"
import PageNotFound from "./pages/PageNotFound/PageNotFound"

import './App.css'
import { ThemeProvider } from "./context/ThemeContext"

function App() {
  return (
    <ThemeProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="/rooms" element={<RoomPage />} />
            <Route path="/rooms/:id" element={<RoomPage />} />
            <Route path="page-not-found" element={<PageNotFound />} />
            <Route path="*" element={<Navigate to="/page-not-found" />} />
          </Route>
        </Routes>
      </Router>
    </ThemeProvider>
  )
}

export default App
