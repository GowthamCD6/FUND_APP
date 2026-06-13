import React, { useState, useEffect, useMemo } from 'react';
import { makeRequest, safeJson } from '../../../api/apiClient.js';
import { 
  MapPin as RiMapPinLine, 
  Search as RiSearchLine, 
  Navigation as RiNavigationLine, 
  Phone as RiPhoneLine, 
  RefreshCw as RiRefreshLine, 
  AlertTriangle as RiAlertLine 
} from 'lucide-react';
import './UserLocation.css';

const UserLocationSkeleton = () => (
  <div className="ul-list skeleton-pulse">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="ul-card-skeleton">
        <div className="ul-card-left">
          <div className="ul-avatar-skeleton" />
          <div className="ul-text-skeleton">
            <div className="ul-line-title" />
            <div className="ul-line-sub" />
          </div>
        </div>
        <div className="ul-btn-skeleton" />
      </div>
    ))}
  </div>
);

const UserLocation = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState(null);

  const fetchLocations = async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      const response = await makeRequest('/admin/users/locations');
      const data = await safeJson(response);
      if (data.success) {
        setUsers(data.data || []);
        setError(null);
      } else {
        setError(data.message || 'Failed to fetch locations');
      }
    } catch (err) {
      console.error('Error fetching locations:', err);
      if (isInitial) {
        setError('Connection failed. Make sure the backend server is running.');
      }
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations(true);

    // Live-polling every 5 seconds (matching the mobile app logic)
    const interval = setInterval(() => {
      fetchLocations(false);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const filteredUsers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return users;
    return users.filter(
      (u) =>
        (u.name || '').toLowerCase().includes(q) ||
        (u.address || '').toLowerCase().includes(q) ||
        (u.phone || '').includes(q)
    );
  }, [users, searchQuery]);

  const handleNavigate = (user) => {
    let url = '';
    if (user.latitude && user.longitude) {
      // Use direct route navigation
      url = `https://www.google.com/maps/dir/?api=1&destination=${user.latitude},${user.longitude}`;
    } else {
      // Fallback to address text search
      url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(user.address)}`;
    }
    window.open(url, '_blank');
  };

  return (
    <div className="ul-page">
      <div className="ul-header">
        <div className="ul-title-area">
          <h2 className="ul-title">User Locations</h2>
          <p className="ul-subtitle">Real-time GPS Tracking & Addresses of Members</p>
        </div>
        <button 
          className="ul-refresh-btn" 
          onClick={() => fetchLocations(true)}
          disabled={loading}
        >
          <RiRefreshLine size={16} className={loading ? 'spin-anim' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="ul-toolbar">
        <div className="ul-search-wrapper">
          <RiSearchLine size={18} className="ul-search-icon" />
          <input
            type="text"
            className="ul-search-input"
            placeholder="Search by member name, phone, or address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="ul-content">
        {loading ? (
          <UserLocationSkeleton />
        ) : error ? (
          <div className="ul-error-state">
            <RiAlertLine size={48} color="var(--danger)" />
            <h3>Unable to Load Locations</h3>
            <p>{error}</p>
            <button className="ul-retry-btn" onClick={() => fetchLocations(true)}>
              Retry Connection
            </button>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="ul-empty-state">
            <RiMapPinLine size={64} color="#D1D5DB" />
            <h3>No User Locations Found</h3>
            <p>{searchQuery ? 'Try adjusting your search query' : 'No user has shared their location data yet.'}</p>
          </div>
        ) : (
          <div className="ul-list">
            {filteredUsers.map((user) => {
              const hasGPS = user.latitude && user.longitude;
              return (
                <div key={user.id} className="ul-card">
                  <div className="ul-card-body">
                    <div className="ul-avatar-area">
                      <div className="ul-avatar">
                        {(user.name || 'U').substring(0, 2).toUpperCase()}
                      </div>
                      <div className="ul-info">
                        <h4 className="ul-member-name">{user.name}</h4>
                        <p className="ul-member-phone">
                          <RiPhoneLine size={13} style={{ marginRight: 4 }} />
                          {user.phone || 'No phone'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="ul-address-area">
                      <RiMapPinLine size={16} className="ul-pin-icon" />
                      <p className="ul-address-text">{user.address}</p>
                    </div>

                    <div className="ul-footer">
                      {hasGPS ? (
                        <span className="ul-badge gps">
                          <span className="dot pulse" />
                          GPS Lock Active
                        </span>
                      ) : (
                        <span className="ul-badge address">
                          Address Search Only
                        </span>
                      )}

                      <button className="ul-nav-btn" onClick={() => handleNavigate(user)}>
                        <RiNavigationLine size={14} style={{ marginRight: 6 }} />
                        {hasGPS ? 'Navigate' : 'Locate on Map'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserLocation;
