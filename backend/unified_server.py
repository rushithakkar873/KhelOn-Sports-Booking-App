"""
KhelON Unified API Server
Clean, scalable backend with unified data model
"""

from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
import uuid
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
import razorpay
from pydantic import BaseModel

# Import our unified models and service
from unified_models import (
    MobileOTPRequest, OTPVerifyRequest, UserLoginRequest,
    OnboardingStep1Request, OnboardingStep2Request, OnboardingStep3Request,
    OnboardingStep4Request, OnboardingStep5Request,
    UserResponse, ArenaResponse, BookingResponse, OnboardingStatusResponse,
    CreateArenaRequest, UpdateArenaRequest, CreateBookingRequest,
    VenuePartnerBookingResponse, AnalyticsDashboardResponse,
    ArenaSlot
)
from unified_auth_service import UnifiedAuthService

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'playon_db')]

# Initialize services
auth_service = UnifiedAuthService(db)
security = HTTPBearer()

# Create the main app
app = FastAPI(
    title="KhelON API - Unified System", 
    version="3.0.0",
    description="Sports venue booking platform with unified data model"
)
api_router = APIRouter(prefix="/api")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize Razorpay client (mock for now)
try:
    razorpay_client = razorpay.Client(auth=("mock_key", "mock_secret"))
except:
    logger.warning("Razorpay not configured, using mock payment system")
    razorpay_client = None

