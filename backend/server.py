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

# Import our new auth service
from auth_service import AuthService, MobileOTPRequest, OTPVerifyRequest, UserRegistrationRequest, UserResponse

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'playon_db')]

# Initialize services
auth_service = AuthService(db)
security = HTTPBearer()

# Create the main app
app = FastAPI(
    title="Playon API - Unified Auth System", 
    version="2.0.0",
    description="Sports venue booking platform with mobile OTP authentication"
)
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Dependency for getting current user
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

# Dependency for venue owners only
async def get_current_venue_owner(current_user: dict = Depends(get_current_user)):
    """Get current user and verify they are a venue owner"""
    if current_user["role"] != "venue_owner":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Venue owner role required."
        )
    return current_user

# ================================
# UNIFIED AUTHENTICATION ROUTES
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
            # Development only - remove in production
            "dev_info": f"OTP: {result.get('dev_otp', 'N/A')}"
        }
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result["message"]
        )

@api_router.post("/auth/verify-otp")
async def verify_otp(request: OTPVerifyRequest):
    """Verify OTP (for testing purposes)"""
    result = await auth_service.verify_otp_only(request.mobile, request.otp)
    
    if result["success"]:
        return {
            "success": True,
            "message": result["message"]
        }
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result["message"]
        )

@api_router.post("/auth/register")
async def register_user(registration_data: UserRegistrationRequest):
    """Register new user (player or venue owner)"""
    result = await auth_service.register_user(registration_data)
    
    if result["success"]:
        return {
            "success": True,
            "message": result["message"],
            "access_token": result["access_token"],
            "token_type": result["token_type"],
            "user": result["user"]
        }
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result["message"]
        )

@api_router.post("/auth/login")
async def login_user(request: OTPVerifyRequest):
    """Login existing user with mobile + OTP"""
    result = await auth_service.login_user(request.mobile, request.otp)
    
    if result["success"]:
        return {
            "success": True,
            "message": result["message"],
            "access_token": result["access_token"],
            "token_type": result["token_type"],
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
    return UserResponse(
        id=current_user["_id"],
        mobile=current_user["mobile"],
        name=current_user["name"],
        email=current_user.get("email"),
        role=current_user["role"],
        is_verified=current_user.get("is_verified", False),
        created_at=current_user["created_at"],
        sports_interests=current_user.get("sports_interests"),
        location=current_user.get("location"),
        business_name=current_user.get("business_name"),
        business_address=current_user.get("business_address"),
        gst_number=current_user.get("gst_number"),
        total_venues=current_user.get("total_venues", 0),
        total_revenue=current_user.get("total_revenue", 0.0)
    )

# ================================
# VENUE OWNER SPECIFIC ROUTES
# ================================

# Import venue models from original server
from pydantic import BaseModel, Field

class SlotCreate(BaseModel):
    day_of_week: int = Field(..., ge=0, le=6)  # 0=Monday, 6=Sunday
    start_time: str = Field(..., pattern=r"^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$")
    end_time: str = Field(..., pattern=r"^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$")
    capacity: int = Field(default=1, ge=1, le=100)
    price_per_hour: float = Field(..., ge=0)
    is_peak_hour: bool = False

class VenueCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=200)
    sports_supported: List[str] = Field(..., min_items=1)
    address: str = Field(..., min_length=10, max_length=500)
    city: str = Field(..., min_length=2, max_length=100)
    state: str = Field(..., min_length=2, max_length=100)
    pincode: str = Field(..., min_length=6, max_length=6)
    description: Optional[str] = Field(None, max_length=1000)
    amenities: List[str] = []
    base_price_per_hour: float = Field(..., ge=0)
    contact_phone: str = Field(..., min_length=10, max_length=15)
    whatsapp_number: Optional[str] = Field(None, min_length=10, max_length=15)
    images: List[str] = []
    rules_and_regulations: Optional[str] = Field(None, max_length=2000)
    cancellation_policy: Optional[str] = Field(None, max_length=1000)
    slots: List[SlotCreate] = []

