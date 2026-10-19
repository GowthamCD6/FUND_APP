import React, { useState, useEffect } from 'react';
import { makeRequest, safeJson } from '../../../api/apiClient.js';
import {
  ChevronLeft as RiArrowLeftSLine,
  ChevronRight as RiArrowRightSLine,
  X as RiCloseLine,
  CheckCircle2 as RiCheckCircleLine,
  Clock as RiTimeLine,
  AlertCircle as RiAlertCircleLine,
  Calendar as RiCalendarLine,
  TrendingDown as RiTrendingDownLine,
  Percent as RiPercentLine,
  CreditCard as RiBankCardLine,
  MessageCircle as RiMessage2Line,
  Loader2 as RiLoader4Line,
  Info as RiInformationLine,
  Trophy as RiTrophyLine
} from 'lucide-react';
import './GroupDetailedInfo.css';

const formatCurrency = (amount) => {
  if (amount == null || amount === '' || isNaN(amount)) return 'nil';
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(amount));
};

const formatDate = (dateString) => {
  if (!dateString) return 'nil';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  } catch (error) {
    return 'Invalid Date';
  }
};

const GroupDetailedInfo = ({ group, onClose }) => {
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [monthlyData, setMonthlyData] = useState({});
  const [loading, setLoading] = useState(true);

  const monthNamesArray = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthKey = `${monthNamesArray[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`;

  let minDate = new Date(1900, 0, 1);
  if (group.startDate) {
    const parseStart = new Date(group.startDate);
    if (!isNaN(parseStart)) {
      minDate = new Date(parseStart.getFullYear(), parseStart.getMonth(), 1);
    }
  }

  const currentMonthDate = new Date(today.getFullYear(), today.getMonth(), 1);
  const isPrevDisabled = selectedDate <= minDate;
  const isNextDisabled = selectedDate >= currentMonthDate;

  useEffect(() => {
    const fetchMonthlyInfo = async () => {
      try {
        setLoading(true);
        const endpoint = `/user/portfolio/${group.id || group.groupId}/months`;
        const response = await makeRequest(endpoint);
        const result = await safeJson(response);
        if (result.success && result.data) {
          setMonthlyData(result.data);
        }
      } catch (error) {
        console.error('Error fetching monthly data:', error);
      } finally {
        setLoading(false);
      }
    };
    if (group.id || group.groupId) {
      fetchMonthlyInfo();
    } else {
      setLoading(false);
    }
  }, [group]);

  const monthData = monthlyData[monthKey] || {
    status: 'pending',
    paymentAmount: null,
    discount: null,
    commission: null,
    netAmount: null,
    dueDate: null,
    auctionWinner: null,
    amountTaken: null,
    auctionDate: null,
    paidDate: null,
    daysPending: 0,
  };

  const computeDefaultDueDate = (monthDate, startDate) => {
    if (!startDate || !monthDate) return null;
    const start = new Date(startDate);
    if (isNaN(start.getTime())) return null;

    const day = start.getDate();
    const dueDay = day > 1 ? day - 1 : 0;

    let dueDate;
    if (dueDay > 0) {
      dueDate = new Date(monthDate.getFullYear(), monthDate.getMonth(), dueDay);
    } else {
      dueDate = new Date(monthDate.getFullYear(), monthDate.getMonth(), 0);
    }

    return dueDate.toISOString().split('T')[0];
  };

  const effectiveDueDate = monthData.dueDate || computeDefaultDueDate(selectedDate, group.startDate);

  const getAmountToPay = () => {
    if (monthData.paymentAmount != null && !isNaN(monthData.paymentAmount)) return monthData.paymentAmount;
    if (monthData.netAmount != null && !isNaN(monthData.netAmount)) return monthData.netAmount;
    return null;
  };
  const amountToPayThisMonth = getAmountToPay();

  const getStatusInfo = () => {
    switch (monthData.status?.toLowerCase()) {
      case 'paid':
      case 'completed':
        return { color: '#10B981', bg: '#D1FAE5', icon: <RiCheckCircleLine size={24} color="#10B981" /> };
      case 'pending':
        return { color: '#F59E0B', bg: '#FEF3C7', icon: <RiTimeLine size={24} color="#F59E0B" /> };
      case 'overdue':
        return { color: '#EF4444', bg: '#FEE2E2', icon: <RiAlertCircleLine size={24} color="#EF4444" /> };
      default:
        return { color: '#6B7280', bg: '#F3F4F6', icon: <RiInformationLine size={24} color="#6B7280" /> };
    }
  };

  const statusInfo = getStatusInfo();

  const getSelectedMonthDisplay = () => {
    let monthNumber = null;
    if (group?.startDate) {
      const start = new Date(group.startDate);
      if (!isNaN(start.getTime())) {
        monthNumber = (selectedDate.getFullYear() - start.getFullYear()) * 12 + (selectedDate.getMonth() - start.getMonth()) + 1;
      }
    }
    const total = group?.totalMonths || group?.duration || group?.totalCycles || null;
    const monthName = selectedDate.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });

    if (monthNumber && monthNumber > 0) {
      const s = ["th", "st", "nd", "rd"];
      const v = monthNumber % 100;
      const ordinal = monthNumber + (s[(v - 20) % 10] || s[v] || s[0]);
      if (total) {
        return `${ordinal} Month of ${total} (${monthName})`;
      }
      return `${ordinal} Month (${monthName})`;
    }
    return monthName;
  };

  const selectedMonthDisplay = getSelectedMonthDisplay();

  return (
    <>
      <div className="gdi-overlay" onClick={onClose} />
      <div className="gdi-panel">
        
        {/* Header */}
        <div className="gdi-header">
          <div>
            <h2 className="gdi-title">{group.groupName || group.name || 'Group Details'}</h2>
            <p className="gdi-subtitle">Monthly breakdown & auction details</p>
          </div>
          <button className="gdi-close-btn" onClick={onClose}>
            <RiCloseLine size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="gdi-content">
          {loading ? (
            <div className="gdi-loading">
              <RiLoader4Line size={40} className="gdi-spin" color="var(--primary)" />
              <p>Loading monthly data...</p>
            </div>
          ) : (
            <>
              {/* Month Selector */}
              <div className="gdi-month-selector">
                <button 
                  className={`gdi-month-nav ${isPrevDisabled ? 'disabled' : ''}`}
                  onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1))}
                  disabled={isPrevDisabled}
                >
                  <RiArrowLeftSLine size={20} /> Prev
                </button>
                
                <div className="gdi-month-display">
                  <span className="gdi-month-label">Viewing Month</span>
                  <strong className="gdi-month-value">
                    {selectedDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                  </strong>
                  {selectedDate.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) === 
                   today.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) && (
                    <span className="gdi-current-badge">Current</span>
                  )}
                </div>

                <button 
                  className={`gdi-month-nav ${isNextDisabled ? 'disabled' : ''}`}
                  onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1))}
                  disabled={isNextDisabled}
                >
                  Next <RiArrowRightSLine size={20} />
                </button>
              </div>

              {/* Status Banner */}
              <div className="gdi-status-banner" style={{ backgroundColor: statusInfo.bg, borderColor: `${statusInfo.color}40` }}>
                <div className="gdi-status-icon-wrapper" style={{ backgroundColor: '#fff' }}>
                  {statusInfo.icon}
                </div>
                <div className="gdi-status-text">
                  <div className="gdi-status-header-line">
                    <span className="gdi-status-label">Payment Status</span>
                    <span className="gdi-status-month-badge">{selectedMonthDisplay}</span>
                  </div>
                  <div className="gdi-status-val" style={{ color: statusInfo.color }}>
                    {String(monthData.status || 'pending').toUpperCase()}
                  </div>
                </div>
                {/* Days pending/overdue or Paid Date */}
                <div className="gdi-status-extra">
                  {(monthData.status === 'pending' || monthData.status === 'overdue') && monthData.daysPending > 0 && (
                    <>
                      <div className="gdi-extra-val">{monthData.daysPending}</div>
                      <div className="gdi-extra-label">{monthData.status === 'overdue' ? 'days out' : 'days left'}</div>
                    </>
                  )}
                  {monthData.status === 'paid' && monthData.paidDate && (
                    <>
                      <div className="gdi-extra-label">Paid on</div>
                      <div className="gdi-extra-val-date">{formatDate(monthData.paidDate)}</div>
                    </>
                  )}
                </div>
              </div>

              {/* Payment Breakdown Card */}
              <div className="gdi-card">
                <div className="gdi-card-header">
                  <h3>Payment Breakdown</h3>
                </div>
                
                <div className="gdi-breakdown-row main-amount">
                  <div className="gdi-b-label">Amount to be Paid This Month</div>
                  <div className="gdi-b-val highlight">{formatCurrency(amountToPayThisMonth)}</div>
                </div>

                <div className="gdi-breakdown-grid">
                  <div className="gdi-b-item">
                    <div className="gdi-b-item-label">
                      <RiTrendingDownLine size={14} /> Discount
                    </div>
                    <div className="gdi-b-item-val">{formatCurrency(monthData.discount)}</div>
                  </div>
                  <div className="gdi-b-item">
                    <div className="gdi-b-item-label">
                      <RiPercentLine size={14} /> Commission
                    </div>
                    <div className="gdi-b-item-val">{formatCurrency(monthData.commission)}</div>
                  </div>
                </div>

                {(monthData.status === 'pending' || monthData.status === 'overdue') && (
                  <div className="gdi-due-alert">
                    <RiCalendarLine size={16} /> 
                    <span>{monthData.status === 'overdue' ? 'Was due by' : 'Due by'} <strong>{formatDate(effectiveDueDate)}</strong></span>
                  </div>
                )}
              </div>

              {/* Auction Winner Card */}
              <div className="gdi-card">
                <div className="gdi-card-header">
                  <RiTrophyLine size={18} color="#F59E0B" />
                  <h3 style={{ marginLeft: 8 }}>Auction Details</h3>
                </div>
                
                <div className="gdi-auction-info">
                  <div className="gdi-a-row">
                    <span>Winner Name</span>
                    <strong>{monthData.auctionWinner || 'nil'}</strong>
                  </div>
                  <div className="gdi-a-row">
                    <span>Amount Taken</span>
                    <strong className="gdi-a-amount">{formatCurrency(monthData.amountTaken)}</strong>
                  </div>
                  <div className="gdi-a-row">
                    <span>Auction Date</span>
                    <strong>{formatDate(monthData.auctionDate)}</strong>
                  </div>
                </div>
              </div>

            </>
          )}
        </div>
        
        {/* Actions Footer */}
        {!loading && (monthData.status === 'pending' || monthData.status === 'overdue') && (
          <div className="gdi-footer">
            <button className="gdi-btn-secondary">
              <RiMessage2Line size={18} /> Contact Admin
            </button>
            <button className="gdi-btn-primary">
              <RiBankCardLine size={18} /> Pay Now
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default GroupDetailedInfo;
