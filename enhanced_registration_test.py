#!/usr/bin/env python3
"""
Test the enhanced venue owner registration flow with venue details
"""

import requests
import json
import random

BASE_URL = "http://localhost:8001/api"

def test_enhanced_registration():
    print("🚀 TESTING ENHANCED VENUE OWNER REGISTRATION")
    print("=" * 50)
    
    # Generate random mobile number
    random_suffix = str(random.randint(100000, 999999))
    mobile = f"+9195{random_suffix}"
    
    # Step 1: Send OTP
    print(f"\n1. Testing with mobile: {mobile}")
    print("Sending OTP...")
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
        "name": "Priya Patel",
        "email": "priya@newagesports.com",
        "role": "venue_owner",
        # Business details
        "business_name": "New Age Sports Center", 
        "business_address": "321 Sports Avenue, Mumbai",
        "gst_number": "24NEWAGE123F1Z5",
        # Venue details (NEW)
        "venue_name": "New Age Multi-Sport Arena",
        "venue_address": "321 Arena Street, Bandra East, Mumbai",
        "venue_city": "Mumbai",
        "venue_state": "Maharashtra",  
        "venue_pincode": "400051",
        "venue_description": "Modern sports facility with latest equipment",
        "venue_amenities": ["Parking", "Washroom", "Changing Room", "First Aid"],
        "base_price_per_hour": 1000.0,
        "contact_phone": mobile,
        "whatsapp_number": mobile
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
