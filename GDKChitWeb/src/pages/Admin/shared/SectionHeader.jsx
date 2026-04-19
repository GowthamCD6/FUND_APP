import React from 'react';

const SectionHeader = ({ title, subtitle, action }) => (
  <div className="section-header">
    <div>
      <h2>{title}</h2>
      {subtitle ? <p>{subtitle}</p> : null}
    </div>
    {action ? <div>{action}</div> : null}
  </div>
);

export default SectionHeader;
