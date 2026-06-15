// Top-level app: wraps everything in the auth provider, renders the nav bar, and
// declares the client-side routes (React Router). Navigation never reloads the page.

import { Routes, Route, Navigate } from 'react-router-dom'
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
  return (
    <AuthProvider>
      <ParticleNetwork />
      <NavHeader />
      <Container className="pb-5">
        <Routes>
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
      </Container>
    </AuthProvider>
  )
}

export default App
