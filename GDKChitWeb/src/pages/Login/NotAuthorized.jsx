import React from 'react';
import { Link } from 'react-router-dom';

const NotAuthorized = () => (
  <div className="page center">
    <div className="panel">
      <h2>Access restricted</h2>
      <p className="muted">This portal is only available for admin accounts.</p>
      <Link to="/login" className="primary-button">
        Back to login
      </Link>
    </div>
  </div>
);

export default NotAuthorized;
