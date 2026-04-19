import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => (
  <div className="page center">
    <div className="panel">
      <h2>Page not found</h2>
      <p className="muted">The page you are looking for does not exist.</p>
      <Link to="/admin/dashboard" className="primary-button">
        Go to dashboard
      </Link>
    </div>
  </div>
);

export default NotFound;
