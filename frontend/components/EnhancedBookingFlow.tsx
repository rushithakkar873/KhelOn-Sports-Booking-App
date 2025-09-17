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
import AuthService from '@/services/authService';

const { width } = Dimensions.get('window');

// Time period definitions
const TIME_PERIODS = [
  { 
    key: 'morning', 
    label: '🌅 Morning', 
    startHour: 6, 
    endHour: 12,
    color: '#f59e0b' 
  },
  { 
    key: 'afternoon', 
    label: '☀️ Afternoon', 
    startHour: 12, 
    endHour: 18,
    color: '#3b82f6' 
  },
  { 
    key: 'evening', 
    label: '🌙 Evening', 
    startHour: 18, 
    endHour: 24,
    color: '#8b5cf6' 
  },
  { 
    key: 'latenight', 
    label: '🌃 Late Night', 
    startHour: 0, 
    endHour: 6,
    color: '#1f2937' 
  },
];

interface EnhancedBookingFlowProps {
  visible: boolean;
  onClose: () => void;
  venues: any[];
  onBookingCreated: () => void;
}

interface BookingData {
  // Selection data
  venueId: string;
  venueName: string;
  selectedVenue: any;
  sport: string;
  bookingDate: string;
  selectedTimePeriod: string;
  selectedTimeSlot: string;
  
  // Player details
  playerName: string;
  playerPhone: string;
  notes: string;
  
  // Calculated fields
  startTime: string;
  endTime: string;
  duration: number;
  totalAmount: number;
  
  // UI State
  currentStep: number;
  isSubmitting: boolean;
  isLoadingSlots: boolean;
}

interface TimeSlot {
  time: string;
  endTime: string;
  price: number;
  available: boolean;
}

