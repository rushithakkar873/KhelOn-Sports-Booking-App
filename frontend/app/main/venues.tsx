import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface Venue {
  id: string;
  name: string;
  sport: string;
  location: string;
  price: number;
  rating: number;
  image?: string;
  facilities: string[];
  availableSlots: string[];
}

export default function VenuesScreen() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [filteredVenues, setFilteredVenues] = useState<Venue[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSport, setSelectedSport] = useState('All');
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const router = useRouter();

  const sports = ['All', 'Badminton', 'Cricket', 'Football', 'Tennis', 'Basketball'];

  useEffect(() => {
    loadVenues();
  }, []);

  useEffect(() => {
    filterVenues();
  }, [searchQuery, selectedSport, venues]);

  const loadVenues = async () => {
    // Mock data - replace with API call
    const mockVenues: Venue[] = [
      {
        id: '1',
        name: 'SportZone Arena',
        sport: 'Badminton',
        location: 'Koramangala, Bangalore',
        price: 800,
        rating: 4.5,
        facilities: ['AC', 'Parking', 'Equipment Rental', 'Changing Room'],
        availableSlots: ['6:00 AM', '7:00 AM', '8:00 PM', '9:00 PM'],
      },
      {
        id: '2',
        name: 'Elite Cricket Ground',
        sport: 'Cricket',
        location: 'Andheri, Mumbai',
        price: 1200,
        rating: 4.8,
        facilities: ['Floodlights', 'Parking', 'Pavilion', 'Scoreboard'],
        availableSlots: ['9:00 AM', '2:00 PM', '6:00 PM'],
      },
      {
        id: '3',
        name: 'Champions Football Club',
        sport: 'Football',
        location: 'Connaught Place, Delhi',
        price: 1000,
        rating: 4.3,
        facilities: ['Artificial Turf', 'Floodlights', 'Changing Room'],
        availableSlots: ['7:00 AM', '8:00 AM', '7:00 PM', '8:00 PM'],
      },
      {
        id: '4',
        name: 'Ace Tennis Club',
        sport: 'Tennis',
        location: 'Banjara Hills, Hyderabad',
        price: 600,
        rating: 4.2,
        facilities: ['Hard Court', 'Equipment Rental', 'Coaching'],
        availableSlots: ['6:00 AM', '7:00 AM', '6:00 PM', '7:00 PM'],
      },
      {
        id: '5',
        name: 'Hoops Basketball Arena',
        sport: 'Basketball',
        location: 'Electronic City, Bangalore',
        price: 500,
        rating: 4.0,
        facilities: ['Indoor Court', 'AC', 'Sound System'],
        availableSlots: ['8:00 AM', '9:00 AM', '8:00 PM', '9:00 PM'],
      },
    ];
    
    setVenues(mockVenues);
  };

  const filterVenues = () => {
    let filtered = venues;

    if (selectedSport !== 'All') {
      filtered = filtered.filter(venue => venue.sport === selectedSport);
    }

    if (searchQuery.trim()) {
      filtered = filtered.filter(venue =>
        venue.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        venue.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        venue.sport.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredVenues(filtered);
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadVenues();
    setIsRefreshing(false);
  };

  const handleBookVenue = (venueId: string) => {
    router.push(`/booking/venue/${venueId}`);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Find Venues</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => router.push('/venues/add')}
        >
          <Ionicons name="add" size={24} color="#FF6B35" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={20} color="#666666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search venues or locations..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Sports Filter */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.sportsFilter}
        contentContainerStyle={styles.sportsFilterContent}
      >
        {sports.map((sport) => (
          <TouchableOpacity
            key={sport}
            style={[
              styles.sportChip,
              selectedSport === sport && styles.sportChipActive,
            ]}
            onPress={() => setSelectedSport(sport)}
          >
            <Text
              style={[
                styles.sportChipText,
                selectedSport === sport && styles.sportChipTextActive,
              ]}
            >
              {sport}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Venues List */}
      <ScrollView 
        style={styles.venuesList}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {filteredVenues.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="location-outline" size={64} color="#CCCCCC" />
            <Text style={styles.emptyStateText}>No venues found</Text>
            <Text style={styles.emptyStateSubtext}>
              Try adjusting your search or filters
            </Text>
          </View>
        ) : (
          filteredVenues.map((venue) => (
            <TouchableOpacity
              key={venue.id}
              style={styles.venueCard}
              onPress={() => router.push(`/venues/${venue.id}`)}
            >
              <View style={styles.venueImageContainer}>
                <View style={styles.venueImagePlaceholder}>
                  <Ionicons name="location-outline" size={32} color="#FF6B35" />
                </View>
                <View style={styles.venueRatingBadge}>
                  <Ionicons name="star" size={12} color="#FFD700" />
                  <Text style={styles.venueRatingText}>{venue.rating}</Text>
                </View>
              </View>

              <View style={styles.venueDetails}>
                <View style={styles.venueHeader}>
                  <Text style={styles.venueName}>{venue.name}</Text>
                  <View style={styles.venueSportBadge}>
                    <Text style={styles.venueSportText}>{venue.sport}</Text>
                  </View>
                </View>

                <View style={styles.venueLocation}>
                  <Ionicons name="location-outline" size={14} color="#666666" />
                  <Text style={styles.venueLocationText}>{venue.location}</Text>
                </View>

                <View style={styles.venueFacilities}>
                  {venue.facilities.slice(0, 3).map((facility, index) => (
                    <View key={index} style={styles.facilityBadge}>
                      <Text style={styles.facilityText}>{facility}</Text>
                    </View>
                  ))}
                  {venue.facilities.length > 3 && (
                    <Text style={styles.moreFacilities}>
                      +{venue.facilities.length - 3} more
                    </Text>
                  )}
                </View>

                <View style={styles.venueFooter}>
                  <View style={styles.venuePrice}>
                    <Text style={styles.venuePriceText}>₹{venue.price}</Text>
                    <Text style={styles.venuePriceUnit}>/hour</Text>
                  </View>
                  
                  <TouchableOpacity
                    style={styles.bookButton}
                    onPress={() => handleBookVenue(venue.id)}
                  >
                    <Text style={styles.bookButtonText}>Book Now</Text>
                    <Ionicons name="arrow-forward" size={16} color="white" />
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1A1A1A',
    marginLeft: 12,
  },
  sportsFilter: {
    marginBottom: 24,
  },
  sportsFilterContent: {
    paddingLeft: 24,
    paddingRight: 24,
  },
  sportChip: {
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
  },
  sportChipActive: {
    backgroundColor: '#FF6B35',
  },
  sportChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
  },
  sportChipTextActive: {
    color: 'white',
  },
  venuesList: {
    flex: 1,
    paddingHorizontal: 24,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666666',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999999',
    marginTop: 8,
  },
  venueCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
  },
  venueImageContainer: {
    position: 'relative',
  },
  venueImagePlaceholder: {
    height: 120,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  venueRatingBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  venueRatingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1A1A1A',
    marginLeft: 4,
  },
  venueDetails: {
    padding: 16,
  },
  venueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  venueName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
    flex: 1,
    marginRight: 12,
  },
  venueSportBadge: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  venueSportText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  venueLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  venueLocationText: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 4,
  },
  venueFacilities: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: 16,
  },
  facilityBadge: {
    backgroundColor: 'white',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 4,
  },
  facilityText: {
    fontSize: 12,
    color: '#666666',
  },
  moreFacilities: {
    fontSize: 12,
    color: '#FF6B35',
    fontWeight: '600',
  },
  venueFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  venuePrice: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  venuePriceText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  venuePriceUnit: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 4,
  },
  bookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B35',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  bookButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 6,
  },
});