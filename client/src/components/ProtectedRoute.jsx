// Wraps routes that require login. While the initial session check is running we
// show nothing decisive (a spinner); once known, anonymous users are redirected
// to /login and logged-in users see the protected page.

import { Navigate } from "react-router-dom";
import { Spinner, Container } from "react-bootstrap";
import { useAuth } from "../contexts/AuthContext.jsx";

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading)
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" />
      </Container>
    );

  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default ProtectedRoute;
