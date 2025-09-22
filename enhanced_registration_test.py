#!/usr/bin/env python3
"""
Test the enhanced venue owner registration flow with venue details
"""

import requests
import json

BASE_URL = "http://localhost:8001/api"

def test_enhanced_registration():
    print("🚀 TESTING ENHANCED VENUE OWNER REGISTRATION")
    print("=" * 50)
    
    # Step 1: Send OTP
    print("\n1. Sending OTP...")
    mobile = "+919999888777"  # Different mobile
    otp_response = requests.post(f"{BASE_URL}/auth/send-otp", 
                               json={"mobile": mobile})
    
    if otp_response.status_code != 200:
        print(f"❌ OTP send failed: {otp_response.status_code}")
        return
    
    otp_data = otp_response.json()
    dev_otp = otp_data.get("dev_info", "").split(": ")[-1]
    print(f"✅ OTP sent successfully. Dev OTP: {dev_otp}")
    
    # Step 2: Register with enhanced venue details
    print("\n2. Registering venue owner with venue details...")
    registration_data = {
        "mobile": mobile,
        "otp": dev_otp,
        "name": "Amit Sharma",
        "email": "amit@premiumsports.com",
        "role": "venue_owner",
        # Business details
        "business_name": "Premium Sports Arena",
        "business_address": "789 Premium Street, Mumbai",
        "gst_number": "24PREMIUM123F1Z5",
        # Venue details (NEW)
        "venue_name": "Premium Multi-Sport Complex",
        "venue_address": "789 Premium Road, Powai, Mumbai",
        "venue_city": "Mumbai",
        "venue_state": "Maharashtra",  
        "venue_pincode": "400076",
        "venue_description": "State-of-the-art multi-sport facility",
        "venue_amenities": ["Parking", "Washroom", "AC", "Cafeteria", "WiFi"],
        "base_price_per_hour": 1500.0,
        "contact_phone": "+919999888777",
        "whatsapp_number": "+919999888777"
    }
    
    register_response = requests.post(f"{BASE_URL}/auth/register",
                                    json=registration_data)
    
    if register_response.status_code != 200:
        print(f"❌ Registration failed: {register_response.status_code}")
        print(register_response.text)
        return
    
    register_data = register_response.json()
    token = register_data.get("access_token")
    user = register_data.get("user", {})
    
    print(f"✅ Registration successful!")
    print(f"   User: {user.get('name')} ({user.get('role')})")
    print(f"   Business: {user.get('business_name')}")
    print(f"   Total Venues: {user.get('total_venues')}")
    
    # Step 3: Verify venue was created
    print("\n3. Verifying automatic venue creation...")
    headers = {"Authorization": f"Bearer {token}"}
    
    venues_response = requests.get(f"{BASE_URL}/venue-owner/venues", 
                                 headers=headers)
    
    if venues_response.status_code != 200:
        print(f"❌ Venue fetch failed: {venues_response.status_code}")
        return
    
    venues = venues_response.json()
    if len(venues) == 1:
        venue = venues[0]
        print(f"✅ Venue created automatically!")
        print(f"   Name: {venue.get('name')}")
        print(f"   Address: {venue.get('address')}")
        print(f"   City: {venue.get('city')}, {venue.get('state')}")
        print(f"   Base Price: ₹{venue.get('base_price_per_hour')}/hr")
        print(f"   Amenities: {venue.get('amenities')}")
        print(f"   Arenas: {len(venue.get('arenas', []))} (ready for population)")
        print(f"   Owner: {venue.get('owner_name')}")
        print(f"   Active: {venue.get('is_active')}")
    else:
        print(f"❌ Expected 1 venue, got {len(venues)}")
        return
    
    print("\n🎉 ENHANCED REGISTRATION TEST COMPLETED SUCCESSFULLY!")
    print("✅ All venue details collected during registration")
    print("✅ Venue automatically created and linked to owner")  
    print("✅ Single venue MVP structure ready")

if __name__ == "__main__":
    test_enhanced_registration()
