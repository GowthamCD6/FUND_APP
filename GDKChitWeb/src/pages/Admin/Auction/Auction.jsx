import React, { useState, useEffect, useMemo } from 'react';
import { makeRequest, safeJson } from '../../../api/apiClient.js';
import { formatCurrency, formatDate } from '../../../utils/formatters.js';
import { 
  Gavel as RiGavelLine, 
  Users as RiGroupLine, 
  Check as RiCheckLine, 
  X as RiCloseLine, 
  Loader2 as RiLoader4Line, 
  AlertTriangle as RiAlertLine, 
  Search as RiSearchLine, 
  RefreshCw as RiRefreshLine, 
  ChevronRight as RiChevronRightLine, 
  HelpCircle as RiQuestionLine, 
  Dice5 as RiDiceLine 
} from 'lucide-react';
import './Auction.css';

const Auction = () => {
  const [groups, setGroups] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [activeTab, setActiveTab] = useState('betting'); // 'betting' | 'random'
  const [currentStep, setCurrentStep] = useState('setup'); // 'setup' | 'run'
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Simulation State
  const [participants, setParticipants] = useState([]);
  const [isRolling, setIsRolling] = useState(false);
  const [diceValue, setDiceValue] = useState(1);
  const [showResultModal, setShowResultModal] = useState(false);
  const [auctionResult, setAuctionResult] = useState(null);
  const [savingWinner, setSavingWinner] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Fetch groups
  const fetchGroups = async () => {
    try {
      setLoadingGroups(true);
      const res = await makeRequest('/admin/groups/getGroups');
      const data = await safeJson(res);
      if (data.success) {
        // Map groups
        const mapped = (data.data || []).map(g => ({
          id: g.id,
          name: g.name || g.group_name || 'Untitled',
          status: String(g.status || 'Not Started').toLowerCase(),
          totalMembers: g.totalMembers || g.total_members || 0,
          duration: g.duration || 20,
          groupAmount: g.groupAmount || g.group_amount || 0,
          startDate: g.startDate || g.start_date,
          completedCycles: g.completedCycles || 0,
        }));
        setGroups(mapped);
      }
    } catch (err) {
      console.error('Error fetching groups:', err);
    } finally {
      setLoadingGroups(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const activeGroups = useMemo(() => {
    return groups.filter(g => g.status === 'active' || g.status === 'ongoing');
  }, [groups]);

  // Load members for selected group
  const handleSelectGroup = async (group) => {
    setSelectedGroup(group);
    setLoadingMembers(true);
    setSelectedMembers([]);
    try {
      const res = await makeRequest(`/admin/groups/getMembers?groupId=${group.id}`);
      const data = await safeJson(res);
      if (data.success) {
        setMembers(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching members:', err);
    } finally {
      setLoadingMembers(false);
    }
  };

  const toggleMemberSelection = (member) => {
    setSelectedMembers(prev => {
      const isSelected = prev.find(m => m.userId === member.userId);
      if (isSelected) {
        return prev.filter(m => m.userId !== member.userId);
      } else {
        return [...prev, member];
      }
    });
  };

  const startAuctionSetup = () => {
    if (selectedMembers.length < 2) {
      alert('Please select at least 2 members for the auction.');
      return;
    }
    const defaultBid = selectedGroup.groupAmount / selectedGroup.duration;
    const initialParticipants = selectedMembers.map(m => ({
      ...m,
      bid: defaultBid * 0.9, // Starting default bid at 90% of pool installment
    }));
    setParticipants(initialParticipants);
    setCurrentStep('run');
  };

  // Run Betting Auction
  const handleBidChange = (userId, value) => {
    setParticipants(prev =>
      prev.map(p => (p.userId === userId ? { ...p, bid: Number(value) || 0 } : p))
    );
  };

  const completeBettingAuction = () => {
    // Lowest bid wins in chit fund auction
    const sorted = [...participants].sort((a, b) => a.bid - b.bid);
    const winner = sorted[0];
    setAuctionResult({
      type: 'betting',
      winner,
      amountTaken: winner.bid,
      dividend: (selectedGroup.groupAmount / selectedGroup.duration) - winner.bid,
    });
    setShowResultModal(true);
  };

  // Run Random Lucky Draw (Dice Roll)
  const rollDice = () => {
    if (isRolling) return;
    setIsRolling(true);
    let counter = 0;
    const interval = setInterval(() => {
      setDiceValue(Math.floor(Math.random() * 6) + 1);
      counter++;
      if (counter > 15) {
        clearInterval(interval);
        setIsRolling(false);
        // Pick random winner
        const randIdx = Math.floor(Math.random() * participants.length);
        const winner = participants[randIdx];
        setAuctionResult({
          type: 'random',
          winner,
          amountTaken: selectedGroup.groupAmount / selectedGroup.duration,
          dividend: 0,
        });
        setShowResultModal(true);
      }
    }, 100);
  };

  // Save winner
  const saveWinner = async () => {
    if (!auctionResult) return;
    setSavingWinner(true);
    try {
      const payload = {
        groupId: selectedGroup.id,
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        chitWinnerName: auctionResult.winner.name,
        chitWinnerMemberId: String(auctionResult.winner.userId),
        amountTaken: auctionResult.amountTaken,
        datePicked: new Date().toISOString(),
        winnerUserId: auctionResult.winner.userId,
      };

      const res = await makeRequest('/admin/groups/saveAuctionWinner', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      const data = await safeJson(res);
      if (data.success) {
        setSuccessMessage(`${auctionResult.winner.name} successfully registered as winner!`);
        setTimeout(() => {
          setSuccessMessage('');
          setShowResultModal(false);
          resetAuction();
          fetchGroups();
        }, 2000);
      } else {
        alert(data.message || 'Failed to save winner');
      }
    } catch (err) {
      console.error('Error saving auction winner:', err);
      alert('Connection failed. Could not save winner details.');
    } finally {
      setSavingWinner(false);
    }
  };

  const resetAuction = () => {
    setCurrentStep('setup');
    setSelectedGroup(null);
    setMembers([]);
    setSelectedMembers([]);
    setParticipants([]);
    setAuctionResult(null);
  };

  const filteredMembers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return members;
    return members.filter(
      m =>
        (m.name || '').toLowerCase().includes(q) ||
        (m.phone || '').includes(q)
    );
  }, [members, searchQuery]);

  return (
    <div className="auc-page">
      <div className="auc-header">
        <div>
          <h2 className="auc-title">Chit Fund Auction Setup</h2>
          <p className="auc-subtitle">
            {currentStep === 'setup' 
              ? 'Select an active group and configure auction participants'
              : `${selectedGroup?.name} Auction Cycle`}
          </p>
        </div>
        {currentStep === 'run' && (
          <button className="auc-btn-cancel" onClick={resetAuction}>
            Reset Setup
          </button>
        )}
      </div>

      {currentStep === 'setup' ? (
        <div className="auc-setup-container">
          {/* Tab Selector */}
          <div className="auc-tab-bar">
            <button 
              className={`auc-tab-btn ${activeTab === 'betting' ? 'active' : ''}`}
              onClick={() => setActiveTab('betting')}
            >
              <RiGavelLine size={18} />
              <span>Betting Auction</span>
            </button>
            <button 
              className={`auc-tab-btn ${activeTab === 'random' ? 'active' : ''}`}
              onClick={() => setActiveTab('random')}
            >
              <RiDiceLine size={18} />
              <span>Random Draw</span>
            </button>
          </div>

          <div className="auc-setup-layout">
            {/* Group List Column */}
            <div className="auc-group-col">
              <h3 className="auc-section-title">Active Chit Groups</h3>
              {loadingGroups ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#6b7280' }}>
                  <RiLoader4Line size={32} className="spin-anim" />
                  <p>Loading groups...</p>
                </div>
              ) : activeGroups.length === 0 ? (
                <div className="auc-empty">No active groups available for auction.</div>
              ) : (
                <div className="auc-group-grid">
                  {activeGroups.map(g => (
                    <div 
                      key={g.id} 
                      className={`auc-group-card ${selectedGroup?.id === g.id ? 'active' : ''}`}
                      onClick={() => handleSelectGroup(g)}
                    >
                      <div className="auc-g-card-header">
                        <h4>{g.name}</h4>
                        <span className="auc-g-badge">Cycle {g.completedCycles + 1}/{g.duration}</span>
                      </div>
                      <div className="auc-g-card-body">
                        <div>Value: <strong>{formatCurrency(g.groupAmount)}</strong></div>
                        <div>Installment: <strong>{formatCurrency(g.groupAmount / g.duration)}/mo</strong></div>
                      </div>
                      <div className="auc-g-card-footer">
                        <span>{g.totalMembers} Members registered</span>
                        <RiChevronRightLine size={16} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Member Selection Column */}
            <div className="auc-member-col">
              <h3 className="auc-section-title">Select Participating Members</h3>
              {!selectedGroup ? (
                <div className="auc-empty">Please select a chit group on the left.</div>
              ) : loadingMembers ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#6b7280' }}>
                  <RiLoader4Line size={32} className="spin-anim" />
                  <p>Loading members...</p>
                </div>
              ) : (
                <div className="auc-member-card-box">
                  <div className="auc-search-box">
                    <RiSearchLine size={16} className="auc-s-icon" />
                    <input 
                      type="text" 
                      placeholder="Search member..." 
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                    />
                  </div>

                  <div className="auc-member-list">
                    {filteredMembers.map(m => {
                      const isSelected = selectedMembers.some(sm => sm.userId === m.userId);
                      return (
                        <div 
                          key={m.userId} 
                          className={`auc-member-row ${isSelected ? 'selected' : ''}`}
                          onClick={() => toggleMemberSelection(m)}
                        >
                          <div className="auc-m-avatar">
                            {(m.name || 'U').substring(0, 2).toUpperCase()}
                          </div>
                          <div className="auc-m-info">
                            <span className="auc-m-name">{m.name}</span>
                            <span className="auc-m-phone">{m.phone}</span>
                          </div>
                          <div className="auc-m-check">
                            <div className={`auc-checkbox ${isSelected ? 'checked' : ''}`}>
                              {isSelected && <RiCheckLine size={12} color="#ffffff" />}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="auc-action-footer">
                    <span>{selectedMembers.length} Members Selected</span>
                    <button 
                      className="auc-btn-start" 
                      disabled={selectedMembers.length < 2}
                      onClick={startAuctionSetup}
                    >
                      Start Auction
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Running Simulation Screen */
        <div className="auc-run-container">
          <div className="auc-run-header-card">
            <h4>{selectedGroup.name}</h4>
            <p>Pool Amount: <strong>{formatCurrency(selectedGroup.groupAmount)}</strong> · Current Installment: <strong>{formatCurrency(selectedGroup.groupAmount / selectedGroup.duration)}</strong></p>
          </div>

          {activeTab === 'betting' ? (
            /* Betting Mode View */
            <div className="auc-betting-layout">
              <div className="auc-run-section-title">Configure Member Bids</div>
              <div className="auc-bidding-list">
                {participants.map((p) => (
                  <div key={p.userId} className="auc-bidding-row">
                    <div className="auc-bid-user">
                      <div className="auc-m-avatar">{(p.name || 'U').substring(0, 2).toUpperCase()}</div>
                      <div>
                        <div className="auc-m-name">{p.name}</div>
                        <div className="auc-m-phone">{p.phone}</div>
                      </div>
                    </div>
                    <div className="auc-bid-input-wrapper">
                      <span>₹</span>
                      <input 
                        type="number" 
                        value={p.bid} 
                        onChange={e => handleBidChange(p.userId, e.target.value)}
                        placeholder="Enter bid amount"
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="auc-betting-footer">
                <button className="auc-btn-finish" onClick={completeBettingAuction}>
                  Calculate Auction Winner
                </button>
              </div>
            </div>
          ) : (
            /* Random Dice Mode View */
            <div className="auc-random-layout">
              <div className="auc-dice-box">
                <div className={`auc-dice-cube ${isRolling ? 'rolling' : ''}`}>
                  <RiDiceLine size={80} color="#3b82f6" />
                </div>
                <div className="auc-dice-value">Dice Rolled: {diceValue}</div>
                <button 
                  className="auc-btn-roll" 
                  disabled={isRolling} 
                  onClick={rollDice}
                >
                  {isRolling ? 'Rolling...' : 'Roll Dice (Lucky Draw)'}
                </button>
              </div>

              <div className="auc-rand-participants">
                <h5>Participating Members ({participants.length})</h5>
                <div className="auc-rand-list">
                  {participants.map(p => (
                    <div key={p.userId} className="auc-rand-row">
                      <div className="auc-m-avatar">{(p.name || 'U').substring(0, 2).toUpperCase()}</div>
                      <span>{p.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Results & Winner Registration Modal */}
      {showResultModal && auctionResult && (
        <div className="auc-modal-backdrop">
          <div className="auc-modal">
            {successMessage ? (
              <div className="auc-success-view">
                <div className="auc-success-icon">
                  <RiCheckLine size={40} color="#10b981" />
                </div>
                <h3>Winner Registered!</h3>
                <p>{successMessage}</p>
              </div>
            ) : (
              <>
                <div className="auc-modal-header">
                  <h3>Auction Winner Selection</h3>
                  <button className="auc-modal-close" onClick={() => setShowResultModal(false)}>
                    <RiCloseLine size={20} />
                  </button>
                </div>
                <div className="auc-modal-body">
                  <div className="auc-winner-hero">
                    <div className="auc-w-avatar">
                      {(auctionResult.winner.name || 'U').substring(0, 2).toUpperCase()}
                    </div>
                    <h4>{auctionResult.winner.name}</h4>
                    <p>{auctionResult.winner.phone}</p>
                  </div>

                  <div className="auc-results-box">
                    <div className="auc-res-row">
                      <span>Total Chit Amount:</span>
                      <strong>{formatCurrency(selectedGroup.groupAmount)}</strong>
                    </div>
                    <div className="auc-res-row">
                      <span>Winner Bid Amount:</span>
                      <strong style={{ color: '#2563eb' }}>{formatCurrency(auctionResult.amountTaken)}</strong>
                    </div>
                    {auctionResult.type === 'betting' && (
                      <div className="auc-res-row">
                        <span>Dividend Collected:</span>
                        <strong style={{ color: '#10b981' }}>+ {formatCurrency(auctionResult.dividend)}</strong>
                      </div>
                    )}
                  </div>
                </div>
                <div className="auc-modal-footer">
                  <button 
                    className="auc-btn-confirm" 
                    onClick={saveWinner}
                    disabled={savingWinner}
                  >
                    {savingWinner ? (
                      <RiLoader4Line size={16} className="spin-anim" />
                    ) : (
                      'Confirm & Declare Winner'
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Auction;
