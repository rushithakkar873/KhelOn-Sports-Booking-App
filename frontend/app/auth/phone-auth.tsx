import React, { useState, useEffect, useRef } from "react";
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AuthService from "../../services/authService";

export default function PhoneAuthScreen() {
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [devOtp, setDevOtp] = useState(""); // For development

  const router = useRouter();
  const authService = AuthService.getInstance();
  
  // Refs for OTP input fields
  const otpRefs = useRef<TextInput[]>([]);

  // Initialize refs
  useEffect(() => {
    otpRefs.current = otpRefs.current.slice(0, 6);
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (countdown > 0) {
      interval = setInterval(() => {
        setCountdown(countdown - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [countdown]);

  // Handle OTP input changes
  const handleOtpChange = (value: string, index: number) => {
    const newOtpDigits = [...otpDigits];
    newOtpDigits[index] = value;
    setOtpDigits(newOtpDigits);
    
    // Update the main OTP state
    const fullOtp = newOtpDigits.join('');
    setOtp(fullOtp);

    // Auto-focus next field
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  // Handle OTP backspace
  const handleOtpKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  // Handle paste functionality
  const handleOtpPaste = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 6).split('');
    const newOtpDigits = [...otpDigits];
    
    digits.forEach((digit, index) => {
      if (index < 6) {
        newOtpDigits[index] = digit;
      }
    });
    
    setOtpDigits(newOtpDigits);
    setOtp(newOtpDigits.join(''));
    
    // Focus the next empty field or last field
    const nextEmptyIndex = newOtpDigits.findIndex(digit => !digit);
    if (nextEmptyIndex !== -1 && nextEmptyIndex < 6) {
      otpRefs.current[nextEmptyIndex]?.focus();
    } else {
      otpRefs.current[5]?.focus();
    }
  };

  const handleSendOTP = async () => {
    const formattedMobile = AuthService.formatIndianMobile(mobile);

    if (!AuthService.validateIndianMobile(formattedMobile)) {
      Alert.alert(
        "Error",
        "Please enter a valid Indian mobile number\nFormat: +91XXXXXXXXXX"
      );
      return;
    }

    setIsLoading(true);

    try {
      const result = await authService.sendOTP(formattedMobile);

      if (result.success) {
        setMobile(formattedMobile);
        setOtpSent(true);
        setCountdown(60); // 1 minute countdown
        setDevOtp(result.dev_info || ""); // For development

        Alert.alert(
          "OTP Sent!",
          `Verification code sent to ${formattedMobile}${
            result.dev_info
              ? `\n\nDev OTP: ${result.dev_info.split(": ")[1]}`
              : ""
          }`,
          [{ text: "OK" }]
        );
      } else {
        Alert.alert("Error", result.message);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to send OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp) {
      Alert.alert("Error", "Please enter the OTP");
      return;
    }

    if (otp.length !== 6) {
      Alert.alert("Error", "OTP must be 6 digits");
      return;
    }

    setIsLoading(true);

    try {
      // Use enhanced login API that handles OTP verification + user status + routing
      const loginResult = await authService.login(mobile, otp);

      if (loginResult.success) {
        if (loginResult.user_exists) {
          // EXISTING USER FLOW
          if (loginResult.user && loginResult.user.role !== "venue_partner") {
            Alert.alert(
              "Error",
              "This app is for venue partners only. Please download KhelON Player app if you are a player."
            );
            return;
          }

          // Route based on onboarding completion
          if (loginResult.action === "dashboard_access") {
            Alert.alert("Success", "Welcome back!", [
              {
                text: "OK",
                onPress: () => router.replace("/venue-partner/dashboard"),
              },
            ]);
          } else if (loginResult.action === "complete_onboarding") {
            Alert.alert(
              "Setup Required",
              "Please complete your venue setup to continue.",
              [
                // { text: 'Continue', onPress: () => router.replace(`/auth/onboarding/${loginResult.redirect_to?.replace('onboarding_', '')}`) }
                {
                  text: "Continue",
                  onPress: () => {
                    const step = loginResult.redirect_to
                      ?.replace("onboarding_", "")
                      .replace("_", "");
                    // @ts-expect-error
                    router.replace(`/auth/onboarding/${step}`);
                  },
                },
              ]
            );
          }
        } else {
          // NEW USER FLOW
          Alert.alert(
            "Welcome to KhelON!",
            "Let's set up your venue profile.",
            [
              {
                text: "Get Started",
                onPress: () => router.replace("/auth/onboarding/step1"),
              },
            ]
          );
        }
      } else {
        Alert.alert("Error", loginResult.message);
      }
    } catch (error) {
      Alert.alert("Error", "Verification failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setCountdown(0);
    setOtpSent(false);
    setOtp("");
    setOtpDigits(["", "", "", "", "", ""]);
    await handleSendOTP();
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />
      <ImageBackground
        source={{
          uri: "https://images.unsplash.com/photo-1517927033932-b3d18e61fb3a",
        }}
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
              <Text style={styles.greeting}>Welcome to KhelON!</Text>
              <Text style={styles.subtitle}>
                Enter your mobile number to continue
              </Text>
            </View>

            {/* Auth Form */}
            <View style={styles.formContainer}>
              <View style={styles.form}>
                {/* Role Information */}
                <View style={styles.roleSelection}>
                  <Text style={styles.roleTitle}>Venue Partner Access</Text>
                  <Text style={styles.roleSubtitle}>
                    Join our platform to manage your sports venue
                  </Text>
                </View>

                {!otpSent ? (
                  <>
                    <View style={styles.inputGroup}>
                      <View style={styles.inputContainer}>
                        <Ionicons
                          name="call-outline"
                          size={20}
                          color="#9ca3af"
                          style={styles.inputIcon}
                        />
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
                      <Text style={styles.helperText}>
                        We'll send you an OTP for verification
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={[
                        styles.primaryButton,
                        isLoading && styles.primaryButtonDisabled,
                      ]}
                      onPress={handleSendOTP}
                      disabled={isLoading}
                    >
                      <Text style={styles.primaryButtonText}>
                        {isLoading ? "Sending OTP..." : "Send OTP"}
                      </Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <View style={styles.otpSection}>
                      <Text style={styles.otpTitle}>Enter Verification Code</Text>
                      <Text style={styles.otpSubtitle}>
                        We sent a 6-digit code to {mobile}
                      </Text>
                      
                      <View style={styles.otpContainer}>
                        {otpDigits.map((digit, index) => (
                          <TextInput
                            key={index}
                            ref={(ref) => {
                              if (ref) otpRefs.current[index] = ref;
                            }}
                            style={[
                              styles.otpInput,
                              digit && styles.otpInputFilled,
                            ]}
                            value={digit}
                            onChangeText={(value) => {
                              const numericValue = value.replace(/[^0-9]/g, '');
                              if (numericValue.length <= 1) {
                                handleOtpChange(numericValue, index);
                              } else if (numericValue.length > 1) {
                                // Handle paste
                                handleOtpPaste(numericValue);
                              }
                            }}
                            onKeyPress={({ nativeEvent }) => {
                              handleOtpKeyPress(nativeEvent.key, index);
                            }}
                            keyboardType="number-pad"
                            maxLength={1}
                            textAlign="center"
                            autoComplete="sms-otp"
                            selectTextOnFocus
                          />
                        ))}
                      </View>
                      
                      {devOtp && (
                        <View style={styles.devInfo}>
                          <Text style={styles.devText}>Dev OTP: {devOtp.split(": ")[1]}</Text>
                        </View>
                      )}
                    </View>

                    <TouchableOpacity
                      style={[
                        styles.primaryButton,
                        isLoading && styles.primaryButtonDisabled,
                      ]}
                      onPress={handleVerifyOTP}
                      disabled={isLoading}
                    >
                      <Text style={styles.primaryButtonText}>
                        {isLoading ? "Verifying..." : "Verify & Continue"}
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
                  By continuing, you agree to our Terms of Service and Privacy
                  Policy
                </Text>
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
    width: "100%",
    height: "100%",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 20,
    marginBottom: 40,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  profileButton: {
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  titleContainer: {
    marginBottom: 40,
  },
  greeting: {
    fontSize: 48,
    fontWeight: "300",
    color: "#ffffff",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: "rgba(255, 255, 255, 0.8)",
  },
  formContainer: {
    flex: 1,
    backgroundColor: "#ffffff",
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
    fontSize: 18,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 8,
    textAlign: "center",
  },
  roleSubtitle: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f6f7",
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
    color: "#212529",
  },
  helperText: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 4,
  },
  resendContainer: {
    alignItems: "center",
    marginTop: 16,
  },
  countdownText: {
    fontSize: 14,
    color: "#9ca3af",
  },
  resendText: {
    fontSize: 14,
    color: "#212529",
    fontWeight: "600",
  },
  primaryButton: {
    backgroundColor: "#212529",
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 20,
  },
  primaryButtonDisabled: {
    backgroundColor: "#9ca3af",
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  footer: {
    alignItems: "center",
    paddingTop: 16,
  },
  footerText: {
    fontSize: 12,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 18,
  },
  otpLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#212529",
    marginBottom: 16,
    textAlign: "center",
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  },
  otpInput: {
    width: 48,
    height: 56,
    borderWidth: 2,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    backgroundColor: "#f9fafb",
    fontSize: 20,
    fontWeight: "600",
    color: "#212529",
  },
  otpInputFilled: {
    borderColor: "#212529",
    backgroundColor: "#ffffff",
  },
});
