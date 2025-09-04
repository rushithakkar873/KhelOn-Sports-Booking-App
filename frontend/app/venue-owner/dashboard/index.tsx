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
    color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.welcomeText}>Welcome back!</Text>
            <Text style={styles.headerTitle}>Dashboard Overview</Text>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <Ionicons name="notifications-outline" size={24} color="#374151" />
          </TouchableOpacity>
        </View>

        {/* KPI Cards */}
        <View style={styles.kpiContainer}>
          <View style={styles.kpiRow}>
            <View style={[styles.kpiCard, styles.venuesCard]}>
              <View style={styles.kpiIcon}>
                <Ionicons name="business" size={24} color="#2563eb" />
              </View>
              <Text style={styles.kpiValue}>{dashboardData.totalVenues}</Text>
              <Text style={styles.kpiLabel}>Total Venues</Text>
            </View>
            
            <View style={[styles.kpiCard, styles.bookingsCard]}>
              <View style={styles.kpiIcon}>
                <Ionicons name="calendar" size={24} color="#059669" />
              </View>
              <Text style={styles.kpiValue}>{dashboardData.totalBookings}</Text>
              <Text style={styles.kpiLabel}>Total Bookings</Text>
            </View>
          </View>

          <View style={styles.kpiRow}>
            <View style={[styles.kpiCard, styles.revenueCard]}>
              <View style={styles.kpiIcon}>
                <Ionicons name="cash" size={24} color="#dc2626" />
              </View>
              <Text style={styles.kpiValue}>{formatCurrency(dashboardData.totalRevenue)}</Text>
              <Text style={styles.kpiLabel}>Total Revenue</Text>
            </View>
            
            <View style={[styles.kpiCard, styles.occupancyCard]}>
              <View style={styles.kpiIcon}>
                <Ionicons name="stats-chart" size={24} color="#7c3aed" />
              </View>
              <Text style={styles.kpiValue}>{dashboardData.occupancyRate}%</Text>
              <Text style={styles.kpiLabel}>Occupancy Rate</Text>
            </View>
          </View>
        </View>

        {/* Revenue Trend Chart */}
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Revenue Trend (Last 7 Days)</Text>
          {Object.keys(dashboardData.revenueTrend).length > 0 && (
            <LineChart
              data={getRevenueChartData()}
              width={width - 48}
              height={200}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
            />
          )}
        </View>

        {/* Top Sports Chart */}
        {dashboardData.topSports.length > 0 && (
          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>Popular Sports</Text>
            <BarChart
              data={getSportsChartData()}
              width={width - 48}
              height={200}
              yAxisLabel=""
              yAxisSuffix=""
              chartConfig={chartConfig}
              style={styles.chart}
            />
          </View>
        )}

        {/* Recent Bookings */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Bookings</Text>
            <TouchableOpacity onPress={() => router.push('/venue-owner/dashboard/bookings')}>
              <Text style={styles.sectionLink}>View All</Text>
            </TouchableOpacity>
          </View>
          
          {dashboardData.recentBookings.map((booking) => (
            <View key={booking.id} style={styles.bookingCard}>
              <View style={styles.bookingInfo}>
                <Text style={styles.bookingVenue}>{booking.venueName}</Text>
                <Text style={styles.bookingPlayer}>{booking.playerName}</Text>
                <Text style={styles.bookingDate}>
                  {booking.bookingDate} at {booking.startTime}
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
                    {booking.status}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => Alert.alert('Coming Soon', 'Venue creation feature will be added soon!')}
            >
              <Ionicons name="add-circle-outline" size={24} color="#2563eb" />
              <Text style={styles.actionText}>Add Venue</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push('/venue-owner/dashboard/bookings')}
            >
              <Ionicons name="calendar-outline" size={24} color="#2563eb" />
              <Text style={styles.actionText}>View Bookings</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push('/venue-owner/dashboard/analytics')}
            >
              <Ionicons name="analytics-outline" size={24} color="#2563eb" />
              <Text style={styles.actionText}>Analytics</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
    backgroundColor: '#ffffff',
  },
  welcomeText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  notificationButton: {
    padding: 8,
  },
  kpiContainer: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  kpiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 6,
    alignItems: 'center',
  },
  venuesCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#2563eb',
  },
  bookingsCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#059669',
  },
  revenueCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#dc2626',
  },
  occupancyCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#7c3aed',
  },
  kpiIcon: {
    marginBottom: 8,
  },
  kpiValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  kpiLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  chartContainer: {
    backgroundColor: '#ffffff',
    marginHorizontal: 24,
    marginBottom: 24,
    borderRadius: 16,
    padding: 16,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  chart: {
    borderRadius: 8,
  },
  section: {
    backgroundColor: '#ffffff',
    marginHorizontal: 24,
    marginBottom: 24,
    borderRadius: 16,
    padding: 20,
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
    color: '#1f2937',
  },
  sectionLink: {
    fontSize: 14,
    color: '#2563eb',
    fontWeight: '600',
  },
  bookingCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  bookingInfo: {
    flex: 1,
  },
  bookingVenue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  bookingPlayer: {
    fontSize: 14,
    color: '#6b7280',
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
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  confirmedBadge: {
    backgroundColor: '#dbeafe',
  },
  completedBadge: {
    backgroundColor: '#d1fae5',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  confirmedText: {
    color: '#2563eb',
  },
  completedText: {
    color: '#059669',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    alignItems: 'center',
    padding: 16,
  },
  actionText: {
    fontSize: 12,
    color: '#2563eb',
    fontWeight: '600',
    marginTop: 8,
  },
});