import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Header from '../../../../../components/HeaderComponent/Header';
import { useLanguage } from '../../../../../utils/LanguageContext';

const { width } = Dimensions.get('window');

const PRESET_AMOUNTS = [100000, 200000, 300000, 500000];
const PRESET_DISCOUNTS = [10, 15, 20, 25, 30];

const ChitSimulator = ({ navigation, onBack }) => {
  const { t, language } = useLanguage();

  const [chitValue, setChitValue] = useState(100000);
  const [customAmount, setCustomAmount] = useState('');
  const [totalMonths, setTotalMonths] = useState(20);
  const [bidMonth, setBidMonth] = useState(5);
  const [discountPercent, setDiscountPercent] = useState(20);
  const [mode, setMode] = useState('borrower'); // 'borrower' | 'investor'

  const activeChitValue = useMemo(() => {
    if (customAmount && !isNaN(Number(customAmount)) && Number(customAmount) > 0) {
      return Number(customAmount);
    }
    return chitValue;
  }, [chitValue, customAmount]);

  const baseMonthly = useMemo(() => Math.round(activeChitValue / totalMonths), [activeChitValue, totalMonths]);

  // Calculations for chosen month and discount
  const calculations = useMemo(() => {
    const discountAmount = Math.round(activeChitValue * (discountPercent / 100));
    const prizeMoney = activeChitValue - discountAmount;
    const commission = Math.round(activeChitValue * 0.05); // 5% foreman
    const dividendPool = Math.max(0, discountAmount - commission);
    const dividendPerMember = Math.round(dividendPool / totalMonths);
    const installmentThatMonth = Math.max(0, baseMonthly - dividendPerMember);

    // Projected total dividends across all 20 months
    // Typically auctions taper down from max discount (e.g. 30%) in month 2 down to 5% in month 20
    let estimatedTotalDividends = 0;
    for (let m = 1; m <= totalMonths; m++) {
      // Linear interpolation of discount from 30% down to 5%
      const mDiscount = Math.max(5, 30 - ((m - 1) / (totalMonths - 1)) * 25);
      const mDiscountAmt = activeChitValue * (mDiscount / 100);
      const mDivPool = Math.max(0, mDiscountAmt - commission);
      estimatedTotalDividends += mDivPool / totalMonths;
    }
    estimatedTotalDividends = Math.round(estimatedTotalDividends);

    const totalPaidOverTenure = (baseMonthly * totalMonths) - estimatedTotalDividends;
    const netGainOrCost = prizeMoney - totalPaidOverTenure;

    // Bank loan comparison (15% APR for equivalent remaining months)
    const remainingTenureYears = (totalMonths - bidMonth) / 12;
    const bankLoanInterest = Math.round(prizeMoney * 0.15 * Math.max(0.5, remainingTenureYears));
    const bankProcessingFee = Math.round(prizeMoney * 0.02);
    const totalBankLoanCost = prizeMoney + bankLoanInterest + bankProcessingFee;
    const chitTotalCost = totalPaidOverTenure;
    const moneySavedVsBank = Math.max(0, totalBankLoanCost - chitTotalCost);

    // Investor ROI calculation (if holding till month 20)
    const totalInvestedInvestor = totalPaidOverTenure;
    const finalPayoutInvestor = activeChitValue;
    const netProfitInvestor = finalPayoutInvestor - totalInvestedInvestor;
    const investorROI = totalInvestedInvestor > 0 ? ((netProfitInvestor / totalInvestedInvestor) * 100).toFixed(1) : '0';

    return {
      discountAmount,
      prizeMoney,
      commission,
      dividendPool,
      dividendPerMember,
      installmentThatMonth,
      estimatedTotalDividends,
      totalPaidOverTenure,
      netGainOrCost,
      moneySavedVsBank,
      totalBankLoanCost,
      investorROI,
      netProfitInvestor,
    };
  }, [activeChitValue, totalMonths, bidMonth, discountPercent, baseMonthly]);

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
      <Header title="Chit Simulator & ROI" onBack={handleBack} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Mode Selector */}
        <View style={styles.modeToggleContainer}>
          <TouchableOpacity
            style={[styles.modeButton, mode === 'borrower' && styles.modeButtonActive]}
            onPress={() => setMode('borrower')}
          >
            <MaterialCommunityIcons 
              name="cash-fast" 
              size={18} 
              color={mode === 'borrower' ? '#FFFFFF' : '#6B46C1'} 
            />
            <Text style={[styles.modeButtonText, mode === 'borrower' && styles.modeButtonTextActive]}>
              Borrower (Prized)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modeButton, mode === 'investor' && styles.modeButtonActive]}
            onPress={() => setMode('investor')}
          >
            <MaterialCommunityIcons 
              name="chart-line-variant" 
              size={18} 
              color={mode === 'investor' ? '#FFFFFF' : '#6B46C1'} 
            />
            <Text style={[styles.modeButtonText, mode === 'investor' && styles.modeButtonTextActive]}>
              Investor (Saver)
            </Text>
          </TouchableOpacity>
        </View>

        {/* Chit Value Selector */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>1. Select Chit Value</Text>
          <View style={styles.presetsRow}>
            {PRESET_AMOUNTS.map((amt) => {
              const isSelected = activeChitValue === amt && !customAmount;
              return (
                <TouchableOpacity
                  key={amt}
                  style={[styles.presetChip, isSelected && styles.presetChipActive]}
                  onPress={() => {
                    setChitValue(amt);
                    setCustomAmount('');
                  }}
                >
                  <Text style={[styles.presetText, isSelected && styles.presetTextActive]}>
                    ₹{(amt / 100000).toFixed(amt % 100000 === 0 ? 0 : 1)}L
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.customInputRow}>
            <Text style={styles.customLabel}>Or Custom: ₹</Text>
            <TextInput
              style={styles.customTextInput}
              value={customAmount}
              onChangeText={setCustomAmount}
              placeholder="e.g. 150000"
              keyboardType="numeric"
              placeholderTextColor="#94A3B8"
            />
          </View>
        </View>

        {/* Month of Bidding Selector */}
        <View style={styles.card}>
          <View style={styles.headerWithBadge}>
            <Text style={styles.sectionTitle}>2. Bidding in Month</Text>
            <View style={styles.pillBadge}>
              <Text style={styles.pillBadgeText}>Month {bidMonth} of {totalMonths}</Text>
            </View>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.monthsScroll}>
            {Array.from({ length: totalMonths }, (_, i) => i + 1).map((m) => {
              const isSelected = bidMonth === m;
              return (
                <TouchableOpacity
                  key={m}
                  style={[styles.monthBox, isSelected && styles.monthBoxActive]}
                  onPress={() => setBidMonth(m)}
                >
                  <Text style={[styles.monthBoxText, isSelected && styles.monthBoxTextActive]}>
                    M{m}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <Text style={styles.monthAdvice}>
            {bidMonth <= 4
              ? '💡 Early months have high bidding competition and larger discounts. Ideal for high-urgency capital.'
              : bidMonth <= 12
              ? '💡 Mid-cycle offers a balanced sweet spot between discount cost and dividend savings.'
              : '💡 Late cycle is highest yield for savers with minimal discount and maximal dividend earnings.'}
          </Text>
        </View>

        {/* Expected Bid Discount % */}
        <View style={styles.card}>
          <View style={styles.headerWithBadge}>
            <Text style={styles.sectionTitle}>3. Expected Bid Discount</Text>
            <View style={[styles.pillBadge, { backgroundColor: '#F3E8FF' }]}>
              <Text style={[styles.pillBadgeText, { color: '#6B46C1' }]}>{discountPercent}% ({formatCurrency(calculations.discountAmount)})</Text>
            </View>
          </View>

          <View style={styles.presetsRow}>
            {PRESET_DISCOUNTS.map((pct) => {
              const isSelected = discountPercent === pct;
              return (
                <TouchableOpacity
                  key={pct}
                  style={[styles.presetChip, isSelected && styles.presetChipActive]}
                  onPress={() => setDiscountPercent(pct)}
                >
                  <Text style={[styles.presetText, isSelected && styles.presetTextActive]}>
                    {pct}%
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Stepper buttons */}
          <View style={styles.stepperRow}>
            <TouchableOpacity
              style={styles.stepBtn}
              onPress={() => setDiscountPercent((prev) => Math.max(5, prev - 1))}
            >
              <MaterialCommunityIcons name="minus" size={20} color="#1E293B" />
            </TouchableOpacity>

            <Text style={styles.stepperVal}>{discountPercent}% Discount</Text>

            <TouchableOpacity
              style={styles.stepBtn}
              onPress={() => setDiscountPercent((prev) => Math.min(40, prev + 1))}
            >
              <MaterialCommunityIcons name="plus" size={20} color="#1E293B" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Real-Time Payout & Financial Results */}
        <View style={styles.resultsCard}>
          <Text style={styles.resultsHeader}>
            {mode === 'borrower' ? '🎯 Projected Borrower Payout' : '📈 Investor Wealth Growth'}
          </Text>

          {mode === 'borrower' ? (
            <>
              {/* Highlight Hero Stat */}
              <View style={styles.heroStatContainer}>
                <Text style={styles.heroStatLabel}>Cash Prize You Receive in Month {bidMonth}</Text>
                <Text style={styles.heroStatValue}>{formatCurrency(calculations.prizeMoney)}</Text>
                <Text style={styles.heroStatSub}>Full cash disbursed within 48h after surety verification</Text>
              </View>

              {/* Breakdown Grid */}
              <View style={styles.statsGrid}>
                <View style={styles.statBox}>
                  <Text style={styles.statBoxLabel}>Total Discount Foregone</Text>
                  <Text style={[styles.statBoxValue, { color: '#B45309' }]}>
                    {formatCurrency(calculations.discountAmount)}
                  </Text>
                </View>

                <View style={styles.statBox}>
                  <Text style={styles.statBoxLabel}>Your Dividend Month {bidMonth}</Text>
                  <Text style={[styles.statBoxValue, { color: '#059669' }]}>
                    +{formatCurrency(calculations.dividendPerMember)}
                  </Text>
                </View>

                <View style={styles.statBox}>
                  <Text style={styles.statBoxLabel}>Net Installment Month {bidMonth}</Text>
                  <Text style={styles.statBoxValue}>
                    {formatCurrency(calculations.installmentThatMonth)}
                  </Text>
                </View>

                <View style={styles.statBox}>
                  <Text style={styles.statBoxLabel}>Est. Total 20-Mo Dividends</Text>
                  <Text style={[styles.statBoxValue, { color: '#6B46C1' }]}>
                    +{formatCurrency(calculations.estimatedTotalDividends)}
                  </Text>
                </View>
              </View>

              {/* Bank Loan Comparison Card */}
              <View style={styles.comparisonCard}>
                <View style={styles.compHeader}>
                  <MaterialCommunityIcons name="scale-balance" size={20} color="#059669" />
                  <Text style={styles.compTitle}>Why Chit Fund beats Bank Personal Loan</Text>
                </View>
                <Text style={styles.compDesc}>
                  To borrow {formatCurrency(calculations.prizeMoney)} from a bank at 15% interest, you would pay{' '}
                  <Text style={{ fontWeight: '700' }}>{formatCurrency(calculations.totalBankLoanCost)}</Text>. With GDKChit, your net payment is{' '}
                  <Text style={{ fontWeight: '700' }}>{formatCurrency(calculations.totalPaidOverTenure)}</Text>.
                </Text>
                <View style={styles.savingsPill}>
                  <MaterialCommunityIcons name="piggy-bank" size={16} color="#065F46" />
                  <Text style={styles.savingsPillText}>
                    You Save {formatCurrency(calculations.moneySavedVsBank)} vs Bank Loan!
                  </Text>
                </View>
              </View>
            </>
          ) : (
            <>
              {/* Investor Hero Stat */}
              <View style={styles.heroStatContainer}>
                <Text style={styles.heroStatLabel}>Final Payout at Month 20 Maturity</Text>
                <Text style={styles.heroStatValue}>{formatCurrency(activeChitValue)}</Text>
                <Text style={styles.heroStatSub}>Full face value with zero auction deductions</Text>
              </View>

              <View style={styles.statsGrid}>
                <View style={styles.statBox}>
                  <Text style={styles.statBoxLabel}>Actual Total Paid In</Text>
                  <Text style={styles.statBoxValue}>
                    {formatCurrency(calculations.totalPaidOverTenure)}
                  </Text>
                </View>

                <View style={styles.statBox}>
                  <Text style={styles.statBoxLabel}>Total Dividends Earned</Text>
                  <Text style={[styles.statBoxValue, { color: '#059669' }]}>
                    +{formatCurrency(calculations.estimatedTotalDividends)}
                  </Text>
                </View>

                <View style={styles.statBox}>
                  <Text style={styles.statBoxLabel}>Net Wealth Profit</Text>
                  <Text style={[styles.statBoxValue, { color: '#6B46C1' }]}>
                    +{formatCurrency(calculations.netProfitInvestor)}
                  </Text>
                </View>

                <View style={styles.statBox}>
                  <Text style={styles.statBoxLabel}>Annualized ROI</Text>
                  <Text style={[styles.statBoxValue, { color: '#D97706' }]}>
                    ~{calculations.investorROI}%
                  </Text>
                </View>
              </View>

              <View style={styles.comparisonCard}>
                <View style={styles.compHeader}>
                  <MaterialCommunityIcons name="star-circle" size={20} color="#6B46C1" />
                  <Text style={styles.compTitle}>Disciplined Monthly Wealth Creation</Text>
                </View>
                <Text style={styles.compDesc}>
                  By paying an average of only {formatCurrency(Math.round(calculations.totalPaidOverTenure / totalMonths))} per month (reduced by monthly auction dividends), you accumulate a lump sum of {formatCurrency(activeChitValue)}.
                </Text>
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  modeToggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  modeButtonActive: {
    backgroundColor: '#6B46C1',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
  },
  modeButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6B46C1',
  },
  modeButtonTextActive: {
    color: '#FFFFFF',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 10,
  },
  headerWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  pillBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pillBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#059669',
  },
  presetsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  presetChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  presetChipActive: {
    backgroundColor: '#EDE9FE',
    borderColor: '#6B46C1',
  },
  presetText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  presetTextActive: {
    color: '#6B46C1',
    fontWeight: '800',
  },
  customInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    marginTop: 4,
  },
  customLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  customTextInput: {
    flex: 1,
    paddingVertical: 8,
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '700',
  },
  monthsScroll: {
    gap: 8,
    paddingVertical: 4,
  },
  monthBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  monthBoxActive: {
    backgroundColor: '#6B46C1',
    borderColor: '#5B21B6',
  },
  monthBoxText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  monthBoxTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  monthAdvice: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 10,
    lineHeight: 16,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  stepBtn: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  stepperVal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  resultsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
  },
  resultsHeader: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
  },
  heroStatContainer: {
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: '#FCD34D',
  },
  heroStatLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E',
    textTransform: 'uppercase',
  },
  heroStatValue: {
    fontSize: 32,
    fontWeight: '900',
    color: '#B45309',
    marginVertical: 4,
  },
  heroStatSub: {
    fontSize: 11,
    color: '#78350F',
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  statBox: {
    width: (width - 74) / 2,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statBoxLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 4,
  },
  statBoxValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  comparisonCard: {
    backgroundColor: '#ECFDF5',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  compHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  compTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#065F46',
  },
  compDesc: {
    fontSize: 12,
    color: '#047857',
    lineHeight: 18,
    marginBottom: 10,
  },
  savingsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 6,
  },
  savingsPillText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#065F46',
  },
});

export default ChitSimulator;
