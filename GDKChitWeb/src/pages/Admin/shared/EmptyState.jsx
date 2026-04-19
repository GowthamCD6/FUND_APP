import React from 'react';

const EmptyState = ({ title, subtitle, action }) => (
  <div className="empty-state">
    <div className="empty-graphic" />
    <h3>{title}</h3>
    {subtitle ? <p>{subtitle}</p> : null}
    {action ? <div>{action}</div> : null}
  </div>
);

export default EmptyState;
