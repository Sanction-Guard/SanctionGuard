import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navigation from './components/Navigation.jsx';
import DataImport from './components/DataImport.jsx';
import SearchScreen from './components/SearchScreen.jsx';
import BatchProcessing from './components/BatchProcessing.jsx';
import ReportsAnalytics from './components/ReportsAnalytics.jsx';
import AuditLog from './components/AuditLog.jsx';
import DatabaseStatus from './components/DatabaseStatus.jsx';
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/App.css';

function App() {
  return (
    <Router>
      <div className="app-container">
        <Navigation />
        <DatabaseStatus />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<ReportsAnalytics />} />
            <Route path="/data-import" element={<DataImport />} />
            <Route path="/search-screen" element={<SearchScreen />} />
            <Route path="/batch-processing" element={<BatchProcessing />} />
            <Route path="/reports-analytics" element={<ReportsAnalytics />} />
            <Route path="/audit-log" element={<AuditLog />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;