class VenueResponse(BaseModel):
    id: str
    name: str
    owner_id: str
    owner_name: str
    sports_supported: List[str]
    address: str
    city: str
    state: str
    pincode: str
    description: Optional[str]
    amenities: List[str]
    base_price_per_hour: float
    contact_phone: str
    whatsapp_number: Optional[str]
    images: List[str]
    rules_and_regulations: Optional[str]
    cancellation_policy: Optional[str]
    rating: float = 0.0
    total_bookings: int = 0
    total_reviews: int = 0
    is_active: bool = True
    slots: List[Dict] = []
    created_at: datetime

class BookingResponse(BaseModel):
    id: str
    venue_id: str
    venue_name: str
    slot_id: str
    user_id: str
    user_name: Optional[str] = None
    booking_date: str
    start_time: str
    end_time: str
    duration_hours: int
    total_amount: float
    status: str = "confirmed"  # confirmed, cancelled, completed
    payment_status: str = "pending"  # pending, paid, failed, refunded
    payment_id: Optional[str] = None
    player_name: str
    player_phone: str
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime

@api_router.post("/venue-owner/venues")
async def create_venue_by_owner(venue_data: VenueCreate, current_owner: dict = Depends(get_current_venue_owner)):
    """Create venue by venue owner"""
    venue_id = str(uuid.uuid4())
    
    # Process slots
    processed_slots = []
    for slot_data in venue_data.slots:
        slot_id = str(uuid.uuid4())
        processed_slots.append({
            "_id": slot_id,
            "day_of_week": slot_data.day_of_week,
            "start_time": slot_data.start_time,
            "end_time": slot_data.end_time,
            "capacity": slot_data.capacity,
            "price_per_hour": slot_data.price_per_hour,
            "is_peak_hour": slot_data.is_peak_hour,
            "is_active": True,
            "created_at": datetime.utcnow()
        })
    
    new_venue = {
        "_id": venue_id,
        "name": venue_data.name,
        "owner_id": current_owner["_id"],
        "owner_name": current_owner["name"],
        "sports_supported": venue_data.sports_supported,
        "address": venue_data.address,
        "city": venue_data.city,
        "state": venue_data.state,
        "pincode": venue_data.pincode,
        "description": venue_data.description,
        "amenities": venue_data.amenities,
        "base_price_per_hour": venue_data.base_price_per_hour,
        "contact_phone": venue_data.contact_phone,
        "whatsapp_number": venue_data.whatsapp_number,
        "images": venue_data.images,
        "rules_and_regulations": venue_data.rules_and_regulations,
        "cancellation_policy": venue_data.cancellation_policy,
        "slots": processed_slots,
        "rating": 0.0,
        "total_bookings": 0,
        "total_reviews": 0,
        "is_active": True,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    await db.venues.insert_one(new_venue)
    
    # Update venue owner's venue count
    await db.users.update_one(
        {"_id": current_owner["_id"]},
        {"$inc": {"total_venues": 1}}
    )
    
    return {
        "success": True,
        "message": "Venue created successfully",
        "venue_id": venue_id
    }

@api_router.get("/venue-owner/venues", response_model=List[VenueResponse])
async def get_owner_venues(
    current_owner: dict = Depends(get_current_venue_owner),
    skip: int = 0,
    limit: int = 10,
    is_active: Optional[bool] = None
):
    """Get venues owned by current venue owner"""
    query = {"owner_id": current_owner["_id"]}
    if is_active is not None:
        query["is_active"] = is_active
    
    venues = await db.venues.find(query).skip(skip).limit(limit).to_list(length=limit)
    
    venue_responses = []
    for venue in venues:
        venue_responses.append(VenueResponse(
            id=venue["_id"],
            name=venue["name"],
            owner_id=venue["owner_id"],
            owner_name=venue["owner_name"],
            sports_supported=venue["sports_supported"],
            address=venue["address"],
            city=venue["city"],
            state=venue["state"],
            pincode=venue["pincode"],
            description=venue.get("description"),
            amenities=venue.get("amenities", []),
            base_price_per_hour=venue["base_price_per_hour"],
            contact_phone=venue["contact_phone"],
            whatsapp_number=venue.get("whatsapp_number"),
            images=venue.get("images", []),
            rules_and_regulations=venue.get("rules_and_regulations"),
            cancellation_policy=venue.get("cancellation_policy"),
            rating=venue.get("rating", 0.0),
            total_bookings=venue.get("total_bookings", 0),
            total_reviews=venue.get("total_reviews", 0),
            is_active=venue.get("is_active", True),
            slots=venue.get("slots", []),
            created_at=venue["created_at"]
        ))
    
    return venue_responses

@api_router.get("/venue-owner/analytics/dashboard")
async def get_analytics_dashboard(
    current_owner: dict = Depends(get_current_venue_owner),
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
):
    """Get venue owner analytics dashboard"""
    # Get owner's venues
    venues = await db.venues.find({"owner_id": current_owner["_id"]}).to_list(length=None)
    venue_ids = [venue["_id"] for venue in venues]
    
    if not venue_ids:
        return {
            "total_venues": 0,
            "total_bookings": 0,
            "total_revenue": 0.0,
            "occupancy_rate": 0.0,
            "recent_bookings": [],
            "revenue_trend": [],
            "top_sports": [],
            "peak_hours": []
        }
    
    # Build date filter
    date_filter = {}
    if start_date and end_date:
        date_filter = {"booking_date": {"$gte": start_date, "$lte": end_date}}
    elif start_date:
        date_filter = {"booking_date": {"$gte": start_date}}
    elif end_date:
        date_filter = {"booking_date": {"$lte": end_date}}
    
    # Get bookings for analytics
    booking_query = {"venue_id": {"$in": venue_ids}, **date_filter}
    bookings = await db.bookings.find(booking_query).to_list(length=None)
    
    # Calculate metrics
    total_bookings = len(bookings)
    paid_bookings = [b for b in bookings if b.get("payment_status") == "paid"]
    total_revenue = sum(booking["total_amount"] for booking in paid_bookings)
    
    # Calculate occupancy rate (simplified)
    total_slots = sum(len(venue.get("slots", [])) for venue in venues) * 7  # per week
    occupancy_rate = (total_bookings / max(total_slots, 1)) * 100 if total_slots > 0 else 0
    
    # Recent bookings (last 10)
    recent_bookings = sorted(bookings, key=lambda x: x["created_at"], reverse=True)[:10]
    
    # Revenue trend (last 7 days)
    from collections import defaultdict
    daily_revenue = defaultdict(float)
    
    for booking in paid_bookings:
        daily_revenue[booking["booking_date"]] += booking["total_amount"]
    
    # Top sports
    sport_counts = defaultdict(int)
    for booking in bookings:
        venue = next((v for v in venues if v["_id"] == booking["venue_id"]), None)
        if venue:
            for sport in venue.get("sports_supported", []):
                sport_counts[sport] += 1
    
    top_sports = sorted(sport_counts.items(), key=lambda x: x[1], reverse=True)[:5]
    
    # Peak hours analysis
    hour_counts = defaultdict(int)
    for booking in bookings:
        hour = booking.get("start_time", "00:00")[:2]
        hour_counts[int(hour)] += 1
    
    peak_hours = sorted(hour_counts.items(), key=lambda x: x[1], reverse=True)[:5]
    
    return {
        "total_venues": len(venues),
        "total_bookings": total_bookings,
        "total_revenue": total_revenue,
        "occupancy_rate": round(occupancy_rate, 2),
        "recent_bookings": recent_bookings[:5],
        "revenue_trend": dict(daily_revenue),
        "top_sports": [{"sport": sport, "count": count} for sport, count in top_sports],
        "peak_hours": [{"hour": f"{hour:02d}:00", "count": count} for hour, count in peak_hours],
        # Additional data for frontend compatibility
        "bookingsTrend": [
            {"month": "Jan", "bookings": total_bookings // 12},
            {"month": "Feb", "bookings": total_bookings // 10},
            {"month": "Mar", "bookings": total_bookings // 8},
        ],
        "sportDistribution": [
            {"sport": sport, "bookings": count, "revenue": total_revenue * (count / max(total_bookings, 1)), "color": ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"][i % 5]} 
            for i, (sport, count) in enumerate(top_sports[:5])
        ] if top_sports else [{"sport": "Cricket", "bookings": 0, "revenue": 0, "color": "#3b82f6"}],
        "venuePerformance": [
            {
                "venueName": venue["name"], 
                "bookings": len([b for b in bookings if b["venue_id"] == venue["_id"]]), 
                "revenue": sum(b["total_amount"] for b in paid_bookings if b["venue_id"] == venue["_id"]),
                "occupancy": min(100, round((len([b for b in bookings if b["venue_id"] == venue["_id"]]) / max(len(venue.get("slots", [])) * 30, 1)) * 100, 1))
            } 
            for venue in venues[:5]
        ],
        "monthlyComparison": [
            {"month": "This Month", "revenue": total_revenue, "bookings": total_bookings},
            {"month": "Last Month", "revenue": total_revenue * 0.8, "bookings": max(0, total_bookings - 5)},
            {"month": "2 Months Ago", "revenue": total_revenue * 0.6, "bookings": max(0, total_bookings - 10)},
        ]
    }

@api_router.get("/venue-owner/venues/{venue_id}", response_model=VenueResponse)
async def get_owner_venue(venue_id: str, current_owner: dict = Depends(get_current_venue_owner)):
    """Get specific venue details for venue owner"""
    venue = await db.venues.find_one({"_id": venue_id, "owner_id": current_owner["_id"]})
    if not venue:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Venue not found"
        )
    
    return VenueResponse(
        id=venue["_id"],
        name=venue["name"],
        owner_id=venue["owner_id"],
        owner_name=venue["owner_name"],
        sports_supported=venue["sports_supported"],
        address=venue["address"],
        city=venue["city"],
        state=venue["state"],
        pincode=venue["pincode"],
        description=venue.get("description"),
        amenities=venue.get("amenities", []),
        base_price_per_hour=venue["base_price_per_hour"],
        contact_phone=venue["contact_phone"],
        whatsapp_number=venue.get("whatsapp_number"),
        images=venue.get("images", []),
        rules_and_regulations=venue.get("rules_and_regulations"),
        cancellation_policy=venue.get("cancellation_policy"),
        rating=venue.get("rating", 0.0),
        total_bookings=venue.get("total_bookings", 0),
        total_reviews=venue.get("total_reviews", 0),
        is_active=venue.get("is_active", True),
        slots=venue.get("slots", []),
        created_at=venue["created_at"]
    )

@api_router.put("/venue-owner/venues/{venue_id}/status")
async def update_venue_status(
    venue_id: str, 
    is_active: bool,
    current_owner: dict = Depends(get_current_venue_owner)
):
    """Update venue status (activate/deactivate)"""
    result = await db.venues.update_one(
        {"_id": venue_id, "owner_id": current_owner["_id"]},
        {
            "$set": {
                "is_active": is_active,
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    if result.matched_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Venue not found"
        )
    
    return {
        "message": f"Venue {'activated' if is_active else 'deactivated'} successfully"
    }

# Venue Owner - Booking Management Routes
@api_router.get("/venue-owner/bookings", response_model=List[BookingResponse])
async def get_owner_bookings(
    current_owner: dict = Depends(get_current_venue_owner),
    venue_id: Optional[str] = None,
    status: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    skip: int = 0,
    limit: int = 10
):
    """Get bookings for venue owner's venues"""
    # First get all venues owned by this owner
    owner_venues = await db.venues.find({"owner_id": current_owner["_id"]}).to_list(length=None)
    venue_ids = [venue["_id"] for venue in owner_venues]
    
    if not venue_ids:
        return []
    
    # Build query for bookings
    query = {"venue_id": {"$in": venue_ids}}
    
    if venue_id:
        query["venue_id"] = venue_id
    if status:
        query["status"] = status
    if start_date and end_date:
        query["booking_date"] = {"$gte": start_date, "$lte": end_date}
    elif start_date:
        query["booking_date"] = {"$gte": start_date}
    elif end_date:
        query["booking_date"] = {"$lte": end_date}
    
    bookings = await db.bookings.find(query).sort("created_at", -1).skip(skip).limit(limit).to_list(length=limit)
    
    booking_responses = []
    for booking in bookings:
        # Get venue details
        venue = next((v for v in owner_venues if v["_id"] == booking["venue_id"]), None)
        venue_name = venue["name"] if venue else "Unknown Venue"
        
        booking_responses.append(BookingResponse(
            id=booking["_id"],
            venue_id=booking["venue_id"],
            venue_name=venue_name,
            slot_id=booking.get("slot_id", ""),
            user_id=booking["user_id"],
            user_name=booking.get("user_name", "Unknown User"),
            booking_date=booking["booking_date"],
            start_time=booking["start_time"],
            end_time=booking["end_time"],
            duration_hours=booking["duration_hours"],
            total_amount=booking["total_amount"],
            status=booking.get("status", "confirmed"),
            payment_status=booking.get("payment_status", "pending"),
            payment_id=booking.get("payment_id"),
            player_name=booking["player_name"],
            player_phone=booking["player_phone"],
            notes=booking.get("notes"),
            created_at=booking["created_at"],
            updated_at=booking.get("updated_at", booking["created_at"])
        ))
    
    return booking_responses

@api_router.get("/venue-owner/bookings/{booking_id}", response_model=BookingResponse)
async def get_booking_details(booking_id: str, current_owner: dict = Depends(get_current_venue_owner)):
    """Get specific booking details"""
    booking = await db.bookings.find_one({"_id": booking_id})
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found"
        )
    
    # Verify the booking belongs to owner's venue
    venue = await db.venues.find_one({"_id": booking["venue_id"], "owner_id": current_owner["_id"]})
    if not venue:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: This booking doesn't belong to your venue"
        )
    
    return BookingResponse(
        id=booking["_id"],
        venue_id=booking["venue_id"],
        venue_name=venue["name"],
        slot_id=booking.get("slot_id", ""),
        user_id=booking["user_id"],
        user_name=booking.get("user_name", "Unknown User"),
        booking_date=booking["booking_date"],
        start_time=booking["start_time"],
        end_time=booking["end_time"],
        duration_hours=booking["duration_hours"],
        total_amount=booking["total_amount"],
        status=booking.get("status", "confirmed"),
        payment_status=booking.get("payment_status", "pending"),
        payment_id=booking.get("payment_id"),
        player_name=booking["player_name"],
        player_phone=booking["player_phone"],
        notes=booking.get("notes"),
        created_at=booking["created_at"],
        updated_at=booking.get("updated_at", booking["created_at"])
    )

@api_router.put("/venue-owner/bookings/{booking_id}/status")
async def update_booking_status(
    booking_id: str,
    new_status: str,
    current_owner: dict = Depends(get_current_venue_owner)
):
    """Update booking status"""
    valid_statuses = ["confirmed", "cancelled", "completed"]
    if new_status not in valid_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
        )
    
    booking = await db.bookings.find_one({"_id": booking_id})
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found"
        )
    
    # Verify the booking belongs to owner's venue
    venue = await db.venues.find_one({"_id": booking["venue_id"], "owner_id": current_owner["_id"]})
    if not venue:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: This booking doesn't belong to your venue"
        )
    
    # Update booking status
    await db.bookings.update_one(
        {"_id": booking_id},
        {
            "$set": {
                "status": new_status,
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    return {
        "message": f"Booking status updated to {new_status}",
        "booking_id": booking_id,
        "new_status": new_status
    }

# ================================
# BASIC HEALTH ROUTES
# ================================

@api_router.get("/")
async def root():
    """API Root endpoint"""
    return {
        "message": "Playon API v2.0.0 - Unified Auth System", 
        "status": "running",
        "auth_type": "mobile_otp"
    }

@api_router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow(),
        "version": "2.0.0"
    }

# Include the router in the main app
app.include_router(api_router)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)