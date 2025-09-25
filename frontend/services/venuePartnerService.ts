/**
 * Venue Owner API Service
 * Handles API calls for venue owner dashboard functionality
 */

import AuthService from './authService';

const API_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export interface Arena {
  id: string;
  name: string;
  sport: string;
  capacity: number;
  description?: string;
  amenities: string[];
  base_price_per_hour: number;
  images: string[];
  slots: VenueSlot[];
  is_active: boolean;
  created_at?: string;
}

export interface Venue {
  id: string;
  name: string;
  owner_id: string;
  owner_name: string;
  sports_supported: string[];
  address: string;
  city: string;
  state: string;
  pincode: string;
  description?: string;
  amenities: string[];
  base_price_per_hour: number;
  contact_phone: string;
  whatsapp_number?: string;
  images: string[];
  rules_and_regulations?: string;
  cancellation_policy?: string;
  rating: number;
  total_bookings: number;
  total_reviews: number;
  is_active: boolean;
  arenas: Arena[]; // Changed from slots to arenas
  created_at: string;
}

export interface VenueSlot {
  _id: string;
  day_of_week: number; // 0=Monday, 6=Sunday
  start_time: string;
  end_time: string;
  capacity: number;
  price_per_hour: number;
  is_peak_hour: boolean;
  is_active: boolean;
  created_at: string;
}

export interface CreateVenueSlot {
  day_of_week: number;
  start_time: string;
  end_time: string;
  capacity: number;
  price_per_hour: number;
  is_peak_hour: boolean;
}

export interface CreateArena {
  name: string;
  sport: string;
  capacity?: number;
  description?: string;
  amenities: string[];
  base_price_per_hour: number;
  images: string[];
  slots: CreateVenueSlot[];
  is_active?: boolean;
}

export interface CreateVenueData {
  name: string;
  sports_supported: string[];
  address: string;
  city: string;
  state: string;
  pincode: string;
  description?: string;
  amenities: string[];
  base_price_per_hour: number;
  contact_phone: string;
  whatsapp_number?: string;
  images: string[];
  rules_and_regulations?: string;
  cancellation_policy?: string;
  arenas: CreateArena[]; // Changed from slots to arenas
}

export interface CreateBookingData {
  venue_id: string;
  arena_id: string; // Added arena_id for arena-specific booking
  player_mobile: string;
  player_name?: string;
  booking_date: string; // YYYY-MM-DD format
  start_time: string;   // HH:MM format
  end_time: string;     // HH:MM format
  sport?: string;
  notes?: string;
}

export interface CreateBookingResponse {
  booking_id: string;
  payment_link: string;
  message: string;
  player_mobile: string;
  total_amount: number;
  sms_status: string;
}

export interface CreateSlotData {
  day_of_week: number;
  start_time: string;
  end_time: string;
  capacity: number;
  price_per_hour: number;
  is_peak_hour: boolean;
}

export interface AnalyticsDashboard {
  total_venues: number;
  total_bookings: number;
  total_revenue: number;
  occupancy_rate: number;
  recent_bookings: any[];
  revenue_trend: Record<string, number>;
  top_sports: Array<{sport: string; count: number}>;
  peak_hours: Array<{hour: string; bookings: number}>;
  // Additional data for analytics screen
  bookingsTrend: Array<{month: string; bookings: number}>;
  sportDistribution: Array<{sport: string; bookings: number; revenue: number; color: string}>;
  venuePerformance: Array<{venueName: string; bookings: number; revenue: number; occupancy: number}>;
  monthlyComparison: Array<{month: string; revenue: number; bookings: number}>;
}

class VenuePartnerService {
  private static instance: VenuePartnerService;
  private authService: AuthService;

  constructor() {
    this.authService = AuthService.getInstance();
  }

  static getInstance(): VenuePartnerService {
    if (!VenuePartnerService.instance) {
      VenuePartnerService.instance = new VenuePartnerService();
    }
    return VenuePartnerService.instance;
  }

