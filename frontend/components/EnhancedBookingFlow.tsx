import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  Dimensions,
  StatusBar,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import VenueOwnerService from '../services/venueOwnerService';

const { width } = Dimensions.get('window');
const SLOT_WIDTH = 60;
const SLOT_HEIGHT = 50;

interface EnhancedBookingFlowProps {
  visible: boolean;
  onClose: () => void;
  venues: any[];
  onBookingCreated: () => void;
}

interface BookingData {
  // Step 1 - Booking Basics
  venueId: string;
  venueName: string;
  selectedVenue: any;
  sport: string;
  bookingDate: string;
  selectedDate: Date;
  showDatePicker: boolean;
  
  // Step 2 - Time & Duration
  startTime: string;
  endTime: string;
  duration: number;
  availableSlots: string[];
  selectedSlots: string[];
  
  // Step 3 - Player Details
  playerName: string;
  playerPhone: string;
  totalAmount: number;
  notes: string;
  
  // UI State
  currentStep: number;
  isSubmitting: boolean;
}

interface TimeSlot {
  time: string;
  available: boolean;
  status: 'available' | 'booked' | 'selected' | 'conflict';
  price?: number;
}

const QUICK_DURATION_OPTIONS = [
  { label: '30min', value: 0.5, sports: ['Tennis', 'Badminton'] },
  { label: '1hr', value: 1, sports: ['Tennis', 'Badminton', 'Basketball'] },
  { label: '1.5hr', value: 1.5, sports: ['Football', 'Basketball'] },
  { label: '2hr', value: 2, sports: ['Cricket', 'Football'] },
  { label: '3hr', value: 3, sports: ['Cricket'] },
  { label: '4hr', value: 4, sports: ['Cricket'] },
];

const SPORT_SUGGESTIONS = {
  'Cricket': { defaultDuration: 2, color: '#10b981' },
  'Football': { defaultDuration: 1.5, color: '#3b82f6' },
  'Badminton': { defaultDuration: 1, color: '#f59e0b' },
  'Tennis': { defaultDuration: 1, color: '#ef4444' },
  'Basketball': { defaultDuration: 1.5, color: '#8b5cf6' },
};

