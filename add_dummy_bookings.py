#!/usr/bin/env python3
"""
Script to add dummy booking data for testing venue owner booking functionality
"""

import asyncio
import os
import uuid
from datetime import datetime, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables
ROOT_DIR = Path(__file__).parent / 'backend'
load_dotenv(ROOT_DIR / '.env')

async def add_dummy_data():
    """Add dummy users, venues, and bookings for testing"""
    
    # MongoDB connection
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ.get('DB_NAME', 'playon_db')]
    
    print("🏏 Adding dummy data for PlayOn app...")
    
    # 1. Create dummy users (players)
    dummy_players = [
        {
            "_id": str(uuid.uuid4()),
            "mobile": "+919876543210",
            "name": "Arjun Sharma",
            "role": "player",
            "email": "arjun.sharma@gmail.com",
            "is_verified": True,
            "created_at": datetime.utcnow() - timedelta(days=30)
        },
        {
            "_id": str(uuid.uuid4()),
            "mobile": "+919888777666",
            "name": "Priya Patel",
            "role": "player", 
            "email": "priya.patel@gmail.com",
            "is_verified": True,
            "created_at": datetime.utcnow() - timedelta(days=25)
        },
        {
            "_id": str(uuid.uuid4()),
            "mobile": "+919999888777",
            "name": "Rahul Verma",
            "role": "player",
            "email": "rahul.verma@gmail.com", 
            "is_verified": True,
            "created_at": datetime.utcnow() - timedelta(days=20)
        },
        {
            "_id": str(uuid.uuid4()),
            "mobile": "+919777666555",
            "name": "Sneha Reddy",
            "role": "player",
            "email": "sneha.reddy@gmail.com",
            "is_verified": True,
            "created_at": datetime.utcnow() - timedelta(days=15)
        }
    ]
    
    # Insert players if they don't exist
    for player in dummy_players:
        existing = await db.users.find_one({"mobile": player["mobile"]})
        if not existing:
            await db.users.insert_one(player)
            print(f"✅ Created player: {player['name']} ({player['mobile']})")
        else:
            # Update the player_id for bookings
            player["_id"] = existing["_id"]
            print(f"⚡ Using existing player: {player['name']} ({player['mobile']})")
    
    # 2. Create venue owner if not exists
    venue_owner = {
        "_id": str(uuid.uuid4()),
        "mobile": "+919876543211",
        "name": "Rajesh Kumar",
        "role": "venue_owner",
        "email": "rajesh.kumar@elitesports.com",
        "business_name": "Elite Sports Complex",
        "gst_number": "24ABCDE1234F1Z5",
        "business_address": "123 Sports Street, Mumbai, Maharashtra",
        "is_verified": True,
        "created_at": datetime.utcnow() - timedelta(days=45)
    }
    
    existing_owner = await db.users.find_one({"mobile": venue_owner["mobile"]})
    if not existing_owner:
        await db.users.insert_one(venue_owner)
        print(f"✅ Created venue owner: {venue_owner['name']} ({venue_owner['mobile']})")
    else:
        venue_owner["_id"] = existing_owner["_id"]
        print(f"⚡ Using existing venue owner: {venue_owner['name']} ({venue_owner['mobile']})")
    
    # 3. Create dummy venues
    dummy_venues = [
        {
            "_id": str(uuid.uuid4()),
            "name": "Elite Cricket Ground Mumbai",
            "sports_supported": ["Cricket", "Football"],
            "owner_id": venue_owner["_id"],
            "address": "456 Sports Complex, Bandra West",
            "city": "Mumbai",
            "state": "Maharashtra", 
            "pincode": "400050",
            "description": "Premium cricket ground with international standards",
            "amenities": ["Parking", "Changing Rooms", "Floodlights", "Cafeteria", "Equipment Rental"],
            "base_price_per_hour": 1200,
            "contact_phone": "+919876543211",
            "images": ["https://images.unsplash.com/photo-1540747913346-19e32dc3e97e"],
            "is_active": True,
            "total_bookings": 0,
            "rating": 4.5,
            "created_at": datetime.utcnow() - timedelta(days=40),
            "slots": [
                {"day_of_week": 1, "start_time": "06:00", "end_time": "22:00", "capacity": 2, "price_per_hour": 1200},
                {"day_of_week": 2, "start_time": "06:00", "end_time": "22:00", "capacity": 2, "price_per_hour": 1200},
                {"day_of_week": 3, "start_time": "06:00", "end_time": "22:00", "capacity": 2, "price_per_hour": 1200},
                {"day_of_week": 4, "start_time": "06:00", "end_time": "22:00", "capacity": 2, "price_per_hour": 1200},
                {"day_of_week": 5, "start_time": "06:00", "end_time": "22:00", "capacity": 2, "price_per_hour": 1200},
                {"day_of_week": 6, "start_time": "06:00", "end_time": "23:00", "capacity": 2, "price_per_hour": 1500},
                {"day_of_week": 0, "start_time": "06:00", "end_time": "23:00", "capacity": 2, "price_per_hour": 1500}
            ]
        },
        {
            "_id": str(uuid.uuid4()),
            "name": "Elite Football Ground Mumbai",
            "sports_supported": ["Football", "Cricket"],
            "owner_id": venue_owner["_id"],
            "address": "789 Sports Hub, Andheri East",
            "city": "Mumbai",
            "state": "Maharashtra",
            "pincode": "400069",
            "description": "Professional football turf with FIFA standards",
            "amenities": ["Parking", "Changing Rooms", "Floodlights", "Cafeteria", "First Aid"],
            "base_price_per_hour": 1000,
            "contact_phone": "+919876543211",
            "images": ["https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d"],
            "is_active": True,
            "total_bookings": 0,
            "rating": 4.3,
            "created_at": datetime.utcnow() - timedelta(days=35),
            "slots": [
                {"day_of_week": 1, "start_time": "06:00", "end_time": "22:00", "capacity": 1, "price_per_hour": 1000},
                {"day_of_week": 2, "start_time": "06:00", "end_time": "22:00", "capacity": 1, "price_per_hour": 1000},
                {"day_of_week": 3, "start_time": "06:00", "end_time": "22:00", "capacity": 1, "price_per_hour": 1000},
                {"day_of_week": 4, "start_time": "06:00", "end_time": "22:00", "capacity": 1, "price_per_hour": 1000},
                {"day_of_week": 5, "start_time": "06:00", "end_time": "22:00", "capacity": 1, "price_per_hour": 1000},
                {"day_of_week": 6, "start_time": "06:00", "end_time": "23:00", "capacity": 1, "price_per_hour": 1200},
                {"day_of_week": 0, "start_time": "06:00", "end_time": "23:00", "capacity": 1, "price_per_hour": 1200}
            ]
        }
    ]
    
    # Insert venues if they don't exist
    for venue in dummy_venues:
        existing = await db.venues.find_one({"name": venue["name"], "owner_id": venue_owner["_id"]})
        if not existing:
            await db.venues.insert_one(venue)
            print(f"✅ Created venue: {venue['name']}")
        else:
            venue["_id"] = existing["_id"]
            print(f"⚡ Using existing venue: {venue['name']}")
    
    # 4. Create dummy bookings with various statuses
    base_date = datetime.utcnow()
    dummy_bookings = [
        # Recent confirmed booking
        {
            "_id": str(uuid.uuid4()),
            "venue_id": dummy_venues[0]["_id"],
            "user_id": dummy_players[0]["_id"],
            "slot_id": f"manual_{uuid.uuid4().hex[:8]}",
            "booking_date": (base_date + timedelta(days=1)).strftime("%Y-%m-%d"),
            "start_time": "18:00",
            "end_time": "20:00",
            "duration_hours": 2,
            "total_amount": 2400.0,
            "status": "confirmed",
            "payment_status": "paid",
            "player_name": dummy_players[0]["name"],
            "player_phone": dummy_players[0]["mobile"],
            "sport": "Cricket",
            "notes": "Practice session for upcoming tournament",
            "created_at": base_date - timedelta(hours=5),
            "updated_at": base_date - timedelta(hours=4),
            "created_by_owner": True,
            "owner_id": venue_owner["_id"],
            "payment_link_id": f"plink_test_{uuid.uuid4().hex[:12]}",
            "payment_link_url": "https://mock-payment.playon.com/pay/test123",
            "payment_id": f"pay_{uuid.uuid4().hex[:12]}"
        },
        # Pending booking (payment not done)
        {
            "_id": str(uuid.uuid4()),
            "venue_id": dummy_venues[1]["_id"],
            "user_id": dummy_players[1]["_id"],
            "slot_id": f"manual_{uuid.uuid4().hex[:8]}",
            "booking_date": (base_date + timedelta(days=2)).strftime("%Y-%m-%d"),
            "start_time": "16:00",
            "end_time": "17:00",
            "duration_hours": 1,
            "total_amount": 1000.0,
            "status": "pending",
            "payment_status": "pending",
            "player_name": dummy_players[1]["name"],
            "player_phone": dummy_players[1]["mobile"],
            "sport": "Football",
            "notes": "Weekend football match",
            "created_at": base_date - timedelta(hours=2),
            "updated_at": base_date - timedelta(hours=2),
            "created_by_owner": True,
            "owner_id": venue_owner["_id"],
            "payment_link_id": f"plink_test_{uuid.uuid4().hex[:12]}",
            "payment_link_url": "https://mock-payment.playon.com/pay/test456"
        },
        # Completed booking (past date)
        {
            "_id": str(uuid.uuid4()),
            "venue_id": dummy_venues[0]["_id"],
            "user_id": dummy_players[2]["_id"],
            "slot_id": f"manual_{uuid.uuid4().hex[:8]}",
            "booking_date": (base_date - timedelta(days=2)).strftime("%Y-%m-%d"),
            "start_time": "10:00",
            "end_time": "12:00",
            "duration_hours": 2,
            "total_amount": 2400.0,
            "status": "completed",
            "payment_status": "paid",
            "player_name": dummy_players[2]["name"],
            "player_phone": dummy_players[2]["mobile"],
            "sport": "Cricket",
            "notes": "Corporate team building event",
            "created_at": base_date - timedelta(days=5),
            "updated_at": base_date - timedelta(days=2),
            "created_by_owner": True,
            "owner_id": venue_owner["_id"],
            "payment_link_id": f"plink_test_{uuid.uuid4().hex[:12]}",
            "payment_link_url": "https://mock-payment.playon.com/pay/test789",
            "payment_id": f"pay_{uuid.uuid4().hex[:12]}"
        },
        # Cancelled booking
        {
            "_id": str(uuid.uuid4()),
            "venue_id": dummy_venues[1]["_id"],
            "user_id": dummy_players[3]["_id"],
            "slot_id": f"manual_{uuid.uuid4().hex[:8]}",
            "booking_date": (base_date + timedelta(days=3)).strftime("%Y-%m-%d"),
            "start_time": "14:00",
            "end_time": "16:00",
            "duration_hours": 2,
            "total_amount": 2000.0,
            "status": "cancelled",
            "payment_status": "refunded",
            "player_name": dummy_players[3]["name"],
            "player_phone": dummy_players[3]["mobile"],
            "sport": "Football", 
            "notes": "Cancelled due to rain",
            "created_at": base_date - timedelta(days=3),
            "updated_at": base_date - timedelta(hours=6),
            "created_by_owner": True,
            "owner_id": venue_owner["_id"],
            "payment_link_id": f"plink_test_{uuid.uuid4().hex[:12]}",
            "payment_link_url": "https://mock-payment.playon.com/pay/test101",
            "payment_id": f"pay_{uuid.uuid4().hex[:12]}"
        },
        # Another pending booking for today
        {
            "_id": str(uuid.uuid4()),
            "venue_id": dummy_venues[0]["_id"],
            "user_id": dummy_players[0]["_id"],
            "slot_id": f"manual_{uuid.uuid4().hex[:8]}",
            "booking_date": base_date.strftime("%Y-%m-%d"),
            "start_time": "20:00",
            "end_time": "22:00",
            "duration_hours": 2,
            "total_amount": 2400.0,
            "status": "pending",
            "payment_status": "pending",
            "player_name": dummy_players[0]["name"],
            "player_phone": dummy_players[0]["mobile"],
            "sport": "Cricket",
            "notes": "Evening practice session",
            "created_at": base_date - timedelta(minutes=30),
            "updated_at": base_date - timedelta(minutes=30),
            "created_by_owner": True,
            "owner_id": venue_owner["_id"],
            "payment_link_id": f"plink_test_{uuid.uuid4().hex[:12]}",
            "payment_link_url": "https://mock-payment.playon.com/pay/test202"
        }
    ]
    
    # Insert bookings if they don't exist
    booking_count = 0
    for booking in dummy_bookings:
        existing = await db.bookings.find_one({
            "venue_id": booking["venue_id"],
            "booking_date": booking["booking_date"],
            "start_time": booking["start_time"]
        })
        if not existing:
            await db.bookings.insert_one(booking)
            booking_count += 1
            print(f"✅ Created booking: {booking['player_name']} - {booking['sport']} ({booking['status']})")
        else:
            print(f"⚡ Booking already exists: {booking['player_name']} - {booking['sport']}")
    
    # Update venue booking counts
    for venue in dummy_venues:
        total_bookings = await db.bookings.count_documents({"venue_id": venue["_id"]})
        await db.venues.update_one(
            {"_id": venue["_id"]},
            {"$set": {"total_bookings": total_bookings}}
        )
        print(f"📊 Updated {venue['name']}: {total_bookings} total bookings")
    
    print(f"\n🎉 Dummy data setup complete!")
    print(f"📊 Summary:")
    print(f"   • {len(dummy_players)} players created/updated")
    print(f"   • 1 venue owner created/updated") 
    print(f"   • {len(dummy_venues)} venues created/updated")
    print(f"   • {booking_count} new bookings created")
    print(f"\n🔑 Test Login Credentials:")
    print(f"   Venue Owner: {venue_owner['mobile']} (Rajesh Kumar)")
    print(f"   Players: {', '.join([p['mobile'] for p in dummy_players])}")
    print(f"\n💡 You can now:")
    print(f"   1. Login as venue owner to see booking dashboard")
    print(f"   2. View bookings with different statuses (pending, confirmed, completed, cancelled)")
    print(f"   3. Test creating new bookings from venue owner dashboard")
    print(f"   4. Test the payment links and SMS functionality")
    
    await client.close()

if __name__ == "__main__":
    asyncio.run(add_dummy_data())