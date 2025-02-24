import React from 'react';
import { Card, Button, Container, Row, Col } from 'react-bootstrap';

function DataImport() {
  return (
    <Container>
      <h2 className="mb-4">Sanctions List Import</h2>
      
      <Card className="mb-4">
        <Card.Body>
          <div className="text-center p-4 border-2 border-dashed rounded-3">
            <i className="bi bi-upload fs-2 mb-3"></i>
            <p>Support for PDF, XML, CSV formats</p>
            <div>
              <Button variant="dark" className="me-2">Select Files</Button>
              <Button variant="outline-secondary">Import History</Button>
            </div>
          </div>
        </Card.Body>
      </Card>

      <h3 className="mb-3">Recent Imports</h3>
      <Row>
        <Col>
          <Card>
            <Card.Body>
              <h5>UN Sanctions List</h5>
              <p className="text-muted">2,450 entries updated</p>
              <small className="text-muted">2 mins ago</small>
            </Card.Body>
          </Card>
        </Col>
        <Col>
          <Card>
            <Card.Body>
              <h5>EU Consolidated List</h5>
              <p className="text-muted">1,832 entries updated</p>
              <small className="text-muted">1 hour ago</small>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default DataImport;