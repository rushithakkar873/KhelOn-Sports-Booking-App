"""
Unified Authentication Service for KhelON
Clean, scalable auth service with progressive onboarding
"""

import os
import jwt
import uuid
import random
import string
import logging
from datetime import datetime, timedelta
from typing import Dict, Optional, Any, List
from motor.motor_asyncio import AsyncIOMotorDatabase

from unified_models import (
    MobileOTPRequest, OTPVerifyRequest, UserLoginRequest,
    OnboardingStep1Request, OnboardingStep2Request, OnboardingStep3Request,
    OnboardingStep4Request, OnboardingStep5Request,
    UserResponse, OnboardingStatusResponse, CreateArenaRequest
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Security configuration
SECRET_KEY = os.environ.get('SECRET_KEY', 'your-secret-key-change-this')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

class MockSMSService:
    """Mock SMS service for OTP verification"""
    
    def __init__(self):
        self.sent_otps = {}
        
    async def send_otp(self, mobile_number: str) -> Dict[str, Any]:
        """Send OTP via mock SMS service"""
        try:
            otp_code = ''.join(random.choices(string.digits, k=6))
            expiry_time = datetime.utcnow() + timedelta(minutes=5)
            
            self.sent_otps[mobile_number] = {
                "otp": otp_code,
                "expiry": expiry_time,
                "attempts": 0
            }
            
            logger.info(f"🔐 MOCK SMS: OTP {otp_code} sent to {mobile_number}")
            
            return {
                "success": True,
                "message": "OTP sent successfully",
                "request_id": f"mock_{uuid.uuid4().hex[:8]}",
                "mock_otp": otp_code
            }
            
        except Exception as e:
            logger.error(f"Failed to send OTP: {str(e)}")
            return {"success": False, "message": "Failed to send OTP"}
    
    async def verify_otp(self, mobile_number: str, otp_code: str) -> Dict[str, Any]:
        """Verify OTP code"""
        try:
            stored_data = self.sent_otps.get(mobile_number)
            
            if not stored_data:
                return {
                    "success": False,
                    "message": "No OTP found for this number. Please request a new OTP."
                }
            
            if datetime.utcnow() > stored_data["expiry"]:
                del self.sent_otps[mobile_number]
                return {
                    "success": False,
                    "message": "OTP has expired. Please request a new OTP."
                }
            
            if stored_data["attempts"] >= 3:
                del self.sent_otps[mobile_number]
                return {
                    "success": False,
                    "message": "Maximum verification attempts exceeded. Please request a new OTP."
                }
            
            self.sent_otps[mobile_number]["attempts"] += 1
            
            if stored_data["otp"] == otp_code:
                del self.sent_otps[mobile_number]
                return {"success": True, "message": "OTP verified successfully"}
            else:
                return {"success": False, "message": "Invalid OTP. Please try again."}
                
        except Exception as e:
            logger.error(f"OTP verification error: {str(e)}")
            return {"success": False, "message": "Verification failed. Please try again."}

class UnifiedAuthService:
    """Unified Authentication Service with progressive onboarding"""
    
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
                return {
                    "success": True,
                    "message": result["message"],
                    "request_id": result["request_id"],
                    "dev_otp": result.get("mock_otp")  # Development only
                }
            else:
                return result
                
        except Exception as e:
            logger.error(f"Send OTP error: {str(e)}")
            return {"success": False, "message": "Failed to send OTP"}
    
    async def verify_otp_only(self, mobile: str, otp: str) -> Dict[str, Any]:
        """Verify OTP without login"""
        return await self.sms_service.verify_otp(mobile, otp)
    
    async def login_user(self, login_data: UserLoginRequest) -> Dict[str, Any]:
        """Login user with mobile + OTP"""
        try:
            # Verify OTP first
            otp_result = await self.sms_service.verify_otp(login_data.mobile, login_data.otp)
            if not otp_result["success"]:
                return otp_result
            
            # Find user
            user = await self.db.users.find_one({"mobile": login_data.mobile})
            if not user:
                return {
                    "success": False,
                    "message": "User not registered. Please register first.",
                    "user_exists": False
                }
            
            if not user.get("is_active", True):
                return {"success": False, "message": "Account is deactivated"}
            
            # Create access token
            access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
            access_token = self.create_access_token(
                data={"sub": user["_id"], "role": user["role"]},
                expires_delta=access_token_expires
            )
            
            # Get arena count
            arena_count = await self.db.arenas.count_documents({"owner_id": user["_id"]})
            
            return {
                "success": True,
                "message": "Login successful",
                "access_token": access_token,
                "token_type": "bearer",
                "user_exists": True,
                "user": UserResponse(
                    id=user["_id"],
                    mobile=user["mobile"],
                    first_name="",  # Not used in new unified model
                    last_name="",   # Not used in new unified model  
                    name=user.get("name", ""),
                    email=user.get("email"),
                    role=user["role"],
                    is_verified=user.get("is_verified", False),
                    onboarding_completed=user.get("onboarding_completed", False),
                    completed_steps=user.get("completed_steps", []),
                    current_step=user.get("current_step", 1),
                    business_name=user.get("business_name"),
                    business_address=user.get("business_address"),
                    gst_number=user.get("gst_number"),
                    venue_name=user.get("venue_name"),
                    venue_city=user.get("venue_city"),
                    has_venue=bool(user.get("venue_name")),
                    has_arenas=arena_count > 0,
                    can_go_live=user.get("can_go_live", False),
                    total_arenas=arena_count,
                    total_bookings=user.get("total_bookings", 0),
                    total_revenue=user.get("total_revenue", 0.0),
                    created_at=user["created_at"]
                )
            }
            
        except Exception as e:
            logger.error(f"Login error: {str(e)}")
            return {"success": False, "message": "Login failed"}
    
    # ================================
    # PROGRESSIVE ONBOARDING METHODS
    # ================================
    
    async def onboarding_step1_jwt(self, step1_data, current_user_id: str) -> Dict[str, Any]:
        """Step 1: Basic user info (JWT authenticated - Clean Unified Schema)"""
        try:
            # Get existing user (should exist from login)
            existing_user = await self.db.users.find_one({"_id": current_user_id})
            if not existing_user:
                return {
                    "success": False,
                    "message": "User not found"
                }
            
            # Update user with step 1 data according to unified schema
            update_data = {
                "name": step1_data.name,  # Single name field
                "email": step1_data.email if step1_data.email else existing_user.get("email"),
                "gst_number": getattr(step1_data, 'gst_number', None),  # Only GST for tax compliance
                
                # Onboarding progress
                "completed_steps": [1],
                "current_step": 2,
                "onboarding_completed": False,
                
                # Flags
                "is_active": True,
                "can_go_live": False,
                
                # Stats (initialize)
                "total_venues": 0,
                "total_bookings": 0,
                "total_revenue": 0.0,
                
                "updated_at": datetime.utcnow()
            }
            
            await self.db.users.update_one(
                {"_id": current_user_id},
                {"$set": update_data}
            )
            
            return {
                "success": True,
                "message": "Step 1 completed successfully",
                "user_id": current_user_id,
                "next_step": 2
            }
                
        except Exception as e:
            logger.error(f"Onboarding Step 1 JWT error: {str(e)}")
            return {
                "success": False,
                "message": "Step 1 failed"
            }

    async def onboarding_step1(self, step1_data: OnboardingStep1Request) -> Dict[str, Any]:
        """Step 1: Create user with basic info"""
        try:
            # Verify OTP first
            otp_result = await self.sms_service.verify_otp(step1_data.mobile, step1_data.otp)
            if not otp_result["success"]:
                return otp_result
            
            # Check if user already exists
            existing_user = await self.db.users.find_one({"mobile": step1_data.mobile})
            if existing_user:
                return {"success": False, "message": "User with this mobile number already exists"}
            
            # Create new user
            user_id = str(uuid.uuid4())
            user_doc = {
                "_id": user_id,
                "mobile": step1_data.mobile,
                "name": step1_data.name,
                "email": step1_data.email,
                "role": step1_data.role,
                "is_verified": True,
                
                # Onboarding progress
                "onboarding_completed": False,
                "completed_steps": [1],
                "current_step": 2,
                
                # Business info (optional in step 1)
                "business_name": step1_data.business_name,
                "business_address": step1_data.business_address,
                "gst_number": step1_data.gst_number,
                
                # Flags
                "has_venue": False,
                "has_arenas": False,
                "can_go_live": False,
                "is_active": True,
                
                # Stats
                "total_bookings": 0,
                "total_revenue": 0.0,
                
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            
            await self.db.users.insert_one(user_doc)
            
            # Create access token
            access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
            access_token = self.create_access_token(
                data={"sub": user_id, "role": step1_data.role},
                expires_delta=access_token_expires
            )
            
            return {
                "success": True,
                "message": "Step 1 completed successfully",
                "access_token": access_token,
                "token_type": "bearer",
                "next_step": 2,
                "user_id": user_id
            }
            
        except Exception as e:
            logger.error(f"Onboarding Step 1 error: {str(e)}")
            return {"success": False, "message": "Step 1 failed"}
    
    async def onboarding_step2(self, user_id: str, step2_data: OnboardingStep2Request) -> Dict[str, Any]:
        """Step 2: Create venue with empty arenas array (Unified Schema)"""
        try:
            # Get user info
            user = await self.db.users.find_one({"_id": user_id})
            if not user:
                return {"success": False, "message": "User not found"}
            
            # Create venue document according to unified schema
            venue_id = str(uuid.uuid4())
            venue_doc = {
                "_id": venue_id,
                "name": step2_data.venue_name,
                "owner_id": user_id,
                "owner_name": user.get("name", ""),
                
                # Venue basic info
                "address": step2_data.address,
                "city": step2_data.city,
                "state": step2_data.state,
                "pincode": step2_data.pincode,
                "description": "",  # Will be set later if needed
                
                # Operational info
                "contact_number": step2_data.contact_phone,  # Renamed from contact_phone
                "whatsapp_number": step2_data.contact_phone,  # Default to same as contact
                "operating_days": step2_data.operating_days,
                "start_time": step2_data.start_time,
                "end_time": step2_data.end_time,
                
                # Venue amenities & policies (will be set in step 4)
                "amenities": [],
                "rules": "",
                "cancellation_policy": "24 hours advance notice required",
                
                # Media
                "cover_photo": step2_data.cover_photo if step2_data.cover_photo else "",
                "images": [],
                
                # Empty arenas array (will be populated in step 3)
                "arenas": [],
                
                # Computed fields
                "sports_supported": [],  # Will be computed from arenas
                
                # Statistics
                "rating": 0.0,
                "total_bookings": 0,
                "total_reviews": 0,
                
                # Status
                "is_active": True,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            
            # Insert venue
            await self.db.venues.insert_one(venue_doc)
            
            # Update user onboarding progress and venue count
            await self.db.users.update_one(
                {"_id": user_id},
                {"$set": {
                    "completed_steps": [1, 2],
                    "current_step": 3,
                    "total_venues": 1,  # First venue
                    "updated_at": datetime.utcnow()
                }}
            )
            
            return {
                "success": True,
                "message": "Step 2 completed successfully",
                "venue_id": venue_id,
                "next_step": 3
            }
            
        except Exception as e:
            logger.error(f"Onboarding Step 2 error: {str(e)}")
            return {"success": False, "message": "Step 2 failed"}
    
    async def onboarding_step3(self, user_id: str, step3_data: OnboardingStep3Request) -> Dict[str, Any]:
        """Step 3: Add first arena to venue (Unified Schema)"""
        try:
            # Get user's venue (created in step 2)
            venue = await self.db.venues.find_one({"owner_id": user_id})
            if not venue:
                return {"success": False, "message": "Venue not found. Please complete step 2 first."}
            
            # Create arena according to unified schema (embedded in venue)
            arena_id = str(uuid.uuid4())
            arena_name = step3_data.arena_name or f"{step3_data.sport_type} Arena"
            
            # Calculate price per slot based on slot duration and hourly rate
            slot_duration_hours = step3_data.slot_duration / 60  # Convert minutes to hours
            base_price_per_slot = step3_data.price_per_hour * slot_duration_hours
            
            arena_data = {
                "_id": arena_id,
                "name": arena_name,
                "sport": step3_data.sport_type,
                "capacity": step3_data.capacity,
                "description": step3_data.description or f"Professional {step3_data.sport_type} arena",
                "amenities": [],  # Will be set in step 4
                "base_price_per_slot": base_price_per_slot,  # Per slot pricing (unified schema)
                "images": [],
                "slots": [],  # Will be populated via UI later
                "is_active": True,
                "created_at": datetime.utcnow()
            }
            
            # Add arena to venue's arenas array
            await self.db.venues.update_one(
                {"_id": venue["_id"]},
                {
                    "$push": {"arenas": arena_data},
                    "$set": {
                        "sports_supported": [step3_data.sport_type],  # First sport
                        "updated_at": datetime.utcnow()
                    }
                }
            )
            
            # Update user progress
            await self.db.users.update_one(
                {"_id": user_id},
                {"$set": {
                    "completed_steps": [1, 2, 3],
                    "current_step": 4,
                    "updated_at": datetime.utcnow()
                }}
            )
            
            return {
                "success": True,
                "message": "Step 3 completed successfully",
                "arena_id": arena_id,
                "venue_id": venue["_id"],
                "next_step": 4
            }
            
        except Exception as e:
            logger.error(f"Onboarding Step 3 error: {str(e)}")
            return {"success": False, "message": "Step 3 failed"}
    
    async def onboarding_step4(self, user_id: str, step4_data: OnboardingStep4Request) -> Dict[str, Any]:
        """Step 4: Update venue amenities and rules (Unified Schema)"""
        try:
            # Get user's venue
            venue = await self.db.venues.find_one({"owner_id": user_id})
            if not venue:
                return {"success": False, "message": "Venue not found"}
            
            # Update venue with amenities and rules
            venue_update = {
                "amenities": step4_data.amenities,
                "rules": step4_data.rules or "Please follow venue guidelines",
                "updated_at": datetime.utcnow()
            }
            
            await self.db.venues.update_one(
                {"_id": venue["_id"]},
                {"$set": venue_update}
            )
            
            # Update arena amenities (arena-specific or use venue amenities)
            arena_amenities = getattr(step4_data, 'arena_amenities', None) or step4_data.amenities
            
            # Update the first arena's amenities (since we only have one arena at this point)
            if venue.get("arenas") and len(venue["arenas"]) > 0:
                await self.db.venues.update_one(
                    {"_id": venue["_id"], "arenas.0._id": venue["arenas"][0]["_id"]},
                    {"$set": {"arenas.0.amenities": arena_amenities}}
                )
            
            # Update user progress
            await self.db.users.update_one(
                {"_id": user_id},
                {"$set": {
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
            return {"success": False, "message": "Step 4 failed"}
    
    async def onboarding_step5(self, user_id: str, step5_data: OnboardingStep5Request) -> Dict[str, Any]:
        """Step 5: Add payment information to user (Unified Schema)"""
        try:
            # Prepare payment info according to unified schema
            payment_info = {}
            if step5_data.bank_account_number:
                payment_info["bank_account_number"] = step5_data.bank_account_number
            if step5_data.bank_ifsc:
                payment_info["bank_ifsc"] = step5_data.bank_ifsc
            if step5_data.bank_account_holder:
                payment_info["bank_account_holder"] = step5_data.bank_account_holder
            if step5_data.upi_id:
                payment_info["upi_id"] = step5_data.upi_id
            
            # Complete onboarding - update user with final data
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
                "message": "Onboarding completed successfully! Your venue is now ready to go live.",
                "onboarding_completed": True
            }
            
        except Exception as e:
            logger.error(f"Onboarding Step 5 error: {str(e)}")
            return {"success": False, "message": "Step 5 failed"}
    
    async def get_onboarding_status(self, user_id: str) -> Dict[str, Any]:
        """Get current onboarding status"""
        try:
            user = await self.db.users.find_one({"_id": user_id})
            if not user:
                return {"success": False, "message": "User not found"}
            
            # Check if user has arenas
            arena_count = await self.db.arenas.count_documents({"owner_id": user_id})
            
            return {
                "success": True,
                "status": OnboardingStatusResponse(
                    user_id=user["_id"],
                    mobile=user["mobile"],
                    onboarding_completed=user.get("onboarding_completed", False),
                    completed_steps=user.get("completed_steps", []),
                    current_step=user.get("current_step", 1),
                    has_venue=bool(user.get("venue_name")),
                    has_arenas=arena_count > 0,
                    can_go_live=user.get("can_go_live", False)
                )
            }
            
        except Exception as e:
            logger.error(f"Get onboarding status error: {str(e)}")
            return {"success": False, "message": "Failed to get onboarding status"}
    
    async def get_user_by_id(self, user_id: str) -> Optional[dict]:
        """Get user by ID"""
        return await self.db.users.find_one({"_id": user_id})
    
    async def get_user_by_mobile(self, mobile: str) -> Optional[dict]:
        """Get user by mobile number"""
        return await self.db.users.find_one({"mobile": mobile})
    
    async def create_temp_user(self, mobile: str) -> str:
        """Create temporary user for onboarding process"""
        temp_user_id = str(uuid.uuid4())
        temp_user = {
            "_id": temp_user_id,
            "mobile": mobile,
            "role": "venue_partner",
            "is_temp": True,
            "created_at": datetime.utcnow()
        }
        await self.db.temp_users.insert_one(temp_user)
        return temp_user_id
    
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