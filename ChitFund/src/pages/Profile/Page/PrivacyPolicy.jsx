import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Dimensions,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const { width } = Dimensions.get('window');

const PrivacyPolicy = ({ onBack }) => (
  <SafeAreaView style={styles.safeArea}>
    <StatusBar barStyle="light-content" backgroundColor="#6B46C1" />
    {/* Modern Header with Gradient Effect */}
    <View style={styles.header}>
      <View style={styles.headerContent}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <MaterialCommunityIcons name="arrow-left" size={26} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Privacy Policy</Text>
          <Text style={styles.headerSubtitle}>& Chit Fund Rules</Text>
        </View>
      </View>
    </View>
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Introduction Modal Card */}
      <View style={styles.introCard}>
        <View style={styles.introHeader}>
          <MaterialCommunityIcons name="shield-check" size={32} color="#6B46C1" />
          <Text style={styles.introTitle}>Your Privacy Matters</Text>
        </View>
        <Text style={styles.introText}>
          Welcome to our comprehensive privacy policy and chit fund guidelines. We are committed to protecting your personal information and ensuring transparent operations in all our chit fund activities.
        </Text>
        <View style={styles.introStats}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>12</Text>
            <Text style={styles.statLabel}>Key Rules</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>100%</Text>
            <Text style={styles.statLabel}>Secure</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>24/7</Text>
            <Text style={styles.statLabel}>Support</Text>
          </View>
        </View>
      </View>
      {/* Chit Fund Rules Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons name="gavel" size={28} color="#6B46C1" />
          <View>
            <Text style={styles.sectionTitle}>Chit Fund Rules</Text>
            <Text style={styles.sectionSubtitle}>Essential guidelines for all members</Text>
          </View>
        </View>
        <View style={styles.rulesContainer}>
          {/* 12 rules, each as a card */}
          <View style={styles.ruleCard}>
            <View style={styles.ruleItem}>
              <View style={styles.ruleIconContainer}>
                <MaterialCommunityIcons name="numeric-1-circle" size={24} color="#6B46C1" />
              </View>
              <View style={styles.ruleContent}>
                <Text style={styles.ruleTitle}>New Member Policy</Text>
                <Text style={styles.ruleTitleTamil}>புதிய உறுப்பினர் கொள்கை</Text>
                <Text style={styles.ruleText}>New joining members will receive the chit amount at the end of the chit cycle.</Text>
                <Text style={styles.ruleTextTamil}>புதிதாக சேரும் உறுப்பினர்கள் சிட் சுழற்சியின் இறுதியில் சிட் தொகையைப் பெறுவார்கள்.</Text>
              </View>
            </View>
          </View>
          <View style={styles.ruleCard}>
            <View style={styles.ruleItem}>
              <View style={styles.ruleIconContainer}>
                <MaterialCommunityIcons name="numeric-2-circle" size={24} color="#6B46C1" />
              </View>
              <View style={styles.ruleContent}>
                <Text style={styles.ruleTitle}>Auction Attendance</Text>
                <Text style={styles.ruleTitleTamil}>ஏலம் வருகை</Text>
                <Text style={styles.ruleText}>All members must be present during the chit auction process.</Text>
                <Text style={styles.ruleTextTamil}>சிட் ஏல செயல்முறையின் போது அனைத்து உறுப்பினர்களும் கலந்து கொள்ள வேண்டும்.</Text>
              </View>
            </View>
          </View>
          <View style={styles.ruleCard}>
            <View style={styles.ruleItem}>
              <View style={styles.ruleIconContainer}>
                <MaterialCommunityIcons name="numeric-3-circle" size={24} color="#6B46C1" />
              </View>
              <View style={styles.ruleContent}>
                <Text style={styles.ruleTitle}>Monthly Payments</Text>
                <Text style={styles.ruleTitleTamil}>மாதாந்திர பணம்</Text>
                <Text style={styles.ruleText}>Monthly installment payments must be made on time without delay.</Text>
                <Text style={styles.ruleTextTamil}>மாதாந்திர தவணை பணம் தாமதம் இல்லாமல் சரியான நேரத்தில் செலுத்த வேண்டும்.</Text>
              </View>
            </View>
          </View>
          <View style={styles.ruleCard}>
            <View style={styles.ruleItem}>
              <View style={styles.ruleIconContainer}>
                <MaterialCommunityIcons name="numeric-4-circle" size={24} color="#6B46C1" />
              </View>
              <View style={styles.ruleContent}>
                <Text style={styles.ruleTitle}>Bidding Process</Text>
                <Text style={styles.ruleTitleTamil}>ஏல செயல்முறை</Text>
                <Text style={styles.ruleText}>The person with the lowest bid will receive the chit amount for that month.</Text>
                <Text style={styles.ruleTextTamil}>குறைந்த ஏலம் விடும் நபர் அந்த மாதத்திற்கான சிட் தொகையைப் பெறுவார்.</Text>
              </View>
            </View>
          </View>
          <View style={styles.ruleCard}>
            <View style={styles.ruleItem}>
              <View style={styles.ruleIconContainer}>
                <MaterialCommunityIcons name="numeric-5-circle" size={24} color="#6B46C1" />
              </View>
              <View style={styles.ruleContent}>
                <Text style={styles.ruleTitle}>Guarantor Requirement</Text>
                <Text style={styles.ruleTitleTamil}>உத்தரவாதம் தேவை</Text>
                <Text style={styles.ruleText}>Each member must provide a guarantor who will be responsible for payments if needed.</Text>
                <Text style={styles.ruleTextTamil}>ஒவ்வொரு உறுப்பினரும் தேவைப்படும் போது பணம் செலுத்துவதற்கு பொறுப்பான ஒரு உத்தரவாதம் அளிப்பவரை வழங்க வேண்டும்.</Text>
              </View>
            </View>
          </View>
          <View style={styles.ruleCard}>
            <View style={styles.ruleItem}>
              <View style={styles.ruleIconContainer}>
                <MaterialCommunityIcons name="numeric-6-circle" size={24} color="#6B46C1" />
              </View>
              <View style={styles.ruleContent}>
                <Text style={styles.ruleTitle}>Documentation</Text>
                <Text style={styles.ruleTitleTamil}>ஆவணங்கள்</Text>
                <Text style={styles.ruleText}>All members must submit required documents including ID proof and address proof.</Text>
                <Text style={styles.ruleTextTamil}>அனைத்து உறுப்பினர்களும் அடையாள சான்று மற்றும் முகவரி சான்று உள்ளிட்ட தேவையான ஆவணங்களை சமர்பிக்க வேண்டும்.</Text>
              </View>
            </View>
          </View>
          <View style={styles.ruleCard}>
            <View style={styles.ruleItem}>
              <View style={styles.ruleIconContainer}>
                <MaterialCommunityIcons name="numeric-7-circle" size={24} color="#6B46C1" />
              </View>
              <View style={styles.ruleContent}>
                <Text style={styles.ruleTitle}>Penalty for Defaults</Text>
                <Text style={styles.ruleTitleTamil}>தாமதத்திற்கான அபராதம்</Text>
                <Text style={styles.ruleText}>Late payment penalties will be applied as per the agreed terms and conditions.</Text>
                <Text style={styles.ruleTextTamil}>ஒப்புக்கொள்ளப்பட்ட விதிமுறைகளின்படி தாமதமான பணம் செலுத்துதலுக்கு அபராதம் விதிக்கப்படும்.</Text>
              </View>
            </View>
          </View>
          <View style={styles.ruleCard}>
            <View style={styles.ruleItem}>
              <View style={styles.ruleIconContainer}>
                <MaterialCommunityIcons name="numeric-8-circle" size={24} color="#6B46C1" />
              </View>
              <View style={styles.ruleContent}>
                <Text style={styles.ruleTitle}>Chit Fund Completion</Text>
                <Text style={styles.ruleTitleTamil}>சிட் நிதி நிறைவு</Text>
                <Text style={styles.ruleText}>The chit fund will complete when all members have received their chit amounts.</Text>
                <Text style={styles.ruleTextTamil}>அனைத்து உறுப்பினர்களும் தங்கள் சிட் தொகையைப் பெற்ற பிறகு சிட் நிதி முடிவடையும்.</Text>
              </View>
            </View>
          </View>
          <View style={styles.ruleCard}>
            <View style={styles.ruleItem}>
              <View style={styles.ruleIconContainer}>
                <MaterialCommunityIcons name="numeric-9-circle" size={24} color="#6B46C1" />
              </View>
              <View style={styles.ruleContent}>
                <Text style={styles.ruleTitle}>Member Responsibilities</Text>
                <Text style={styles.ruleTitleTamil}>உறுப்பினர் பொறுப்புகள்</Text>
                <Text style={styles.ruleText}>All members are responsible for maintaining confidentiality and following group rules.</Text>
                <Text style={styles.ruleTextTamil}>அனைத்து உறுப்பினர்களும் ரகசியத்தன்மையை பராமரிப்பதற்கும் குழு விதிகளை பின்பற்றுவதற்கும் பொறுப்பாவார்கள்.</Text>
              </View>
            </View>
          </View>
          <View style={styles.ruleCard}>
            <View style={styles.ruleItem}>
              <View style={styles.ruleIconContainer}>
                <MaterialCommunityIcons name="numeric-1-circle-outline" size={24} color="#6B46C1" />
              </View>
              <View style={styles.ruleContent}>
                <Text style={styles.ruleTitle}>Emergency Situations</Text>
                <Text style={styles.ruleTitleTamil}>அவசர சூழ்நிலைகள்</Text>
                <Text style={styles.ruleText}>In case of emergencies, the group organizer will decide on payment extensions.</Text>
                <Text style={styles.ruleTextTamil}>அவசர சூழ்நிலைகளில், குழு ஏற்பாட்டாளர் பணம் செலுத்தும் நீட்டிப்பு குறித்து முடிவு செய்வார்.</Text>
              </View>
            </View>
          </View>
          <View style={styles.ruleCard}>
            <View style={styles.ruleItem}>
              <View style={styles.ruleIconContainer}>
                <MaterialCommunityIcons name="numeric-1-circle-outline" size={24} color="#6B46C1" />
              </View>
              <View style={styles.ruleContent}>
                <Text style={styles.ruleTitle}>Dispute Resolution</Text>
                <Text style={styles.ruleTitleTamil}>சர்ச்சை தீர்வு</Text>
                <Text style={styles.ruleText}>All disputes will be resolved through discussion and mutual agreement among members.</Text>
                <Text style={styles.ruleTextTamil}>அனைத்து சர்ச்சைகளும் உறுப்பினர்களிடையே விவாதம் மற்றும் பரஸ்பர ஒப்பந்தத்தின் மூலம் தீர்க்கப்படும்.</Text>
              </View>
            </View>
          </View>
          <View style={styles.ruleCard}>
            <View style={styles.ruleItem}>
              <View style={styles.ruleIconContainer}>
                <MaterialCommunityIcons name="numeric-1-circle-outline" size={24} color="#6B46C1" />
              </View>
              <View style={styles.ruleContent}>
                <Text style={styles.ruleTitle}>Legal Compliance</Text>
                <Text style={styles.ruleTitleTamil}>சட்ட இணக்கம்</Text>
                <Text style={styles.ruleText}>All chit fund operations will comply with local regulations and legal requirements.</Text>
                <Text style={styles.ruleTextTamil}>அனைத்து சிட் நிதி செயல்பாடுகளும் உள்ளூர் விதிமுறைகள் மற்றும் சட்ட தேவைகளுக்கு இணங்கும்.</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
      {/* Privacy Policy Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons name="shield-account" size={28} color="#6B46C1" />
          <View>
            <Text style={styles.sectionTitle}>Privacy Policy</Text>
            <Text style={styles.sectionSubtitle}>How we protect your information</Text>
          </View>
        </View>
        <View style={styles.privacyContainer}>
          <View style={styles.privacyCard}>
            <View style={styles.privacyItem}>
              <MaterialCommunityIcons name="database-lock" size={24} color="#10B981" />
              <View style={styles.privacyContent}>
                <Text style={styles.privacyTitle}>Data Collection</Text>
                <Text style={styles.privacyText}>We collect only necessary personal information required for chit fund operations, including contact details, financial information, and identification documents.</Text>
              </View>
            </View>
          </View>
          <View style={styles.privacyCard}>
            <View style={styles.privacyItem}>
              <MaterialCommunityIcons name="shield-check" size={24} color="#10B981" />
              <View style={styles.privacyContent}>
                <Text style={styles.privacyTitle}>Data Security</Text>
                <Text style={styles.privacyText}>Your personal information is protected using industry-standard encryption and security measures. We never share your data with unauthorized parties.</Text>
              </View>
            </View>
          </View>
          <View style={styles.privacyCard}>
            <View style={styles.privacyItem}>
              <MaterialCommunityIcons name="account-check" size={24} color="#10B981" />
              <View style={styles.privacyContent}>
                <Text style={styles.privacyTitle}>Information Usage</Text>
                <Text style={styles.privacyText}>We use your information solely for chit fund management, communication, and ensuring smooth operations of the group activities.</Text>
              </View>
            </View>
          </View>
          <View style={styles.privacyCard}>
            <View style={styles.privacyItem}>
              <MaterialCommunityIcons name="delete-variant" size={24} color="#10B981" />
              <View style={styles.privacyContent}>
                <Text style={styles.privacyTitle}>Data Retention</Text>
                <Text style={styles.privacyText}>Your data will be retained only for the duration of the chit fund cycle and will be securely deleted afterward as per legal requirements.</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
      {/* Contact Support Section */}
      <View style={styles.section}>
        <View style={styles.contactCard}>
          <View style={styles.contactHeader}>
            <MaterialCommunityIcons name="headset" size={32} color="#6B46C1" />
            <Text style={styles.contactTitle}>Need Help?</Text>
          </View>
          <Text style={styles.contactText}>If you have any questions about our privacy policy or chit fund rules, our support team is here to help you 24/7.</Text>
          <TouchableOpacity style={styles.contactButton}>
            <MaterialCommunityIcons name="phone" size={20} color="#6B46C1" />
            <Text style={styles.contactButtonText}>Contact Support</Text>
          </TouchableOpacity>
        </View>
      </View>
      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Last updated: September 14, 2025</Text>
        <Text style={styles.footerSubtext}>By using our services, you agree to these terms and conditions.</Text>
      </View>
    </ScrollView>
  </SafeAreaView>
);

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#6B46C1',
    paddingBottom: 20,
    paddingTop: 15,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    elevation: 8,
    shadowColor: '#6B46C1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'android' ? 'Roboto-Bold' : 'System',
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
    fontFamily: Platform.OS === 'android' ? 'Roboto-Regular' : 'System',
  },
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  introCard: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    borderRadius: 20,
    padding: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  introHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  introTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1F2937',
    marginLeft: 12,
    fontFamily: Platform.OS === 'android' ? 'Roboto-Bold' : 'System',
  },
  introText: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
    marginBottom: 20,
    fontFamily: Platform.OS === 'android' ? 'Roboto-Regular' : 'System',
  },
  introStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 15,
    paddingVertical: 16,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6B46C1',
    fontFamily: Platform.OS === 'android' ? 'Roboto-Bold' : 'System',
  },
  statLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
    fontFamily: Platform.OS === 'android' ? 'Roboto-Regular' : 'System',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#E5E7EB',
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginLeft: 12,
    fontFamily: Platform.OS === 'android' ? 'Roboto-Bold' : 'System',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 12,
    marginTop: 2,
    fontFamily: Platform.OS === 'android' ? 'Roboto-Regular' : 'System',
  },
  rulesContainer: {
    gap: 12,
  },
  ruleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  ruleIconContainer: {
    marginRight: 12,
    marginTop: 2,
  },
  ruleContent: {
    flex: 1,
  },
  ruleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
    fontFamily: Platform.OS === 'android' ? 'Roboto-Medium' : 'System',
  },
  ruleTitleTamil: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B46C1',
    marginBottom: 8,
    fontFamily: Platform.OS === 'android' ? 'Roboto-Medium' : 'System',
  },
  ruleText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 4,
    fontFamily: Platform.OS === 'android' ? 'Roboto-Regular' : 'System',
  },
  ruleTextTamil: {
    fontSize: 13,
    color: '#9CA3AF',
    lineHeight: 18,
    fontStyle: 'italic',
    fontFamily: Platform.OS === 'android' ? 'Roboto-Regular' : 'System',
  },
  privacyContainer: {
    gap: 12,
  },
  privacyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  privacyItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  privacyContent: {
    flex: 1,
    marginLeft: 12,
  },
  privacyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 6,
    fontFamily: Platform.OS === 'android' ? 'Roboto-Medium' : 'System',
  },
  privacyText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    fontFamily: Platform.OS === 'android' ? 'Roboto-Regular' : 'System',
  },
  contactCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  contactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  contactTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginLeft: 12,
    fontFamily: Platform.OS === 'android' ? 'Roboto-Bold' : 'System',
  },
  contactText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
    fontFamily: Platform.OS === 'android' ? 'Roboto-Regular' : 'System',
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#6B46C1',
  },
  contactButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B46C1',
    marginLeft: 8,
    fontFamily: Platform.OS === 'android' ? 'Roboto-Medium' : 'System',
  },
  footer: {
    backgroundColor: '#F9FAFB',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  footerText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 4,
    fontFamily: Platform.OS === 'android' ? 'Roboto-Medium' : 'System',
  },
  footerSubtext: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    fontFamily: Platform.OS === 'android' ? 'Roboto-Regular' : 'System',
  },
});

export default PrivacyPolicy;
