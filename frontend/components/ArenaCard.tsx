import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Arena } from '../services/venueOwnerService';

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

  const getSlotCount = () => {
    return arena.slots?.length || 0;
  };

  const getActiveSlotCount = () => {
    return arena.slots?.filter(slot => slot.is_active)?.length || 0;
  };

  return (
    <View style={[styles.container, !arena.is_active && styles.inactiveContainer]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.sportIcon}>
            <Ionicons name={getSportIcon(arena.sport) as any} size={20} color="#4CAF50" />
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.arenaName} numberOfLines={1}>
              {arena.name}
            </Text>
            <Text style={styles.sportText}>{arena.sport}</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <Switch
            value={arena.is_active}
            onValueChange={(value) => onToggleStatus(arena.id, value)}
            trackColor={{ false: '#E5E5E5', true: '#4CAF50' }}
            thumbColor={arena.is_active ? '#fff' : '#f4f3f4'}
            ios_backgroundColor="#E5E5E5"
          />
        </View>
      </View>

      {/* Stats */}
      <View style={styles.stats}>
        <View style={styles.statItem}>
          <Ionicons name="people-outline" size={16} color="#666" />
          <Text style={styles.statText}>Capacity: {arena.capacity}</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="time-outline" size={16} color="#666" />
          <Text style={styles.statText}>
            {getActiveSlotCount()}/{getSlotCount()} slots
          </Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="pricetag-outline" size={16} color="#666" />
          <Text style={styles.statText}>{formatCurrency(arena.base_price_per_hour)}/hr</Text>
        </View>
      </View>

      {/* Amenities */}
      {arena.amenities && arena.amenities.length > 0 && (
        <View style={styles.amenities}>
          <Text style={styles.amenitiesTitle}>Amenities:</Text>
          <View style={styles.amenitiesList}>
            {arena.amenities.slice(0, 3).map((amenity, index) => (
              <View key={index} style={styles.amenityTag}>
                <Text style={styles.amenityText}>{amenity}</Text>
              </View>
            ))}
            {arena.amenities.length > 3 && (
              <View style={styles.amenityTag}>
                <Text style={styles.amenityText}>+{arena.amenities.length - 3}</Text>
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
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => onEdit(arena)}
        >
          <Ionicons name="create-outline" size={16} color="#2196F3" />
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.detailsButton]}
          onPress={() => onViewDetails(arena)}
        >
          <Ionicons name="information-circle-outline" size={16} color="#4CAF50" />
          <Text style={styles.detailsButtonText}>Details</Text>
        </TouchableOpacity>
      </View>

      {/* Status Indicator */}
      <View style={[styles.statusIndicator, arena.is_active ? styles.activeIndicator : styles.inactiveIndicator]} />
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
    backgroundColor: '#E8F5E8',
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
    color: '#333',
    marginBottom: 2,
  },
  sportText: {
    fontSize: 12,
    color: '#4CAF50',
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