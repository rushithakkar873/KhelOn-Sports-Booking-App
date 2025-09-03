from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timedelta
import hashlib
import jwt
from passlib.context import CryptContext
import re
import razorpay
import boto3
from botocore.exceptions import ClientError

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'playon_db')]

# Security
SECRET_KEY = os.environ.get('SECRET_KEY', 'your-secret-key-change-this')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Razorpay configuration
RAZORPAY_KEY_ID = os.environ.get('RAZORPAY_KEY_ID', '')
RAZORPAY_KEY_SECRET = os.environ.get('RAZORPAY_KEY_SECRET', '')
razorpay_client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET)) if RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET else None

# AWS S3 configuration
AWS_ACCESS_KEY_ID = os.environ.get('AWS_ACCESS_KEY_ID', '')
AWS_SECRET_ACCESS_KEY = os.environ.get('AWS_SECRET_ACCESS_KEY', '')
AWS_BUCKET_NAME = os.environ.get('AWS_BUCKET_NAME', 'playon-venue-images')
s3_client = boto3.client(
    's3',
    aws_access_key_id=AWS_ACCESS_KEY_ID,
    aws_secret_access_key=AWS_SECRET_ACCESS_KEY
) if AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY else None

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# Create the main app
app = FastAPI(title="Playon API", version="1.0.0")
api_router = APIRouter(prefix="/api")

# Utility functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
            )
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        )
    
    user = await db.users.find_one({"_id": user_id})
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )
    return user

# Pydantic Models
class UserCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    mobile: str = Field(..., min_length=10, max_length=15)
    password: str = Field(..., min_length=6)
    role: str = Field(default="player", pattern="^(player|venue_owner)$")

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    mobile: str
    role: str
    sports_interests: List[str] = []
    location: Optional[str] = None
    created_at: datetime

# Venue Owner Models
class VenueOwnerCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    mobile: str = Field(..., min_length=10, max_length=15)
    password: str = Field(..., min_length=6)
    business_name: Optional[str] = Field(None, max_length=200)
    business_address: Optional[str] = Field(None, max_length=500)
    gst_number: Optional[str] = Field(None, max_length=20)

class VenueOwnerResponse(BaseModel):
    id: str
    name: str
    email: str
    mobile: str
    business_name: Optional[str]
    business_address: Optional[str]
    gst_number: Optional[str]
    total_venues: int = 0
    total_bookings: int = 0
    total_revenue: float = 0.0
    is_active: bool = True
    created_at: datetime

class SlotCreate(BaseModel):
    day_of_week: int = Field(..., ge=0, le=6)  # 0=Monday, 6=Sunday
    start_time: str = Field(..., pattern=r"^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$")  # HH:MM format
    end_time: str = Field(..., pattern=r"^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$")
    capacity: int = Field(default=1, ge=1, le=100)
    price_per_hour: float = Field(..., ge=0)
    is_peak_hour: bool = False

class VenueCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=200)
    sports_supported: List[str] = Field(..., min_items=1)  # ["cricket", "football", "badminton"]
    address: str = Field(..., min_length=10, max_length=500)
    city: str = Field(..., min_length=2, max_length=100)
    state: str = Field(..., min_length=2, max_length=100)
    pincode: str = Field(..., min_length=6, max_length=6)
    description: Optional[str] = Field(None, max_length=1000)
    amenities: List[str] = []  # ["parking", "washroom", "lighting", "seating"]
    base_price_per_hour: float = Field(..., ge=0)
    contact_phone: str = Field(..., min_length=10, max_length=15)
    whatsapp_number: Optional[str] = Field(None, min_length=10, max_length=15)
    images: List[str] = []  # Will be URLs after S3 upload
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
    slots: List[Dict] = []  # Will contain slot information
    created_at: datetime

class SlotResponse(BaseModel):
    id: str
    venue_id: str
    day_of_week: int
    start_time: str
    end_time: str
    capacity: int
    price_per_hour: float
    is_peak_hour: bool
    is_active: bool = True

