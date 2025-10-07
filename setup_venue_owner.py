#!/usr/bin/env python3
"""
Setup script to create venue partner Rajesh Kumar for testing
"""

import requests
import json

BASE_URL = "https://sportsbooker-5.preview.emergentagent.com/api"
HEADERS = {"Content-Type": "application/json"}

def setup_venue_owner():
    """Create venue partner Rajesh Kumar"""
    print("🏗️  Setting up venue partner Rajesh Kumar...")
    
    # Use a different mobile number for venue partner
    venue_owner_mobile = "+919876543212"  # Different from existing player
    venue_owner_name = "Rajesh Kumar"
    
    # Step 1: Send OTP
    print(f"📱 Sending OTP to {venue_owner_mobile}")
    otp_request = {"mobile": venue_owner_mobile}
    response = requests.post(f"{BASE_URL}/auth/send-otp", json=otp_request, headers=HEADERS)
    
    if response.status_code != 200:
        print(f"❌ Failed to send OTP: {response.text}")
        return False
    
    otp_data = response.json()
    dev_otp = otp_data.get("dev_info", "").replace("OTP: ", "")
    print(f"✅ OTP sent: {dev_otp}")
    
    # Step 2: Register as venue partner
    print(f"👤 Registering {venue_owner_name} as venue partner")
    registration_data = {
        "mobile": venue_owner_mobile,
        "otp": dev_otp,
        "name": venue_owner_name,
        "role": "venue_partner",
        "email": "rajesh.kumar@example.com",
        "business_name": "Elite Sports Complex",
        "business_address": "Bandra West, Mumbai, Maharashtra 400050",
        "gst_number": "24ABCDE1234F1Z5"
    }
    
    response = requests.post(f"{BASE_URL}/auth/register", json=registration_data, headers=HEADERS)
    
    if response.status_code != 200:
        print(f"❌ Registration failed: {response.text}")
        return False
    
    reg_data = response.json()
    user_data = reg_data.get("user", {})
    
    print("✅ Venue partner registered successfully")
    print(f"   Name: {user_data.get('name')}")
    print(f"   Role: {user_data.get('role')}")
    print(f"   Mobile: {user_data.get('mobile')}")
    print(f"   Business: {user_data.get('business_name')}")
    
    # Step 3: Create venues for testing
    token = reg_data.get("access_token")
    headers_with_auth = HEADERS.copy()
    headers_with_auth["Authorization"] = f"Bearer {token}"
    
    # Create Elite Cricket Ground Mumbai
    print("🏏 Creating Elite Cricket Ground Mumbai")
    cricket_venue_data = {
        "name": "Elite Cricket Ground Mumbai",
        "sports_supported": ["Cricket"],
        "address": "Bandra West, Mumbai",
        "city": "Mumbai",
        "state": "Maharashtra",
        "pincode": "400050",
        "description": "Premium cricket ground with professional facilities",
        "amenities": ["Floodlights", "Changing Rooms", "Parking", "Cafeteria"],
        "base_price_per_hour": 1200.0,
        "contact_phone": "+919876543213",
        "whatsapp_number": "+919876543213",
        "images": [],
        "rules_and_regulations": "No smoking, proper cricket attire required",
        "cancellation_policy": "24 hours notice required for cancellation",
        "slots": [
            {
                "day_of_week": 0,  # Monday
                "start_time": "06:00",
                "end_time": "08:00",
                "capacity": 22,
                "price_per_hour": 1200.0,
                "is_peak_hour": False
            },
            {
                "day_of_week": 0,  # Monday
                "start_time": "18:00",
                "end_time": "20:00",
                "capacity": 22,
                "price_per_hour": 1500.0,
                "is_peak_hour": True
            }
        ]
    }
    
    response = requests.post(f"{BASE_URL}/venue-owner/venues", json=cricket_venue_data, headers=headers_with_auth)
    
    if response.status_code != 200:
        print(f"❌ Failed to create cricket venue: {response.text}")
        return False
    
    cricket_venue_response = response.json()
    cricket_venue_id = cricket_venue_response.get("venue_id")
    print(f"✅ Cricket venue created: {cricket_venue_id}")
    
    # Create Elite Football Ground Mumbai
    print("⚽ Creating Elite Football Ground Mumbai")
    football_venue_data = {
        "name": "Elite Football Ground Mumbai",
        "sports_supported": ["Football"],
        "address": "Bandra West, Mumbai",
        "city": "Mumbai",
        "state": "Maharashtra",
        "pincode": "400050",
        "description": "Professional football ground with FIFA standard facilities",
        "amenities": ["Floodlights", "Changing Rooms", "Parking", "Medical Room"],
        "base_price_per_hour": 1000.0,
        "contact_phone": "+919876543213",
        "whatsapp_number": "+919876543213",
        "images": [],
        "rules_and_regulations": "No metal studs allowed, proper football attire required",
        "cancellation_policy": "24 hours notice required for cancellation",
        "slots": [
            {
                "day_of_week": 0,  # Monday
                "start_time": "07:00",
                "end_time": "09:00",
                "capacity": 22,
                "price_per_hour": 1000.0,
                "is_peak_hour": False
            },
            {
                "day_of_week": 0,  # Monday
                "start_time": "19:00",
                "end_time": "21:00",
                "capacity": 22,
                "price_per_hour": 1200.0,
                "is_peak_hour": True
            }
        ]
    }
    
    response = requests.post(f"{BASE_URL}/venue-owner/venues", json=football_venue_data, headers=headers_with_auth)
    
    if response.status_code != 200:
        print(f"❌ Failed to create football venue: {response.text}")
        return False
    
    football_venue_response = response.json()
    football_venue_id = football_venue_response.get("venue_id")
    print(f"✅ Football venue created: {football_venue_id}")
    
    print("\n🎉 Setup completed successfully!")
    print(f"Venue Partner: {venue_owner_name} ({venue_owner_mobile})")
    print(f"Cricket Venue ID: {cricket_venue_id}")
    print(f"Football Venue ID: {football_venue_id}")
    
    return True, venue_owner_mobile

if __name__ == "__main__":
    success, mobile = setup_venue_owner()
    if success:
        print(f"\n✅ Use mobile number {mobile} for venue partner testing")
    else:
        print("\n❌ Setup failed")