import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal,
  Dimensions,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import VenueOwnerService, { AnalyticsDashboard } from '../../../services/venueOwnerService';
import AnimatedLoader from '../../../components/AnimatedLoader';

const { width } = Dimensions.get('window');

export default function AnalyticsScreen() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsDashboard | null>(null);
  const venueOwnerService = VenueOwnerService.getInstance();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState('30');
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState('revenue');

  const timeRanges = [
    { key: '7', label: '7 Days' },
    { key: '30', label: '30 Days' },
    { key: '90', label: '3 Months' },
    { key: '365', label: '1 Year' },
  ];

  const metrics = [
    { key: 'revenue', label: 'Revenue Focus', icon: 'cash' },
    { key: 'bookings', label: 'Bookings Focus', icon: 'calendar' },
    { key: 'occupancy', label: 'Occupancy Focus', icon: 'trending-up' },
  ];

  useEffect(() => {
    loadAnalytics();
  }, [selectedTimeRange, selectedMetric]);

  const loadAnalytics = async () => {
    try {
      // Calculate date range based on selectedTimeRange
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - parseInt(selectedTimeRange));

      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      // Get real analytics data from API
      const data = await venueOwnerService.getAnalyticsDashboard(startDateStr, endDateStr);
      setAnalyticsData(data);
    } catch (error) {
      console.error('Error loading analytics:', error);
      Alert.alert(
        'Error', 
        'Failed to load analytics data. Please check your connection and try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadAnalytics();
    setIsRefreshing(false);
  };

  const formatCurrency = (amount: number) => {
    return VenueOwnerService.formatCurrency(amount);
  };

  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(33, 37, 41, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: '#212529',
    },
    propsForBackgroundLines: {
      strokeDasharray: '',
      stroke: '#f1f5f9',
      strokeWidth: 1,
    },
  };

  const getRevenueChartData = () => {
    if (!analyticsData || !analyticsData.revenue_trend) return { labels: [], datasets: [{ data: [0] }] };
    
    const trendEntries = Object.entries(analyticsData.revenue_trend);
    if (trendEntries.length === 0) return { labels: ['No Data'], datasets: [{ data: [0] }] };
    
    return {
      labels: trendEntries.map(([date]) => 
        new Date(date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
      ).slice(-7), // Show last 7 days
      datasets: [
        {
          data: trendEntries.map(([, revenue]) => revenue / 1000).slice(-7),
          strokeWidth: 3,
        },
      ],
    };
  };

  const getBookingsChartData = () => {
    if (!analyticsData || !analyticsData.bookingsTrend || analyticsData.bookingsTrend.length === 0) {
      return { 
        labels: ['No Data'], 
        datasets: [{ data: [0] }] 
      };
    }
    
    return {
      labels: analyticsData.bookingsTrend.map(item => item.month),
      datasets: [
        {
          data: analyticsData.bookingsTrend.map(item => item.bookings || 0),
        },
      ],
    };
  };

  const getSportsDistributionData = () => {
    if (!analyticsData || !analyticsData.sportDistribution || analyticsData.sportDistribution.length === 0) {
      return [{
        name: 'No Data',
        population: 1,
        color: '#e5e7eb',
        legendFontColor: '#6b7280',
        legendFontSize: 12,
      }];
    }
    
    return analyticsData.sportDistribution.map((sport, index) => ({
      name: sport.sport || 'Unknown',
      population: sport.bookings || 0,
      color: sport.color || '#e5e7eb',
      legendFontColor: '#6b7280',
      legendFontSize: 12,
    }));
  };

  const getPeakHoursData = () => {
    if (!analyticsData || !analyticsData.peak_hours || analyticsData.peak_hours.length === 0) {
      return { 
        labels: ['No Data'], 
        datasets: [{ data: [0] }] 
      };
    }
    
    return {
      labels: analyticsData.peak_hours.map(item => item.hour || '00:00'),
      datasets: [
        {
          data: analyticsData.peak_hours.map(item => item.bookings || 0),
        },
      ],
    };
  };

  if (isLoading || !analyticsData) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <SafeAreaView style={styles.safeArea}>
          <AnimatedLoader 
            message="Loading analytics..." 
            size="medium"
            color="#212529"
          />
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
            <View style={styles.headerContent}>
              <Text style={styles.greeting}>Analytics</Text>
              <Text style={styles.subtitle}>Performance insights</Text>
            </View>
            <TouchableOpacity 
              style={styles.filtersButton}
              onPress={() => setShowFiltersModal(true)}
            >
              <Ionicons name="options" size={20} color="#212529" />
            </TouchableOpacity>
          </View>

          {/* Time Range Selector */}
          <View style={styles.timeRangeSection}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.timeRangeContainer}>
              {timeRanges.map((range, index) => (
                <TouchableOpacity
                  key={range.key}
                  style={[
                    styles.timeRangeButton,
                    selectedTimeRange === range.key && styles.timeRangeButtonActive,
                    index === 0 && styles.firstTimeRange
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
          </View>

          {/* Key Metrics */}
          <View style={styles.metricsSection}>
            <View style={styles.metricsGrid}>
              <View style={styles.metricCard}>
                <View style={styles.metricHeader}>
                  <View style={styles.metricIcon}>
                    <Ionicons name="cash" size={24} color="#10b981" />
                  </View>
                </View>
                <Text style={styles.metricValue}>{formatCurrency(analyticsData.total_revenue)}</Text>
                <Text style={styles.metricLabel}>Total Revenue</Text>
              </View>

              <View style={styles.metricCard}>
                <View style={styles.metricHeader}>
                  <View style={styles.metricIcon}>
                    <Ionicons name="calendar" size={24} color="#3b82f6" />
                  </View>
                </View>
                <Text style={styles.metricValue}>{analyticsData.total_bookings}</Text>
                <Text style={styles.metricLabel}>Total Bookings</Text>
              </View>
            </View>

            <View style={styles.metricsGrid}>
              <View style={styles.metricCard}>
                <View style={styles.metricHeader}>
                  <View style={styles.metricIcon}>
                    <Ionicons name="trending-up" size={24} color="#f59e0b" />
                  </View>
                </View>
                <Text style={styles.metricValue}>{analyticsData.occupancy_rate}%</Text>
                <Text style={styles.metricLabel}>Occupancy Rate</Text>
              </View>
              
              <View style={styles.metricCard}>
                <View style={styles.metricHeader}>
                  <View style={styles.metricIcon}>
                    <Ionicons name="storefront" size={24} color="#8b5cf6" />
                  </View>
                </View>
                <Text style={styles.metricValue}>{analyticsData.total_venues}</Text>
                <Text style={styles.metricLabel}>Total Venues</Text>
              </View>
            </View>
          </View>

          {/* Revenue Trend Chart */}
          <View style={styles.chartSection}>
            <View style={styles.chartHeader}>
              <Text style={styles.chartTitle}>Revenue Trend</Text>
              <Text style={styles.chartSubtitle}>in thousands (₹K)</Text>
            </View>
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

          {/* Bookings Chart */}
          <View style={styles.chartSection}>
            <View style={styles.chartHeader}>
              <Text style={styles.chartTitle}>Bookings Trend</Text>
              <Text style={styles.chartSubtitle}>number of bookings</Text>
            </View>
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
          <View style={styles.chartSection}>
            <View style={styles.chartHeader}>
              <Text style={styles.chartTitle}>Sports Distribution</Text>
              <Text style={styles.chartSubtitle}>by booking volume</Text>
            </View>
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
                  <View style={[styles.sportIndicator, { backgroundColor: sport.color }]} />
                  <View style={styles.sportInfo}>
                    <Text style={styles.sportName}>{sport.sport}</Text>
                    <Text style={styles.sportMetrics}>{sport.bookings} bookings</Text>
                    <Text style={styles.sportRevenue}>{formatCurrency(sport.revenue)}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Peak Hours */}
          <View style={styles.chartSection}>
            <View style={styles.chartHeader}>
              <Text style={styles.chartTitle}>Peak Booking Hours</Text>
              <Text style={styles.chartSubtitle}>daily distribution</Text>
            </View>
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
          <View style={styles.performanceSection}>
            <Text style={styles.sectionTitle}>Venue Performance</Text>
            {analyticsData.venuePerformance && analyticsData.venuePerformance.length > 0 ? (
              analyticsData.venuePerformance.map((venue, index) => (
                <View key={venue.venueName || index} style={styles.venuePerformanceCard}>
                  <View style={styles.venueInfo}>
                    <Text style={styles.venueName}>{venue.venueName || 'Unknown Venue'}</Text>
                    <View style={styles.venueMetrics}>
                      <Text style={styles.venueBookings}>{venue.bookings || 0} bookings</Text>
                      <Text style={styles.venueRevenue}>{formatCurrency(venue.revenue || 0)}</Text>
                    </View>
                  </View>
                  <View style={styles.occupancyContainer}>
                    <Text style={styles.occupancyValue}>{venue.occupancy || 0}%</Text>
                    <View style={styles.occupancyBarContainer}>
                      <View style={styles.occupancyBar}>
                        <View 
                          style={[
                            styles.occupancyFill,
                            { 
                              width: `${Math.min(venue.occupancy || 0, 100)}%`,
                              backgroundColor: (venue.occupancy || 0) >= 70 ? '#10b981' : (venue.occupancy || 0) >= 50 ? '#f59e0b' : '#ef4444'
                            }
                          ]}
                        />
                      </View>
                    </View>
                    <Text style={styles.occupancyLabel}>Occupancy</Text>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No venue performance data available</Text>
              </View>
            )}
          </View>

          {/* Monthly Comparison */}
          <View style={styles.comparisonSection}>
            <Text style={styles.sectionTitle}>Monthly Comparison</Text>
            <View style={styles.comparisonGrid}>
              {analyticsData.monthlyComparison && analyticsData.monthlyComparison.length > 0 ? (
                analyticsData.monthlyComparison.map((month, index) => (
                  <View key={month.month || index} style={styles.comparisonCard}>
                    <Text style={styles.comparisonMonth}>{month.month || 'Unknown'}</Text>
                    <Text style={styles.comparisonRevenue}>{formatCurrency(month.revenue || 0)}</Text>
                    <Text style={styles.comparisonBookings}>{month.bookings || 0} bookings</Text>
                  </View>
                ))
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>No comparison data available</Text>
                </View>
              )}
            </View>
          </View>

          {/* Add some bottom padding */}
          <View style={{ height: 100 }} />
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
                      <Ionicons name="checkmark" size={20} color="#212529" />
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
                      <Ionicons name="checkmark" size={20} color="#212529" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </SafeAreaView>
        </Modal>
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
    color: '#6b7280',
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
    backgroundColor: '#ffffff',
  },
  headerContent: {
    flex: 1,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700',
    color: '#212529',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  filtersButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  timeRangeSection: {
    paddingVertical: 24,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  timeRangeContainer: {
    paddingHorizontal: 24,
    gap: 12,
  },
  timeRangeButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  timeRangeButtonActive: {
    backgroundColor: '#212529',
    borderColor: '#212529',
  },
  firstTimeRange: {
    marginLeft: 0,
  },
  timeRangeButtonText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '600',
  },
  timeRangeButtonTextActive: {
    color: '#ffffff',
  },
  metricsSection: {
    paddingHorizontal: 24,
    paddingVertical: 32,
    gap: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  metricIcon: {},
  metricGrowth: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricGrowthText: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '600',
    marginLeft: 4,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#212529',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  chartSection: {
    backgroundColor: '#ffffff',
    marginHorizontal: 24,
    marginBottom: 24,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  chartHeader: {
    marginBottom: 20,
  },
  chartTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 4,
  },
  chartSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  chart: {
    borderRadius: 16,
  },
  sportsStats: {
    marginTop: 20,
    gap: 16,
  },
  sportStat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sportIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  sportInfo: {
    flex: 1,
  },
  sportName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 2,
  },
  sportMetrics: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 2,
  },
  sportRevenue: {
    fontSize: 14,
    color: '#10b981',
    fontWeight: '600',
  },
  performanceSection: {
    backgroundColor: '#ffffff',
    marginHorizontal: 24,
    marginBottom: 24,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 20,
  },
  venuePerformanceCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  venueInfo: {
    flex: 1,
  },
  venueName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 6,
  },
  venueMetrics: {
    flexDirection: 'row',
    gap: 16,
  },
  venueBookings: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },
  venueRevenue: {
    fontSize: 13,
    color: '#10b981',
    fontWeight: '600',
  },
  occupancyContainer: {
    alignItems: 'flex-end',
    width: 100,
  },
  occupancyValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#212529',
    marginBottom: 4,
  },
  occupancyBarContainer: {
    width: 80,
    marginBottom: 4,
  },
  occupancyBar: {
    width: '100%',
    height: 6,
    backgroundColor: '#f1f5f9',
    borderRadius: 3,
  },
  occupancyFill: {
    height: '100%',
    borderRadius: 3,
  },
  occupancyLabel: {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: '500',
  },
  comparisonSection: {
    backgroundColor: '#ffffff',
    marginHorizontal: 24,
    marginBottom: 24,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  comparisonGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  comparisonCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  comparisonMonth: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
    marginBottom: 6,
  },
  comparisonRevenue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#212529',
    marginBottom: 4,
  },
  comparisonBookings: {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: '500',
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
    fontWeight: '500',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
  },
  modalSave: {
    fontSize: 16,
    color: '#212529',
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
    color: '#212529',
    marginBottom: 16,
  },
  filterOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  filterOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterOptionText: {
    fontSize: 16,
    color: '#212529',
    marginLeft: 12,
    fontWeight: '500',
  },
});