export default function EnhancedBookingFlow({ 
  visible, 
  onClose, 
  venues, 
  onBookingCreated 
}: EnhancedBookingFlowProps) {
  const [bookingData, setBookingData] = useState<BookingData>({
    venueId: '',
    venueName: '',
    selectedVenue: null,
    sport: '',
    bookingDate: '',
    selectedDate: new Date(),
    showDatePicker: false,
    startTime: '',
    endTime: '',
    duration: 0,
    availableSlots: [],
    selectedSlots: [],
    playerName: '',
    playerPhone: '',
    totalAmount: 0,
    notes: '',
    currentStep: 1,
    isSubmitting: false,
  });

  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const venueOwnerService = VenueOwnerService.getInstance();

  // Initialize booking data when venues change
  useEffect(() => {
    if (venues.length === 1 && visible) {
      const autoSelectedVenue = venues[0];
      setBookingData(prev => ({
        ...prev,
        venueId: autoSelectedVenue.id,
        venueName: autoSelectedVenue.name,
        selectedVenue: autoSelectedVenue,
        sport: autoSelectedVenue.sports_supported?.[0] || '',
      }));
    }
  }, [venues, visible]);

  // Generate time slots when venue and date are selected
  useEffect(() => {
    if (bookingData.selectedVenue && bookingData.bookingDate) {
      generateTimeSlots();
    }
  }, [bookingData.selectedVenue, bookingData.bookingDate]);

  const generateTimeSlots = async () => {
    if (!bookingData.selectedVenue || !bookingData.bookingDate) return;

    const selectedDate = new Date(bookingData.bookingDate);
    // FIX: Convert JavaScript day (0=Sunday) to backend day (0=Monday)
    const jsDay = selectedDate.getDay();
    const backendDay = jsDay === 0 ? 6 : jsDay - 1; // Sunday(0) -> 6, Monday(1) -> 0, etc.
    
    const venue = bookingData.selectedVenue;
    
    // DEBUG: Log venue data and date info
    console.log('=== SLOT GENERATION DEBUG ===');
    console.log('Selected Date:', bookingData.bookingDate);
    console.log('JavaScript Day:', jsDay, ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][jsDay]);
    console.log('Backend Day:', backendDay, ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][backendDay]);
    console.log('Venue:', venue?.name);
    console.log('Venue Slots:', venue?.slots);
    
    if (!venue.slots || !Array.isArray(venue.slots)) {
      console.log('❌ No venue slots array found');
      setTimeSlots([]);
      return;
    }

    // Find slots for selected day with correct day conversion
    const daySlots = venue.slots.filter((slot: any) => {
      console.log(`Checking slot day_of_week: ${slot.day_of_week}, looking for: ${backendDay}`);
      return slot.day_of_week === backendDay;
    });
    
    console.log('Filtered Day Slots:', daySlots);
    
    if (daySlots.length === 0) {
      console.log(`❌ No slots found for day ${backendDay} (${['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][backendDay]})`);
      
      // Show helpful message to user
      setTimeSlots([]);
      
      // Don't return here, let's also try to find ANY slots for debugging
      console.log('All available venue slots for debugging:');
      venue.slots.forEach((slot: any, index: number) => {
        const dayName = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][slot.day_of_week] || 'Unknown';
        console.log(`  Slot ${index}: Day ${slot.day_of_week} (${dayName}), ${slot.start_time}-${slot.end_time}`);
      });
      
      return;
    }

    // Get existing bookings for conflict detection
    let existingBookings: any[] = [];
    try {
      existingBookings = await venueOwnerService.getBookings(
        venue.id, 
        undefined, // status
        bookingData.bookingDate, 
        bookingData.bookingDate
      );
      console.log('Existing bookings:', existingBookings.length);
    } catch (error) {
      console.warn('Could not fetch existing bookings for conflict detection:', error);
    }
    
    const generatedSlots: TimeSlot[] = [];
    
    daySlots.forEach((slot: any) => {
      console.log(`Processing slot: ${slot.start_time} - ${slot.end_time}`);
      
      // FIX: Handle time parsing more robustly
      const startParts = slot.start_time.split(':');
      const endParts = slot.end_time.split(':');
      const startHour = parseInt(startParts[0]);
      const startMin = parseInt(startParts[1]) || 0;
      const endHour = parseInt(endParts[0]);
      const endMin = parseInt(endParts[1]) || 0;
      
      // Generate 30-minute slots within the slot timeframe
      let currentHour = startHour;
      let currentMin = startMin;
      
      while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
        const timeSlot = `${currentHour.toString().padStart(2, '0')}:${currentMin.toString().padStart(2, '0')}`;
        
        // Check if this time slot conflicts with existing bookings
        const hasConflict = existingBookings.some(booking => {
          if (booking.status === 'cancelled') return false;
          
          const bookingStart = booking.start_time;
          const bookingEnd = booking.end_time;
          
          // Check if current slot falls within any existing booking
          return timeSlot >= bookingStart && timeSlot < bookingEnd;
        });
        
        generatedSlots.push({
          time: timeSlot,
          available: !hasConflict,
          status: hasConflict ? 'booked' : 'available',
          price: slot.price_per_hour ? (slot.price_per_hour / 2) : (venue.base_price_per_hour / 2), // 30-min slot price
        });
        
        // Increment by 30 minutes
        currentMin += 30;
        if (currentMin >= 60) {
          currentMin = 0;
          currentHour++;
        }
      }
    });

    console.log('Generated slots:', generatedSlots.length);
    console.log('Generated time slots:', generatedSlots.map(s => s.time));
    
    setTimeSlots(generatedSlots.sort((a, b) => a.time.localeCompare(b.time)));
  };

  const handleStepNavigation = (direction: 'next' | 'back') => {
    if (direction === 'next') {
      if (validateCurrentStep()) {
        setBookingData(prev => ({
          ...prev,
          currentStep: Math.min(prev.currentStep + 1, 3),
        }));
      }
    } else {
      setBookingData(prev => ({
        ...prev,
        currentStep: Math.max(prev.currentStep - 1, 1),
      }));
    }
  };

  const validateCurrentStep = (): boolean => {
    switch (bookingData.currentStep) {
      case 1:
        if (!bookingData.venueId || !bookingData.sport || !bookingData.bookingDate) {
          Alert.alert('Required Fields', 'Please select venue, sport, and date');
          return false;
        }
        return true;
      case 2:
        if (!bookingData.startTime || !bookingData.endTime) {
          Alert.alert('Required Fields', 'Please select time slot');
          return false;
        }
        return true;
      case 3:
        if (!bookingData.playerName.trim() || !bookingData.playerPhone.trim()) {
          Alert.alert('Required Fields', 'Please enter player details');
          return false;
        }
        
        // Validate Indian mobile number
        const mobilePattern = /^\+91[6-9]\d{9}$/;
        let playerMobile = bookingData.playerPhone.trim();
        
        if (playerMobile.match(/^[6-9]\d{9}$/)) {
          playerMobile = `+91${playerMobile}`;
          setBookingData(prev => ({ ...prev, playerPhone: playerMobile }));
        }
        
        if (!mobilePattern.test(playerMobile)) {
          Alert.alert('Invalid Phone', 'Please enter a valid Indian mobile number');
          return false;
        }
        return true;
      default:
        return false;
    }
  };

  const handleVenueSelection = (venue: any) => {
    setBookingData(prev => ({
      ...prev,
      venueId: venue.id,
      venueName: venue.name,
      selectedVenue: venue,
      sport: venue.sports_supported?.[0] || '',
      startTime: '',
      endTime: '',
      selectedSlots: [],
    }));
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setBookingData(prev => ({ ...prev, showDatePicker: false }));
    }
    
    if (selectedDate) {
      setBookingData(prev => ({
        ...prev,
        selectedDate: selectedDate,
        bookingDate: selectedDate.toISOString().split('T')[0],
        showDatePicker: Platform.OS === 'ios' ? false : prev.showDatePicker,
        startTime: '',
        endTime: '',
        selectedSlots: [],
      }));
    }
  };

  const handleQuickDuration = (duration: number) => {
    if (!bookingData.startTime) {
      Alert.alert('Select Start Time', 'Please select a start time first');
      return;
    }

    const startIndex = timeSlots.findIndex(slot => slot.time === bookingData.startTime);
    if (startIndex === -1) return;

    const slotsNeeded = duration * 2; // 30-minute slots
    const endIndex = startIndex + slotsNeeded - 1;

    if (endIndex >= timeSlots.length) {
      Alert.alert('Duration Too Long', 'Selected duration extends beyond available hours');
      return;
    }

    // FIX: Validate that all required slots are available
    const requiredSlots = timeSlots.slice(startIndex, endIndex + 1);
    const hasBookedSlot = requiredSlots.some(slot => slot.status === 'booked');
    
    if (hasBookedSlot) {
      Alert.alert('Slots Unavailable', 'Some time slots in the selected duration are already booked. Please choose a different time or duration.');
      return;
    }

    const endTime = timeSlots[endIndex + 1]?.time || timeSlots[endIndex].time;
    const selectedSlots = requiredSlots.map(slot => slot.time);

    setBookingData(prev => ({
      ...prev,
      endTime,
      duration,
      selectedSlots,
      totalAmount: calculateTotalAmount(selectedSlots.length),
    }));

    updateTimeSlotSelection(startIndex, endIndex);
  };

  const handleTimeSlotPress = (slotIndex: number) => {
    const slot = timeSlots[slotIndex];
    
    // FIX: Don't allow selecting booked slots
    if (slot.status === 'booked') {
      Alert.alert('Slot Unavailable', 'This time slot is already booked. Please select an available slot.');
      return;
    }
    
    if (!bookingData.startTime) {
      // Set start time
      setBookingData(prev => ({
        ...prev,
        startTime: slot.time,
        selectedSlots: [slot.time],
        endTime: '', // Reset end time when selecting new start
        duration: 0,
        totalAmount: 0,
      }));
      updateTimeSlotSelection(slotIndex, slotIndex);
    } else if (slotIndex > timeSlots.findIndex(s => s.time === bookingData.startTime)) {
      // Set end time - validate contiguous available slots
      const startIndex = timeSlots.findIndex(s => s.time === bookingData.startTime);
      const selectedSlots = timeSlots.slice(startIndex, slotIndex + 1);
      
      // FIX: Check if all slots in range are available
      const hasBookedSlot = selectedSlots.some(s => s.status === 'booked');
      if (hasBookedSlot) {
        Alert.alert('Invalid Selection', 'Cannot book across unavailable time slots. Please select a continuous available time range.');
        return;
      }
      
      const selectedSlotTimes = selectedSlots.map(s => s.time);
      const duration = selectedSlotTimes.length * 0.5;
      
      // FIX: Calculate proper end time (add 30 minutes to last slot)
      const lastSlotParts = slot.time.split(':');
      const lastHour = parseInt(lastSlotParts[0]);
      const lastMin = parseInt(lastSlotParts[1]);
      const endHour = lastMin === 30 ? lastHour + 1 : lastHour;
      const endMin = lastMin === 30 ? 0 : lastMin + 30;
      const endTime = `${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}`;
      
      setBookingData(prev => ({
        ...prev,
        endTime,
        duration,
        selectedSlots: selectedSlotTimes,
        totalAmount: calculateTotalAmount(selectedSlotTimes.length),
      }));
      
      updateTimeSlotSelection(startIndex, slotIndex);
    } else {
      // Reset selection if clicking before start time
      setBookingData(prev => ({
        ...prev,
        startTime: slot.time,
        endTime: '',
        duration: 0,
        selectedSlots: [slot.time],
        totalAmount: 0,
      }));
      updateTimeSlotSelection(slotIndex, slotIndex);
    }
  };

  const updateTimeSlotSelection = (startIndex: number, endIndex: number) => {
    const updatedSlots = timeSlots.map((slot, index) => ({
      ...slot,
      status: (index >= startIndex && index <= endIndex) ? 'selected' as const : 'available' as const,
    }));
    setTimeSlots(updatedSlots);
  };

  const calculateTotalAmount = (slotsCount: number): number => {
    if (!bookingData.selectedVenue) return 0;
    const pricePerSlot = bookingData.selectedVenue.base_price_per_hour ? 
      (bookingData.selectedVenue.base_price_per_hour / 2) : 500;
    return slotsCount * pricePerSlot;
  };

  const handleSubmitBooking = async () => {
    if (!validateCurrentStep()) return;

    // FIX: Additional validation before submission
    if (!bookingData.startTime || !bookingData.endTime) {
      Alert.alert('Invalid Time Selection', 'Please select both start and end time.');
      return;
    }

    if (bookingData.duration <= 0) {
      Alert.alert('Invalid Duration', 'Please select a valid time duration.');
      return;
    }

    if (bookingData.selectedSlots.length === 0) {
      Alert.alert('No Time Slots Selected', 'Please select time slots for the booking.');
      return;
    }

    // FIX: Validate that all selected slots are still available
    const currentlySelectedSlots = timeSlots.filter(slot => 
      bookingData.selectedSlots.includes(slot.time)
    );
    
    const hasBookedSlot = currentlySelectedSlots.some(slot => slot.status === 'booked');
    if (hasBookedSlot) {
      Alert.alert('Slots No Longer Available', 'Some selected time slots are no longer available. Please refresh and try again.');
      return;
    }

    setBookingData(prev => ({ ...prev, isSubmitting: true }));

    try {
      const bookingPayload = {
        venue_id: bookingData.venueId,
        player_mobile: bookingData.playerPhone,
        player_name: bookingData.playerName,
        booking_date: bookingData.bookingDate,
        start_time: bookingData.startTime,
        end_time: bookingData.endTime,
        sport: bookingData.sport,
        notes: bookingData.notes || `Enhanced booking - ${bookingData.duration} hour(s)`,
      };

      console.log('Submitting booking payload:', bookingPayload);

      const response = await venueOwnerService.createBooking(bookingPayload);
      
      Alert.alert(
        'Booking Created Successfully! 🎉',
        `Payment link sent to ${bookingData.playerPhone}\n\nAmount: ₹${response.total_amount}\nSMS Status: ${response.sms_status}\n\nPlayer will receive payment link via SMS.`,
        [
          { text: 'OK', onPress: () => {
            onBookingCreated();
            onClose();
            resetBookingData();
          }}
        ]
      );
    } catch (error: any) {
      console.error('Booking creation error:', error);
      Alert.alert('Error', error.message || 'Failed to create booking. Please check your inputs and try again.');
    } finally {
      setBookingData(prev => ({ ...prev, isSubmitting: false }));
    }
  };

  const resetBookingData = () => {
    setBookingData({
      venueId: '',
      venueName: '',
      selectedVenue: null,
      sport: '',
      bookingDate: '',
      selectedDate: new Date(),
      showDatePicker: false,
      startTime: '',
      endTime: '',
      duration: 0,
      availableSlots: [],
      selectedSlots: [],
      playerName: '',
      playerPhone: '',
      totalAmount: 0,
      notes: '',
      currentStep: 1,
      isSubmitting: false,
    });
    setTimeSlots([]);
  };

  const getSportColor = (sport: string) => {
    return SPORT_SUGGESTIONS[sport as keyof typeof SPORT_SUGGESTIONS]?.color || '#6b7280';
  };

  const getRelevantDurationOptions = () => {
    return QUICK_DURATION_OPTIONS.filter(option => 
      option.sports.includes(bookingData.sport) || option.value <= 2
    );
  };

  const renderProgressBar = () => (
    <View style={styles.progressContainer}>
      <View style={styles.progressBar}>
        {[1, 2, 3].map((step) => (
          <View key={step} style={styles.progressStep}>
            <View style={[
              styles.progressDot,
              bookingData.currentStep >= step && styles.progressDotActive,
            ]}>
              {bookingData.currentStep > step ? (
                <Ionicons name="checkmark" size={12} color="#ffffff" />
              ) : (
                <Text style={[
                  styles.progressDotText,
                  bookingData.currentStep >= step && styles.progressDotTextActive,
                ]}>
                  {step}
                </Text>
              )}
            </View>
            {step < 3 && (
              <View style={[
                styles.progressLine,
                bookingData.currentStep > step && styles.progressLineActive,
              ]} />
            )}
          </View>
        ))}
      </View>
      <View style={styles.progressLabels}>
        <Text style={[styles.progressLabel, bookingData.currentStep === 1 && styles.progressLabelActive]}>
          Basics
        </Text>
        <Text style={[styles.progressLabel, bookingData.currentStep === 2 && styles.progressLabelActive]}>
          Time
        </Text>
        <Text style={[styles.progressLabel, bookingData.currentStep === 3 && styles.progressLabelActive]}>
          Details
        </Text>
      </View>
    </View>
  );

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.stepTitle}>Booking Basics</Text>
        <Text style={styles.stepSubtitle}>Select venue, sport, and date for your booking</Text>

        {/* Venue Selection */}
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Venue *</Text>
          {venues.length === 1 ? (
            <View style={[styles.formInput, styles.disabledInput]}>
              <Text style={styles.disabledInputText}>{bookingData.venueName}</Text>
              <Ionicons name="checkmark-circle" size={20} color="#10b981" />
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.venueSelector}>
              {venues.map((venue) => (
                <TouchableOpacity
                  key={venue.id}
                  style={[
                    styles.venueCard,
                    bookingData.venueId === venue.id && styles.venueCardSelected,
                  ]}
                  onPress={() => handleVenueSelection(venue)}
                >
                  <Text style={[
                    styles.venueCardName,
                    bookingData.venueId === venue.id && styles.venueCardNameSelected,
                  ]}>
                    {venue.name}
                  </Text>
                  <Text style={[
                    styles.venueCardDetails,
                    bookingData.venueId === venue.id && styles.venueCardDetailsSelected,
                  ]}>
                    ₹{venue.base_price_per_hour}/hr
                  </Text>
                  {bookingData.venueId === venue.id && (
                    <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Sport Selection */}
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Sport *</Text>
          {bookingData.selectedVenue?.sports_supported?.length > 1 ? (
            <View style={styles.sportSelector}>
              {bookingData.selectedVenue.sports_supported.map((sport: string) => (
                <TouchableOpacity
                  key={sport}
                  style={[
                    styles.sportChip,
                    bookingData.sport === sport && [
                      styles.sportChipSelected,
                      { backgroundColor: getSportColor(sport) }
                    ],
                  ]}
                  onPress={() => setBookingData(prev => ({ ...prev, sport }))}
                >
                  <Text style={[
                    styles.sportChipText,
                    bookingData.sport === sport && styles.sportChipTextSelected,
                  ]}>
                    {sport}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={[styles.formInput, styles.disabledInput]}>
              <Text style={styles.disabledInputText}>
                {bookingData.sport || 'Select venue first'}
              </Text>
            </View>
          )}
        </View>

        {/* Date Selection */}
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Booking Date *</Text>
          <TouchableOpacity
            style={styles.dateSelector}
            onPress={() => setBookingData(prev => ({ ...prev, showDatePicker: true }))}
          >
            <View style={styles.dateSelectorContent}>
              <Ionicons name="calendar-outline" size={20} color="#9ca3af" />
              <Text style={[
                styles.dateSelectorText,
                !bookingData.bookingDate && styles.datePlaceholder
              ]}>
                {bookingData.bookingDate ? 
                  new Date(bookingData.bookingDate).toLocaleDateString('en-IN', {
                    weekday: 'short',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  }) : 
                  'Select date'
                }
              </Text>
              <Ionicons name="chevron-down" size={16} color="#9ca3af" />
            </View>
          </TouchableOpacity>
          
          {bookingData.showDatePicker && (
            <View style={styles.datePickerContainer}>
              <DateTimePicker
                value={bookingData.selectedDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                minimumDate={new Date()}
                maximumDate={new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)}
                onChange={handleDateChange}
                style={styles.datePicker}
              />
              {Platform.OS === 'ios' && (
                <View style={styles.datePickerActions}>
                  <TouchableOpacity
                    style={[styles.datePickerButton, styles.datePickerCancel]}
                    onPress={() => setBookingData(prev => ({ ...prev, showDatePicker: false }))}
                  >
                    <Text style={styles.datePickerCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.datePickerButton, styles.datePickerConfirm]}
                    onPress={() => setBookingData(prev => ({ ...prev, showDatePicker: false }))}
                  >
                    <Text style={styles.datePickerConfirmText}>Done</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Smart Suggestions */}
        {bookingData.sport && SPORT_SUGGESTIONS[bookingData.sport as keyof typeof SPORT_SUGGESTIONS] && (
          <View style={[styles.suggestionCard, { borderColor: getSportColor(bookingData.sport) }]}>
            <Ionicons name="bulb-outline" size={20} color={getSportColor(bookingData.sport)} />
            <View style={styles.suggestionContent}>
              <Text style={[styles.suggestionTitle, { color: getSportColor(bookingData.sport) }]}>
                {bookingData.sport} Suggestion
              </Text>
              <Text style={styles.suggestionText}>
                Typical duration: {SPORT_SUGGESTIONS[bookingData.sport as keyof typeof SPORT_SUGGESTIONS].defaultDuration} hour(s)
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );

  const renderTimeSlot = (slot: TimeSlot, index: number) => {
    const isSelected = bookingData.selectedSlots.includes(slot.time);
    const isStart = slot.time === bookingData.startTime;
    const isEnd = index === timeSlots.findIndex(s => s.time === bookingData.endTime) - 1;

    return (
      <TouchableOpacity
        key={slot.time}
        style={[
          styles.timeSlot,
          slot.status === 'available' && styles.timeSlotAvailable,
          slot.status === 'selected' && styles.timeSlotSelected,
          slot.status === 'booked' && styles.timeSlotBooked,
          isStart && styles.timeSlotStart,
          isEnd && styles.timeSlotEnd,
        ]}
        onPress={() => handleTimeSlotPress(index)}
        disabled={slot.status === 'booked'}
      >
        <Text style={[
          styles.timeSlotText,
          slot.status === 'selected' && styles.timeSlotTextSelected,
          slot.status === 'booked' && styles.timeSlotTextBooked,
        ]}>
          {slot.time}
        </Text>
        {slot.status === 'booked' && (
          <Ionicons name="lock-closed" size={12} color="#ef4444" />
        )}
      </TouchableOpacity>
    );
  };

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.stepTitle}>Time & Duration</Text>
        <Text style={styles.stepSubtitle}>Select your preferred time slots</Text>

        {/* No Slots Available Message */}
        {timeSlots.length === 0 ? (
          <View style={styles.noSlotsContainer}>
            <Ionicons name="calendar-outline" size={64} color="#9ca3af" />
            <Text style={styles.noSlotsTitle}>No Available Slots</Text>
            <Text style={styles.noSlotsText}>
              No time slots are available for {bookingData.sport} at {bookingData.venueName} on{'\n'}
              {new Date(bookingData.bookingDate).toLocaleDateString('en-IN', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </Text>
            <Text style={styles.noSlotsSubtext}>
              Please try a different date or contact the venue owner to add more time slots.
            </Text>
            <TouchableOpacity 
              style={styles.backToStep1Button}
              onPress={() => setBookingData(prev => ({ ...prev, currentStep: 1 }))}
            >
              <Ionicons name="chevron-back" size={20} color="#3b82f6" />
              <Text style={styles.backToStep1Text}>Choose Different Date</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Quick Duration Options */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Quick Duration</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.durationSelector}>
                {getRelevantDurationOptions().map((option) => (
                  <TouchableOpacity
                    key={option.label}
                    style={[
                      styles.durationChip,
                      bookingData.duration === option.value && styles.durationChipSelected,
                    ]}
                    onPress={() => handleQuickDuration(option.value)}
                  >
                    <Text style={[
                      styles.durationChipText,
                      bookingData.duration === option.value && styles.durationChipTextSelected,
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              {!bookingData.startTime && (
                <Text style={styles.durationHint}>
                  👆 First, select a start time from the timeline below, then choose duration
                </Text>
              )}
            </View>

            {/* Visual Timeline */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Available Time Slots</Text>
              <View style={styles.timelineContainer}>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  style={styles.timeline}
                  contentContainerStyle={styles.timelineContent}
                >
                  {timeSlots.map((slot, index) => renderTimeSlot(slot, index))}
                </ScrollView>
              </View>
              
              {/* Legend */}
              <View style={styles.legend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, styles.legendAvailable]} />
                  <Text style={styles.legendText}>Available</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, styles.legendSelected]} />
                  <Text style={styles.legendText}>Selected</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, styles.legendBooked]} />
                  <Text style={styles.legendText}>Booked</Text>
                </View>
              </View>
              
              {/* Instructions */}
              <View style={styles.instructionsCard}>
                <Text style={styles.instructionsText}>
                  📝 Tap on a time slot to select start time, then tap another slot to set end time, or use quick duration buttons above.
                </Text>
              </View>
            </View>

            {/* Selection Summary */}
            {bookingData.startTime && bookingData.endTime && (
              <View style={styles.selectionSummary}>
                <View style={styles.summaryCard}>
                  <View style={styles.summaryHeader}>
                    <Ionicons name="time-outline" size={24} color="#3b82f6" />
                    <Text style={styles.summaryTitle}>Selected Time</Text>
                  </View>
                  <Text style={styles.summaryTime}>
                    {bookingData.startTime} - {bookingData.endTime}
                  </Text>
                  <Text style={styles.summaryDuration}>
                    Duration: {bookingData.duration} hour{bookingData.duration !== 1 ? 's' : ''}
                  </Text>
                  <View style={styles.summaryAmount}>
                    <Text style={styles.summaryAmountLabel}>Total Amount:</Text>
                    <Text style={styles.summaryAmountValue}>₹{bookingData.totalAmount}</Text>
                  </View>
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.stepTitle}>Player Details</Text>
        <Text style={styles.stepSubtitle}>Enter customer information and confirm booking</Text>

        {/* Player Information */}
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Player Name *</Text>
          <TextInput
            style={styles.formInput}
            value={bookingData.playerName}
            onChangeText={(text) => setBookingData(prev => ({ ...prev, playerName: text }))}
            placeholder="Enter player name"
            placeholderTextColor="#9ca3af"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Phone Number *</Text>
          <TextInput
            style={styles.formInput}
            value={bookingData.playerPhone}
            onChangeText={(text) => setBookingData(prev => ({ ...prev, playerPhone: text }))}
            placeholder="+91XXXXXXXXXX"
            placeholderTextColor="#9ca3af"
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Notes (Optional)</Text>
          <TextInput
            style={[styles.formInput, styles.notesInput]}
            value={bookingData.notes}
            onChangeText={(text) => setBookingData(prev => ({ ...prev, notes: text }))}
            placeholder="Add any special instructions..."
            placeholderTextColor="#9ca3af"
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Booking Summary */}
        <View style={styles.bookingSummary}>
          <Text style={styles.summaryTitle}>Booking Summary</Text>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Venue:</Text>
            <Text style={styles.summaryValue}>{bookingData.venueName}</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Sport:</Text>
            <Text style={styles.summaryValue}>{bookingData.sport}</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Date:</Text>
            <Text style={styles.summaryValue}>
              {new Date(bookingData.bookingDate).toLocaleDateString('en-IN', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Time:</Text>
            <Text style={styles.summaryValue}>
              {bookingData.startTime} - {bookingData.endTime}
            </Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Duration:</Text>
            <Text style={styles.summaryValue}>{bookingData.duration} hours</Text>
          </View>
          
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total Amount:</Text>
            <Text style={styles.totalValue}>₹{bookingData.totalAmount}</Text>
          </View>
        </View>

        {/* Action Info */}
        <View style={styles.actionInfo}>
          <Ionicons name="information-circle" size={24} color="#3b82f6" />
          <View style={styles.actionInfoContent}>
            <Text style={styles.actionInfoTitle}>What happens next?</Text>
            <Text style={styles.actionInfoText}>
              • Payment link will be sent to player's mobile{'\n'}
              • Player receives SMS with booking details{'\n'}
              • Booking confirmed once payment is completed
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.headerButton}>
            <Ionicons name="close" size={24} color="#6b7280" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Booking</Text>
        </View>

        {/* Progress Bar */}
        {renderProgressBar()}

        {/* Step Content */}
        <KeyboardAvoidingView 
          style={styles.content}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.stepWrapper}>
            {bookingData.currentStep === 1 && renderStep1()}
            {bookingData.currentStep === 2 && renderStep2()}
            {bookingData.currentStep === 3 && renderStep3()}
          </View>
        </KeyboardAvoidingView>

        {/* Navigation Footer */}
        <View style={styles.footer}>
          {bookingData.currentStep > 1 && (
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => handleStepNavigation('back')}
            >
              <Ionicons name="chevron-back" size={20} color="#6b7280" />
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          )}
          
          <View style={styles.footerSpacer} />
          
          {bookingData.currentStep < 3 ? (
            <TouchableOpacity
              style={styles.nextButton}
              onPress={() => handleStepNavigation('next')}
            >
              <Text style={styles.nextButtonText}>Next</Text>
              <Ionicons name="chevron-forward" size={20} color="#ffffff" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.submitButton, bookingData.isSubmitting && styles.submitButtonDisabled]}
              onPress={handleSubmitBooking}
              disabled={bookingData.isSubmitting}
            >
              <Text style={styles.submitButtonText}>
                {bookingData.isSubmitting ? 'Creating...' : 'Create Booking'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    </Modal>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    flex: 1,
    textAlign: 'center',
    marginRight: 40, // Compensate for left button to center the title
  },
  progressContainer: {
    paddingHorizontal: 40,
    paddingVertical: 20,
    backgroundColor: '#f8fafc',
  },
  progressBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  progressStep: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressDotActive: {
    backgroundColor: '#212529',
  },
  progressDotText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9ca3af',
  },
  progressDotTextActive: {
    color: '#ffffff',
  },
  progressLine: {
    width: 40,
    height: 2,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 8,
  },
  progressLineActive: {
    backgroundColor: '#212529',
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 0,
    marginTop: 8,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9ca3af',
    textAlign: 'center',
    flex: 1,
  },
  progressLabelActive: {
    color: '#212529',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  stepWrapper: {
    flex: 1,
  },
  stepContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  stepContent: {
    flex: 1,
    paddingTop: 20,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#212529',
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 32,
  },
  formGroup: {
    marginBottom: 24,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#212529',
    backgroundColor: '#f9fafb',
  },
  disabledInput: {
    backgroundColor: '#f1f5f9',
    borderColor: '#cbd5e1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  disabledInputText: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
    flex: 1,
  },
  notesInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  venueSelector: {
    flexDirection: 'row',
  },
  venueCard: {
    backgroundColor: '#f8fafc',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    minWidth: 140,
    alignItems: 'center',
  },
  venueCardSelected: {
    backgroundColor: '#eff6ff',
    borderColor: '#3b82f6',
  },
  venueCardName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
    marginBottom: 4,
  },
  venueCardNameSelected: {
    color: '#1e40af',
  },
  venueCardDetails: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 8,
  },
  venueCardDetailsSelected: {
    color: '#3730a3',
  },
  sportSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sportChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
  },
  sportChipSelected: {
    borderColor: 'transparent',
  },
  sportChipText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  sportChipTextSelected: {
    color: '#ffffff',
    fontWeight: '600',
  },
  dateSelector: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    backgroundColor: '#f9fafb',
  },
  dateSelectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  dateSelectorText: {
    fontSize: 16,
    color: '#374151',
    flex: 1,
    marginLeft: 12,
  },
  datePlaceholder: {
    color: '#9ca3af',
  },
  datePickerContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
  },
  datePicker: {
    backgroundColor: '#ffffff',
  },
  datePickerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#f8fafc',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  datePickerButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  datePickerCancel: {
    backgroundColor: '#f1f5f9',
  },
  datePickerConfirm: {
    backgroundColor: '#3b82f6',
  },
  datePickerCancelText: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
  },
  datePickerConfirmText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
  },
  suggestionCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    marginTop: 8,
  },
  suggestionContent: {
    flex: 1,
    marginLeft: 12,
  },
  suggestionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  suggestionText: {
    fontSize: 13,
    color: '#6b7280',
  },
  durationSelector: {
    flexDirection: 'row',
  },
  durationChip: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
  },
  durationChipSelected: {
    backgroundColor: '#212529',
    borderColor: '#212529',
  },
  durationChipText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  durationChipTextSelected: {
    color: '#ffffff',
    fontWeight: '600',
  },
  timelineContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  timeline: {
    flexGrow: 0,
  },
  timelineContent: {
    paddingRight: 16,
  },
  timeSlot: {
    width: SLOT_WIDTH,
    height: SLOT_HEIGHT,
    borderRadius: 8,
    marginRight: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  timeSlotAvailable: {
    backgroundColor: '#ffffff',
    borderColor: '#d1d5db',
  },
  timeSlotSelected: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  timeSlotBooked: {
    backgroundColor: '#fee2e2',
    borderColor: '#fca5a5',
  },
  timeSlotStart: {
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  timeSlotEnd: {
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
  },
  timeSlotText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#374151',
  },
  timeSlotTextSelected: {
    color: '#ffffff',
  },
  timeSlotTextBooked: {
    color: '#ef4444',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
    gap: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendAvailable: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  legendSelected: {
    backgroundColor: '#3b82f6',
  },
  legendBooked: {
    backgroundColor: '#fee2e2',
  },
  legendText: {
    fontSize: 12,
    color: '#6b7280',
  },
  selectionSummary: {
    marginTop: 24,
  },
  summaryCard: {
    backgroundColor: '#eff6ff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e40af',
    marginLeft: 8,
  },
  summaryTime: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e40af',
    marginBottom: 8,
  },
  summaryDuration: {
    fontSize: 14,
    color: '#3730a3',
    marginBottom: 12,
  },
  summaryAmount: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#bfdbfe',
  },
  summaryAmountLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e40af',
  },
  summaryAmountValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#059669',
  },
  bookingSummary: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
    flex: 1,
  },
  summaryValue: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '600',
    flex: 2,
    textAlign: 'right',
  },
  totalRow: {
    borderBottomWidth: 0,
    paddingTop: 12,
    marginTop: 8,
    borderTopWidth: 2,
    borderTopColor: '#e2e8f0',
  },
  totalLabel: {
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '700',
    flex: 1,
  },
  totalValue: {
    fontSize: 18,
    color: '#059669',
    fontWeight: '800',
    flex: 2,
    textAlign: 'right',
  },
  actionInfo: {
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  actionInfoContent: {
    flex: 1,
    marginLeft: 12,
  },
  actionInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 8,
  },
  actionInfoText: {
    fontSize: 14,
    color: '#1e40af',
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    backgroundColor: '#ffffff',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
  },
  backButtonText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
    marginLeft: 4,
  },
  footerSpacer: {
    flex: 1,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#212529',
  },
  nextButtonText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
    marginRight: 4,
  },
  submitButton: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#059669',
    minWidth: 140,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  submitButtonText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
  },
});