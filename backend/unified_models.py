"""
Unified Pydantic Models for KhelON
Clean, scalable data models for the unified system
"""

from pydantic import BaseModel, Field, EmailStr, validator
from typing import List, Optional, Dict, Any
from datetime import datetime

# ================================
# AUTHENTICATION MODELS
# ================================

class MobileOTPRequest(BaseModel):
    mobile: str = Field(..., min_length=13, max_length=13)
    
    @validator('mobile')
    def validate_indian_mobile(cls, v):
        import re
        if not re.match(r'^\+91[6-9]\d{9}$', v):
            raise ValueError('Invalid Indian mobile number. Format: +91XXXXXXXXXX')
        return v

class OTPVerifyRequest(BaseModel):
    mobile: str = Field(..., min_length=13, max_length=13)
    otp: str = Field(..., min_length=6, max_length=6)
    
    @validator('mobile')
    def validate_mobile(cls, v):
        import re
        if not re.match(r'^\+91[6-9]\d{9}$', v):
            raise ValueError('Invalid Indian mobile number')
        return v

class UserLoginRequest(BaseModel):
    mobile: str = Field(..., pattern=r'^\+91[6-9]\d{9}$')
    otp: str = Field(..., min_length=6, max_length=6)

# ================================
# PROGRESSIVE ONBOARDING MODELS  
# ================================

class OnboardingStep1Request(BaseModel):
    """Step 1: Basic user information (with OTP verification)"""
    mobile: str = Field(..., pattern=r'^\+91[6-9]\d{9}$')
    otp: str = Field(..., min_length=6, max_length=6)
    name: str = Field(..., min_length=2, max_length=100)
    email: Optional[EmailStr] = None
    role: str = Field(..., pattern="^(venue_partner)$")  # Only venue partners use onboarding
    
    # Optional business info (can be filled in step 1 or later)
    business_name: Optional[str] = Field(None, min_length=2, max_length=200)
    business_address: Optional[str] = Field(None, min_length=10, max_length=500)
    gst_number: Optional[str] = Field(None, max_length=20)

class OnboardingStep1JWTRequest(BaseModel):
    """Step 1: JWT-Protected Basic user information (no OTP needed)"""
    name: str = Field(..., min_length=2, max_length=100)
    email: Optional[EmailStr] = None
    
    # Optional business info (can be filled in step 1 or later)
    business_name: Optional[str] = Field(None, min_length=2, max_length=200)
    business_address: Optional[str] = Field(None, min_length=10, max_length=500)
    gst_number: Optional[str] = Field(None, max_length=20)

class OnboardingStep2Request(BaseModel):
    """Step 2: Venue basic information"""
    venue_name: str = Field(..., min_length=2, max_length=200)
    address: str = Field(..., min_length=10, max_length=500)
    city: str = Field(..., min_length=2, max_length=100)
    state: str = Field(..., min_length=2, max_length=100)
    pincode: str = Field(..., pattern=r'^\d{6}$')
    cover_photo: Optional[str] = None  # base64 image
    operating_days: List[str] = Field(..., min_items=1, max_items=7)
    start_time: str = Field(..., pattern=r"^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$")
    end_time: str = Field(..., pattern=r"^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$")
    contact_phone: str = Field(..., pattern=r'^\+91[6-9]\d{9}$')

class OnboardingStep3Request(BaseModel):
    """Step 3: Arena/Sport configuration"""
    sport_type: str = Field(..., min_length=2, max_length=50)
    arena_name: Optional[str] = Field(None, max_length=200)  # Custom arena name
    capacity: int = Field(..., ge=1, le=50)
    description: Optional[str] = Field(None, max_length=500)
    slot_duration: int = Field(..., ge=30, le=240)  # minutes
    price_per_hour: float = Field(..., ge=0)

class OnboardingStep4Request(BaseModel):
    """Step 4: Amenities and rules"""
    amenities: List[str] = []
    rules: Optional[str] = None
    
    # Optional: Arena-specific amenities (if different from venue)
    arena_amenities: Optional[List[str]] = []

class OnboardingStep5Request(BaseModel):
    """Step 5: Payment details (optional)"""
    bank_account_number: Optional[str] = None
    bank_ifsc: Optional[str] = None
    bank_account_holder: Optional[str] = None
    upi_id: Optional[str] = None

# ================================
# RESPONSE MODELS
# ================================

