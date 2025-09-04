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
  image?: string;
}

interface Tournament {
  id: string;
  name: string;
  sport: string;
  location: string;
  registrationFee: number;
  participantsCount: number;
  maxParticipants: number;
  startDate: string;
}

export default function HomeScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [nearbyVenues, setNearbyVenues] = useState<Venue[]>([]);
  const [upcomingTournaments, setUpcomingTournaments] = useState<Tournament[]>([]);
  
  const router = useRouter();

  // Mock data - replace with API calls
  useEffect(() => {
    loadHomeData();
  }, []);

  const loadHomeData = async () => {
    // Mock venues
    setNearbyVenues([
      {
        id: '1',
        name: 'SportZone Arena',
        sport: 'Badminton',
        location: 'Bangalore, KA',
        price: 800,
        rating: 4.5,
      },
      {
        id: '2',
        name: 'Elite Cricket Ground',
        sport: 'Cricket',
        location: 'Mumbai, MH',
        price: 1200,
        rating: 4.8,
      },
      {
        id: '3',
        name: 'Champions Football Club',
        sport: 'Football',
        location: 'Delhi, DL',
        price: 1000,
        rating: 4.3,
      },
    ]);

    // Mock tournaments
    setUpcomingTournaments([
      {
        id: '1',
        name: 'City Championship',
        sport: 'Badminton',
        location: 'Bangalore, KA',
        registrationFee: 500,
        participantsCount: 24,
        maxParticipants: 32,
        startDate: '2025-02-15',
      },
      {
        id: '2',
        name: 'Weekend Warriors',
        sport: 'Cricket',
        location: 'Mumbai, MH',
        registrationFee: 1000,
        participantsCount: 12,
        maxParticipants: 16,
        startDate: '2025-02-20',
      },
    ]);
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadHomeData();
    setIsRefreshing(false);
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      // Navigate to venues with search query
      router.push('/main/venues');
    }
  };

  const quickActions = [
    {
      icon: 'search-outline' as const,
      title: 'Find Venues',
      subtitle: 'Discover nearby sports venues',
      color: '#000000',
      onPress: () => router.push('/main/venues'),
    },
    {
      icon: 'add-circle-outline' as const,
      title: 'Create Tournament',
      subtitle: 'Organize your own tournament',
      color: '#2d2d2d',
      onPress: () => router.push('/main/tournaments'),
    },
    {
      icon: 'calendar-outline' as const,
      title: 'Quick Book',
      subtitle: 'Book a slot now',
      color: '#3d3d3d',
      onPress: () => router.push('/main/venues'),
    },
    {
      icon: 'people-outline' as const,
      title: 'Join Community',
      subtitle: 'Connect with players',
      color: '#6b7280',
      onPress: () => Alert.alert('Coming Soon!'),
    },
  ];

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
              <Text style={styles.subtitle}>Welcome to PlayOn</Text>
            </View>
            <TouchableOpacity style={styles.profileButton}>
              <View style={styles.avatar}>
                <Ionicons name="person" size={20} color="#212529" />
              </View>
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
                onSubmitEditing={handleSearch}
              />
            </View>
            <TouchableOpacity style={styles.filterButton}>
              <Ionicons name="options-outline" size={20} color="#ffffff" />
            </TouchableOpacity>
          </View>

          {/* Select your sport */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select your sport</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsContainer}>
              {['Cricket', 'Football', 'Badminton', 'Tennis'].map((sport, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.chip, index === 0 && styles.chipSelected]}
                >
                  <Text style={[styles.chipText, index === 0 && styles.chipTextSelected]}>
                    {sport}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Main Featured Venue Card */}
          <View style={styles.section}>
            <TouchableOpacity style={styles.featuredVenueCard}>
              <ImageBackground
                source={{ uri: 'https://images.unsplash.com/photo-1611630483685-472d017cbb4f' }}
                style={styles.featuredVenueImage}
                imageStyle={styles.featuredVenueImageStyle}
              >
                <View style={styles.featuredVenueOverlay} />
                <View style={styles.featuredVenueContent}>
                  <TouchableOpacity style={styles.favoriteButton}>
                    <Ionicons name="heart-outline" size={20} color="#ffffff" />
                  </TouchableOpacity>
                  <View style={styles.featuredVenueInfo}>
                    <Text style={styles.featuredVenueName}>Elite Sports Arena</Text>
                    <View style={styles.featuredVenueRating}>
                      <Ionicons name="star" size={14} color="#fbbf24" />
                      <Text style={styles.featuredVenueRatingText}>4.8</Text>
                      <Text style={styles.featuredVenueReviews}>143 reviews</Text>
                    </View>
                  </View>
                  <TouchableOpacity style={styles.seeMoreButton}>
                    <Text style={styles.seeMoreText}>See more</Text>
                    <View style={styles.seeMoreArrow}>
                      <Ionicons name="chevron-forward" size={16} color="#212529" />
                    </View>
                  </TouchableOpacity>
                </View>
              </ImageBackground>
            </TouchableOpacity>
          </View>

          {/* Upcoming tournaments */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Upcoming tournaments</Text>
              <TouchableOpacity onPress={() => router.push('/main/tournaments')}>
                <Text style={styles.seeAllText}>See all</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {upcomingTournaments.map((tournament, index) => (
                <TouchableOpacity
                  key={tournament.id}
                  style={styles.tournamentCard}
                  onPress={() => router.push(`/tournaments/${tournament.id}`)}
                >
                  <ImageBackground
                    source={{ 
                      uri: index === 0 
                        ? 'https://images.unsplash.com/photo-1629285483773-6b5cde2171d7'
                        : 'https://images.unsplash.com/photo-1487466365202-1afdb86c764e'
                    }}
                    style={styles.tournamentImage}
                    imageStyle={styles.tournamentImageStyle}
                  >
                    <TouchableOpacity style={styles.tournamentFavorite}>
                      <Ionicons name="heart-outline" size={16} color="#ffffff" />
                    </TouchableOpacity>
                  </ImageBackground>
                  <View style={styles.tournamentInfo}>
                    <Text style={styles.tournamentName} numberOfLines={1}>
                      {tournament.name}
                    </Text>
                    <Text style={styles.tournamentMeta}>
                      5 days • from ₹{tournament.registrationFee}/person
                    </Text>
                    <View style={styles.tournamentRating}>
                      <Ionicons name="star" size={12} color="#fbbf24" />
                      <Text style={styles.tournamentRatingText}>4.6</Text>
                      <Text style={styles.tournamentReviews}>56 reviews</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Add some bottom padding */}
          <View style={{ height: 100 }} />
        </ScrollView>
      </SafeAreaView>

      {/* Bottom Navigation Overlay */}
      <View style={styles.bottomNavContainer}>
        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navItem}>
            <Ionicons name="home" size={20} color="#ffffff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem}>
            <Ionicons name="grid-outline" size={20} color="#ffffff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem}>
            <Ionicons name="heart-outline" size={20} color="#ffffff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem}>
            <Ionicons name="ellipsis-horizontal" size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </View>
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
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '600',
    color: '#212529',
  },
  subtitle: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 4,
  },
  profileButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f6f7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 32,
    gap: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f6f7',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 48,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#212529',
    marginLeft: 12,
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#212529',
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  seeAllText: {
    fontSize: 14,
    color: '#212529',
    fontWeight: '600',
  },
  chipsContainer: {
    marginHorizontal: -24,
    paddingHorizontal: 24,
  },
  chip: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f6f7',
    marginRight: 12,
  },
  chipSelected: {
    backgroundColor: '#212529',
  },
  chipText: {
    fontSize: 14,
    color: '#9ca3af',
    fontWeight: '500',
  },
  chipTextSelected: {
    color: '#ffffff',
  },
  featuredVenueCard: {
    height: 280,
    borderRadius: 20,
    overflow: 'hidden',
  },
  featuredVenueImage: {
    flex: 1,
    justifyContent: 'space-between',
  },
  featuredVenueImageStyle: {
    borderRadius: 20,
  },
  featuredVenueOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 20,
  },
  featuredVenueContent: {
    padding: 20,
    justifyContent: 'space-between',
    flex: 1,
  },
  favoriteButton: {
    alignSelf: 'flex-end',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featuredVenueInfo: {
    alignSelf: 'flex-start',
  },
  featuredVenueName: {
    fontSize: 22,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
  },
  featuredVenueRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featuredVenueRatingText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '500',
    marginLeft: 4,
    marginRight: 8,
  },
  featuredVenueReviews: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  seeMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignSelf: 'flex-start',
  },
  seeMoreText: {
    fontSize: 14,
    color: '#212529',
    fontWeight: '600',
    marginRight: 8,
  },
  seeMoreArrow: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tournamentCard: {
    width: 200,
    marginRight: 16,
  },
  tournamentImage: {
    height: 120,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    padding: 12,
  },
  tournamentImageStyle: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  tournamentFavorite: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tournamentInfo: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  tournamentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 4,
  },
  tournamentMeta: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 8,
  },
  tournamentRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tournamentRatingText: {
    fontSize: 12,
    color: '#212529',
    fontWeight: '500',
    marginLeft: 4,
    marginRight: 8,
  },
  tournamentReviews: {
    fontSize: 12,
    color: '#9ca3af',
  },
  bottomNavContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingBottom: 34,
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#212529',
    borderRadius: 25,
    paddingVertical: 16,
    paddingHorizontal: 20,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  navItem: {
    padding: 8,
  },
});