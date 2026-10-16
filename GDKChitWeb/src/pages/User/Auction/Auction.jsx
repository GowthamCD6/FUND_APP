import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext.jsx';
import { makeRequest } from '../../../api/apiClient.js';
import AuctionWebSocketService from '../../../services/AuctionWebSocketService.js';
import {
  Gavel, Clock, Flame, Users, Trophy, Sparkles, Send,
  ArrowDownCircle, ShieldCheck, CheckCircle2, AlertCircle, RefreshCw, Loader2
} from 'lucide-react';
import './UserAuction.css';

const formatINR = (amt) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(amt) || 0);

const UserAuction = () => {
  const { user } = useAuth();
  const [userGroups, setUserGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [loading, setLoading] = useState(true);

  // Auction live state
  const [isLive, setIsLive] = useState(false);
  const [isDiceRolling, setIsDiceRolling] = useState(false);
  const [rollTimer, setRollTimer] = useState(30);
  const [diceFace, setDiceFace] = useState(1);
  const [timeRemaining, setTimeRemaining] = useState(300);
  const [currentLowestBid, setCurrentLowestBid] = useState(0);
  const [bidHistory, setBidHistory] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [bidInput, setBidInput] = useState('');
  const [submittingBid, setSubmittingBid] = useState(false);
  const [winnerModal, setWinnerModal] = useState({ isOpen: false, winner: null, amount: 0 });
  const [myBid, setMyBid] = useState(0);

  // 1. Fetch user groups
  useEffect(() => {
    const fetchGroups = async () => {
      setLoading(true);
      try {
        const res = await makeRequest('/user/portfolio');
        const data = await res.json();
        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          setUserGroups(data.data);
          setSelectedGroup(data.data[0]);
        }
      } catch (err) {
        console.error('Failed to load user groups for auction:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchGroups();
  }, []);

  // 2. Connect WebSocket & poll auction status for selected group
  useEffect(() => {
    if (!selectedGroup?.id) return;

    const token = localStorage.getItem('accessToken');
    const userId = user?.id || localStorage.getItem('userId');
    const groupId = selectedGroup.id;
    const initialPool = Number(selectedGroup.investmentAmount) || 100000;

    setCurrentLowestBid(initialPool);

    // Check backend if an auction is active
    const checkActiveAuction = async () => {
      try {
        const res = await makeRequest(`/user/auctions/active?groupId=${encodeURIComponent(groupId)}`);
        const data = await res.json();
        if (data.success && data.active) {
          setIsLive(true);
          if (data.currentBid) setCurrentLowestBid(data.currentBid);
          if (data.timeLeft) setTimeRemaining(data.timeLeft);
        } else {
          setIsLive(false);
        }
      } catch (e) {
        // Auction not currently active
        setIsLive(false);
      }
    };
    checkActiveAuction();

    // Setup WebSocket
    let cleanupFns = [];
    if (token && userId) {
      AuctionWebSocketService.connect(token, userId, 'user')
        .then(() => {
          const unsubStart = AuctionWebSocketService.on('auction_started', (data) => {
            if (!data.groupId || String(data.groupId) === String(groupId)) {
              setIsLive(true);
              setIsDiceRolling(false);
              if (data.initialAmount) setCurrentLowestBid(data.initialAmount);
              if (data.duration) setTimeRemaining(data.duration);
            }
          });

          const unsubBid = AuctionWebSocketService.on('bid_placed', (data) => {
            setCurrentLowestBid(data.bidAmount || data.amount);
            setBidHistory((prev) => [
              {
                id: Date.now(),
                bidderName: data.userName || `Member #${data.userId}`,
                userId: data.userId,
                amount: data.bidAmount || data.amount,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
              },
              ...prev.slice(0, 49),
            ]);
          });

          const unsubTime = AuctionWebSocketService.on('time_update', (data) => {
            if (data.timeRemaining !== undefined) {
              setTimeRemaining(data.timeRemaining);
            }
          });

          const unsubDice = AuctionWebSocketService.on('dice_rolling', (data) => {
            if (!data.groupId || String(data.groupId) === String(groupId)) {
              setIsLive(true);
              setIsDiceRolling(true);
              const durationSec = Math.floor((data.duration || 30000) / 1000);
              setRollTimer(durationSec);
              if (data.initialAmount) setCurrentLowestBid(data.initialAmount);

              const diceInterval = setInterval(() => {
                setDiceFace(Math.floor(Math.random() * 6) + 1);
              }, 150);

              const timerCountdown = setInterval(() => {
                setRollTimer((prev) => {
                  if (prev <= 1) {
                    clearInterval(timerCountdown);
                    clearInterval(diceInterval);
                    return 0;
                  }
                  return prev - 1;
                });
              }, 1000);

              setTimeout(() => {
                clearInterval(diceInterval);
                clearInterval(timerCountdown);
                setIsLive(false);
                setIsDiceRolling(false);
                setWinnerModal({
                  isOpen: true,
                  winner: data.winner || { name: 'Lucky Draw Winner' },
                  amount: data.initialAmount || currentLowestBid,
                });
              }, data.duration || 30000);
            }
          });

          const unsubEnd = AuctionWebSocketService.on('auction_ended', (data) => {
            setIsLive(false);
            setIsDiceRolling(false);
            setWinnerModal({
              isOpen: true,
              winner: data.winner || { name: 'Winner Declared' },
              amount: data.amount || currentLowestBid,
            });
          });

          cleanupFns = [unsubStart, unsubBid, unsubTime, unsubDice, unsubEnd];
        })
        .catch((err) => console.log('Auction WS error:', err));
    }

    return () => {
      cleanupFns.forEach((fn) => typeof fn === 'function' && fn());
    };
  }, [selectedGroup, user?.id]);

  // Handle placing a bid
  const handlePlaceBid = async (customBidAmount = null) => {
    const targetBid = Number(customBidAmount !== null ? customBidAmount : bidInput);
    if (!targetBid || isNaN(targetBid) || targetBid <= 0) {
      alert('Please enter a valid bid amount.');
      return;
    }

    if (currentLowestBid && targetBid >= currentLowestBid) {
      alert(`Your bid must be strictly lower than the current lowest bid of ${formatINR(currentLowestBid)}.`);
      return;
    }

    setSubmittingBid(true);
    try {
      // 1. Send via WebSocket if connected
      const wsSent = AuctionWebSocketService.send('place_bid', {
        groupId: selectedGroup.id,
        bidAmount: targetBid,
        userId: user?.id,
        userName: user?.name || user?.username,
      });

      // 2. Also send REST backup
      if (!wsSent) {
        await makeRequest('/user/auctions/bid', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            groupId: selectedGroup.id,
            bidAmount: targetBid,
          }),
        });
      }

      setMyBid(targetBid);
      setCurrentLowestBid(targetBid);
      setBidHistory((prev) => [
        {
          id: Date.now(),
          bidderName: user?.name || 'You',
          userId: user?.id,
          amount: targetBid,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        },
        ...prev,
      ]);
      setBidInput('');
    } catch (err) {
      alert(err.message || 'Failed to place bid.');
    } finally {
      setSubmittingBid(false);
    }
  };

  const handleQuickDecrement = (decrement) => {
    const base = currentLowestBid || (Number(selectedGroup?.investmentAmount) || 100000);
    const newBid = Math.max(0, base - decrement);
    setBidInput(String(newBid));
    handlePlaceBid(newBid);
  };

  const formatTimer = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="ua-container" style={{ textAlign: 'center', padding: '80px 20px' }}>
        <Loader2 size={36} className="spin" color="var(--primary)" style={{ margin: '0 auto 16px' }} />
        <h3 style={{ margin: 0, color: 'var(--text)' }}>Loading Auction Room...</h3>
      </div>
    );
  }

  return (
    <div className="ua-container">
      {/* Header */}
      <div className="ua-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 className="ua-title">Live Chit Fund Auction</h1>
            <p className="ua-subtitle">
              Compete in real-time reverse bidding for the monthly chit fund prize pot. Lowest bid wins the dividend!
            </p>
          </div>

          {userGroups.length > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>Select Chit Group:</span>
              <select
                value={selectedGroup?.id}
                onChange={(e) => {
                  const g = userGroups.find((x) => String(x.id) === String(e.target.value));
                  if (g) setSelectedGroup(g);
                }}
                style={{
                  padding: '8px 14px',
                  borderRadius: 'var(--radius)',
                  border: '1.5px solid var(--border)',
                  fontWeight: 600,
                  fontSize: 14,
                  background: 'var(--surface)',
                  color: 'var(--text)',
                }}
              >
                {userGroups.map((grp) => (
                  <option key={grp.id} value={grp.id}>
                    {grp.groupName || grp.group_name} ({formatINR(grp.investmentAmount || 100000)})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {!selectedGroup ? (
        <div className="ua-waiting-card">
          <Gavel size={48} color="var(--subtle)" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ margin: '0 0 8px' }}>No Chit Groups Enrolled</h3>
          <p style={{ margin: '0 0 20px', color: 'var(--muted)', fontSize: 14.5 }}>
            You need to be part of an active chit group to participate in monthly auctions.
          </p>
          <a
            href="/user/join-group"
            style={{
              display: 'inline-flex',
              padding: '10px 20px',
              borderRadius: 'var(--radius)',
              background: 'var(--primary)',
              color: '#fff',
              fontWeight: 600,
            }}
          >
            Join a Group
          </a>
        </div>
      ) : !isLive ? (
        /* Waiting / Idle State */
        <div className="ua-waiting-card">
          <div className="ua-waiting-icon">
            <Clock size={40} />
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 8px', color: 'var(--text)' }}>
            Auction Scheduled for {selectedGroup.groupName || selectedGroup.group_name}
          </h2>
          <p style={{ fontSize: 15, color: 'var(--muted)', maxWidth: 480, margin: '0 auto 24px', lineHeight: 1.6 }}>
            The chit administrator has not started this month's live bidding session yet. Once the admin starts the countdown, your screen will automatically connect into the live room!
          </p>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 12,
              padding: '12px 24px',
              background: 'var(--surface2)',
              borderRadius: 'var(--radius)',
              border: '1px solid var(--border)',
              fontSize: 14,
              fontWeight: 600,
              color: 'var(--text)',
            }}
          >
            <div className="ua-live-dot" style={{ background: '#f59e0b' }} />
            Listening for Admin Start Broadcast...
          </div>
        </div>
      ) : isDiceRolling ? (
        /* Lucky Draw / Random Auction 30s Live Arena */
        <div className="ua-waiting-card" style={{ padding: '40px 24px', background: '#ffffff', borderColor: '#cbd5e1' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderRadius: 20, background: '#fdf2f8', color: '#db2777', fontWeight: 800, fontSize: 13, marginBottom: 20 }}>
            <span className="ua-live-dot" style={{ background: '#db2777' }} />
            <span>30-SECOND LUCKY DRAW IN PROGRESS</span>
          </div>

          <div style={{ fontSize: 64, lineHeight: 1, marginBottom: 12 }}>
            🎲
          </div>

          <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)', margin: '0 0 8px' }}>
            Selecting Chit Winner for {selectedGroup.groupName || selectedGroup.group_name}...
          </h2>
          <p style={{ fontSize: 14.5, color: 'var(--muted)', maxWidth: 440, margin: '0 auto 24px', lineHeight: 1.5 }}>
            The lucky draw is rolling live across all enrolled participants. Winner will be revealed in:
          </p>

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, fontSize: 36, fontWeight: 900, color: '#059669', background: '#ecfdf5', padding: '14px 32px', borderRadius: 16, border: '2px solid #a7f3d0' }}>
            <Clock size={32} />
            <span>{rollTimer.toString().padStart(2, '0')}s</span>
          </div>

          <div style={{ marginTop: 24, padding: '12px 24px', borderRadius: 12, background: 'var(--surface2)', display: 'inline-block' }}>
            <span style={{ fontSize: 13, color: 'var(--muted)' }}>Lucky Draw Prize Pot: </span>
            <strong style={{ fontSize: 16, color: '#059669' }}>{formatINR(currentLowestBid)}</strong>
          </div>
        </div>
      ) : (
        /* Live Auction Arena */
        <div className="ua-grid-layout">
          {/* Left: Main Arena */}
          <div className="ua-arena-card">
            <div className="ua-arena-header">
              <span className="ua-live-indicator">
                <span className="ua-live-dot" />
                Live Bidding Session
              </span>

              <div className="ua-timer-box">
                <Clock size={16} />
                <span>{formatTimer(timeRemaining)}</span>
              </div>
            </div>

              <div className="ua-bid-focus">
                <div className="ua-bid-label">Current Lowest Bid (Pool Value)</div>
                <div className="ua-bid-amount">{formatINR(currentLowestBid)}</div>
                <div className="ua-bid-subinfo">
                  Chit Fund Gross Value: {formatINR(selectedGroup.investmentAmount || 100000)} • Dividend Distributed to All Members
                </div>
              </div>

            <div className="ua-bidding-body">
              <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 10 }}>
                Quick Bid Reductions
              </p>
              <div className="ua-quick-increments">
                <button className="ua-inc-btn" onClick={() => handleQuickDecrement(500)} disabled={submittingBid}>
                  <span>-₹500</span>
                  <span>Fast Drop</span>
                </button>
                <button className="ua-inc-btn" onClick={() => handleQuickDecrement(1000)} disabled={submittingBid}>
                  <span>-₹1,000</span>
                  <span>Standard</span>
                </button>
                <button className="ua-inc-btn" onClick={() => handleQuickDecrement(2000)} disabled={submittingBid}>
                  <span>-₹2,000</span>
                  <span>Aggressive</span>
                </button>
                <button className="ua-inc-btn" onClick={() => handleQuickDecrement(5000)} disabled={submittingBid}>
                  <span>-₹5,000</span>
                  <span>Power Bid</span>
                </button>
              </div>

              <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 8 }}>
                Or Enter Custom Bid Amount
              </p>
              <form
                className="ua-bid-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  handlePlaceBid();
                }}
              >
                <div className="ua-bid-input-wrap">
                  <span className="ua-input-prefix">₹</span>
                  <input
                    type="number"
                    className="ua-bid-input"
                    placeholder={`e.g. ${Math.max(0, currentLowestBid - 1000)}`}
                    value={bidInput}
                    onChange={(e) => setBidInput(e.target.value)}
                    disabled={submittingBid}
                  />
                </div>

                <button type="submit" className="ua-btn-place-bid" disabled={submittingBid || !bidInput}>
                  {submittingBid ? (
                    <>
                      <Loader2 size={18} className="spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Gavel size={18} />
                      Submit Bid
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Right: Real-time Feed */}
          <div className="ua-stream-card">
            <h3 className="ua-stream-title">
              <Flame size={18} color="#f59e0b" />
              Live Bidding Activity
            </h3>

            {bidHistory.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--muted)', fontSize: 13.5 }}>
                Waiting for the first bid to be placed...
              </div>
            ) : (
              <div className="ua-bids-feed">
                {bidHistory.map((item) => (
                  <div
                    key={item.id}
                    className={`ua-bid-item ${String(item.userId) === String(user?.id) ? 'is-me' : ''}`}
                  >
                    <div className="ua-bidder-meta">
                      <span className="ua-bidder-name">
                        {item.bidderName} {String(item.userId) === String(user?.id) ? '(You)' : ''}
                      </span>
                      <span className="ua-bidder-time">{item.time}</span>
                    </div>
                    <span className="ua-bid-val">{formatINR(item.amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Winner Celebration Modal */}
      {winnerModal.isOpen && (
        <div className="ua-winner-modal" onClick={() => setWinnerModal({ isOpen: false, winner: null, amount: 0 })}>
          <div className="ua-winner-box" onClick={(e) => e.stopPropagation()}>
            <div className="ua-trophy-ring">
              <Trophy size={48} />
            </div>

            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1 }}>
              Official Auction Result
            </span>
            <h2 style={{ fontSize: 26, fontWeight: 800, margin: '6px 0 10px', color: 'var(--text)' }}>
              Congratulations! 🎉
            </h2>

            <div
              style={{
                background: 'var(--surface2)',
                borderRadius: 'var(--radius)',
                padding: '18px',
                margin: '18px 0 24px',
                textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14 }}>
                <span style={{ color: 'var(--muted)' }}>Auction Winner:</span>
                <span style={{ fontWeight: 800, color: 'var(--text)' }}>
                  {winnerModal.winner?.name || winnerModal.winner?.userName || 'Winning Member'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                <span style={{ color: 'var(--muted)' }}>Prize Money Disbursed:</span>
                <span style={{ fontWeight: 800, color: '#10b981' }}>
                  {formatINR(winnerModal.amount)}
                </span>
              </div>
            </div>

            <button
              onClick={() => setWinnerModal({ isOpen: false, winner: null, amount: 0 })}
              style={{
                width: '100%',
                padding: '13px',
                background: 'var(--primary)',
                color: '#fff',
                fontSize: 15,
                fontWeight: 700,
                border: 'none',
                borderRadius: 'var(--radius)',
                cursor: 'pointer',
              }}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserAuction;
