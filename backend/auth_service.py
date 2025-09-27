"""
Unified Authentication Service with Mobile OTP Verification
Supports both players and venue owners with single user table
"""

import os
import jwt
import uuid
import random
import string
import logging
from datetime import datetime, timedelta
from typing import Dict, Optional, Any
from passlib.context import CryptContext
from pydantic import BaseModel, Field, EmailStr, validator
from typing import List
from motor.motor_asyncio import AsyncIOMotorDatabase

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Security configuration
SECRET_KEY = os.environ.get('SECRET_KEY', 'your-secret-key-change-this')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class MockSMSService:
    """Mock SMS service for OTP verification - simulates MSG91"""
    
    def __init__(self):
        self.sent_otps = {}  # In-memory storage for mock OTPs
        
    async def send_otp(self, mobile_number: str) -> Dict[str, Any]:
        """Send OTP via mock SMS service"""
        try:
            # Generate 6-digit OTP
            otp_code = ''.join(random.choices(string.digits, k=6))
            
            # Store OTP with expiration (5 minutes)
            expiry_time = datetime.utcnow() + timedelta(minutes=5)
            self.sent_otps[mobile_number] = {
                "otp": otp_code,
                "expiry": expiry_time,
                "attempts": 0
            }
            
            # Log OTP for development (remove in production)
            logger.info(f"🔐 MOCK SMS: OTP {otp_code} sent to {mobile_number}")
            
            return {
                "success": True,
                "message": "OTP sent successfully",
                "request_id": f"mock_{uuid.uuid4().hex[:8]}",
                # For development only - remove in production
                "mock_otp": otp_code
            }
            
        except Exception as e:
            logger.error(f"Failed to send OTP: {str(e)}")
            return {
                "success": False,
                "message": "Failed to send OTP"
            }
    
    async def verify_otp(self, mobile_number: str, otp_code: str) -> Dict[str, Any]:
        """Verify OTP code"""
        try:
            stored_data = self.sent_otps.get(mobile_number)
            
            if not stored_data:
                return {
                    "success": False,
                    "message": "No OTP found for this number. Please request a new OTP."
                }
            
            # Check if OTP has expired
            if datetime.utcnow() > stored_data["expiry"]:
                del self.sent_otps[mobile_number]
                return {
                    "success": False,
                    "message": "OTP has expired. Please request a new OTP."
                }
            
            # Check maximum attempts
            if stored_data["attempts"] >= 3:
                del self.sent_otps[mobile_number]
                return {
                    "success": False,
                    "message": "Maximum verification attempts exceeded. Please request a new OTP."
                }
            
            # Increment attempts
            self.sent_otps[mobile_number]["attempts"] += 1
            
            # Verify OTP
            if stored_data["otp"] == otp_code:
                # Clean up successful verification
                del self.sent_otps[mobile_number]
                return {
                    "success": True,
                    "message": "OTP verified successfully"
                }
            else:
                return {
                    "success": False,
                    "message": "Invalid OTP. Please try again."
                }
                
        except Exception as e:
            logger.error(f"OTP verification error: {str(e)}")
            return {
                "success": False,
                "message": "Verification failed. Please try again."
            }

# Pydantic Models
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

# Progressive onboarding models
class OnboardingStep1Request(BaseModel):
    mobile: str = Field(..., pattern=r'^\+91[6-9]\d{9}$')
    otp: str = Field(..., min_length=6, max_length=6)
    first_name: str = Field(..., min_length=2, max_length=100)
    last_name: str = Field(..., min_length=2, max_length=100)
    email: Optional[EmailStr] = None

class OnboardingStep2Request(BaseModel):
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
    sport_type: str = Field(..., min_length=2, max_length=50)
    number_of_courts: int = Field(..., ge=1, le=20)
    slot_duration: int = Field(..., ge=30, le=240)  # minutes
    price_per_slot: float = Field(..., ge=0)

class OnboardingStep4Request(BaseModel):
    amenities: List[str] = []
    rules: Optional[str] = None

class OnboardingStep5Request(BaseModel):
    bank_account_number: Optional[str] = None
    bank_ifsc: Optional[str] = None
    bank_account_holder: Optional[str] = None
    upi_id: Optional[str] = None

