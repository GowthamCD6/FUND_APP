import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Dimensions,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Header from '../../../../../components/HeaderComponent/Header';

// Helper to decide if a hex color is light or dark
const isLightColor = (hex) => {
  if (!hex || typeof hex !== 'string') return false;
  const cleanHex = hex.replace('#', '');
  if (cleanHex.length !== 6) return false;
  const r = parseInt(cleanHex.slice(0, 2), 16);
  const g = parseInt(cleanHex.slice(2, 4), 16);
  const b = parseInt(cleanHex.slice(4, 6), 16);
  const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
  return luminance > 186; // threshold: true for light colors
};

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const ChitPlans = ({ onClose, initialPlanIndex = 0 }) => {
  const insets = useSafeAreaInsets();
  const [currentPlan, setCurrentPlan] = useState(initialPlanIndex);
  const scrollViewRef = useRef(null);

  const plans = [
    {
      id: 1,
      name: '1 Lakh Plan',
      amount: '₹1,00,000',
      monthly: '₹5,000',
      duration: '20 Months',
      members: '20',
      color: '#FFD700',
      lightColor: '#FFF7CC',
      description: 'Perfect for first-time investors and small businesses',
      idealFor: [
        'First-time investors',
        'Small business owners',
        'Emergency fund builders',
        'Short-term goals',
      ],
      highlights: [
        'Low monthly commitment',
        'Quick returns possible',
        'Build credit history',
        'Flexible bidding options',
      ],
    },
    {
      id: 2,
      name: '2 Lakh Plan',
      amount: '₹2,00,000',
      monthly: '₹10,000',
      duration: '20 Months',
      members: '20',
      color: '#E5E4E2',
      lightColor: '#F5F5F4',
      description: 'Ideal for medium-term savings and expansion needs',
      idealFor: [
        'Business expansion',
        'Home renovation',
        'Vehicle purchase',
        'Education funding',
      ],
      highlights: [
        'Balanced commitment',
        'Higher savings potential',
        'Medium-term goals',
        'Better returns',
      ],
    },
    {
      id: 3,
      name: '3 Lakh Plan',
      amount: '₹3,00,000',
      monthly: '₹15,000',
      duration: '20 Months',
      members: '20',
      color: '#B9F2FF',
      lightColor: '#E0F8FF',
      description: 'Great for substantial investments and long-term goals',
      idealFor: [
        'Property investment',
        'Major renovations',
        'Business capital',
        'Long-term savings',
      ],
      highlights: [
        'Substantial returns',
        'Long-term wealth building',
        'Major investment needs',
        'Premium benefits',
      ],
    },
    {
      id: 4,
      name: '5 Lakh Plan',
      amount: '₹5,00,000',
      monthly: '₹25,000',
      duration: '20 Months',
      members: '20',
      color: '#DA70D6',
      lightColor: '#F5D4F5',
      description: 'Premium option for maximum returns and large projects',
      idealFor: [
        'Large investments',
        'Property purchase',
        'Major business ventures',
        'Wealth creation',
      ],
      highlights: [
        'Maximum returns',
        'Premium member status',
        'Priority support',
        'Exclusive benefits',
      ],
    },
  ];

  const handleScroll = (event) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / SCREEN_WIDTH);
    setCurrentPlan(index);
  };

  const scrollToPlan = (index) => {
    scrollViewRef.current?.scrollTo({
      x: index * SCREEN_WIDTH,
      animated: true,
    });
  };

  // On mount or when initialPlanIndex changes, jump to that plan
  useEffect(() => {
    setCurrentPlan(initialPlanIndex);
    requestAnimationFrame(() => {
      scrollViewRef.current?.scrollTo({
        x: initialPlanIndex * SCREEN_WIDTH,
        animated: false,
      });
    });
  }, [initialPlanIndex]);

  const plan = plans[currentPlan];

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Chit Plans"
        onBack={onClose}
        showBackButton={true}
        rightComponent={(
          <View style={styles.pagination}>
            {plans.map((_, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => scrollToPlan(index)}
                style={[
                  styles.paginationDot,
                  currentPlan === index && styles.paginationDotActive,
                ]}
              />
            ))}
          </View>
        )}
      />

      {/* Full Screen Plan Cards */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        decelerationRate="fast"
        snapToInterval={SCREEN_WIDTH}
        snapToAlignment="center"
      >
        {plans.map((planItem) => {
          const lightBg = isLightColor(planItem.color);

          // Hero text colors
          const primaryTextColor = lightBg ? '#1F2937' : '#FFFFFF';
          const secondaryTextColor = lightBg
            ? 'rgba(31, 41, 55, 0.8)'
            : 'rgba(255, 255, 255, 0.9)';

          // Stats: always white cards with dark text
          const statCardBg = '#FFFFFF';
          const statValueColor = '#111827';
          const statLabelColor = '#4B5563';

          return (
          <View key={planItem.id} style={styles.planContainer}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.planScrollContent}
            >
              {/* Plan Hero */}
              <View style={[styles.heroCard, { backgroundColor: planItem.color }]}>
                <View style={styles.planBadge}>
                  <Text style={[styles.planBadgeText, { color: primaryTextColor }]}>
                    Plan {planItem.id} of 4
                  </Text>
                </View>
                <Text style={[styles.planName, { color: primaryTextColor }]}>
                  {planItem.name}
                </Text>
                <Text style={[styles.planDescription, { color: secondaryTextColor }]}>
                  {planItem.description}
                </Text>
                <Text style={[styles.planAmount, { color: primaryTextColor }]}>
                  {planItem.amount}
                </Text>
                <Text style={[styles.planAmountLabel, { color: secondaryTextColor }]}>
                  Total Chit Value
                </Text>

                {/* Quick Stats */}
                <View style={styles.statsGrid}>
                  <View style={[styles.statCard, { backgroundColor: statCardBg }]}>
                    <Text style={[styles.statValue, { color: statValueColor }]}>
                      {planItem.monthly}
                    </Text>
                    <Text style={[styles.statLabel, { color: statLabelColor }]}>
                      Monthly
                    </Text>
                  </View>
                  <View style={[styles.statCard, { backgroundColor: statCardBg }]}>
                    <Text style={[styles.statValue, { color: statValueColor }]}>
                      {planItem.duration}
                    </Text>
                    <Text style={[styles.statLabel, { color: statLabelColor }]}>
                      Duration
                    </Text>
                  </View>
                  <View style={[styles.statCard, { backgroundColor: statCardBg }]}>
                    <Text style={[styles.statValue, { color: statValueColor }]}>
                      {planItem.members}
                    </Text>
                    <Text style={[styles.statLabel, { color: statLabelColor }]}>
                      Members
                    </Text>
                  </View>
                </View>
              </View>

              {/* Ideal For */}
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <MaterialCommunityIcons
                    name="account-group"
                    size={20}
                    color={planItem.color}
                  />
                  <Text style={styles.cardTitle}>Ideal For</Text>
                </View>
                <View style={styles.idealForGrid}>
                  {planItem.idealFor.map((item, i) => (
                    <View key={i} style={styles.idealForItem}>
                      <MaterialCommunityIcons
                        name="check-circle"
                        size={16}
                        color={planItem.color}
                      />
                      <Text style={styles.idealForText}>{item}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Key Highlights */}
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <MaterialCommunityIcons
                    name="star"
                    size={20}
                    color={planItem.color}
                  />
                  <Text style={styles.cardTitle}>Key Highlights</Text>
                </View>
                <View style={styles.highlightsContainer}>
                  {planItem.highlights.map((highlight, i) => (
                    <View
                      key={i}
                      style={[
                        styles.highlightItem,
                        { backgroundColor: planItem.lightColor },
                      ]}
                    >
                      <View
                        style={[
                          styles.highlightIcon,
                          { backgroundColor: planItem.color },
                        ]}
                      >
                        <MaterialCommunityIcons
                          name="check"
                          size={14}
                          color="#FFFFFF"
                        />
                      </View>
                      <Text style={styles.highlightText}>{highlight}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Payment Breakdown */}
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <MaterialCommunityIcons
                    name="clock-outline"
                    size={20}
                    color={planItem.color}
                  />
                  <Text style={styles.cardTitle}>Payment Breakdown</Text>
                </View>
                <View style={styles.paymentBreakdown}>
                  <View style={styles.paymentRow}>
                    <Text style={styles.paymentLabel}>Monthly Contribution</Text>
                    <Text style={styles.paymentValue}>{planItem.monthly}</Text>
                  </View>
                  <View style={styles.paymentRow}>
                    <Text style={styles.paymentLabel}>Total Months</Text>
                    <Text style={styles.paymentValue}>
                      {planItem.duration.split(' ')[0]}
                    </Text>
                  </View>
                  <View style={styles.paymentRow}>
                    <Text style={styles.paymentLabel}>Group Members</Text>
                    <Text style={styles.paymentValue}>{planItem.members} People</Text>
                  </View>
                  <View
                    style={[
                      styles.paymentRowHighlight,
                      { backgroundColor: planItem.lightColor },
                    ]}
                  >
                    <Text style={styles.paymentLabelBold}>
                      Total Pool Amount
                    </Text>
                    <Text style={styles.paymentValueBold}>
                      {planItem.amount}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Benefits */}
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <MaterialCommunityIcons
                    name="shield-check"
                    size={20}
                    color={planItem.color}
                  />
                  <Text style={styles.cardTitle}>Why This Plan?</Text>
                </View>
                <View style={styles.benefitsContainer}>
                  <View style={styles.benefitItem}>
                    <MaterialCommunityIcons
                      name="check-circle"
                      size={20}
                      color="#10B981"
                    />
                    <View style={styles.benefitContent}>
                      <Text style={styles.benefitTitle}>Safe & Regulated</Text>
                      <Text style={styles.benefitDescription}>
                        Complies with Chit Funds Act
                      </Text>
                    </View>
                  </View>
                  <View style={styles.benefitItem}>
                    <MaterialCommunityIcons
                      name="trending-up"
                      size={20}
                      color="#3B82F6"
                    />
                    <View style={styles.benefitContent}>
                      <Text style={styles.benefitTitle}>Higher Returns</Text>
                      <Text style={styles.benefitDescription}>
                        Better than traditional savings
                      </Text>
                    </View>
                  </View>
                  <View style={styles.benefitItem}>
                    <MaterialCommunityIcons
                      name="account-multiple"
                      size={20}
                      color="#8B5CF6"
                    />
                    <View style={styles.benefitContent}>
                      <Text style={styles.benefitTitle}>Community Trust</Text>
                      <Text style={styles.benefitDescription}>
                        Build relationships while investing
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* CTA Button */}
              <TouchableOpacity
                style={[styles.ctaButton, { backgroundColor: planItem.color }]}
              >
                <Text style={styles.ctaButtonText}>
                  Choose {planItem.name}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        )})}
      </ScrollView>

      {/* Navigation Arrows */}
      {currentPlan > 0 && (
        <TouchableOpacity
          style={[styles.navArrow, styles.navArrowLeft]}
          onPress={() => scrollToPlan(currentPlan - 1)}
        >
          <MaterialCommunityIcons name="chevron-left" size={24} color="#333" />
        </TouchableOpacity>
      )}
      {currentPlan < plans.length - 1 && (
        <TouchableOpacity
          style={[styles.navArrow, styles.navArrowRight]}
          onPress={() => scrollToPlan(currentPlan + 1)}
        >
          <MaterialCommunityIcons name="chevron-right" size={24} color="#333" />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  pagination: {
    flexDirection: 'row',
    gap: 6,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  durationRow: {
    justifyContent: 'center',
  },
    backgroundColor: '#D1D5DB',
  },
  paginationDotActive: {
    width: 24,
    backgroundColor: '#6B46C1',
  },
  planContainer: {
    width: SCREEN_WIDTH,
  },
  planScrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 10,
  },
  durationCenter: {
    alignItems: 'center',
  },
  durationValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  durationLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  heroCard: {
    borderRadius: 24,
    padding: 24,
    marginBottom: 16,
  },
  planBadge: {
    alignSelf: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
  },
  planBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  planName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  planDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 20,
  },
  planAmount: {
    fontSize: 38,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 4,
  },
  planAmountLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 0,
    width: '30%',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  idealForGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  idealForItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '48%',
  },
  idealForText: {
    fontSize: 13,
    color: '#4B5563',
    flex: 1,
  },
  highlightsContainer: {
    gap: 12,
  },
  highlightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
  },
  highlightIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  highlightText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  paymentBreakdown: {
    gap: 12,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
  },
  paymentLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#4B5563',
    flex: 1,
  },
  paymentValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'right',
  },
  paymentRowHighlight: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  paymentLabelBold: {
    fontSize: 15,
    fontWeight: '700',
  },
  paymentValueBold: {
    fontSize: 20,
    fontWeight: '700',
  },
  benefitsContainer: {
    gap: 16,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#E5E7EB',
  },
  benefitContent: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  benefitDescription: {
    fontSize: 13,
    color: '#6B7280',
  },
  ctaButton: {
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  ctaButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },
  navArrow: {
    position: 'absolute',
    top: '50%',
    backgroundColor: '#FFFFFF',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  navArrowLeft: {
    left: 16, 
  },
  navArrowRight: {
    right: 16,
  },
});

export default ChitPlans;