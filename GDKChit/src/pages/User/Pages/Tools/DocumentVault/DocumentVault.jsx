import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
  TextInput,
  Share,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Header from '../../../../../components/HeaderComponent/Header';
import { useLanguage } from '../../../../../utils/LanguageContext';

const DocumentVault = ({ navigation, onBack }) => {
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'agreements' | 'receipts'
  const [userName, setUserName] = useState('Subscriber');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // E-Sign Modal state
  const [showESignModal, setShowESignModal] = useState(false);
  const [eSignName, setESignName] = useState('');
  const [agreedClauses, setAgreedClauses] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [isAgreementSigned, setIsAgreementSigned] = useState(false);
  const [signedTimestamp, setSignedTimestamp] = useState(null);

  useEffect(() => {
    AsyncStorage.getItem('userName').then((name) => {
      if (name) {
        setUserName(name);
        setESignName(name);
      }
    });

    AsyncStorage.getItem('chit_agreement_signed').then((val) => {
      if (val === 'true') {
        setIsAgreementSigned(true);
      }
    });
    AsyncStorage.getItem('chit_agreement_timestamp').then((ts) => {
      if (ts) setSignedTimestamp(ts);
    });
  }, []);

  const documents = [
    {
      id: 'doc-agree-1',
      title: 'Chit Agreement (GDK Platinum 1L)',
      type: 'agreement',
      groupName: 'GDK Platinum 1 Lakh',
      date: isAgreementSigned ? signedTimestamp || '12 Oct 2026' : 'Pending Signature',
      status: isAgreementSigned ? 'signed' : 'pending_signature',
      size: '240 KB',
      hash: 'SHA256:7a8f9c2d1e0b',
    },
    {
      id: 'doc-rcpt-5',
      title: 'Installment Receipt #OCT-2026-05',
      type: 'receipt',
      groupName: 'GDK Platinum 1 Lakh',
      amount: '₹4,150',
      date: '10 Oct 2026',
      status: 'verified',
      size: '112 KB',
    },
    {
      id: 'doc-rcpt-4',
      title: 'Installment Receipt #SEP-2026-04',
      type: 'receipt',
      groupName: 'GDK Platinum 1 Lakh',
      amount: '₹4,200',
      date: '10 Sep 2026',
      status: 'verified',
      size: '110 KB',
    },
    {
      id: 'doc-rcpt-3',
      title: 'Installment Receipt #AUG-2026-03',
      type: 'receipt',
      groupName: 'GDK Platinum 1 Lakh',
      amount: '₹4,300',
      date: '10 Aug 2026',
      status: 'verified',
      size: '114 KB',
    },
    {
      id: 'doc-surety-1',
      title: 'Surety & Guarantor Verification Note',
      type: 'agreement',
      groupName: 'GDK Platinum 1 Lakh',
      date: '14 Oct 2026',
      status: 'verified',
      size: '185 KB',
    },
  ];

  const filteredDocs = documents.filter((doc) => {
    if (activeTab === 'agreements') return doc.type === 'agreement';
    if (activeTab === 'receipts') return doc.type === 'receipt';
    return true;
  });

  const handleExecuteESign = async () => {
    if (!eSignName.trim()) {
      Alert.alert(t('Signature Required'), t('Please enter your full legal name to execute the digital signature.'));
      return;
    }
    if (!agreedClauses) {
      Alert.alert(t('Accept Terms'), t('Please confirm that you have read and accepted the Chit Funds Act clauses.'));
      return;
    }

    setIsSigning(true);
    setTimeout(async () => {
      const nowFormatted = new Date().toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
      await AsyncStorage.setItem('chit_agreement_signed', 'true');
      await AsyncStorage.setItem('chit_agreement_timestamp', nowFormatted);
      setIsAgreementSigned(true);
      setSignedTimestamp(nowFormatted);
      setIsSigning(false);
      setShowESignModal(false);
      Alert.alert(
        t('E-Sign Complete'),
        `${t('Your chit enrollment agreement has been digitally signed and sealed with timestamp:')} ${nowFormatted}`
      );
    }, 1200);
  };

  const handleDownloadDoc = async (doc) => {
    try {
      setIsGeneratingPdf(true);
      const isReceipt = doc.type === 'receipt';
      
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 30px; color: #1E293B; }
            .header { text-align: center; border-bottom: 2px solid #6B46C1; padding-bottom: 15px; margin-bottom: 20px; }
            .logo { font-size: 24px; font-weight: 800; color: #6B46C1; }
            .sub { font-size: 13px; color: #64748B; margin-top: 4px; }
            .title { font-size: 18px; font-weight: bold; margin-bottom: 10px; color: #0F172A; }
            .box { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 16px; margin-bottom: 20px; }
            .row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #F1F5F9; }
            .label { color: #64748B; font-size: 13px; }
            .val { font-weight: bold; color: #0F172A; font-size: 13px; }
            .seal { margin-top: 30px; border-top: 1px dashed #CBD5E1; padding-top: 15px; text-align: center; font-size: 11px; color: #64748B; }
            .badge { display: inline-block; background: #ECFDF5; color: #059669; padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">GDK CHIT FUNDS (P) LTD</div>
            <div class="sub">Regd. Under Chit Funds Act, 1982 | RBI Regulated Chit Institution</div>
          </div>

          <div class="title">${doc.title}</div>
          
          <div class="box">
            <div class="row"><span class="label">Subscriber Name:</span><span class="val">${userName}</span></div>
            <div class="row"><span class="label">Chit Group:</span><span class="val">${doc.groupName}</span></div>
            <div class="row"><span class="label">Document ID:</span><span class="val">${doc.id.toUpperCase()}</span></div>
            <div class="row"><span class="label">Issue Date:</span><span class="val">${doc.date}</span></div>
            ${doc.amount ? `<div class="row"><span class="label">Amount Paid:</span><span class="val" style="color: #059669; font-size: 16px;">${doc.amount}</span></div>` : ''}
            <div class="row"><span class="label">Status:</span><span class="val"><span class="badge">VERIFIED & ACTIVE</span></span></div>
          </div>

          ${isReceipt ? `
            <p style="font-size: 12px; color: #475569;">
              This document serves as official computerized proof of installment payment received towards the registered chit group cycle. Keep this receipt for your records.
            </p>
          ` : `
            <div style="font-size: 12px; color: #475569; line-height: 1.5;">
              <p><strong>1. Subscription Terms:</strong> The subscriber agrees to pay monthly installments on or before the 10th of every calendar month until 20 months maturity.</p>
              <p><strong>2. Auction & Dividend:</strong> Subscriber is entitled to bid in reverse auctions and receive equal dividend deductions credited directly to subsequent installments.</p>
              <p><strong>3. Digital Sign Verification:</strong> Digitally verified with timestamp ${doc.date}.</p>
            </div>
          `}

          <div class="seal">
            🔒 Digitally verified and encrypted cryptographic receipt issued by GDKChit Core Server.
          </div>
        </body>
        </html>
      `;

      const receiptDetails = `📄 GDK CHIT FUNDS (P) LTD\nRegd. Under Chit Funds Act, 1982\n\n${doc.title}\n------------------------------------\nSubscriber: ${userName}\nChit Group: ${doc.groupName}\nDocument ID: ${doc.id?.toUpperCase?.() || doc.id}\nIssue Date: ${doc.date}\n${doc.amount ? `Amount: ${doc.amount}\n` : ''}Status: VERIFIED & ACTIVE\n------------------------------------\n${isReceipt ? 'Official computerized proof of installment payment received.' : 'Terms: Monthly installments due on or before 10th of every month. Digitally verified.'}\n\n🔒 Cryptographic verification seal: Issued by GDKChit Core Server`;

      await Share.share({
        title: `GDKChit - ${doc.title}`,
        message: receiptDetails,
      });
      setIsGeneratingPdf(false);
    } catch (err) {
      setIsGeneratingPdf(false);
      console.error('Error generating PDF:', err);
      Alert.alert(t('Error'), t('Failed to generate document PDF. Please try again.'));
    }
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
      <Header title="E-Sign & Document Vault" onBack={handleBack} />

      {/* Hero E-Sign Banner Card */}
      <View style={[styles.eSignBanner, isAgreementSigned ? styles.eSignBannerSigned : styles.eSignBannerPending]}>
        <View style={styles.eSignTopRow}>
          <MaterialCommunityIcons
            name={isAgreementSigned ? 'certificate' : 'file-sign'}
            size={32}
            color={isAgreementSigned ? '#059669' : '#6B46C1'}
          />
          <View style={{ flex: 1, marginHorizontal: 12 }}>
            <Text style={styles.eSignTitle}>
              {isAgreementSigned ? 'Chit Agreement Signed & Active' : 'Chit Agreement Signature Pending'}
            </Text>
            <Text style={styles.eSignSubtitle}>
              {isAgreementSigned
                ? `Digitally sealed on ${signedTimestamp || 'Oct 2026'}`
                : 'Execute your legal digital agreement under Chit Funds Act, 1982'}
            </Text>
          </View>
        </View>

        {!isAgreementSigned && (
          <TouchableOpacity
            style={styles.eSignActionBtn}
            onPress={() => setShowESignModal(true)}
          >
            <MaterialCommunityIcons name="draw" size={16} color="#FFFFFF" />
            <Text style={styles.eSignActionText}>E-Sign Chit Agreement Now</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'all' && styles.tabBtnActive]}
          onPress={() => setActiveTab('all')}
        >
          <Text style={[styles.tabText, activeTab === 'all' && styles.tabTextActive]}>All Vault</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'agreements' && styles.tabBtnActive]}
          onPress={() => setActiveTab('agreements')}
        >
          <Text style={[styles.tabText, activeTab === 'agreements' && styles.tabTextActive]}>Agreements</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'receipts' && styles.tabBtnActive]}
          onPress={() => setActiveTab('receipts')}
        >
          <Text style={[styles.tabText, activeTab === 'receipts' && styles.tabTextActive]}>Receipts</Text>
        </TouchableOpacity>
      </View>

      {isGeneratingPdf && (
        <View style={styles.pdfLoadingBar}>
          <ActivityIndicator size="small" color="#6B46C1" />
          <Text style={styles.pdfLoadingText}>Generating official PDF document...</Text>
        </View>
      )}

      {/* Document Items List */}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {filteredDocs.map((doc) => {
          const isReceipt = doc.type === 'receipt';
          return (
            <View key={doc.id} style={styles.docCard}>
              <View style={styles.docLeft}>
                <View style={[styles.docIconCircle, isReceipt ? styles.receiptCircle : styles.agreementCircle]}>
                  <MaterialCommunityIcons
                    name={isReceipt ? 'receipt-text' : 'file-certificate'}
                    size={22}
                    color={isReceipt ? '#059669' : '#6B46C1'}
                  />
                </View>

                <View style={styles.docInfo}>
                  <Text style={styles.docTitle}>{doc.title}</Text>
                  <Text style={styles.docMeta}>
                    {doc.date} | {doc.size}
                  </Text>
                  <View style={styles.docStatusRow}>
                    <View style={styles.docStatusBadge}>
                      <MaterialCommunityIcons name="shield-check" size={11} color="#059669" />
                      <Text style={styles.docStatusText}>
                        {doc.status === 'signed' ? 'Digitally Signed' : 'Official Record'}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              <TouchableOpacity
                style={styles.downloadBtn}
                onPress={() => handleDownloadDoc(doc)}
                disabled={isGeneratingPdf}
              >
                <MaterialCommunityIcons name="download" size={18} color="#6B46C1" />
              </TouchableOpacity>
            </View>
          );
        })}
      </ScrollView>

      {/* E-Sign Modal */}
      <Modal
        visible={showESignModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowESignModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Digital Chit Agreement</Text>
                <Text style={styles.modalSub}>Form of Agreement under Section 6 of Chit Funds Act, 1982</Text>
              </View>
              <TouchableOpacity onPress={() => setShowESignModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
              <View style={styles.agreementClauseBox}>
                <Text style={styles.clauseHeader}>Key Legal Clauses & Obligations:</Text>
                <Text style={styles.clauseItem}>
                  1. <Text style={{ fontWeight: '700' }}>Installments:</Text> Subscriber covenants to remit monthly subscription on or before due dates.
                </Text>
                <Text style={styles.clauseItem}>
                  2. <Text style={{ fontWeight: '700' }}>Auction Rights:</Text> Reverse bidding is conducted monthly. Successful bidder receives prize money minus bid discount.
                </Text>
                <Text style={styles.clauseItem}>
                  3. <Text style={{ fontWeight: '700' }}>Dividends:</Text> Net discount after 5% foreman commission is shared equally among all subscribers as installment deduction.
                </Text>
                <Text style={styles.clauseItem}>
                  4. <Text style={{ fontWeight: '700' }}>Prized Payout & Surety:</Text> Winner must furnish 2 verifiable sureties or acceptable bank guarantee before cash disbursement.
                </Text>
              </View>

              <Text style={styles.fieldLabel}>Type Legal Full Name for E-Signature:</Text>
              <TextInput
                style={styles.fieldInput}
                value={eSignName}
                onChangeText={setESignName}
                placeholder="Full Name as per Aadhaar / PAN"
                placeholderTextColor="#94A3B8"
              />

              <TouchableOpacity
                style={styles.promissoryBox}
                onPress={() => setAgreedClauses((p) => !p)}
              >
                <MaterialCommunityIcons
                  name={agreedClauses ? 'checkbox-marked' : 'checkbox-blank-outline'}
                  size={22}
                  color={agreedClauses ? '#6B46C1' : '#64748B'}
                />
                <Text style={styles.promissoryText}>
                  I confirm that I have read the terms of the Chit Agreement and hereby execute this legal agreement with my digital consent.
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.saveSuretyBtn, (!agreedClauses || isSigning) && { opacity: 0.6 }]}
                disabled={!agreedClauses || isSigning}
                onPress={handleExecuteESign}
              >
                {isSigning ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveSuretyText}>Sign & Seal Agreement</Text>
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
  eSignBanner: {
    borderRadius: 14,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 10,
    padding: 16,
    borderWidth: 1.5,
  },
  eSignBannerPending: {
    backgroundColor: '#FAF5FF',
    borderColor: '#D8B4FE',
  },
  eSignBannerSigned: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  eSignTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eSignTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  eSignSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 3,
    lineHeight: 16,
  },
  eSignActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6B46C1',
    borderRadius: 8,
    paddingVertical: 10,
    marginTop: 12,
    gap: 6,
  },
  eSignActionText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    marginHorizontal: 16,
    marginVertical: 10,
    borderRadius: 8,
    padding: 3,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  tabBtnActive: {
    backgroundColor: '#FFFFFF',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#6B46C1',
    fontWeight: '800',
  },
  pdfLoadingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EDE9FE',
    paddingVertical: 8,
    gap: 8,
  },
  pdfLoadingText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#5B21B6',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 40,
  },
  docCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  docLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  docIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  receiptCircle: {
    backgroundColor: '#ECFDF5',
  },
  agreementCircle: {
    backgroundColor: '#F3E8FF',
  },
  docInfo: {
    flex: 1,
  },
  docTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  docMeta: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  docStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  docStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 3,
  },
  docStatusText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
  },
  downloadBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
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
    maxHeight: '92%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  agreementClauseBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  clauseHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 6,
  },
  clauseItem: {
    fontSize: 11,
    color: '#475569',
    lineHeight: 17,
    marginBottom: 6,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  fieldInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '700',
    marginBottom: 14,
  },
  promissoryBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 16,
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

export default DocumentVault;
