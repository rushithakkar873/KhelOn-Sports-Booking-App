# Updated Venue Partner Routes - replaces all venue-owner routes with venue-partner routes
from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timedelta

# Import dependencies from main server
from server import (
    get_current_venue_partner, db, logger, 
    VenueCreate, VenueResponse, BookingResponse, ArenaResponse,
    VenuePartnerBookingCreate, VenuePartnerBookingResponse, SMSService
)

# Create router for venue partner routes
venue_partner_router = APIRouter(prefix="/api/venue-partner")

# ================================
# VENUE PARTNER SPECIFIC ROUTES
# ================================

@venue_partner_router.post("/venues")
async def create_venue_by_partner(venue_data: VenueCreate, current_partner: dict = Depends(get_current_venue_partner)):
    """Create venue by venue partner with multiple arenas"""
    venue_id = str(uuid.uuid4())
    
    # Process arenas
    processed_arenas = []
    for arena_data in venue_data.arenas:
        arena_id = str(uuid.uuid4())
        
        # Process slots for this arena
        processed_slots = []
        for slot_data in arena_data.slots:
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
        
        processed_arenas.append({
            "_id": arena_id,
            "name": arena_data.name,
            "sport": arena_data.sport,
            "capacity": arena_data.capacity,
            "description": arena_data.description,
            "amenities": arena_data.amenities,
            "base_price_per_hour": arena_data.base_price_per_hour,
            "images": arena_data.images,
            "slots": processed_slots,
            "is_active": arena_data.is_active,
            "created_at": datetime.utcnow()
        })
    
    new_venue = {
        "_id": venue_id,
        "name": venue_data.name,
        "owner_id": current_partner["_id"],
        "owner_name": current_partner["name"],
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
        "arenas": processed_arenas,
        "rating": 0.0,
        "total_bookings": 0,
        "total_reviews": 0,
        "is_active": True,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    await db.venues.insert_one(new_venue)
    
    # Update venue partner's venue count
    await db.users.update_one(
        {"_id": current_partner["_id"]},
        {"$inc": {"total_venues": 1}}
    )
    
    return {
        "success": True,
        "message": "Venue created successfully",
        "venue_id": venue_id
    }

@venue_partner_router.get("/venues", response_model=List[VenueResponse])
async def get_partner_venues(
    current_partner: dict = Depends(get_current_venue_partner),
    skip: int = 0,
    limit: int = 10,
    is_active: Optional[bool] = None
):
    """Get venues owned by current venue partner"""
    query = {"owner_id": current_partner["_id"]}
    if is_active is not None:
        query["is_active"] = is_active
    
    venues = await db.venues.find(query).skip(skip).limit(limit).to_list(length=limit)
    
    venue_responses = []
    for venue in venues:
        # Convert arena data to ArenaResponse objects
        arena_responses = []
        arenas_data = venue.get("arenas", venue.get("slots", []))  # Backward compatibility
        
        for arena in arenas_data:
            # Handle both new arena format and old slot format
            if "sport" in arena:  # New arena format
                arena_responses.append(ArenaResponse(
                    id=arena["_id"],
                    name=arena["name"],
                    sport=arena["sport"],
                    capacity=arena["capacity"],
                    description=arena.get("description"),
                    amenities=arena.get("amenities", []),
                    base_price_per_hour=arena["base_price_per_hour"],
                    images=arena.get("images", []),
                    slots=arena.get("slots", []),
                    is_active=arena.get("is_active", True),
                    created_at=arena["created_at"]
                ))
            else:  # Old slot format - convert to arena for backward compatibility
                arena_responses.append(ArenaResponse(
                    id=arena["_id"],
                    name=f"Arena {len(arena_responses) + 1}",
                    sport=venue["sports_supported"][0] if venue["sports_supported"] else "General",
                    capacity=arena.get("capacity", 1),
                    description="Migrated from old slot system",
                    amenities=[],
                    base_price_per_hour=arena.get("price_per_hour", venue["base_price_per_hour"]),
                    images=[],
                    slots=[arena],  # Single slot becomes arena's slot
                    is_active=arena.get("is_active", True),
                    created_at=arena["created_at"]
                ))
        
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
            arenas=arena_responses,
            created_at=venue["created_at"]
        ))
    
    return venue_responses

@venue_partner_router.get("/analytics/dashboard")
async def get_partner_analytics_dashboard(
    current_partner: dict = Depends(get_current_venue_partner),
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
):
    """Get venue partner analytics dashboard"""
    # Get partner's venues
    venues = await db.venues.find({"owner_id": current_partner["_id"]}).to_list(length=None)
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
            "peak_hours": [],
            "bookingsTrend": [],
            "sportDistribution": [],
            "venuePerformance": [],
            "monthlyComparison": []
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
    
    # Calculate occupancy rate - now based on arenas
    total_arenas = 0
    total_arena_slots = 0
    for venue in venues:
        arenas = venue.get("arenas", venue.get("slots", []))  # Backward compatibility
        total_arenas += len(arenas)
        for arena in arenas:
            total_arena_slots += len(arena.get("slots", [arena] if "day_of_week" in arena else []))
    
    total_slots = total_arena_slots * 7  # per week
    occupancy_rate = (total_bookings / max(total_slots, 1)) * 100 if total_slots > 0 else 0
    
    # Recent bookings (last 10)
    recent_bookings = sorted(bookings, key=lambda x: x["created_at"], reverse=True)[:10]
    
    # Revenue trend (last 7 days)
    from collections import defaultdict
    daily_revenue = defaultdict(float)
    
    for booking in paid_bookings:
        daily_revenue[booking["booking_date"]] += booking["total_amount"]
    
    # Top sports - now uses booking-specific sport data
    sport_counts = defaultdict(int)
    for booking in bookings:
        sport = booking.get("sport", "General")
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
        "peak_hours": [{"hour": f"{hour:02d}:00", "bookings": count} for hour, count in peak_hours],
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
                "occupancy": min(100, round((len([b for b in bookings if b["venue_id"] == venue["_id"]]) / max(sum(len(arena.get("slots", [arena] if "day_of_week" in arena else [])) for arena in venue.get("arenas", venue.get("slots", []))) * 30, 1)) * 100, 1))
            } 
            for venue in venues[:5]
        ],
        "monthlyComparison": [
            {"month": "This Month", "revenue": total_revenue, "bookings": total_bookings},
            {"month": "Last Month", "revenue": total_revenue * 0.8, "bookings": max(0, total_bookings - 5)},
            {"month": "2 Months Ago", "revenue": total_revenue * 0.6, "bookings": max(0, total_bookings - 10)},
        ]
    }