class OnboardingStatusResponse(BaseModel):
    user_id: str
    mobile: str
    onboarding_completed: bool
    completed_steps: List[int]
    current_step: int
    has_venue: bool
    has_arena: bool
    can_go_live: bool

# Legacy registration model for backward compatibility
class UserRegistrationRequest(BaseModel):
    mobile: str = Field(..., min_length=13, max_length=13)
    otp: str = Field(..., min_length=6, max_length=6)
    name: str = Field(..., min_length=2, max_length=100)
    email: Optional[EmailStr] = None
    role: str = Field(..., pattern="^(player|venue_partner)$")
    
    # Player specific fields
    sports_interests: Optional[list] = []
    location: Optional[str] = None
    
    # Venue Partner specific fields
    business_name: Optional[str] = Field(None, max_length=200)
    business_address: Optional[str] = Field(None, max_length=500)
    gst_number: Optional[str] = Field(None, max_length=20)
    
    # Venue details for venue owners
    venue_name: Optional[str] = Field(None, max_length=200)
    venue_address: Optional[str] = Field(None, max_length=500)
    venue_city: Optional[str] = Field(None, max_length=100)
    venue_state: Optional[str] = Field(None, max_length=100)
    venue_pincode: Optional[str] = Field(None, min_length=6, max_length=6)
    venue_description: Optional[str] = Field(None, max_length=1000)
    venue_amenities: Optional[list] = []
    base_price_per_hour: Optional[float] = Field(None, ge=0)
    contact_phone: Optional[str] = Field(None, max_length=15)
    whatsapp_number: Optional[str] = Field(None, max_length=15)
    
    @validator('mobile')
    def validate_mobile(cls, v):
        import re
        if not re.match(r'^\+91[6-9]\d{9}$', v):
            raise ValueError('Invalid Indian mobile number')
        return v
    
    @validator('business_name')
    def validate_business_fields(cls, v, values):
        if values.get('role') == 'venue_partner' and not v:
            raise ValueError('Business name is required for venue partners')
        return v
    
    @validator('venue_name')
    def validate_venue_fields(cls, v, values):
        if values.get('role') == 'venue_partner':
            if not v:
                raise ValueError('Venue name is required for venue partners')
        return v
    
    @validator('venue_address')
    def validate_venue_address(cls, v, values):
        if values.get('role') == 'venue_partner' and not v:
            raise ValueError('Venue address is required for venue partners')
        return v
    
    @validator('venue_pincode')
    def validate_venue_pincode(cls, v, values):
        if values.get('role') == 'venue_partner' and not v:
            raise ValueError('Venue pincode is required for venue partners')
        return v
    
    @validator('base_price_per_hour')
    def validate_base_price(cls, v, values):
        if values.get('role') == 'venue_partner':
            if v is None or v <= 0:
                raise ValueError('Valid base price per hour is required for venue partners')
        return v

class UserResponse(BaseModel):
    id: str
    mobile: str
    name: str
    email: Optional[str]
    role: str
    is_verified: bool
    created_at: datetime
    
    # Player fields
    sports_interests: Optional[list] = []
    location: Optional[str] = None
    
    # Venue Partner fields
    business_name: Optional[str] = None
    business_address: Optional[str] = None
    gst_number: Optional[str] = None
    total_venues: Optional[int] = 0
    total_revenue: Optional[float] = 0.0

