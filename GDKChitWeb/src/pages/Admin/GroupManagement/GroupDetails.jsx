import React, { useState } from 'react';
import { makeRequest, safeJson } from '../../../api/apiClient.js';
import EditGroupModal from './Modals/EditGroupModal';
import PaymentModal from './Modals/PaymentModal';
import AuctionModal from './Modals/AuctionModal';
import { 
  ArrowLeft as RiArrowLeftLine, Users as RiGroupLine, Clock as RiTimeLine, Pencil as RiEditLine, 
  CircleDollarSign as RiMoneyDollarCircleLine, History as RiHistoryLine, Star as RiStarLine, ChevronRight as RiArrowRightSLine,
  ChevronLeft as RiArrowLeftSLine, X as RiCloseLine, Check as RiCheckLine
} from 'lucide-react';

const GroupDetails = ({ group, onBack, memberMappings = [], setShowMemberRegistration }) => {
  const [currentMonth, setCurrentMonth] = useState(0); // 0 = current, -1 = previous
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showAuctionModal, setShowAuctionModal] = useState(false);
  const [expandedSections, setExpandedSections] = useState({ history: false });

  // Mock group data, same as RN implementation
  const [formData, setFormData] = useState({
    groupName: group.name || '',
    groupId: group.id || '',
    monthlyAmount: group.monthlyAmount?.toString() || '',
    groupAmount: group.groupAmount?.toString() || '',
    totalMembers: group.totalMembers?.toString() || '',
    createdDate: group.createdDate || group.startDate || new Date().toISOString().split('T')[0],
    currentMonthAmount: group.monthlyAmount?.toString() || '',
    elathThalupadi: '',
    commission: '',
    chitWinnerName: group.currentChitWinner?.name || '',
    chitWinnerMemberId: group.currentChitWinner?.memberId || '',
    amountTaken: group.currentChitWinner?.amountTaken?.toString() || '',
    datePicked: group.currentChitWinner?.datePicked || '',
  });

  const [monthlyData] = useState([
    {
      month: -1,
      date: '2024-09-15',
      amount: 10000,
      discount: 500,
      commission: 200,
      winner: { name: 'முருகன் குமார்', memberId: '9876543210', amountTaken: 9300, date: '2024-09-15' },
      mappedMembers: [
        { memberId: '9876543210', name: 'முருகன் குமார்', status: 'paid', amount: 10000 },
        { memberId: '9876543211', name: 'லட்சுமி செல்வி', status: 'paid', amount: 10000 },
        { memberId: '9876543212', name: 'ராஜேஷ் பாபு', status: 'pending', amount: 10000 },
      ]
    }
  ]);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const currentMonthData = monthlyData.find(m => m.month === currentMonth);

  const getMonthLabel = (offset) => {
    const date = new Date();
    date.setMonth(date.getMonth() + offset);
    return date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  };

  const formatCurrency = (amount) => {
    if (!amount) return '₹0';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(amount);
  };

  const formatDateForDisplay = (dateString) => {
    if (!dateString) return 'Select Date';
    return new Date(dateString).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const handleEditGroupSave = async (data) => {
    // Optimistically update the UI constraints
    setFormData(prev => ({
      ...prev,
      groupName: data.groupName,
      groupAmount: data.totalAmount,
      monthlyAmount: Math.round(Number(data.totalAmount) / (Number(data.numberOfUsers) || 1)).toString(),
      totalMembers: data.numberOfUsers,
      createdDate: data.createdDate,
    }));
    
    try {
      const payload = {
        groupId: formData.groupId,
        groupName: data.groupName,
        totalAmount: data.totalAmount,
        numberOfUsers: data.numberOfUsers,
        createdDate: data.createdDate
      };
      
      const response = await makeRequest('/admin/groups/updateGroup', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      
      const result = await safeJson(response);
      if (!response.ok || !result.success) {
        alert(result?.message || 'Failed to update group');
      }
    } catch (error) {
      console.error('Update error:', error);
      alert('An error occurred while updating the group in the database');
    }
  };

  return (
    <div style={{ padding: '0 24px 40px', maxWidth: 800, margin: '0 auto', width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, background: '#fff', padding: '16px', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)' }}>
        <button className="rn-back" onClick={onBack} style={{ background: '#f3f4f6' }}>
          <RiArrowLeftLine size={18} />
        </button>
        <div>
          <h2 style={{ margin: 0, fontSize: 18, color: '#111827' }}>Group Management</h2>
          <p style={{ margin: 0, fontSize: 13, color: '#6B7280' }}>Manage your group details and settings</p>
        </div>
      </div>

      {/* Group Card */}
      <div style={{ background: '#fff', borderRadius: 'var(--radius-md)', padding: 20, boxShadow: 'var(--shadow-sm)', marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <h3 style={{ margin: '0 0 4px', fontSize: 20, color: '#111827' }}>{formData.groupName}</h3>
            <span style={{ fontSize: 13, color: '#6B7280' }}>#{group.groupCode || 'UNKNOWN'}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12 }}>
            <div style={{ padding: '4px 10px', background: group.status === 'Active' ? '#10B981' : '#F59E0B', color: '#fff', borderRadius: 100, fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
              <RiTimeLine size={12} />
              {group.status?.toUpperCase()}
            </div>
            <button 
              onClick={() => setShowEditModal(true)}
              style={{ width: 32, height: 32, borderRadius: '50%', background: '#F3F0FF', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B46C1' }}
            >
              <RiEditLine size={16} />
            </button>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 24, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#374151', fontSize: 14, fontWeight: 500 }}>
            <RiGroupLine size={18} color="#6B46C1" />
            {group.currentMembers !== undefined ? group.currentMembers : memberMappings.length} / {formData.totalMembers || 'N/A'} Members
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#374151', fontSize: 14, fontWeight: 500 }}>
            <span style={{ color: '#059669', fontWeight: 800 }}>₹</span>
            {formatCurrency(formData.monthlyAmount)} / month
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed var(--border)', paddingTop: 16 }}>
          <span style={{ fontSize: 13, color: '#6B7280' }}>Start Date: {formatDateForDisplay(formData.createdDate)}</span>
          <span style={{ fontSize: 13, color: '#111827', fontWeight: 600 }}>Total Fund: {formatCurrency(formData.groupAmount || (formData.monthlyAmount * (formData.totalMembers || memberMappings.length)))}</span>
        </div>
      </div>

      {/* Sections */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Member Registration */}
        <div 
          onClick={() => setShowMemberRegistration(true)}
          style={{ background: '#fff', padding: 16, borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', boxShadow: 'var(--shadow-sm)' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: '#EDE9FE', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B46C1' }}>
              <RiGroupLine size={24} />
            </div>
            <div>
              <h4 style={{ margin: '0 0 4px', fontSize: 16, color: '#111827' }}>Member Registration</h4>
              <p style={{ margin: 0, fontSize: 13, color: '#6B7280' }}>Add and manage group members</p>
            </div>
          </div>
          <RiArrowRightSLine size={24} color="#9CA3AF" />
        </div>

        {/* Month Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 16, background: '#fff', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)' }}>
          <button onClick={() => setCurrentMonth(prev => prev - 1)} style={{ background: '#f9fafb', border: '1px solid var(--border)', padding: '6px 12px', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: '#6B46C1', fontWeight: 600 }}>
            <RiArrowLeftSLine size={16} /> Previous
          </button>
          <div style={{ textAlign: 'center' }}>
            <span style={{ display: 'block', fontSize: 11, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5 }}>Viewing Month</span>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>{getMonthLabel(currentMonth)}</span>
            {currentMonth === 0 && <span style={{ marginLeft: 6, fontSize: 11, color: '#10B981', fontWeight: 600 }}>(Current)</span>}
          </div>
          <button 
            disabled={currentMonth >= 0}
            onClick={() => setCurrentMonth(prev => prev + 1)} 
            style={{ background: '#f9fafb', border: '1px solid var(--border)', padding: '6px 12px', borderRadius: 6, cursor: currentMonth >= 0 ? 'not-allowed' : 'pointer', opacity: currentMonth >= 0 ? 0.5 : 1, display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: '#6B46C1', fontWeight: 600 }}>
            Next <RiArrowRightSLine size={16} />
          </button>
        </div>

        {/* Payment Details */}
        <div 
          onClick={() => setShowPaymentModal(true)}
          style={{ background: '#fff', padding: 16, borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', boxShadow: 'var(--shadow-sm)' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: '#DBEAFE', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3B82F6' }}>
              <RiMoneyDollarCircleLine size={24} />
            </div>
            <div>
              <h4 style={{ margin: '0 0 4px', fontSize: 16, color: '#111827' }}>Payment Details</h4>
              <p style={{ margin: 0, fontSize: 13, color: '#6B7280' }}>Monthly amount, discount & commission</p>
            </div>
          </div>
          <RiArrowRightSLine size={24} color="#9CA3AF" />
        </div>

        {/* Chit Auction Winner */}
        <div 
          onClick={() => setShowAuctionModal(true)}
          style={{ background: '#fff', padding: 16, borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', boxShadow: 'var(--shadow-sm)' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F59E0B' }}>
              <RiStarLine size={24} />
            </div>
            <div>
              <h4 style={{ margin: '0 0 4px', fontSize: 16, color: '#111827' }}>Chit Auction Winner</h4>
              <p style={{ margin: 0, fontSize: 13, color: '#6B7280' }}>
                {formData.chitWinnerName ? `Winner: ${formData.chitWinnerName}` : 'Register monthly auction winner'}
              </p>
            </div>
          </div>
          <RiArrowRightSLine size={24} color="#9CA3AF" />
        </div>

        {/* Saved Month Data (History) */}
        {currentMonthData && (
          <div style={{ background: '#fff', borderRadius: 'var(--radius-md)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
            <div 
              onClick={() => toggleSection('history')}
              style={{ padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10B981' }}>
                  <RiHistoryLine size={24} />
                </div>
                <div>
                  <h4 style={{ margin: '0 0 4px', fontSize: 16, color: '#111827' }}>Saved Month Data</h4>
                  <p style={{ margin: 0, fontSize: 13, color: '#6B7280' }}>Previously saved information</p>
                </div>
              </div>
              <RiArrowRightSLine size={24} color="#9CA3AF" style={{ transform: expandedSections.history ? 'rotate(90deg)' : 'rotate(0)', transition: 'transform 0.2s' }} />
            </div>

            {expandedSections.history && (
              <div style={{ padding: '0 16px 16px', borderTop: '1px solid var(--border)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 16 }}>
                  <div style={{ background: '#f9fafb', padding: 12, borderRadius: 8, textAlign: 'center', border: '1px solid var(--border)' }}>
                    <span style={{ display: 'block', fontSize: 11, color: '#6B7280', marginBottom: 4 }}>Amount</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{formatCurrency(currentMonthData.amount)}</span>
                  </div>
                  <div style={{ background: '#f9fafb', padding: 12, borderRadius: 8, textAlign: 'center', border: '1px solid var(--border)' }}>
                    <span style={{ display: 'block', fontSize: 11, color: '#6B7280', marginBottom: 4 }}>Discount</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{formatCurrency(currentMonthData.discount)}</span>
                  </div>
                  <div style={{ background: '#f9fafb', padding: 12, borderRadius: 8, textAlign: 'center', border: '1px solid var(--border)' }}>
                    <span style={{ display: 'block', fontSize: 11, color: '#6B7280', marginBottom: 4 }}>Commission</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{formatCurrency(currentMonthData.commission)}</span>
                  </div>
                </div>

                {currentMonthData.winner && (
                  <div style={{ background: '#FFFBEB', border: '1px solid #FCD34D', borderRadius: 8, padding: 16, marginTop: 16 }}>
                    <h5 style={{ margin: '0 0 12px', fontSize: 14, color: '#D97706', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <RiStarLine size={16} /> Winner Details
                    </h5>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#92400E' }}>Name:</span> <span style={{ fontWeight: 600, color: '#92400E' }}>{currentMonthData.winner.name}</span></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#92400E' }}>Amount:</span> <span style={{ fontWeight: 600, color: '#92400E' }}>{formatCurrency(currentMonthData.winner.amountTaken)}</span></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#92400E' }}>Date:</span> <span style={{ fontWeight: 600, color: '#92400E' }}>{formatDateForDisplay(currentMonthData.winner.date)}</span></div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

      </div>

      <div style={{ marginTop: 24, display: 'flex', gap: 12, justifyContent: 'flex-end', paddingTop: 20, borderTop: '1px solid var(--border)' }}>
        <button className="rn-primary" style={{ padding: '12px 24px', width: 'auto' }} onClick={() => console.log('Saved data:', formData)}>
          <RiCheckLine size={16} style={{ marginRight: 8, display: 'inline-block', verticalAlign: 'middle' }}/>
          Save Details
        </button>
      </div>

      <EditGroupModal 
        visible={showEditModal} 
        onClose={() => setShowEditModal(false)}
        initialData={{
          ...formData,
          totalAmount: formData.groupAmount || formData.monthlyAmount,
          numberOfUsers: formData.totalMembers,
        }}
        onSave={handleEditGroupSave}
      />
      <PaymentModal 
        visible={showPaymentModal} 
        onClose={() => setShowPaymentModal(false)}
        initialPaymentData={formData}
        onSave={(data) => setFormData(prev => ({ ...prev, ...data }))}
      />
      <AuctionModal 
        visible={showAuctionModal} 
        onClose={() => setShowAuctionModal(false)}
        initialWinnerData={formData}
        onSave={(data) => setFormData(prev => ({ ...prev, ...data }))}
      />
    </div>
  );
};

export default GroupDetails;
