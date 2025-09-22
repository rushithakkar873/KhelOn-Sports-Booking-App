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

class UserRegistrationRequest(BaseModel):
    mobile: str = Field(..., min_length=13, max_length=13)
    otp: str = Field(..., min_length=6, max_length=6)
    name: str = Field(..., min_length=2, max_length=100)
    email: Optional[EmailStr] = None
    role: str = Field(..., pattern="^(player|venue_owner)$")
    
    # Player specific fields
    sports_interests: Optional[list] = []
    location: Optional[str] = None
    
    # Venue Owner specific fields
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
        if values.get('role') == 'venue_owner' and not v:
            raise ValueError('Business name is required for venue owners')
        return v
    
    @validator('venue_name')
    def validate_venue_fields(cls, v, values):
        if values.get('role') == 'venue_owner':
            if not v:
                raise ValueError('Venue name is required for venue owners')
        return v
    
    @validator('venue_address')
    def validate_venue_address(cls, v, values):
        if values.get('role') == 'venue_owner' and not v:
            raise ValueError('Venue address is required for venue owners')
        return v
    
    @validator('venue_pincode')
    def validate_venue_pincode(cls, v, values):
        if values.get('role') == 'venue_owner' and not v:
            raise ValueError('Venue pincode is required for venue owners')
        return v
    
    @validator('base_price_per_hour')
    def validate_base_price(cls, v, values):
        if values.get('role') == 'venue_owner':
            if v is None or v <= 0:
                raise ValueError('Valid base price per hour is required for venue owners')
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
    
    # Venue Owner fields
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
            elif registration_data.role == "venue_owner":
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
            
            # Create venue automatically for venue owners
            if registration_data.role == "venue_owner":
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
        """Create initial venue for venue owner during registration"""
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