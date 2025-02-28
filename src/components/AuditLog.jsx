import React from 'react';
import { Container, Card, Form, Button, Badge } from 'react-bootstrap';

function AuditLog() {
  return (
    <Container>
      <Card>
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h4 className="mb-0">System Audit Log</h4>
            <div>
              <Form.Control
                type="text"
                placeholder="Search audit logs..."
                className="d-inline-block me-2"
                style={{ width: '300px' }}
              />
              <Button variant="outline-secondary" className="me-2">
                <i className="bi bi-funnel"></i> Filter
              </Button>
              <Button variant="outline-secondary">
                <i className="bi bi-download"></i> Export
              </Button>
            </div>
          </div>

          <div className="mb-4">
            <div className="d-flex justify-content-between align-items-start mb-3 p-3 bg-light rounded">
              <div>
                <h5 className="mb-1">Database Update</h5>
                <p className="mb-1">Sanctions list updated with 150 new entries</p>
                <small className="text-muted">User: system_admin | IP: 192.168.1.100</small>
              </div>
              <Badge bg="dark">2 mins ago</Badge>
            </div>

            <div className="d-flex justify-content-between align-items-start mb-3 p-3 bg-light rounded">
              <div>
                <h5 className="mb-1">Batch Screening</h5>
                <p className="mb-1">Processed 1,234 records with 3 matches</p>
                <small className="text-muted">User: jane_doe | IP: 192.168.1.105</small>
              </div>
              <Badge bg="dark">1 hour ago</Badge>
            </div>

            <div className="d-flex justify-content-between align-items-start mb-3 p-3 bg-light rounded">
              <div>
                <h5 className="mb-1">Configuration Change</h5>
                <p className="mb-1">Modified matching algorithm settings</p>
                <small className="text-muted">User: system_admin | IP: 192.168.1.100</small>
              </div>
              <Badge bg="dark">3 hours ago</Badge>
            </div>
          </div>

          <div className="d-flex justify-content-between align-items-center">
            <small className="text-muted">Showing 10 of 1,234 entries</small>
            <div>
              <Button variant="outline-secondary" size="sm" className="me-2">Previous</Button>
              <Button variant="outline-secondary" size="sm">Next</Button>
            </div>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default AuditLog;