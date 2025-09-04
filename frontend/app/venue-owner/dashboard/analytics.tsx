import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';

const { width } = Dimensions.get('window');

interface AnalyticsData {
  totalRevenue: number;
  totalBookings: number;
  occupancyRate: number;
  averageBookingValue: number;
  revenueTrend: { [key: string]: number };
  bookingsTrend: { [key: string]: number };
  sportDistribution: { sport: string; bookings: number; revenue: number }[];
  peakHours: { hour: string; bookings: number }[];
  monthlyComparison: { month: string; revenue: number; bookings: number }[];
  venuePerformance: { venueName: string; bookings: number; revenue: number; occupancy: number }[];
}

export default function AnalyticsScreen() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState('7d');
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState('revenue');

  const timeRanges = [
    { key: '7d', label: '7 Days' },
    { key: '30d', label: '30 Days' },
    { key: '90d', label: '3 Months' },
    { key: '1y', label: '1 Year' },
  ];

  const metrics = [
    { key: 'revenue', label: 'Revenue', icon: 'cash-outline' },
    { key: 'bookings', label: 'Bookings', icon: 'calendar-outline' },
    { key: 'occupancy', label: 'Occupancy', icon: 'stats-chart-outline' },
  ];

  useEffect(() => {
    loadAnalyticsData();
  }, [selectedTimeRange]);

  const loadAnalyticsData = async () => {
    try {
      // Mock data - replace with actual API call
      const mockData: AnalyticsData = {
        totalRevenue: 85000,
        totalBookings: 67,
        occupancyRate: 72.5,
        averageBookingValue: 1268,
        revenueTrend: {
          '2025-01-09': 3200,
          '2025-01-10': 2400,
          '2025-01-11': 4100,
          '2025-01-12': 3800,
          '2025-01-13': 2200,
          '2025-01-14': 5400,
          '2025-01-15': 3600,
        },
        bookingsTrend: {
          '2025-01-09': 4,
          '2025-01-10': 3,
          '2025-01-11': 5,
          '2025-01-12': 4,
          '2025-01-13': 2,
          '2025-01-14': 6,
          '2025-01-15': 4,
        },
        sportDistribution: [
          { sport: 'Cricket', bookings: 35, revenue: 45000 },
          { sport: 'Football', bookings: 22, revenue: 25000 },
          { sport: 'Badminton', bookings: 10, revenue: 15000 },
        ],
        peakHours: [
          { hour: '18:00', bookings: 12 },
          { hour: '19:00', bookings: 10 },
          { hour: '17:00', bookings: 8 },
          { hour: '20:00', bookings: 7 },
          { hour: '16:00', bookings: 5 },
          { hour: '07:00', bookings: 4 },
        ],
        monthlyComparison: [
          { month: 'Oct', revenue: 75000, bookings: 58 },
          { month: 'Nov', revenue: 82000, bookings: 64 },
          { month: 'Dec', revenue: 91000, bookings: 71 },
          { month: 'Jan', revenue: 85000, bookings: 67 },
        ],
        venuePerformance: [
          { venueName: 'Elite Cricket Ground', bookings: 35, revenue: 45000, occupancy: 85.2 },
          { venueName: 'Champions Football Turf', bookings: 22, revenue: 25000, occupancy: 65.8 },
          { venueName: 'Badminton Arena Pro', bookings: 10, revenue: 15000, occupancy: 55.5 },
        ]
      };

      setAnalyticsData(mockData);
    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadAnalyticsData();
    setIsRefreshing(false);
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const getRevenueChartData = () => {
    if (!analyticsData) return { labels: [], datasets: [{ data: [] }] };
    
    const dates = Object.keys(analyticsData.revenueTrend);
    const revenues = dates.map(date => analyticsData.revenueTrend[date]);
    
    return {
      labels: dates.map(date => {
        const d = new Date(date);
        return `${d.getDate()}/${d.getMonth() + 1}`;
      }),
      datasets: [{
        data: revenues,
        strokeWidth: 3,
      }]
    };
  };

  const getBookingsChartData = () => {
    if (!analyticsData) return { labels: [], datasets: [{ data: [] }] };
    
    const dates = Object.keys(analyticsData.bookingsTrend);
    const bookings = dates.map(date => analyticsData.bookingsTrend[date]);
    
    return {
      labels: dates.map(date => {
        const d = new Date(date);
        return `${d.getDate()}/${d.getMonth() + 1}`;
      }),
      datasets: [{
        data: bookings,
      }]
    };
  };

  const getSportsDistributionData = () => {
    if (!analyticsData) return [];
    
    const colors = ['#2563eb', '#059669', '#f59e0b', '#dc2626', '#7c3aed'];
    
    return analyticsData.sportDistribution.map((item, index) => ({
      name: item.sport,
      population: item.bookings,
      color: colors[index % colors.length],
      legendFontColor: '#6b7280',
      legendFontSize: 12,
    }));
  };

  const getPeakHoursData = () => {
    if (!analyticsData) return { labels: [], datasets: [{ data: [] }] };
    
    return {
      labels: analyticsData.peakHours.map(item => item.hour),
      datasets: [{
        data: analyticsData.peakHours.map(item => item.bookings)
      }]
    };
  };

  const chartConfig = {
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.6,
    useShadowColorFromDataset: false,
    decimalPlaces: 0,
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading analytics...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!analyticsData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load analytics data</Text>
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
            <Text style={styles.headerTitle}>Analytics</Text>
            <Text style={styles.headerSubtitle}>Business insights & performance</Text>
          </View>
          <TouchableOpacity 
            style={styles.filtersButton}
            onPress={() => setShowFiltersModal(true)}
          >
            <Ionicons name="options-outline" size={20} color="#2563eb" />
          </TouchableOpacity>
        </View>

        {/* Time Range Selector */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.timeRangeContainer}
          contentContainerStyle={styles.timeRangeContent}
        >
          {timeRanges.map((range) => (
            <TouchableOpacity
              key={range.key}
              style={[
                styles.timeRangeButton,
                selectedTimeRange === range.key && styles.timeRangeButtonActive
              ]}
              onPress={() => setSelectedTimeRange(range.key)}
            >
              <Text style={[
                styles.timeRangeButtonText,
                selectedTimeRange === range.key && styles.timeRangeButtonTextActive
              ]}>
                {range.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Key Metrics */}
        <View style={styles.metricsContainer}>
          <View style={styles.metricsRow}>
            <View style={styles.metricCard}>
              <View style={styles.metricIcon}>
                <Ionicons name="cash" size={24} color="#059669" />
              </View>
              <Text style={styles.metricValue}>{formatCurrency(analyticsData.totalRevenue)}</Text>
              <Text style={styles.metricLabel}>Total Revenue</Text>
              <Text style={styles.metricChange}>+12.5% vs last period</Text>
            </View>
            
            <View style={styles.metricCard}>
              <View style={styles.metricIcon}>
                <Ionicons name="calendar" size={24} color="#2563eb" />
              </View>
              <Text style={styles.metricValue}>{analyticsData.totalBookings}</Text>
              <Text style={styles.metricLabel}>Total Bookings</Text>
              <Text style={styles.metricChange}>+8.3% vs last period</Text>
            </View>
          </View>

          <View style={styles.metricsRow}>
            <View style={styles.metricCard}>
              <View style={styles.metricIcon}>
                <Ionicons name="trending-up" size={24} color="#7c3aed" />
              </View>
              <Text style={styles.metricValue}>{analyticsData.occupancyRate}%</Text>
              <Text style={styles.metricLabel}>Occupancy Rate</Text>
              <Text style={styles.metricChange}>+5.2% vs last period</Text>
            </View>
            
            <View style={styles.metricCard}>
              <View style={styles.metricIcon}>
                <Ionicons name="calculator" size={24} color="#f59e0b" />
              </View>
              <Text style={styles.metricValue}>{formatCurrency(analyticsData.averageBookingValue)}</Text>
              <Text style={styles.metricLabel}>Avg Booking Value</Text>
              <Text style={styles.metricChange}>+3.7% vs last period</Text>
            </View>
          </View>
        </View>

        {/* Revenue Trend Chart */}
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Revenue Trend</Text>
          <LineChart
            data={getRevenueChartData()}
            width={width - 48}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
            decorator={() => null}
          />
        </View>

        {/* Bookings Trend Chart */}
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Bookings Trend</Text>
          <BarChart
            data={getBookingsChartData()}
            width={width - 48}
            height={220}
            yAxisLabel=""
            yAxisSuffix=""
            chartConfig={chartConfig}
            style={styles.chart}
          />
        </View>

        {/* Sports Distribution */}
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Sports Distribution</Text>
          <PieChart
            data={getSportsDistributionData()}
            width={width - 48}
            height={200}
            chartConfig={chartConfig}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="15"
            center={[10, 0]}
          />
          <View style={styles.sportsStats}>
            {analyticsData.sportDistribution.map((sport, index) => (
              <View key={sport.sport} style={styles.sportStat}>
                <Text style={styles.sportName}>{sport.sport}</Text>
                <Text style={styles.sportBookings}>{sport.bookings} bookings</Text>
                <Text style={styles.sportRevenue}>{formatCurrency(sport.revenue)}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Peak Hours */}
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Peak Booking Hours</Text>
          <BarChart
            data={getPeakHoursData()}
            width={width - 48}
            height={200}
            yAxisLabel=""
            yAxisSuffix=""
            chartConfig={chartConfig}
            style={styles.chart}
          />
        </View>

        {/* Venue Performance */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Venue Performance</Text>
          {analyticsData.venuePerformance.map((venue) => (
            <View key={venue.venueName} style={styles.venuePerformanceCard}>
              <View style={styles.venueInfo}>
                <Text style={styles.venueName}>{venue.venueName}</Text>
                <Text style={styles.venueStats}>
                  {venue.bookings} bookings • {formatCurrency(venue.revenue)}
                </Text>
              </View>
              <View style={styles.venueOccupancy}>
                <Text style={styles.occupancyValue}>{venue.occupancy}%</Text>
                <View style={styles.occupancyBar}>
                  <View 
                    style={[
                      styles.occupancyFill,
                      { width: `${venue.occupancy}%` }
                    ]}
                  />
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Monthly Comparison */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Monthly Comparison</Text>
          <View style={styles.comparisonContainer}>
            {analyticsData.monthlyComparison.map((month) => (
              <View key={month.month} style={styles.comparisonCard}>
                <Text style={styles.comparisonMonth}>{month.month}</Text>
                <Text style={styles.comparisonRevenue}>{formatCurrency(month.revenue)}</Text>
                <Text style={styles.comparisonBookings}>{month.bookings} bookings</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Filters Modal */}
      <Modal
        visible={showFiltersModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowFiltersModal(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Analytics Filters</Text>
            <TouchableOpacity onPress={() => setShowFiltersModal(false)}>
              <Text style={styles.modalSave}>Apply</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            <View style={styles.filterSection}>
              <Text style={styles.filterTitle}>Time Range</Text>
              {timeRanges.map((range) => (
                <TouchableOpacity
                  key={range.key}
                  style={styles.filterOption}
                  onPress={() => setSelectedTimeRange(range.key)}
                >
                  <Text style={styles.filterOptionText}>{range.label}</Text>
                  {selectedTimeRange === range.key && (
                    <Ionicons name="checkmark" size={20} color="#2563eb" />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterTitle}>Primary Metric</Text>
              {metrics.map((metric) => (
                <TouchableOpacity
                  key={metric.key}
                  style={styles.filterOption}
                  onPress={() => setSelectedMetric(metric.key)}
                >
                  <View style={styles.filterOptionContent}>
                    <Ionicons name={metric.icon as any} size={20} color="#6b7280" />
                    <Text style={styles.filterOptionText}>{metric.label}</Text>
                  </View>
                  {selectedMetric === metric.key && (
                    <Ionicons name="checkmark" size={20} color="#2563eb" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#dc2626',
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
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  filtersButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeRangeContainer: {
    marginBottom: 24,
  },
  timeRangeContent: {
    paddingHorizontal: 24,
  },
  timeRangeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: '#f3f4f6',
  },
  timeRangeButtonActive: {
    backgroundColor: '#2563eb',
  },
  timeRangeButtonText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  timeRangeButtonTextActive: {
    color: '#ffffff',
  },
  metricsContainer: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 6,
    alignItems: 'center',
  },
  metricIcon: {
    marginBottom: 12,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 8,
  },
  metricChange: {
    fontSize: 10,
    color: '#059669',
    fontWeight: '600',
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
  sportsStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  sportStat: {
    alignItems: 'center',
  },
  sportName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  sportBookings: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  sportRevenue: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '600',
  },
  section: {
    backgroundColor: '#ffffff',
    marginHorizontal: 24,
    marginBottom: 24,
    borderRadius: 16,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  venuePerformanceCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  venueInfo: {
    flex: 1,
  },
  venueName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  venueStats: {
    fontSize: 12,
    color: '#6b7280',
  },
  venueOccupancy: {
    alignItems: 'flex-end',
    width: 80,
  },
  occupancyValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  occupancyBar: {
    width: 60,
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
  },
  occupancyFill: {
    height: '100%',
    backgroundColor: '#2563eb',
    borderRadius: 2,
  },
  comparisonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  comparisonCard: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    marginHorizontal: 2,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
  },
  comparisonMonth: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  comparisonRevenue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  comparisonBookings: {
    fontSize: 10,
    color: '#6b7280',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalCancel: {
    fontSize: 16,
    color: '#6b7280',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  modalSave: {
    fontSize: 16,
    color: '#2563eb',
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  filterSection: {
    marginBottom: 32,
  },
  filterTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  filterOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  filterOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterOptionText: {
    fontSize: 16,
    color: '#1f2937',
    marginLeft: 12,
  },
});