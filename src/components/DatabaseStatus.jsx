import React from 'react';
import { Container, Badge } from 'react-bootstrap';

function DatabaseStatus() {
  return (
    <Container className="mt-3">
      <div className="bg-light p-2 rounded-3 d-flex align-items-center">
        <span className="me-2">
          <i className="bi bi-clock"></i> Last database update: 2 hours ago | Next scheduled update in 4 hours
        </span>
        <Badge bg="success" className="ms-auto">Healthy</Badge>
      </div>
    </Container>
  );
}

export default DatabaseStatus;