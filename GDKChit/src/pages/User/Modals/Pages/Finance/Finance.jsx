import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Alert,
  Image,
  ActivityIndicator,
  Animated,
  Dimensions,
  StatusBar,
  StyleSheet,
  Modal,
  Linking,
  BackHandler,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets, SafeAreaProvider } from 'react-native-safe-area-context';
import LottieView from 'lottie-react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { styles } from './FinanceStyle';
import { useLanguage } from '../../../../../utils/LanguageContext';

const Icon = ({ name, size = 24, color = '#000' }) => {
  return <MaterialCommunityIcons name={name} size={size} color={color} />;
};

// Simple inline Header component
const Header = ({ title, onBack }) => (
  <View style={headerStyles.container}>
    <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
    {onBack ? (
      <TouchableOpacity onPress={onBack} style={headerStyles.backButton}>
        <MaterialCommunityIcons name="arrow-left" size={22} color="#1F2937" />
      </TouchableOpacity>
    ) : (
      <View style={headerStyles.backButton} />
    )}
    <Text style={headerStyles.title}>{title}</Text>
    <View style={headerStyles.backButton} />
  </View>
);

const headerStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Bold' : 'System',
  },
});

const { width } = Dimensions.get('window');

const Finance = ({ selectedGroup, onBack }) => {
  const { t, language } = useLanguage();
  const insets = useSafeAreaInsets();
  const [expandedFAQ, setExpandedFAQ] = useState(null);
  const [planModal, setPlanModal] = useState({ visible: false, title: '', message: '', color: '#7C3AED', icon: 'help-circle' });
  const scrollAnim = useRef(new Animated.Value(0)).current;
  const heroScale = useRef(new Animated.Value(1)).current;

  const [applyForm, setApplyForm] = useState({ visible: false, title: '', color: '', icon: '' });
  const [formData, setFormData] = useState({ name: '', phone: '', amount: '' });

  useEffect(() => {
    const onBackPress = () => {
      if (applyForm.visible) {
        setApplyForm({ visible: false, title: '', color: '', icon: '' });
        return true;
      }
      if (planModal.visible) {
        setPlanModal({ visible: false, title: '', message: '', color: '#7C3AED', icon: 'help-circle' });
        return true;
      }
      if (onBack) {
        onBack();
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => backHandler.remove();
  }, [applyForm.visible, planModal.visible, onBack]);

  const toggleFAQ = (index) => {
    setExpandedFAQ(expandedFAQ === index ? null : index);
  };

  const handleApplyLoan = (title, color, icon) => {
    setApplyForm({ visible: true, title, color, icon });
    setFormData({ name: '', phone: '', amount: '' });
  };

  const handleTalkToExpert = () => {
    Alert.alert(t('Expert Support'), t('Connecting you with our finance expert...'));
  };

  const handleScroll = (event) => {
    scrollAnim.setValue(event.nativeEvent.contentOffset.y);
  };



  return (
    <SafeAreaProvider>
    <SafeAreaView style={[styles.container, { backgroundColor: '#4C1D95' }]}>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {/* ===== HERO SECTION WITH GRADIENT ===== */}
        <View style={styles.heroSection}>
          <View style={styles.heroBackground}>
            <View style={styles.heroBgGradient1} />
            <View style={styles.heroBgGradient2} />
          </View>

          <View style={[styles.heroContent, { paddingTop: 24 }]}>
            {onBack && (
              <TouchableOpacity
                onPress={onBack}
                style={{
                  position: 'absolute',
                  top: 16,
                  left: 16,
                  zIndex: 20,
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            )}

            <Text style={[styles.heroTitle, { fontSize: 28, lineHeight: 34, textAlign: 'center' }, language === 'ta' && { fontSize: 24 }]}>{t('Smart Finance')}</Text>

            <Text style={[styles.heroDesc, { fontSize: 13, marginBottom: 16, textAlign: 'center' }]}>{t('Quick loans • No paperwork')}</Text>

            <View style={{ alignItems: 'center', marginTop: -50, marginBottom: -40 }}>
              <LottieView
                source={require('../../../../../animation/Finance.json')}
                autoPlay
                loop
                style={{ width: 280, height: 280 }}
              />
            </View>
          </View>

        </View>

        {/* ===== CURVED CONTENT WRAPPER ===== */}
        <View style={{
          backgroundColor: '#FAFAFA',
          borderTopLeftRadius: 42,
          borderTopRightRadius: 42,
          marginTop: -42,
          paddingTop: 24,
          flex: 1,
        }}>
          {/* ===== COLLECTION FREQUENCY INFO - FEATURED ===== */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Collection Schedule</Text>
              <View style={styles.badgeNew}>
                <Text style={styles.badgeText}>IMPORTANT</Text>
              </View>
            </View>

            <View style={styles.collectionInfoContainer}>
              <CollectionInfoCard
                image={require('../../../../../assets/Finance/shop-finance.png')}
                title="Shopkeeper Accounts"
                desc="Daily collections tailored for continuous business cash flow."
                color="#10B981"
                bgColor="#ECFDF5"
                borderColor="#6EE7B7"
                iconBg="#D1FAE5"
                onPress={() => setPlanModal({
                  visible: true,
                  title: 'Shopkeeper Plan',
                  message: 'For our shopkeeper members, the repayment structure requires a fixed daily contribution over a strictly maintained 100-day schedule. This daily collection model remains constant regardless of your total borrowed amount, ensuring a predictable and stress-free repayment process that aligns with your daily sales.',
                  color: '#10B981',
                  icon: 'briefcase',
                  isCollection: true,
                })}
              />
              <CollectionInfoCard
                image={require('../../../../../assets/Finance/personal-finance.png')}
                title="Personal Accounts"
                desc="Convenient weekly collections scheduled for every weekend."
                color="#3B82F6"
                bgColor="#EFF6FF"
                borderColor="#93C5FD"
                iconBg="#DBEAFE"
                imageSize={85}
                onPress={() => setPlanModal({
                  visible: true,
                  title: 'Personal User Plan',
                  message: 'For personal loan users, the repayment is structured as a fixed weekly payment collected every weekend over a standard 10-week period. This straightforward weekend schedule is applied independently of the principal loan amount, providing a flexible and easily manageable plan for individuals.',
                  color: '#3B82F6',
                  icon: 'account',
                  isCollection: true,
                })}
              />
            </View>
          </View>

          {/* ===== HIGHLIGHTED BENEFITS ===== */}
          <View style={styles.benefitsSection}>
            <Text style={[styles.sectionTitle, { marginLeft: 16, marginBottom: 16 }]}>Why GDK Finance?</Text>
            <View style={styles.benefitsGrid}>
              {[
                { image: require('../../../../../assets/Finance/approval-finance.png'), icon: 'lightning-bolt', title: 'Swift Approvals', desc: 'Funds processed rapidly', color: '#F59E0B' },
                { image: require('../../../../../assets/Finance/secure-finance.png'), icon: 'shield-check', title: 'Secure & Reliable', desc: 'Enterprise-grade safety', color: '#10B981' },
                { image: require('../../../../../assets/Finance/papperwork-finance.jpeg'), icon: 'file-document', title: 'Zero Paperwork', desc: 'Fully Digital', color: '#8B5CF6' },
                { image: require('../../../../../assets/Finance/support-finance.jpeg'), icon: 'headset', title: 'Dedicated Support', desc: 'Round-the-clock assistance', color: '#EC4899' }
              ].map((benefit, index) => {
                const isEvenRow = Math.floor(index / 2) % 2 === 0;
                const isFirstInRow = index % 2 === 0;
                const cardWidth = isEvenRow
                  ? (isFirstInRow ? '52%' : '44%')
                  : (isFirstInRow ? '44%' : '52%');

                return (
                  <BenefitCard
                    key={index}
                    image={benefit.image}
                    icon={benefit.icon}
                    title={benefit.title}
                    desc={benefit.desc}
                    color={benefit.color}
                    width={cardWidth}
                  />
                );
              })}
            </View>
          </View>

          {/* ===== LOAN PRODUCTS - ENHANCED ===== */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Loan Products</Text>
            </View>

            <View style={styles.productsGrid}>
              <LoanProductCard
                image={require('../../../../../assets/Finance/personal-finance.png')}
                icon="cash"
                title="Personal"
                rate="25%"
                color="#8B5CF6"
                onPress={() => handleApplyLoan("Personal", "#8B5CF6", "cash")}
                badge="Popular"
              />
              <LoanProductCard
                image={require('../../../../../assets/Finance/shop-finance.png')}
                icon="briefcase"
                title="Shopkeeper"
                rate="25%"
                color="#10B981"
                onPress={() => handleApplyLoan("Shopkeeper", "#10B981", "briefcase")}
              />
            </View>
          </View>


          {/* ===== QUICK ANSWERS (FAQ) ===== */}
          <View style={[styles.section, { marginBottom: 0 }]}>
            <Text style={styles.sectionTitle}>Common Questions</Text>
            <Text style={styles.faqSubtitle}>Find answers to your queries</Text>

            <FAQItem
              question="How to contact the financier?"
              answer="You can easily reach our financier by tapping the 'Help' button at the bottom of the screen, or by selecting a Collection Schedule card and pressing 'Call Financier'."
              index={0}
              expanded={expandedFAQ === 0}
              onToggle={() => toggleFAQ(0)}
            />
            <FAQItem
              question="How to apply for a loan?"
              answer="Simply tap the 'Apply' button under your preferred Loan Product. Fill out the quick secure form with your name, phone number, and required amount, and our team will contact you!"
              index={1}
              expanded={expandedFAQ === 1}
              onToggle={() => toggleFAQ(1)}
            />
            <FAQItem
              question="How fast is the approval?"
              answer="Our fast-track process approves most loans within 24-48 hours. Some cases may take up to 3 business days."
              index={2}
              expanded={expandedFAQ === 2}
              onToggle={() => toggleFAQ(2)}
            />
            <FAQItem
              question="Any prepayment penalty?"
              answer="Zero prepayment penalty! Repay anytime without any extra charges or penalties."
              index={3}
              expanded={expandedFAQ === 3}
              onToggle={() => toggleFAQ(3)}
            />
          </View>

          {/* ===== FOOTER ===== */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>GDK Finance @all rights reserved 2026</Text>
          </View>

        </View>
      </ScrollView>

      {/* Help / Contact Admin FAB */}
      <TouchableOpacity
        style={styles.helpFab}
        activeOpacity={0.8}
        onPress={() => setPlanModal({
          visible: true,
          title: 'Customer Support',
          message: 'Our dedicated finance experts are here to assist you with loan inquiries and collection schedules.\n\n📞 Phone: +91 98765 43210\n✉️ Email: support@gdkfinance.com\n⏰ Hours: Mon - Sat, 9 AM to 6 PM',
          color: '#7C3AED',
          icon: 'headset',
          isContact: true,
        })}
      >
        <Icon name="phone" size={22} color="#FFFFFF" />
        <Text style={styles.helpFabText}>Help</Text>
      </TouchableOpacity>

      {/* Plan Details Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={planModal.visible}
        onRequestClose={() => setPlanModal({ ...planModal, visible: false })}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={[styles.modalIconContainer, { backgroundColor: `${planModal.color}20` }]}>
              <Icon name={planModal.icon} size={32} color={planModal.color} />
            </View>
            <Text style={styles.modalTitle}>{planModal.title}</Text>
            <Text style={styles.modalMessage}>{planModal.message}</Text>

            {planModal.isContact && (
              <View style={styles.modalActionRow}>
                <TouchableOpacity
                  style={[styles.modalActionButton, { backgroundColor: '#10B981' }]}
                  onPress={() => Linking.openURL('tel:+919876543210')}
                  activeOpacity={0.8}
                >
                  <Icon name="phone" size={18} color="#FFFFFF" />
                  <Text style={styles.modalActionText}>Call</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalActionButton, { backgroundColor: '#3B82F6' }]}
                  onPress={() => Linking.openURL('mailto:support@gdkchitfunds.com')}
                  activeOpacity={0.8}
                >
                  <Icon name="email" size={18} color="#FFFFFF" />
                  <Text style={styles.modalActionText}>Mail</Text>
                </TouchableOpacity>
              </View>
            )}

            {planModal.isCollection ? (
              <View style={styles.modalActionRow}>
                <TouchableOpacity
                  style={[styles.modalActionButton, { backgroundColor: '#E5E7EB' }]}
                  onPress={() => setPlanModal({ ...planModal, visible: false })}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.modalActionText, { color: '#4B5563' }]}>Go Back</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalActionButton, { backgroundColor: '#10B981' }]}
                  onPress={() => Linking.openURL('tel:+919876543210')}
                  activeOpacity={0.8}
                >
                  <Icon name="phone" size={18} color="#FFFFFF" />
                  <Text style={styles.modalActionText}>Call Financier</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.modalCloseButton, { backgroundColor: planModal.isContact ? '#E5E7EB' : planModal.color }]}
                onPress={() => setPlanModal({ ...planModal, visible: false })}
                activeOpacity={0.8}
              >
                <Text style={[styles.modalCloseText, planModal.isContact && { color: '#4B5563' }]}>
                  {planModal.isContact ? 'Close' : 'Got it'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>

      {/* Apply Loan Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={applyForm.visible}
        onRequestClose={() => setApplyForm({ ...applyForm, visible: false })}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { width: width * 0.9, padding: 24 }]}>
            <View style={[styles.modalIconContainer, { backgroundColor: `${applyForm.color}20` }]}>
              <Icon name={applyForm.icon || 'file-document'} size={32} color={applyForm.color} />
            </View>
            <Text style={styles.modalTitle}>Apply for {applyForm.title} Loan</Text>
            <Text style={[styles.modalMessage, { marginBottom: 20 }]}>Please fill in your details below.</Text>

            <View style={styles.formInputGroup}>
              <Text style={styles.formLabel}>Full Name</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Enter your name"
                placeholderTextColor="#9CA3AF"
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text.replace(/[^a-zA-Z\s]/g, '') })}
              />
            </View>

            <View style={styles.formInputGroup}>
              <Text style={styles.formLabel}>Phone Number</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Enter 10-digit number"
                placeholderTextColor="#9CA3AF"
                keyboardType="phone-pad"
                maxLength={10}
                value={formData.phone}
                onChangeText={(text) => setFormData({ ...formData, phone: text.replace(/[^0-9]/g, '') })}
              />
            </View>

            <View style={styles.formInputGroup}>
              <Text style={styles.formLabel}>Amount Required (₹)</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g. 50000"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
                value={formData.amount}
                onChangeText={(text) => setFormData({ ...formData, amount: text.replace(/[^0-9]/g, '') })}
              />
            </View>

            <TouchableOpacity
              style={[styles.formSubmitButton, { backgroundColor: applyForm.color }]}
              onPress={() => {
                if (!formData.name || !formData.phone || !formData.amount) {
                  Alert.alert('Required Fields', 'Please fill in all details.');
                  return;
                }
                if (formData.phone.length !== 10) {
                  Alert.alert('Invalid Phone Number', 'Please enter a valid 10-digit phone number.');
                  return;
                }
                Alert.alert('Application Submitted!', 'Our team will contact you shortly.');
                setApplyForm({ ...applyForm, visible: false });
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.formSubmitText}>Submit Application</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{ marginTop: 16, padding: 8 }}
              onPress={() => setApplyForm({ ...applyForm, visible: false })}
            >
              <Text style={{ color: '#6B7280', fontSize: 14, fontWeight: '600' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
    </SafeAreaProvider>
  );
};

// ===== SUB COMPONENTS =====

const StatItem = ({ value, label }) => (
  <View style={styles.statItem}>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const BenefitCard = ({ image, icon, title, desc, color, width }) => (
  <View style={[styles.benefitCard, { width: width || '48%', backgroundColor: `${color}10`, overflow: 'hidden' }]}>
    <View style={{ position: 'absolute', right: -15, bottom: -15, opacity: 0.1, transform: [{ rotate: '-15deg' }] }}>
      <Icon name={icon} size={85} color={color} />
    </View>
    <View style={styles.benefitIcon}>
      <Image source={image} style={{ width: 70, height: 70 }} resizeMode="contain" />
    </View>
    <Text style={styles.benefitTitle}>{title}</Text>
    <Text style={styles.benefitDesc}>{desc}</Text>
  </View>
);

const LoanProductCard = ({ image, icon, title, rate, label, color, onPress, badge }) => (
  <TouchableOpacity
    style={[styles.loanCard, { backgroundColor: `${color}10`, overflow: 'hidden' }]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={{ position: 'absolute', right: -15, bottom: 10, opacity: 0.1, transform: [{ rotate: '-15deg' }] }}>
      <Icon name={icon} size={85} color={color} />
    </View>
    {badge && (
      <View style={[styles.loanBadge, { backgroundColor: color }]}>
        <Text style={styles.loanBadgeText}>{badge}</Text>
      </View>
    )}
    <View style={styles.loanIcon}>
      <Image source={image} style={{ width: 70, height: 70 }} resizeMode="contain" />
    </View>
    <Text style={styles.loanTitle}>{title}</Text>
    <View style={styles.rateContainer}>
      <Text style={[styles.rateValue, { color }]}>{rate}</Text>
      {label ? <Text style={styles.rateLabel}>{label}</Text> : null}
    </View>
    <TouchableOpacity
      style={[styles.loanApplyBtn, { backgroundColor: color }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={styles.loanApplyText}>Apply</Text>
      <Icon name="arrow-right" size={12} color="#FFFFFF" />
    </TouchableOpacity>
  </TouchableOpacity>
);

const CollectionInfoCard = ({ image, title, desc, color, bgColor, borderColor, iconBg, onPress, imageSize = 65 }) => (
  <TouchableOpacity
    style={[styles.collectionCard, { backgroundColor: bgColor, borderColor }]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={[styles.collectionIconContainer, { backgroundColor: 'transparent' }]}>
      <Image source={image} style={{ width: imageSize, height: imageSize }} resizeMode="contain" />
    </View>
    <View style={styles.collectionContent}>
      <Text style={styles.collectionTitle}>{title}</Text>
      <Text style={styles.collectionDesc}>{desc}</Text>
    </View>
    <Icon name="chevron-right" size={20} color={color} />
  </TouchableOpacity>
);

const FAQItem = ({ question, answer, index, expanded, onToggle }) => (
  <TouchableOpacity
    style={[styles.faqItem, expanded && styles.faqItemExpanded]}
    onPress={onToggle}
    activeOpacity={0.6}
  >
    <View style={styles.faqHeader}>
      <View style={styles.faqIconContainer}>
        <Icon name="help-circle" size={18} color="#7C3AED" />
      </View>
      <Text style={styles.faqQuestion}>{question}</Text>
      <Icon
        name={expanded ? "chevron-up" : "chevron-down"}
        size={22}
        color="#7C3AED"
      />
    </View>
    {expanded && (
      <Text style={styles.faqAnswer}>{answer}</Text>
    )}
  </TouchableOpacity>
);

// Placeholder for Linear Gradient (since LinearGradient might not be installed)
const LinearGradientView = ({ colors, children }) => (
  <View style={{ backgroundColor: colors[1] }}>
    {children}
  </View>
);

export default Finance;