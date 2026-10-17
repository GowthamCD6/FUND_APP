import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { makeRequest, safeJson } from '../../../api/apiClient.js';
import { 
  MapPin as RiMapPinLine, 
  MapPinOff as RiMapPinOffLine,
  Search as RiSearchLine, 
  Navigation as RiNavigationLine, 
  Phone as RiPhoneLine, 
  RefreshCw as RiRefreshLine, 
  AlertTriangle as RiAlertLine,
  Users as RiUsersLine,
  Compass as RiCompassLine,
  Info as RiInfoLine,
  CheckCircle2 as RiCheckCircleLine,
  Map as RiMapLine,
  ArrowLeft
} from 'lucide-react';
import './UserLocation.css';

// Loading skeleton for locations
const UserLocationSkeleton = () => (
  <div className="ul-list-container skeleton-pulse">
    <div className="ul-list">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="ul-card-skeleton">
          <div className="ul-card-left">
            <div className="ul-avatar-skeleton" />
            <div className="ul-text-skeleton">
              <div className="ul-line-title" />
              <div className="ul-line-sub" />
            </div>
          </div>
          <div className="ul-body-skeleton" />
          <div className="ul-btn-skeleton" />
        </div>
      ))}
    </div>
  </div>
);

const UserLocation = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [lastSync, setLastSync] = useState('--:--:--');

  // Load locations from API
  const fetchLocations = async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      const response = await makeRequest('/admin/users/locations');
      const data = await safeJson(response);
      if (data.success) {
        const list = data.data || [];
        setUsers(list);
        setError(null);

        // Update sync timestamp
        const now = new Date();
        setLastSync(now.toLocaleTimeString('en-US', { hour12: false }));
        
        // Auto-select first user if none selected, or keep current selection updated
        setSelectedUser(prevSelected => {
          if (list.length === 0) return null;
          if (!prevSelected) return list[0];
          const updated = list.find(u => u.id === prevSelected.id);
          return updated || prevSelected;
        });
      } else {
        setError(data.message || 'Failed to fetch user locations');
      }
    } catch (err) {
      console.error('Error fetching locations:', err);
      if (isInitial) {
        setError('Connection failed. Make sure the database backend is running.');
      }
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations(true);
  }, []);

  // Aggregate stats calculations
  const stats = useMemo(() => {
    const total = users.length;
    const gpsActive = users.filter(u => u.latitude && u.longitude).length;
    const unregistered = users.filter(u => !u.latitude && !u.longitude && (!u.address || u.address.trim() === '')).length;
    return { total, gpsActive, unregistered };
  }, [users]);

  // Filtered members list based on query
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

  // Redirect link generator for navigation
  const handleNavigate = (user) => {
    if (!user) return;
    let url = '';
    if (user.latitude && user.longitude) {
      url = `https://www.google.com/maps/dir/?api=1&destination=${user.latitude},${user.longitude}`;
    } else {
      url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(user.address)}`;
    }
    window.open(url, '_blank');
  };

  return (
    <div className="ul-page">
      
      {/* ── KPI Metric Cards Row ── */}
      <div className="ul-metrics-row">
        <div className="ul-metric-card total">
          <div className="ul-metric-icon">
            <RiUsersLine size={22} />
          </div>
          <div className="ul-metric-info">
            <span className="ul-metric-val">{stats.total}</span>
            <span className="ul-metric-lbl">Total Members</span>
          </div>
        </div>

        <div className="ul-metric-card gps">
          <div className="ul-metric-icon">
            <RiCompassLine size={22} />
          </div>
          <div className="ul-metric-info">
            <span className="ul-metric-val">{stats.gpsActive}</span>
            <span className="ul-metric-lbl">Active GPS Locks</span>
          </div>
        </div>

        <div className="ul-metric-card offline">
          <div className="ul-metric-icon">
            <RiMapPinOffLine size={22} />
          </div>
          <div className="ul-metric-info">
            <span className="ul-metric-val">{stats.unregistered}</span>
            <span className="ul-metric-lbl">No Address Registered</span>
          </div>
        </div>

        <div className="ul-metric-card sync">
          <div className="ul-metric-icon">
            <RiRefreshLine size={22} />
          </div>
          <div className="ul-metric-info">
            <span className="ul-metric-val">{lastSync}</span>
            <span className="ul-metric-lbl">Last Sync Time</span>
          </div>
        </div>
      </div>

      {/* ── Search Toolbar with Inline Back Button ── */}
      <div className="ul-toolbar">
        <button
          type="button"
          className="ul-back-btn"
          onClick={() => navigate('/admin/admintool')}
          title="Back to Admin Tools"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="ul-search-wrapper">
          <RiSearchLine size={18} className="ul-search-icon" />
          <input
            type="text"
            className="ul-search-input"
            placeholder="Search by name, phone number, or street address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* ── Main Dashboard Split View ── */}
      <div className="ul-content">
        {loading ? (
          <UserLocationSkeleton />
        ) : error ? (
          <div className="ul-error-state">
            <RiAlertLine size={48} color="#EF4444" />
            <h3>Connection Error</h3>
            <p>{error}</p>
            <button className="ul-retry-btn" onClick={() => fetchLocations(true)}>
              Retry Connection
            </button>
          </div>
        ) : users.length === 0 ? (
          <div className="ul-empty-state">
            <RiMapPinLine size={64} color="#D1D5DB" />
            <h3>No Shared Location Data</h3>
            <p>No members have uploaded their GPS lock coordinates or shared their home addresses yet.</p>
          </div>
        ) : (
          <div className="ul-content-layout">
            
            {/* LEFT PANE: List of Users */}
            <div className="ul-list-container">
              {filteredUsers.length === 0 ? (
                <div className="ul-empty-state" style={{ padding: '40px 20px' }}>
                  <RiSearchLine size={32} color="#D1D5DB" />
                  <h3 style={{ fontSize: 16 }}>No Matches</h3>
                  <p style={{ margin: 0, fontSize: 13 }}>Try searching for a different name, city, or phone number.</p>
                </div>
              ) : (
                <div className="ul-list">
                  {filteredUsers.map((user) => {
                    const hasGPS = Boolean(user.latitude && user.longitude);
                    const hasAddress = Boolean(user.address && user.address.trim() !== '');
                    const isActive = selectedUser?.id === user.id;

                    return (
                      <div 
                        key={user.id} 
                        className={`ul-card ${isActive ? 'active' : ''}`}
                        onClick={() => setSelectedUser(user)}
                      >
                        <div className="ul-card-body">
                          <div className="ul-avatar-area">
                            <div className="ul-avatar">
                              {user.profile_image || user.avatar ? (
                                <img 
                                  src={user.profile_image || user.avatar} 
                                  alt={user.name} 
                                  className="ul-avatar-img"
                                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                />
                              ) : null}
                              {(!user.profile_image && !user.avatar) && (user.name || 'U').substring(0, 2).toUpperCase()}
                            </div>
                            <div className="ul-info">
                              <h4 className="ul-member-name">{user.name}</h4>
                              <p className="ul-member-phone">
                                <RiPhoneLine size={12} />
                                {user.phone || 'No phone number'}
                              </p>
                            </div>
                          </div>
                          
                          <div className="ul-address-area">
                            <RiMapPinLine size={14} className="ul-pin-icon" style={!hasAddress ? { color: '#94a3b8' } : {}} />
                            <p className="ul-address-text" style={!hasAddress ? { color: '#94a3b8', fontStyle: 'italic' } : {}}>
                              {user.address || 'No physical address registered'}
                            </p>
                          </div>

                          <div className="ul-footer">
                            {hasGPS ? (
                              <span className="ul-badge gps">
                                <span className="dot pulse" />
                                GPS Lock
                              </span>
                            ) : hasAddress ? (
                              <span className="ul-badge address">
                                Address Shared
                              </span>
                            ) : (
                              <span className="ul-badge missing">
                                No Address
                              </span>
                            )}

                            <span className="ul-card-nav-indicator">
                              Details &rarr;
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* RIGHT PANE: Interactive Map Preview Panel */}
            <div className="ul-map-preview-panel">
              {selectedUser ? (
                <>
                  <div className="ul-map-preview-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div className="ul-avatar">
                        {selectedUser.profile_image || selectedUser.avatar ? (
                          <img 
                            src={selectedUser.profile_image || selectedUser.avatar} 
                            alt={selectedUser.name} 
                            className="ul-avatar-img"
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          />
                        ) : null}
                        {(!selectedUser.profile_image && !selectedUser.avatar) && (selectedUser.name || 'U').substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="ul-map-preview-title">{selectedUser.name}</h3>
                        <p className="ul-map-preview-sub">
                          {selectedUser.latitude && selectedUser.longitude ? (
                            <span style={{ color: '#2e7d32', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                              <span className="dot pulse" /> GPS Lock Connected
                            </span>
                          ) : (
                            <span style={{ color: '#a3704c', fontWeight: 700 }}>Address Search Match</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Google Maps Embed Iframe */}
                  <div className="ul-map-frame-wrapper">
                    {selectedUser.latitude && selectedUser.longitude ? (
                      <iframe 
                        width="100%" 
                        height="100%" 
                        src={`https://maps.google.com/maps?q=${selectedUser.latitude},${selectedUser.longitude}&z=16&output=embed`}
                        frameBorder="0" 
                        style={{ border: 0 }} 
                        allowFullScreen 
                        title={`Location Map of ${selectedUser.name}`}
                      />
                    ) : selectedUser.address ? (
                      <iframe 
                        width="100%" 
                        height="100%" 
                        src={`https://maps.google.com/maps?q=${encodeURIComponent(selectedUser.address)}&z=15&output=embed`}
                        frameBorder="0" 
                        style={{ border: 0 }} 
                        allowFullScreen 
                        title={`Address Search of ${selectedUser.name}`}
                      />
                    ) : (
                      <div className="ul-map-placeholder">
                        <RiMapLine size={48} />
                        <p>No map preview available</p>
                      </div>
                    )}
                  </div>

                  {/* Coordinates & Info Details Grid */}
                  <div className="ul-map-details">
                    <div className="ul-detail-row">
                      <RiMapPinLine size={16} className="ul-detail-icon" />
                      <div>
                        <div className="ul-detail-label">Physical Address</div>
                        <div className="ul-detail-val">{selectedUser.address || 'Not Provided'}</div>
                      </div>
                    </div>

                    {selectedUser.latitude && selectedUser.longitude && (
                      <div className="ul-detail-row">
                        <RiCompassLine size={16} className="ul-detail-icon" style={{ color: '#10b981' }} />
                        <div>
                          <div className="ul-detail-label">Office Coordinates</div>
                          <div className="ul-detail-val" style={{ fontFamily: 'monospace', fontSize: 13 }}>
                            Lat: {Number(selectedUser.latitude).toFixed(6)}, Lng: {Number(selectedUser.longitude).toFixed(6)}
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="ul-detail-row">
                      <RiInfoLine size={16} className="ul-detail-icon" style={{ color: '#3b82f6' }} />
                      <div>
                        <div className="ul-detail-label">Contact Verification</div>
                        <div className="ul-detail-val">Verified Mobile: {selectedUser.phone || 'N/A'}</div>
                      </div>
                    </div>
                  </div>

                  {/* Large Navigation redirect button */}
                  <div className="ul-map-actions">
                    <button 
                      className="ul-btn-nav-large" 
                      onClick={() => handleNavigate(selectedUser)}
                    >
                      <RiNavigationLine size={16} />
                      Navigate on Google Maps
                    </button>
                  </div>
                </>
              ) : (
                <div className="ul-map-placeholder" style={{ padding: '60px 20px' }}>
                  <RiMapLine size={48} style={{ color: '#cbd5e1' }} />
                  <h4 style={{ margin: '16px 0 6px 0', color: '#1f2937', fontWeight: 800 }}>No Selection</h4>
                  <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>
                    Select a member from the sidebar list to view their interactive map location.
                  </p>
                </div>
              )}
            </div>

          </div>
        )}
      </div>

    </div>
  );
};

export default UserLocation;
