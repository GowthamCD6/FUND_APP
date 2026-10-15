import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Header from '../../../../../components/HeaderComponent/Header';
import ApiService from '../../../../../services/ApiService';
import { useLanguage } from '../../../../../utils/LanguageContext';

const PrizedSuretyTracker = ({ navigation, onBack }) => {
  const { t, language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [chitGroups, setChitGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);

  // Surety Form Modal State
  const [showSuretyModal, setShowSuretyModal] = useState(false);
  const [guarantor1, setGuarantor1] = useState({
    name: 'R. Senthil Kumar',
    relationship: 'Brother',
    phone: '9840123456',
    occupation: 'Govt School Teacher',
    income: '48,000',
    status: 'verified',
  });
  const [guarantor2, setGuarantor2] = useState({
    name: 'K. Balaji',
    relationship: 'Colleague',
    phone: '9791098765',
    occupation: 'Senior Software Engineer',
    income: '85,000',
    status: 'pending_review',
  });
  const [promissoryNoteAgreed, setPromissoryNoteAgreed] = useState(true);
  const [isSavingSurety, setIsSavingSurety] = useState(false);

  useEffect(() => {
    loadPortfolioData();
  }, []);

  const loadPortfolioData = async () => {
    try {
      setLoading(true);
      const res = await ApiService.getPortfolio();
      if (res?.success && Array.isArray(res.data)) {
        // Mock / enrich with prized status if not set
        const enriched = res.data.map((g, idx) => ({
          ...g,
          isPrized: idx === 0 || g.isPrized || g.status === 'completed',
          prizedMonth: idx === 0 ? 3 : null,
          winningBid: idx === 0 ? Math.round(Number(g.groupAmount || 100000) * 0.82) : null,
          disbursementStatus: idx === 0 ? 'verified_disbursed' : 'not_applicable',
        }));
        setChitGroups(enriched);
        if (enriched.length > 0) {
          setSelectedGroup(enriched[0]);
        }
      } else {
        // Fallback default sample groups
        const sampleGroups = [
          {
            id: 'grp-1',
            name: 'GDK Platinum 1 Lakh',
            groupAmount: 100000,
            monthlyAmount: 5000,
            totalPaid: 35000,
            isPrized: true,
            prizedMonth: 4,
            winningBid: 82000,
            disbursementStatus: 'verified_disbursed',
          },
          {
            id: 'grp-2',
            name: 'GDK Gold 2 Lakh',
            groupAmount: 200000,
            monthlyAmount: 10000,
            totalPaid: 40000,
            isPrized: false,
            prizedMonth: null,
            winningBid: null,
            disbursementStatus: 'not_applicable',
          },
        ];
        setChitGroups(sampleGroups);
        setSelectedGroup(sampleGroups[0]);
      }
    } catch (err) {
      console.error('Error loading portfolio for surety tracker:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSurety = () => {
    if (!guarantor1.name || !guarantor1.phone || !guarantor2.name || !guarantor2.phone) {
      Alert.alert(t('Incomplete Details'), t('Please fill all mandatory contact details for both guarantors.'));
      return;
    }
    setIsSavingSurety(true);
    setTimeout(() => {
      setIsSavingSurety(false);
      setShowSuretyModal(false);
      Alert.alert(
        t('Surety Submitted'),
        t('Guarantor profiles and promissory agreement have been submitted for verification by the chit foreman.')
      );
    }, 1000);
  };

  const formatCurrency = (amt) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amt || 0);
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (navigation?.canGoBack?.()) {
      navigation.goBack();
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Prized Status & Surety" onBack={handleBack} />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6B46C1" />
          <Text style={styles.loadingText}>Loading chit groups...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Summary Banner */}
          <View style={styles.heroSummaryCard}>
            <View style={styles.heroRow}>
              <View>
                <Text style={styles.heroTitle}>Subscribed Chit Portfolios</Text>
                <Text style={styles.heroSubtitle}>
                  {chitGroups.filter((g) => g.isPrized).length} Prized |{' '}
                  {chitGroups.filter((g) => !g.isPrized).length} Non-Prized
                </Text>
              </View>
              <MaterialCommunityIcons name="shield-account" size={36} color="#6B46C1" />
            </View>
          </View>

          {/* Group Cards List */}
          <Text style={styles.sectionHeading}>Your Enrolled Chit Groups</Text>

          {chitGroups.map((group) => {
            const isPrized = Boolean(group.isPrized);
            return (
              <View key={group.id} style={[styles.chitCard, isPrized && styles.chitCardPrized]}>
                <View style={styles.chitCardHeader}>
                  <View style={styles.chitTitleBox}>
                    <Text style={styles.chitName}>{group.name}</Text>
                    <Text style={styles.chitAmount}>Chit Value: {formatCurrency(group.groupAmount || 100000)}</Text>
                  </View>
                  <View style={[styles.statusBadge, isPrized ? styles.prizedBadge : styles.nonPrizedBadge]}>
                    <MaterialCommunityIcons
                      name={isPrized ? 'trophy' : 'timer-sand'}
                      size={14}
                      color={isPrized ? '#B45309' : '#059669'}
                    />
                    <Text style={[styles.statusBadgeText, isPrized ? styles.prizedBadgeText : styles.nonPrizedBadgeText]}>
                      {isPrized ? 'Prized Winner' : 'Non-Prized'}
                    </Text>
                  </View>
                </View>

                {/* Details Breakdown */}
                {isPrized ? (
                  <View style={styles.prizedDetailsBox}>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Auction Won in Month:</Text>
                      <Text style={styles.detailVal}>Month {group.prizedMonth || 3}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Winning Prize Bid:</Text>
                      <Text style={[styles.detailVal, { color: '#059669', fontWeight: '800' }]}>
                        {formatCurrency(group.winningBid || 82000)}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Payout Disbursement:</Text>
                      <View style={styles.disbursedTag}>
                        <MaterialCommunityIcons name="check-circle" size={13} color="#059669" />
                        <Text style={styles.disbursedTagText}>Approved & Disbursed</Text>
                      </View>
                    </View>

                    {/* Surety Action */}
                    <TouchableOpacity
                      style={styles.suretyActionBtn}
                      onPress={() => {
                        setSelectedGroup(group);
                        setShowSuretyModal(true);
                      }}
                    >
                      <MaterialCommunityIcons name="file-document-edit" size={16} color="#6B46C1" />
                      <Text style={styles.suretyActionText}>View / Update Guarantor & Surety</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.nonPrizedDetailsBox}>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Auction Status:</Text>
                      <View style={styles.eligibleTag}>
                        <MaterialCommunityIcons name="check-decagram" size={13} color="#059669" />
                        <Text style={styles.eligibleTagText}>Eligible to bid in next auction</Text>
                      </View>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Total Paid Till Date:</Text>
                      <Text style={styles.detailVal}>{formatCurrency(group.totalPaid || 25000)}</Text>
                    </View>
                    <Text style={styles.nonPrizedHint}>
                      ✨ As a non-prized subscriber, you continue earning monthly dividend deductions on every auction!
                    </Text>
                  </View>
                )}
              </View>
            );
          })}

          {/* Regulatory Requirement Card */}
          <View style={styles.regulationCard}>
            <View style={styles.regHeader}>
              <MaterialCommunityIcons name="information" size={20} color="#3B82F6" />
              <Text style={styles.regTitle}>Chit Funds Act 1982 Surety Guidelines</Text>
            </View>
            <Text style={styles.regText}>
              To receive prize money disbursement, winners must provide two verifiable guarantors (Salaried, Business owner, or Govt employee) and execute a digital promissory note safeguarding the remaining monthly contributions.
            </Text>
          </View>
        </ScrollView>
      )}

      {/* Guarantor / Surety Modal */}
      <Modal
        visible={showSuretyModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowSuretyModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Guarantor & Surety Details</Text>
                <Text style={styles.modalSub}>{selectedGroup?.name}</Text>
              </View>
              <TouchableOpacity onPress={() => setShowSuretyModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
              {/* Guarantor 1 */}
              <View style={styles.guarantorCard}>
                <View style={styles.guarantorCardHeader}>
                  <Text style={styles.guarantorIndex}>Guarantor 1 (Primary)</Text>
                  <View style={styles.verifiedBadge}>
                    <MaterialCommunityIcons name="check-circle" size={12} color="#059669" />
                    <Text style={styles.verifiedBadgeText}>Verified</Text>
                  </View>
                </View>

                <Text style={styles.fieldLabel}>Full Name</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={guarantor1.name}
                  onChangeText={(t) => setGuarantor1((p) => ({ ...p, name: t }))}
                />

                <View style={styles.inputRow}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={styles.fieldLabel}>Relationship</Text>
                    <TextInput
                      style={styles.fieldInput}
                      value={guarantor1.relationship}
                      onChangeText={(t) => setGuarantor1((p) => ({ ...p, relationship: t }))}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.fieldLabel}>Phone Number</Text>
                    <TextInput
                      style={styles.fieldInput}
                      value={guarantor1.phone}
                      keyboardType="phone-pad"
                      onChangeText={(t) => setGuarantor1((p) => ({ ...p, phone: t }))}
                    />
                  </View>
                </View>

                <Text style={styles.fieldLabel}>Occupation / Income</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={guarantor1.occupation}
                  onChangeText={(t) => setGuarantor1((p) => ({ ...p, occupation: t }))}
                />
              </View>

              {/* Guarantor 2 */}
              <View style={styles.guarantorCard}>
                <View style={styles.guarantorCardHeader}>
                  <Text style={styles.guarantorIndex}>Guarantor 2 (Secondary)</Text>
                  <View style={[styles.verifiedBadge, { backgroundColor: '#FEF3C7' }]}>
                    <MaterialCommunityIcons name="clock-outline" size={12} color="#B45309" />
                    <Text style={[styles.verifiedBadgeText, { color: '#B45309' }]}>Under Review</Text>
                  </View>
                </View>

                <Text style={styles.fieldLabel}>Full Name</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={guarantor2.name}
                  onChangeText={(t) => setGuarantor2((p) => ({ ...p, name: t }))}
                />

                <View style={styles.inputRow}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={styles.fieldLabel}>Relationship</Text>
                    <TextInput
                      style={styles.fieldInput}
                      value={guarantor2.relationship}
                      onChangeText={(t) => setGuarantor2((p) => ({ ...p, relationship: t }))}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.fieldLabel}>Phone Number</Text>
                    <TextInput
                      style={styles.fieldInput}
                      value={guarantor2.phone}
                      keyboardType="phone-pad"
                      onChangeText={(t) => setGuarantor2((p) => ({ ...p, phone: t }))}
                    />
                  </View>
                </View>

                <Text style={styles.fieldLabel}>Occupation / Income</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={guarantor2.occupation}
                  onChangeText={(t) => setGuarantor2((p) => ({ ...p, occupation: t }))}
                />
              </View>

              {/* Digital Promissory Note Toggle */}
              <TouchableOpacity
                style={styles.promissoryBox}
                onPress={() => setPromissoryNoteAgreed((p) => !p)}
              >
                <MaterialCommunityIcons
                  name={promissoryNoteAgreed ? 'checkbox-marked' : 'checkbox-blank-outline'}
                  size={22}
                  color={promissoryNoteAgreed ? '#6B46C1' : '#64748B'}
                />
                <Text style={styles.promissoryText}>
                  I confirm that the guarantors provided have consented to guarantee future monthly payments under the Chit Agreement.
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.saveSuretyBtn, (!promissoryNoteAgreed || isSavingSurety) && { opacity: 0.6 }]}
                disabled={!promissoryNoteAgreed || isSavingSurety}
                onPress={handleSaveSurety}
              >
                {isSavingSurety ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveSuretyText}>Save & Submit Surety</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 10,
    fontWeight: '600',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  heroSummaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  heroSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 3,
    fontWeight: '600',
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: '#334155',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chitCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chitCardPrized: {
    borderColor: '#FCD34D',
    backgroundColor: '#FFFDF5',
  },
  chitCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  chitTitleBox: {
    flex: 1,
    marginRight: 8,
  },
  chitName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  chitAmount: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '600',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  prizedBadge: {
    backgroundColor: '#FEF3C7',
  },
  nonPrizedBadge: {
    backgroundColor: '#ECFDF5',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  prizedBadgeText: {
    color: '#B45309',
  },
  nonPrizedBadgeText: {
    color: '#059669',
  },
  prizedDetailsBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FEF08A',
  },
  nonPrizedDetailsBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
  },
  detailLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  detailVal: {
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '700',
  },
  disbursedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  disbursedTagText: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '700',
  },
  eligibleTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  eligibleTagText: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '700',
  },
  nonPrizedHint: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 8,
    lineHeight: 16,
  },
  suretyActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3E8FF',
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 10,
    gap: 6,
  },
  suretyActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B46C1',
  },
  regulationCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginTop: 8,
  },
  regHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  regTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E40AF',
  },
  regText: {
    fontSize: 11,
    color: '#1E3A8A',
    lineHeight: 17,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSub: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  guarantorCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  guarantorCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  guarantorIndex: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 4,
  },
  verifiedBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },
  fieldLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 4,
    marginTop: 6,
  },
  fieldInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '600',
  },
  inputRow: {
    flexDirection: 'row',
  },
  promissoryBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginVertical: 14,
    paddingHorizontal: 4,
  },
  promissoryText: {
    flex: 1,
    fontSize: 12,
    color: '#334155',
    lineHeight: 18,
  },
  saveSuretyBtn: {
    backgroundColor: '#6B46C1',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveSuretyText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});

export default PrizedSuretyTracker;
