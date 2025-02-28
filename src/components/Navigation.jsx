import React from 'react';
import { Navbar, Nav, Container } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';

function Navigation() {
  const location = useLocation();

  return (
    <Navbar bg="white" expand="lg" className="border-bottom">
      <Container>
        <Navbar.Brand as={Link} to="/">
          <strong>Sanction Guard</strong>
          <span className="ms-2 text-muted">Enterprise Edition</span>
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link 
              as={Link} 
              to="/data-import"
              active={location.pathname === '/data-import'}
            >
              Data Import
            </Nav.Link>
            <Nav.Link 
              as={Link} 
              to="/search-screen"
              active={location.pathname === '/search-screen'}
            >
              Search & Screen
            </Nav.Link>
            <Nav.Link 
              as={Link} 
              to="/batch-processing"
              active={location.pathname === '/batch-processing'}
            >
              Batch Processing
            </Nav.Link>
            <Nav.Link 
              as={Link} 
              to="/reports-analytics"
              active={location.pathname === '/reports-analytics'}
            >
              Reports & Analytics
            </Nav.Link>
            <Nav.Link 
              as={Link} 
              to="/audit-log"
              active={location.pathname === '/audit-log'}
            >
              Audit Log
            </Nav.Link>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default Navigation;