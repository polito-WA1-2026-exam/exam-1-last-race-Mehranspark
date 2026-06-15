// Top navigation bar. Links and actions depend on whether someone is logged in.

import { Navbar, Nav, Container, Button } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";

function NavHeader() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/"); // back to the public home after signing out
  };

  return (
    <Navbar variant="dark" expand="md" className="mb-4 lr-nav">
      <Container>
        <Navbar.Brand as={Link} to="/" className="lr-brand">
          <span className="lr-dot" />
          Last Race
        </Navbar.Brand>
        <Nav className="me-auto">
          <Nav.Link as={Link} to="/">
            Home
          </Nav.Link>
          {user && (
            <>
              <Nav.Link as={Link} to="/play">
                Play
              </Nav.Link>
              <Nav.Link as={Link} to="/ranking">
                Ranking
              </Nav.Link>
            </>
          )}
        </Nav>
        <Nav>
          {user ? (
            <div className="d-flex align-items-center gap-2">
              <span className="text-light">
                Hi, <strong>{user.name}</strong>
              </span>
              <Button size="sm" variant="outline-light" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          ) : (
            <Button size="sm" variant="outline-light" as={Link} to="/login">
              Login
            </Button>
          )}
        </Nav>
      </Container>
    </Navbar>
  );
}

export default NavHeader;
