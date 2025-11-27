import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Platform,
  Animated,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Header from '../../../../../../components/HeaderComponent/Header';
import BiometricService from '../../../../../../services/BiometricService';
import styles from './MemberChitCardSty';

const ChitCard = ({ selectedGroup, selectedMember, onBack }) => {
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [userOtp, setUserOtp] = useState('');
  const [generatedUserOtp, setGeneratedUserOtp] = useState('');
  const [securityStep, setSecurityStep] = useState('init'); // 'init', 'otp-sent', 'completed'
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentUpdateStatus, setPaymentUpdateStatus] = useState({});

  // Static Data - Group Information
  const staticGroupData = {
    id: 'GRP001',
    groupName: 'Prosperity Chit Fund - Group A',
    totalMembers: 20,
    chitAmount: 100000,
    duration: 20,
    currentMonth: 8,
    startDate: '2024-02-01',
    status: 'Active',
    auctionDay: 'Saturday',
    auctionTime: '10:00 AM',
    location: 'Community Hall, Main Street',
    organizer: {
      name: 'Ramesh Kumar',
      phone: '+91 98765 43210',
      email: 'ramesh.kumar@chitfund.com',
    },
  };

  // Static Data - Member Information
  const staticMemberData = {
    id: 'MEM001',
    name: 'Priya Sharma',
    phone: '+91 87654 32109',
    email: 'priya.sharma@email.com',
    address: '123, Gandhi Nagar, Chennai - 600001',
    joinDate: '2024-02-01',
    memberNumber: 5,
    aadhaar: '****-****-1234',
    profession: 'Software Engineer',
    monthlyContribution: 5000,
    emergencyContact: {
      name: 'Vikram Sharma',
      phone: '+91 98765 12345',
      relation: 'Husband',
    },
    bankDetails: {
      accountNumber: '****-****-5678',
      ifscCode: 'HDFC0001234',
      bankName: 'HDFC Bank',
      branch: 'T. Nagar',
    },
    documents: {
      aadhaarVerified: true,
      panVerified: true,
      bankVerified: true,
      photoVerified: true,
    },
  };

  // Static Data - Payment History with realistic data
  const staticPaymentData = [
    {
      month: 1,
      date: '01/02/2024',
      auctionAmount: 95000,
      receivedAmount: 90000,
      commission: 1000,
      status: 'completed',
      paidBy: 'Suresh M',
      auctionWinner: 'Suresh M',
    },
    {
      month: 2,
      date: '02/03/2024',
      auctionAmount: 92000,
      receivedAmount: 87000,
      commission: 1200,
      status: 'completed',
      paidBy: 'Lakshmi R',
      auctionWinner: 'Lakshmi R',
    },
    {
      month: 3,
      date: '06/04/2024',
      auctionAmount: 89000,
      receivedAmount: 84000,
      commission: 1500,
      status: 'completed',
      paidBy: 'Arjun K',
      auctionWinner: 'Arjun K',
    },
    {
      month: 4,
      date: '04/05/2024',
      auctionAmount: 86000,
      receivedAmount: 81000,
      commission: 1800,
      status: 'completed',
      paidBy: 'Meena D',
      auctionWinner: 'Meena D',
    },
    {
      month: 5,
      date: '01/06/2024',
      auctionAmount: 83000,
      receivedAmount: 78000,
      commission: 2000,
      status: 'completed',
      paidBy: 'Rajesh T',
      auctionWinner: 'Rajesh T',
    },
    {
      month: 6,
      date: '06/07/2024',
      auctionAmount: 80000,
      receivedAmount: 75000,
      commission: 2200,
      status: 'completed',
      paidBy: 'Kavitha S',
      auctionWinner: 'Kavitha S',
    },
    {
      month: 7,
      date: '03/08/2024',
      auctionAmount: 77000,
      receivedAmount: 72000,
      commission: 2500,
      status: 'completed',
      paidBy: 'Mohan L',
      auctionWinner: 'Mohan L',
    },
    {
      month: 8,
      date: '07/09/2024',
      auctionAmount: 74000,
      receivedAmount: 69000,
      commission: 2800,
      status: 'pending',
      paidBy: '',
      auctionWinner: 'Pending Auction',
    },
  ];

  // Use static data if no props provided
  const displayGroup = selectedGroup || staticGroupData;
  const displayMember = selectedMember || staticMemberData;

  if (!displayGroup) return null;

  // Create 20 rows for chit details table using static data
  const chitRows = Array.from({ length: 20 }, (_, index) => {
    const monthNumber = index + 1;
    const staticData = staticPaymentData.find(p => p.month === monthNumber);

    if (staticData) {
      return {
        serialNo: monthNumber,
        date: staticData.date,
        auctionAmount: staticData.auctionAmount,
        receivedAmount: staticData.receivedAmount,
        commission: staticData.commission,
        signature: staticData.status === 'completed' ? '✓' : '',
        status: staticData.status,
        paidBy: staticData.paidBy,
        auctionWinner: staticData.auctionWinner,
      };
    }

    const isCompleted = monthNumber < (displayGroup?.currentMonth || 8);
    const isCurrent = monthNumber === (displayGroup?.currentMonth || 8);

    if (isCompleted) {
      // Generate realistic past data
      const baseAmount = 100000 - monthNumber * 3000; // Decreasing auction amounts
      return {
        serialNo: monthNumber,
        date: `${String(Math.floor(Math.random() * 28) + 1).padStart(
          2,
          '0',
        )}/0${
          monthNumber <= 9 ? monthNumber + 1 : (monthNumber % 10) + 1
        }/2024`,
        auctionAmount: baseAmount - Math.floor(Math.random() * 5000),
        receivedAmount: baseAmount - 5000 - Math.floor(Math.random() * 3000),
        commission: 1000 + monthNumber * 200 + Math.floor(Math.random() * 500),
        signature: '✓',
        status: 'completed',
        paidBy: `Member ${monthNumber}`,
        auctionWinner: `Member ${monthNumber}`,
      };
    }

    return {
      serialNo: monthNumber,
      date: isCurrent ? 'Current Month' : '',
      auctionAmount: isCurrent ? 74000 : '',
      receivedAmount: isCurrent ? 'TBD' : '',
      commission: isCurrent ? 'TBD' : '',
      signature: '',
      status: isCurrent ? 'current' : 'future',
      paidBy: '',
      auctionWinner: isCurrent ? 'Auction Pending' : '',
    };
  });

  const formatCurrency = amount => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Initialize biometric service
  useEffect(() => {
    BiometricService.init();
  }, []);

  // Handle month click to open payment modal
  const handleMonthClick = monthIndex => {
    const currentMonth = displayGroup?.currentMonth || 8;

    if (
      monthIndex < currentMonth &&
      paymentUpdateStatus[monthIndex] !== 'completed'
    ) {
      // Past month that's not marked completed yet - allow marking as paid
      setSelectedMonth(monthIndex);
      setShowOtpModal(true);
      setSecurityStep('init');
      setUserOtp('');
      setGeneratedUserOtp('');
      setIsProcessing(false);
    } else if (
      monthIndex === currentMonth &&
      paymentUpdateStatus[monthIndex] !== 'completed'
    ) {
      // Current month - initiate security process
      setSelectedMonth(monthIndex);
      setShowOtpModal(true);
      setSecurityStep('init');
      setUserOtp('');
      setGeneratedUserOtp('');
      setIsProcessing(false);
    }
    // Ignore clicks on future months or already completed months
  };

  // Pulse animation for waiting state
  const startPulseAnimation = () => {
    // Removed - not needed for simplified flow
  };

  const stopPulseAnimation = () => {
    // Removed - not needed for simplified flow
  };

  // Generate random 6-digit OTP
  const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  // Send OTP to user
  const sendOTPToUser = () => {
    const otp = generateOTP();
    setGeneratedUserOtp(otp);
    setSecurityStep('otp-sent');
    setIsProcessing(false);
  };

  // Verify OTP entered by admin
  const handleUserOtpSubmit = () => {
    if (userOtp.length !== 6) {
      Alert.alert('Error', 'Please enter a valid 6-digit OTP');
      return;
    }

    setIsProcessing(true);

    // Verify OTP
    if (userOtp === generatedUserOtp) {
      // OTP verified - mark payment as completed
      setTimeout(() => {
        setPaymentUpdateStatus(prev => ({
          ...prev,
          [selectedMonth]: 'completed',
        }));

        setSecurityStep('completed');
        setIsProcessing(false);
      }, 1000);
    } else {
      Alert.alert('Error', 'Invalid OTP. Please try again.');
      setUserOtp('');
      setIsProcessing(false);
    }
  };

  // Initiate secure payment process
  const initiateSecurePayment = () => {
    setIsProcessing(true);
    setTimeout(() => {
      sendOTPToUser();
    }, 500);
  };

  // Close OTP modal and reset state
  const handleCloseOtpModal = () => {
    if (securityStep === 'otp-sent' && !isProcessing) {
      setShowOtpModal(false);
      setSelectedMonth(null);
      setSecurityStep('init');
      setUserOtp('');
      setGeneratedUserOtp('');
    } else if (securityStep === 'completed') {
      setShowOtpModal(false);
      setSelectedMonth(null);
      setSecurityStep('init');
      setUserOtp('');
      setGeneratedUserOtp('');
    } else if (!isProcessing) {
      setShowOtpModal(false);
      setSelectedMonth(null);
      setSecurityStep('init');
      setUserOtp('');
      setGeneratedUserOtp('');
    }
  };

  return (
    <View style={styles.container}>
      <Header
        title={displayGroup?.groupName || 'Member Chit Card'}
        onBack={onBack}
      />

      {/* User Info Section */}
      {displayMember && (
        <View style={styles.userInfoCard}>
          <View style={styles.userInfoContent}>
            <View style={styles.userAvatar}>
              <Text style={styles.userAvatarText}>
                {displayMember?.name
                  ? displayMember.name
                      .split(' ')
                      .map(n => n[0])
                      .join('')
                      .substring(0, 2)
                  : 'NA'}
              </Text>
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.userName}>
                {displayMember?.name || 'Unknown Member'}
              </Text>
              <Text style={styles.userPhone}>
                {displayMember?.phone || 'No Phone'}
              </Text>
            </View>
          </View>
        </View>
      )}

      <ScrollView
        style={styles.groupDetailsContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Traditional Chit Details Table */}
        <View style={styles.chitDetailsCard}>
          <Text style={styles.chitDetailsTitle}>Chit Payment Details</Text>

          {/* Table Header */}
          <View style={styles.tableContainer}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, { flex: 0.8 }]}>எண்</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>தேதி</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1.8 }]}>
                எலத் தள்ளுபடி
              </Text>
              <Text style={[styles.tableHeaderCell, { flex: 1.8 }]}>
                க.வே. தொகை
              </Text>
              <Text style={[styles.tableHeaderCell, { flex: 1.2 }]}>கசர்</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1.2 }]}>
                கையொப்பம்
              </Text>
            </View>

            {/* Table Body */}
            <ScrollView style={styles.tableBody} nestedScrollEnabled>
              {chitRows.map(row => {
                const isCompleted =
                  row.serialNo < (displayGroup?.currentMonth || 8) ||
                  paymentUpdateStatus[row.serialNo] === 'completed';
                const isCurrentMonth =
                  row.serialNo === (displayGroup?.currentMonth || 8) &&
                  paymentUpdateStatus[row.serialNo] !== 'completed';
                const isFutureMonth =
                  row.serialNo > (displayGroup?.currentMonth || 8);

                return (
                  <TouchableOpacity
                    key={row.serialNo}
                    style={[
                      styles.tableRow,
                      paymentUpdateStatus[row.serialNo] === 'completed' &&
                        styles.completedRow,
                    ]}
                    onPress={() => handleMonthClick(row.serialNo)}
                    disabled={isFutureMonth || isCompleted}
                    activeOpacity={isCurrentMonth ? 0.7 : 1}
                  >
                    <Text style={[styles.tableCell, { flex: 0.8 }]}>
                      {row.serialNo}
                    </Text>
                    <Text style={[styles.tableCell, { flex: 1.5 }]}>
                      {row.date}
                    </Text>
                    <Text style={[styles.tableCell, { flex: 1.8 }]}>
                      {row.auctionAmount
                        ? formatCurrency(row.auctionAmount)
                        : ''}
                    </Text>
                    <Text style={[styles.tableCell, { flex: 1.8 }]}>
                      {row.receivedAmount
                        ? formatCurrency(row.receivedAmount)
                        : ''}
                    </Text>
                    <Text style={[styles.tableCell, { flex: 1.2 }]}>
                      {row.commission ? formatCurrency(row.commission) : ''}
                    </Text>
                    <View
                      style={[
                        styles.tableCell,
                        { flex: 1.2, alignItems: 'center' },
                      ]}
                    >
                      {isCompleted ? (
                        // Completed months - show green checkmark with "PAID" text
                        <View style={styles.statusContainer}>
                          <MaterialCommunityIcons
                            name="check-circle"
                            size={14}
                            color={
                              paymentUpdateStatus[row.serialNo] === 'completed'
                                ? '#2E7D32'
                                : '#4CAF50'
                            }
                          />
                          <Text style={styles.paidText}>PAID</Text>
                        </View>
                      ) : isCurrentMonth ? (
                        // Current month - show orange lock with "PENDING" text (clickable)
                        <TouchableOpacity
                          style={styles.statusContainer}
                          onPress={() => handleMonthClick(row.serialNo)}
                          activeOpacity={0.7}
                        >
                          <MaterialCommunityIcons
                            name="lock"
                            size={14}
                            color="#FF9800"
                          />
                          <Text style={styles.pendingText}>PENDING</Text>
                        </TouchableOpacity>
                      ) : (
                        // Future months - show gray clock with "FUTURE" text
                        <View style={styles.statusContainer}>
                          <MaterialCommunityIcons
                            name="clock-outline"
                            size={14}
                            color="#9E9E9E"
                          />
                          <Text style={styles.futureText}>FUTURE</Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.detailsButton}>
            <MaterialCommunityIcons name="download" size={20} color="#6B46C1" />
            <Text style={styles.detailsButtonText}>Download Statement</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* OTP Verification Modal */}
      {showOtpModal && (
        <View style={styles.otpModalOverlay}>
          <View style={styles.otpModalContainer}>
            <View style={styles.otpModalHeader}>
              <Text style={styles.otpModalTitle}>
                {securityStep === 'init' && 'Secure Payment'}
                {securityStep === 'otp-sent' && 'Enter OTP'}
                {securityStep === 'completed' && 'Payment Success'}
              </Text>
              <TouchableOpacity
                onPress={handleCloseOtpModal}
                disabled={isProcessing}
              >
                <MaterialCommunityIcons
                  name="close"
                  size={24}
                  color={isProcessing ? '#9E9E9E' : '#6B7280'}
                />
              </TouchableOpacity>
            </View>

            <Text style={styles.otpModalSubtitle}>
              Month {selectedMonth} - {displayMember?.name || 'Member'} Payment
            </Text>

            {/* Init Step - Send OTP Button */}
            {securityStep === 'init' && (
              <View style={styles.securityActionContainer}>
                <MaterialCommunityIcons
                  name="security"
                  size={48}
                  color="#6B46C1"
                />
                <Text style={styles.securityActionTitle}>
                  Start Secure Payment
                </Text>
                <Text style={styles.securityActionDescription}>
                  Send OTP to verify and complete the payment for{' '}
                  {displayMember?.name || 'the user'}.
                </Text>
                <TouchableOpacity
                  style={[
                    styles.securityActionButton,
                    isProcessing && styles.disabledButton,
                  ]}
                  onPress={initiateSecurePayment}
                  disabled={isProcessing}
                >
                  <MaterialCommunityIcons
                    name="send"
                    size={20}
                    color={isProcessing ? '#9E9E9E' : '#FFFFFF'}
                  />
                  <Text
                    style={[
                      styles.securityActionButtonText,
                      isProcessing && styles.disabledButtonText,
                    ]}
                  >
                    {isProcessing ? 'Sending OTP...' : 'Send OTP'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* OTP Sent Step - Enter OTP Input */}
            {securityStep === 'otp-sent' && (
              <View style={styles.otpInputContainer}>
                <MaterialCommunityIcons
                  name="email-check"
                  size={48}
                  color="#4CAF50"
                  style={styles.centerIcon}
                />
                <Text style={styles.otpSentTitle}>OTP Sent Successfully</Text>
                <Text style={styles.otpSentDescription}>
                  OTP has been sent to{' '}
                  {displayMember?.phone || '+91 xxxxx xxxxx'}
                </Text>

                <Text style={styles.otpInputLabel}>Enter OTP (6 digits)</Text>
                <TextInput
                  style={styles.otpInput}
                  value={userOtp}
                  onChangeText={setUserOtp}
                  keyboardType="numeric"
                  maxLength={6}
                  placeholder="000000"
                  textAlign="center"
                  editable={!isProcessing}
                />
                <Text style={styles.demoOtpHint}>
                  Demo OTP: {generatedUserOtp}
                </Text>
              </View>
            )}

            {/* Success Step */}
            {securityStep === 'completed' && (
              <View style={styles.successContainer}>
                <MaterialCommunityIcons
                  name="check-circle"
                  size={64}
                  color="#4CAF50"
                />
                <Text style={styles.successTitle}>Payment Verified!</Text>
                <Text style={styles.successDescription}>
                  Month {selectedMonth} payment for{' '}
                  {displayMember?.name || 'user'} has been successfully verified
                  and marked as completed.
                </Text>
                <View style={styles.successDetails}>
                  <View style={styles.successDetailRow}>
                    <Text style={styles.successDetailLabel}>Member:</Text>
                    <Text style={styles.successDetailValue}>
                      {displayMember?.name}
                    </Text>
                  </View>
                  <View style={styles.successDetailRow}>
                    <Text style={styles.successDetailLabel}>Month:</Text>
                    <Text style={styles.successDetailValue}>
                      {selectedMonth}
                    </Text>
                  </View>
                  <View style={styles.successDetailRow}>
                    <Text style={styles.successDetailLabel}>Status:</Text>
                    <Text
                      style={[styles.successDetailValue, { color: '#4CAF50' }]}
                    >
                      ✓ PAID
                    </Text>
                  </View>
                </View>
              </View>
            )}

            <View style={styles.otpModalButtons}>
              <TouchableOpacity
                style={[
                  styles.otpCancelButton,
                  isProcessing && styles.disabledButton,
                ]}
                onPress={handleCloseOtpModal}
                disabled={isProcessing && securityStep !== 'completed'}
              >
                <Text
                  style={[
                    styles.otpCancelButtonText,
                    isProcessing &&
                      securityStep !== 'completed' &&
                      styles.disabledButtonText,
                  ]}
                >
                  {securityStep === 'completed' ? 'Done' : 'Cancel'}
                </Text>
              </TouchableOpacity>

              {securityStep === 'otp-sent' && (
                <TouchableOpacity
                  style={[
                    styles.otpSubmitButton,
                    isProcessing && styles.disabledButton,
                  ]}
                  onPress={handleUserOtpSubmit}
                  disabled={isProcessing || userOtp.length !== 6}
                >
                  <Text
                    style={[
                      styles.otpSubmitButtonText,
                      (isProcessing || userOtp.length !== 6) &&
                        styles.disabledButtonText,
                    ]}
                  >
                    {isProcessing ? 'Verifying...' : 'Verify OTP'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

export default ChitCard;