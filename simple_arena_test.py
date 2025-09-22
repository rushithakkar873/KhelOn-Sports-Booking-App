#!/usr/bin/env python3
"""
Simple Arena Testing Script for KhelON Backend
"""

import requests
import json

BASE_URL = "http://localhost:8001/api"

def test_conflict_detection():
    """Test arena-specific conflict detection"""
    print("=== TESTING ARENA-SPECIFIC CONFLICT DETECTION ===")
    
    # Step 1: Authenticate
    print("1. Authenticating venue owner...")
    otp_response = requests.post(f"{BASE_URL}/auth/send-otp", 
                                json={"mobile": "+919876543210"})
    if otp_response.status_code != 200:
        print(f"❌ OTP send failed: {otp_response.status_code}")
        return False
    
    otp_data = otp_response.json()
    dev_otp = otp_data.get("dev_info", "").split("OTP: ")[-1]
    
    login_response = requests.post(f"{BASE_URL}/auth/login",
                                  json={"mobile": "+919876543210", "otp": dev_otp})
    if login_response.status_code != 200:
        print(f"❌ Login failed: {login_response.status_code}")
        return False
    
    token = login_response.json().get("access_token")
    headers = {"Authorization": f"Bearer {token}"}
    print("✅ Authentication successful")
    
    # Step 2: Create a new venue with multiple arenas for testing
    print("2. Creating test venue with multiple arenas...")
    venue_data = {
        "name": "Test Arena Conflict Venue",
        "sports_supported": ["Cricket", "Football"],
        "address": "Test Address",
        "city": "Mumbai",
        "state": "Maharashtra", 
        "pincode": "400001",
        "description": "Test venue for conflict detection",
        "amenities": ["Test"],
        "base_price_per_hour": 1000.0,
        "contact_phone": "+919876543210",
        "arenas": [
            {
                "name": "Test Cricket Arena",
                "sport": "Cricket",
                "capacity": 1,
                "description": "Test cricket arena",
                "amenities": ["Test"],
                "base_price_per_hour": 1200.0,
                "slots": [
                    {
                        "day_of_week": 1,  # Tuesday
                        "start_time": "10:00",
                        "end_time": "12:00",
                        "capacity": 1,
                        "price_per_hour": 1200.0,
                        "is_peak_hour": False
                    }
                ],
                "is_active": True
            },
            {
                "name": "Test Football Arena", 
                "sport": "Football",
                "capacity": 1,
                "description": "Test football arena",
                "amenities": ["Test"],
                "base_price_per_hour": 800.0,
                "slots": [
                    {
                        "day_of_week": 1,  # Tuesday
                        "start_time": "10:00", 
                        "end_time": "12:00",
                        "capacity": 1,
                        "price_per_hour": 800.0,
                        "is_peak_hour": False
                    }
                ],
                "is_active": True
            }
        ]
    }
    
    venue_response = requests.post(f"{BASE_URL}/venue-owner/venues",
                                  json=venue_data, headers=headers)
    if venue_response.status_code != 200:
        print(f"❌ Venue creation failed: {venue_response.status_code}")
        print(venue_response.text)
        return False
    
    venue_id = venue_response.json().get("venue_id")
    print(f"✅ Test venue created: {venue_id}")
    
    # Step 3: Get arena IDs
    print("3. Getting arena IDs...")
    arenas_response = requests.get(f"{BASE_URL}/venue-owner/venues/{venue_id}/arenas",
                                  headers=headers)
    if arenas_response.status_code != 200:
        print(f"❌ Arena listing failed: {arenas_response.status_code}")
        return False
    
    arenas_data = arenas_response.json()
    arenas = arenas_data.get("arenas", [])
    
    if len(arenas) < 2:
        print(f"❌ Expected 2 arenas, got {len(arenas)}")
        return False
    
    cricket_arena_id = arenas[0]["id"]
    football_arena_id = arenas[1]["id"]
    print(f"✅ Got arena IDs - Cricket: {cricket_arena_id}, Football: {football_arena_id}")
    
    # Step 4: Create first booking (Cricket arena)
    print("4. Creating first booking (Cricket arena)...")
    booking1_data = {
        "venue_id": venue_id,
        "arena_id": cricket_arena_id,
        "player_mobile": "+919888777666",
        "player_name": "Test Player 1",
        "booking_date": "2025-09-24",
        "start_time": "10:00",
        "end_time": "12:00",
        "sport": "Cricket"
    }
    
    booking1_response = requests.post(f"{BASE_URL}/venue-owner/bookings",
                                     json=booking1_data, headers=headers)
    if booking1_response.status_code != 200:
        print(f"❌ First booking failed: {booking1_response.status_code}")
        print(booking1_response.text)
        return False
    
    booking1_id = booking1_response.json().get("booking_id")
    print(f"✅ First booking created: {booking1_id}")
    
    # Step 5: Try to book same arena at same time (should fail)
    print("5. Testing same arena conflict (should fail)...")
    conflict_booking_data = {
        "venue_id": venue_id,
        "arena_id": cricket_arena_id,  # Same arena
        "player_mobile": "+919999888777",
        "player_name": "Test Player 2",
        "booking_date": "2025-09-24",  # Same date
        "start_time": "10:00",  # Same time
        "end_time": "12:00",
        "sport": "Cricket"
    }
    
    conflict_response = requests.post(f"{BASE_URL}/venue-owner/bookings",
                                     json=conflict_booking_data, headers=headers)
    
    if conflict_response.status_code == 409:  # Conflict expected
        print("✅ Same arena conflict detection working correctly")
    else:
        print(f"❌ Same arena conflict detection failed - Status: {conflict_response.status_code}")
        print(conflict_response.text)
        return False
    
    # Step 6: Book different arena at same time (should succeed)
    print("6. Testing different arena booking (should succeed)...")
    different_arena_booking_data = {
        "venue_id": venue_id,
        "arena_id": football_arena_id,  # Different arena
        "player_mobile": "+919999888777",
        "player_name": "Test Player 2",
        "booking_date": "2025-09-24",  # Same date
        "start_time": "10:00",  # Same time
        "end_time": "12:00",
        "sport": "Football"
    }
    
    different_arena_response = requests.post(f"{BASE_URL}/venue-owner/bookings",
                                           json=different_arena_booking_data, headers=headers)
    
    if different_arena_response.status_code == 200:
        booking2_id = different_arena_response.json().get("booking_id")
        print(f"✅ Different arena booking successful: {booking2_id}")
        print("✅ Arena-specific conflict detection is working correctly!")
        return True
    else:
        print(f"❌ Different arena booking failed - Status: {different_arena_response.status_code}")
        print(different_arena_response.text)
        return False

if __name__ == "__main__":
    success = test_conflict_detection()
    if success:
        print("\n🎉 ARENA-SPECIFIC CONFLICT DETECTION TEST PASSED!")
    else:
        print("\n❌ ARENA-SPECIFIC CONFLICT DETECTION TEST FAILED!")