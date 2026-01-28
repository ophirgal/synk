import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router"

import { RoomProvider } from "./context/RoomContext"
import Layout from "./components/Layout/Layout"
import Home from "./pages/Home/Home"
import Room from "./pages/Room/Room"
import PageNotFound from "./pages/PageNotFound/PageNotFound"

import './App.css'
import { ThemeProvider } from "./context/ThemeContext"

function App() {
  return (
    <ThemeProvider>
      <RoomProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="/rooms" element={<Room />} />
              <Route path="/rooms/:id" element={<Room />} />
              <Route path="page-not-found" element={<PageNotFound />} />
              <Route path="*" element={<Navigate to="/page-not-found" />} />
            </Route>
          </Routes>
        </Router>
      </RoomProvider>
    </ThemeProvider>
  )
}

export default App
