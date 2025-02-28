import React from 'react';
import { Container, Card, Form, Button, Row, Col } from 'react-bootstrap';

function SearchScreen() {
  return (
    <Container>
      <Card className="mb-4">
        <Card.Body>
          <h4 className="mb-3">Advanced Screening</h4>
          <Form>
            <div className="d-flex gap-2">
              <Form.Control
                type="text"
                placeholder="Enter name, entity, or identifier..."
                className="flex-grow-1"
              />
              <Button variant="outline-secondary">
                <i className="bi bi-funnel"></i> Filters
              </Button>
              <Button variant="dark">Screen</Button>
            </div>
          </Form>
        </Card.Body>
      </Card>

      <Row>
        <Col md={4}>
          <Card>
            <Card.Body>
              <h5>Today's Activity</h5>
              <div className="d-flex justify-content-between mb-2">
                <span>Searches</span>
                <span>124</span>
              </div>
              <div className="d-flex justify-content-between">
                <span>Matches</span>
                <span>3</span>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card>
            <Card.Body>
              <h5>Database Status</h5>
              <div className="d-flex justify-content-between mb-2">
                <span>Total Records</span>
                <span>125,431</span>
              </div>
              <div className="d-flex justify-content-between">
                <span>Last Updated</span>
                <span>2h ago</span>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card>
            <Card.Body>
              <h5>Quick Actions</h5>
              <div className="d-grid gap-2">
                <Button variant="outline-primary">
                  <i className="bi bi-arrow-clockwise"></i> Refresh Data
                </Button>
                <Button variant="outline-secondary">
                  <i className="bi bi-download"></i> Export Results
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default SearchScreen;