class UserResponse(BaseModel):
    id: str
    mobile: str
    first_name: str  # Kept for backward compatibility, but unused in new model
    last_name: str   # Kept for backward compatibility, but unused in new model
    name: str        # Single name field (the source of truth)
    email: Optional[str]
    role: str
    is_verified: bool
    
    # Onboarding status
    onboarding_completed: bool
    completed_steps: List[int]
    current_step: int
    
    # Business info (for venue partners) - Simplified
    gst_number: Optional[str] = None
    
    # Venue info (for venue partners)
    venue_name: Optional[str] = None
    venue_city: Optional[str] = None
    has_venue: Optional[bool] = False
    has_arenas: Optional[bool] = False
    can_go_live: Optional[bool] = False
    
    # Stats
    total_arenas: Optional[int] = 0
    total_bookings: Optional[int] = 0
    total_revenue: Optional[float] = 0.0
    
    created_at: datetime

class ArenaSlot(BaseModel):
    id: str
    day_of_week: int  # 0=Monday, 6=Sunday
    start_time: str
    end_time: str
    is_available: bool

class ArenaResponse(BaseModel):
    id: str
    name: str
    sport: str
    owner_id: str
    venue_name: str
    capacity: int
    description: Optional[str]
    amenities: List[str]
    base_price_per_hour: float
    images: List[str]
    slots: List[ArenaSlot]
    is_active: bool
    created_at: datetime

class BookingResponse(BaseModel):
    id: str
    venue_owner_id: str
    player_id: str
    arena_id: str
    arena_name: str
    sport: str
    booking_date: str
    start_time: str
    end_time: str
    duration_hours: int
    price_per_hour: float
    total_amount: float
    status: str
    payment_status: str
    payment_id: Optional[str]
    player_mobile: str
    created_at: datetime

class OnboardingStatusResponse(BaseModel):
    user_id: str
    mobile: str
    onboarding_completed: bool
    completed_steps: List[int]
    current_step: int
    has_venue: bool
    has_arenas: bool
    can_go_live: bool

# ================================
# ARENA CREATION MODELS
# ================================

class CreateArenaRequest(BaseModel):
    """Create new arena for existing venue owner"""
    name: str = Field(..., min_length=2, max_length=200)
    sport: str = Field(..., min_length=2, max_length=50)
    capacity: int = Field(..., ge=1, le=50)
    description: Optional[str] = Field(None, max_length=500)
    amenities: List[str] = []
    base_price_per_hour: float = Field(..., ge=0)
    images: List[str] = []  # base64 images
    
    # Time slots
    slots: List[Dict[str, Any]] = []

class UpdateArenaRequest(BaseModel):
    """Update existing arena"""
    name: Optional[str] = Field(None, min_length=2, max_length=200)
    capacity: Optional[int] = Field(None, ge=1, le=50)
    description: Optional[str] = Field(None, max_length=500)
    amenities: Optional[List[str]] = None
    base_price_per_hour: Optional[float] = Field(None, ge=0)
    images: Optional[List[str]] = None
    is_active: Optional[bool] = None

# ================================
# BOOKING MODELS
# ================================

class CreateBookingRequest(BaseModel):
    """Create booking by venue owner"""
    arena_id: str
    player_mobile: str = Field(..., pattern=r'^\+91[6-9]\d{9}$')
    booking_date: str = Field(..., pattern=r'^\d{4}-\d{2}-\d{2}$')
    start_time: str = Field(..., pattern=r'^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$')
    end_time: str = Field(..., pattern=r'^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$')
    
    # Optional: New player creation fields
    player_first_name: Optional[str] = Field(None, min_length=2, max_length=100)
    player_last_name: Optional[str] = Field(None, min_length=2, max_length=100)
    player_email: Optional[EmailStr] = None

class VenuePartnerBookingResponse(BaseModel):
    """Response for venue partner booking creation"""
    success: bool
    message: str
    booking_id: Optional[str] = None
    payment_link: Optional[str] = None
    total_amount: Optional[float] = None
    booking_details: Optional[Dict[str, Any]] = None

# ================================ 
# ANALYTICS MODELS
# ================================

class AnalyticsDashboardResponse(BaseModel):
    """Analytics dashboard response"""
    total_venues: int
    total_arenas: int
    total_bookings: int
    total_revenue: float
    occupancy_rate: float
    
    # Trend data
    recent_bookings: List[Dict[str, Any]]
    revenue_trend: List[Dict[str, Any]]
    top_sports: List[Dict[str, Any]]
    peak_hours: List[Dict[str, Any]]
    
    # Additional analytics
    bookings_trend: List[Dict[str, Any]]
    sport_distribution: List[Dict[str, Any]]
    arena_performance: List[Dict[str, Any]]
    monthly_comparison: Dict[str, Any]