class BookingCreate(BaseModel):
    venue_id: str
    slot_id: str
    booking_date: str  # YYYY-MM-DD format
    duration_hours: int = Field(..., ge=1, le=12)
    player_name: str = Field(..., min_length=2, max_length=100)
    player_phone: str = Field(..., min_length=10, max_length=15)
    notes: Optional[str] = Field(None, max_length=500)

class BookingResponse(BaseModel):
    id: str
    venue_id: str
    venue_name: str
    slot_id: str
    user_id: str
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

# Payment Models
class PaymentOrderCreate(BaseModel):
    booking_id: str
    amount: float  # In INR
    currency: str = "INR"

class PaymentOrderResponse(BaseModel):
    order_id: str
    amount: int  # In paise
    currency: str
    status: str

class PaymentVerification(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str

class TransactionResponse(BaseModel):
    id: str
    booking_id: str
    order_id: str
    payment_id: Optional[str]
    amount: float
    currency: str
    status: str  # created, paid, failed, refunded
    payment_method: Optional[str]
    created_at: datetime
    updated_at: datetime

class TournamentCreate(BaseModel):
    name: str = Field(..., min_length=3, max_length=200)
    sport: str = Field(..., min_length=2, max_length=50)
    venue_id: Optional[str] = None
    location: str = Field(..., min_length=5, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    format: str = Field(..., min_length=3, max_length=100)  # e.g., "Single Elimination"
    max_participants: int = Field(..., ge=2, le=1000)
    registration_fee: float = Field(..., ge=0)
    start_date: str  # YYYY-MM-DD format
    end_date: str    # YYYY-MM-DD format
    rules: Optional[str] = Field(None, max_length=2000)
    prizes: Optional[str] = Field(None, max_length=1000)

class TournamentResponse(BaseModel):
    id: str
    name: str
    sport: str
    venue_id: Optional[str]
    location: str
    description: Optional[str]
    format: str
    max_participants: int
    current_participants: int = 0
    registration_fee: float
    start_date: str
    end_date: str
    status: str = "upcoming"  # upcoming, ongoing, completed
    organizer_id: str
    organizer_name: str
    rules: Optional[str]
    prizes: Optional[str]
    created_at: datetime

# Venue Owner Authentication Routes
@api_router.post("/venue-owner/register", response_model=Dict[str, str])
async def register_venue_owner(owner_data: VenueOwnerCreate):
    # Check if venue owner already exists
    existing_owner = await db.venue_owners.find_one({
        "$or": [
            {"email": owner_data.email},
            {"mobile": owner_data.mobile}
        ]
    })
    
    if existing_owner:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Venue owner with this email or mobile already exists"
        )
    
    # Create new venue owner
    owner_id = str(uuid.uuid4())
    hashed_password = get_password_hash(owner_data.password)
    
    new_owner = {
        "_id": owner_id,
        "name": owner_data.name,
        "email": owner_data.email,
        "mobile": owner_data.mobile,
        "password": hashed_password,
        "business_name": owner_data.business_name,
        "business_address": owner_data.business_address,
        "gst_number": owner_data.gst_number,
        "total_venues": 0,
        "total_bookings": 0,
        "total_revenue": 0.0,
        "is_active": True,
        "created_at": datetime.utcnow()
    }
    
    await db.venue_owners.insert_one(new_owner)
    
    return {
        "message": "Venue owner registered successfully",
        "owner_id": owner_id
    }

@api_router.post("/venue-owner/login")
async def login_venue_owner(credentials: UserLogin):
    # Find venue owner
    owner = await db.venue_owners.find_one({"email": credentials.email})
    if not owner or not verify_password(credentials.password, owner["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    if not owner.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account is deactivated"
        )
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": owner["_id"], "type": "venue_owner"}, 
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_type": "venue_owner",
        "owner_id": owner["_id"],
        "name": owner["name"]
    }

async def get_current_venue_owner(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        owner_id: str = payload.get("sub")
        user_type: str = payload.get("type")
        
        if owner_id is None or user_type != "venue_owner":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
            )
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        )
    
    owner = await db.venue_owners.find_one({"_id": owner_id})
    if owner is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Venue owner not found",
        )
    return owner

