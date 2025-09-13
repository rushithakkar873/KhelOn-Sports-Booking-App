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

interface Tournament {
  id: string;
  name: string;
  sport: string;
  location: string;
  registrationFee: number;
  prizePool: number;
  participantsCount: number;
  maxParticipants: number;
  startDate: string;
  endDate: string;
  status: 'upcoming' | 'live' | 'completed';
  organizer: string;
}

export default function TournamentsScreen() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [filteredTournaments, setFilteredTournaments] = useState<Tournament[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const router = useRouter();

  const statusFilters = ['All', 'Upcoming', 'Live', 'Completed'];

  useEffect(() => {
    loadTournaments();
  }, []);

  useEffect(() => {
    filterTournaments();
  }, [searchQuery, selectedStatus, tournaments]);

  const loadTournaments = async () => {
    // Mock data - replace with API call
    const mockTournaments: Tournament[] = [
      {
        id: '1',
        name: 'Mumbai Cricket Championship',
        sport: 'Cricket',
        location: 'Mumbai, MH',
        registrationFee: 1500,
        prizePool: 50000,
        participantsCount: 12,
        maxParticipants: 16,
        startDate: '2025-02-15',
        endDate: '2025-02-17',
        status: 'upcoming',
        organizer: 'Mumbai Cricket Association',
      },
      {
        id: '2',
        name: 'Bangalore Badminton Open',
        sport: 'Badminton',
        location: 'Bangalore, KA',
        registrationFee: 800,
        prizePool: 25000,
        participantsCount: 24,
        maxParticipants: 32,
        startDate: '2025-02-10',
        endDate: '2025-02-12',
        status: 'live',
        organizer: 'Bangalore Sports Club',
      },
      {
        id: '3',
        name: 'Delhi Football League',
        sport: 'Football',
        location: 'Delhi, DL',
        registrationFee: 2000,
        prizePool: 75000,
        participantsCount: 8,
        maxParticipants: 16,
        startDate: '2025-01-20',
        endDate: '2025-01-25',
        status: 'completed',
        organizer: 'Delhi Football Federation',
      },
      {
        id: '4',
        name: 'Hyderabad Tennis Masters',
        sport: 'Tennis',
        location: 'Hyderabad, TS',
        registrationFee: 1000,
        prizePool: 40000,
        participantsCount: 16,
        maxParticipants: 32,
        startDate: '2025-02-20',
        endDate: '2025-02-22',
        status: 'upcoming',
        organizer: 'Hyderabad Tennis Club',
      },
      {
        id: '5',
        name: 'Weekend Warriors Basketball',
        sport: 'Basketball',
        location: 'Pune, MH',
        registrationFee: 600,
        prizePool: 20000,
        participantsCount: 6,
        maxParticipants: 8,
        startDate: '2025-02-08',
        endDate: '2025-02-09',
        status: 'live',
        organizer: 'Pune Basketball Association',
      },
    ];

    setTournaments(mockTournaments);
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadTournaments();
    setIsRefreshing(false);
  };

  const filterTournaments = () => {
    let filtered = tournaments;

    if (searchQuery) {
      filtered = filtered.filter(tournament =>
        tournament.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tournament.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tournament.sport.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedStatus !== 'All') {
      filtered = filtered.filter(tournament => 
        tournament.status.toLowerCase() === selectedStatus.toLowerCase()
      );
    }

    setFilteredTournaments(filtered);
  };

  const handleTournamentPress = (tournament: Tournament) => {
    Alert.alert('Tournament Selected', `You selected ${tournament.name}`);
    // Navigate to tournament details or registration
  };

  const handleRegister = (tournament: Tournament) => {
    Alert.alert(
      'Register for Tournament',
      `Register for ${tournament.name}?\nRegistration Fee: ₹${tournament.registrationFee}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Register', onPress: () => Alert.alert('Success', 'Registration submitted!') }
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming':
        return '#000000';
      case 'live':
        return '#10b981';
      case 'completed':
        return '#6b7280';
      default:
        return '#6b7280';
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'upcoming':
        return '#f3f4f6';
      case 'live':
        return '#d1fae5';
      case 'completed':
        return '#f3f4f6';
      default:
        return '#f3f4f6';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tournaments</Text>
        <TouchableOpacity 
          style={styles.createButton}
          onPress={() => Alert.alert('Create Tournament', 'Feature coming soon!')}
        >
          <Ionicons name="add" size={20} color="#000000" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={20} color="#9ca3af" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search tournaments..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Status Filters */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        style={styles.filtersContainer}
        contentContainerStyle={styles.filtersContent}
      >
        {statusFilters.map((status) => (
          <TouchableOpacity
            key={status}
            style={[
              styles.filterChip,
              selectedStatus === status && styles.filterChipActive
            ]}
            onPress={() => setSelectedStatus(status)}
          >
            <Text style={[
              styles.filterChipText,
              selectedStatus === status && styles.filterChipTextActive
            ]}>
              {status}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Tournaments List */}
      <ScrollView 
        style={styles.tournamentsList}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
      >
        {filteredTournaments && Array.isArray(filteredTournaments) && filteredTournaments.length > 0 ? (
          filteredTournaments.map((tournament) => (
            <TouchableOpacity
              key={tournament?.id || Math.random()}
              style={styles.tournamentCard}
              onPress={() => handleTournamentPress(tournament)}
            >
            <View style={styles.tournamentHeader}>
              <View style={styles.tournamentTitleSection}>
                <Text style={styles.tournamentName}>{tournament.name}</Text>
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusBgColor(tournament.status) }
                ]}>
                  <Text style={[
                    styles.statusText,
                    { color: getStatusColor(tournament.status) }
                  ]}>
                    {tournament.status.toUpperCase()}
                  </Text>
                </View>
              </View>
              <View style={styles.tournamentIcon}>
                <Ionicons name="trophy" size={24} color="#000000" />
              </View>
            </View>

            <View style={styles.tournamentDetails}>
              <View style={styles.detailRow}>
                <Ionicons name="basketball-outline" size={16} color="#6b7280" />
                <Text style={styles.detailText}>{tournament.sport}</Text>
              </View>
              <View style={styles.detailRow}>
                <Ionicons name="location-outline" size={16} color="#6b7280" />
                <Text style={styles.detailText}>{tournament.location}</Text>
              </View>
              <View style={styles.detailRow}>
                <Ionicons name="person-outline" size={16} color="#6b7280" />
                <Text style={styles.detailText}>{tournament.organizer}</Text>
              </View>
            </View>

            <View style={styles.tournamentMeta}>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Registration Fee</Text>
                <Text style={styles.metaValue}>₹{tournament.registrationFee}</Text>
              </View>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Prize Pool</Text>
                <Text style={styles.metaValue}>₹{tournament.prizePool.toLocaleString()}</Text>
              </View>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Participants</Text>
                <Text style={styles.metaValue}>
                  {tournament.participantsCount}/{tournament.maxParticipants}
                </Text>
              </View>
            </View>

            <View style={styles.tournamentDates}>
              <View style={styles.dateItem}>
                <Ionicons name="calendar-outline" size={14} color="#6b7280" />
                <Text style={styles.dateText}>
                  {new Date(tournament.startDate).toLocaleDateString('en-IN')} - 
                  {new Date(tournament.endDate).toLocaleDateString('en-IN')}
                </Text>
              </View>
            </View>

            {tournament.status === 'upcoming' && (
              <TouchableOpacity 
                style={styles.registerButton}
                onPress={() => handleRegister(tournament)}
              >
                <Text style={styles.registerButtonText}>Register Now</Text>
                <Ionicons name="arrow-forward" size={16} color="#ffffff" />
              </TouchableOpacity>
            )}

            {tournament.status === 'live' && (
              <TouchableOpacity style={styles.liveButton}>
                <Ionicons name="play-circle" size={16} color="#10b981" />
                <Text style={styles.liveButtonText}>Watch Live</Text>
              </TouchableOpacity>
            )}

            {tournament.status === 'completed' && (
              <TouchableOpacity style={styles.resultsButton}>
                <Text style={styles.resultsButtonText}>View Results</Text>
                <Ionicons name="trophy-outline" size={16} color="#6b7280" />
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        ))}

        {filteredTournaments.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="trophy-outline" size={48} color="#9ca3af" />
            <Text style={styles.emptyStateTitle}>No tournaments found</Text>
            <Text style={styles.emptyStateText}>
              Try adjusting your search or filters
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
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
  createButton: {
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
  tournamentsList: {
    flex: 1,
    paddingHorizontal: 24,
  },
  tournamentCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  tournamentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  tournamentTitleSection: {
    flex: 1,
    marginRight: 12,
  },  
  tournamentName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  tournamentIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tournamentDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
  },
  tournamentMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  metaItem: {
    flex: 1,
    alignItems: 'center',
  },
  metaLabel: {
    fontSize: 11,
    color: '#9ca3af',
    marginBottom: 4,
  },
  metaValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  tournamentDates: {
    marginBottom: 16,
  },
  dateItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 6,
  },
  registerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
    paddingVertical: 12,
    borderRadius: 12,
  },
  registerButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginRight: 8,
  },
  liveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#d1fae5',
    paddingVertical: 12,
    borderRadius: 12,
  },
  liveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10b981',
    marginLeft: 8,
  },
  resultsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6',
    paddingVertical: 12,
    borderRadius: 12,
  },
  resultsButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
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