class AuthService:
    """Unified Authentication Service"""
    
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.sms_service = MockSMSService()
        self.otp_storage = {}  # In-memory OTP storage for verification
        
    def create_access_token(self, data: dict, expires_delta: Optional[timedelta] = None):
        """Create JWT access token"""
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
        return encoded_jwt
    
    async def send_otp(self, mobile: str) -> Dict[str, Any]:
        """Send OTP to mobile number"""
        try:
            result = await self.sms_service.send_otp(mobile)
            
            if result["success"]:
                logger.info(f"OTP sent to {mobile}")
                # Return success without exposing OTP (except in development)
                return {
                    "success": True,
                    "message": result["message"],
                    "request_id": result["request_id"],
                    # Development only - remove in production
                    "dev_otp": result.get("mock_otp")
                }
            else:
                return result
                
        except Exception as e:
            logger.error(f"Send OTP error: {str(e)}")
            return {
                "success": False,
                "message": "Failed to send OTP"
            }
    
    async def verify_otp_only(self, mobile: str, otp: str) -> Dict[str, Any]:
        """Verify OTP without login/registration"""
        return await self.sms_service.verify_otp(mobile, otp)
    
    async def register_user(self, registration_data: UserRegistrationRequest) -> Dict[str, Any]:
        """Register new user after OTP verification"""
        try:
            # Verify OTP first
            otp_result = await self.sms_service.verify_otp(registration_data.mobile, registration_data.otp)
            if not otp_result["success"]:
                return otp_result
            
            # Check if user already exists
            existing_user = await self.db.users.find_one({"mobile": registration_data.mobile})
            if existing_user:
                return {
                    "success": False,
                    "message": "User with this mobile number already exists"
                }
            
            # Create new user
            user_id = str(uuid.uuid4())
            user_doc = {
                "_id": user_id,
                "mobile": registration_data.mobile,
                "name": registration_data.name,
                "email": registration_data.email,
                "role": registration_data.role,
                "is_verified": True,  # OTP verified
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
                "is_active": True
            }
            
            # Add role-specific fields
            if registration_data.role == "player":
                user_doc.update({
                    "sports_interests": registration_data.sports_interests or [],
                    "location": registration_data.location
                })
            elif registration_data.role == "venue_partner":
                user_doc.update({
                    "business_name": registration_data.business_name,
                    "business_address": registration_data.business_address,
                    "gst_number": registration_data.gst_number,
                    "total_venues": 1,  # Will have one venue after creation
                    "total_bookings": 0,
                    "total_revenue": 0.0
                })
            
            # Insert user
            await self.db.users.insert_one(user_doc)
            
            # Create venue automatically for venue partners
            if registration_data.role == "venue_partner":
                await self.create_initial_venue(user_id, registration_data)
            
            # Create access token
            access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
            access_token = self.create_access_token(
                data={"sub": user_id, "role": registration_data.role},
                expires_delta=access_token_expires
            )
            
            return {
                "success": True,
                "message": "User registered successfully",
                "access_token": access_token,
                "token_type": "bearer",
                "user": UserResponse(
                    id=user_doc["_id"],
                    mobile=user_doc["mobile"],
                    name=user_doc["name"],
                    email=user_doc.get("email"),
                    role=user_doc["role"],
                    is_verified=user_doc["is_verified"],
                    created_at=user_doc["created_at"],
                    sports_interests=user_doc.get("sports_interests"),
                    location=user_doc.get("location"),
                    business_name=user_doc.get("business_name"),
                    business_address=user_doc.get("business_address"),
                    gst_number=user_doc.get("gst_number"),
                    total_venues=user_doc.get("total_venues", 0),
                    total_revenue=user_doc.get("total_revenue", 0.0)
                )
            }
            
        except Exception as e:
            logger.error(f"Registration error: {str(e)}")
            return {
                "success": False,
                "message": "Registration failed"
            }
    
    async def create_initial_venue(self, owner_id: str, registration_data: UserRegistrationRequest):
        """Create initial venue for venue partner during registration"""
        try:
            venue_id = str(uuid.uuid4())
            
            # Create venue document
            venue_doc = {
                "_id": venue_id,
                "name": registration_data.venue_name,
                "owner_id": owner_id,
                "owner_name": registration_data.name,
                "sports_supported": [],  # Will be filled when arenas are added
                "address": registration_data.venue_address,
                "city": registration_data.venue_city,
                "state": registration_data.venue_state,
                "pincode": registration_data.venue_pincode,
                "description": registration_data.venue_description,
                "amenities": registration_data.venue_amenities or [],
                "base_price_per_hour": registration_data.base_price_per_hour,
                "contact_phone": registration_data.contact_phone or registration_data.mobile,
                "whatsapp_number": registration_data.whatsapp_number,
                "images": [],
                "rules_and_regulations": None,
                "cancellation_policy": None,
                "rating": 0.0,
                "total_bookings": 0,
                "total_reviews": 0,
                "is_active": True,
                "arenas": [],  # Empty initially, will be populated via UI
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            
            # Insert venue
            await self.db.venues.insert_one(venue_doc)
            logger.info(f"Initial venue created for owner {owner_id}: {venue_id}")
            
        except Exception as e:
            logger.error(f"Failed to create initial venue: {str(e)}")
            # Don't fail registration if venue creation fails
    
    async def login_user(self, mobile: str, otp: str) -> Dict[str, Any]:
        """Login existing user with mobile + OTP"""
        try:
            # Verify OTP first
            otp_result = await self.sms_service.verify_otp(mobile, otp)
            if not otp_result["success"]:
                return otp_result
            
            # Find user
            user = await self.db.users.find_one({"mobile": mobile})
            if not user:
                return {
                    "success": False,
                    "message": "User not registered. Please register first."
                }
            
            if not user.get("is_active", True):
                return {
                    "success": False,
                    "message": "Account is deactivated"
                }
            
            # Create access token
            access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
            access_token = self.create_access_token(
                data={"sub": user["_id"], "role": user["role"]},
                expires_delta=access_token_expires
            )
            
            return {
                "success": True,
                "message": "Login successful",
                "access_token": access_token,
                "token_type": "bearer",
                "user": UserResponse(
                    id=user["_id"],
                    mobile=user["mobile"],
                    name=user["name"],
                    email=user.get("email"),
                    role=user["role"],
                    is_verified=user.get("is_verified", False),
                    created_at=user["created_at"],
                    sports_interests=user.get("sports_interests"),
                    location=user.get("location"),
                    business_name=user.get("business_name"),
                    business_address=user.get("business_address"),
                    gst_number=user.get("gst_number"),
                    total_venues=user.get("total_venues", 0),
                    total_revenue=user.get("total_revenue", 0.0)
                )
            }
            
        except Exception as e:
            logger.error(f"Login error: {str(e)}")
            return {
                "success": False,
                "message": "Login failed"
            }
    
    async def get_user_by_id(self, user_id: str) -> Optional[dict]:
        """Get user by ID"""
        return await self.db.users.find_one({"_id": user_id})
    
    async def verify_token(self, token: str) -> Optional[dict]:
        """Verify JWT token and return user"""
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            user_id: str = payload.get("sub")
            if user_id is None:
                return None
            
            user = await self.get_user_by_id(user_id)
            return user
            
        except jwt.PyJWTError:
            return None
    
    # Progressive Onboarding Methods
    async def onboarding_step1(self, step1_data: OnboardingStep1Request) -> Dict[str, Any]:
        """Step 1: Basic user info with OTP verification"""
        try:
            # Verify OTP first
            otp_result = await self.sms_service.verify_otp(step1_data.mobile, step1_data.otp)
            if not otp_result["success"]:
                return otp_result
            
            # Check if user already exists
            existing_user = await self.db.users.find_one({"mobile": step1_data.mobile})
            if existing_user:
                return {
                    "success": False,
                    "message": "User with this mobile number already exists"
                }
            
            # Create new user with basic info
            user_id = str(uuid.uuid4())
            user_doc = {
                "_id": user_id,
                "mobile": step1_data.mobile,
                "first_name": step1_data.first_name,
                "last_name": step1_data.last_name,
                "name": f"{step1_data.first_name} {step1_data.last_name}",
                "email": step1_data.email,
                "role": "venue_partner",  # Progressive onboarding is for venue partners
                "is_verified": True,
                "onboarding_completed": False,
                "completed_steps": [1],
                "current_step": 2,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
                "is_active": True
            }
            
            await self.db.users.insert_one(user_doc)
            
            # Create access token
            access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
            access_token = self.create_access_token(
                data={"sub": user_id, "role": "venue_partner"},
                expires_delta=access_token_expires
            )
            
            return {
                "success": True,
                "message": "Step 1 completed successfully",
                "access_token": access_token,
                "token_type": "bearer",
                "user_id": user_id,
                "next_step": 2
            }
            
        except Exception as e:
            logger.error(f"Onboarding Step 1 error: {str(e)}")
            return {
                "success": False,
                "message": "Step 1 failed"
            }
    
    async def onboarding_step2(self, user_id: str, step2_data: OnboardingStep2Request) -> Dict[str, Any]:
        """Step 2: Venue basic information"""
        try:
            # Update user with venue info
            user_update = {
                "venue_name": step2_data.venue_name,
                "venue_address": step2_data.address,
                "venue_city": step2_data.city,
                "venue_state": step2_data.state,
                "venue_pincode": step2_data.pincode,
                "cover_photo": step2_data.cover_photo,
                "operating_days": step2_data.operating_days,
                "start_time": step2_data.start_time,
                "end_time": step2_data.end_time,
                "contact_phone": step2_data.contact_phone,
                "completed_steps": [1, 2],
                "current_step": 3,
                "updated_at": datetime.utcnow()
            }
            
            await self.db.users.update_one(
                {"_id": user_id},
                {"$set": user_update}
            )
            
            return {
                "success": True,
                "message": "Step 2 completed successfully",
                "next_step": 3
            }
            
        except Exception as e:
            logger.error(f"Onboarding Step 2 error: {str(e)}")
            return {
                "success": False,
                "message": "Step 2 failed"
            }
    
    async def onboarding_step3(self, user_id: str, step3_data: OnboardingStep3Request) -> Dict[str, Any]:
        """Step 3: Arena/Sport configuration"""
        try:
            # Create arena document
            arena_id = str(uuid.uuid4())
            arena_doc = {
                "_id": arena_id,
                "name": f"{step3_data.sport_type} Arena",
                "sport": step3_data.sport_type,
                "owner_id": user_id,
                "number_of_courts": step3_data.number_of_courts,
                "slot_duration": step3_data.slot_duration,
                "price_per_slot": step3_data.price_per_slot,
                "is_active": True,
                "created_at": datetime.utcnow()
            }
            
            await self.db.arenas.insert_one(arena_doc)
            
            # Update user progress
            await self.db.users.update_one(
                {"_id": user_id},
                {"$set": {
                    "completed_steps": [1, 2, 3],
                    "current_step": 4,
                    "has_arena": True,
                    "updated_at": datetime.utcnow()
                }}
            )
            
            return {
                "success": True,
                "message": "Step 3 completed successfully",
                "arena_id": arena_id,
                "next_step": 4
            }
            
        except Exception as e:
            logger.error(f"Onboarding Step 3 error: {str(e)}")
            return {
                "success": False,
                "message": "Step 3 failed"
            }
    
    async def onboarding_step4(self, user_id: str, step4_data: OnboardingStep4Request) -> Dict[str, Any]:
        """Step 4: Amenities and rules"""
        try:
            # Update user with amenities and rules
            await self.db.users.update_one(
                {"_id": user_id},
                {"$set": {
                    "amenities": step4_data.amenities,
                    "rules": step4_data.rules,
                    "completed_steps": [1, 2, 3, 4],
                    "current_step": 5,
                    "updated_at": datetime.utcnow()
                }}
            )
            
            return {
                "success": True,
                "message": "Step 4 completed successfully",
                "next_step": 5
            }
            
        except Exception as e:
            logger.error(f"Onboarding Step 4 error: {str(e)}")
            return {
                "success": False,
                "message": "Step 4 failed"
            }
    
    async def onboarding_step5(self, user_id: str, step5_data: OnboardingStep5Request) -> Dict[str, Any]:
        """Step 5: Payment details (optional)"""
        try:
            # Update user with payment info
            payment_info = {}
            if step5_data.bank_account_number:
                payment_info["bank_account_number"] = step5_data.bank_account_number
            if step5_data.bank_ifsc:
                payment_info["bank_ifsc"] = step5_data.bank_ifsc
            if step5_data.bank_account_holder:
                payment_info["bank_account_holder"] = step5_data.bank_account_holder
            if step5_data.upi_id:
                payment_info["upi_id"] = step5_data.upi_id
            
            await self.db.users.update_one(
                {"_id": user_id},
                {"$set": {
                    **payment_info,
                    "completed_steps": [1, 2, 3, 4, 5],
                    "current_step": 6,
                    "onboarding_completed": True,
                    "can_go_live": True,
                    "updated_at": datetime.utcnow()
                }}
            )
            
            return {
                "success": True,
                "message": "Onboarding completed successfully!",
                "onboarding_completed": True
            }
            
        except Exception as e:
            logger.error(f"Onboarding Step 5 error: {str(e)}")
            return {
                "success": False,
                "message": "Step 5 failed"
            }
    
    async def get_onboarding_status(self, user_id: str) -> Dict[str, Any]:
        """Get current onboarding status"""
        try:
            user = await self.db.users.find_one({"_id": user_id})
            if not user:
                return {
                    "success": False,
                    "message": "User not found"
                }
            
            # Check if user has venue and arena
            has_venue = bool(user.get("venue_name"))
            has_arena = bool(user.get("has_arena", False))
            
            return {
                "success": True,
                "status": OnboardingStatusResponse(
                    user_id=user_id,
                    mobile=user["mobile"],
                    onboarding_completed=user.get("onboarding_completed", False),
                    completed_steps=user.get("completed_steps", []),
                    current_step=user.get("current_step", 1),
                    has_venue=has_venue,
                    has_arena=has_arena,
                    can_go_live=user.get("can_go_live", False)
                )
            }
            
        except Exception as e:
            logger.error(f"Get onboarding status error: {str(e)}")
            return {
                "success": False,
                "message": "Failed to get onboarding status"
            }
    
    async def check_user_exists(self, mobile: str) -> Dict[str, Any]:
        """Check if user exists and return onboarding status"""
        try:
            user = await self.db.users.find_one({"mobile": mobile})
            
            if not user:
                return {
                    "success": True,
                    "user_exists": False,
                    "message": "User not found. Ready for new registration.",
                    "onboarding_status": None
                }
            
            # User exists - check onboarding status
            completed_steps = user.get("completed_steps", [])
            current_step = user.get("current_step", 1)
            onboarding_completed = user.get("onboarding_completed", False)
            
            # Check if user has venue and arena
            has_venue = bool(user.get("venue_name"))
            has_arena = bool(user.get("has_arena", False))
            can_go_live = user.get("can_go_live", False)
            
            return {
                "success": True,
                "user_exists": True,
                "message": f"User found. Current step: {current_step}",
                "onboarding_status": {
                    "user_id": user["_id"],
                    "mobile": user["mobile"],
                    "name": user.get("name", f"{user.get('first_name', '')} {user.get('last_name', '')}").strip(),
                    "onboarding_completed": onboarding_completed,
                    "completed_steps": completed_steps,
                    "current_step": current_step,
                    "has_venue": has_venue,
                    "has_arena": has_arena,
                    "can_go_live": can_go_live
                }
            }
            
        except Exception as e:
            logger.error(f"Check user exists error: {str(e)}")
            return {
                "success": False,
                "message": "Failed to check user status"
            }
    
    async def create_temp_user(self, mobile: str) -> str:
        """Create temporary user record for onboarding process"""
        try:
            temp_user = {
                "mobile": mobile,
                "role": "venue_partner",
                "temp_user": True,
                "created_at": datetime.utcnow(),
                "onboarding_completed": False,
                "current_step": 1,
                "completed_steps": []
            }
            
            result = await self.db.temp_users.insert_one(temp_user)
            return str(result.inserted_id)
            
        except Exception as e:
            logger.error(f"Create temp user error: {str(e)}")
            return None
    
    async def verify_otp_only(self, mobile: str, otp: str) -> Dict[str, Any]:
        """Verify OTP without creating user or token"""
        try:
            # Use SMS service to verify OTP
            result = await self.sms_service.verify_otp(mobile, otp)
            return result
            
        except Exception as e:
            logger.error(f"Verify OTP only error: {str(e)}")
            return {
                "success": False,
                "message": "OTP verification failed"
            }
    
    async def get_user_by_mobile(self, mobile: str) -> Optional[Dict[str, Any]]:
        """Get user by mobile number"""
        try:
            user = await self.db.users.find_one({"mobile": mobile})
            if user:
                user["_id"] = str(user["_id"])
            return user
        except Exception as e:
            logger.error(f"Get user by mobile error: {str(e)}")
            return None