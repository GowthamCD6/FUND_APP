import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { makeRequest } from '../../../api/apiClient.js';
import {
  Bell, BellOff, CheckCheck, Trash2, RefreshCw, Search,
  AlertTriangle, CreditCard, Gavel, Radio, CheckCircle2,
  Clock, ArrowRight, X, Filter, Sparkles, ChevronRight
} from 'lucide-react';
import './Notifications.css';

const Notifications = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('ALL'); // 'ALL' | 'UNREAD' | 'PAYMENTS' | 'AUCTIONS' | 'ANNOUNCEMENTS'
  const [searchQuery, setSearchQuery] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [actionInProgress, setActionInProgress] = useState(false);

  // Fetch notifications from MySQL DB via backend API
  const fetchNotifications = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const res = await makeRequest('/user/notifications');
      const data = await res.json();
      if (data && data.success && Array.isArray(data.data)) {
        setNotifications(data.data);
      }
    } catch (err) {
      console.warn('⚠️ [Notifications] Error fetching notifications from DB:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();

    // Poll every 30s for background notifications
    const interval = setInterval(() => {
      fetchNotifications(true);
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Mark all notifications as read
  const handleMarkAllAsRead = async () => {
    // Optimistic update
    setNotifications(prev => prev.map(n => ({ ...n, is_read: 1, isRead: true })));
    try {
      await makeRequest('/user/notifications/read', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ all: true })
      });
    } catch (err) {
      console.error('Failed to mark all as read:', err);
      fetchNotifications(true);
    }
  };

  // Mark single notification as read
  const handleMarkSingleAsRead = async (id, e) => {
    if (e) e.stopPropagation();
    if (!id) return;

    setNotifications(prev =>
      prev.map(n =>
        String(n.id) === String(id) || n.notification_key === id
          ? { ...n, is_read: 1, isRead: true }
          : n
      )
    );

    try {
      await makeRequest('/user/notifications/read', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, all: false })
      });
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  // Clear single notification
  const handleClearSingle = async (id, e) => {
    if (e) e.stopPropagation();
    if (!id) return;

    setNotifications(prev =>
      prev.filter(n => String(n.id) !== String(id) && n.notification_key !== id)
    );

    try {
      await makeRequest('/user/notifications/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, all: false })
      });
    } catch (err) {
      console.error('Failed to clear notification:', err);
      fetchNotifications(true);
    }
  };

  // Clear all notifications
  const handleClearAll = async () => {
    setShowClearConfirm(false);
    setActionInProgress(true);
    setNotifications([]);

    try {
      await makeRequest('/user/notifications/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ all: true })
      });
    } catch (err) {
      console.error('Failed to clear all notifications:', err);
      fetchNotifications(true);
    } finally {
      setActionInProgress(false);
    }
  };

  // Navigate based on notification content / action
  const handleNotificationClick = (notif) => {
    handleMarkSingleAsRead(notif.id || notif.notification_key);

    const titleLower = (notif.title || '').toLowerCase();
    const msgLower = (notif.message || '').toLowerCase();

    if (titleLower.includes('auction') || msgLower.includes('auction') || msgLower.includes('bid')) {
      navigate('/user/auction');
    } else if (titleLower.includes('payment') || titleLower.includes('due') || msgLower.includes('payment')) {
      navigate('/user/group-card');
    } else if (titleLower.includes('statement') || titleLower.includes('dividend')) {
      navigate('/user/finance');
    }
  };

  // Filter & Search logic
  const filteredNotifications = useMemo(() => {
    return notifications.filter(n => {
      // 1. Filter by category
      if (selectedFilter === 'UNREAD') {
        if (n.is_read === 1 || n.isRead === true) return false;
      } else if (selectedFilter === 'PAYMENTS') {
        const text = (n.title + ' ' + n.message).toLowerCase();
        if (!text.includes('payment') && !text.includes('due') && !text.includes('collection')) return false;
      } else if (selectedFilter === 'AUCTIONS') {
        const text = (n.title + ' ' + n.message).toLowerCase();
        if (!text.includes('auction') && !text.includes('bid') && !text.includes('draw') && !text.includes('winner')) return false;
      } else if (selectedFilter === 'ANNOUNCEMENTS') {
        const text = (n.title + ' ' + n.message).toLowerCase();
        if (!text.includes('announcement') && !text.includes('broadcast') && !text.includes('notice') && n.type !== 'broadcast') return false;
      }

      // 2. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = (n.title || '').toLowerCase().includes(q);
        const matchesMsg = (n.message || '').toLowerCase().includes(q);
        if (!matchesTitle && !matchesMsg) return false;
      }

      return true;
    });
  }, [notifications, selectedFilter, searchQuery]);

  // Counts
  const unreadCount = useMemo(() => {
    return notifications.filter(n => !(n.is_read === 1 || n.isRead === true)).length;
  }, [notifications]);

  // Helper: Format relative timestamp
  const formatTime = (ts) => {
    if (!ts) return 'Recently';
    const date = new Date(ts);
    if (isNaN(date.getTime())) return 'Recently';

    const now = new Date();
    const diffSec = Math.floor((now - date) / 1000);

    if (diffSec < 60) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;

    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  // Helper: Card icon & styling by type
  const getCardStyle = (notif) => {
    const text = (notif.title + ' ' + notif.message).toLowerCase();
    const type = notif.type || '';

    if (type === 'danger' || text.includes('overdue') || text.includes('late')) {
      return {
        icon: <AlertTriangle size={18} />,
        iconClass: 'notif-icon-danger',
        badge: 'Overdue Alert'
      };
    }
    if (type === 'broadcast' || text.includes('announcement') || text.includes('broadcast')) {
      return {
        icon: <Radio size={18} />,
        iconClass: 'notif-icon-broadcast',
        badge: 'Announcement'
      };
    }
    if (text.includes('auction') || text.includes('winner') || text.includes('draw')) {
      return {
        icon: <Gavel size={18} />,
        iconClass: 'notif-icon-auction',
        badge: 'Reverse Auction'
      };
    }
    if (text.includes('payment') || text.includes('due') || text.includes('paid')) {
      return {
        icon: <CreditCard size={18} />,
        iconClass: 'notif-icon-payment',
        badge: 'Chit Payment'
      };
    }

    return {
      icon: <CheckCircle2 size={18} />,
      iconClass: 'notif-icon-info',
      badge: 'System Notice'
    };
  };

  return (
    <div className="notif-page-container">
      {/* ── HEADER ── */}
      <div className="notif-header-card">
        <div className="notif-header-left">
          <div className="notif-header-icon-wrap">
            <Bell size={24} />
            {unreadCount > 0 && <span className="notif-header-badge-count">{unreadCount}</span>}
          </div>
          <div>
            <h1 className="notif-page-title">Notifications & Activity</h1>
            <p className="notif-page-sub">
              Stay on top of monthly chit dues, reverse auction winners, and official notices.
            </p>
          </div>
        </div>

        <div className="notif-header-actions">
          <button
            type="button"
            className="notif-btn notif-btn-secondary"
            onClick={() => {
              setRefreshing(true);
              fetchNotifications(false);
            }}
            disabled={loading || refreshing}
            title="Refresh feed"
          >
            <RefreshCw size={15} className={refreshing ? 'spin' : ''} />
            <span>Refresh</span>
          </button>

          {unreadCount > 0 && (
            <button
              type="button"
              className="notif-btn notif-btn-primary"
              onClick={handleMarkAllAsRead}
              title="Mark all notifications as read"
            >
              <CheckCheck size={16} />
              <span>Mark all read</span>
            </button>
          )}

          {notifications.length > 0 && (
            <button
              type="button"
              className="notif-btn notif-btn-danger"
              onClick={() => setShowClearConfirm(true)}
              title="Clear all notifications"
            >
              <Trash2 size={15} />
              <span>Clear all</span>
            </button>
          )}
        </div>
      </div>

      {/* ── FILTER & SEARCH BAR ── */}
      <div className="notif-filter-bar">
        <div className="notif-pills-row">
          <button
            type="button"
            className={`notif-pill ${selectedFilter === 'ALL' ? 'active' : ''}`}
            onClick={() => setSelectedFilter('ALL')}
          >
            All
            <span className="notif-pill-badge">{notifications.length}</span>
          </button>

          <button
            type="button"
            className={`notif-pill ${selectedFilter === 'UNREAD' ? 'active' : ''}`}
            onClick={() => setSelectedFilter('UNREAD')}
          >
            Unread
            {unreadCount > 0 && (
              <span className="notif-pill-badge unread">{unreadCount}</span>
            )}
          </button>

          <button
            type="button"
            className={`notif-pill ${selectedFilter === 'PAYMENTS' ? 'active' : ''}`}
            onClick={() => setSelectedFilter('PAYMENTS')}
          >
            Payments
          </button>

          <button
            type="button"
            className={`notif-pill ${selectedFilter === 'AUCTIONS' ? 'active' : ''}`}
            onClick={() => setSelectedFilter('AUCTIONS')}
          >
            Auctions
          </button>

          <button
            type="button"
            className={`notif-pill ${selectedFilter === 'ANNOUNCEMENTS' ? 'active' : ''}`}
            onClick={() => setSelectedFilter('ANNOUNCEMENTS')}
          >
            Announcements
          </button>
        </div>

        <div className="notif-search-wrap">
          <Search size={16} className="notif-search-icon" />
          <input
            type="text"
            className="notif-search-input"
            placeholder="Search notifications..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="notif-search-clear"
              onClick={() => setSearchQuery('')}
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* ── NOTIFICATION CARDS LIST ── */}
      {loading ? (
        <div className="notif-loading-card">
          <RefreshCw size={28} className="spin notif-spinner" />
          <p>Syncing notifications from database...</p>
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="notif-empty-state">
          <div className="notif-empty-icon-box">
            <BellOff size={36} />
          </div>
          <h3>No notifications found</h3>
          <p>
            {searchQuery
              ? `No notifications matched "${searchQuery}". Try a different keyword.`
              : selectedFilter !== 'ALL'
              ? `No ${selectedFilter.toLowerCase()} alerts at this time.`
              : 'You have no notifications in your inbox. You are completely caught up!'}
          </p>
          {(searchQuery || selectedFilter !== 'ALL') && (
            <button
              type="button"
              className="notif-btn notif-btn-secondary"
              style={{ marginTop: 14 }}
              onClick={() => {
                setSearchQuery('');
                setSelectedFilter('ALL');
              }}
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="notif-cards-list">
          {filteredNotifications.map((notif, idx) => {
            const isUnread = !(notif.is_read === 1 || notif.isRead === true);
            const meta = getCardStyle(notif);

            return (
              <div
                key={notif.id || notif.notification_key || idx}
                className={`notif-item-card ${isUnread ? 'unread' : ''}`}
                onClick={() => handleNotificationClick(notif)}
              >
                {/* Left: Icon */}
                <div className={`notif-item-icon ${meta.iconClass}`}>
                  {meta.icon}
                </div>

                {/* Middle: Content */}
                <div className="notif-item-content">
                  <div className="notif-item-top">
                    <span className="notif-type-badge">{meta.badge}</span>
                    <span className="notif-time-text">
                      <Clock size={12} style={{ display: 'inline', marginRight: 4 }} />
                      {formatTime(notif.created_at || notif.updated_at)}
                    </span>
                  </div>

                  <h4 className="notif-item-title">
                    {notif.title}
                    {isUnread && <span className="notif-unread-dot" />}
                  </h4>

                  <p className="notif-item-msg">{notif.message}</p>
                </div>

                {/* Right: Actions */}
                <div className="notif-item-actions" onClick={e => e.stopPropagation()}>
                  {isUnread && (
                    <button
                      type="button"
                      className="notif-card-action-btn read"
                      onClick={e => handleMarkSingleAsRead(notif.id || notif.notification_key, e)}
                      title="Mark as read"
                    >
                      <CheckCheck size={16} />
                    </button>
                  )}

                  <button
                    type="button"
                    className="notif-card-action-btn delete"
                    onClick={e => handleClearSingle(notif.id || notif.notification_key, e)}
                    title="Dismiss alert"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── CONFIRM CLEAR ALL MODAL ── */}
      {showClearConfirm && (
        <div className="notif-modal-backdrop" onClick={() => setShowClearConfirm(false)}>
          <div className="notif-modal-card" onClick={e => e.stopPropagation()}>
            <div className="notif-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div className="notif-item-icon notif-icon-danger" style={{ width: 34, height: 34 }}>
                  <Trash2 size={18} />
                </div>
                <h4 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>Clear all notifications?</h4>
              </div>
              <button
                type="button"
                className="notif-card-action-btn"
                onClick={() => setShowClearConfirm(false)}
              >
                <X size={16} />
              </button>
            </div>

            <p style={{ margin: '16px 0 20px', fontSize: 13.5, color: '#475569', lineHeight: 1.5 }}>
              This will permanently clear all notification alerts from your list in the database. You will not be able to retrieve them.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                className="notif-btn notif-btn-secondary"
                onClick={() => setShowClearConfirm(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="notif-btn notif-btn-danger"
                onClick={handleClearAll}
                disabled={actionInProgress}
              >
                {actionInProgress ? 'Clearing...' : 'Yes, Clear All'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notifications;
