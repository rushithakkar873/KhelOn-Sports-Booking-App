import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AuthService from '../../services/authService';

export default function RegisterScreen() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    role: 'player' as 'player' | 'venue_owner',
    businessName: '',
    businessAddress: '',
    gstNumber: '',
  });
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [devOtp, setDevOtp] = useState(''); // For development
  
  const router = useRouter();
  const authService = AuthService.getInstance();

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (countdown > 0) {
      interval = setInterval(() => {
        setCountdown(countdown - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [countdown]);

  const updateField = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const validateForm = () => {
    const { name, mobile } = formData;

    if (!name || !mobile) {
      Alert.alert('Error', 'Please fill in all required fields');
      return false;
    }

    const formattedMobile = AuthService.formatIndianMobile(mobile);
    if (!AuthService.validateIndianMobile(formattedMobile)) {
      Alert.alert('Error', 'Please enter a valid Indian mobile number\nFormat: +91XXXXXXXXXX');
      return false;
    }

    return true;
  };

  const handleSendOTP = async () => {
    if (!validateForm()) return;

    const formattedMobile = AuthService.formatIndianMobile(formData.mobile);
    setIsLoading(true);

    try {
      const result = await authService.sendOTP(formattedMobile);
      
      if (result.success) {
        setFormData({ ...formData, mobile: formattedMobile });
        setOtpSent(true);
        setCountdown(60); // 1 minute countdown
        setDevOtp(result.dev_info || ''); // For development
        
        Alert.alert(
          'OTP Sent!', 
          `Verification code sent to ${formattedMobile}${result.dev_info ? `\n\nDev OTP: ${result.dev_info.split(': ')[1]}` : ''}`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to send OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!otp) {
      Alert.alert('Error', 'Please enter the OTP');
      return;
    }

    if (otp.length !== 6) {
      Alert.alert('Error', 'OTP must be 6 digits');
      return;
    }

    setIsLoading(true);

    try {
      const registerData = {
        mobile: formData.mobile,
        otp: otp,
        name: formData.name.trim(),
        email: formData.email.toLowerCase().trim() || undefined,
        role: formData.role,
        
        // Venue Owner fields
        ...(formData.role === 'venue_owner' && {
          business_name: formData.businessName.trim(),
          business_address: formData.businessAddress.trim() || undefined,
          gst_number: formData.gstNumber.trim() || undefined,
        })
      };

      const result = await authService.register(registerData);

      if (result.success) {
        // Navigate based on user role
        const destination = result.user?.role === 'venue_owner' 
          ? '/venue-owner/dashboard'
          : '/main/home';
        
        Alert.alert(
          'Success', 
          'Registration successful! Welcome to Playon.',
          [{ text: 'OK', onPress: () => router.replace(destination) }]
        );
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setCountdown(0);
    setOtpSent(false);
    setOtp('');
    await handleSendOTP();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Logo & Header */}
        <View style={styles.logoContainer}>
          <View style={styles.logo}>
            <Ionicons name="tennisball" size={48} color="#000000" />
          </View>
          <Text style={styles.title}>Join Playon</Text>
          <Text style={styles.subtitle}>Create your account to get started</Text>
        </View>

        {/* Role Selection */}
        <View style={styles.roleSelection}>
          <Text style={styles.roleTitle}>I want to:</Text>
          <View style={styles.roleButtons}>
            <TouchableOpacity
              style={[
                styles.roleButton,
                formData.role === 'player' && styles.roleButtonActive
              ]}
              onPress={() => updateField('role', 'player')}
            >
              <Ionicons 
                name="person-outline" 
                size={20} 
                color={formData.role === 'player' ? '#ffffff' : '#6b7280'} 
              />
              <Text style={[
                styles.roleButtonText,
                formData.role === 'player' && styles.roleButtonTextActive
              ]}>
                Play Sports
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.roleButton,
                formData.role === 'venue_owner' && styles.roleButtonActive
              ]}
              onPress={() => updateField('role', 'venue_owner')}
            >
              <Ionicons 
                name="business-outline" 
                size={20} 
                color={formData.role === 'venue_owner' ? '#ffffff' : '#6b7280'} 
              />
              <Text style={[
                styles.roleButtonText,
                formData.role === 'venue_owner' && styles.roleButtonTextActive
              ]}>
                Manage Venues
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Registration Form */}
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter your full name"
                value={formData.name}
                onChangeText={(value) => updateField('name', value)}
                autoComplete="name"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter your email (optional)"
                value={formData.email}
                onChangeText={(value) => updateField('email', value)}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                editable={!otpSent}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Mobile Number *</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="call-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter mobile number (+91XXXXXXXXXX)"
                value={formData.mobile}
                onChangeText={(value) => updateField('mobile', value)}
                keyboardType="phone-pad"
                autoComplete="tel"
                editable={!otpSent}
              />
            </View>
            <Text style={styles.helperText}>
              Enter your mobile number for OTP verification
            </Text>
          </View>

          {otpSent && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Verification Code *</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="shield-checkmark-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChangeText={setOtp}
                  keyboardType="number-pad"
                  maxLength={6}
                  autoComplete="sms-otp"
                />
              </View>
              <Text style={styles.helperText}>
                OTP sent to {formData.mobile}
                {devOtp ? `\nDev OTP: ${devOtp.split(': ')[1]}` : ''}
              </Text>
              
              <View style={styles.resendContainer}>
                {countdown > 0 ? (
                  <Text style={styles.countdownText}>
                    Resend OTP in {countdown}s
                  </Text>
                ) : (
                  <TouchableOpacity onPress={handleResendOTP}>
                    <Text style={styles.resendText}>Resend OTP</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {/* Business Information - Only show for venue owners */}
          {formData.role === 'venue_owner' && (
            <>
              <View style={styles.sectionDivider}>
                <Text style={styles.sectionTitle}>Business Information</Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Business Name</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="storefront-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter business name (required for venue owners)"
                    value={formData.businessName}
                    onChangeText={(value) => updateField('businessName', value)}
                    editable={!otpSent}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Business Address</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="location-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter business address (optional)"
                    value={formData.businessAddress}
                    onChangeText={(value) => updateField('businessAddress', value)}
                    multiline
                    numberOfLines={2}
                    editable={!otpSent}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>GST Number</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="document-text-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter GST number (optional)"
                    value={formData.gstNumber}
                    onChangeText={(value) => updateField('gstNumber', value)}
                    autoCapitalize="characters"
                    editable={!otpSent}
                  />
                </View>
              </View>
            </>
          )}

          <TouchableOpacity
            style={[styles.registerButton, isLoading && styles.registerButtonDisabled]}
            onPress={otpSent ? handleRegister : handleSendOTP}
            disabled={isLoading}
          >
            <Text style={styles.registerButtonText}>
              {isLoading 
                ? (otpSent ? 'Creating Account...' : 'Sending OTP...') 
                : (otpSent ? 'Verify & Create Account' : 'Send OTP')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Already have an account? 
          </Text>
          <TouchableOpacity onPress={() => router.push('/auth/login')}>
            <Text style={styles.footerLink}> Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  roleSelection: {
    marginBottom: 32,
  },
  roleTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
    textAlign: 'center',
  },
  roleButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  roleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
  },
  roleButtonActive: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  roleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginLeft: 8,
  },
  roleButtonTextActive: {
    color: '#ffffff',
  },
  form: {
    marginBottom: 32,
  },
  sectionDivider: {
    marginVertical: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    backgroundColor: '#f9fafb',
  },
  inputIcon: {
    marginLeft: 16,
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    paddingRight: 16,
    fontSize: 16,
    color: '#000000',
  },
  eyeIcon: {
    padding: 16,
  },
  registerButton: {
    backgroundColor: '#000000',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  registerButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  registerButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#6b7280',
  },
  footerLink: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '600',
  },
});