  private async makeRequest(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<any> {
    const url = `${API_BASE_URL}/api${endpoint}`;
    const token = this.authService.getToken();

    if (!token) {
      throw new Error('No authentication token found');
    }

    const defaultHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };

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
   * Get venues owned by current venue owner
   */
  async getVenues(skip: number = 0, limit: number = 10, is_active?: boolean): Promise<Venue[]> {
    const params = new URLSearchParams({
      skip: skip.toString(),
      limit: limit.toString(),
    });

    if (is_active !== undefined) {
      params.append('is_active', is_active.toString());
    }

    return await this.makeRequest(`/venue-owner/venues?${params.toString()}`, {
      method: 'GET',
    });
  }

  /**
   * Create a new venue
   */
  async createVenue(venueData: CreateVenueData): Promise<{success: boolean; message: string; venue_id: string}> {
    return await this.makeRequest('/venue-owner/venues', {
      method: 'POST',
      body: JSON.stringify(venueData),
    });
  }

  /**
   * Get specific venue details
   */
  async getVenue(venueId: string): Promise<Venue> {
    return await this.makeRequest(`/venue-owner/venues/${venueId}`, {
      method: 'GET',
    });
  }

  /**
   * Update venue status (activate/deactivate)
   */
  async updateVenueStatus(venueId: string, isActive: boolean): Promise<{message: string}> {
    return await this.makeRequest(`/venue-owner/venues/${venueId}/status?is_active=${isActive}`, {
      method: 'PUT',
    });
  }

  /**
   * Get analytics dashboard data
   */
  async getAnalyticsDashboard(startDate?: string, endDate?: string): Promise<AnalyticsDashboard> {
    const params = new URLSearchParams();
    
    if (startDate) {
      params.append('start_date', startDate);
    }
    
    if (endDate) {
      params.append('end_date', endDate);
    }

    const queryString = params.toString();
    const endpoint = `/venue-owner/analytics/dashboard${queryString ? `?${queryString}` : ''}`;

    return await this.makeRequest(endpoint, {
      method: 'GET',
    });
  }

  /**
   * Get bookings for venue owner
   */
  async getBookings(
    venueId?: string,
    status?: string,
    startDate?: string,
    endDate?: string,
    skip: number = 0,
    limit: number = 10
  ): Promise<any[]> {
    const params = new URLSearchParams({
      skip: skip.toString(),
      limit: limit.toString(),
    });

    if (venueId) params.append('venue_id', venueId);
    if (status) params.append('status', status);
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);

    return await this.makeRequest(`/venue-owner/bookings?${params.toString()}`, {
      method: 'GET',
    });
  }

  /**
   * Get specific booking details
   */
  async getBooking(bookingId: string): Promise<any> {
    return await this.makeRequest(`/venue-owner/bookings/${bookingId}`, {
      method: 'GET',
    });
  }

  /**
   * Update booking status
   */
  async updateBookingStatus(bookingId: string, status: 'confirmed' | 'cancelled' | 'completed'): Promise<{message: string}> {
    return await this.makeRequest(`/venue-owner/bookings/${bookingId}/status?new_status=${status}`, {
      method: 'PUT',
    });
  }

  /**
   * Create booking by venue owner with payment link and SMS
   */
  async createBooking(bookingData: CreateBookingData): Promise<CreateBookingResponse> {
    return await this.makeRequest('/venue-owner/bookings', {
      method: 'POST',
      body: JSON.stringify(bookingData),
    });
  }

  /**
   * Format currency for Indian rupees
   */
  static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  /**
   * Format date for display
   */
  static formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  /**
   * Format time for display
   */
  static formatTime(timeString: string): string {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  }

  /**
   * Get day name from day of week number
   */
  static getDayName(dayOfWeek: number): string {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return days[dayOfWeek] || 'Unknown';
  }

  /**
   * Get short day name from day of week number
   */
  static getShortDayName(dayOfWeek: number): string {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return days[dayOfWeek] || 'N/A';
  }
}

export default VenuePartnerService;