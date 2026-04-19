import React from 'react';

const Dashboard = () => {
  const dashboardData = {
    monthlyTarget: '50,00,000',
    monthlyCollected: '42,50,000',
    collectionRate: '85.0',
    totalMembers: '1,247',
    paidMembers: '1,089',
    partialPaidMembers: '94',
    unpaidMembers: '64',
    overdueAmount: '8,75,000',
    overdueCount: '47',
    activeGroups: '46',
    completedGroups: '12',
    todayCollection: '3,25,000',
    todayPayments: '28',
  };

  const quickActions = [
    { title: 'Collect Payment', icon: 'cash' },
    { title: 'Pending Payments', icon: 'clock' },
    { title: 'Add Member', icon: 'user' },
    { title: 'Reports', icon: 'chart' },
  ];

  const recentActivities = [
    { title: 'Payment Received', subtitle: 'Priya Sharma', amount: '5,000', time: '5 mins ago' },
    { title: 'Partial Payment', subtitle: 'Rajesh Kumar', amount: '2,500', time: '20 mins ago' },
    { title: 'Payment Overdue', subtitle: 'Anita Devi', amount: '3,000', time: '1 hour ago' },
    { title: 'New Member', subtitle: 'Suresh Patel • Gold Plan', time: '2 hours ago' },
  ];

  return (
    <div className="rn-page">
      <div className="rn-header">
        <div>
          <h2 className="rn-title">Dashboard</h2>
          <p className="rn-subtitle">{new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
        </div>
        <button className="rn-notify" aria-label="Notifications">
          <span className="rn-dot" />
        </button>
      </div>

      <div className="rn-card rn-collection">
        <div className="rn-collection-header">
          <div>
            <p className="rn-label">Monthly Collection</p>
            <h3>INR {dashboardData.monthlyCollected}</h3>
          </div>
          <div className="rn-badge">{dashboardData.collectionRate}%</div>
        </div>
        <div className="rn-progress">
          <div className="rn-progress-fill" style={{ width: `${dashboardData.collectionRate}%` }} />
        </div>
        <div className="rn-collection-footer">
          <span>Target: INR {dashboardData.monthlyTarget}</span>
          <span className="rn-danger">INR {parseInt(dashboardData.monthlyTarget.replace(/,/g, ''), 10) - parseInt(dashboardData.monthlyCollected.replace(/,/g, ''), 10)} pending</span>
        </div>
      </div>

      <div className="rn-section">
        <h3 className="rn-section-title">Payment Status</h3>
        <div className="rn-status-grid">
          <div className="rn-status-card">
            <div className="rn-status-head">
              <span>{dashboardData.paidMembers}</span>
              <span className="rn-status-dot is-success" />
            </div>
            <p>Paid</p>
            <small>{((parseInt(dashboardData.paidMembers.replace(/,/g, ''), 10) / parseInt(dashboardData.totalMembers.replace(/,/g, ''), 10)) * 100).toFixed(1)}%</small>
          </div>
          <div className="rn-status-card">
            <div className="rn-status-head">
              <span>{dashboardData.partialPaidMembers}</span>
              <span className="rn-status-dot is-warning" />
            </div>
            <p>Partial</p>
            <small>{((parseInt(dashboardData.partialPaidMembers, 10) / parseInt(dashboardData.totalMembers.replace(/,/g, ''), 10)) * 100).toFixed(1)}%</small>
          </div>
          <div className="rn-status-card">
            <div className="rn-status-head">
              <span>{dashboardData.unpaidMembers}</span>
              <span className="rn-status-dot is-danger" />
            </div>
            <p>Unpaid</p>
            <small>{((parseInt(dashboardData.unpaidMembers, 10) / parseInt(dashboardData.totalMembers.replace(/,/g, ''), 10)) * 100).toFixed(1)}%</small>
          </div>
        </div>
      </div>

      <div className="rn-metrics">
        <div className="rn-metric-card">
          <span>{dashboardData.activeGroups}</span>
          <p>Active Groups</p>
        </div>
        <div className="rn-metric-card">
          <span>{dashboardData.completedGroups}</span>
          <p>Completed</p>
        </div>
        <div className="rn-metric-card">
          <span>{dashboardData.overdueCount}</span>
          <p>Overdue</p>
        </div>
      </div>

      {parseInt(dashboardData.overdueCount, 10) > 0 ? (
        <div className="rn-alert">
          <div>
            <h4>Overdue Payments</h4>
            <p>{dashboardData.overdueCount} members • INR {dashboardData.overdueAmount} pending</p>
          </div>
          <span className="rn-chevron">›</span>
        </div>
      ) : null}

      <div className="rn-section">
        <h3 className="rn-section-title">Quick Actions</h3>
        <div className="rn-actions">
          {quickActions.map((action) => (
            <div key={action.title} className="rn-action-card">
              <span className={`rn-action-icon icon-${action.icon}`} />
              <p>{action.title}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rn-card rn-summary">
        <h3>Today's Summary</h3>
        <div className="rn-summary-row">
          <div>
            <p>Collections</p>
            <strong>INR {dashboardData.todayCollection}</strong>
          </div>
          <div>
            <p>Payments</p>
            <strong>{dashboardData.todayPayments}</strong>
          </div>
        </div>
      </div>

      <div className="rn-section">
        <h3 className="rn-section-title">Recent Activity</h3>
        <div className="rn-activity">
          {recentActivities.map((activity) => (
            <div key={`${activity.title}-${activity.subtitle}`} className="rn-activity-row">
              <div>
                <h4>{activity.title}</h4>
                <p>{activity.subtitle}</p>
              </div>
              <div>
                {activity.amount ? <strong>INR {activity.amount}</strong> : null}
                <span>{activity.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
