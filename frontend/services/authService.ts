/**
 * Unified Authentication Service for Mobile OTP
 * Handles API calls for the new unified auth system
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export interface User {
  id: string;
  mobile: string;
  name: string;
  email?: string;
  role: 'player' | 'venue_partner';
  is_verified: boolean;
  created_at: string;
  
  // Player fields
  sports_interests?: string[];
  location?: string;
  
  // Venue Partner fields
  business_name?: string;
  business_address?: string;
  gst_number?: string;
  total_venues?: number;
  total_revenue?: number;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  access_token?: string;
  token_type?: string;
  user?: User;
}

export interface OTPResponse {
  success: boolean;
  message: string;
  request_id?: string;
  dev_info?: string; // For development - shows OTP
}

export interface RegisterData {
  mobile: string;
  otp: string;
  name: string;
  email?: string;
  role: 'player' | 'venue_partner';
  
  // Player fields
  sports_interests?: string[];
  location?: string;
  
  // Venue Partner fields
  business_name?: string;
  business_address?: string;
  gst_number?: string;
}

class AuthService {
  private static instance: AuthService;
  private authToken: string | null = null;
  private currentUser: User | null = null;

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  private async makeRequest(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<any> {
    const url = `${API_BASE_URL}/api${endpoint}`;
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
    };

    // Add auth header if token exists
    if (this.authToken && !options.headers?.['Authorization']) {
      defaultHeaders['Authorization'] = `Bearer ${this.authToken}`;
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || data.message || 'Request failed');
    }

    return data;
  }

  /**
   * Send OTP to mobile number
   */
  async sendOTP(mobile: string): Promise<OTPResponse> {
    try {
      const response = await this.makeRequest('/auth/send-otp', {
        method: 'POST',
        body: JSON.stringify({ mobile }),
      });

      return {
        success: true,
        message: response.message,
        request_id: response.request_id,
        dev_info: response.dev_info, // Development only
      };
    } catch (error) {
      return {
        success: false,
        message: (error as Error).message || 'Failed to send OTP',
      };
    }
  }

  /**
   * Verify OTP (for testing purposes)
   */
  async verifyOTP(mobile: string, otp: string): Promise<OTPResponse> {
    try {
      const response = await this.makeRequest('/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ mobile, otp }),
      });

      return {
        success: true,
        message: response.message,
      };
    } catch (error) {
      return {
        success: false,
        message: (error as Error).message || 'OTP verification failed',
      };
    }
  }

  /**
   * Register new user
   */
  async register(userData: RegisterData): Promise<AuthResponse> {
    try {
      const response = await this.makeRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      });

      if (response.success && response.access_token) {
        // Store auth data
        this.authToken = response.access_token;
        this.currentUser = response.user;
        
        await AsyncStorage.setItem('auth_token', response.access_token);
        await AsyncStorage.setItem('user_data', JSON.stringify(response.user));
      }

      return {
        success: true,
        message: response.message,
        access_token: response.access_token,
        token_type: response.token_type,
        user: response.user,
      };
    } catch (error) {
      return {
        success: false,
        message: (error as Error).message || 'Registration failed',
      };
    }
  }

  /**
   * Enhanced Login: Verify OTP + Get User Status + JWT Token + Routing Info
   */
  async login(mobile: string, otp: string): Promise<AuthResponse & {
    user_exists?: boolean;
    action?: string;
    redirect_to?: string;
    temp_user_id?: string;
    mobile_verified?: boolean;
  }> {
    try {
      const response = await this.makeRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ mobile, otp }),
      });

      console.log(response, " ==> enhanced login response");
      
      if (response.success && response.access_token) {
        // Store auth data
        this.authToken = response.access_token;
        this.currentUser = response.user || null;
        
        await AsyncStorage.setItem('auth_token', response.access_token);
        if (response.user) {
          await AsyncStorage.setItem('user_data', JSON.stringify(response.user));
        }
      }

      return {
        success: true,
        message: response.message,
        access_token: response.access_token,
        token_type: response.token_type,
        user: response.user,
        // New fields from enhanced login API
        user_exists: response.user_exists,
        action: response.action,
        redirect_to: response.redirect_to,
        temp_user_id: response.temp_user_id,
        mobile_verified: response.mobile_verified,
      };
    } catch (error) {
      return {
        success: false,
        message: (error as Error).message || 'Login failed',
      };
    }
  }

  /**
   * Get current user profile
   */
  async getProfile(): Promise<User | null> {
    try {
      const response = await this.makeRequest('/auth/profile', {
        method: 'GET',
      });

      this.currentUser = response;
      await AsyncStorage.setItem('user_data', JSON.stringify(response));
      
      return response;
    } catch (error) {
      console.error('Failed to get profile:', error);
      return null;
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    this.authToken = null;
    this.currentUser = null;
    
    await AsyncStorage.removeItem('auth_token');
    await AsyncStorage.removeItem('user_data');
  }

  /**
   * Initialize auth state from storage
   */
  async initializeAuth(): Promise<boolean> {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      const userData = await AsyncStorage.getItem('user_data');

      if (token && userData) {
        this.authToken = token;
        this.currentUser = JSON.parse(userData);
        
        // Verify token is still valid by getting profile
        const profile = await this.getProfile();
        return !!profile;
      }
      
      return false;
    } catch (error) {
      console.error('Failed to initialize auth:', error);
      return false;
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.authToken && !!this.currentUser;
  }

  /**
   * Get current user
   */
  getCurrentUser(): User | null {
    return this.currentUser;
  }

  /**
   * Get auth token
   */
  getToken(): string | null {
    return this.authToken;
  }

  /**
   * Set auth token (for onboarding flow)
   */
  async setToken(token: string): Promise<void> {
    this.authToken = token;
    await AsyncStorage.setItem('auth_token', token);
  }

  /**
   * Check if current user is venue partner
   */
  isVenuePartner(): boolean {
    return this.currentUser?.role === 'venue_partner';
  }

  /**
   * Check if current user is player
   */
  isPlayer(): boolean {
    return this.currentUser?.role === 'player';
  }

  /**
   * Check if user exists with given mobile number
   */
  async checkUserExists(mobile: string): Promise<{success: boolean; exists: boolean; message?: string}> {
    try {
      const response = await this.makeRequest('/auth/check-user', {
        method: 'POST',
        body: JSON.stringify({ mobile }),
      });

      return {
        success: true,
        exists: response.exists,
      };
    } catch (error) {
      return {
        success: false,
        exists: false,
        message: (error as Error).message || 'Failed to check user',
      };
    }
  }

  /**
   * Validate Indian mobile number
   */
  static validateIndianMobile(mobile: string): boolean {
    const indianMobileRegex = /^\+91[6-9]\d{9}$/;
    return indianMobileRegex.test(mobile);
  }

  /**
   * Format mobile number for Indian format
   */
  static formatIndianMobile(mobile: string): string {
    // Remove all non-digits
    const digits = mobile.replace(/\D/g, '');
    
    // If starts with 91, add +
    if (digits.startsWith('91') && digits.length === 12) {
      return `+${digits}`;
    }
    
    // If 10 digits, add +91
    if (digits.length === 10 && digits[0] >= '6' && digits[0] <= '9') {
      return `+91${digits}`;
    }
    
    return mobile; // Return as-is if can't format
  }
}

export default AuthService;