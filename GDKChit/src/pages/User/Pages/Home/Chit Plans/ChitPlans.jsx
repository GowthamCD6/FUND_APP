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
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LottieView from 'lottie-react-native';
import Header from '../../../../../components/HeaderComponent/Header';

const plansBG = require('../../../../../assets/UserHomePage/PlansBG.jpeg');

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ChitPlans = ({ onClose, initialPlanIndex = 0 }) => {
  const insets = useSafeAreaInsets();
  const [currentPlan, setCurrentPlan] = useState(initialPlanIndex);
  const scrollViewRef = useRef(null);

  const plans = [
    {
      id: 1,
      name: '1 Lakh Plan',
      badge: 'Popular',
      amount: '₹1,00,000',
      monthly: '₹5,000',
      duration: '20 Months',
      return: '₹95,000',
      members: '20',
      color: '#D97706',
      accentColor: '#F59E0B',
      lottie: require('../../../../../animation/UserHome/1LAkhLotte.json'),
      description: 'Perfect for first-time investors and small businesses with quick returns and low monthly commitments.',
      idealFor: [
        'First-time investors',
        'Small business owners',
        'Emergency fund builders',
        'Short-term goals',
      ],
      highlights: [
        'Low monthly commitment of ₹5,000',
        'Quick returns up to ₹95,000',
        'Build strong chit history',
        'Transparent & flexible bidding',
      ],
    },
    {
      id: 2,
      name: '2 Lakh Plan',
      badge: 'Best Value',
      amount: '₹2,00,000',
      monthly: '₹10,000',
      duration: '20 Months',
      return: '₹1,90,000',
      members: '20',
      color: '#0D9488',
      accentColor: '#14B8A6',
      lottie: require('../../../../../animation/UserHome/2LakhLotte.json'),
      description: 'Ideal for medium-term savings, family planning, vehicle purchases, and business expansion needs.',
      idealFor: [
        'Business expansion',
        'Home renovation',
        'Vehicle purchase',
        'Education funding',
      ],
      highlights: [
        'Balanced ₹10,000 monthly commitment',
        'Higher savings potential & dividend benefits',
        'Expected return of ₹1,90,000',
        'Prompt prize money disbursement',
      ],
    },
    {
      id: 3,
      name: '3 Lakh Plan',
      badge: 'Trending',
      amount: '₹3,00,000',
      monthly: '₹15,000',
      duration: '20 Months',
      return: '₹2,85,000',
      members: '20',
      color: '#7C3AED',
      accentColor: '#8B5CF6',
      lottie: require('../../../../../animation/UserHome/3LakhLotte.json'),
      description: 'Great for substantial investments, weddings, home improvements, and long-term capital creation.',
      idealFor: [
        'Property investment',
        'Major renovations',
        'Business capital',
        'Long-term savings',
      ],
      highlights: [
        'Substantial returns up to ₹2,85,000',
        'Long-term disciplined wealth accumulation',
        'Priority participation & digital tracking',
        'Dedicated customer manager support',
      ],
    },
    {
      id: 4,
      name: '5 Lakh Plan',
      badge: 'Premium',
      amount: '₹5,00,000',
      monthly: '₹25,000',
      duration: '20 Months',
      return: '₹4,75,000',
      members: '20',
      color: '#DB2777',
      accentColor: '#EC4899',
      lottie: require('../../../../../animation/UserHome/5LakhLotte.json'),
      description: 'Premium flagship tier for maximum returns, property acquisitions, and major venture capital needs.',
      idealFor: [
        'Large investments',
        'Property purchase',
        'Major business ventures',
        'High-yield wealth creation',
      ],
      highlights: [
        'Maximum expected prize pool of ₹4,75,000',
        'VIP status with highest auction priority',
        'Dedicated fast-track documentation & payouts',
        'Comprehensive financial security & guarantees',
      ],
    },
  ];

  const handleScroll = (event) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / SCREEN_WIDTH);
    if (index >= 0 && index < plans.length && index !== currentPlan) {
      setCurrentPlan(index);
    }
  };

  const scrollToPlan = (index) => {
    scrollViewRef.current?.scrollTo({
      x: index * SCREEN_WIDTH,
      animated: true,
    });
    setCurrentPlan(index);
  };

  useEffect(() => {
    setCurrentPlan(initialPlanIndex);
    requestAnimationFrame(() => {
      scrollViewRef.current?.scrollTo({
        x: initialPlanIndex * SCREEN_WIDTH,
        animated: false,
      });
    });
  }, [initialPlanIndex]);

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
          {plans.map((planItem, planIdx) => {
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
                    headerStyle={{ backgroundColor: 'transparent', paddingHorizontal: 0, marginBottom: 12 }}
                    titleStyle={{ color: '#FFFFFF', fontSize: 19, fontWeight: '700' }}
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
                              currentPlan === index && [styles.paginationDotActive, { backgroundColor: planItem.color }],
                            ]}
                            hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                          />
                        ))}
                      </View>
                    )}
                  />

                  {/* --- Home Page Styled Sliding Master Card --- */}
                  <View style={[styles.homeMasterCard, { backgroundColor: planItem.color }]}>
                    {/* Badge */}
                    {planItem.badge && (
                      <View style={styles.homeBadge}>
                        <Text style={styles.homeBadgeText}>{planItem.badge}</Text>
                      </View>
                    )}

                    {/* Decorative Background Circles */}
                    <View style={styles.decorativeCircle} />
                    <View style={styles.decorativeCircleSmall} />

                    {/* Floating Lottie Coin Animation */}
                    <LottieView
                      source={planItem.lottie}
                      autoPlay
                      loop
                      cacheComposition={true}
                      renderMode="HARDWARE"
                      style={[
                        styles.homeCardLottieCoin,
                        planItem.id !== 3 && { top: 28 },
                        planItem.id === 1 && { top: 16 },
                        planItem.id === 4 && { width: 130, height: 130, top: 18, right: -4 },
                      ]}
                      pointerEvents="none"
                    />

                    {/* Top Content */}
                    <View style={styles.homeCardTop}>
                      {/* Plan Title */}
                      <Text style={styles.homePlanTitle}>{planItem.name}</Text>

                      {/* Amount Row */}
                      <View style={styles.homeAmountRow}>
                        <Text style={styles.homeMainAmount}>{planItem.amount}</Text>
                        <Text style={styles.homeTotalLabel}>(TOTAL VALUE)</Text>
                      </View>

                      {/* Monthly Info */}
                      <Text style={styles.homeMonthlyInfo}>
                        {planItem.monthly} per month for {planItem.duration}
                      </Text>
                    </View>

                    {/* Return Info - Bottom Footer */}
                    <View style={styles.homeReturnSection}>
                      <Text style={styles.homeReturnLabel}>Expected Return</Text>
                      <Text style={styles.homeReturnAmount}>{planItem.return}</Text>
                    </View>
                  </View>

                  {/* --- Detailed Breakdown Glass Container --- */}
                  <View style={styles.singleMainCard}>
                    {/* Quick Stats Grid */}
                    <View style={styles.statsGrid}>
                      <View style={styles.statCard}>
                        <MaterialCommunityIcons name="wallet-outline" size={18} color="#FFD700" style={{ marginBottom: 4 }} />
                        <Text style={styles.statValue}>{planItem.monthly}</Text>
                        <Text style={styles.statLabel}>Monthly</Text>
                      </View>
                      <View style={styles.statCard}>
                        <MaterialCommunityIcons name="calendar-clock" size={18} color="#FFD700" style={{ marginBottom: 4 }} />
                        <Text style={styles.statValue}>{planItem.duration}</Text>
                        <Text style={styles.statLabel}>Duration</Text>
                      </View>
                      <View style={styles.statCard}>
                        <MaterialCommunityIcons name="account-group" size={18} color="#FFD700" style={{ marginBottom: 4 }} />
                        <Text style={styles.statValue}>{planItem.members}</Text>
                        <Text style={styles.statLabel}>Members</Text>
                      </View>
                    </View>

                    {/* Plan Summary Description */}
                    <View style={styles.descContainer}>
                      <MaterialCommunityIcons name="information-outline" size={16} color="#FFD700" style={{ marginTop: 2 }} />
                      <Text style={styles.planDescription}>{planItem.description}</Text>
                    </View>

                    {/* Ideal For */}
                    <View style={styles.sectionBlock}>
                      <View style={styles.cardHeader}>
                        <View style={[styles.cardHeaderIconBg, { backgroundColor: 'rgba(255, 255, 255, 0.18)' }]}>
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
                        <View style={[styles.cardHeaderIconBg, { backgroundColor: 'rgba(255, 255, 255, 0.18)' }]}>
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
                          <View key={i} style={styles.highlightItem}>
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
                        <View style={[styles.cardHeaderIconBg, { backgroundColor: 'rgba(255, 255, 255, 0.18)' }]}>
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
                            Total Pool Value
                          </Text>
                          <Text style={styles.paymentValueBold}>
                            {planItem.amount}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Why This Plan? */}
                    <View style={[styles.sectionBlock, { marginBottom: 0 }]}>
                      <View style={styles.cardHeader}>
                        <View style={[styles.cardHeaderIconBg, { backgroundColor: 'rgba(255, 255, 255, 0.18)' }]}>
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
                            name="check-decagram"
                            size={22}
                            color="#10B981"
                          />
                          <View style={styles.benefitContent}>
                            <Text style={styles.benefitTitle}>Safe & RBI Regulated</Text>
                            <Text style={styles.benefitDescription}>
                              Strictly adheres to Chit Funds Act with 100% legal compliance.
                            </Text>
                          </View>
                        </View>
                        <View style={styles.benefitItem}>
                          <MaterialCommunityIcons
                            name="trending-up"
                            size={22}
                            color="#38BDF8"
                          />
                          <View style={styles.benefitContent}>
                            <Text style={styles.benefitTitle}>High Dividend & Returns</Text>
                            <Text style={styles.benefitDescription}>
                              Maximize return up to {planItem.return} with reduced monthly bidding discounts.
                            </Text>
                          </View>
                        </View>
                        <View style={styles.benefitItem}>
                          <MaterialCommunityIcons
                            name="shield-lock-outline"
                            size={22}
                            color="#A855F7"
                          />
                          <View style={styles.benefitContent}>
                            <Text style={styles.benefitTitle}>Zero Hassle Payouts</Text>
                            <Text style={styles.benefitDescription}>
                              Direct bank deposit upon successful monthly auction verification.
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
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="chevron-left" size={26} color="#FFFFFF" />
          </TouchableOpacity>
        )}
        {currentPlan < plans.length - 1 && (
          <TouchableOpacity
            style={[styles.navArrow, styles.navArrowRight]}
            onPress={() => scrollToPlan(currentPlan + 1)}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="chevron-right" size={26} color="#FFFFFF" />
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
  // Home Page Sliding Card replica in ChitPlans screen
  homeMasterCard: {
    borderRadius: 22,
    padding: 18,
    paddingTop: 16,
    paddingBottom: 16,
    height: 180,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    justifyContent: 'space-between',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  homeBadge: {
    position: 'absolute',
    top: 14,
    right: 14,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    zIndex: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  homeBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    fontFamily: Platform.OS === 'android' ? 'Roboto-Bold' : 'System',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  decorativeCircle: {
    position: 'absolute',
    top: -30,
    left: -30,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  decorativeCircleSmall: {
    position: 'absolute',
    bottom: -20,
    right: -20,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  homeCardLottieCoin: {
    position: 'absolute',
    top: 15,
    right: 4,
    width: 115,
    height: 115,
    zIndex: 5,
  },
  homeCardTop: {
    zIndex: 6,
  },
  homePlanTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'android' ? 'Roboto-Bold' : 'System',
    letterSpacing: 0.2,
  },
  homeAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 2,
  },
  homeMainAmount: {
    fontSize: 27,
    fontWeight: '900',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'android' ? 'Roboto-Bold' : 'System',
    letterSpacing: 0.5,
  },
  homeTotalLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.75)',
    fontWeight: '600',
    fontFamily: Platform.OS === 'android' ? 'Roboto-Medium' : 'System',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginLeft: 8,
  },
  homeMonthlyInfo: {
    fontSize: 12.5,
    color: 'rgba(255, 255, 255, 0.88)',
    marginTop: 6,
    fontFamily: Platform.OS === 'android' ? 'Roboto-Regular' : 'System',
    lineHeight: 17,
  },
  homeReturnSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.3)',
    zIndex: 6,
  },
  homeReturnLabel: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '700',
    fontFamily: Platform.OS === 'android' ? 'Roboto-Medium' : 'System',
  },
  homeReturnAmount: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FEF08A',
    fontFamily: Platform.OS === 'android' ? 'Roboto-Bold' : 'System',
  },
  singleMainCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderRadius: 24,
    padding: 20,
    paddingBottom: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
  },
  descContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 14,
    padding: 12,
    gap: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  planDescription: {
    fontSize: 13.5,
    fontWeight: '500',
    color: '#E2E8F0',
    lineHeight: 20,
    flex: 1,
  },
  heroSection: {
    marginBottom: 24,
  },
  sectionBlock: {
    marginBottom: 22,
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
    gap: 10,
    justifyContent: 'space-between',
    marginBottom: 16,
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