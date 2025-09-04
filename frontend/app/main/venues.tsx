import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
  ImageBackground,
  StatusBar,
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
  image: string;
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
    // Mock data with professional venue images
    const mockVenues: Venue[] = [
      {
        id: '1',
        name: 'SportZone Arena',
        sport: 'Badminton',
        location: 'Koramangala, Bangalore',
        price: 800,
        rating: 4.5,
        image: 'https://images.pexels.com/photos/8533631/pexels-photo-8533631.jpeg',
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
        image: 'https://images.unsplash.com/photo-1705593136686-d5f32b611aa9',
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
        image: 'https://images.unsplash.com/photo-1724500760032-b2eb510e59c4',
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
        image: 'https://images.pexels.com/photos/3067481/pexels-photo-3067481.jpeg',
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
        image: 'https://images.pexels.com/photos/7648145/pexels-photo-7648145.jpeg',
        facilities: ['Indoor Court', 'AC', 'Sound System'],
        availableSlots: ['8:00 AM', '9:00 AM', '8:00 PM', '9:00 PM'],
      },
    ];

    setVenues(mockVenues);
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadVenues();
    setIsRefreshing(false);
  };

  const filterVenues = () => {
    let filtered = venues;

    if (searchQuery) {
      filtered = filtered.filter(venue =>
        venue.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        venue.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        venue.sport.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedSport !== 'All') {
      filtered = filtered.filter(venue => venue.sport === selectedSport);
    }

    setFilteredVenues(filtered);
  };

  const handleVenuePress = (venue: Venue) => {
    Alert.alert('Venue Selected', `You selected ${venue.name}`);
    // Navigate to venue details or booking
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView 
          style={styles.scrollView}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>Hello, Player</Text>
              <Text style={styles.subtitle}>Find your next venue</Text>
            </View>
            <TouchableOpacity 
              style={styles.mapButton}
              onPress={() => Alert.alert('Map View', 'Map view coming soon!')}
            >
              <Ionicons name="map-outline" size={20} color="#ffffff" />
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
              <Ionicons name="search-outline" size={20} color="#9ca3af" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search"
                placeholderTextColor="#9ca3af"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
            <TouchableOpacity style={styles.filterButton}>
              <Ionicons name="options-outline" size={20} color="#ffffff" />
            </TouchableOpacity>
          </View>

          {/* Sports Filter */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select your sport</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsContainer}>
              {sports.map((sport, index) => (
                <TouchableOpacity
                  key={sport}
                  style={[
                    styles.chip,
                    selectedSport === sport && styles.chipSelected
                  ]}
                  onPress={() => setSelectedSport(sport)}
                >
                  <Text style={[
                    styles.chipText,
                    selectedSport === sport && styles.chipTextSelected
                  ]}>
                    {sport}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Venues List */}
          <View style={styles.section}>
            {filteredVenues.map((venue, index) => (
              <TouchableOpacity
                key={venue.id}
                style={[styles.venueCard, index === 0 && styles.featuredVenueCard]}
                onPress={() => handleVenuePress(venue)}
              >
                <ImageBackground
                  source={{ uri: venue.image }}
                  style={index === 0 ? styles.featuredVenueImage : styles.venueImage}
                  imageStyle={styles.venueImageStyle}
                >
                  <View style={styles.venueOverlay} />
                  <View style={styles.venueContent}>
                    <TouchableOpacity style={styles.favoriteButton}>
                      <Ionicons name="heart-outline" size={20} color="#ffffff" />
                    </TouchableOpacity>
                    
                    {index === 0 ? (
                      <View style={styles.featuredVenueInfo}>
                        <Text style={styles.featuredVenueName}>{venue.name}</Text>
                        <View style={styles.featuredVenueLocation}>
                          <Ionicons name="location" size={12} color="rgba(255,255,255,0.8)" />
                          <Text style={styles.featuredVenueLocationText}>{venue.location}</Text>
                        </View>
                        <View style={styles.featuredVenueRating}>
                          <Ionicons name="star" size={14} color="#fbbf24" />
                          <Text style={styles.featuredVenueRatingText}>{venue.rating}</Text>
                          <Text style={styles.featuredVenueReviews}>143 reviews</Text>
                        </View>
                      </View>
                    ) : (
                      <View style={styles.regularVenueInfo}>
                        <Text style={styles.regularVenueName}>{venue.name}</Text>
                        <Text style={styles.regularVenueLocation}>{venue.location}</Text>
                        <View style={styles.regularVenueRating}>
                          <Ionicons name="star" size={12} color="#fbbf24" />
                          <Text style={styles.regularVenueRatingText}>{venue.rating}</Text>
                        </View>
                      </View>
                    )}
                    
                    {index === 0 && (
                      <TouchableOpacity style={styles.seeMoreButton}>
                        <Text style={styles.seeMoreText}>See more</Text>
                        <View style={styles.seeMoreArrow}>
                          <Ionicons name="chevron-forward" size={16} color="#212529" />
                        </View>
                      </TouchableOpacity>
                    )}
                  </View>
                </ImageBackground>
                
                {index !== 0 && (
                  <View style={styles.venueDetailsCard}>
                    <Text style={styles.venuePrice}>₹{venue.price}/hr</Text>
                    <Text style={styles.venueSport}>{venue.sport}</Text>
                    <View style={styles.venueFacilities}>
                      {venue.facilities.slice(0, 2).map((facility, fIndex) => (
                        <Text key={fIndex} style={styles.facilityText}>{facility}</Text>
                      ))}
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            ))}

            {filteredVenues.length === 0 && (
              <View style={styles.emptyState}>
                <Ionicons name="search-outline" size={48} color="#9ca3af" />
                <Text style={styles.emptyStateTitle}>No venues found</Text>
                <Text style={styles.emptyStateText}>
                  Try adjusting your search or filters
                </Text>
              </View>
            )}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000000',
  },
  mapButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f3f4f6',
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
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000000',
    marginLeft: 12,
  },
  filtersContainer: {
    marginBottom: 20,
  },
  filtersContent: {
    paddingHorizontal: 24,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    marginRight: 12,
  },
  filterChipActive: {
    backgroundColor: '#000000',
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  filterChipTextActive: {
    color: '#ffffff',
  },
  venuesList: {
    flex: 1,
    paddingHorizontal: 24,
  },
  venueCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 16,
    marginBottom: 20,
    overflow: 'hidden',
  },
  venueImageContainer: {
    position: 'relative',
    height: 160,
  },
  venueImagePlaceholder: {
    flex: 1,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000000',
    marginLeft: 4,
  },
  venueContent: {
    padding: 20,
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
    color: '#000000',
    flex: 1,
    marginRight: 12,
  },
  venuePrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
  },
  venueLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  venueLocationText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 4,
  },
  venueSport: {
    marginBottom: 12,
  },
  venueSportText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2d2d2d',
  },
  venueFacilities: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: 12,
  },
  facilityTag: {
    backgroundColor: '#e5e7eb',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 6,
    marginBottom: 4,
  },
  facilityTagText: {
    fontSize: 11,
    color: '#374151',
    fontWeight: '500',
  },
  moreFacilities: {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: '500',
  },
  venueSlots: {
    marginBottom: 16,
  },
  slotsLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 6,
  },
  slotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  slotTime: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000000',
    backgroundColor: '#e5e7eb',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 6,
  },
  moreSlots: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  bookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
    paddingVertical: 12,
    borderRadius: 12,
  },
  bookButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginRight: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
});