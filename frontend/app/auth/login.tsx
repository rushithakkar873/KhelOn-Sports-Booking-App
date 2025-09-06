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
  ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AuthService from '../../services/authService';

export default function LoginScreen() {
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [devOtp, setDevOtp] = useState(''); // For development
  const [userRole, setUserRole] = useState<'player' | 'venue_owner'>('player');
  
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

  const handleSendOTP = async () => {
    const formattedMobile = AuthService.formatIndianMobile(mobile);
    
    if (!AuthService.validateIndianMobile(formattedMobile)) {
      Alert.alert('Error', 'Please enter a valid Indian mobile number\nFormat: +91XXXXXXXXXX');
      return;
    }

    setIsLoading(true);

    try {
      const result = await authService.sendOTP(formattedMobile);
      
      if (result.success) {
        setMobile(formattedMobile);
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

  const handleLogin = async () => {
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
      const result = await authService.login(mobile, otp);
      
      if (result.success && result.user) {
        // Check if user role matches selected role
        if (result.user.role !== userRole) {
          const roleText = result.user.role === 'venue_owner' ? 'venue owner' : 'player';
          const selectedRoleText = userRole === 'venue_owner' ? 'venue owner' : 'player';
          Alert.alert('Error', `This mobile number is registered as a ${roleText}. Please select the correct role or register as a ${selectedRoleText}.`);
          return;
        }
        
        // Navigate based on user role
        const destination = result.user.role === 'venue_owner' 
          ? '/venue-owner/dashboard'
          : '/main/home';
        
        Alert.alert('Success', 'Login successful!', [
          { text: 'OK', onPress: () => router.replace(destination) }
        ]);
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Login failed. Please try again.');
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
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <ImageBackground
        source={{ uri: 'https://images.unsplash.com/photo-1517927033932-b3d18e61fb3a' }}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <View style={styles.overlay} />
        <SafeAreaView style={styles.safeArea}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => router.back()}
              >
                <Ionicons name="chevron-back" size={24} color="#ffffff" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.profileButton}>
                <View style={styles.avatar}>
                  <Ionicons name="person" size={20} color="#ffffff" />
                </View>
              </TouchableOpacity>
            </View>

            {/* Title */}
            <View style={styles.titleContainer}>
              <Text style={styles.greeting}>Welcome Back!</Text>
              <Text style={styles.subtitle}>Sign in to your account</Text>
            </View>

            {/* Login Form */}
            <View style={styles.formContainer}>
              <View style={styles.form}>
                {/* Role Selection */}
                <View style={styles.roleSelection}>
                  <Text style={styles.roleTitle}>I am a:</Text>
                  <View style={styles.roleButtons}>
                    <TouchableOpacity
                      style={[
                        styles.roleButton,
                        userRole === 'player' && styles.roleButtonActive
                      ]}
                      onPress={() => setUserRole('player')}
                    >
                      <Ionicons 
                        name="person-outline" 
                        size={16} 
                        color={userRole === 'player' ? '#ffffff' : '#6b7280'} 
                      />
                      <Text style={[
                        styles.roleButtonText,
                        userRole === 'player' && styles.roleButtonTextActive
                      ]}>
                        Player
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.roleButton,
                        userRole === 'venue_owner' && styles.roleButtonActive
                      ]}
                      onPress={() => setUserRole('venue_owner')}
                    >
                      <Ionicons 
                        name="business-outline" 
                        size={16} 
                        color={userRole === 'venue_owner' ? '#ffffff' : '#6b7280'} 
                      />
                      <Text style={[
                        styles.roleButtonText,
                        userRole === 'venue_owner' && styles.roleButtonTextActive
                      ]}>
                        Venue Owner
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {!otpSent ? (
                  <>
                    <View style={styles.inputGroup}>
                      <View style={styles.inputContainer}>
                        <Ionicons name="call-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
                        <TextInput
                          style={styles.input}
                          placeholder="Enter mobile number (+91XXXXXXXXXX)"
                          placeholderTextColor="#9ca3af"
                          value={mobile}
                          onChangeText={setMobile}
                          keyboardType="phone-pad"
                          autoComplete="tel"
                        />
                      </View>
                      <Text style={styles.helperText}>Enter your registered mobile number</Text>
                    </View>

                    <TouchableOpacity
                      style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
                      onPress={handleSendOTP}
                      disabled={isLoading}
                    >
                      <Text style={styles.loginButtonText}>
                        {isLoading ? 'Sending OTP...' : 'Send OTP'}
                      </Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <View style={styles.inputGroup}>
                      <View style={styles.inputContainer}>
                        <Ionicons name="shield-checkmark-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
                        <TextInput
                          style={styles.input}
                          placeholder="Enter 6-digit OTP"
                          placeholderTextColor="#9ca3af"
                          value={otp}
                          onChangeText={setOtp}
                          keyboardType="number-pad"
                          maxLength={6}
                          autoComplete="sms-otp"
                        />
                      </View>
                      <Text style={styles.helperText}>
                        OTP sent to {mobile}
                        {devOtp ? `\nDev OTP: ${devOtp.split(': ')[1]}` : ''}
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
                      onPress={handleLogin}
                      disabled={isLoading}
                    >
                      <Text style={styles.loginButtonText}>
                        {isLoading ? 'Verifying...' : 'Verify & Sign In'}
                      </Text>
                    </TouchableOpacity>

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
                  </>
                )}
              </View>

              {/* Footer */}
              <View style={styles.footer}>
                <Text style={styles.footerText}>
                  Don't have an account? 
                </Text>
                <TouchableOpacity onPress={() => router.push('/auth/register')}>
                  <Text style={styles.footerLink}> Sign Up</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  safeArea: {
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
    marginBottom: 40,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    marginBottom: 40,
  },
  greeting: {
    fontSize: 48,
    fontWeight: '300',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  formContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 24,
    marginBottom: 24,
  },
  form: {
    flex: 1,
  },
  roleSelection: {
    marginBottom: 24,
  },
  roleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 12,
    textAlign: 'center',
  },
  roleButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  roleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f5f6f7',
    backgroundColor: '#f5f6f7',
  },
  roleButtonActive: {
    backgroundColor: '#212529',
    borderColor: '#212529',
  },
  roleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginLeft: 6,
  },
  roleButtonTextActive: {
    color: '#ffffff',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f6f7',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#212529',
  },
  eyeIcon: {
    padding: 8,
  },
  loginButton: {
    backgroundColor: '#212529',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  forgotPassword: {
    alignItems: 'center',
    marginBottom: 24,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#212529',
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 16,
  },
  footerText: {
    fontSize: 14,
    color: '#6b7280',
  },
  footerLink: {
    fontSize: 14,
    color: '#212529',
    fontWeight: '600',
  },
});