# Dependencies
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get current authenticated user"""
    try:
        token = credentials.credentials
        user = await auth_service.verify_token(token)
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return user
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

async def get_current_venue_partner(current_user: dict = Depends(get_current_user)):
    """Get current user and verify they are a venue partner"""
    if current_user["role"] != "venue_partner":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Venue partner role required."
        )
    return current_user

# ================================
# CORE API ROUTES
# ================================

@app.get("/")
async def health_check():
    """API Health Check"""
    return {
        "status": "healthy",
        "service": "KhelON API v3.0.0 - Unified System",
        "timestamp": datetime.utcnow().isoformat(),
        "auth_system": "Unified Mobile OTP",
        "data_model": "Single Source of Truth"
    }

# ================================
# AUTHENTICATION ROUTES
# ================================

@api_router.post("/auth/send-otp")
async def send_otp(request: MobileOTPRequest):
    """Send OTP to mobile number"""
    result = await auth_service.send_otp(request.mobile)
    
    if result["success"]:
        return {
            "success": True,
            "message": result["message"],
            "request_id": result["request_id"],
            "dev_info": f"OTP: {result.get('dev_otp', 'N/A')}"
        }
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result["message"]
        )

@api_router.post("/auth/verify-otp")
async def verify_otp(request: OTPVerifyRequest):
    """Verify OTP (without login)"""
    result = await auth_service.verify_otp_only(request.mobile, request.otp)
    
    if result["success"]:
        return {"success": True, "message": result["message"]}
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result["message"]
        )

@api_router.post("/auth/login")
async def login_user(request: UserLoginRequest):
    """Login user with mobile + OTP"""
    result = await auth_service.login_user(request)
    
    if result["success"]:
        return {
            "success": True,
            "message": result["message"],
            "access_token": result["access_token"],
            "token_type": result["token_type"],
            "user_exists": result["user_exists"],
            "user": result["user"]
        }
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result["message"]
        )

@api_router.get("/auth/profile", response_model=UserResponse)
async def get_user_profile(current_user: dict = Depends(get_current_user)):
    """Get current user profile"""
    # Get arena count for user
    arena_count = await db.arenas.count_documents({"owner_id": current_user["_id"]})
    
    return UserResponse(
        id=current_user["_id"],
        mobile=current_user["mobile"],
        first_name=current_user.get("first_name", ""),
        last_name=current_user.get("last_name", ""),
        name=f"{current_user.get('first_name', '')} {current_user.get('last_name', '')}".strip() or current_user.get("name", ""),
        email=current_user.get("email"),
        role=current_user["role"],
        is_verified=current_user.get("is_verified", False),
        onboarding_completed=current_user.get("onboarding_completed", False),
        completed_steps=current_user.get("completed_steps", []),
        current_step=current_user.get("current_step", 1),
        business_name=current_user.get("business_name"),
        business_address=current_user.get("business_address"),
        gst_number=current_user.get("gst_number"),
        venue_name=current_user.get("venue_name"),
        venue_city=current_user.get("venue_city"),
        has_venue=bool(current_user.get("venue_name")),
        has_arenas=arena_count > 0,
        can_go_live=current_user.get("can_go_live", False),
        total_arenas=arena_count,
        total_bookings=current_user.get("total_bookings", 0),
        total_revenue=current_user.get("total_revenue", 0.0),
        created_at=current_user["created_at"]
    )

# ================================
# PROGRESSIVE ONBOARDING ROUTES
# ================================

@api_router.post("/onboarding/step1")
async def onboarding_step1(request: OnboardingStep1Request):
    """Onboarding Step 1: Create user with basic info"""
    result = await auth_service.onboarding_step1(request)
    
    if result["success"]:
        return {
            "success": True,
            "message": result["message"],
            "access_token": result["access_token"],
            "token_type": result["token_type"],
            "next_step": result["next_step"],
            "user_id": result["user_id"]
        }
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result["message"]
        )

@api_router.post("/onboarding/step2")
async def onboarding_step2(
    request: OnboardingStep2Request,
    current_user: dict = Depends(get_current_venue_partner)
):
    """Onboarding Step 2: Venue basic information"""
    result = await auth_service.onboarding_step2(current_user["_id"], request)
    
    if result["success"]:
        return {"success": True, "message": result["message"], "next_step": result["next_step"]}
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result["message"]
        )

@api_router.post("/onboarding/step3")
async def onboarding_step3(
    request: OnboardingStep3Request,
    current_user: dict = Depends(get_current_venue_partner)
):
    """Onboarding Step 3: Create first arena"""
    result = await auth_service.onboarding_step3(current_user["_id"], request)
    
    if result["success"]:
        return {
            "success": True,
            "message": result["message"],
            "arena_id": result["arena_id"],
            "next_step": result["next_step"]
        }
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result["message"]
        )

@api_router.post("/onboarding/step4")
async def onboarding_step4(
    request: OnboardingStep4Request,
    current_user: dict = Depends(get_current_venue_partner)
):
    """Onboarding Step 4: Amenities and rules"""
    result = await auth_service.onboarding_step4(current_user["_id"], request)
    
    if result["success"]:
        return {"success": True, "message": result["message"], "next_step": result["next_step"]}
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result["message"]
        )

@api_router.post("/onboarding/step5")
async def onboarding_step5(
    request: OnboardingStep5Request,
    current_user: dict = Depends(get_current_venue_partner)
):
    """Onboarding Step 5: Payment details"""
    result = await auth_service.onboarding_step5(current_user["_id"], request)
    
    if result["success"]:
        return {
            "success": True,
            "message": result["message"],
            "onboarding_completed": result["onboarding_completed"]
        }
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result["message"]
        )

@api_router.get("/onboarding/status", response_model=OnboardingStatusResponse)
async def get_onboarding_status(current_user: dict = Depends(get_current_venue_partner)):
    """Get current onboarding status"""
    result = await auth_service.get_onboarding_status(current_user["_id"])
    
    if result["success"]:
        return result["status"]
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result["message"]
        )

# ================================
# ARENA MANAGEMENT ROUTES
# ================================

@api_router.get("/venue-partner/arenas", response_model=List[ArenaResponse])
async def get_partner_arenas(
    current_partner: dict = Depends(get_current_venue_partner),
    skip: int = 0,
    limit: int = 10,
    is_active: Optional[bool] = None
):
    """Get arenas owned by current venue partner"""
    query = {"owner_id": current_partner["_id"]}
    if is_active is not None:
        query["is_active"] = is_active
    
    arenas = await db.arenas.find(query).skip(skip).limit(limit).to_list(length=limit)
    
    arena_responses = []
    for arena in arenas:
        # Convert slots to proper format
        slots = []
        for slot in arena.get("slots", []):
            slots.append(ArenaSlot(
                id=slot.get("_id", str(uuid.uuid4())),
                day_of_week=slot["day_of_week"],
                start_time=slot["start_time"],
                end_time=slot["end_time"],
                is_available=slot.get("is_available", True)
            ))
        
        arena_responses.append(ArenaResponse(
            id=arena["_id"],
            name=arena["name"],
            sport=arena["sport"],
            owner_id=arena["owner_id"],
            venue_name=arena["venue_name"],
            capacity=arena["capacity"],
            description=arena.get("description"),
            amenities=arena.get("amenities", []),
            base_price_per_hour=arena["base_price_per_hour"],
            images=arena.get("images", []),
            slots=slots,
            is_active=arena.get("is_active", True),
            created_at=arena["created_at"]
        ))
    
    return arena_responses

@api_router.post("/venue-partner/arenas", response_model=ArenaResponse)
async def create_arena(
    request: CreateArenaRequest,
    current_partner: dict = Depends(get_current_venue_partner)
):
    """Create new arena"""
    arena_id = str(uuid.uuid4())
    
    arena_doc = {
        "_id": arena_id,
        "name": request.name,
        "sport": request.sport,
        "owner_id": current_partner["_id"],
        "venue_name": current_partner.get("venue_name", ""),
        "capacity": request.capacity,
        "description": request.description,
        "amenities": request.amenities,
        "base_price_per_hour": request.base_price_per_hour,
        "images": request.images,
        "slots": request.slots,
        "is_active": True,
        "created_at": datetime.utcnow()
    }
    
    await db.arenas.insert_one(arena_doc)
    
    # Convert slots for response
    slots = []
    for slot in arena_doc.get("slots", []):
        slots.append(ArenaSlot(
            id=slot.get("_id", str(uuid.uuid4())),
            day_of_week=slot["day_of_week"],
            start_time=slot["start_time"],
            end_time=slot["end_time"],
            is_available=slot.get("is_available", True)
        ))
    
    return ArenaResponse(
        id=arena_doc["_id"],
        name=arena_doc["name"],
        sport=arena_doc["sport"],
        owner_id=arena_doc["owner_id"],
        venue_name=arena_doc["venue_name"],
        capacity=arena_doc["capacity"],
        description=arena_doc.get("description"),
        amenities=arena_doc.get("amenities", []),
        base_price_per_hour=arena_doc["base_price_per_hour"],
        images=arena_doc.get("images", []),
        slots=slots,
        is_active=arena_doc.get("is_active", True),
        created_at=arena_doc["created_at"]
    )

@api_router.get("/venue-partner/arenas/{arena_id}", response_model=ArenaResponse)
async def get_arena_details(
    arena_id: str,
    current_partner: dict = Depends(get_current_venue_partner)
):
    """Get specific arena details"""
    arena = await db.arenas.find_one({
        "_id": arena_id,
        "owner_id": current_partner["_id"]
    })
    
    if not arena:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Arena not found"
        )
    
    # Convert slots for response
    slots = []
    for slot in arena.get("slots", []):
        slots.append(ArenaSlot(
            id=slot.get("_id", str(uuid.uuid4())),
            day_of_week=slot["day_of_week"],
            start_time=slot["start_time"],
            end_time=slot["end_time"],
            is_available=slot.get("is_available", True)
        ))
    
    return ArenaResponse(
        id=arena["_id"],
        name=arena["name"],
        sport=arena["sport"],
        owner_id=arena["owner_id"],
        venue_name=arena["venue_name"],
        capacity=arena["capacity"],
        description=arena.get("description"),
        amenities=arena.get("amenities", []),
        base_price_per_hour=arena["base_price_per_hour"],
        images=arena.get("images", []),
        slots=slots,
        is_active=arena.get("is_active", True),
        created_at=arena["created_at"]
    )

@api_router.put("/venue-partner/arenas/{arena_id}")
async def update_arena(
    arena_id: str,
    request: UpdateArenaRequest,
    current_partner: dict = Depends(get_current_venue_partner)
):
    """Update arena details"""
    # Check if arena exists and belongs to user
    arena = await db.arenas.find_one({
        "_id": arena_id,
        "owner_id": current_partner["_id"]
    })
    
    if not arena:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Arena not found"
        )
    
    # Build update document
    update_data = {}
    if request.name is not None:
        update_data["name"] = request.name
    if request.capacity is not None:
        update_data["capacity"] = request.capacity
    if request.description is not None:
        update_data["description"] = request.description
    if request.amenities is not None:
        update_data["amenities"] = request.amenities
    if request.base_price_per_hour is not None:
        update_data["base_price_per_hour"] = request.base_price_per_hour
    if request.images is not None:
        update_data["images"] = request.images
    if request.is_active is not None:
        update_data["is_active"] = request.is_active
    
    if update_data:
        update_data["updated_at"] = datetime.utcnow()
        await db.arenas.update_one(
            {"_id": arena_id},
            {"$set": update_data}
        )
    
    return {"success": True, "message": "Arena updated successfully"}

# Register API routes
app.include_router(api_router)

# Include rest of the file in next chunk due to length