import React from 'react';
import {
  Users as RiGroupLine, Dice5 as RiDiceLine, Loader2 as RiLoader4Line, Timer as RiTimerLine,
  UserCheck as RiUserCheckLine, Clock as RiTimeLine
} from 'lucide-react';

import './RandomAuction.css';

const RandomAuction = ({
  selectedGroup,
  participants,
  joinedParticipants,
  isRolling,
  diceValue,
  rollTimer,
  showDiceResult,
  rollDice,
  poolAmount,
  setPoolAmount
}) => {
  return (
    <div className="auc-random-layout">
      <div className="auc-dice-box">
        <div className="auc-dice-title-bar">
          <h4>Lucky Draw</h4>
          <span className="auc-participant-badge">
            <RiGroupLine size={14} />
            {participants.length} Participants
          </span>
        </div>

        {!isRolling && !showDiceResult && (
          <div className="auc-initial-amount-card" style={{ width: '100%', marginBottom: 20 }}>
            <label className="auc-input-label">Pool Amount</label>
            <div className="auc-amount-input-row">
              <span className="auc-currency-symbol">₹</span>
              <input
                type="number"
                className="auc-amount-input"
                value={poolAmount}
                onChange={e => setPoolAmount(e.target.value)}
                placeholder="Enter Pool Amount..."
              />
            </div>
            <span className="auc-input-hint">The total pool amount for this lucky draw cycle.</span>
          </div>
        )}

        <div className="scene">
          <div className={`cube ${isRolling ? 'rolling' : `show-${diceValue}`}`}>
            <div className="cube__face cube__face--1">{renderDiceDots(1)}</div>
            <div className="cube__face cube__face--2">{renderDiceDots(2)}</div>
            <div className="cube__face cube__face--3">{renderDiceDots(3)}</div>
            <div className="cube__face cube__face--4">{renderDiceDots(4)}</div>
            <div className="cube__face cube__face--5">{renderDiceDots(5)}</div>
            <div className="cube__face cube__face--6">{renderDiceDots(6)}</div>
          </div>
        </div>

        {showDiceResult && (
          <div className="auc-dice-result-banner">
            <span>Rolled:</span>
            <div className="auc-dice-result-value">{diceValue}</div>
          </div>
        )}

        {isRolling && rollTimer > 0 && (
          <div className="auc-dice-timer">
            <RiTimerLine size={16} />
            <span>{rollTimer.toString().padStart(2, '0')}s</span>
          </div>
        )}

        {/* Member Readiness Status Banner */}
        <div style={{
          width: '100%',
          marginBottom: 16,
          padding: '10px 14px',
          borderRadius: '8px',
          background: participants.length > 0 && participants.every(p => joinedParticipants.has(String(p.userId || p.id))) ? '#EBF3ED' : '#FDF6F0',
          border: `1px solid ${participants.length > 0 && participants.every(p => joinedParticipants.has(String(p.userId || p.id))) ? '#C8DEC9' : '#E8D5C4'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '13px',
          fontWeight: 600,
          color: participants.length > 0 && participants.every(p => joinedParticipants.has(String(p.userId || p.id))) ? '#1B3322' : '#A3704C'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: participants.length > 0 && participants.every(p => joinedParticipants.has(String(p.userId || p.id))) ? '#2E7D32' : '#A3704C',
              display: 'inline-block'
            }} />
            <span>
              {participants.length > 0 && participants.every(p => joinedParticipants.has(String(p.userId || p.id)))
                ? 'All participants are joined and ready!'
                : `Waiting for participants: ${participants.filter(p => joinedParticipants.has(String(p.userId || p.id))).length}/${participants.length} joined`}
            </span>
          </div>
        </div>

        <button
          className="auc-btn-roll"
          disabled={isRolling || participants.length === 0 || !participants.every(p => joinedParticipants.has(String(p.userId || p.id)))}
          onClick={rollDice}
          style={{
            opacity: (isRolling || participants.length === 0 || !participants.every(p => joinedParticipants.has(String(p.userId || p.id)))) ? 0.6 : 1,
            cursor: (isRolling || participants.length === 0 || !participants.every(p => joinedParticipants.has(String(p.userId || p.id)))) ? 'not-allowed' : 'pointer',
            background: participants.length > 0 && participants.every(p => joinedParticipants.has(String(p.userId || p.id))) ? '#2E7D32' : '#6B7A6E'
          }}
        >
          {isRolling ? (
            <><RiLoader4Line size={18} className="spin-anim" /> Rolling...</>
          ) : !participants.every(p => joinedParticipants.has(String(p.userId || p.id))) ? (
            <><RiTimerLine size={18} /> Waiting for all members to join...</>
          ) : (
            <><RiDiceLine size={18} /> Roll Dice (Lucky Draw)</>
          )}
        </button>
      </div>

      <div className="auc-rand-participants">
        <h5>Participating Members ({participants.length})</h5>
        <div className="auc-rand-list">
          {participants.map((p, index) => {
            const hasJoined = joinedParticipants.has(String(p.userId));
            return (
              <div key={p.userId} className="auc-rand-row">
                <div className="auc-rand-row-left">
                  <div className="auc-rand-number">{index + 1}</div>
                  <div className="auc-m-avatar">{(p.name || 'U').substring(0, 2).toUpperCase()}</div>
                  <span>{p.name}</span>
                </div>
                <div className={`auc-join-badge ${hasJoined ? 'joined' : 'pending'}`}>
                  {hasJoined ? (
                    <><RiUserCheckLine size={12} /> Joined</>
                  ) : (
                    <><RiTimeLine size={12} /> Pending</>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Helper: Render dice dots for a given value
function renderDiceDots(value) {
  const dotPositions = {
    1: [[50, 50]],
    2: [[25, 25], [75, 75]],
    3: [[25, 25], [50, 50], [75, 75]],
    4: [[25, 25], [75, 25], [25, 75], [75, 75]],
    5: [[25, 25], [75, 25], [50, 50], [25, 75], [75, 75]],
    6: [[25, 25], [75, 25], [25, 50], [75, 50], [25, 75], [75, 75]],
  };

  const dots = dotPositions[value] || dotPositions[1];

  return (
    <svg width="80" height="80" viewBox="0 0 100 100">
      {dots.map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="9" fill="#ffffff" />
      ))}
    </svg>
  );
}

export default RandomAuction;
