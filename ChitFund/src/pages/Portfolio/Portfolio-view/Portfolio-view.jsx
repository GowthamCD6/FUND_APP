import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LottieView from 'lottie-react-native';

const ChitGroupDetails = ({ onClose }) => {
  // Sample group data - you can modify this based on your needs
  const groupData = {
    groupName: 'Group A',
    groupId: 'GRP-2024-001',
    totalMembers: 20,
    monthlyContribution: 5000,
    nextPaymentDate: '2025-09-15',
    paymentStatus: 'pending',
    currentMonth: 8,
    totalMonths: 20,
    yourPosition: 3,
    estimatedReceiveAmount: 95000,
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onClose}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#2C3E50" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Group Card</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Lottie Animation */}
        <View style={styles.animationContainer}>
          <LottieView
            source={require('../../../animation/Finance.json')}
            autoPlay
            loop={false}
            style={styles.lottieAnimation}
          />
        </View>

        {/* Group Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.groupName}>{groupData.groupName}</Text>
            <View style={[styles.statusBadge, groupData.paymentStatus === 'completed' ? styles.statusCompleted : styles.statusPending]}>
              <Text style={[styles.statusText, groupData.paymentStatus === 'completed' ? styles.statusCompletedText : styles.statusPendingText]}>
                {groupData.paymentStatus.toUpperCase()}
              </Text>
            </View>
          </View>

          <Text style={styles.groupId}>ID: {groupData.groupId}</Text>

          <View style={styles.cardBody}>
            <View style={styles.row}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Total Members</Text>
                <Text style={styles.infoValue}>{groupData.totalMembers}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Your Position</Text>
                <Text style={styles.infoValue}>#{groupData.yourPosition}</Text>
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Monthly Amount</Text>
                <Text style={styles.infoValue}>{formatCurrency(groupData.monthlyContribution)}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Next Payment</Text>
                <Text style={styles.infoValue}>{formatDate(groupData.nextPaymentDate)}</Text>
              </View>
            </View>

            <View style={styles.progressSection}>
              <Text style={styles.progressLabel}>Payment Progress</Text>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { width: `${(groupData.currentMonth / groupData.totalMonths) * 100}%` }
                  ]} 
                />
              </View>
              <Text style={styles.progressText}>
                {groupData.currentMonth} of {groupData.totalMonths} payments completed
              </Text>
            </View>

            <View style={styles.estimateSection}>
              <Text style={styles.estimateLabel}>Estimated Receive Amount</Text>
              <Text style={styles.estimateAmount}>{formatCurrency(groupData.estimatedReceiveAmount)}</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.payButton}>
            <MaterialCommunityIcons name="credit-card" size={20} color="#FFFFFF" />
            <Text style={styles.payButtonText}>Pay Now</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.detailsButton}>
            <MaterialCommunityIcons name="information" size={20} color="#6B46C1" />
            <Text style={styles.detailsButtonText}>View Details</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A2A4E',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  animationContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  lottieAnimation: {
    width: 350,
    height: 290,
    marginTop: -45,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    marginTop: -30,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  groupName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A2A4E',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusPending: {
    backgroundColor: '#FEF3C7',
  },
  statusCompleted: {
    backgroundColor: '#D1FAE5',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusPendingText: {
    color: '#D97706',
  },
  statusCompletedText: {
    color: '#059669',
  },
  groupId: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
  },
  cardBody: {
    marginTop: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  infoItem: {
    flex: 1,
    marginHorizontal: 4,
  },
  infoLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  progressSection: {
    marginTop: 20,
    marginBottom: 16,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6B46C1',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  estimateSection: {
    backgroundColor: '#F3F0FF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  estimateLabel: {
    fontSize: 14,
    color: '#6B46C1',
    marginBottom: 4,
  },
  estimateAmount: {
    fontSize: 22,
    fontWeight: '700',
    color: '#6B46C1',
  },
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
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ChitGroupDetails;
