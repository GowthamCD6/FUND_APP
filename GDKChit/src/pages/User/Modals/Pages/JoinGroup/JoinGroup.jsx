import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, TextInput, Alert, ActivityIndicator, Modal } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LottieView from 'lottie-react-native';
import Header from '../../../../../components/HeaderComponent/Header';
import { useLanguage } from '../../../../../utils/LanguageContext';
import ApiService from '../../../../../services/ApiService';

const Join = ({ onBack, initialGroupCode = '' }) => {
  const [groupCode, setGroupCode] = useState(initialGroupCode);
  const [loading, setLoading] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [resultData, setResultData] = useState(null);
  const [resultType, setResultType] = useState(''); // 'success' | 'error'
  const { t, language } = useLanguage();

  useEffect(() => {
    if (initialGroupCode) {
      setGroupCode(initialGroupCode);
    }
  }, [initialGroupCode]);

  const handleJoinGroup = async () => {
    if (!groupCode.trim()) {
      Alert.alert('Error', 'Please enter a group code');
      return;
    }

    setLoading(true);
    try {
      const response = await ApiService.makeRequest('/user/groups/join', {
        method: 'POST',
        body: JSON.stringify({ groupCode: groupCode.trim() }),
      });

      const result = await response.json();

      if (result.success) {
        setResultType('success');
        setResultData({
          title: 'Joined Successfully! 🎉',
          message: result.message,
          groupName: result.data?.groupName,
          groupAmount: result.data?.groupAmount,
          totalMembers: result.data?.totalMembers,
          currentMembers: result.data?.currentMembers,
          duration: result.data?.duration,
        });
      } else {
        setResultType('error');
        const errorTitle =
          result.errorType === 'GROUP_FULL' ? 'Group Full 😔' :
          result.errorType === 'ALREADY_MEMBER' ? 'Already a Member ℹ️' :
          result.errorType === 'GROUP_COMPLETED' ? 'Group Completed' :
          result.errorType === 'INVALID_CODE' ? 'Invalid Code ❌' :
          'Error';
        setResultData({
          title: errorTitle,
          message: result.message,
          errorType: result.errorType,
        });
      }
      setShowResultModal(true);
    } catch (error) {
      console.error('Error joining group:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResultDismiss = () => {
    setShowResultModal(false);
    if (resultType === 'success') {
      setGroupCode('');
      onBack();
    }
  };

  const renderResultModal = () => (
    <Modal
      visible={showResultModal}
      transparent={true}
      animationType="fade"
      onRequestClose={handleResultDismiss}
    >
      <View style={modalStyles.overlay}>
        <View style={modalStyles.container}>
          {/* Icon */}
          <View style={[
            modalStyles.iconCircle,
            { backgroundColor: resultType === 'success' ? '#ECFDF5' : '#FEF2F2' }
          ]}>
            <MaterialCommunityIcons
              name={resultType === 'success' ? 'check-circle' : 'alert-circle'}
              size={48}
              color={resultType === 'success' ? '#10B981' : '#EF4444'}
            />
          </View>

          {/* Title */}
          <Text style={modalStyles.title}>{resultData?.title}</Text>

          {/* Message */}
          <Text style={modalStyles.message}>{resultData?.message}</Text>

          {/* Group Details (only for success) */}
          {resultType === 'success' && resultData?.groupName && (
            <View style={modalStyles.detailsCard}>
              <DetailRow label="Group" value={resultData.groupName} />
              {resultData.groupAmount && (
                <DetailRow label="Amount" value={`₹${Number(resultData.groupAmount).toLocaleString('en-IN')}`} />
              )}
              {resultData.totalMembers && (
                <DetailRow label="Members" value={`${resultData.currentMembers}/${resultData.totalMembers}`} />
              )}
              {resultData.duration && (
                <DetailRow label="Duration" value={`${resultData.duration} months`} />
              )}
            </View>
          )}

          {/* Error hints */}
          {resultType === 'error' && resultData?.errorType === 'GROUP_FULL' && (
            <View style={modalStyles.hintContainer}>
              <MaterialCommunityIcons name="information-outline" size={16} color="#6B7280" />
              <Text style={modalStyles.hintText}>Contact the group admin for available slots.</Text>
            </View>
          )}

          {/* Dismiss Button */}
          <TouchableOpacity
            style={[
              modalStyles.dismissButton,
              { backgroundColor: resultType === 'success' ? '#6B46C1' : '#EF4444' }
            ]}
            onPress={handleResultDismiss}
          >
            <Text style={modalStyles.dismissButtonText}>
              {resultType === 'success' ? 'Done' : 'Try Again'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <Header 
        title="Join Group"
        onBack={onBack}
      />
      
      {/* Join Group Content */}
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <LottieView
            source={require('../../../../../animation/join a group.json')}
            autoPlay
            loop
            style={styles.lottieAnimation}
          />
        </View>
        
        <Text style={[styles.title, language === 'ta' && { fontSize: 18 }]}>{t('Join a Group')}</Text>
        <Text style={[styles.description, language === 'ta' && { fontSize: 13 }]}>
          {t('Enter the group code provided by your group administrator to join the fund group.')}
        </Text>
        
        <View style={styles.inputContainer}>
          <Text style={[styles.inputLabel, language === 'ta' && { fontSize: 13 }]}>{t('Group Code')}</Text>
          <TextInput
            style={styles.input}
            placeholder={t('Enter group code')}
            placeholderTextColor="#9CA3AF"
            value={groupCode}
            onChangeText={setGroupCode}
            autoCapitalize="characters"
            maxLength={12}
            editable={!loading}
          />
        </View>
        
        <TouchableOpacity 
          style={[styles.joinButton, (!groupCode.trim() || loading) && styles.joinButtonDisabled]} 
          onPress={handleJoinGroup}
          disabled={!groupCode.trim() || loading}
        >
          {loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color="#FFFFFF" />
              <Text style={[styles.joinButtonText, { marginLeft: 8 }, language === 'ta' && { fontSize: 13 }]}>
                {t('Joining...')}
              </Text>
            </View>
          ) : (
            <Text style={[styles.joinButtonText, language === 'ta' && { fontSize: 13 }]}>{t('Join Group')}</Text>
          )}
        </TouchableOpacity>
        
        <Text style={[styles.helpText, language === 'ta' && { fontSize: 11 }]}>
          {t("Don't have a group code? Contact your group administrator")}
        </Text>
      </View>

      {renderResultModal()}
    </View>
  );
};

const DetailRow = ({ label, value }) => (
  <View style={modalStyles.detailRow}>
    <Text style={modalStyles.detailLabel}>{label}</Text>
    <Text style={modalStyles.detailValue}>{value}</Text>
  </View>
);

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 32,
    paddingHorizontal: 24,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Bold' : 'Poppins-Bold',
  },
  message: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Regular' : 'Poppins-Regular',
  },
  detailsCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  detailLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Regular' : 'Poppins-Regular',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Bold' : 'Poppins-Bold',
  },
  hintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 20,
    width: '100%',
  },
  hintText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 8,
    flex: 1,
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Regular' : 'Poppins-Regular',
  },
  dismissButton: {
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  dismissButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Bold' : 'Poppins-Bold',
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 23,
    paddingBottom: 24,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
    height: 120,
    justifyContent: 'center',
  },
  lottieAnimation: {
    width: 310,
    height: 310,
    marginTop: 120,
  },
  title: {
    fontSize: 24,
    color: '#1F2937',
    textAlign: 'center',
    fontWeight: '700',
    marginBottom: 12,
    marginTop: 70,
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Bold' : 'Poppins-Bold',
  },
  description: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Regular' : 'Poppins-Regular',
  },
  inputContainer: {
    marginBottom: 32,
  },
  inputLabel: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '600',
    marginBottom: 8,
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Bold' : 'Poppins-Bold',
  },
  input: {
    height: 52,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#F9FAFB',
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Regular' : 'Poppins-Regular',
  },
  joinButton: {
    backgroundColor: '#6B46C1',
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#6B46C1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  joinButtonDisabled: {
    backgroundColor: '#D1D5DB',
    shadowOpacity: 0,
    elevation: 0,
  },
  joinButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Bold' : 'Poppins-Bold',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  helpText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Regular' : 'Poppins-Regular',
  },
});

export default Join;