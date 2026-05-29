import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Header from '../../../../../components/HeaderComponent/Header';
import ApiService from '../../../../../services/ApiService';

const ChitCard = ({ selectedGroup, onBack }) => {
  const [monthlyData, setMonthlyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  if (!selectedGroup) return null;

  // Fetch monthly details from backend
  useEffect(() => {
    fetchMonthlyDetails();
  }, [selectedGroup.id]);

  const fetchMonthlyDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await ApiService.getGroupMonthlyInfo(selectedGroup.id);
      if (response.success && response.data) {
        const formattedData = formatMonthlyData(response.data);
        setMonthlyData(formattedData);
      } else {
        setError('Failed to fetch payment details');
      }
    } catch (err) {
      console.error('Error fetching monthly details:', err);
      setError(err.message || 'Error fetching payment details');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadStatement = async () => {
    Alert.alert(
      'Download Statement',
      `Preparing statement for ${selectedGroup?.groupName || 'Group'}...\\n\\nYou will need an API endpoint to generate and download the actual PDF/Excel file.`
    );
  };

  // Transform backend data to table format
  const formatMonthlyData = (data) => {
    const totalMonths = selectedGroup.totalMonths || 20;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Create array with all month slots (1 to totalMonths)
    const allMonthsData = Array.from({ length: totalMonths }, (_, index) => {
      const monthNumber = index + 1;
      
      // Find matching data for this month position
      let monthData = null;
      let monthKey = null;
      for (const key in data) {
        const details = data[key];
        // Try to match by month number (you might need to adjust this based on how months are stored)
        const monthIndex = Object.keys(data).indexOf(key);
        if (monthIndex === index) {
          monthData = details;
          monthKey = key;
          break;
        }
      }
      
      // If no data found, create empty row for this month
      const details = monthData || {};
      
      return {
        serialNo: monthNumber,
        monthNumber,
        month: monthKey || `Month ${monthNumber}`,
        collectionPeriod: details.collectionPeriod || monthKey || '',
        date: details.paidDate || '',
        auctionAmount: details.amountTaken || 0,
        receivedAmount: details.paymentAmount || 0,
        commission: details.commission || 0,
        discount: details.discount || 0,
        status: details.status || 'pending',
        dueDate: details.dueDate || '',
        auctionWinner: details.auctionWinner || 'N/A',
      };
    });
    
    return allMonthsData;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDateNumeric = (dateString, monthKey) => {
    if (!dateString && !monthKey) return '';
    try {
      // Try to parse the dateString first
      let date;
      if (dateString) {
        date = new Date(dateString);
        if (!isNaN(date.getTime())) {
          const day = String(date.getDate()).padStart(2, '0');
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const year = date.getFullYear();
          return `${day}/${month}/${year}`;
        }
      }
      
      // Fallback: try to parse monthKey (e.g., "Jan 2024")
      if (monthKey && monthKey.includes(' ')) {
        date = new Date(monthKey);
        if (!isNaN(date.getTime())) {
          const day = String(date.getDate()).padStart(2, '0');
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const year = date.getFullYear();
          return `${day}/${month}/${year}`;
        }
        // If month-year format, just show as "01/MM/YYYY"
        const monthMap = { 'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04', 'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08', 'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12' };
        const [month, year] = monthKey.split(' ');
        if (monthMap[month] && year) {
          return `01/${monthMap[month]}/${year}`;
        }
      }
      
      return dateString || monthKey || '';
    } catch (error) {
      return dateString || monthKey || '';
    }
  };

  return (
    <View style={styles.container}>
      <Header 
        title={selectedGroup.groupName}
        onBack={onBack}
      />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6B46C1" />
          <Text style={styles.loadingText}>Loading payment details...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="alert-circle-outline" size={48} color="#DC2626" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchMonthlyDetails}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={styles.groupDetailsContainer} showsVerticalScrollIndicator={false}>

          {/* Traditional Chit Details Table */}
          <View style={styles.chitDetailsCard}>
            <Text style={styles.chitDetailsTitle}>Chit Payment Details</Text>
            
            {monthlyData.length === 0 ? (
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons name="folder-open-outline" size={48} color="#9CA3AF" />
                <Text style={styles.emptyText}>No payment data available</Text>
              </View>
            ) : (
              <View style={styles.tableContainer}>
                {/* Table Header */}
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
                  {monthlyData.map((row) => {
                    const isCompleted = row.status && row.status.toLowerCase() === 'paid';
                    const isPending = row.status && row.status.toLowerCase() === 'pending';
                    
                    return (
                      <View 
                        key={row.serialNo} 
                        style={styles.tableRow}
                      >
                        <Text style={[styles.tableCell, { flex: 0.8 }]}>{row.serialNo}</Text>
                        <Text style={[styles.tableCell, { flex: 1.5 }]}>{formatDateNumeric(row.collectionPeriod, row.month)}</Text>
                        <Text style={[styles.tableCell, { flex: 1.8 }]}>{row.discount ? formatCurrency(row.discount) : ''}</Text>
                        <Text style={[styles.tableCell, { flex: 1.8 }]}>{row.receivedAmount ? formatCurrency(row.receivedAmount) : ''}</Text>
                        <Text style={[styles.tableCell, { flex: 1.2 }]}>{row.commission ? formatCurrency(row.commission) : ''}</Text>
                        <View style={[styles.tableCell, { flex: 1.2, alignItems: 'center' }]}>
                          {isCompleted ? (
                            <MaterialCommunityIcons name="check-circle" size={16} color="#4CAF50" />
                          ) : isPending ? (
                            <MaterialCommunityIcons name="clock-outline" size={16} color="#FF9800" />
                          ) : (
                            <MaterialCommunityIcons name="clock-outline" size={16} color="#9E9E9E" />
                          )}
                        </View>
                      </View>
                    );
                  })}
                </ScrollView>
              </View>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.payButton}>
              <MaterialCommunityIcons name="credit-card" size={20} color="#FFFFFF" />
              <Text style={styles.payButtonText}>Make Payment</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.detailsButton} onPress={handleDownloadStatement}>
              <MaterialCommunityIcons name="download" size={20} color="#6B46C1" />
              <Text style={styles.detailsButtonText}>Download Statement</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },

  // Loading, Error & Empty States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B46C1',
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 16,
    color: '#DC2626',
    fontWeight: '600',
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#6B46C1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#1A2A4E',
    fontWeight: '600',
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