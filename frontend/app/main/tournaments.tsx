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
  participantsCount: number;
  maxParticipants: number;
  startDate: string;
  endDate: string;
  organizerName: string;
  status: 'upcoming' | 'ongoing' | 'completed';
  format: string;
}

export default function TournamentsScreen() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [filteredTournaments, setFilteredTournaments] = useState<Tournament[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('upcoming');
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const router = useRouter();

  const statuses = [
    { key: 'upcoming', label: 'Upcoming' },
    { key: 'ongoing', label: 'Live' },
    { key: 'completed', label: 'Completed' },
  ];

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
        name: 'City Championship 2025',
        sport: 'Badminton',
        location: 'Koramangala, Bangalore',
        registrationFee: 500,
        participantsCount: 24,
        maxParticipants: 32,
        startDate: '2025-02-15',
        endDate: '2025-02-16',
        organizerName: 'SportZone Arena',
        status: 'upcoming',
        format: 'Single Elimination',
      },
      {
        id: '2',
        name: 'Weekend Warriors Cup',
        sport: 'Cricket',
        location: 'Andheri, Mumbai',
        registrationFee: 1000,
        participantsCount: 12,
        maxParticipants: 16,
        startDate: '2025-02-20',
        endDate: '2025-02-21',
        organizerName: 'Elite Cricket Ground',
        status: 'upcoming',
        format: 'League + Knockout',
      },
      {
        id: '3',
        name: 'Football Premier League',
        sport: 'Football',
        location: 'Connaught Place, Delhi',
        registrationFee: 2000,
        participantsCount: 8,
        maxParticipants: 8,
        startDate: '2025-01-25',
        endDate: '2025-01-26',
        organizerName: 'Champions FC',
        status: 'ongoing',
        format: 'Round Robin',
      },
      {
        id: '4',
        name: 'Tennis Open 2024',
        sport: 'Tennis',
        location: 'Banjara Hills, Hyderabad',
        registrationFee: 800,
        participantsCount: 16,
        maxParticipants: 16,
        startDate: '2024-12-15',
        endDate: '2024-12-16',
        organizerName: 'Ace Tennis Club',
        status: 'completed',
        format: 'Single Elimination',
      },
      {
        id: '5',
        name: 'Basketball 3v3 Street',
        sport: 'Basketball',
        location: 'Electronic City, Bangalore',
        registrationFee: 300,
        participantsCount: 20,
        maxParticipants: 24,
        startDate: '2025-02-10',
        endDate: '2025-02-10',
        organizerName: 'Hoops Arena',
        status: 'upcoming',
        format: '3v3 Knockout',
      },
    ];
    
    setTournaments(mockTournaments);
  };

  const filterTournaments = () => {
    let filtered = tournaments.filter(tournament => tournament.status === selectedStatus);

    if (searchQuery.trim()) {
      filtered = filtered.filter(tournament =>
        tournament.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tournament.sport.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tournament.location.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredTournaments(filtered);
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadTournaments();
    setIsRefreshing(false);
  };

  const handleJoinTournament = (tournamentId: string) => {
    router.push(`/tournaments/join/${tournamentId}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return '#FF6B35';
      case 'ongoing': return '#4CAF50';
      case 'completed': return '#666666';
      default: return '#666666';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { 
      day: 'numeric', 
      month: 'short' 
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tournaments</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => router.push('/tournaments/create')}
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
            placeholder="Search tournaments..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Status Filter */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.statusFilter}
        contentContainerStyle={styles.statusFilterContent}
      >
        {statuses.map((status) => (
          <TouchableOpacity
            key={status.key}
            style={[
              styles.statusChip,
              selectedStatus === status.key && styles.statusChipActive,
            ]}
            onPress={() => setSelectedStatus(status.key)}
          >
            <Text
              style={[
                styles.statusChipText,
                selectedStatus === status.key && styles.statusChipTextActive,
              ]}
            >
              {status.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Tournaments List */}
      <ScrollView 
        style={styles.tournamentsList}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {filteredTournaments.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="trophy-outline" size={64} color="#CCCCCC" />
            <Text style={styles.emptyStateText}>No tournaments found</Text>
            <Text style={styles.emptyStateSubtext}>
              {selectedStatus === 'upcoming' 
                ? 'Be the first to create a tournament!'
                : 'Check back later for updates'
              }
            </Text>
          </View>
        ) : (
          filteredTournaments.map((tournament) => (
            <TouchableOpacity
              key={tournament.id}
              style={styles.tournamentCard}
              onPress={() => router.push(`/tournaments/${tournament.id}`)}
            >
              <View style={styles.tournamentHeader}>
                <View style={styles.tournamentIcon}>
                  <Ionicons name="trophy-outline" size={24} color="#FF6B35" />
                </View>
                <View 
                  style={[
                    styles.statusBadge, 
                    { backgroundColor: getStatusColor(tournament.status) }
                  ]}
                >
                  <Text style={styles.statusBadgeText}>
                    {tournament.status.toUpperCase()}
                  </Text>
                </View>
              </View>

              <View style={styles.tournamentContent}>
                <Text style={styles.tournamentName}>{tournament.name}</Text>
                
                <View style={styles.tournamentMeta}>
                  <View style={styles.metaItem}>
                    <Ionicons name="fitness-outline" size={16} color="#666666" />
                    <Text style={styles.metaText}>{tournament.sport}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Ionicons name="location-outline" size={16} color="#666666" />
                    <Text style={styles.metaText}>{tournament.location}</Text>
                  </View>
                </View>

                <View style={styles.tournamentDetails}>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Format</Text>
                    <Text style={styles.detailValue}>{tournament.format}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Organizer</Text>
                    <Text style={styles.detailValue}>{tournament.organizerName}</Text>
                  </View>
                </View>

                <View style={styles.tournamentFooter}>
                  <View style={styles.participantsInfo}>
                    <View style={styles.participantsCount}>
                      <Ionicons name="people-outline" size={16} color="#666666" />
                      <Text style={styles.participantsText}>
                        {tournament.participantsCount}/{tournament.maxParticipants}
                      </Text>
                    </View>
                    <Text style={styles.tournamentDate}>
                      {formatDate(tournament.startDate)}
                      {tournament.startDate !== tournament.endDate && 
                        ` - ${formatDate(tournament.endDate)}`
                      }
                    </Text>
                  </View>

                  <View style={styles.tournamentActions}>
                    <View style={styles.feeContainer}>
                      <Text style={styles.feeLabel}>Entry</Text>
                      <Text style={styles.feeAmount}>₹{tournament.registrationFee}</Text>
                    </View>
                    
                    {tournament.status === 'upcoming' && (
                      <TouchableOpacity
                        style={[
                          styles.actionButton,
                          tournament.participantsCount >= tournament.maxParticipants && styles.actionButtonDisabled
                        ]}
                        onPress={() => handleJoinTournament(tournament.id)}
                        disabled={tournament.participantsCount >= tournament.maxParticipants}
                      >
                        <Text style={styles.actionButtonText}>
                          {tournament.participantsCount >= tournament.maxParticipants ? 'Full' : 'Join'}
                        </Text>
                      </TouchableOpacity>
                    )}
                    
                    {tournament.status === 'ongoing' && (
                      <TouchableOpacity style={[styles.actionButton, styles.liveButton]}>
                        <Text style={[styles.actionButtonText, styles.liveButtonText]}>Live</Text>
                      </TouchableOpacity>
                    )}
                    
                    {tournament.status === 'completed' && (
                      <TouchableOpacity style={[styles.actionButton, styles.completedButton]}>
                        <Text style={[styles.actionButtonText, styles.completedButtonText]}>Results</Text>
                      </TouchableOpacity>
                    )}
                  </View>
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
  statusFilter: {
    marginBottom: 24,
  },
  statusFilterContent: {
    paddingLeft: 24,
    paddingRight: 24,
  },
  statusChip: {
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
  },
  statusChipActive: {
    backgroundColor: '#FF6B35',
  },
  statusChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
  },
  statusChipTextActive: {
    color: 'white',
  },
  tournamentsList: {
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
    textAlign: 'center',
  },
  tournamentCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
  },
  tournamentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 0,
  },
  tournamentIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'white',
  },
  tournamentContent: {
    padding: 16,
  },
  tournamentName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  tournamentMeta: {
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  metaText: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 8,
  },
  tournamentDetails: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666666',
  },
  detailValue: {
    fontSize: 14,
    color: '#1A1A1A',
    fontWeight: '600',
  },
  tournamentFooter: {
    gap: 12,
  },
  participantsInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  participantsCount: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  participantsText: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 6,
  },
  tournamentDate: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '600',
  },
  tournamentActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  feeContainer: {
    alignItems: 'flex-start',
  },
  feeLabel: {
    fontSize: 12,
    color: '#666666',
  },
  feeAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  actionButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  actionButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  liveButton: {
    backgroundColor: '#4CAF50',
  },
  liveButtonText: {
    color: 'white',
  },
  completedButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#666666',
  },
  completedButtonText: {
    color: '#666666',
  },
});