@api_router.get("/venue-owner/profile", response_model=VenueOwnerResponse)
async def get_venue_owner_profile(current_owner: dict = Depends(get_current_venue_owner)):
    return VenueOwnerResponse(
        id=current_owner["_id"],
        name=current_owner["name"],
        email=current_owner["email"],
        mobile=current_owner["mobile"],
        business_name=current_owner.get("business_name"),
        business_address=current_owner.get("business_address"),
        gst_number=current_owner.get("gst_number"),
        total_venues=current_owner.get("total_venues", 0),
        total_bookings=current_owner.get("total_bookings", 0),
        total_revenue=current_owner.get("total_revenue", 0.0),
        is_active=current_owner.get("is_active", True),
        created_at=current_owner["created_at"]
    )

# Venue Owner - Venue Management Routes
@api_router.post("/venue-owner/venues", response_model=Dict[str, str])
async def create_venue_by_owner(venue_data: VenueCreate, current_owner: dict = Depends(get_current_venue_owner)):
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
        "images": venue_data.images,  # Will be S3 URLs
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
    await db.venue_owners.update_one(
        {"_id": current_owner["_id"]},
        {"$inc": {"total_venues": 1}}
    )
    
    return {
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

@api_router.get("/venue-owner/venues/{venue_id}", response_model=VenueResponse)
async def get_owner_venue(venue_id: str, current_owner: dict = Depends(get_current_venue_owner)):
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
            slot_id=booking["slot_id"],
            user_id=booking["user_id"],
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
        slot_id=booking["slot_id"],
        user_id=booking["user_id"],
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

@api_router.post("/auth/register", response_model=Dict[str, str])
async def register_user(user_data: UserCreate):
    # Check if user already exists
    existing_user = await db.users.find_one({
        "$or": [
            {"email": user_data.email},
            {"mobile": user_data.mobile}
        ]
    })
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email or mobile already exists"
        )
    
    # Validate mobile number format (basic validation)
    if not re.match(r"^[+]?[1-9]\d{1,14}$", user_data.mobile.replace(" ", "")):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid mobile number format"
        )
    
    # Create user
    user_id = str(uuid.uuid4())
    hashed_password = get_password_hash(user_data.password)
    
    user_doc = {
        "_id": user_id,
        "name": user_data.name,
        "email": user_data.email,
        "mobile": user_data.mobile,
        "password": hashed_password,
        "role": user_data.role,
        "sports_interests": [],
        "location": None,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "is_active": True
    }
    
    await db.users.insert_one(user_doc)
    
    return {
        "message": "User registered successfully",
        "user_id": user_id
    }

@api_router.post("/auth/login")
async def login_user(credentials: UserLogin):
    # Find user
    user = await db.users.find_one({"email": credentials.email})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Verify password
    if not verify_password(credentials.password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["_id"]}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user["_id"],
            "name": user["name"],
            "email": user["email"],
            "role": user["role"],
            "sports_interests": user.get("sports_interests", [])
        }
    }

@api_router.get("/auth/me", response_model=UserResponse)
async def get_current_user_profile(current_user: dict = Depends(get_current_user)):
    return UserResponse(
        id=current_user["_id"],
        name=current_user["name"],
        email=current_user["email"],
        mobile=current_user["mobile"],
        role=current_user["role"],
        sports_interests=current_user.get("sports_interests", []),
        location=current_user.get("location"),
        created_at=current_user["created_at"]
    )

# Venue Routes
@api_router.post("/venues", response_model=Dict[str, str])
async def create_venue(venue_data: VenueCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "venue_owner":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only venue owners can create venues"
        )
    
    venue_id = str(uuid.uuid4())
    venue_doc = {
        "_id": venue_id,
        **venue_data.dict(),
        "owner_id": current_user["_id"],
        "rating": 0.0,
        "total_bookings": 0,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "is_active": True
    }
    
    await db.venues.insert_one(venue_doc)
    
    return {
        "message": "Venue created successfully",
        "venue_id": venue_id
    }

