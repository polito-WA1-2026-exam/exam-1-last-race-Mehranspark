// Top-level app: wraps everything in the auth provider, renders the nav bar, and
// declares the client-side routes (React Router). Navigation never reloads the page.

import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Container } from 'react-bootstrap'
import { AuthProvider } from './contexts/AuthContext.jsx'
import ParticleNetwork from './components/ParticleNetwork.jsx'
import NavHeader from './components/NavHeader.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import HomePage from './pages/HomePage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import GamePage from './pages/GamePage.jsx'
import RankingPage from './pages/RankingPage.jsx'

function App() {
  // The current location drives a gentle page transition: keying the wrapper by
  // pathname remounts the routed content on each navigation, so its CSS
  // entrance animation (.page-transition) replays — a soft fade-and-rise.
  const location = useLocation()

  return (
    <AuthProvider>
      <ParticleNetwork />
      <NavHeader />
      <Container className="pb-5">
        <div className="page-transition" key={location.pathname}>
          <Routes location={location}>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/play"
              element={
                <ProtectedRoute>
                  <GamePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/ranking"
              element={
                <ProtectedRoute>
                  <RankingPage />
                </ProtectedRoute>
              }
            />
            {/* Any unknown path falls back to the home page. */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Container>
    </AuthProvider>
  )
}

export default App
