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
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    position: 'relative',
  },
  inactiveContainer: {
    opacity: 0.7,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sportIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  arenaName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 2,
  },
  sportText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingVertical: 8,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  amenities: {
    marginBottom: 12,
  },
  amenitiesTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
    marginBottom: 6,
  },
  amenitiesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  amenityTag: {
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  amenityText: {
    fontSize: 11,
    color: '#1976D2',
  },
  description: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
    marginBottom: 12,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
  },
  editButton: {
    backgroundColor: '#E3F2FD',
    borderColor: '#2196F3',
  },
  editButtonText: {
    color: '#2196F3',
    fontWeight: '500',
    marginLeft: 4,
    fontSize: 13,
  },
  detailsButton: {
    backgroundColor: '#E8F5E8',
    borderColor: '#4CAF50',
  },
  detailsButtonText: {
    color: '#4CAF50',
    fontWeight: '500',
    marginLeft: 4,
    fontSize: 13,
  },
  statusIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  activeIndicator: {
    backgroundColor: '#4CAF50',
  },
  inactiveIndicator: {
    backgroundColor: '#FF5252',
  },
});