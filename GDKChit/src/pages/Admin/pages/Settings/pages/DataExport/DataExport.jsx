import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  BackHandler,
  ScrollView,
  TextInput,
  Modal,
  Dimensions,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LottieView from 'lottie-react-native';
import Header from '../../../../../../components/HeaderComponent/Header';
import ApiService from '../../../../../../services/ApiService';
import { useLanguage } from '../../../../../../utils/LanguageContext';

const { height } = Dimensions.get('window');

const escapeHtml = (str) => {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

const DataExport = () => {
  const { t } = useLanguage();
  const navigation = useNavigation();
  const [exportType, setExportType] = useState('users'); // 'users' or 'groups'
  const [selectionMode, setSelectionMode] = useState('all'); // 'all' or 'specific'
  
  const [loadingType, setLoadingType] = useState(null);
  const [isFetchingData, setIsFetchingData] = useState(true);
  
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [tempSelectedIds, setTempSelectedIds] = useState([]);

  const openSelectionModal = () => {
    setTempSelectedIds([...selectedIds]);
    setSearchQuery('');
    setModalVisible(true);
  };

  const toggleTempSelection = (id) => {
    setTempSelectedIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(item => item !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handleDoneSelection = () => {
    setSelectedIds(tempSelectedIds);
    setModalVisible(false);
  };

  const handleCancelSelection = () => {
    setModalVisible(false);
  };

  useEffect(() => {
    const backAction = () => {
      navigation.goBack();
      return true;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [navigation]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setIsFetchingData(true);
    try {
      const [usersRes, groupsRes] = await Promise.all([
        ApiService.makeRequest('/admin/users/getAllUsers', { method: 'GET' }).then(r => r.json()),
        ApiService.makeRequest('/admin/groups/getGroups', { method: 'GET' }).then(r => r.json())
      ]);

      if (usersRes.success) {
        setUsers(usersRes.data || usersRes.users || []);
      }
      if (groupsRes.success) {
        setGroups(groupsRes.data || groupsRes.groups || []);
      }
    } catch (error) {
      console.error('Error fetching data for export:', error);
    } finally {
      setIsFetchingData(false);
    }
  };

  const handleExport = async () => {
    if (loadingType !== null) return;

    if (selectionMode === 'specific' && selectedIds.length === 0) {
      alert(`Please select at least one ${exportType.slice(0, -1)} to export.`);
      return;
    }

    setLoadingType(exportType);
    try {
      let list = [];
      
      if (exportType === 'users') {
        list = selectionMode === 'all' 
          ? users 
          : users.filter(u => selectedIds.includes(u.id || u.userId));
      } else {
        const baseGroups = selectionMode === 'all'
          ? groups
          : groups.filter(g => selectedIds.includes(g.id || g.groupId));
          
        if (selectionMode === 'specific') {
          // Fetch deep data for specific groups (like members)
          const enrichedGroups = await Promise.all(baseGroups.map(async (g) => {
            try {
              const cleanGroupId = encodeURIComponent(String(g.id || g.groupId).trim());
              const res = await ApiService.makeRequest(`/admin/groups/getMembers?groupId=${cleanGroupId}`, { method: 'GET' }).then(r => r.json());
              if (res.success && res.members) {
                const memberNames = res.members.map(m => m.name).join(' | ');
                return { ...g, MembersList: memberNames };
              }
            } catch (e) {
              console.log('Failed to fetch members for group', g.id);
            }
            return { ...g, MembersList: 'Error fetching members' };
          }));
          list = enrichedGroups;
        } else {
          list = baseGroups;
        }
      }

      if (list.length === 0) {
        alert('No data available to export.');
        return;
      }

      // Format data and generate PDF
      let cleanedData = [];
      let headers = [];

      if (exportType === 'users') {
        cleanedData = list.map((u, index) => ({
          'No': String(index + 1),
          'ID': String(u.id || u.userId || 'N/A'),
          'Name': String(u.name || 'N/A'),
          'Phone': String(u.phone || 'N/A'),
          'Email': String(u.email || 'N/A'),
          'Role': String(u.type || u.role || 'User'),
          'Joined Date': u.joinedDate ? new Date(u.joinedDate).toLocaleDateString('en-GB') : 'N/A',
          'Status': u.isActive === '1' || u.isActive === true || String(u.isActive) === '1' ? 'Active' : 'Inactive',
        }));
        headers = ['No', 'ID', 'Name', 'Phone', 'Email', 'Role', 'Joined Date', 'Status'];
      } else {
        cleanedData = list.map((g, index) => {
          const formatCurrency = (val) => {
            if (val === null || val === undefined || isNaN(parseFloat(val))) return 'N/A';
            return `₹${parseFloat(val).toLocaleString('en-IN')}`;
          };
          const formatDate = (val) => {
            if (!val) return 'N/A';
            return new Date(val).toLocaleDateString('en-GB');
          };
          return {
            'No': String(index + 1),
            'Group Code': String(g.groupCode || g.group_code || 'N/A'),
            'Group Name': String(g.group_name || g.name || 'N/A'),
            'Total Members': String(g.totalMembers || g.total_members || 0),
            'Current Members': String(g.currentMembers || g.current_members || g.members_count || 0),
            'Duration (Months)': String(g.duration || g.totalCycles || 0),
            'Group Amount': formatCurrency(g.groupAmount || g.group_amount),
            'Monthly Contribution': formatCurrency(g.monthlyAmount || g.monthly_amount),
            'Start Date': formatDate(g.startDate || g.start_date),
            'End Date': formatDate(g.endDate || g.end_date),
            'Status': String(g.status || 'N/A'),
          };
        });
        headers = ['No', 'Group Code', 'Group Name', 'Total Members', 'Current Members', 'Duration (Months)', 'Group Amount', 'Monthly Contribution', 'Start Date', 'End Date', 'Status'];
      }

      const htmlTitle = exportType === 'users' ? 'Users Data Export' : 'Groups Data Export';
      const htmlContent = `
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <style>
              body {
                font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
                color: #1F2937;
                padding: 15px;
                background-color: #FFFFFF;
              }
              .header {
                border-bottom: 3px solid #6B46C1;
                padding-bottom: 15px;
                margin-bottom: 25px;
              }
              .title {
                color: #6B46C1;
                font-size: 26px;
                font-weight: bold;
                margin: 0;
              }
              .subtitle {
                font-size: 13px;
                color: #4B5563;
                margin-top: 5px;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 15px;
              }
              th {
                background-color: #6B46C1;
                color: #FFFFFF;
                text-align: left;
                padding: 10px 8px;
                font-size: 11px;
                font-weight: 600;
                text-transform: uppercase;
                border: 1px solid #6B46C1;
              }
              td {
                padding: 10px 8px;
                border-bottom: 1px solid #E5E7EB;
                border-left: 1px solid #F3F4F6;
                border-right: 1px solid #F3F4F6;
                font-size: 11px;
                color: #374151;
              }
              tr:nth-child(even) {
                background-color: #F9FAFB;
              }
              .footer {
                margin-top: 40px;
                border-top: 1px solid #E5E7EB;
                padding-top: 15px;
                font-size: 10px;
                color: #9CA3AF;
                text-align: center;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="title">${escapeHtml(htmlTitle)}</div>
              <div class="subtitle">GDK Chit Management System — Export details</div>
            </div>
            <table>
              <thead>
                <tr>
                  ${headers.map(h => `<th>${escapeHtml(h)}</th>`).join('')}
                </tr>
              </thead>
              <tbody>
                ${cleanedData.map(row => `
                  <tr>
                    ${headers.map(h => `<td>${escapeHtml(row[h])}</td>`).join('')}
                  </tr>
                `).join('')}
              </tbody>
            </table>
            <div class="footer">
              Generated automatically on ${escapeHtml(new Date().toLocaleDateString('en-GB'))} at ${escapeHtml(new Date().toLocaleTimeString())}
            </div>
          </body>
        </html>
      `;

      let expoAvailable = false;
      let Print, Sharing;
      try {
        Print = require('expo-print');
        Sharing = require('expo-sharing');
        expoAvailable = true;
      } catch (e) {
        console.log('Expo print/sharing modules not available natively, using fallback');
      }

      if (expoAvailable && Print && Sharing) {
        const { uri } = await Print.printToFileAsync({
          html: htmlContent,
        });

        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: `Share ${htmlTitle}`,
          UTI: 'com.adobe.pdf',
        });
      } else {
        // Fallback to CSV string sharing with CSV Formula Injection protection
        const csvHeader = headers.map(h => escapeHtml(h)).join(',') + '\n';
        const csvRows = cleanedData.map(row => 
          headers.map(h => {
            let val = String(row[h] || '');
            if (/^[=+\-@]/.test(val)) {
              val = `'${val}`;
            }
            val = val.replace(/"/g, '""');
            if (val.includes(',') || val.includes('\n') || val.includes('"')) {
              val = `"${val}"`;
            }
            return val;
          }).join(',')
        ).join('\n');
        
        const csvContent = csvHeader + csvRows;

        await Share.share({
          title: htmlTitle,
          message: csvContent,
        });
      }

    } catch (error) {
      console.error('Export error:', error);
      alert('An error occurred during export. Make sure you have an internet connection.');
    } finally {
      setLoadingType(null);
    }
  };

  const currentList = exportType === 'users' ? users : groups;
  const filteredList = currentList.filter(item => {
    const searchLower = searchQuery.toLowerCase();
    if (exportType === 'users') {
      return (item.name && item.name.toLowerCase().includes(searchLower)) || 
             (item.phone && String(item.phone).includes(searchLower));
    } else {
      return item.group_name && item.group_name.toLowerCase().includes(searchLower);
    }
  });

  const filteredIds = filteredList.map(item => item.id || item.userId || item.groupId);
  const tempAreAllFilteredSelected = filteredIds.length > 0 && filteredIds.every(id => tempSelectedIds.includes(id));

  const handleSelectAllFilteredTemp = () => {
    if (tempAreAllFilteredSelected) {
      setTempSelectedIds(prev => prev.filter(id => !filteredIds.includes(id)));
    } else {
      setTempSelectedIds(prev => {
        const newSelection = [...prev];
        filteredIds.forEach(id => {
          if (!newSelection.includes(id)) {
            newSelection.push(id);
          }
        });
        return newSelection;
      });
    }
  };

  return (
    <View style={styles.container}>
      <Header 
        title={t('Data Export')}
        onBack={() => {
          navigation.goBack();
        }}
        showBackButton={true}
      />

      <View style={styles.content}>
        {/* Top Type Selector */}
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tabButton, exportType === 'users' && styles.tabButtonActive]}
            onPress={() => { setExportType('users'); setSelectedIds([]); setSearchQuery(''); }}
          >
            <MaterialCommunityIcons name="account-group" size={20} color={exportType === 'users' ? '#FFF' : '#6B7280'} />
            <Text style={[styles.tabText, exportType === 'users' && styles.tabTextActive]}>{t('Users Data')}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tabButton, exportType === 'groups' && styles.tabButtonActive]}
            onPress={() => { setExportType('groups'); setSelectedIds([]); setSearchQuery(''); }}
          >
            <MaterialCommunityIcons name="view-grid" size={20} color={exportType === 'groups' ? '#FFF' : '#6B7280'} />
            <Text style={[styles.tabText, exportType === 'groups' && styles.tabTextActive]}>{t('Groups Data')}</Text>
          </TouchableOpacity>
        </View>

        {/* Lottie Animation */}
        <View style={styles.animationContainer}>
          <LottieView
            source={require('../../../../../../animation/data-export.json')}
            autoPlay
            loop
            style={styles.lottieAnimation}
          />
        </View>

        {/* Selection Mode Selector */}
        <View style={styles.selectionModeContainer}>
          <TouchableOpacity 
            style={styles.radioRow} 
            onPress={() => setSelectionMode('all')}
          >
            <MaterialCommunityIcons 
              name={selectionMode === 'all' ? 'radiobox-marked' : 'radiobox-blank'} 
              size={24} 
              color={selectionMode === 'all' ? '#6B46C1' : '#9CA3AF'} 
            />
            <View style={styles.radioTextContainer}>
              <Text style={styles.radioTitle}>{t('Export All')}</Text>
              <Text style={styles.radioDesc}>Exports complete list of all {exportType}.</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.radioRow, { marginTop: 16 }]} 
            onPress={() => setSelectionMode('specific')}
          >
            <MaterialCommunityIcons 
              name={selectionMode === 'specific' ? 'radiobox-marked' : 'radiobox-blank'} 
              size={24} 
              color={selectionMode === 'specific' ? '#6B46C1' : '#9CA3AF'} 
            />
            <View style={styles.radioTextContainer}>
              <Text style={styles.radioTitle}>{t('Export Specific')}</Text>
              <Text style={styles.radioDesc}>Select specific {exportType} to export detailed data.</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Search & List (Only for Specific Mode) */}
        {selectionMode === 'specific' && (
          <View style={styles.selectionCard}>
            <View style={styles.selectionCardHeader}>
              <MaterialCommunityIcons 
                name={exportType === 'users' ? "account-multiple" : "folder-table"} 
                size={22} 
                color="#6B46C1" 
              />
              <Text style={styles.selectionCardTitle}>
                {t('Selected:')} {exportType.charAt(0).toUpperCase() + exportType.slice(1)}
              </Text>
            </View>

            {selectedIds.length === 0 ? (
              <Text style={styles.noSelectionsText}>
                No specific {exportType} selected yet. Tap the button below to pick.
              </Text>
            ) : (
              <View style={styles.selectionSummaryList}>
                <Text style={styles.summaryBadgeText}>
                  {selectedIds.length} {exportType} selected
                </Text>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false} 
                  contentContainerStyle={styles.summaryChipsScroll}
                >
                  {selectedIds.map(id => {
                    const item = currentList.find(i => (i.id || i.userId || i.groupId) === id);
                    if (!item) return null;
                    const name = exportType === 'users' ? item.name : item.group_name;
                    return (
                      <View key={id} style={styles.summaryChip}>
                        <Text style={styles.summaryChipText}>{name}</Text>
                      </View>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            <TouchableOpacity 
              style={styles.openModalButton}
              onPress={openSelectionModal}
            >
              <MaterialCommunityIcons name="filter-plus" size={18} color="#FFFFFF" />
              <Text style={styles.openModalButtonText}>
                {t('Select Specific')} ({exportType})
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ flex: 1 }} />

        {/* Action Button */}
        <TouchableOpacity 
          style={styles.exportButton}
          onPress={handleExport}
          disabled={loadingType !== null}
        >
          {loadingType !== null ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <>
              <MaterialCommunityIcons name="export" size={20} color="#FFF" />
              <Text style={styles.exportButtonText}>
                {t('Generate & Export PDF')}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Selection Picker Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCancelSelection}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.pickerModalContainer}>
            <View style={styles.pickerModalHeader}>
              <Text style={styles.pickerModalTitle}>
                Select {exportType.charAt(0).toUpperCase() + exportType.slice(1)}
              </Text>
              <TouchableOpacity onPress={handleCancelSelection} style={styles.modalCloseButton}>
                <MaterialCommunityIcons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>

            {/* Search Box */}
            <View style={styles.modalSearchBox}>
              <MaterialCommunityIcons name="magnify" size={20} color="#9CA3AF" />
              <TextInput 
                style={styles.searchInput}
                placeholder={`Search ${exportType}...`}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            {/* Selected Items Horizontal Chips */}
            {tempSelectedIds.length > 0 && (
              <View style={styles.selectedChipsContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsScroll}>
                  {tempSelectedIds.map(id => {
                    const selectedItem = currentList.find(item => (item.id || item.userId || item.groupId) === id);
                    if (!selectedItem) return null;
                    const name = exportType === 'users' ? selectedItem.name : selectedItem.group_name;
                    const initial = name ? name.charAt(0).toUpperCase() : '?';
                    return (
                      <View key={id} style={styles.selectedChip}>
                        <View style={styles.chipAvatar}>
                          <Text style={styles.chipAvatarText}>{initial}</Text>
                        </View>
                        <Text style={styles.chipText} numberOfLines={1}>
                          {name}
                        </Text>
                        <TouchableOpacity onPress={() => toggleTempSelection(id)} style={styles.chipRemoveButton}>
                          <MaterialCommunityIcons name="close-circle" size={16} color="#9CA3AF" />
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {/* Quick Actions Header Bar */}
            {!isFetchingData && (
              <View style={styles.listHeaderActions}>
                <Text style={styles.selectedCountText}>
                  {tempSelectedIds.length} selected
                </Text>
                <View style={styles.actionLinks}>
                  <TouchableOpacity onPress={handleSelectAllFilteredTemp} style={styles.actionLinkButton}>
                    <Text style={styles.actionLinkText}>
                      {tempAreAllFilteredSelected ? "Deselect Filtered" : "Select Filtered"}
                    </Text>
                  </TouchableOpacity>
                  <Text style={styles.actionLinkDivider}>|</Text>
                  <TouchableOpacity onPress={() => setTempSelectedIds([])} style={styles.actionLinkButton}>
                    <Text style={styles.actionLinkText}>Clear All</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Main Selection List */}
            {isFetchingData ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#6B46C1" />
                <Text style={styles.loadingText}>Loading {exportType}...</Text>
              </View>
            ) : (
              <ScrollView style={styles.modalListContainer} showsVerticalScrollIndicator={false}>
                {filteredList.map((item, index) => {
                  const itemId = item.id || item.userId || item.groupId;
                  const isSelected = tempSelectedIds.includes(itemId);
                  const title = exportType === 'users' ? item.name : item.group_name;
                  const subTitle = exportType === 'users' ? item.phone : `Amount: ₹${item.group_amount}`;
                  
                  return (
                    <TouchableOpacity 
                      key={itemId || index} 
                      style={[styles.listItem, isSelected && styles.listItemSelected]}
                      onPress={() => toggleTempSelection(itemId)}
                    >
                      <MaterialCommunityIcons 
                        name={isSelected ? "checkbox-marked" : "checkbox-blank-outline"} 
                        size={24} 
                        color={isSelected ? "#6B46C1" : "#D1D5DB"} 
                      />
                      <View style={styles.itemTextContainer}>
                        <Text style={[styles.itemTitle, isSelected && { color: '#6B46C1' }]}>{title || 'Unknown'}</Text>
                        <Text style={styles.itemSub}>{subTitle || ''}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
                {filteredList.length === 0 && (
                  <Text style={styles.noResultsText}>No {exportType} found.</Text>
                )}
                <View style={{ height: 20 }} />
              </ScrollView>
            )}

            {/* Modal Footer Actions */}
            <View style={styles.pickerModalFooter}>
              <TouchableOpacity
                style={styles.cancelPickerButton}
                onPress={handleCancelSelection}
              >
                <Text style={styles.cancelPickerButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.donePickerButton}
                onPress={handleDoneSelection}
              >
                <Text style={styles.donePickerButtonText}>Confirm ({tempSelectedIds.length})</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>


      {/* Export Loading Overlay Modal */}
      {loadingType !== null && (
        <View style={styles.overlayContainer}>
          <View style={styles.overlayCard}>
            <LottieView
              source={require('../../../../../../animation/data-export.json')}
              autoPlay
              loop
              style={styles.overlayAnimation}
            />
            <Text style={styles.overlayText}>Preparing your PDF document...</Text>
            <ActivityIndicator size="small" color="#6B46C1" style={{ marginTop: 16 }} />
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: 20,
    paddingBottom: 30,
    backgroundColor: '#FFFFFF',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    gap: 8,
  },
  tabButtonActive: {
    backgroundColor: '#6B46C1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    fontFamily: Platform.OS === 'android' ? 'Roboto-Medium' : 'System',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  selectionModeContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 20,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  radioTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  radioTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  radioDesc: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  specificContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#1F2937',
    height: '100%',
  },
  listContainer: {
    flex: 1,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  listItemSelected: {
    backgroundColor: '#F3F0FF',
    borderRadius: 8,
    paddingHorizontal: 8,
    borderBottomWidth: 0,
    marginVertical: 4,
  },
  itemTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#374151',
  },
  itemSub: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#6B7280',
    fontSize: 14,
  },
  noResultsText: {
    textAlign: 'center',
    color: '#9CA3AF',
    marginTop: 24,
    fontSize: 14,
  },
  exportButton: {
    flexDirection: 'row',
    backgroundColor: '#6B46C1',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
  },
  exportButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: Platform.OS === 'android' ? 'Roboto-Bold' : 'System',
  },
  animationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    backgroundColor: 'transparent',
  },
  lottieAnimation: {
    width: 270,
    height: 270,
    marginTop: -60,
    marginBottom: -40,

  },
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
    elevation: 5,
  },
  overlayCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    width: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  overlayAnimation: {
    width: 180,
    height: 180,
  },
  overlayText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
    textAlign: 'center',
  },
  bottomButtonContainer: {
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
    paddingTop: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  selectedChipsContainer: {
    maxHeight: 50,
    marginBottom: 12,
  },
  chipsScroll: {
    paddingHorizontal: 4,
    alignItems: 'center',
    gap: 8,
  },
  selectedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F0FF',
    borderRadius: 20,
    paddingLeft: 4,
    paddingRight: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#E9D5FF',
    gap: 6,
  },
  chipAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#6B46C1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipAvatarText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  chipText: {
    fontSize: 13,
    color: '#6B46C1',
    fontWeight: '500',
    maxWidth: 120,
  },
  chipRemoveButton: {
    padding: 2,
  },
  listHeaderActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    marginBottom: 8,
  },
  selectedCountText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B46C1',
  },
  actionLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionLinkButton: {
    paddingVertical: 2,
  },
  actionLinkText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B46C1',
  },
  actionLinkDivider: {
    fontSize: 13,
    color: '#D1D5DB',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end', // slide up from bottom
  },
  pickerModalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 30 : 20,
    maxHeight: height * 0.85,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  pickerModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  pickerModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  modalSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 14,
  },
  modalListContainer: {
    flexGrow: 0,
    maxHeight: height * 0.45,
  },
  pickerModalFooter: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 12,
  },
  cancelPickerButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  cancelPickerButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
  },
  donePickerButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#6B46C1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  donePickerButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  selectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 20,
  },
  selectionCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  selectionCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  noSelectionsText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 14,
  },
  selectionSummaryList: {
    marginBottom: 16,
  },
  summaryBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B46C1',
    backgroundColor: '#F3F0FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  summaryChipsScroll: {
    alignItems: 'center',
    gap: 6,
  },
  summaryChip: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  summaryChipText: {
    fontSize: 12,
    color: '#374151',
  },
  openModalButton: {
    flexDirection: 'row',
    backgroundColor: '#6B46C1',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  openModalButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default DataExport;
// Force rebuild watcher comment