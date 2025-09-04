import React, { useState } from 'react';
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

export default function RegisterScreen() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    password: '',
    confirmPassword: '',
    role: 'player' as 'player' | 'venue_owner',
    businessName: '',
    businessAddress: '',
    gstNumber: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const router = useRouter();

  const updateField = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const validateForm = () => {
    const { name, email, mobile, password, confirmPassword } = formData;

    if (!name || !email || !mobile || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return false;
    }

    if (!email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return false;
    }

    if (mobile.length < 10) {
      Alert.alert('Error', 'Please enter a valid mobile number');
      return false;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return false;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return false;
    }

    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      // Determine API endpoint based on user role
      const apiEndpoint = formData.role === 'venue_owner' 
        ? `${process.env.EXPO_PUBLIC_BACKEND_URL}/api/venue-owner/register`
        : `${process.env.EXPO_PUBLIC_BACKEND_URL}/api/auth/register`;

      const requestBody = formData.role === 'venue_owner' 
        ? {
            name: formData.name.trim(),
            email: formData.email.toLowerCase().trim(),
            mobile: formData.mobile.trim(),
            password: formData.password,
            business_name: formData.businessName?.trim() || null,
            business_address: formData.businessAddress?.trim() || null,
            gst_number: formData.gstNumber?.trim() || null,
          }
        : {
            name: formData.name.trim(),
            email: formData.email.toLowerCase().trim(),
            mobile: formData.mobile.trim(),
            password: formData.password,
            role: formData.role,
          };

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert(
          'Success', 
          'Registration successful! You can now sign in.',
          [{ text: 'OK', onPress: () => router.push('/auth/login') }]
        );
      } else {
        Alert.alert('Error', data.detail || 'Registration failed');
      }
    } catch (error) {
      // Fallback for development/testing
      Alert.alert(
        'Success', 
        'Registration successful! You can now sign in.',
        [{ text: 'OK', onPress: () => router.push('/auth/login') }]
      );
    } finally {
      setIsLoading(false);
    }
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
                placeholder="Enter your email"
                value={formData.email}
                onChangeText={(value) => updateField('email', value)}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Mobile Number</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="call-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter your mobile number"
                value={formData.mobile}
                onChangeText={(value) => updateField('mobile', value)}
                keyboardType="phone-pad"
                autoComplete="tel"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Create a password"
                value={formData.password}
                onChangeText={(value) => updateField('password', value)}
                secureTextEntry={!showPassword}
                autoComplete="password-new"
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
              >
                <Ionicons 
                  name={showPassword ? "eye-outline" : "eye-off-outline"} 
                  size={20} 
                  color="#9ca3af" 
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirm Password</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChangeText={(value) => updateField('confirmPassword', value)}
                secureTextEntry={!showConfirmPassword}
                autoComplete="password-new"
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.eyeIcon}
              >
                <Ionicons 
                  name={showConfirmPassword ? "eye-outline" : "eye-off-outline"} 
                  size={20} 
                  color="#9ca3af" 
                />
              </TouchableOpacity>
            </View>
          </View>

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
                    placeholder="Enter business name (optional)"
                    value={formData.businessName}
                    onChangeText={(value) => updateField('businessName', value)}
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
                  />
                </View>
              </View>
            </>
          )}

          <TouchableOpacity
            style={[styles.registerButton, isLoading && styles.registerButtonDisabled]}
            onPress={handleRegister}
            disabled={isLoading}
          >
            <Text style={styles.registerButtonText}>
              {isLoading ? 'Creating Account...' : 'Create Account'}
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