@api_router.get("/venues", response_model=List[VenueResponse])
async def get_venues(
    sport: Optional[str] = None,
    location: Optional[str] = None,
    limit: int = 20,
    offset: int = 0
):
    query = {"is_active": True}
    
    if sport:
        query["sport"] = {"$regex": sport, "$options": "i"}
    
    if location:
        query["location"] = {"$regex": location, "$options": "i"}
    
    venues = await db.venues.find(query).skip(offset).limit(limit).to_list(limit)
    
    venue_responses = []
    for venue in venues:
        # Get owner name
        owner = await db.users.find_one({"_id": venue["owner_id"]})
        owner_name = owner["name"] if owner else "Unknown"
        
        venue_responses.append(VenueResponse(
            id=venue["_id"],
            name=venue["name"],
            sport=venue["sport"],
            location=venue["location"],
            description=venue.get("description"),
            facilities=venue.get("facilities", []),
            pricing=venue.get("pricing", {}),
            available_slots=venue.get("available_slots", []),
            images=venue.get("images", []),
            contact_phone=venue.get("contact_phone"),
            rules=venue.get("rules"),
            owner_id=venue["owner_id"],
            rating=venue.get("rating", 0.0),
            total_bookings=venue.get("total_bookings", 0),
            created_at=venue["created_at"]
        ))
    
    return venue_responses

@api_router.get("/venues/{venue_id}", response_model=VenueResponse)
async def get_venue(venue_id: str):
    venue = await db.venues.find_one({"_id": venue_id, "is_active": True})
    if not venue:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Venue not found"
        )
    
    return VenueResponse(
        id=venue["_id"],
        name=venue["name"],
        sport=venue["sport"],
        location=venue["location"],
        description=venue.get("description"),
        facilities=venue.get("facilities", []),
        pricing=venue.get("pricing", {}),
        available_slots=venue.get("available_slots", []),
        images=venue.get("images", []),
        contact_phone=venue.get("contact_phone"),
        rules=venue.get("rules"),
        owner_id=venue["owner_id"],
        rating=venue.get("rating", 0.0),
        total_bookings=venue.get("total_bookings", 0),
        created_at=venue["created_at"]
    )

