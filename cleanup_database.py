#!/usr/bin/env python3
"""
Database Cleanup Script for KhelON
Removes all existing data and sets up clean collections for unified data model
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import os
from pathlib import Path

# Load environment variables
ROOT_DIR = Path(__file__).parent / 'backend'
load_dotenv(ROOT_DIR / '.env')

async def cleanup_database():
    """Clean up all existing data and prepare for unified model"""
    
    # Connect to MongoDB
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ.get('DB_NAME', 'playon_db')]
    
    print("🧹 Starting database cleanup for KhelON unified data model...")
    
    try:
        # Drop existing collections
        collections_to_drop = ['users', 'venues', 'arenas', 'bookings', 'temp_users', 'tournaments']
        
        for collection_name in collections_to_drop:
            try:
                await db[collection_name].drop()
                print(f"✅ Dropped collection: {collection_name}")
            except Exception as e:
                print(f"⚠️  Collection {collection_name} not found or already empty: {e}")
        
        # Create indexes for optimal performance
        print("\n📊 Creating optimized indexes...")
        
        # Users collection indexes
        await db.users.create_index([("mobile", 1)], unique=True)
        await db.users.create_index([("role", 1)])
        await db.users.create_index([("onboarding_completed", 1)])
        await db.users.create_index([("is_active", 1)])
        print("✅ Created indexes for users collection")
        
        # Arenas collection indexes  
        await db.arenas.create_index([("owner_id", 1)])
        await db.arenas.create_index([("sport", 1)])
        await db.arenas.create_index([("is_active", 1)])
        await db.arenas.create_index([("owner_id", 1), ("is_active", 1)])
        print("✅ Created indexes for arenas collection")
        
        # Bookings collection indexes
        await db.bookings.create_index([("venue_owner_id", 1)])
        await db.bookings.create_index([("player_id", 1)]) 
        await db.bookings.create_index([("arena_id", 1)])
        await db.bookings.create_index([("booking_date", 1)])
        await db.bookings.create_index([("status", 1)])
        await db.bookings.create_index([("payment_status", 1)])
        await db.bookings.create_index([("arena_id", 1), ("booking_date", 1)])
        print("✅ Created indexes for bookings collection")
        
        print(f"\n🎉 Database cleanup completed successfully!")
        print(f"📋 Ready for unified KhelON data model with collections:")
        print(f"   - users (single source of truth)")
        print(f"   - arenas (sport-specific areas)")  
        print(f"   - bookings (arena-specific bookings)")
        
    except Exception as e:
        print(f"❌ Error during cleanup: {e}")
        raise
    
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(cleanup_database())