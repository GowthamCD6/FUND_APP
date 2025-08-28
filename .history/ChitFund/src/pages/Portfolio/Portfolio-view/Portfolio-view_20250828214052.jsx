import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import LottieView from 'lottie-react-native';
import LeftArrowIcon from '../../../assects';

const ChitGroupDetails = ({ group, onClose }) => {
  // Dummy group data for testing purposes if group prop is not provided
  const dummyGroup = {
    groupName: 'Group A',
    groupId: 'GRP-2024-001',
    investmentAmount: 100000,
    totalMembers: 20,
    monthlyContribution: 5000,
    currentMonth: 8,
    totalMonths: 20,
    estimatedPayDate: '2025-09-15',
    paymentStatus: 'pending', // Can be 'pending' or 'completed'
  };

  const currentGroup = group || dummyGroup; // Use prop or dummy data

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Date(date.getTime() + date.getTimezoneOffset() * 60000).toLocaleDateString('en-IN', {
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
          <LeftArrowIcon width={24} height={24} fill="#2C3E50" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {currentGroup ? currentGroup.groupName : 'Group Details'}
        </Text>
      </View>

      {/* Main Content */}
      {currentGroup ? (
        <ScrollView style={styles.content}>
          {/* Lottie Animation Section */}
          <View style={styles.animationContainer}>
            <LottieView
              source={require('../../../animation/Finance.json')} // Ensure this path is correct
              autoPlay
              loop
              style={styles.lottieAnimation}
            />
          </View>
          
          <View style={styles.detailCard}>
            <Text style={styles.sectionTitle}>Group Information</Text>
            
            <View style={styles.detailRow}>
              <Text style={styles.label}>Group ID:</Text>
              <Text style={styles.value}>{currentGroup.groupId}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.label}>Investment Amount:</Text>
              <Text style={styles.value}>{formatCurrency(currentGroup.investmentAmount)}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.label}>Total Members:</Text>
              <Text style={styles.value}>{currentGroup.totalMembers}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.label}>Monthly Contribution:</Text>
              <Text style={styles.value}>{formatCurrency(currentGroup.monthlyContribution)}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.label}>Current Month:</Text>
              <Text style={styles.value}>{currentGroup.currentMonth} of {currentGroup.totalMonths}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.label}>Estimated Pay Date:</Text>
              <Text style={styles.value}>{formatDate(currentGroup.estimatedPayDate)}</Text>
            </View>
            
            <View style={styles.detailRowNoBorder}>
              <Text style={styles.label}>Payment Status:</Text>
              <Text style={[
                styles.value, 
                currentGroup.paymentStatus === 'completed' ? styles.statusCompleted : styles.statusPending
              ]}>
                {currentGroup.paymentStatus.charAt(0).toUpperCase() + currentGroup.paymentStatus.slice(1)}
              </Text>
            </View>
          </View>

          {/* Progress Section */}
          <View style={styles.progressCard}>
            <Text style={styles.sectionTitle}>Payment Progress</Text>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${(currentGroup.currentMonth / currentGroup.totalMonths) * 100}%` }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>
              {currentGroup.currentMonth} of {currentGroup.totalMonths} payments completed
            </Text>
          </View>
        </ScrollView>
      ) : (
        <View style={styles.noDataContainer}>
          <LottieView
            source={require('../../../animation/Finance.json')} // Assuming you have a 'NoData' animation
            autoPlay
            style={styles.noDataAnimation}
          />
          <Text style={styles.noDataText}>No group data available</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F6FA',
  },

  /** HEADER **/
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  backButton: {
    padding: 8,
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A2A4E',
  },

  /** CONTENT **/
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
  },

  /** ANIMATION **/
  animationContainer: {
    alignItems: 'center',
    marginBottom: 24,
    backgroundColor: '#EAF4FE',
    borderRadius: 20,
    paddingVertical: 25,
  },
  lottieAnimation: {
    width: 200,
    height: 180,
  },

  /** CARD STYLES **/
  detailCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A2A4E',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EDF2F7',
  },
  detailRowNoBorder: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  label: {
    fontSize: 15,
    fontWeight: '500',
    color: '#7B8BA4',
  },
  value: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2C3E50',
  },
  statusPending: {
    color: '#F39C12',
    fontWeight: '700',
  },
  statusCompleted: {
    color: '#27AE60',
    fontWeight: '700',
  },

  /** PROGRESS **/
  progressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  progressBar: {
    height: 12,
    backgroundColor: '#E5EAF0',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4B7BEC',
    borderRadius: 8,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#7B8BA4',
    textAlign: 'center',
  },

  /** NO DATA **/
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  noDataAnimation: {
    width: 220,
    height: 200,
    marginBottom: 20,
  },
  noDataText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#7B8BA4',
  },
});

export default ChitGroupDetails;