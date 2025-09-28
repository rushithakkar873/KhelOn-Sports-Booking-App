import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  StatusBar,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AuthService from '../../../services/authService';
import { OnboardingValidation } from '../../../utils/validation';

export default function OnboardingStep5Screen() {
  const router = useRouter();
  const authService = AuthService.getInstance();

  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankIfsc, setBankIfsc] = useState('');
  const [bankAccountHolder, setBankAccountHolder] = useState('');
  const [upiId, setUpiId] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Field validation states
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({});
  const [showErrors, setShowErrors] = useState(false);

  // Validation helper functions
  const validateField = (fieldName: string, value: string) => {
    let validation;
    
    switch (fieldName) {
      case 'bankAccountNumber':
        validation = OnboardingValidation.validateBankAccountNumber(value);
        break;
      case 'bankIfsc':
        validation = OnboardingValidation.validateBankIfsc(value);
        break;
      case 'bankAccountHolder':
        validation = OnboardingValidation.validateBankAccountHolder(value);
        break;
      case 'upiId':
        validation = OnboardingValidation.validateUpiId(value);
        break;
      default:
        validation = { isValid: true, errors: [] };
    }

    setFieldErrors(prev => ({
      ...prev,
      [fieldName]: validation.errors[0] || ''
    }));

    return validation.isValid;
  };

  const handleBankAccountChange = (value: string) => {
    setBankAccountNumber(value);
    if (showErrors) {
      validateField('bankAccountNumber', value);
    }
  };

  const handleIfscChange = (value: string) => {
    setBankIfsc(value.toUpperCase());
    if (showErrors) {
      validateField('bankIfsc', value);
    }
  };

  const handleAccountHolderChange = (value: string) => {
    setBankAccountHolder(value);
    if (showErrors) {
      validateField('bankAccountHolder', value);
    }
  };

  const handleUpiIdChange = (value: string) => {
    setUpiId(value.toLowerCase());
    if (showErrors) {
      validateField('upiId', value);
    }
  };

  const handleDefer = () => {
    // Skip payment setup for now and complete onboarding
    completeOnboarding();
  };

  const completeOnboarding = async (withPaymentDetails = false) => {
    if (withPaymentDetails) {
      setShowErrors(true);

      // Comprehensive frontend validation
      const validationData = {
        bankAccountNumber,
        bankIfsc,
        bankAccountHolder,
        upiId,
      };

      const validation = OnboardingValidation.validateStep5(validationData);
      
      if (!validation.isValid) {
        Alert.alert('Validation Error', OnboardingValidation.showValidationErrors(validation.errors));
        
        // Set individual field errors for visual feedback
        validateField('bankAccountNumber', bankAccountNumber);
        validateField('bankIfsc', bankIfsc);
        validateField('bankAccountHolder', bankAccountHolder);
        validateField('upiId', upiId);
        
        return;
      }
    }

    setIsLoading(true);

    try {
      const token = authService.getToken();
      const payload: any = {};

      if (withPaymentDetails) {
        if (bankAccountNumber.trim()) payload.bank_account_number = bankAccountNumber.trim();
        if (bankIfsc.trim()) payload.bank_ifsc = bankIfsc.trim();
        if (bankAccountHolder.trim()) payload.bank_account_holder = bankAccountHolder.trim();
        if (upiId.trim()) payload.upi_id = upiId.trim();
      }

      const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/onboarding/step5`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.success) {
        Alert.alert(
          'Welcome to KhelON!',
          'Your venue is now set up and ready to receive bookings.',
          [
            {
              text: 'Go to Dashboard',
              onPress: () => router.replace('/venue-partner/dashboard'),
            },
          ]
        );
      } else {
        Alert.alert('Error', result.message || 'Failed to complete onboarding');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveAndComplete = async () => {
    completeOnboarding(true);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f6f7" />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="chevron-back" size={24} color="#212529" />
            </TouchableOpacity>
            <View style={styles.progressContainer}>
              <Text style={styles.progressText}>Step 5 of 5</Text>
            </View>
          </View>

          {/* Title */}
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Payment Setup</Text>
            <Text style={styles.subtitle}>Add your payment details to receive bookings</Text>
            <Text style={styles.description}>You can set this up later from your dashboard</Text>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            {/* Progress Bar */}
            <View style={styles.progressBar}>
              <View style={[styles.progressSegment, styles.progressActive]} />
              <View style={[styles.progressSegment, styles.progressActive]} />
              <View style={[styles.progressSegment, styles.progressActive]} />
              <View style={[styles.progressSegment, styles.progressActive]} />
              <View style={[styles.progressSegment, styles.progressActive]} />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Bank Details (Optional)</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Account Holder Name</Text>
                <View style={[
                  styles.inputContainer,
                  fieldErrors.bankAccountHolder && showErrors && styles.inputContainerError
                ]}>
                  <Ionicons name="person-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Full name as per bank records"
                    placeholderTextColor="#9ca3af"
                    value={bankAccountHolder}
                    onChangeText={handleAccountHolderChange}
                    autoCapitalize="words"
                  />
                </View>
                {fieldErrors.bankAccountHolder && showErrors && (
                  <Text style={styles.errorText}>{fieldErrors.bankAccountHolder}</Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Account Number</Text>
                <View style={[
                  styles.inputContainer,
                  fieldErrors.bankAccountNumber && showErrors && styles.inputContainerError
                ]}>
                  <Ionicons name="card-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Bank account number"
                    placeholderTextColor="#9ca3af"
                    value={bankAccountNumber}
                    onChangeText={handleBankAccountChange}
                    keyboardType="numeric"
                    maxLength={18}
                  />
                </View>
                {fieldErrors.bankAccountNumber && showErrors && (
                  <Text style={styles.errorText}>{fieldErrors.bankAccountNumber}</Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>IFSC Code</Text>
                <View style={[
                  styles.inputContainer,
                  fieldErrors.bankIfsc && showErrors && styles.inputContainerError
                ]}>
                  <Ionicons name="business-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Bank IFSC code (e.g., SBIN0001234)"
                    placeholderTextColor="#9ca3af"
                    value={bankIfsc}
                    onChangeText={handleIfscChange}
                    autoCapitalize="characters"
                    maxLength={11}
                  />
                </View>
                {fieldErrors.bankIfsc && showErrors && (
                  <Text style={styles.errorText}>{fieldErrors.bankIfsc}</Text>
                )}
                {!fieldErrors.bankIfsc && bankIfsc.length > 0 && (
                  <Text style={styles.helperText}>
                    Format: 4 letters + 0 + 6 digits (e.g., SBIN0001234)
                  </Text>
                )}
              </View>
            </View>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>UPI ID (Optional)</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>UPI ID</Text>
                <View style={[
                  styles.inputContainer,
                  fieldErrors.upiId && showErrors && styles.inputContainerError
                ]}>
                  <Ionicons name="at-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="your@paytm, your@phonepe, etc."
                    placeholderTextColor="#9ca3af"
                    value={upiId}
                    onChangeText={handleUpiIdChange}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    maxLength={50}
                  />
                </View>
                {fieldErrors.upiId && showErrors && (
                  <Text style={styles.errorText}>{fieldErrors.upiId}</Text>
                )}
                {!fieldErrors.upiId && upiId.length > 0 && (
                  <Text style={styles.helperText}>
                    Format: username@paymentapp (e.g., yourname@paytm)
                  </Text>
                )}
              </View>
            </View>

            <View style={styles.infoBox}>
              <Ionicons name="information-circle-outline" size={20} color="#3b82f6" />
              <Text style={styles.infoText}>
                You can add or update payment details anytime from your dashboard settings.
              </Text>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={styles.deferButton}
                  onPress={handleDefer}
                  disabled={isLoading}
                >
                  <Text style={styles.deferButtonText}>Setup Later</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.primaryButton, isLoading && styles.primaryButtonDisabled]}
                  onPress={handleSaveAndComplete}
                  disabled={isLoading}
                >
                  <Text style={styles.primaryButtonText}>
                    {isLoading ? 'Completing...' : 'Complete Setup'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6f7',
  },
  safeArea: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: '#f5f6f7',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  progressContainer: {
    alignItems: 'center',
  },
  progressText: {
    color: '#212529',
    fontSize: 14,
    fontWeight: '600',
  },
  titleContainer: {
    marginBottom: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#212529',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  formContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  progressBar: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 8,
  },
  progressSegment: {
    flex: 1,
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
  },
  progressActive: {
    backgroundColor: '#212529',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f6f7',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  inputContainerError: {
    borderColor: '#ef4444',
    borderWidth: 2,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#212529',
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 4,
  },
  helperText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  dividerText: {
    paddingHorizontal: 16,
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#eff6ff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#3b82f6',
    lineHeight: 20,
  },
  footer: {
    paddingTop: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  deferButton: {
    flex: 1,
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  deferButtonText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '500',
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#212529',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#212529',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonDisabled: {
    backgroundColor: '#9ca3af',
    shadowOpacity: 0,
    elevation: 0,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});