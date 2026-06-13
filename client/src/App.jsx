import { useState, useEffect } from 'react'
import { Container, Alert, Spinner } from 'react-bootstrap'
import API from './API.js'

// Phase 0 placeholder: confirms the client can reach the API across origins
// (CORS + the "two servers" pattern). Replaced by the real app shell in Phase 7.
function App() {
  const [status, setStatus] = useState({ state: 'loading' })

  useEffect(() => {
    // useEffect with an empty dependency array runs once after the first render.
    API.testConnection()
      .then((data) => setStatus({ state: 'ok', data }))
      .catch((err) => setStatus({ state: 'error', message: err.message }))
  }, [])

  return (
    <Container className="py-5">
      <h1>🚇 Last Race</h1>
      <p className="text-muted">Web Applications I — Exam project</p>

      {status.state === 'loading' && (
        <div className="d-flex align-items-center gap-2">
          <Spinner animation="border" size="sm" /> Contacting the API…
        </div>
      )}
      {status.state === 'ok' && (
        <Alert variant="success">
          API reachable ✅ — <strong>{status.data.message}</strong>
          <br />
          <small>server time: {status.data.time}</small>
        </Alert>
      )}
      {status.state === 'error' && (
        <Alert variant="danger">
          Could not reach the API: {status.message}
        </Alert>
      )}
    </Container>
  )
}

export default App
