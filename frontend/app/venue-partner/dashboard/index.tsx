import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  Alert,
  StatusBar,
  ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LineChart, BarChart } from 'react-native-chart-kit';
import VenuePartnerService from '../../../services/venuePartnerService';
import AuthService from '../../../services/authService';
import AnimatedLoader from '../../../components/AnimatedLoader';

const { width } = Dimensions.get('window');
const chartWidth = width - 80; // Reduced width for mobile

interface DashboardData {
  totalVenues: number;
  totalBookings: number;
  totalRevenue: number;
  occupancyRate: number;
  recentBookings: any[];
  revenueTrend: { [key: string]: number };
  topSports: { sport: string; count: number }[];
  peakHours: { hour: string; count: number }[];
}

export default function VenueOwnerDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    totalVenues: 0,
    totalBookings: 0,
    totalRevenue: 0,
    occupancyRate: 0,
    recentBookings: [],
    revenueTrend: {},
    topSports: [],
    peakHours: [],
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const router = useRouter();
  const venuePartnerService = VenuePartnerService.getInstance();
  const authService = AuthService.getInstance();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Check if user is authenticated and is venue owner
      if (!authService.isAuthenticated() || !authService.isVenueOwner()) {
        Alert.alert('Authentication Error', 'Please log in as a venue owner', [
          { text: 'OK', onPress: () => router.replace('/auth/login') }
        ]);
        return;
      }

      // Fetch analytics data from API
      const analytics = await venueOwnerService.getAnalyticsDashboard();
      
      // Fetch recent bookings
      const recentBookings = await venueOwnerService.getBookings(undefined, undefined, undefined, undefined, 0, 5);
      
      // Transform API data to dashboard format
      const transformedData: DashboardData = {
        totalVenues: analytics.total_venues,
        totalBookings: analytics.total_bookings,
        totalRevenue: analytics.total_revenue,
        occupancyRate: analytics.occupancy_rate,
        recentBookings: recentBookings.map(booking => ({
          id: booking.id,
          venueName: booking.venue_name || 'Unknown Venue',
          playerName: booking.user_name || 'Unknown Player',
          bookingDate: booking.booking_date,
          startTime: booking.start_time,
          totalAmount: booking.total_amount,
          status: booking.status
        })),
        revenueTrend: analytics.revenue_trend || {},
        topSports: analytics.top_sports || [],
        peakHours: analytics.peak_hours || [],
      };

      setDashboardData(transformedData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      
      // Show error message
      Alert.alert(
        'Error', 
        'Failed to load dashboard data. Please check your connection and try again.',
        [
          { text: 'Retry', onPress: () => loadDashboardData() },
          { text: 'Cancel' }
        ]
      );
      
      // Fall back to empty data instead of mock data
      setDashboardData({
        totalVenues: 0,
        totalBookings: 0,
        totalRevenue: 0,
        occupancyRate: 0,
        recentBookings: [],
        revenueTrend: {},
        topSports: [],
        peakHours: [],
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadDashboardData();
    setIsRefreshing(false);
  };

  const formatCurrency = (amount: number) => {
    return VenueOwnerService.formatCurrency(amount);
  };

  const getRevenueChartData = () => {
    const dates = Object.keys(dashboardData.revenueTrend).slice(-7);
    const revenues = dates.map(date => dashboardData.revenueTrend[date]);
    
    return {
      labels: dates.map(date => {
        const d = new Date(date);
        return `${d.getDate()}/${d.getMonth() + 1}`;
      }),
      datasets: [{
        data: revenues,
        strokeWidth: 2,
      }]
    };
  };

  const getSportsChartData = () => {
    return {
      labels: dashboardData.topSports.map(item => item.sport),
      datasets: [{
        data: dashboardData.topSports.map(item => item.count)
      }]
    };
  };

  const chartConfig = {
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    color: (opacity = 1) => `rgba(33, 37, 41, ${opacity})`,
    strokeWidth: 3,
    barPercentage: 0.6,
    useShadowColorFromDataset: false,
    decimalPlaces: 0,
    propsForLabels: {
      fontSize: 10,
    },
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#f5f6f7" />
        <SafeAreaView style={styles.safeArea}>
          <AnimatedLoader 
            message="Loading dashboard..." 
            size="medium"
            color="#212529"
          />
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f6f7" />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Text style={styles.welcomeText}>Welcome back!</Text>
              <Text style={styles.headerTitle}>Dashboard</Text>
            </View>
            <TouchableOpacity style={styles.notificationButton}>
              <Ionicons name="notifications-outline" size={20} color="#212529" />
            </TouchableOpacity>
          </View>

          {/* Hero Stats Card */}
          <View style={styles.section}>
            <ImageBackground
              source={{ uri: 'https://images.unsplash.com/photo-1705593136686-d5f32b611aa9' }}
              style={styles.heroCard}
              imageStyle={styles.heroImageStyle}
            >
              <View style={styles.heroOverlay} />
              <View style={styles.heroContent}>
                <Text style={styles.heroTitle}>Business Overview</Text>
                <View style={styles.heroStats}>
                  <View style={styles.heroStat}>
                    <Text style={styles.heroStatValue}>{dashboardData.totalVenues}</Text>
                    <Text style={styles.heroStatLabel}>Active Venues</Text>
                  </View>
                  <View style={styles.heroStat}>
                    <Text style={styles.heroStatValue}>{dashboardData.totalBookings}</Text>
                    <Text style={styles.heroStatLabel}>This Month</Text>
                  </View>
                  <View style={styles.heroStat}>
                    <Text style={styles.heroStatValue}>{formatCurrency(dashboardData.totalRevenue)}</Text>
                    <Text style={styles.heroStatLabel}>Revenue</Text>
                  </View>
                </View>
              </View>
            </ImageBackground>
          </View>

          {/* KPI Cards */}
          <View style={styles.section}>
            <View style={styles.kpiContainer}>
              <View style={styles.kpiCard}>
                <View style={styles.kpiIcon}>
                  <Ionicons name="trending-up" size={20} color="#10b981" />
                </View>
                <Text style={styles.kpiValue}>{dashboardData.occupancyRate}%</Text>
                <Text style={styles.kpiLabel}>Occupancy Rate</Text>
                <Text style={styles.kpiChange}>+5.2%</Text>
              </View>
              
              <View style={styles.kpiCard}>
                <View style={styles.kpiIcon}>
                  <Ionicons name="calendar" size={20} color="#3b82f6" />
                </View>
                <Text style={styles.kpiValue}>{dashboardData.recentBookings.length}</Text>
                <Text style={styles.kpiLabel}>Recent Bookings</Text>
                <Text style={styles.kpiChange}>Last 24h</Text>
              </View>
            </View>
          </View>

          {/* Revenue Trend Chart */}
          <View style={styles.section}>
            <View style={styles.chartCard}>
              <View style={styles.chartHeader}>
                <Text style={styles.chartTitle}>Revenue Trend</Text>
                <Text style={styles.chartSubtitle}>Last 7 days</Text>
              </View>
              {Object.keys(dashboardData.revenueTrend).length > 0 && (
                <View style={styles.chartContainer}>
                  <LineChart
                    data={getRevenueChartData()}
                    width={chartWidth}
                    height={180}
                    chartConfig={chartConfig}
                    bezier
                    style={styles.chart}
                    decorator={() => null}
                  />
                </View>
              )}
            </View>
          </View>

          {/* Sports Performance */}
          {dashboardData.topSports.length > 0 && (
            <View style={styles.section}>
              <View style={styles.chartCard}>
                <View style={styles.chartHeader}>
                  <Text style={styles.chartTitle}>Popular Sports</Text>
                  <Text style={styles.chartSubtitle}>Booking distribution</Text>
                </View>
                <View style={styles.chartContainer}>
                  <BarChart
                    data={getSportsChartData()}
                    width={chartWidth}
                    height={160}
                    yAxisLabel=""
                    yAxisSuffix=""
                    chartConfig={chartConfig}
                    style={styles.chart}
                  />
                </View>
              </View>
            </View>
          )}

          {/* Recent Bookings */}
          <View style={styles.section}>
            <View style={styles.bookingsCard}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recent Bookings</Text>
                <TouchableOpacity onPress={() => router.push('/venue-owner/dashboard/bookings')}>
                  <Text style={styles.sectionLink}>View All</Text>
                </TouchableOpacity>
              </View>
              
              {dashboardData.recentBookings.map((booking, index) => (
                <View key={booking.id} style={[styles.bookingCard, index === dashboardData.recentBookings.length - 1 && styles.lastBookingCard]}>
                  <View style={styles.bookingInfo}>
                    <Text style={styles.bookingVenue} numberOfLines={1}>{booking.venueName}</Text>
                    <Text style={styles.bookingPlayer} numberOfLines={1}>{booking.playerName}</Text>
                    <Text style={styles.bookingDate}>
                      {new Date(booking.bookingDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })} • {booking.startTime}
                    </Text>
                  </View>
                  <View style={styles.bookingAmount}>
                    <Text style={styles.amountText}>{formatCurrency(booking.totalAmount)}</Text>
                    <View style={[
                      styles.statusBadge,
                      booking.status === 'confirmed' ? styles.confirmedBadge : styles.completedBadge
                    ]}>
                      <Text style={[
                        styles.statusText,
                        booking.status === 'confirmed' ? styles.confirmedText : styles.completedText
                      ]}>
                        {booking.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}

              {dashboardData.recentBookings.length === 0 && (
                <View style={styles.emptyBookings}>
                  <Ionicons name="calendar-outline" size={32} color="#9ca3af" />
                  <Text style={styles.emptyBookingsText}>No recent bookings</Text>
                </View>
              )}
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.section}>
            <View style={styles.actionsCard}>
              <Text style={styles.sectionTitle}>Quick Actions</Text>
              <View style={styles.quickActions}>
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => router.push('/venue-owner/dashboard/venues')}
                >
                  <View style={styles.actionIcon}>
                    <Ionicons name="add-circle-outline" size={20} color="#212529" />
                  </View>
                  <Text style={styles.actionText}>Add Venue</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => router.push('/venue-owner/dashboard/bookings')}
                >
                  <View style={styles.actionIcon}>
                    <Ionicons name="calendar-outline" size={20} color="#212529" />
                  </View>
                  <Text style={styles.actionText}>Manage Bookings</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => router.push('/venue-owner/dashboard/analytics')}
                >
                  <View style={styles.actionIcon}>
                    <Ionicons name="analytics-outline" size={20} color="#212529" />
                  </View>
                  <Text style={styles.actionText}>Analytics</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Add some bottom padding */}
          <View style={{ height: 100 }} />
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#9ca3af',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 32,
    backgroundColor: '#f5f6f7',
  },
  headerContent: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 4,
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#212529',
  },
  notificationButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  heroCard: {
    height: 180,
    borderRadius: 20,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  heroImageStyle: {
    borderRadius: 20,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 20,
  },
  heroContent: {
    padding: 20,
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 20,
  },
  heroStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  heroStat: {
    alignItems: 'center',
    flex: 1,
  },
  heroStatValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  heroStatLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    fontWeight: '500',
  },
  kpiContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  kpiIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  kpiValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#212529',
    marginBottom: 4,
  },
  kpiLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 4,
    fontWeight: '500',
  },
  kpiChange: {
    fontSize: 11,
    color: '#10b981',
    fontWeight: '600',
  },
  chartCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  chartHeader: {
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 4,
  },
  chartSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  chartContainer: {
    alignItems: 'center',
  },
  chart: {
    borderRadius: 16,
  },
  bookingsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
  },
  sectionLink: {
    fontSize: 14,
    color: '#212529',
    fontWeight: '600',
  },
  bookingCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  lastBookingCard: {
    borderBottomWidth: 0,
  },
  bookingInfo: {
    flex: 1,
    marginRight: 16,
  },
  bookingVenue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 2,
  },
  bookingPlayer: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 2,
  },
  bookingDate: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  bookingAmount: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#212529',
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  confirmedBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  completedBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  confirmedText: {
    color: '#3b82f6',
  },
  completedText: {
    color: '#10b981',
  },
  emptyBookings: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyBookingsText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
    fontWeight: '500',
  },
  actionsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  actionButton: {
    alignItems: 'center',
    flex: 1,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  actionText: {
    fontSize: 11,
    color: '#212529',
    fontWeight: '600',
    textAlign: 'center',
  },
});