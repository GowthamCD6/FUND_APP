import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
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

const ChitCard = ({ selectedGroup, selectedMember, onBack }) => {
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [userOtp, setUserOtp] = useState('');
  const [adminOtp, setAdminOtp] = useState('');
  const [otpStep, setOtpStep] = useState('user'); // 'user', 'waiting', 'biometric', 'admin'
  const [securityStep, setSecurityStep] = useState('init'); // 'init', 'otp-sent', 'user-verified', 'biometric-pending', 'completed'
  const [userOtpConfirmed, setUserOtpConfirmed] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pulseAnimation] = useState(new Animated.Value(1));
  const [generatedUserOtp, setGeneratedUserOtp] = useState('');
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
      email: 'ramesh.kumar@chitfund.com'
    }
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
      relation: 'Husband'
    },
    bankDetails: {
      accountNumber: '****-****-5678',
      ifscCode: 'HDFC0001234',
      bankName: 'HDFC Bank',
      branch: 'T. Nagar'
    },
    documents: {
      aadhaarVerified: true,
      panVerified: true,
      bankVerified: true,
      photoVerified: true
    }
  };

  // Static Data - Payment History with realistic data
  const staticPaymentData = [
    { month: 1, date: '01/02/2024', auctionAmount: 95000, receivedAmount: 90000, commission: 1000, status: 'completed', paidBy: 'Suresh M', auctionWinner: 'Suresh M' },
    { month: 2, date: '02/03/2024', auctionAmount: 92000, receivedAmount: 87000, commission: 1200, status: 'completed', paidBy: 'Lakshmi R', auctionWinner: 'Lakshmi R' },
    { month: 3, date: '06/04/2024', auctionAmount: 89000, receivedAmount: 84000, commission: 1500, status: 'completed', paidBy: 'Arjun K', auctionWinner: 'Arjun K' },
    { month: 4, date: '04/05/2024', auctionAmount: 86000, receivedAmount: 81000, commission: 1800, status: 'completed', paidBy: 'Meena D', auctionWinner: 'Meena D' },
    { month: 5, date: '01/06/2024', auctionAmount: 83000, receivedAmount: 78000, commission: 2000, status: 'completed', paidBy: 'Rajesh T', auctionWinner: 'Rajesh T' },
    { month: 6, date: '06/07/2024', auctionAmount: 80000, receivedAmount: 75000, commission: 2200, status: 'completed', paidBy: 'Kavitha S', auctionWinner: 'Kavitha S' },
    { month: 7, date: '03/08/2024', auctionAmount: 77000, receivedAmount: 72000, commission: 2500, status: 'completed', paidBy: 'Mohan L', auctionWinner: 'Mohan L' },
    { month: 8, date: '07/09/2024', auctionAmount: 74000, receivedAmount: 69000, commission: 2800, status: 'pending', paidBy: '', auctionWinner: 'Pending Auction' },
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
        auctionWinner: staticData.auctionWinner
      };
    }
    
    const isCompleted = monthNumber < (displayGroup?.currentMonth || 8);
    const isCurrent = monthNumber === (displayGroup?.currentMonth || 8);
    
    if (isCompleted) {
      // Generate realistic past data
      const baseAmount = 100000 - (monthNumber * 3000); // Decreasing auction amounts
      return {
        serialNo: monthNumber,
        date: `${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}/0${monthNumber <= 9 ? monthNumber + 1 : (monthNumber % 10) + 1}/2024`,
        auctionAmount: baseAmount - Math.floor(Math.random() * 5000),
        receivedAmount: baseAmount - 5000 - Math.floor(Math.random() * 3000),
        commission: 1000 + (monthNumber * 200) + Math.floor(Math.random() * 500),
        signature: '✓',
        status: 'completed',
        paidBy: `Member ${monthNumber}`,
        auctionWinner: `Member ${monthNumber}`
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
      auctionWinner: isCurrent ? 'Auction Pending' : ''
    };
  });

  const formatCurrency = (amount) => {
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

  // Pulse animation for waiting state
  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const stopPulseAnimation = () => {
    pulseAnimation.stopAnimation();
    pulseAnimation.setValue(1);
  };

  // Generate random 6-digit OTP
  const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  // Simulate sending OTP to user
  const sendOTPToUser = async (monthIndex) => {
    const otp = generateOTP();
    setGeneratedUserOtp(otp);
    
    // In a real app, you would send this via SMS/Email/Push notification
    Alert.alert(
      'OTP Sent to User',
      `A 6-digit OTP has been sent to ${displayMember?.name || 'the user'}'s registered mobile number: ${displayMember?.phone || '+91 xxxxx xxxxx'}.\n\n[Demo OTP: ${otp}]\n\nWaiting for user confirmation...`,
      [{ text: 'OK' }]
    );
    
    setSecurityStep('otp-sent');
    setOtpStep('waiting');
    startPulseAnimation();
    
    // Simulate user entering OTP after 10 seconds (for demo)
    setTimeout(() => {
      simulateUserOTPEntry();
    }, 10000);
  };

  // Simulate user entering OTP on their device
  const simulateUserOTPEntry = () => {
    setUserOtpConfirmed(true);
    setSecurityStep('user-verified');
    setOtpStep('biometric');
    stopPulseAnimation();
    
    Alert.alert(
      'User OTP Verified',
      `${displayMember?.name || 'User'} has successfully entered the OTP on their device.\n\nNow please authenticate with your biometric to complete the transaction.`,
      [{ text: 'Proceed to Biometric' }]
    );
  };

  // OTP Handler Functions
  const handleMonthClick = (monthIndex) => {
    const currentMonth = displayGroup?.currentMonth || 8;
    
    if (monthIndex < currentMonth && paymentUpdateStatus[monthIndex] !== 'completed') {
      // Past month that's not marked completed yet - allow marking as paid
      setSelectedMonth(monthIndex);
      setShowOtpModal(true);
      setOtpStep('user');
      setSecurityStep('init');
      setUserOtp('');
      setAdminOtp('');
      setUserOtpConfirmed(false);
      setIsProcessing(false);
    } else if (monthIndex === currentMonth && paymentUpdateStatus[monthIndex] !== 'completed') {
      // Current month - initiate security process
      setSelectedMonth(monthIndex);
      setShowOtpModal(true);
      setOtpStep('user');
      setSecurityStep('init');
      setUserOtp('');
      setAdminOtp('');
      setUserOtpConfirmed(false);
      setIsProcessing(false);
    }
    // Ignore clicks on future months or already completed months
  };

  // Start the secure payment process
  const initiateSecurePayment = () => {
    setIsProcessing(true);
    sendOTPToUser(selectedMonth);
  };

  // Biometric authentication for admin
  const handleBiometricAuthentication = async () => {
    try {
      setIsProcessing(true);
      setSecurityStep('biometric-pending');
      
      const result = await BiometricService.authenticate(
        `Authenticate to mark payment as completed for ${displayMember?.name || 'user'} - Month ${selectedMonth}`
      );
      
      if (result.success) {
        // Biometric successful, proceed to final admin OTP
        setOtpStep('admin');
        setSecurityStep('biometric-verified');
        Alert.alert(
          'Biometric Verified',
          'Biometric authentication successful. Please enter your admin OTP to complete the transaction.',
          [{ text: 'Continue' }]
        );
      } else {
        Alert.alert(
          'Biometric Failed',
          result.error || 'Biometric authentication failed. Please try again.',
          [{ text: 'Retry', onPress: handleBiometricAuthentication }]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Biometric authentication error. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUserOtpSubmit = () => {
    // This is now just for manual admin verification if needed
    if (userOtp.length !== 6) {
      Alert.alert('Error', 'Please enter a valid 6-digit OTP');
      return;
    }
    
    if (userOtp === generatedUserOtp) {
      simulateUserOTPEntry();
    } else {
      Alert.alert('Error', 'Invalid OTP. Please try again.');
      setUserOtp('');
    }
  };

  const handleAdminOtpSubmit = async () => {
    if (adminOtp.length !== 6) {
      Alert.alert('Error', 'Please enter a valid 6-digit Admin OTP');
      return;
    }
    
    setIsProcessing(true);
    
    // Simulate Admin OTP verification (you would call your API here)
    if (adminOtp === '654321') { // Demo Admin OTP
      try {
        // Update payment status
        setPaymentUpdateStatus(prev => ({
          ...prev,
          [selectedMonth]: 'completed'
        }));
        
        setSecurityStep('completed');
        
        Alert.alert(
          'Payment Completed Successfully!',
          `Month ${selectedMonth} payment for ${displayMember?.name || 'user'} has been securely verified and marked as completed.\n\nSecurity Steps Completed:\n✓ User OTP Verification\n✓ Admin Biometric Authentication\n✓ Admin OTP Confirmation`,
          [
            {
              text: 'OK',
              onPress: () => {
                setShowOtpModal(false);
                resetSecurityState();
              }
            }
          ]
        );
      } catch (error) {
        Alert.alert('Error', 'Failed to update payment status. Please try again.');
      }
    } else {
      Alert.alert('Error', 'Invalid Admin OTP. Please try again.');
      setAdminOtp('');
    }
    
    setIsProcessing(false);
  };

  const resetSecurityState = () => {
    setSelectedMonth(null);
    setOtpStep('user');
    setSecurityStep('init');
    setUserOtp('');
    setAdminOtp('');
    setUserOtpConfirmed(false);
    setIsProcessing(false);
    setGeneratedUserOtp('');
    stopPulseAnimation();
  };

  const handleCloseOtpModal = () => {
    if (isProcessing) {
      Alert.alert(
        'Transaction in Progress',
        'A security verification is currently in progress. Are you sure you want to cancel?',
        [
          { text: 'Continue', style: 'cancel' },
          {
            text: 'Cancel Transaction',
            style: 'destructive',
            onPress: () => {
              setShowOtpModal(false);
              resetSecurityState();
            }
          }
        ]
      );
      return;
    }
    
    setShowOtpModal(false);
    resetSecurityState();
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
                {displayMember?.name ? displayMember.name.split(' ').map(n => n[0]).join('').substring(0, 2) : 'NA'}
              </Text>
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.userName}>{displayMember?.name || 'Unknown Member'}</Text>
              <Text style={styles.userPhone}>{displayMember?.phone || 'No Phone'}</Text>
            </View>
          </View>
        </View>
      )}

      <ScrollView style={styles.groupDetailsContainer} showsVerticalScrollIndicator={false}>

        {/* Traditional Chit Details Table */}
        <View style={styles.chitDetailsCard}>
          <Text style={styles.chitDetailsTitle}>Chit Payment Details</Text>
          
          {/* Table Header */}
          <View style={styles.tableContainer}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, { flex: 0.8 }]}>எண்</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>தேதி</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1.8 }]}>எலத் தள்ளுபடி</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1.8 }]}>க.வே. தொகை</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1.2 }]}>கசர்</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1.2 }]}>கையொப்பம்</Text>
            </View>

            {/* Table Body */}
            <ScrollView style={styles.tableBody} nestedScrollEnabled>
              {chitRows.map((row) => {
                const isCompleted = row.serialNo < (displayGroup?.currentMonth || 8) || paymentUpdateStatus[row.serialNo] === 'completed';
                const isCurrentMonth = row.serialNo === (displayGroup?.currentMonth || 8) && paymentUpdateStatus[row.serialNo] !== 'completed';
                const isFutureMonth = row.serialNo > (displayGroup?.currentMonth || 8);
                
                return (
                  <TouchableOpacity 
                    key={row.serialNo} 
                    style={[
                      styles.tableRow,
                      paymentUpdateStatus[row.serialNo] === 'completed' && styles.completedRow
                    ]}
                    onPress={() => handleMonthClick(row.serialNo)}
                    disabled={isFutureMonth || isCompleted}
                    activeOpacity={isCurrentMonth ? 0.7 : 1}
                  >
                    <Text style={[styles.tableCell, { flex: 0.8 }]}>{row.serialNo}</Text>
                    <Text style={[styles.tableCell, { flex: 1.5 }]}>{row.date}</Text>
                    <Text style={[styles.tableCell, { flex: 1.8 }]}>{row.auctionAmount ? formatCurrency(row.auctionAmount) : ''}</Text>
                    <Text style={[styles.tableCell, { flex: 1.8 }]}>{row.receivedAmount ? formatCurrency(row.receivedAmount) : ''}</Text>
                    <Text style={[styles.tableCell, { flex: 1.2 }]}>{row.commission ? formatCurrency(row.commission) : ''}</Text>
                    <View style={[styles.tableCell, { flex: 1.2, alignItems: 'center' }]}>
                      {isCompleted ? (
                        // Completed months - show green checkmark with "PAID" text
                        <View style={styles.statusContainer}>
                          <MaterialCommunityIcons 
                            name="check-circle" 
                            size={14} 
                            color={paymentUpdateStatus[row.serialNo] === 'completed' ? "#2E7D32" : "#4CAF50"} 
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
                          <MaterialCommunityIcons name="lock" size={14} color="#FF9800" />
                          <Text style={styles.pendingText}>PENDING</Text>
                        </TouchableOpacity>
                      ) : (
                        // Future months - show gray clock with "FUTURE" text
                        <View style={styles.statusContainer}>
                          <MaterialCommunityIcons name="clock-outline" size={14} color="#9E9E9E" />
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
                {otpStep === 'user' && 'Initiate Secure Payment'}
                {otpStep === 'waiting' && 'Waiting for User Confirmation'}
                {otpStep === 'biometric' && 'Biometric Authentication'}
                {otpStep === 'admin' && 'Final Admin Verification'}
              </Text>
              <TouchableOpacity onPress={handleCloseOtpModal} disabled={isProcessing}>
                <MaterialCommunityIcons 
                  name="close" 
                  size={24} 
                  color={isProcessing ? "#9E9E9E" : "#6B7280"} 
                />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.otpModalSubtitle}>
              Month {selectedMonth} - {displayMember?.name || 'Member'} Payment
            </Text>
            
            <View style={styles.otpStepsContainer}>
              <View style={[styles.otpStep, 
                (otpStep === 'user' || securityStep === 'init') && styles.activeOtpStep,
                userOtpConfirmed && styles.completedOtpStep
              ]}>
                <MaterialCommunityIcons 
                  name={userOtpConfirmed ? "check-circle" : "account"} 
                  size={18} 
                  color={userOtpConfirmed ? "#4CAF50" : otpStep === 'user' ? "#6B46C1" : "#9E9E9E"} 
                />
                <Text style={styles.otpStepText}>User OTP</Text>
              </View>
              
              <View style={[styles.otpStepLine, userOtpConfirmed && styles.completedStepLine]} />
              
              <View style={[styles.otpStep, 
                otpStep === 'biometric' && styles.activeOtpStep,
                securityStep === 'biometric-verified' && styles.completedOtpStep
              ]}>
                <Animated.View style={{ transform: [{ scale: otpStep === 'waiting' ? pulseAnimation : 1 }] }}>
                  <MaterialCommunityIcons 
                    name={securityStep === 'biometric-verified' ? "check-circle" : "fingerprint"} 
                    size={18} 
                    color={securityStep === 'biometric-verified' ? "#4CAF50" : otpStep === 'biometric' ? "#6B46C1" : "#9E9E9E"} 
                  />
                </Animated.View>
                <Text style={styles.otpStepText}>Biometric</Text>
              </View>
              
              <View style={[styles.otpStepLine, securityStep === 'biometric-verified' && styles.completedStepLine]} />
              
              <View style={[styles.otpStep, 
                otpStep === 'admin' && styles.activeOtpStep,
                securityStep === 'completed' && styles.completedOtpStep
              ]}>
                <MaterialCommunityIcons 
                  name={securityStep === 'completed' ? "check-circle" : "shield-account"} 
                  size={18} 
                  color={securityStep === 'completed' ? "#4CAF50" : otpStep === 'admin' ? "#6B46C1" : "#9E9E9E"} 
                />
                <Text style={styles.otpStepText}>Admin OTP</Text>
              </View>
            </View>

            {/* Dynamic Content Based on Step */}
            {otpStep === 'user' && (
              <View style={styles.securityActionContainer}>
                <MaterialCommunityIcons name="security" size={48} color="#6B46C1" />
                <Text style={styles.securityActionTitle}>Start Secure Payment Process</Text>
                <Text style={styles.securityActionDescription}>
                  This will send a verification OTP to {displayMember?.name || 'the user'}'s registered mobile number.
                </Text>
                <TouchableOpacity 
                  style={[styles.securityActionButton, isProcessing && styles.disabledButton]} 
                  onPress={initiateSecurePayment}
                  disabled={isProcessing}
                >
                  <MaterialCommunityIcons 
                    name="send" 
                    size={20} 
                    color={isProcessing ? "#9E9E9E" : "#FFFFFF"} 
                  />
                  <Text style={[styles.securityActionButtonText, isProcessing && styles.disabledButtonText]}>
                    {isProcessing ? 'Sending OTP...' : 'Send OTP to User'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {otpStep === 'waiting' && (
              <View style={styles.securityActionContainer}>
                <Animated.View style={{ transform: [{ scale: pulseAnimation }] }}>
                  <MaterialCommunityIcons name="clock-time-four" size={48} color="#FF9800" />
                </Animated.View>
                <Text style={styles.securityActionTitle}>Waiting for User Response</Text>
                <Text style={styles.securityActionDescription}>
                  OTP has been sent to {displayMember?.name || 'the user'}. Waiting for them to enter the OTP on their device...
                </Text>
                <View style={styles.waitingIndicator}>
                  <Text style={styles.waitingText}>⏳ User verification in progress...</Text>
                </View>
                
                {/* Manual OTP verification for demo/testing */}
                <View style={styles.manualOtpContainer}>
                  <Text style={styles.manualOtpLabel}>Demo: Enter User OTP manually</Text>
                  <TextInput
                    style={styles.manualOtpInput}
                    value={userOtp}
                    onChangeText={setUserOtp}
                    keyboardType="numeric"
                    maxLength={6}
                    placeholder={generatedUserOtp}
                    textAlign="center"
                  />
                  <TouchableOpacity 
                    style={styles.manualOtpButton} 
                    onPress={handleUserOtpSubmit}
                  >
                    <Text style={styles.manualOtpButtonText}>Verify</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {otpStep === 'biometric' && (
              <View style={styles.securityActionContainer}>
                <MaterialCommunityIcons name="fingerprint" size={48} color="#4CAF50" />
                <Text style={styles.securityActionTitle}>User OTP Confirmed ✓</Text>
                <Text style={styles.securityActionDescription}>
                  {displayMember?.name || 'User'} has successfully verified their identity. Now authenticate with your biometric to proceed.
                </Text>
                <TouchableOpacity 
                  style={[styles.securityActionButton, styles.biometricButton, isProcessing && styles.disabledButton]} 
                  onPress={handleBiometricAuthentication}
                  disabled={isProcessing}
                >
                  <MaterialCommunityIcons 
                    name="fingerprint" 
                    size={20} 
                    color={isProcessing ? "#9E9E9E" : "#FFFFFF"} 
                  />
                  <Text style={[styles.securityActionButtonText, isProcessing && styles.disabledButtonText]}>
                    {isProcessing ? 'Authenticating...' : 'Authenticate with Biometric'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {otpStep === 'admin' && (
              <View style={styles.otpInputContainer}>
                <View style={styles.successIndicator}>
                  <MaterialCommunityIcons name="shield-check" size={48} color="#4CAF50" />
                  <Text style={styles.successTitle}>Biometric Authentication Successful</Text>
                </View>
                <Text style={styles.otpInputLabel}>
                  Enter Your Admin OTP (6 digits) to Complete Transaction
                </Text>
                <TextInput
                  style={styles.otpInput}
                  value={adminOtp}
                  onChangeText={setAdminOtp}
                  keyboardType="numeric"
                  maxLength={6}
                  placeholder="000000"
                  textAlign="center"
                  editable={!isProcessing}
                />
                <Text style={styles.demoOtpHint}>Demo Admin OTP: 654321</Text>
              </View>
            )}

            <View style={styles.otpModalButtons}>
              <TouchableOpacity 
                style={[styles.otpCancelButton, isProcessing && styles.disabledButton]} 
                onPress={handleCloseOtpModal}
                disabled={isProcessing}
              >
                <Text style={[styles.otpCancelButtonText, isProcessing && styles.disabledButtonText]}>Cancel</Text>
              </TouchableOpacity>
              
              {otpStep === 'admin' && (
                <TouchableOpacity 
                  style={[styles.otpSubmitButton, isProcessing && styles.disabledButton]} 
                  onPress={handleAdminOtpSubmit}
                  disabled={isProcessing || adminOtp.length !== 6}
                >
                  <Text style={[styles.otpSubmitButtonText, 
                    (isProcessing || adminOtp.length !== 6) && styles.disabledButtonText
                  ]}>
                    {isProcessing ? 'Processing...' : 'Complete Payment'}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },

  // User Info Styles
  userInfoCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  userInfoContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#6B46C1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  userAvatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Bold' : 'Poppins-Bold',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Bold' : 'Poppins-Bold',
  },
  userPhone: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Bold' : 'Poppins-Bold',
  },

  // Group Details Styles
  groupDetailsContainer: {
    flex: 1,
    padding: 16,
  },

  // Chit Details Table Styles
  chitDetailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    flex: 1,
    minHeight: 500,
    marginTop: -10,
  },
  chitDetailsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A2A4E',
    marginBottom: 16,
    marginTop: 2,
    textAlign: 'center',
  },
  tableContainer: {
    borderWidth: 1,
    borderColor: '#4CAF50',
    borderRadius: 8,
    overflow: 'hidden',
    // minHeight: 480,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#E8F5E8',
    borderBottomWidth: 1,
    borderBottomColor: '#4CAF50',
  },
  tableHeaderCell: {
    padding: 8,
    fontWeight: '700',
    fontSize: 12,
    color: '#2E7D32',
    textAlign: 'center',
    borderRightWidth: 1,
    borderRightColor: '#4CAF50',
  },
  tableBody: {
    maxHeight: 570,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#C8E6C9',
    backgroundColor: '#FFFFFF',
  },
  completedRow: {
    backgroundColor: '#E8F5E8',
  },
  tableCell: {
    padding: 8,
    fontSize: 12,
    color: '#1F2937',
    textAlign: 'center',
    borderRightWidth: 1,
    borderRightColor: '#C8E6C9',
  },

  // Status Container Styles
  statusContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  paidText: {
    fontSize: 8,
    fontWeight: '600',
    color: '#4CAF50',
    marginTop: 2,
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Bold' : 'Poppins-Bold',
  },
  pendingText: {
    fontSize: 8,
    fontWeight: '600',
    color: '#FF9800',
    marginTop: 2,
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Bold' : 'Poppins-Bold',
  },
  futureText: {
    fontSize: 8,
    fontWeight: '600',
    color: '#9E9E9E',
    marginTop: 2,
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Bold' : 'Poppins-Bold',
  },

  // Action Buttons
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  payButton: {
    flex: 1,
    backgroundColor: '#6B46C1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  payButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  detailsButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#6B46C1',
    gap: 8,
  },
  detailsButtonText: {
    color: '#6B46C1',
    fontSize: 13,
    fontWeight: '800',
  },

  // OTP Modal Styles
  otpModalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  otpModalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  otpModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  otpModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A2A4E',
  },
  otpModalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
    textAlign: 'center',
  },
  
  // OTP Steps
  otpStepsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  otpStep: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  activeOtpStep: {
    backgroundColor: '#EBF4FF',
    borderColor: '#6B46C1',
    borderWidth: 1,
  },
  otpStepText: {
    marginLeft: 6,
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },
  otpStepLine: {
    width: 30,
    height: 2,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 8,
  },

  // OTP Input
  otpInputContainer: {
    marginBottom: 24,
  },
  otpInputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
    textAlign: 'center',
  },
  otpInput: {
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: 8,
    backgroundColor: '#F9FAFB',
  },

  // OTP Buttons
  otpModalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  otpCancelButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  otpCancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  otpSubmitButton: {
    flex: 1,
    backgroundColor: '#6B46C1',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  otpSubmitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Enhanced Security Styles
  completedOtpStep: {
    backgroundColor: '#E8F5E8',
    borderColor: '#4CAF50',
    borderWidth: 1,
  },
  completedStepLine: {
    backgroundColor: '#4CAF50',
  },
  securityActionContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  securityActionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Bold' : 'Poppins-Bold',
  },
  securityActionDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  securityActionButton: {
    backgroundColor: '#6B46C1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
    minWidth: 200,
  },
  biometricButton: {
    backgroundColor: '#4CAF50',
  },
  securityActionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Bold' : 'Poppins-Bold',
  },
  waitingIndicator: {
    backgroundColor: '#FFF4E6',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 16,
  },
  waitingText: {
    color: '#F57C00',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  manualOtpContainer: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    alignItems: 'center',
    width: '100%',
  },
  manualOtpLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
    textAlign: 'center',
  },
  manualOtpInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    minWidth: 120,
  },
  manualOtpButton: {
    backgroundColor: '#6B46C1',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  manualOtpButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  successIndicator: {
    alignItems: 'center',
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4CAF50',
    marginTop: 8,
    textAlign: 'center',
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Bold' : 'Poppins-Bold',
  },
  demoOtpHint: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  disabledButton: {
    backgroundColor: '#E5E7EB',
    opacity: 0.6,
  },
  disabledButtonText: {
    color: '#9CA3AF',
  },
});

export default ChitCard;