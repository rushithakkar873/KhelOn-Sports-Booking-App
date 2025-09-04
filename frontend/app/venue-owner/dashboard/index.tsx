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

const { width } = Dimensions.get('window');

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

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // TODO: Replace with actual API call using stored token
      // For now, using mock data
      const mockData: DashboardData = {
        totalVenues: 2,
        totalBookings: 24,
        totalRevenue: 36000,
        occupancyRate: 68.5,
        recentBookings: [
          {
            id: '1',
            venueName: 'Elite Cricket Ground',
            playerName: 'Arjun Singh',
            bookingDate: '2025-01-15',
            startTime: '18:00',
            totalAmount: 1800,
            status: 'confirmed'
          },
          {
            id: '2',
            venueName: 'Elite Football Turf',
            playerName: 'Priya Sharma',
            bookingDate: '2025-01-14',
            startTime: '16:00',
            totalAmount: 1200,
            status: 'completed'
          }
        ],
        revenueTrend: {
          '2025-01-10': 2400,
          '2025-01-11': 1800,
          '2025-01-12': 3200,
          '2025-01-13': 2800,
          '2025-01-14': 4100,
          '2025-01-15': 1800,
          '2025-01-16': 2200,
        },
        topSports: [
          { sport: 'Cricket', count: 15 },
          { sport: 'Football', count: 9 },
        ],
        peakHours: [
          { hour: '18:00', count: 8 },
          { hour: '19:00', count: 6 },
          { hour: '17:00', count: 5 },
          { hour: '20:00', count: 3 },
          { hour: '16:00', count: 2 },
        ]
      };

      setDashboardData(mockData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
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
    return `₹${amount.toLocaleString('en-IN')}`;
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
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading dashboard...</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
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
            <View>
              <Text style={styles.welcomeText}>Welcome back!</Text>
              <Text style={styles.headerTitle}>Dashboard Overview</Text>
            </View>
            <TouchableOpacity style={styles.notificationButton}>
              <Ionicons name="notifications-outline" size={20} color="#ffffff" />
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
                  <Ionicons name="trending-up" size={24} color="#212529" />
                </View>
                <Text style={styles.kpiValue}>{dashboardData.occupancyRate}%</Text>
                <Text style={styles.kpiLabel}>Occupancy Rate</Text>
                <Text style={styles.kpiChange}>+5.2% from last month</Text>
              </View>
              
              <View style={styles.kpiCard}>
                <View style={styles.kpiIcon}>
                  <Ionicons name="calendar" size={24} color="#212529" />
                </View>
                <Text style={styles.kpiValue}>{dashboardData.recentBookings.length}</Text>
                <Text style={styles.kpiLabel}>Recent Bookings</Text>
                <Text style={styles.kpiChange}>Last 24 hours</Text>
              </View>
            </View>
          </View>

          {/* Revenue Trend Chart */}
          <View style={styles.section}>
            <View style={styles.chartCard}>
              <View style={styles.chartHeader}>
                <Text style={styles.chartTitle}>Revenue Trend</Text>
                <Text style={styles.chartSubtitle}>Last 7 days performance</Text>
              </View>
              {Object.keys(dashboardData.revenueTrend).length > 0 && (
                <LineChart
                  data={getRevenueChartData()}
                  width={width - 48}
                  height={200}
                  chartConfig={chartConfig}
                  bezier
                  style={styles.chart}
                  decorator={() => null}
                />
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
                <BarChart
                  data={getSportsChartData()}
                  width={width - 48}
                  height={180}
                  yAxisLabel=""
                  yAxisSuffix=""
                  chartConfig={chartConfig}
                  style={styles.chart}
                />
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
                    <Text style={styles.bookingVenue}>{booking.venueName}</Text>
                    <Text style={styles.bookingPlayer}>{booking.playerName}</Text>
                    <Text style={styles.bookingDate}>
                      {booking.bookingDate} • {booking.startTime}
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
                  onPress={() => Alert.alert('Coming Soon', 'Venue creation feature will be added soon!')}
                >
                  <View style={styles.actionIcon}>
                    <Ionicons name="add-circle-outline" size={24} color="#212529" />
                  </View>
                  <Text style={styles.actionText}>Add Venue</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => router.push('/venue-owner/dashboard/bookings')}
                >
                  <View style={styles.actionIcon}>
                    <Ionicons name="calendar-outline" size={24} color="#212529" />
                  </View>
                  <Text style={styles.actionText}>Manage Bookings</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => router.push('/venue-owner/dashboard/analytics')}
                >
                  <View style={styles.actionIcon}>
                    <Ionicons name="analytics-outline" size={24} color="#212529" />
                  </View>
                  <Text style={styles.actionText}>View Analytics</Text>
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
    backgroundColor: '#ffffff',
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
    paddingBottom: 16,
  },
  welcomeText: {
    fontSize: 16,
    color: '#9ca3af',
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#212529',
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#212529',
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  heroCard: {
    height: 200,
    borderRadius: 24,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  heroImageStyle: {
    borderRadius: 24,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 24,
  },
  heroContent: {
    padding: 24,
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 24,
  },
  heroStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  heroStat: {
    alignItems: 'center',
  },
  heroStatValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  heroStatLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  kpiContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: '#f5f6f7',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
  },
  kpiIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  kpiValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 4,
  },
  kpiLabel: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 8,
  },
  kpiChange: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '600',
  },
  chartCard: {
    backgroundColor: '#f5f6f7',
    borderRadius: 24,
    padding: 20,
  },
  chartHeader: {
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 4,
  },
  chartSubtitle: {
    fontSize: 14,
    color: '#9ca3af',
  },
  chart: {
    borderRadius: 16,
  },
  bookingsCard: {
    backgroundColor: '#f5f6f7',
    borderRadius: 24,
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
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
    borderBottomColor: '#e5e7eb',
  },
  lastBookingCard: {
    borderBottomWidth: 0,
  },
  bookingInfo: {
    flex: 1,
  },
  bookingVenue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 2,
  },
  bookingPlayer: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 2,
  },
  bookingDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  bookingAmount: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  confirmedBadge: {
    backgroundColor: 'rgba(33, 37, 41, 0.1)',
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
    color: '#212529',
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
    color: '#9ca3af',
    marginTop: 8,
  },
  actionsCard: {
    backgroundColor: '#f5f6f7',
    borderRadius: 24,
    padding: 20,
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
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  actionText: {
    fontSize: 12,
    color: '#212529',
    fontWeight: '600',
    textAlign: 'center',
  },
});