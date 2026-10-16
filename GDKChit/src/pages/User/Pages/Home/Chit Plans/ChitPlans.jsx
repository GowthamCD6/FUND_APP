import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  ImageBackground,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Header from '../../../../../components/HeaderComponent/Header';
import { getCloudinaryAsset } from '../../../../../utils/cloudinaryAssetHelper';

const plansBG = getCloudinaryAsset('PlansBG.jpeg', require('../../../../../assets/UserHomePage/PlansBG.jpeg'));

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
      gradientColors: ['#FFE57F', '#FFF0B3', '#FFF9E6'],
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
      gradientColors: ['#D5D8DC', '#E5E8EC', '#F2F4F7'],
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
      gradientColors: ['#80DEEA', '#B2EBF2', '#E0F7FA'],
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
      gradientColors: ['#E1BEE7', '#F3E5F5', '#FAEEFA'],
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
    <ImageBackground source={plansBG} style={styles.backgroundImage} resizeMode="cover">
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />
      <View style={[styles.container, { paddingTop: insets.top }]}>
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
            return (
              <View key={planItem.id} style={styles.planContainer}>
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.planScrollContent}
                >
                  <Header
                    title="Chit Plans"
                    onBack={onClose}
                    showBackButton={true}
                    headerStyle={{ backgroundColor: 'transparent', paddingHorizontal: 0, marginBottom: 8 }}
                    titleStyle={{ color: '#FFFFFF' }}
                    backIconFill="#FFFFFF"
                    showDivider={false}
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
                  {/* Ultra Transparent Glass Main Card */}
                  <View style={styles.singleMainCard}>
                    {/* Plan Hero Header */}
                    <View style={styles.heroSection}>
                      <Text style={styles.planAmount}>
                        {planItem.amount}
                      </Text>
                      <Text style={styles.planDescription}>
                        {planItem.description}
                      </Text>

                      {/* Quick Stats */}
                      <View style={styles.statsGrid}>
                        <View style={styles.statCard}>
                          <Text style={styles.statValue}>
                            {planItem.monthly}
                          </Text>
                          <Text style={styles.statLabel}>
                            Monthly
                          </Text>
                        </View>
                        <View style={styles.statCard}>
                          <Text style={styles.statValue}>
                            {planItem.duration}
                          </Text>
                          <Text style={styles.statLabel}>
                            Duration
                          </Text>
                        </View>
                        <View style={styles.statCard}>
                          <Text style={styles.statValue}>
                            {planItem.members}
                          </Text>
                          <Text style={styles.statLabel}>
                            Members
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Ideal For */}
                    <View style={styles.sectionBlock}>
                      <View style={styles.cardHeader}>
                        <View style={styles.cardHeaderIconBg}>
                          <MaterialCommunityIcons
                            name="account-group"
                            size={18}
                            color="#FFD700"
                          />
                        </View>
                        <Text style={styles.cardTitle}>Ideal For</Text>
                      </View>
                      <View style={styles.idealForGrid}>
                        {planItem.idealFor.map((item, i) => (
                          <View key={i} style={styles.idealForItem}>
                            <MaterialCommunityIcons
                              name="check-circle"
                              size={16}
                              color="#FFD700"
                            />
                            <Text style={styles.idealForText}>{item}</Text>
                          </View>
                        ))}
                      </View>
                    </View>

                    {/* Key Highlights */}
                    <View style={styles.sectionBlock}>
                      <View style={styles.cardHeader}>
                        <View style={styles.cardHeaderIconBg}>
                          <MaterialCommunityIcons
                            name="star"
                            size={18}
                            color="#FFD700"
                          />
                        </View>
                        <Text style={styles.cardTitle}>Key Highlights</Text>
                      </View>
                      <View style={styles.highlightsContainer}>
                        {planItem.highlights.map((highlight, i) => (
                          <View
                            key={i}
                            style={styles.highlightItem}
                          >
                            <View style={styles.highlightIcon}>
                              <MaterialCommunityIcons
                                name="check"
                                size={14}
                                color="#111827"
                              />
                            </View>
                            <Text style={styles.highlightText}>{highlight}</Text>
                          </View>
                        ))}
                      </View>
                    </View>

                    {/* Payment Breakdown */}
                    <View style={styles.sectionBlock}>
                      <View style={styles.cardHeader}>
                        <View style={styles.cardHeaderIconBg}>
                          <MaterialCommunityIcons
                            name="clock-outline"
                            size={18}
                            color="#FFD700"
                          />
                        </View>
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
                        <View style={styles.paymentRowHighlight}>
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
                    <View style={[styles.sectionBlock, { marginBottom: 0 }]}>
                      <View style={styles.cardHeader}>
                        <View style={styles.cardHeaderIconBg}>
                          <MaterialCommunityIcons
                            name="shield-check"
                            size={18}
                            color="#FFD700"
                          />
                        </View>
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
                            color="#A855F7"
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
                  </View>
                </ScrollView>
              </View>
            );
          })}
        </ScrollView>

        {/* Navigation Arrows */}
        {currentPlan > 0 && (
          <TouchableOpacity
            style={[styles.navArrow, styles.navArrowLeft]}
            onPress={() => scrollToPlan(currentPlan - 1)}
          >
            <MaterialCommunityIcons name="chevron-left" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        )}
        {currentPlan < plans.length - 1 && (
          <TouchableOpacity
            style={[styles.navArrow, styles.navArrowRight]}
            onPress={() => scrollToPlan(currentPlan + 1)}
          >
            <MaterialCommunityIcons name="chevron-right" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'transparent',
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
    color: '#FFFFFF',
  },
  pagination: {
    flexDirection: 'row',
    gap: 6,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  paginationDotActive: {
    width: 24,
    backgroundColor: '#FFD700',
  },
  planContainer: {
    width: SCREEN_WIDTH,
    backgroundColor: 'transparent',
  },
  planScrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
  },
  durationCenter: {
    alignItems: 'center',
  },
  durationValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  durationLabel: {
    fontSize: 12,
    color: '#E2E8F0',
    marginTop: 2,
  },
  singleMainCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)', // Completely outline-free see-through main card
    borderRadius: 26,
    padding: 24,
    paddingBottom: 24,
    marginBottom: 16,
  },
  heroSection: {
    marginBottom: 24,
  },
  sectionBlock: {
    marginBottom: 24,
  },
  heroCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 20,
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
    fontSize: 14.5,
    fontWeight: '500',
    color: '#E2E8F0',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    maxWidth: '92%',
    alignSelf: 'center',
  },
  planAmount: {
    fontSize: 40,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -1,
  },
  planAmountLabel: {
    fontSize: 14,
    color: '#E2E8F0',
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
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
    textAlign: 'center',
    backgroundColor: 'transparent',
  },
  statLabel: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#E2E8F0',
    textAlign: 'center',
    backgroundColor: 'transparent',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 18,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
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
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 12,
  },
  idealForText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#F1F5F9',
    flex: 1,
  },
  highlightsContainer: {
    gap: 14,
  },
  highlightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  highlightIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFD700',
  },
  highlightText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#F1F5F9',
    flex: 1,
  },
  paymentBreakdown: {
    gap: 14,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 16,
  },
  paymentLabel: {
    fontSize: 13.5,
    fontWeight: '500',
    color: '#CBD5E1',
    flex: 1,
  },
  paymentValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'right',
  },
  paymentRowHighlight: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
  },
  paymentLabelBold: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  paymentValueBold: {
    fontSize: 19,
    fontWeight: '800',
    color: '#FFD700',
  },
  benefitsContainer: {
    gap: 14,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FFD700',
  },
  benefitContent: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  benefitDescription: {
    fontSize: 12.5,
    fontWeight: '500',
    color: '#CBD5E1',
    lineHeight: 18,
  },
  amountBadge: {
    alignSelf: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 6,
    marginBottom: 16,
  },
  amountBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  cardHeaderIconBg: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  ctaButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    padding: 18,
    borderRadius: 16,
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
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navArrowLeft: {
    left: 16, 
  },
  navArrowRight: {
    right: 16,
  },
});

export default ChitPlans;