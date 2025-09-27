#!/usr/bin/env python3
"""
Test Progressive Onboarding API Endpoints
"""

import requests
import json
import time

BASE_URL = "http://localhost:8001/api"

def test_progressive_onboarding():
    """Test the complete progressive onboarding flow"""
    
    print("🚀 Testing Progressive Onboarding Flow")
    print("=" * 50)
    
    # Test data
    mobile = "+919876543210"
    
    # Step 1: Send OTP
    print("\n1. Sending OTP...")
    otp_response = requests.post(f"{BASE_URL}/auth/send-otp", json={
        "mobile": mobile
    })
    
    if otp_response.status_code == 200:
        otp_data = otp_response.json()
        print(f"✅ OTP sent successfully")
        print(f"📱 Dev OTP: {otp_data.get('dev_info', 'N/A')}")
        
        # Extract OTP from dev_info
        dev_otp = otp_data.get('dev_info', '').split(': ')[-1]
        if dev_otp == 'N/A':
            dev_otp = "123456"  # fallback
    else:
        print(f"❌ Failed to send OTP: {otp_response.text}")
        return
    
    # Step 2: Progressive Onboarding Step 1 (Basic Info + OTP Verification)
    print("\n2. Progressive Onboarding Step 1...")
    step1_response = requests.post(f"{BASE_URL}/onboarding/step1", json={
        "mobile": mobile,
        "otp": dev_otp,
        "first_name": "John",
        "last_name": "Doe",
        "email": "john.doe@example.com"
    })
    
    if step1_response.status_code == 200:
        step1_data = step1_response.json()
        print(f"✅ Step 1 completed successfully")
        print(f"🔑 Access Token: {step1_data.get('access_token', 'N/A')[:20]}...")
        print(f"👤 User ID: {step1_data.get('user_id')}")
        print(f"➡️  Next Step: {step1_data.get('next_step')}")
        
        access_token = step1_data.get('access_token')
        headers = {"Authorization": f"Bearer {access_token}"}
    else:
        print(f"❌ Step 1 failed: {step1_response.text}")
        return
    
    # Step 3: Progressive Onboarding Step 2 (Venue Info)
    print("\n3. Progressive Onboarding Step 2...")
    step2_response = requests.post(f"{BASE_URL}/onboarding/step2", 
        headers=headers,
        json={
            "venue_name": "Champions Sports Complex",
            "address": "123 Sports Street, Stadium Area",
            "city": "Mumbai",
            "state": "Maharashtra",
            "pincode": "400001",
            "cover_photo": None,
            "operating_days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
            "start_time": "06:00",
            "end_time": "22:00",
            "contact_phone": mobile
        })
    
    if step2_response.status_code == 200:
        step2_data = step2_response.json()
        print(f"✅ Step 2 completed successfully")
        print(f"➡️  Next Step: {step2_data.get('next_step')}")
    else:
        print(f"❌ Step 2 failed: {step2_response.text}")
        return
    
    # Step 4: Progressive Onboarding Step 3 (Arena/Sport Config)
    print("\n4. Progressive Onboarding Step 3...")
    step3_response = requests.post(f"{BASE_URL}/onboarding/step3", 
        headers=headers,
        json={
            "sport_type": "Cricket",
            "number_of_courts": 2,
            "slot_duration": 60,
            "price_per_slot": 1500.0
        })
    
    if step3_response.status_code == 200:
        step3_data = step3_response.json()
        print(f"✅ Step 3 completed successfully")
        print(f"🏟️  Arena ID: {step3_data.get('arena_id')}")
        print(f"➡️  Next Step: {step3_data.get('next_step')}")
    else:
        print(f"❌ Step 3 failed: {step3_response.text}")
        return
    
    # Step 5: Progressive Onboarding Step 4 (Amenities & Rules)
    print("\n5. Progressive Onboarding Step 4...")
    step4_response = requests.post(f"{BASE_URL}/onboarding/step4", 
        headers=headers,
        json={
            "amenities": ["Parking", "Changing Rooms", "Water Facility", "First Aid"],
            "rules": "No smoking. Proper sports attire required. Advance booking mandatory."
        })
    
    if step4_response.status_code == 200:
        step4_data = step4_response.json()
        print(f"✅ Step 4 completed successfully")
        print(f"➡️  Next Step: {step4_data.get('next_step')}")
    else:
        print(f"❌ Step 4 failed: {step4_response.text}")
        return
    
    # Step 6: Progressive Onboarding Step 5 (Payment Details - Optional)
    print("\n6. Progressive Onboarding Step 5...")
    step5_response = requests.post(f"{BASE_URL}/onboarding/step5", 
        headers=headers,
        json={
            "bank_account_number": "1234567890",
            "bank_ifsc": "HDFC0000123",
            "bank_account_holder": "John Doe",
            "upi_id": "john.doe@paytm"
        })
    
    if step5_response.status_code == 200:
        step5_data = step5_response.json()
        print(f"✅ Step 5 completed successfully")
        print(f"🎉 Onboarding Completed: {step5_data.get('onboarding_completed')}")
    else:
        print(f"❌ Step 5 failed: {step5_response.text}")
        return
    
    # Step 7: Check Onboarding Status
    print("\n7. Checking Onboarding Status...")
    status_response = requests.get(f"{BASE_URL}/onboarding/status", headers=headers)
    
    if status_response.status_code == 200:
        status_data = status_response.json()
        print(f"✅ Onboarding Status Retrieved")
        print(f"📊 Status Details:")
        print(f"   - User ID: {status_data.get('user_id')}")
        print(f"   - Mobile: {status_data.get('mobile')}")
        print(f"   - Onboarding Completed: {status_data.get('onboarding_completed')}")
        print(f"   - Completed Steps: {status_data.get('completed_steps')}")
        print(f"   - Current Step: {status_data.get('current_step')}")
        print(f"   - Has Venue: {status_data.get('has_venue')}")
        print(f"   - Has Arena: {status_data.get('has_arena')}")
        print(f"   - Can Go Live: {status_data.get('can_go_live')}")
    else:
        print(f"❌ Failed to get status: {status_response.text}")
        return
    
    print("\n🎉 Progressive Onboarding Test Completed Successfully!")
    print("=" * 50)

if __name__ == "__main__":
    test_progressive_onboarding()