# Booking Routes
@api_router.post("/bookings", response_model=Dict[str, Any])
async def create_booking(booking_data: BookingCreate, current_user: dict = Depends(get_current_user)):
    # Verify venue exists
    venue = await db.venues.find_one({"_id": booking_data.venue_id, "is_active": True})
    if not venue:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Venue not found"
        )
    
    # Check if slot is available (basic check)
    existing_booking = await db.bookings.find_one({
        "venue_id": booking_data.venue_id,
        "date": booking_data.date,
        "time_slot": booking_data.time_slot,
        "status": {"$ne": "cancelled"}
    })
    
    if existing_booking:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This time slot is already booked"
        )
    
    # Calculate amount (using hourly rate from venue pricing)
    hourly_rate = venue.get("pricing", {}).get("hourly", 1000)  # default rate
    total_amount = hourly_rate * booking_data.duration
    
    booking_id = str(uuid.uuid4())
    booking_doc = {
        "_id": booking_id,
        "venue_id": booking_data.venue_id,
        "user_id": current_user["_id"],
        "date": booking_data.date,
        "time_slot": booking_data.time_slot,
        "duration": booking_data.duration,
        "amount": total_amount,
        "status": "confirmed",
        "payment_status": "pending",
        "notes": booking_data.notes,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    await db.bookings.insert_one(booking_doc)
    
    # Update venue booking count
    await db.venues.update_one(
        {"_id": booking_data.venue_id},
        {"$inc": {"total_bookings": 1}}
    )
    
    return {
        "message": "Booking created successfully",
        "booking_id": booking_id,
        "amount": total_amount,
        "payment_url": f"/api/payments/booking/{booking_id}"  # Mock payment URL
    }

@api_router.get("/bookings", response_model=List[BookingResponse])
async def get_user_bookings(
    status: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {"user_id": current_user["_id"]}
    
    if status:
        query["status"] = status
    
    bookings = await db.bookings.find(query).sort("created_at", -1).to_list(100)
    
    return [BookingResponse(
        id=booking["_id"],
        venue_id=booking["venue_id"],
        user_id=booking["user_id"],
        date=booking["date"],
        time_slot=booking["time_slot"],
        duration=booking["duration"],
        amount=booking["amount"],
        status=booking["status"],
        payment_status=booking["payment_status"],
        notes=booking.get("notes"),
        created_at=booking["created_at"]
    ) for booking in bookings]

# Tournament Routes
@api_router.post("/tournaments", response_model=Dict[str, str])
async def create_tournament(tournament_data: TournamentCreate, current_user: dict = Depends(get_current_user)):
    tournament_id = str(uuid.uuid4())
    tournament_doc = {
        "_id": tournament_id,
        **tournament_data.dict(),
        "organizer_id": current_user["_id"],
        "organizer_name": current_user["name"],
        "current_participants": 0,
        "status": "upcoming",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "is_active": True
    }
    
    await db.tournaments.insert_one(tournament_doc)
    
    return {
        "message": "Tournament created successfully",
        "tournament_id": tournament_id
    }

@api_router.get("/tournaments", response_model=List[TournamentResponse])
async def get_tournaments(
    sport: Optional[str] = None,
    status: Optional[str] = "upcoming",
    location: Optional[str] = None,
    limit: int = 20,
    offset: int = 0
):
    query = {"is_active": True}
    
    if sport:
        query["sport"] = {"$regex": sport, "$options": "i"}
    
    if status:
        query["status"] = status
        
    if location:
        query["location"] = {"$regex": location, "$options": "i"}
    
    tournaments = await db.tournaments.find(query).skip(offset).limit(limit).to_list(limit)
    
    return [TournamentResponse(
        id=tournament["_id"],
        name=tournament["name"],
        sport=tournament["sport"],
        venue_id=tournament.get("venue_id"),
        location=tournament["location"],
        description=tournament.get("description"),
        format=tournament["format"],
        max_participants=tournament["max_participants"],
        current_participants=tournament.get("current_participants", 0),
        registration_fee=tournament["registration_fee"],
        start_date=tournament["start_date"],
        end_date=tournament["end_date"],
        status=tournament["status"],
        organizer_id=tournament["organizer_id"],
        organizer_name=tournament["organizer_name"],
        rules=tournament.get("rules"),
        prizes=tournament.get("prizes"),
        created_at=tournament["created_at"]
    ) for tournament in tournaments]

@api_router.get("/tournaments/{tournament_id}", response_model=TournamentResponse)
async def get_tournament(tournament_id: str):
    tournament = await db.tournaments.find_one({"_id": tournament_id, "is_active": True})
    if not tournament:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tournament not found"
        )
    
    return TournamentResponse(
        id=tournament["_id"],
        name=tournament["name"],
        sport=tournament["sport"],
        venue_id=tournament.get("venue_id"),
        location=tournament["location"],
        description=tournament.get("description"),
        format=tournament["format"],
        max_participants=tournament["max_participants"],
        current_participants=tournament.get("current_participants", 0),
        registration_fee=tournament["registration_fee"],
        start_date=tournament["start_date"],
        end_date=tournament["end_date"],
        status=tournament["status"],
        organizer_id=tournament["organizer_id"],
        organizer_name=tournament["organizer_name"],
        rules=tournament.get("rules"),
        prizes=tournament.get("prizes"),
        created_at=tournament["created_at"]
    )

# Basic health and root routes
@api_router.get("/")
async def root():
    return {"message": "Playon API v1.0.0", "status": "running"}

@api_router.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow(),
        "version": "1.0.0"
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

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)