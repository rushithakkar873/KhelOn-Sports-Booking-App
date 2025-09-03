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
      // Navigate to search results
      router.push(`/search?query=${encodeURIComponent(searchQuery)}`);
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
      onPress: () => router.push('/tournaments/create'),
    },
    {
      icon: 'calendar-outline' as const,
      title: 'Quick Book',
      subtitle: 'Book a slot now',
      color: '#3d3d3d',
      onPress: () => router.push('/booking/quick'),
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
    <SafeAreaView style={styles.container}>
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
            <Text style={styles.greeting}>Good morning!</Text>
            <Text style={styles.userName}>Ready to play?</Text>
          </View>
          <TouchableOpacity 
            style={styles.notificationButton}
            onPress={() => Alert.alert('Notifications', 'No new notifications')}
          >
            <Ionicons name="notifications-outline" size={24} color="#000000" />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={20} color="#666666" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search venues, tournaments, sports..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
            />
          </View>
          <TouchableOpacity style={styles.filterButton}>
            <Ionicons name="options-outline" size={20} color="#FF6B35" />
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action, index) => (
              <TouchableOpacity
                key={index}
                style={styles.quickActionCard}
                onPress={action.onPress}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: action.color }]}>
                  <Ionicons name={action.icon} size={24} color="white" />
                </View>
                <Text style={styles.quickActionTitle}>{action.title}</Text>
                <Text style={styles.quickActionSubtitle}>{action.subtitle}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Nearby Venues */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Nearby Venues</Text>
            <TouchableOpacity onPress={() => router.push('/main/venues')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {nearbyVenues.map((venue) => (
              <TouchableOpacity
                key={venue.id}
                style={styles.venueCard}
                onPress={() => router.push(`/venues/${venue.id}`)}
              >
                <View style={styles.venueImagePlaceholder}>
                  <Ionicons name="location-outline" size={32} color="#FF6B35" />
                </View>
                <View style={styles.venueInfo}>
                  <Text style={styles.venueName} numberOfLines={1}>
                    {venue.name}
                  </Text>
                  <Text style={styles.venueLocation} numberOfLines={1}>
                    {venue.location}
                  </Text>
                  <View style={styles.venueDetails}>
                    <Text style={styles.venuePrice}>₹{venue.price}/hr</Text>
                    <View style={styles.venueRating}>
                      <Ionicons name="star" size={12} color="#FFD700" />
                      <Text style={styles.venueRatingText}>{venue.rating}</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Upcoming Tournaments */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Tournaments</Text>
            <TouchableOpacity onPress={() => router.push('/main/tournaments')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          {upcomingTournaments.map((tournament) => (
            <TouchableOpacity
              key={tournament.id}
              style={styles.tournamentCard}
              onPress={() => router.push(`/tournaments/${tournament.id}`)}
            >
              <View style={styles.tournamentIcon}>
                <Ionicons name="trophy-outline" size={24} color="#FF6B35" />
              </View>
              <View style={styles.tournamentInfo}>
                <Text style={styles.tournamentName}>{tournament.name}</Text>
                <Text style={styles.tournamentLocation}>{tournament.location}</Text>
                <View style={styles.tournamentDetails}>
                  <Text style={styles.tournamentFee}>₹{tournament.registrationFee}</Text>
                  <Text style={styles.tournamentParticipants}>
                    {tournament.participantsCount}/{tournament.maxParticipants} joined
                  </Text>
                </View>
              </View>
              <View style={styles.tournamentAction}>
                <Ionicons name="chevron-forward" size={20} color="#666666" />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
    fontSize: 16,
    color: '#666666',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginTop: 4,
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F8F9FA',
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
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 32,
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
    color: '#1A1A1A',
  },
  seeAllText: {
    fontSize: 14,
    color: '#FF6B35',
    fontWeight: '600',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  quickActionCard: {
    width: '47%',
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  quickActionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
    textAlign: 'center',
  },
  quickActionSubtitle: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
  },
  venueCard: {
    width: 200,
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    marginRight: 16,
    overflow: 'hidden',
  },
  venueImagePlaceholder: {
    height: 120,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  venueInfo: {
    padding: 16,
  },
  venueName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  venueLocation: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 12,
  },
  venueDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  venuePrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF6B35',
  },
  venueRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  venueRatingText: {
    fontSize: 12,
    color: '#666666',
    marginLeft: 4,
  },
  tournamentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  tournamentIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  tournamentInfo: {
    flex: 1,
  },
  tournamentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  tournamentLocation: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  tournamentDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tournamentFee: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF6B35',
  },
  tournamentParticipants: {
    fontSize: 12,
    color: '#666666',
  },
  tournamentAction: {
    marginLeft: 8,
  },
});