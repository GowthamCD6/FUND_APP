import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';;
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import LottieView from 'lottie-react-native';
import Header from '../../../../../../components/HeaderComponent/Header';
import { useLanguage } from '../../../../../../utils/LanguageContext';

const LanguageSettings = () => {
  const navigation = useNavigation();
  const { language, setLanguage, t } = useLanguage();

  const handleSelectLanguage = (lang) => {
    setLanguage(lang);
  };

  return (
    <View style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <Header
        title="Language Settings"
        onBack={() => navigation.goBack()}
      />

      <View style={styles.container}>
        {/* Animation */}
        <View style={styles.animationContainer}>
          <LottieView
            source={require('../../../../../../animation/language.json')}
            autoPlay
            loop
            speed={0.5}
            style={styles.lottieAnimation}
          />
        </View>

        {/* Subtitle */}
        <Text style={[styles.subtitle, language === 'ta' && { fontSize: 13 }]}>{t('Choose your preferred language')}</Text>

        {/* English Option */}
        <TouchableOpacity
          style={[
            styles.languageCard,
            language === 'en' && styles.languageCardActive,
          ]}
          onPress={() => handleSelectLanguage('en')}
          activeOpacity={0.7}
        >
          <View style={styles.languageCardLeft}>
            <View style={[styles.flagCircle, { backgroundColor: '#EEF2FF' }]}>
              <Text style={styles.flagEmoji}>🇬🇧</Text>
            </View>
            <View style={styles.languageInfo}>
              <Text style={[
                styles.languageName,
                language === 'en' && styles.languageNameActive,
              ]}>
                English
              </Text>
              <Text style={styles.languageNative}>English</Text>
              {language === 'en' && (
                <View style={styles.defaultBadge}>
                  <Text style={styles.defaultBadgeText}>{t('Default')}</Text>
                </View>
              )}
            </View>
          </View>
          {language === 'en' && (
            <View style={styles.checkCircle}>
              <MaterialCommunityIcons name="check" size={18} color="#FFFFFF" />
            </View>
          )}
        </TouchableOpacity>

        {/* Tamil Option */}
        <TouchableOpacity
          style={[
            styles.languageCard,
            language === 'ta' && styles.languageCardActive,
          ]}
          onPress={() => handleSelectLanguage('ta')}
          activeOpacity={0.7}
        >
          <View style={styles.languageCardLeft}>
            <View style={[styles.flagCircle, { backgroundColor: '#FEF3C7' }]}>
              <Text style={styles.flagEmoji}>🇮🇳</Text>
            </View>
            <View style={styles.languageInfo}>
              <Text style={[
                styles.languageName,
                language === 'ta' && styles.languageNameActive,
              ]}>
                தமிழ்
              </Text>
              <Text style={styles.languageNative}>Tamil</Text>
              {language === 'ta' && (
                <View style={[styles.defaultBadge, { backgroundColor: '#FEF3C7' }]}>
                  <Text style={[styles.defaultBadgeText, { color: '#D97706' }]}>{t('Selected')}</Text>
                </View>
              )}
            </View>
          </View>
          {language === 'ta' && (
            <View style={[styles.checkCircle, { backgroundColor: '#D97706' }]}>
              <MaterialCommunityIcons name="check" size={18} color="#FFFFFF" />
            </View>
          )}
        </TouchableOpacity>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <MaterialCommunityIcons name="information-outline" size={20} color="#6B46C1" />
          <Text style={styles.infoText}>
            {language === 'en'
              ? 'Changing the language will update all text throughout the app to the selected language.'
              : 'மொழியை மாற்றுவது, தேர்ந்தெடுக்கப்பட்ட மொழிக்கு பயன்பாடு முழுவதும் அனைத்து உரையையும் புதுப்பிக்கும்.'
            }
          </Text>
        </View>

      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  animationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  lottieAnimation: {
    width: 250,
    height: 250,
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    marginBottom: 24,
    fontFamily: Platform.OS === 'android' ? 'Roboto-Regular' : 'System',
  },
  languageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  languageCardActive: {
    borderColor: '#6B46C1',
    backgroundColor: '#F5F3FF',
  },
  languageCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  flagCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  flagEmoji: {
    fontSize: 24,
  },
  languageInfo: {
    flex: 1,
  },
  languageName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
    fontFamily: Platform.OS === 'android' ? 'Roboto-Bold' : 'System',
  },
  languageNameActive: {
    color: '#6B46C1',
  },
  languageNative: {
    fontSize: 14,
    color: '#9CA3AF',
    fontFamily: Platform.OS === 'android' ? 'Roboto-Regular' : 'System',
  },
  defaultBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  defaultBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B46C1',
    fontFamily: Platform.OS === 'android' ? 'Roboto-Medium' : 'System',
  },
  checkCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#6B46C1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F5F3FF',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 20,
    fontFamily: Platform.OS === 'android' ? 'Roboto-Regular' : 'System',
  },
});

export default LanguageSettings;
