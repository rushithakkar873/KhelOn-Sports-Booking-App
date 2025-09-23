import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Arena } from '../services/venueOwnerService';

const { width } = Dimensions.get('window');

interface ArenaCardProps {
  arena: Arena;
  onEdit: (arena: Arena) => void;
  onToggleStatus: (arenaId: string, isActive: boolean) => void;
  onViewDetails: (arena: Arena) => void;
}

export default function ArenaCard({
  arena,
  onEdit,
  onToggleStatus,
  onViewDetails,
}: ArenaCardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getSportIcon = (sport: string) => {
    const sportIcons: { [key: string]: string } = {
      'Cricket': 'baseball-outline',
      'Football': 'football-outline',
      'Badminton': 'tennisball-outline',
      'Tennis': 'tennisball-outline',
      'Basketball': 'basketball-outline',
      'Volleyball': 'basketball-outline',
      'Hockey': 'baseball-outline',
      'Squash': 'tennisball-outline',
    };
    return sportIcons[sport] || 'ellipse-outline';
  };

  const getSportColor = (sport: string) => {
    const sportColors: { [key: string]: string } = {
      'Cricket': '#10b981',
      'Football': '#3b82f6',
      'Badminton': '#f59e0b',
      'Tennis': '#ef4444',
      'Basketball': '#8b5cf6',
      'Volleyball': '#f97316',
      'Hockey': '#06b6d4',
      'Squash': '#84cc16',
    };
    return sportColors[sport] || '#6b7280';
  };

  const getSlotCount = () => {
    return arena.slots?.length || 0;
  };

  const getActiveSlotCount = () => {
    return arena.slots?.filter(slot => slot.is_active !== false)?.length || 0;
  };

  const getPeakSlotsCount = () => {
    return arena.slots?.filter(slot => slot.is_peak_hour)?.length || 0;
  };

  return (
    <View style={[
      styles.container, 
      !arena.is_active && styles.inactiveContainer
    ]}>
      {/* Status Indicator */}
      <View style={[
        styles.statusBadge, 
        { backgroundColor: arena.is_active ? '#dcfce7' : '#fee2e2' }
      ]}>
        <View style={[
          styles.statusDot,
          { backgroundColor: arena.is_active ? '#16a34a' : '#dc2626' }
        ]} />
        <Text style={[
          styles.statusText,
          { color: arena.is_active ? '#166534' : '#991b1b' }
        ]}>
          {arena.is_active ? 'Active' : 'Inactive'}
        </Text>
      </View>

      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[
            styles.sportIconContainer,
            { backgroundColor: `${getSportColor(arena.sport)}15` }
          ]}>
            <Ionicons 
              name={getSportIcon(arena.sport) as any} 
              size={24} 
              color={getSportColor(arena.sport)} 
            />
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.arenaName} numberOfLines={1}>
              {arena.name}
            </Text>
            <View style={styles.sportBadge}>
              <Text style={[styles.sportText, { color: getSportColor(arena.sport) }]}>
                {arena.sport}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.headerRight}>
          <Switch
            value={arena.is_active}
            onValueChange={(value) => onToggleStatus(arena.id, value)}
            trackColor={{ false: '#f1f5f9', true: '#dcfce7' }}
            thumbColor={arena.is_active ? '#16a34a' : '#94a3b8'}
            ios_backgroundColor="#f1f5f9"
            style={styles.switch}
          />
        </View>
      </View>

      {/* Key Metrics */}
      <View style={styles.metricsContainer}>
        <View style={styles.metricItem}>
          <View style={[styles.metricIcon, { backgroundColor: '#dbeafe' }]}>
            <Ionicons name="people-outline" size={16} color="#2563eb" />
          </View>
          <Text style={styles.metricLabel}>Capacity</Text>
          <Text style={styles.metricValue}>{arena.capacity}</Text>
        </View>
        
        <View style={styles.metricItem}>
          <View style={[styles.metricIcon, { backgroundColor: '#fef3c7' }]}>
            <Ionicons name="time-outline" size={16} color="#d97706" />
          </View>
          <Text style={styles.metricLabel}>Time Slots</Text>
          <Text style={styles.metricValue}>
            {getActiveSlotCount()}/{getSlotCount()}
          </Text>
        </View>
        
        <View style={styles.metricItem}>
          <View style={[styles.metricIcon, { backgroundColor: '#dcfce7' }]}>
            <Ionicons name="pricetag-outline" size={16} color="#16a34a" />
          </View>
          <Text style={styles.metricLabel}>Base Price</Text>
          <Text style={styles.metricValue}>{formatCurrency(arena.base_price_per_hour)}</Text>
        </View>
      </View>

      {/* Additional Info */}
      {getPeakSlotsCount() > 0 && (
        <View style={styles.peakHoursInfo}>
          <Ionicons name="trending-up" size={16} color="#f59e0b" />
          <Text style={styles.peakHoursText}>
            {getPeakSlotsCount()} peak hour slot{getPeakSlotsCount() > 1 ? 's' : ''}
          </Text>
        </View>
      )}

      {/* Amenities Preview */}
      {arena.amenities && arena.amenities.length > 0 && (
        <View style={styles.amenitiesSection}>
          <Text style={styles.amenitiesLabel}>Amenities:</Text>
          <View style={styles.amenitiesList}>
            {arena.amenities.slice(0, 4).map((amenity, index) => (
              <View key={index} style={styles.amenityChip}>
                <Text style={styles.amenityText}>{amenity}</Text>
              </View>
            ))}
            {arena.amenities.length > 4 && (
              <View style={styles.amenityChip}>
                <Text style={styles.amenityText}>+{arena.amenities.length - 4}</Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Description */}
      {arena.description && (
        <Text style={styles.description} numberOfLines={2}>
          {arena.description}
        </Text>
      )}

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={styles.actionButtonSecondary}
          onPress={() => onViewDetails(arena)}
        >
          <Ionicons name="information-circle-outline" size={18} color="#6b7280" />
          <Text style={styles.actionButtonSecondaryText}>Details</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.actionButtonPrimary}
          onPress={() => onEdit(arena)}
        >
          <Ionicons name="create-outline" size={18} color="#ffffff" />
          <Text style={styles.actionButtonPrimaryText}>Edit Arena</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    position: 'relative',
  },
  inactiveContainer: {
    opacity: 0.75,
    backgroundColor: '#fafafa',
    borderColor: '#d1d5db',
  },
  
  // Status Badge
  statusBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },

  // Header Section
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    marginTop: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 16,
  },
  sportIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  arenaName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#212529',
    marginBottom: 6,
    lineHeight: 22,
  },
  sportBadge: {
    alignSelf: 'flex-start',
  },
  sportText: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  headerRight: {
    alignItems: 'center',
  },
  switch: {
    transform: [{ scale: 0.9 }],
  },

  // Metrics Container
  metricsContainer: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    justifyContent: 'space-between',
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  metricIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  metricLabel: {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 14,
    color: '#212529',
    fontWeight: '700',
    textAlign: 'center',
  },

  // Peak Hours Info
  peakHoursInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  peakHoursText: {
    fontSize: 12,
    color: '#92400e',
    fontWeight: '500',
    marginLeft: 6,
  },

  // Amenities Section
  amenitiesSection: {
    marginBottom: 16,
  },
  amenitiesLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  amenitiesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  amenityChip: {
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#bae6fd',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  amenityText: {
    fontSize: 11,
    color: '#0369a1',
    fontWeight: '500',
  },

  // Description
  description: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 20,
    fontStyle: 'italic',
  },

  // Actions Container
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButtonSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  actionButtonSecondaryText: {
    color: '#6b7280',
    fontWeight: '600',
    marginLeft: 6,
    fontSize: 14,
  },
  actionButtonPrimary: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#212529',
    shadowColor: '#212529',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonPrimaryText: {
    color: '#ffffff',
    fontWeight: '600',
    marginLeft: 6,
    fontSize: 14,
  },
});