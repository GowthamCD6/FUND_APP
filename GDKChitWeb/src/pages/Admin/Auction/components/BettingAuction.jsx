import React from 'react';
import {
  Gavel as RiGavelLine, Users as RiGroupLine, Play as RiPlayLine, Pause as RiPauseLine,
  RotateCcw as RiResetLine, Timer as RiTimerLine, Trophy as RiTrophyLine, Crown as RiCrownLine,
  History as RiHistoryLine, Zap as RiZapLine, AlertTriangle as RiAlertLine
} from 'lucide-react';

import './BettingAuction.css';

const BettingAuction = ({
  selectedGroup,
  participants,
  joinedParticipants = new Set(),
  wsConnected,
  activeBidders,
  auctionHistory,
  auctionStarted,
  isAuctionActive,
  poolAmount,
  setPoolAmount,
  initialAmount,
  setInitialAmount,
  auctionDuration,
  setAuctionDuration,
  timeRemaining,
  setTimeRemaining,
  handleStartBettingAuction,
  handlePauseAuction,
  handleResumeAuction,
  handleResetBettingAuction,
  handleEndAuction,
  getCurrentLowestBid,
  resetAuction,
  formatTime,
  formatCurrency,
  errorMessage = ''
}) => {
  const allJoined = participants.length > 0 && participants.every(p => joinedParticipants.has(String(p.userId || p.id)));
  const joinedCount = participants.filter(p => joinedParticipants.has(String(p.userId || p.id))).length;

  return (
    <div className="auc-betting-live-layout">
      <div className="auc-live-controls-card">
        <div className="auc-live-controls-header">
          <div className="auc-controls-icon-wrap" style={{ background: '#EBF3ED', color: '#1B3322' }}>
            <RiGavelLine size={24} color="#1B3322" />
          </div>
          <div>
            <h4 className="auc-controls-title">Auction Monitor</h4>
            <p className="auc-controls-subtitle">Real-time reverse bidding auction</p>
          </div>
        </div>

        {/* Member Readiness Status Banner */}
        {!auctionStarted && (
          <div style={{
            margin: '12px 0 16px',
            padding: '10px 14px',
            borderRadius: '8px',
            background: allJoined ? '#EBF3ED' : '#FDF6F0',
            border: `1px solid ${allJoined ? '#C8DEC9' : '#E8D5C4'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '13px',
            fontWeight: 600,
            color: allJoined ? '#1B3322' : '#A3704C'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: allJoined ? '#2E7D32' : '#A3704C',
                display: 'inline-block'
              }} />
              <span>
                {allJoined 
                  ? 'All members have joined and are ready!' 
                  : `Waiting for members to apply/join: ${joinedCount}/${participants.length} joined`}
              </span>
            </div>
            <span style={{ fontSize: '12px', fontWeight: 700 }}>
              {Math.round((joinedCount / Math.max(participants.length, 1)) * 100)}%
            </span>
          </div>
        )}

        {errorMessage && (
          <div style={{
            marginBottom: 14,
            padding: '10px 14px',
            borderRadius: '6px',
            background: '#FDECEC',
            border: '1px solid #F5C6C6',
            color: '#D32F2F',
            fontSize: '13px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <RiAlertLine size={16} />
            <span>{errorMessage}</span>
          </div>
        )}

        {!auctionStarted && (
          <div className="auc-initial-amount-card">
            <label className="auc-input-label">Pool Amount</label>
            <div className="auc-amount-input-row" style={{ marginBottom: 16 }}>
              <span className="auc-currency-symbol">₹</span>
              <input
                type="number"
                className="auc-amount-input"
                value={poolAmount}
                onChange={e => setPoolAmount(e.target.value)}
                placeholder="Enter Pool Amount..."
              />
            </div>

            <label className="auc-input-label">Initial Bidding Start Amount</label>
            <div className="auc-amount-input-row">
              <span className="auc-currency-symbol">₹</span>
              <input
                type="number"
                className="auc-amount-input"
                value={initialAmount}
                onChange={e => setInitialAmount(e.target.value)}
                placeholder={selectedGroup ? String(selectedGroup.groupAmount / selectedGroup.duration) : ''}
              />
            </div>
            <span className="auc-input-hint">Must be in multiples of ₹1,000</span>
            
            <label className="auc-input-label" style={{ marginTop: 12 }}>Duration (seconds)</label>
            <select
              className="auc-duration-select"
              value={auctionDuration}
              onChange={e => {
                const val = Number(e.target.value);
                setAuctionDuration(val);
                setTimeRemaining(val);
              }}
            >
              <option value={120}>2 minutes</option>
              <option value={180}>3 minutes</option>
              <option value={300}>5 minutes (default)</option>
              <option value={600}>10 minutes</option>
            </select>
          </div>
        )}

        <div className="auc-control-buttons">
          <button
            className="auc-ctrl-btn auc-ctrl-start"
            disabled={isAuctionActive || auctionStarted || !allJoined}
            onClick={handleStartBettingAuction}
            style={{
              opacity: (isAuctionActive || auctionStarted || !allJoined) ? 0.6 : 1,
              cursor: (isAuctionActive || auctionStarted || !allJoined) ? 'not-allowed' : 'pointer',
              background: allJoined ? '#2E7D32' : '#6B7A6E'
            }}
            title={!allJoined ? 'All selected members must join before starting the auction' : 'Start Auction'}
          >
            <RiPlayLine size={16} />
            {allJoined ? 'Start Auction' : 'Waiting for Users...'}
          </button>
          <button
            className="auc-ctrl-btn auc-ctrl-pause"
            disabled={!auctionStarted}
            onClick={isAuctionActive ? handlePauseAuction : handleResumeAuction}
          >
            {isAuctionActive ? <RiPauseLine size={16} /> : <RiPlayLine size={16} />}
            {isAuctionActive ? 'Pause' : 'Resume'}
          </button>
          <button
            className="auc-ctrl-btn auc-ctrl-reset"
            onClick={handleResetBettingAuction}
          >
            <RiResetLine size={16} />
            Reset
          </button>
        </div>
      </div>

      <div className={`auc-timer-card ${timeRemaining < 60 ? 'warning' : ''}`}>
        <RiTimerLine size={36} color={timeRemaining < 60 ? '#EF4444' : '#6B46C1'} />
        <div className={`auc-timer-value ${timeRemaining < 60 ? 'warning' : ''}`}>
          {formatTime(timeRemaining)}
        </div>
        <span className="auc-timer-label">
          {isAuctionActive ? 'Time Remaining' : auctionStarted ? 'Paused' : 'Duration'}
        </span>
        {isAuctionActive && timeRemaining < 60 && (
          <div className="auc-timer-warning-badge">
            <RiAlertLine size={14} />
            Less than 1 minute!
          </div>
        )}
      </div>

      <div className="auc-stats-row">
        <div className="auc-stat-card">
          <div className="auc-stat-icon blue">
            <RiGroupLine size={20} />
          </div>
          <div className="auc-stat-value">{participants.length}</div>
          <div className="auc-stat-label">Participants</div>
        </div>
        <div className="auc-stat-card">
          <div className="auc-stat-icon purple">
            <RiTrophyLine size={20} />
          </div>
          <div className="auc-stat-value" style={{ fontSize: 14 }}>
            {formatCurrency(getCurrentLowestBid())}
          </div>
          <div className="auc-stat-label">Lowest Bid</div>
        </div>
        <div className="auc-stat-card">
          <div className="auc-stat-icon green">
            <RiHistoryLine size={20} />
          </div>
          <div className="auc-stat-value">{auctionHistory.length}</div>
          <div className="auc-stat-label">Total Bids</div>
        </div>
      </div>

      <div className="auc-live-grid">
        <div className="auc-section-card">
          <div className="auc-section-header">
            <RiGroupLine size={18} color="#1B3322" />
            <span>Participants Joined ({joinedCount}/{participants.length})</span>
          </div>
          <div className="auc-bidder-list" style={{ maxHeight: '240px', overflowY: 'auto' }}>
            {participants.map((p) => {
              const hasJoined = joinedParticipants.has(String(p.userId || p.id));
              return (
                <div key={p.userId || p.id} className="auc-bidder-row">
                  <div className="auc-bidder-info">
                    <div className="auc-m-avatar">
                      {(p.name || 'U').substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="auc-m-name">{p.name}</div>
                      <div className="auc-m-phone">{p.phone || '--'}</div>
                    </div>
                  </div>
                  <div>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: '11.5px',
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: '12px',
                      background: hasJoined ? '#EBF3ED' : '#FDF6F0',
                      color: hasJoined ? '#2E7D32' : '#A3704C',
                      border: `1px solid ${hasJoined ? '#C8DEC9' : '#E8D5C4'}`
                    }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: hasJoined ? '#2E7D32' : '#A3704C' }} />
                      {hasJoined ? 'Ready' : 'Pending'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="auc-section-card">
          <div className="auc-section-header">
            <RiZapLine size={18} color="#10B981" />
            <span>Live Bidders</span>
            {wsConnected && (
              <div className="auc-connection-badge">
                <div className="auc-connection-dot"></div>
                Connected
              </div>
            )}
          </div>
          {activeBidders.length === 0 ? (
            <div className="auc-empty-section">
              <RiGroupLine size={32} color="#d1d5db" />
              <p>Waiting for bids...</p>
            </div>
          ) : (
            <div className="auc-bidder-list">
              {activeBidders
                .sort((a, b) => a.amount - b.amount)
                .map((bidder, index) => (
                  <div key={bidder.userId} className={`auc-bidder-row ${index === 0 ? 'leader' : ''}`}>
                    <div className="auc-bidder-info">
                      <div className={`auc-m-avatar ${index === 0 ? 'leader' : ''}`}>
                        {(bidder.userName || 'U').substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="auc-m-name">{bidder.userName}</div>
                        <div className="auc-m-phone">
                          {new Date(bidder.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                    <div className="auc-bidder-amount-wrap">
                      <span className={`auc-bidder-amount ${index === 0 ? 'leader' : ''}`}>
                        {formatCurrency(bidder.amount)}
                      </span>
                      {index === 0 && <RiCrownLine size={16} color="#FFD700" />}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        <div className="auc-section-card">
          <div className="auc-section-header">
            <RiTrophyLine size={18} color="#6B46C1" />
            <span>Leaderboard</span>
          </div>
          {participants.filter(p => p.bid > 0).length === 0 ? (
            <div className="auc-empty-section">
              <RiGroupLine size={32} color="#d1d5db" />
              <p>No bids placed yet</p>
            </div>
          ) : (
            <div className="auc-bidder-list">
              {participants
                .filter(p => p.bid > 0)
                .sort((a, b) => a.bid - b.bid)
                .map((p, index) => (
                  <div key={p.userId} className={`auc-bidder-row ${index === 0 ? 'leader' : ''}`}>
                    <div className="auc-bidder-info">
                      <div className={`auc-m-avatar ${index === 0 ? 'leader' : ''}`}>
                        {(p.name || 'U').substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="auc-m-name">{p.name}</div>
                        <div className="auc-m-phone">{p.phone}</div>
                      </div>
                    </div>
                    <div className="auc-bidder-amount-wrap">
                      <span className={`auc-bidder-amount ${index === 0 ? 'leader' : ''}`}>
                        {formatCurrency(p.bid)}
                      </span>
                      <span className="auc-rank">#{index + 1}</span>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      <div className="auc-section-card" style={{ marginTop: 16 }}>
        <div className="auc-section-header">
          <RiHistoryLine size={18} color="#6B46C1" />
          <span>Bid History</span>
        </div>
        {auctionHistory.length === 0 ? (
          <div className="auc-empty-section">
            <RiHistoryLine size={32} color="#d1d5db" />
            <p>No activity yet</p>
          </div>
        ) : (
          <div className="auc-history-list">
            {[...auctionHistory].reverse().map((entry, index) => (
              <div key={`${entry.userId}-${entry.bid}-${index}`} className="auc-history-row">
                <div>
                  <div className="auc-history-user">{entry.user}</div>
                  <div className="auc-history-time">{entry.time}</div>
                </div>
                <span className="auc-history-bid">{formatCurrency(entry.bid)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {auctionStarted && (
        <div className="auc-betting-footer" style={{ marginTop: 20 }}>
          <button className="auc-btn-finish" onClick={handleEndAuction}>
            End Auction & Declare Winner
          </button>
        </div>
      )}
    </div>
  );
};

export default BettingAuction;
