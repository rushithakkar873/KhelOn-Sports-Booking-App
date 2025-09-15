#!/usr/bin/env python3
"""
Simple Venue Owner Booking Creation Test
Quick test to verify the enhanced booking system backend functionality
"""

import requests
import json
from datetime import datetime, timedelta

# Configuration
BASE_URL = "https://court-finder-6.preview.emergentagent.com/api"
HEADERS = {"Content-Type": "application/json"}

def test_simple_booking_flow():
    """Test the simple booking creation flow"""
    print("🚀 Testing Enhanced Booking System Backend Functionality")
    print(f"API Base URL: {BASE_URL}")
    
    # Step 1: Authenticate as venue owner using unified mobile OTP
    print("\n1️⃣ Authenticating venue owner...")
    venue_owner_mobile = "+919876543210"
    
    # Send OTP
    otp_response = requests.post(f"{BASE_URL}/auth/send-otp", 
                                json={"mobile": venue_owner_mobile}, 
                                headers=HEADERS)
    
    if otp_response.status_code != 200:
        print(f"❌ Failed to send OTP: {otp_response.text}")
        return False
    
    otp_data = otp_response.json()
    dev_otp = otp_data.get("dev_info", "").replace("OTP: ", "")
    print(f"✅ OTP sent successfully. Dev OTP: {dev_otp}")
    
    # Login with OTP
    login_response = requests.post(f"{BASE_URL}/auth/login",
                                  json={"mobile": venue_owner_mobile, "otp": dev_otp},
                                  headers=HEADERS)
    
    if login_response.status_code != 200:
        print(f"❌ Failed to login: {login_response.text}")
        return False
    
    login_data = login_response.json()
    token = login_data["access_token"]
    user_info = login_data["user"]
    
    print(f"✅ Authentication successful!")
    print(f"   User: {user_info['name']} ({user_info['role']})")
    print(f"   Mobile: {user_info['mobile']}")
    
    # Verify role is venue_owner
    if user_info["role"] != "venue_owner":
        print(f"❌ Expected venue_owner role, got {user_info['role']}")
        return False
    
    # Step 2: Get venue owner's venues
    print("\n2️⃣ Getting venue owner's venues...")
    auth_headers = HEADERS.copy()
    auth_headers["Authorization"] = f"Bearer {token}"
    
    venues_response = requests.get(f"{BASE_URL}/venue-owner/venues", headers=auth_headers)
    
    if venues_response.status_code != 200:
        print(f"❌ Failed to get venues: {venues_response.text}")
        return False
    
    venues = venues_response.json()
    if not venues:
        print("❌ No venues found for venue owner")
        return False
    
    venue = venues[0]  # Use first venue
    venue_id = venue["id"]
    print(f"✅ Found {len(venues)} venues")
    print(f"   Using venue: {venue['name']} (ID: {venue_id})")
    print(f"   Sports: {venue['sports_supported']}")
    print(f"   Base price: ₹{venue['base_price_per_hour']}/hour")
    
    # Step 3: Create a simple booking
    print("\n3️⃣ Creating a simple booking...")
    
    booking_date = (datetime.now() + timedelta(days=2)).strftime("%Y-%m-%d")
    booking_data = {
        "venue_id": venue_id,
        "player_mobile": "+919888777666",  # Existing player
        "booking_date": booking_date,
        "start_time": "16:00",
        "end_time": "18:00",
        "sport": "Cricket",
        "notes": "Simple test booking via venue owner"
    }
    
    booking_response = requests.post(f"{BASE_URL}/venue-owner/bookings",
                                   json=booking_data,
                                   headers=auth_headers)
    
    if booking_response.status_code != 200:
        print(f"❌ Failed to create booking: {booking_response.text}")
        return False
    
    booking_result = booking_response.json()
    print(f"✅ Booking created successfully!")
    print(f"   Booking ID: {booking_result['booking_id']}")
    print(f"   Player Mobile: {booking_result['player_mobile']}")
    print(f"   Total Amount: ₹{booking_result['total_amount']}")
    print(f"   Payment Link: {booking_result['payment_link']}")
    print(f"   SMS Status: {booking_result['sms_status']}")
    
    # Step 4: Verify booking was created
    print("\n4️⃣ Verifying booking was created...")
    
    booking_id = booking_result['booking_id']
    booking_details_response = requests.get(f"{BASE_URL}/venue-owner/bookings/{booking_id}",
                                          headers=auth_headers)
    
    if booking_details_response.status_code != 200:
        print(f"❌ Failed to get booking details: {booking_details_response.text}")
        return False
    
    booking_details = booking_details_response.json()
    print(f"✅ Booking verification successful!")
    print(f"   Venue: {booking_details['venue_name']}")
    print(f"   Player: {booking_details['player_name']} ({booking_details['player_phone']})")
    print(f"   Date/Time: {booking_details['booking_date']} {booking_details['start_time']}-{booking_details['end_time']}")
    print(f"   Duration: {booking_details['duration_hours']} hours")
    print(f"   Status: {booking_details['status']}")
    print(f"   Payment Status: {booking_details['payment_status']}")
    
    # Step 5: Test booking list
    print("\n5️⃣ Testing booking list...")
    
    bookings_response = requests.get(f"{BASE_URL}/venue-owner/bookings", headers=auth_headers)
    
    if bookings_response.status_code != 200:
        print(f"❌ Failed to get bookings list: {bookings_response.text}")
        return False
    
    bookings = bookings_response.json()
    print(f"✅ Retrieved {len(bookings)} bookings")
    
    if bookings:
        latest_booking = bookings[0]
        print(f"   Latest: {latest_booking['player_name']} - {latest_booking['booking_date']} {latest_booking['start_time']}-{latest_booking['end_time']}")
    
    print("\n🎉 All tests passed! Enhanced booking system backend is working correctly.")
    return True

if __name__ == "__main__":
    success = test_simple_booking_flow()
    if not success:
        print("\n❌ Test failed!")
        exit(1)
    else:
        print("\n✅ Test completed successfully!")
        exit(0)