interface DateOption {
  date: string;
  displayDate: string;
  dayName: string;
  isToday: boolean;
  isTomorrow: boolean;
}

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
    selectedTimePeriod: 'morning', // Default to morning
    selectedTimeSlot: '',
    playerName: '',
    playerPhone: '',
    notes: '',
    startTime: '',
    endTime: '',
    duration: 1, // 1 hour slots
    totalAmount: 0,
    currentStep: 1,
    isSubmitting: false,
    isLoadingSlots: false,
  });

  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [dateOptions, setDateOptions] = useState<DateOption[]>([]);
  const venueOwnerService = VenueOwnerService.getInstance();

  // Initialize date options (7 days from today)
  useEffect(() => {
    const dates: DateOption[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      const dateString = date.toISOString().split('T')[0];
      
      dates.push({
        date: dateString,
        displayDate: date.getDate().toString(),
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
        isToday: i === 0,
        isTomorrow: i === 1,
      });
    }
    setDateOptions(dates);
    
    // Auto-select today's date
    setBookingData(prev => ({
      ...prev,
      bookingDate: dates[0].date,
    }));
  }, [visible]);

  // Auto-select venue if only one available
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

  // Generate time slots when venue, date, or time period changes
  useEffect(() => {
    if (bookingData.selectedVenue && bookingData.bookingDate && bookingData.selectedTimePeriod) {
      generateAvailableTimeSlots();
    }
  }, [bookingData.selectedVenue, bookingData.bookingDate, bookingData.selectedTimePeriod]);

  const generateAvailableTimeSlots = async () => {
    if (!bookingData.selectedVenue || !bookingData.bookingDate || !bookingData.selectedTimePeriod) return;

    setBookingData(prev => ({ ...prev, isLoadingSlots: true }));

    try {
      const selectedDate = new Date(bookingData.bookingDate);
      // Convert JavaScript day (0=Sunday) to backend day (0=Monday)
      const jsDay = selectedDate.getDay();
      const backendDay = jsDay === 0 ? 6 : jsDay - 1;
      
      const venue = bookingData.selectedVenue;
      
      console.log('=== GENERATING 1-HOUR SLOTS ===');
      console.log('Selected Date:', bookingData.bookingDate);
      console.log('Time Period:', bookingData.selectedTimePeriod);
      console.log('Backend Day:', backendDay);
      
      if (!venue.slots || !Array.isArray(venue.slots)) {
        console.log('❌ No venue slots found');
        setTimeSlots([]);
        return;
      }

      // Find venue slots for the selected day
      const daySlots = venue.slots.filter((slot: any) => slot.day_of_week === backendDay);
      
      if (daySlots.length === 0) {
        console.log(`❌ No slots for day ${backendDay}`);
        setTimeSlots([]);
        return;
      }

      // Get existing bookings for conflict detection
      let existingBookings: any[] = [];
      try {
        existingBookings = await venueOwnerService.getBookings(
          venue.id, 
          undefined,
          bookingData.bookingDate, 
          bookingData.bookingDate
        );
      } catch (error) {
        console.warn('Could not fetch existing bookings:', error);
      }

      // Get selected time period
      const selectedPeriod = TIME_PERIODS.find(p => p.key === bookingData.selectedTimePeriod);
      if (!selectedPeriod) return;

      const availableSlots: TimeSlot[] = [];
      
      daySlots.forEach((slot: any) => {
        const startParts = slot.start_time.split(':');
        const endParts = slot.end_time.split(':');
        const slotStartHour = parseInt(startParts[0]);
        const slotEndHour = parseInt(endParts[0]);
        
        // Generate 1-hour slots within venue slot time and selected period
        for (let hour = Math.max(slotStartHour, selectedPeriod.startHour); 
             hour < Math.min(slotEndHour, selectedPeriod.endHour); 
             hour++) {
          
          const startTime = `${hour.toString().padStart(2, '0')}:00`;
          const endTime = `${(hour + 1).toString().padStart(2, '0')}:00`;
          
          // Check if this 1-hour slot conflicts with existing bookings
          const hasConflict = existingBookings.some(booking => {
            if (booking.status === 'cancelled') return false;
            
            const bookingStart = booking.start_time;
            const bookingEnd = booking.end_time;
            
            // Check for any overlap between our 1-hour slot and existing booking
            return (startTime < bookingEnd && endTime > bookingStart);
          });
          
          // Only add available slots (hide booked ones completely)
          if (!hasConflict) {
            availableSlots.push({
              time: startTime,
              endTime: endTime,
              price: slot.price_per_hour || venue.base_price_per_hour || 1000,
              available: true,
            });
          }
        }
      });

      console.log('Available 1-hour slots:', availableSlots.length);
      setTimeSlots(availableSlots.sort((a, b) => a.time.localeCompare(b.time)));
      
    } catch (error) {
      console.error('Error generating time slots:', error);
      setTimeSlots([]);
    } finally {
      setBookingData(prev => ({ ...prev, isLoadingSlots: false }));
    }
  };

  const handleVenueSelection = (venue: any) => {
    setBookingData(prev => ({
      ...prev,
      venueId: venue.id,
      venueName: venue.name,
      selectedVenue: venue,
      sport: venue.sports_supported?.[0] || '',
      selectedTimeSlot: '', // Reset time slot when venue changes
      startTime: '',
      endTime: '',
      totalAmount: 0,
    }));
  };

  const handleSportSelection = (sport: string) => {
    setBookingData(prev => ({
      ...prev,
      sport,
      selectedTimeSlot: '', // Reset time slot when sport changes
      startTime: '',
      endTime: '',
      totalAmount: 0,
    }));
  };

  const handleDateSelection = (date: string) => {
    setBookingData(prev => ({
      ...prev,
      bookingDate: date,
      selectedTimeSlot: '', // Reset time slot when date changes
      startTime: '',
      endTime: '',
      totalAmount: 0,
    }));
  };

  const handleTimePeriodSelection = (period: string) => {
    setBookingData(prev => ({
      ...prev,
      selectedTimePeriod: period,
      selectedTimeSlot: '', // Reset time slot when period changes
      startTime: '',
      endTime: '',
      totalAmount: 0,
    }));
  };

  const handleTimeSlotSelection = (slot: TimeSlot) => {
    const totalAmount = slot.price;
    
    setBookingData(prev => ({
      ...prev,
      selectedTimeSlot: slot.time,
      startTime: slot.time,
      endTime: slot.endTime,
      duration: 1, // 1 hour slots
      totalAmount,
    }));
  };

  const handleStepNavigation = (direction: 'next' | 'back') => {
    if (direction === 'next') {
      if (validateCurrentStep()) {
        setBookingData(prev => ({
          ...prev,
          currentStep: Math.min(prev.currentStep + 1, 2), // Only 2 steps now
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
        if (!bookingData.venueId || !bookingData.sport || !bookingData.bookingDate || !bookingData.selectedTimeSlot) {
          Alert.alert('Required Fields', 'Please select venue, sport, date and time slot');
          return false;
        }
        return true;
      case 2:
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

  const handleSubmitBooking = async () => {
    if (!validateCurrentStep()) return;

    // Additional validation
    if (!bookingData.startTime || !bookingData.endTime) {
      Alert.alert('Invalid Time Selection', 'Please select a valid time slot.');
      return;
    }

    if (bookingData.duration <= 0) {
      Alert.alert('Invalid Duration', 'Please select a valid time duration.');
      return;
    }

    // Format and validate player mobile
    const playerMobile = AuthService.formatIndianMobile(bookingData.playerPhone.trim());
    
    // Validate Indian mobile format
    if (!AuthService.validateIndianMobile(playerMobile)) {
      Alert.alert('Error', 'Please enter a valid Indian mobile number\nFormat: +91XXXXXXXXXX');
      return;
    }

    setBookingData(prev => ({ ...prev, isSubmitting: true, playerPhone: playerMobile }));

    try {
      const bookingPayload = {
        venue_id: bookingData.venueId,
        player_mobile: playerMobile,
        player_name: bookingData.playerName,
        booking_date: bookingData.bookingDate,
        start_time: bookingData.startTime,
        end_time: bookingData.endTime,
        sport: bookingData.sport,
        notes: bookingData.notes || `1-hour booking for ${bookingData.sport}`,
      };

      console.log('Submitting booking payload:', bookingPayload);

      const response = await venueOwnerService.createBooking(bookingPayload);
      
      Alert.alert(
        'Booking Created Successfully! 🎉',
        `Payment link sent to ${playerMobile}\n\nAmount: ₹${response.total_amount}\nSMS Status: ${response.sms_status}\n\nPlayer will receive payment link via SMS.`,
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
      selectedTimePeriod: 'morning',
      selectedTimeSlot: '',
      playerName: '',
      playerPhone: '',
      notes: '',
      startTime: '',
      endTime: '',
      duration: 1,
      totalAmount: 0,
      currentStep: 1,
      isSubmitting: false,
      isLoadingSlots: false,
    });
    setTimeSlots([]);
  };

  const formatTime12Hour = (time24: string) => {
    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  // Removed renderProgressBar function - progress is now in header

  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Book Your Slot</Text>
      <Text style={styles.stepSubtitle}>Select venue, sport, date and time for your booking</Text>

        {/* Venue Selection */}
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Select Venue</Text>
          <TouchableOpacity
            style={[styles.dropdown, venues.length === 1 && styles.dropdownDisabled]}
            onPress={() => venues.length > 1 && Alert.alert('Select Venue', 'Choose your venue', venues.map(venue => ({ text: venue.name, onPress: () => handleVenueSelection(venue) })))}
            disabled={venues.length === 1}
          >
            <Text style={[styles.dropdownText, !bookingData.venueName && styles.dropdownPlaceholder]}>
              {bookingData.venueName || 'Choose venue'}
            </Text>
            <Ionicons 
              name="chevron-down" 
              size={20} 
              color={venues.length === 1 ? '#9ca3af' : '#6b7280'} 
            />
          </TouchableOpacity>
        </View>

        {/* Sport Selection */}
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Select Sport</Text>
          <TouchableOpacity
            style={[styles.dropdown, (!bookingData.selectedVenue || bookingData.selectedVenue.sports_supported?.length === 1) && styles.dropdownDisabled]}
            onPress={() => {
              if (bookingData.selectedVenue && bookingData.selectedVenue.sports_supported?.length > 1) {
                Alert.alert('Select Sport', 'Choose your sport', 
                  bookingData.selectedVenue.sports_supported.map((sport: string) => ({ 
                    text: sport, 
                    onPress: () => handleSportSelection(sport) 
                  }))
                );
              }
            }}
            disabled={!bookingData.selectedVenue || bookingData.selectedVenue.sports_supported?.length === 1}
          >
            <Text style={[styles.dropdownText, !bookingData.sport && styles.dropdownPlaceholder]}>
              {bookingData.sport || 'Choose sport'}
            </Text>
            <Ionicons 
              name="chevron-down" 
              size={20} 
              color={(!bookingData.selectedVenue || bookingData.selectedVenue.sports_supported?.length === 1) ? '#9ca3af' : '#6b7280'} 
            />
          </TouchableOpacity>
        </View>

        {/* Date Selection */}
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Select Date</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.dateScrollView}
            contentContainerStyle={styles.dateContainer}
          >
            {dateOptions.map((dateOption) => (
              <TouchableOpacity
                key={dateOption.date}
                style={[
                  styles.dateChip,
                  bookingData.bookingDate === dateOption.date && styles.dateChipSelected,
                ]}
                onPress={() => handleDateSelection(dateOption.date)}
              >
                <Text style={[
                  styles.dateChipLabel,
                  bookingData.bookingDate === dateOption.date && styles.dateChipLabelSelected,
                ]}>
                  {dateOption.isToday ? 'Today' : dateOption.isTomorrow ? 'Tomorrow' : dateOption.dayName}
                </Text>
                <Text style={[
                  styles.dateChipDate,
                  bookingData.bookingDate === dateOption.date && styles.dateChipDateSelected,
                ]}>
                  {dateOption.displayDate} {new Date(dateOption.date).toLocaleDateString('en-US', { month: 'short' })}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Time Period Selection */}
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Select Time of Day</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.periodScrollView}
            contentContainerStyle={styles.periodContainer}
          >
            {TIME_PERIODS.map((period) => (
              <TouchableOpacity
                key={period.key}
                style={[
                  styles.periodChip,
                  bookingData.selectedTimePeriod === period.key && [
                    styles.periodChipSelected,
                    { backgroundColor: period.color }
                  ],
                ]}
                onPress={() => handleTimePeriodSelection(period.key)}
              >
                <Text style={[
                  styles.periodChipText,
                  bookingData.selectedTimePeriod === period.key && styles.periodChipTextSelected,
                ]}>
                  {period.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Time Slots Grid */}
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Available Time Slots</Text>
          
          {bookingData.isLoadingSlots ? (
            <View style={styles.timeSlotsGrid}>
              {/* Skeleton Loading */}
              {Array.from({ length: 6 }).map((_, index) => (
                <View key={index} style={[styles.timeSlotSkeleton]}>
                  <View style={styles.skeletonShimmer} />
                </View>
              ))}
            </View>
          ) : timeSlots.length > 0 ? (
            <View style={styles.timeSlotsGrid}>
              {timeSlots.map((slot, index) => (
                <TouchableOpacity
                  key={`${slot.time}-${index}`}
                  style={[
                    styles.timeSlotButton,
                    bookingData.selectedTimeSlot === slot.time && styles.timeSlotButtonSelected,
                  ]}
                  onPress={() => handleTimeSlotSelection(slot)}
                >
                  <Text style={[
                    styles.timeSlotText,
                    bookingData.selectedTimeSlot === slot.time && styles.timeSlotTextSelected,
                  ]}>
                    {formatTime12Hour(slot.time)}
                  </Text>
                  <Text style={[
                    styles.timeSlotPrice,
                    bookingData.selectedTimeSlot === slot.time && styles.timeSlotPriceSelected,
                  ]}>
                    ₹{slot.price}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.noSlotsContainer}>
              <Ionicons name="time-outline" size={48} color="#9ca3af" />
              <Text style={styles.noSlotsTitle}>No Available Slots</Text>
              <Text style={styles.noSlotsText}>
                No time slots available for {bookingData.selectedTimePeriod} period.
                Try selecting a different date or time period.
              </Text>
            </View>
          )}
        </View>

        {/* Selection Summary */}
        {bookingData.selectedTimeSlot && (
          <View style={styles.selectionSummary}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Selected Booking</Text>
              <View style={styles.summaryDetails}>
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
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Time:</Text>
                  <Text style={styles.summaryValue}>
                    {formatTime12Hour(bookingData.startTime)} - {formatTime12Hour(bookingData.endTime)}
                  </Text>
                </View>
                <View style={[styles.summaryRow, styles.totalRow]}>
                  <Text style={styles.totalLabel}>Total:</Text>
                  <Text style={styles.totalValue}>₹{bookingData.totalAmount}</Text>
                </View>
              </View>
            </View>
          </View>
        )}
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Confirm Booking</Text>
      <Text style={styles.stepSubtitle}>Enter player details and confirm your booking</Text>

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
              {formatTime12Hour(bookingData.startTime)} - {formatTime12Hour(bookingData.endTime)}
            </Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Duration:</Text>
            <Text style={styles.summaryValue}>{bookingData.duration} hour</Text>
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
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <SafeAreaView style={styles.safeArea}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.headerCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>New Booking</Text>
            <View style={styles.stepIndicator}>
              <Text style={styles.stepText}>{bookingData.currentStep}/2</Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${(bookingData.currentStep / 2) * 100}%` }]} />
            </View>
          </View>

          {/* Step Content */}
          <KeyboardAvoidingView 
            style={styles.content}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              {bookingData.currentStep === 1 && renderStep1()}
              {bookingData.currentStep === 2 && renderStep2()}
            </ScrollView>
          </KeyboardAvoidingView>

          {/* Navigation Footer */}
          <View style={styles.modalFooter}>
            {bookingData.currentStep > 1 && (
              <TouchableOpacity style={styles.secondaryButton} onPress={() => handleStepNavigation('back')}>
                <Text style={styles.secondaryButtonText}>Previous</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity 
              style={[styles.primaryButton, bookingData.currentStep === 1 && styles.fullWidthButton]}
              onPress={bookingData.currentStep === 2 ? handleSubmitBooking : () => handleStepNavigation('next')}
              disabled={bookingData.isSubmitting}
            >
              <Text style={styles.primaryButtonText}>
                {bookingData.currentStep === 2 
                  ? (bookingData.isSubmitting ? 'Creating...' : 'Create Booking')
                  : 'Next'
                }
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  safeArea: {
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
    borderBottomColor: '#e5e7eb',
  },
  headerCancel: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  stepIndicator: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  stepText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#212529',
    borderRadius: 2,
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
    marginRight: 40,
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
    lineHeight: 22,
  },
  formGroup: {
    marginBottom: 24,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
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
  notesInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },

  // Dropdown styles (replacing venue/sport selection)
  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#f9fafb',
  },
  dropdownDisabled: {
    backgroundColor: '#f1f5f9',
    borderColor: '#cbd5e1',
  },
  dropdownText: {
    fontSize: 16,
    color: '#212529',
    fontWeight: '500',
  },
  dropdownPlaceholder: {
    color: '#9ca3af',
  },

  // Date selection styles
  dateScrollView: {
    flexGrow: 0,
  },
  dateContainer: {
    paddingRight: 20,
    gap: 12,
  },
  dateChip: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignItems: 'center',
    minWidth: 80,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  dateChipSelected: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
    shadowColor: '#10b981',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  dateChipLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 2,
  },
  dateChipLabelSelected: {
    color: '#ffffff',
  },
  dateChipDate: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  dateChipDateSelected: {
    color: 'rgba(255, 255, 255, 0.9)',
  },

  // Time period styles
  periodScrollView: {
    flexGrow: 0,
  },
  periodContainer: {
    paddingRight: 20,
    gap: 12,
  },
  periodChip: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  periodChipSelected: {
    borderColor: 'transparent',
  },
  periodChipText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '600',
  },
  periodChipTextSelected: {
    color: '#ffffff',
  },

  // Time slots grid styles (3-column mobile layout)
  timeSlotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
  },
  timeSlotButton: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    // 3 columns with gaps: (width - gaps) / 3
    width: (width - 40 - 24) / 3, // container padding (40) + gaps (24)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  timeSlotButtonSelected: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
    shadowColor: '#10b981',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  timeSlotText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 4,
  },
  timeSlotTextSelected: {
    color: '#ffffff',
  },
  timeSlotPrice: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '600',
  },
  timeSlotPriceSelected: {
    color: 'rgba(255, 255, 255, 0.9)',
  },

  // Skeleton loading styles
  timeSlotSkeleton: {
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: (width - 40 - 24) / 3,
    height: 64,
    overflow: 'hidden',
  },
  skeletonShimmer: {
    backgroundColor: '#e2e8f0',
    width: '80%',
    height: 12,
    borderRadius: 6,
    opacity: 0.7,
  },

  // Selection summary styles
  selectionSummary: {
    marginTop: 24,
  },
  summaryCard: {
    backgroundColor: '#f0f9ff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0c4a6e',
    marginBottom: 16,
    textAlign: 'center',
  },
  summaryDetails: {
    gap: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0f2fe',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#0369a1',
    fontWeight: '500',
    flex: 1,
  },
  summaryValue: {
    fontSize: 14,
    color: '#0c4a6e',
    fontWeight: '600',
    flex: 2,
    textAlign: 'right',
  },
  totalRow: {
    borderBottomWidth: 0,
    paddingTop: 12,
    marginTop: 8,
    borderTopWidth: 2,
    borderTopColor: '#bae6fd',
  },
  totalLabel: {
    fontSize: 16,
    color: '#0c4a6e',
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

  // No slots container
  noSlotsContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  noSlotsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  noSlotsText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },

  // Booking summary (Step 2)
  bookingSummary: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },

  // Action info
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

  // Footer navigation
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
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#212529',
    shadowColor: '#212529',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  nextButtonText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
    marginRight: 4,
  },
  submitButton: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#059669',
    minWidth: 140,
    alignItems: 'center',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    backgroundColor: '#9ca3af',
    shadowOpacity: 0.1,
  },
  submitButtonText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
  },
});