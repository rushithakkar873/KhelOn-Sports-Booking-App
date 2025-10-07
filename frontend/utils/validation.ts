/**
 * Validation utilities that match backend Pydantic model schemas
 * Provides comprehensive validation with user-friendly error messages
 */

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export class OnboardingValidation {
  
  // Email validation
  static validateEmail(email: string): ValidationResult {
    const errors: string[] = [];
    
    if (email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        errors.push('Please enter a valid email address');
      }
    }
    
    return { isValid: errors.length === 0, errors };
  }

  // Individual field validation for Step 1
  static validateFullName(fullName: string): ValidationResult {
    const errors: string[] = [];
    const trimmed = fullName.trim();
    
    if (!trimmed) {
      errors.push('Full name is required');
    } else if (trimmed.length < 2) {
      errors.push('Full name must be at least 2 characters long');
    } else if (trimmed.length > 100) {
      errors.push('Full name cannot exceed 100 characters');
    }
    
    return { isValid: errors.length === 0, errors };
  }

  // Individual field validation for Step 2
  static validateVenueName(venueName: string): ValidationResult {
    const errors: string[] = [];
    const trimmed = venueName.trim();
    
    if (!trimmed) {
      errors.push('Venue name is required');
    } else if (trimmed.length < 2) {
      errors.push('Venue name must be at least 2 characters long');
    } else if (trimmed.length > 200) {
      errors.push('Venue name cannot exceed 200 characters');
    }
    
    return { isValid: errors.length === 0, errors };
  }

  static validateVenueAddress(address: string): ValidationResult {
    const errors: string[] = [];
    const trimmed = address.trim();
    
    if (!trimmed) {
      errors.push('Venue address is required');
    } else if (trimmed.length < 10) {
      errors.push('Please provide a complete address (at least 10 characters)');
    } else if (trimmed.length > 500) {
      errors.push('Address cannot exceed 500 characters');
    }
    
    return { isValid: errors.length === 0, errors };
  }

  static validateCity(city: string): ValidationResult {
    const errors: string[] = [];
    const trimmed = city.trim();
    
    if (trimmed && (trimmed.length < 2 || trimmed.length > 100)) {
      errors.push('City name must be between 2 and 100 characters');
    }
    
    return { isValid: errors.length === 0, errors };
  }

  static validateState(state: string): ValidationResult {
    const errors: string[] = [];
    const trimmed = state.trim();
    
    if (trimmed && (trimmed.length < 2 || trimmed.length > 100)) {
      errors.push('State name must be between 2 and 100 characters');
    }
    
    return { isValid: errors.length === 0, errors };
  }

  static validateOperatingDays(operatingDays: string[]): ValidationResult {
    const errors: string[] = [];
    
    if (!operatingDays || operatingDays.length === 0) {
      errors.push('Please select at least one operating day');
    } else if (operatingDays.length > 7) {
      errors.push('Cannot select more than 7 days');
    }
    
    return { isValid: errors.length === 0, errors };
  }

  static validateCoverPhoto(coverPhoto: string | null): ValidationResult {
    const errors: string[] = [];
    
    if (!coverPhoto) {
      errors.push('Please add a cover photo for your venue');
    }
    
    return { isValid: errors.length === 0, errors };
  }

  // Step 1 Validation (OnboardingStep1JWTRequest)
  static validateStep1(firstName: string, lastName: string, email: string): ValidationResult {
    const errors: string[] = [];
    
    // First name validation (min_length=2, max_length=100)
    const trimmedFirstName = firstName.trim();
    if (!trimmedFirstName) {
      errors.push('First name is required');
    } else if (trimmedFirstName.length < 2) {
      errors.push('First name must be at least 2 characters long');
    } else if (trimmedFirstName.length > 100) {
      errors.push('First name cannot exceed 100 characters');
    }
    
    // Last name validation (min_length=2, max_length=100)
    const trimmedLastName = lastName.trim();
    if (!trimmedLastName) {
      errors.push('Last name is required');
    } else if (trimmedLastName.length < 2) {
      errors.push('Last name must be at least 2 characters long');
    } else if (trimmedLastName.length > 100) {
      errors.push('Last name cannot exceed 100 characters');
    }
    
    // Email validation (Optional EmailStr)
    if (email.trim()) {
      const emailValidation = this.validateEmail(email);
      errors.push(...emailValidation.errors);
    }
    
    return { isValid: errors.length === 0, errors };
  }

  // Indian mobile number formatting
  static formatPhoneNumber(phone: string): string {
    // Remove all non-digits
    const digitsOnly = phone.replace(/\D/g, '');
    
    // If it starts with 91, add +91, otherwise if it's 10 digits, add +91
    if (digitsOnly.startsWith('91') && digitsOnly.length === 12) {
      return `+${digitsOnly}`;
    } else if (digitsOnly.length === 10 && digitsOnly[0] >= '6' && digitsOnly[0] <= '9') {
      return `+91${digitsOnly}`;
    } else if (digitsOnly.length === 11 && digitsOnly.startsWith('0')) {
      // Remove leading 0 and add +91
      return `+91${digitsOnly.substring(1)}`;
    }
    
    return digitsOnly.startsWith('91') ? `+${digitsOnly}` : `+91${digitsOnly}`;
  }

  // Phone number validation (pattern=r'^\+91[6-9]\d{9}$')
  static validatePhoneNumber(phone: string): ValidationResult {
    const errors: string[] = [];
    
    if (!phone.trim()) {
      errors.push('Phone number is required');
      return { isValid: false, errors };
    }
    
    const formatted = this.formatPhoneNumber(phone);
    const phoneRegex = /^\+91[6-9]\d{9}$/;
    
    if (!phoneRegex.test(formatted)) {
      errors.push('Please enter a valid Indian mobile number (10 digits starting with 6-9)');
    }
    
    return { isValid: errors.length === 0, errors };
  }

  // Time validation (pattern=r"^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$")
  static validateTime(time: string): ValidationResult {
    const errors: string[] = [];
    
    if (!time.trim()) {
      errors.push('Time is required');
      return { isValid: false, errors };
    }
    
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(time.trim())) {
      errors.push('Please enter time in HH:MM format (e.g., 09:30)');
    }
    
    return { isValid: errors.length === 0, errors };
  }

  // Pincode validation (pattern=r'^\d{6}$')
  static validatePincode(pincode: string): ValidationResult {
    const errors: string[] = [];
    
    if (!pincode.trim()) {
      errors.push('Pincode is required');
      return { isValid: false, errors };
    }
    
    const pincodeRegex = /^\d{6}$/;
    if (!pincodeRegex.test(pincode.trim())) {
      errors.push('Please enter a valid 6-digit pincode');
    }
    
    return { isValid: errors.length === 0, errors };
  }

  // Step 2 Validation (OnboardingStep2Request)
  static validateStep2(data: {
    venueName: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    coverPhoto: string | null;
    operatingDays: string[];
    startTime: string;
    endTime: string;
    contactPhone: string;
  }): ValidationResult {
    const errors: string[] = [];
    
    // Venue name validation (min_length=2, max_length=200)
    const trimmedVenueName = data.venueName.trim();
    if (!trimmedVenueName) {
      errors.push('Venue name is required');
    } else if (trimmedVenueName.length < 2) {
      errors.push('Venue name must be at least 2 characters long');
    } else if (trimmedVenueName.length > 200) {
      errors.push('Venue name cannot exceed 200 characters');
    }
    
    // Address validation (min_length=10, max_length=500)
    const trimmedAddress = data.address.trim();
    if (!trimmedAddress) {
      errors.push('Venue address is required');
    } else if (trimmedAddress.length < 10) {
      errors.push('Please provide a complete address (at least 10 characters)');
    } else if (trimmedAddress.length > 500) {
      errors.push('Address cannot exceed 500 characters');
    }
    
    // City validation (min_length=2, max_length=100)
    const trimmedCity = data.city.trim();
    if (trimmedCity && (trimmedCity.length < 2 || trimmedCity.length > 100)) {
      errors.push('City name must be between 2 and 100 characters');
    }
    
    // State validation (min_length=2, max_length=100)
    const trimmedState = data.state.trim();
    if (trimmedState && (trimmedState.length < 2 || trimmedState.length > 100)) {
      errors.push('State name must be between 2 and 100 characters');
    }
    
    // Pincode validation
    const pincodeValidation = this.validatePincode(data.pincode);
    errors.push(...pincodeValidation.errors);
    
    // Cover photo validation (Optional but check if provided)
    if (!data.coverPhoto) {
      errors.push('Please add a cover photo for your venue');
    }
    
    // Operating days validation (min_items=1, max_items=7)
    if (!data.operatingDays || data.operatingDays.length === 0) {
      errors.push('Please select at least one operating day');
    } else if (data.operatingDays.length > 7) {
      errors.push('Cannot select more than 7 days');
    }
    
    // Start time validation
    const startTimeValidation = this.validateTime(data.startTime);
    if (!startTimeValidation.isValid) {
      errors.push('Start time: ' + startTimeValidation.errors[0]);
    }
    
    // End time validation
    const endTimeValidation = this.validateTime(data.endTime);
    if (!endTimeValidation.isValid) {
      errors.push('End time: ' + endTimeValidation.errors[0]);
    }
    
    // Time logic validation
    if (startTimeValidation.isValid && endTimeValidation.isValid) {
      const startHour = parseInt(data.startTime.split(':')[0]);
      const startMin = parseInt(data.startTime.split(':')[1]);
      const endHour = parseInt(data.endTime.split(':')[0]);
      const endMin = parseInt(data.endTime.split(':')[1]);
      
      const startTotal = startHour * 60 + startMin;
      const endTotal = endHour * 60 + endMin;
      
      if (endTotal <= startTotal) {
        errors.push('End time must be after start time');
      }
    }
    
    // Contact phone validation
    const phoneValidation = this.validatePhoneNumber(data.contactPhone);
    errors.push(...phoneValidation.errors);
    
    return { isValid: errors.length === 0, errors };
  }

  // Individual field validation for real-time feedback
  static validateSportType(sportType: string): ValidationResult {
    const errors: string[] = [];
    const trimmedSportType = sportType.trim();
    
    if (!trimmedSportType) {
      errors.push('Sport type is required');
    } else if (trimmedSportType.length < 2) {
      errors.push('Sport type must be at least 2 characters long');
    } else if (trimmedSportType.length > 50) {
      errors.push('Sport type cannot exceed 50 characters');
    }
    
    return { isValid: errors.length === 0, errors };
  }

  static validateNumberOfCourts(numberOfCourts: number): ValidationResult {
    const errors: string[] = [];
    
    if (!Number.isInteger(numberOfCourts) || numberOfCourts < 1) {
      errors.push('Number of courts must be at least 1');
    } else if (numberOfCourts > 20) {
      errors.push('Number of courts cannot exceed 20');
    }
    
    return { isValid: errors.length === 0, errors };
  }

  static validateSlotDuration(slotDuration: number): ValidationResult {
    const errors: string[] = [];
    
    if (!Number.isInteger(slotDuration) || slotDuration < 30) {
      errors.push('Slot duration must be at least 30 minutes');
    } else if (slotDuration > 240) {
      errors.push('Slot duration cannot exceed 240 minutes (4 hours)');
    }
    
    return { isValid: errors.length === 0, errors };
  }

  static validatePricePerSlot(pricePerSlot: number | string): ValidationResult {
    const errors: string[] = [];
    const price = typeof pricePerSlot === 'string' ? parseFloat(pricePerSlot) : pricePerSlot;
    
    if (isNaN(price)) {
      errors.push('Please enter a valid price');
    } else if (price < 0) {
      errors.push('Price cannot be negative');
    } else if (price === 0) {
      errors.push('Price must be greater than 0');
    } else if (price > 100000) {
      errors.push('Price cannot exceed ₹1,00,000');
    }
    
    return { isValid: errors.length === 0, errors };
  }

  // Step 3 Validation (OnboardingStep3Request)
  static validateStep3(data: {
    sportType: string;
    numberOfCourts: number;
    slotDuration: number;
    pricePerSlot: number;
  }): ValidationResult {
    const errors: string[] = [];
    
    // Validate each field and collect errors
    const sportTypeValidation = this.validateSportType(data.sportType);
    errors.push(...sportTypeValidation.errors);
    
    const courtsValidation = this.validateNumberOfCourts(data.numberOfCourts);
    errors.push(...courtsValidation.errors);
    
    const durationValidation = this.validateSlotDuration(data.slotDuration);
    errors.push(...durationValidation.errors);
    
    const priceValidation = this.validatePricePerSlot(data.pricePerSlot);
    errors.push(...priceValidation.errors);
    
    return { isValid: errors.length === 0, errors };
  }

  // Individual field validation for Step 4
  static validateAmenities(amenities: string[]): ValidationResult {
    const errors: string[] = [];
    
    // Amenities are optional, but if provided, should be valid
    if (amenities && amenities.length > 20) {
      errors.push('Cannot select more than 20 amenities');
    }
    
    // Check for valid amenity names
    const invalidAmenities = amenities.filter(amenity => 
      !amenity.trim() || amenity.trim().length < 2 || amenity.trim().length > 50
    );
    
    if (invalidAmenities.length > 0) {
      errors.push('Each amenity must be between 2 and 50 characters');
    }
    
    return { isValid: errors.length === 0, errors };
  }

  static validateRules(rules: string): ValidationResult {
    const errors: string[] = [];
    
    // Rules are optional, but if provided, should be reasonable length
    if (rules && rules.trim()) {
      const trimmedRules = rules.trim();
      if (trimmedRules.length > 2000) {
        errors.push('Rules cannot exceed 2000 characters');
      } else if (trimmedRules.length < 10) {
        errors.push('Rules should be at least 10 characters long to be meaningful');
      }
    }
    
    return { isValid: errors.length === 0, errors };
  }

  // Step 4 Validation (OnboardingStep4Request)
  static validateStep4(data: {
    amenities: string[];
    rules: string;
  }): ValidationResult {
    const errors: string[] = [];
    
    // Validate amenities
    const amenitiesValidation = this.validateAmenities(data.amenities);
    errors.push(...amenitiesValidation.errors);
    
    // Validate rules
    const rulesValidation = this.validateRules(data.rules);
    errors.push(...rulesValidation.errors);
    
    return { isValid: errors.length === 0, errors };
  }

  // Individual field validation for Step 5
  static validateBankAccountNumber(accountNumber: string): ValidationResult {
    const errors: string[] = [];
    
    if (accountNumber && accountNumber.trim()) {
      const trimmed = accountNumber.trim();
      // Indian bank account numbers are typically 9-18 digits
      const accountRegex = /^[0-9]{9,18}$/;
      
      if (!accountRegex.test(trimmed)) {
        errors.push('Bank account number must be 9-18 digits');
      }
    }
    
    return { isValid: errors.length === 0, errors };
  }

  static validateBankIfsc(ifsc: string): ValidationResult {
    const errors: string[] = [];
    
    if (ifsc && ifsc.trim()) {
      const trimmed = ifsc.trim().toUpperCase();
      // IFSC format: 4 letters + 0 + 6 alphanumeric characters
      const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
      
      if (!ifscRegex.test(trimmed)) {
        errors.push('Please enter a valid IFSC code (e.g., SBIN0001234)');
      }
    }
    
    return { isValid: errors.length === 0, errors };
  }

  static validateBankAccountHolder(holderName: string): ValidationResult {
    const errors: string[] = [];
    
    if (holderName && holderName.trim()) {
      const trimmed = holderName.trim();
      
      if (trimmed.length < 2) {
        errors.push('Account holder name must be at least 2 characters');
      } else if (trimmed.length > 100) {
        errors.push('Account holder name cannot exceed 100 characters');
      } else if (!/^[a-zA-Z\s.]+$/.test(trimmed)) {
        errors.push('Account holder name can only contain letters, spaces, and dots');
      }
    }
    
    return { isValid: errors.length === 0, errors };
  }

  static validateUpiId(upiId: string): ValidationResult {
    const errors: string[] = [];
    
    if (upiId && upiId.trim()) {
      const trimmed = upiId.trim().toLowerCase();
      // UPI ID format: username@bank (more flexible regex)
      const upiRegex = /^[a-zA-Z0-9.\-_]{2,}@[a-zA-Z0-9.\-_]{2,}$/;
      
      if (!upiRegex.test(trimmed)) {
        errors.push('Please enter a valid UPI ID (e.g., yourname@paytm)');
      } else if (trimmed.length > 50) {
        errors.push('UPI ID cannot exceed 50 characters');
      }
    }
    
    return { isValid: errors.length === 0, errors };
  }

  // Step 5 Validation (OnboardingStep5Request) - All fields are optional
  static validateStep5(data: {
    bankAccountNumber: string;
    bankIfsc: string;
    bankAccountHolder: string;
    upiId: string;
  }): ValidationResult {
    const errors: string[] = [];
    
    // Check if user is providing bank details
    const hasBankDetails = data.bankAccountNumber.trim() || data.bankIfsc.trim() || data.bankAccountHolder.trim();
    
    // If any bank detail is provided, all should be provided and valid
    if (hasBankDetails) {
      if (!data.bankAccountNumber.trim()) {
        errors.push('Bank account number is required when providing bank details');
      } else {
        const accountValidation = this.validateBankAccountNumber(data.bankAccountNumber);
        errors.push(...accountValidation.errors);
      }
      
      if (!data.bankIfsc.trim()) {
        errors.push('IFSC code is required when providing bank details');
      } else {
        const ifscValidation = this.validateBankIfsc(data.bankIfsc);
        errors.push(...ifscValidation.errors);
      }
      
      if (!data.bankAccountHolder.trim()) {
        errors.push('Account holder name is required when providing bank details');
      } else {
        const holderValidation = this.validateBankAccountHolder(data.bankAccountHolder);
        errors.push(...holderValidation.errors);
      }
    }
    
    // Validate UPI ID if provided (independent of bank details)
    if (data.upiId.trim()) {
      const upiValidation = this.validateUpiId(data.upiId);
      errors.push(...upiValidation.errors);
    }
    
    // Must provide either bank details or UPI ID
    if (!hasBankDetails && !data.upiId.trim()) {
      // This is actually optional for step 5, so no error needed
      // User can skip payment setup
    }
    
    return { isValid: errors.length === 0, errors };
  }

  // Utility function to show validation errors
  static showValidationErrors(errors: string[]): string {
    if (errors.length === 0) return '';
    
    if (errors.length === 1) {
      return errors[0];
    }
    
    return `Please fix the following issues:\n\n${errors.map((error, index) => `${index + 1}. ${error}`).join('\n')}`;
  }
}