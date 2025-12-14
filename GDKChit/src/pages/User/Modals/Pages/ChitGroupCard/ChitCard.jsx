import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Header from '../../../../../components/HeaderComponent/Header';

const ChitCard = ({ selectedGroup, onBack }) => {
  if (!selectedGroup) return null;

  // Create 20 rows for chit details table
  const chitRows = Array.from({ length: 20 }, (_, index) => ({
    serialNo: index + 1,
    date: index < selectedGroup.currentMonth ? `${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}/09/2024` : '',
    auctionAmount: index < selectedGroup.currentMonth ? Math.floor(Math.random() * 5000) + 15000 : '',
    receivedAmount: index < selectedGroup.currentMonth ? Math.floor(Math.random() * 3000) + 12000 : '',
    commission: index < selectedGroup.currentMonth ? Math.floor(Math.random() * 500) + 200 : '',
    signature: index < selectedGroup.currentMonth ? '✓' : '',
  }));

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <View style={styles.container}>
      <Header 
        title={selectedGroup.groupName}
        onBack={onBack}
      />

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
                const isCompleted = row.serialNo < selectedGroup.currentMonth;
                const isCurrentMonth = row.serialNo === selectedGroup.currentMonth;
                const isFutureMonth = row.serialNo > selectedGroup.currentMonth;
                
                return (
                  <View 
                    key={row.serialNo} 
                    style={styles.tableRow}
                  >
                    <Text style={[styles.tableCell, { flex: 0.8 }]}>{row.serialNo}</Text>
                    <Text style={[styles.tableCell, { flex: 1.5 }]}>{row.date}</Text>
                    <Text style={[styles.tableCell, { flex: 1.8 }]}>{row.auctionAmount ? formatCurrency(row.auctionAmount) : ''}</Text>
                    <Text style={[styles.tableCell, { flex: 1.8 }]}>{row.receivedAmount ? formatCurrency(row.receivedAmount) : ''}</Text>
                    <Text style={[styles.tableCell, { flex: 1.2 }]}>{row.commission ? formatCurrency(row.commission) : ''}</Text>
                    <View style={[styles.tableCell, { flex: 1.2, alignItems: 'center' }]}>
                      {isCompleted ? (
                        <MaterialCommunityIcons name="check-circle" size={16} color="#4CAF50" />
                      ) : isCurrentMonth ? (
                        <MaterialCommunityIcons name="lock" size={16} color="#FF9800" />
                      ) : (
                        <MaterialCommunityIcons name="clock-outline" size={16} color="#9E9E9E" />
                      )}
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.payButton}>
            <MaterialCommunityIcons name="credit-card" size={20} color="#FFFFFF" />
            <Text style={styles.payButtonText}>Make Payment</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.detailsButton}>
            <MaterialCommunityIcons name="download" size={20} color="#6B46C1" />
            <Text style={styles.detailsButtonText}>Download Statement</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
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
    minHeight: 700,//////
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
  tableCell: {
    padding: 8,
    fontSize: 12,
    color: '#1F2937',
    textAlign: 'center',
    borderRightWidth: 1,
    borderRightColor: '#C8E6C9',
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
});

export default ChitCard;