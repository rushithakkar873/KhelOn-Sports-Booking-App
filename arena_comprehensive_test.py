#!/usr/bin/env python3
"""
Comprehensive Arena-Based System Test for KhelON
Testing all the scenarios mentioned in the review request
"""

import requests
import json
from datetime import datetime, timedelta

BASE_URL = "http://localhost:8001/api"
VENUE_OWNER_MOBILE = "+919876543210"

def test_arena_system():
    print("🚀 COMPREHENSIVE ARENA-BASED SYSTEM TESTING")
    print("=" * 60)
    
    results = []
    
    # Test 1: Health Check
    print("🔍 Test 1: Health Check & KhelON Branding")
    try:
        response = requests.get(f"{BASE_URL}/", timeout=10)
        if response.status_code == 200:
            data = response.json()
            if "KhelOn" in data.get("message", "") and "v2.0.0" in data.get("message", ""):
                print("✅ PASS: Health Check - KhelON API v2.0.0 running")
                results.append(True)
            else:
                print(f"❌ FAIL: Unexpected response - {data}")
                results.append(False)
        else:
            print(f"❌ FAIL: Status {response.status_code}")
            results.append(False)
    except Exception as e:
        print(f"❌ FAIL: {str(e)}")
        results.append(False)
    
    # Test 2: Authentication
    print("\n🔍 Test 2: Venue Partner Authentication")
    try:
        # Send OTP
        otp_response = requests.post(f"{BASE_URL}/auth/send-otp", 
                                   json={"mobile": VENUE_OWNER_MOBILE}, timeout=10)
        if otp_response.status_code != 200:
            print(f"❌ FAIL: OTP send failed - {otp_response.status_code}")
            results.append(False)
            return results
        
        otp_data = otp_response.json()
        dev_otp = otp_data.get("dev_info", "").split(": ")[-1]
        
        # Login
        login_response = requests.post(f"{BASE_URL}/auth/login",
                                     json={"mobile": VENUE_OWNER_MOBILE, "otp": dev_otp}, timeout=10)
        if login_response.status_code != 200:
            print(f"❌ FAIL: Login failed - {login_response.status_code}")
            results.append(False)
            return results
        
        login_data = login_response.json()
        token = login_data.get("access_token")
        user = login_data.get("user", {})
        
        if user.get("role") == "venue_partner":
            print(f"✅ PASS: Authentication - {user.get('name')} (venue_partner)")
            results.append(True)
        else:
            print(f"❌ FAIL: Wrong role - {user.get('role')}")
            results.append(False)
            return results
            
    except Exception as e:
        print(f"❌ FAIL: {str(e)}")
        results.append(False)
        return results
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Test 3: Multi-Arena Venue Creation
    print("\n🔍 Test 3: Multi-Arena Venue Creation (Cricket + Football)")
    try:
        venue_data = {
            "name": "Elite Sports Complex",
            "sports_supported": ["Cricket", "Football"],
            "address": "123 Sports Avenue, Bandra West",
            "city": "Mumbai",
            "state": "Maharashtra",
            "pincode": "400050",
            "description": "Premium multi-sport facility with professional arenas",
            "amenities": ["Parking", "Washroom", "Cafeteria"],
            "base_price_per_hour": 1000.0,
            "contact_phone": "+919876543210",
            "whatsapp_number": "+919876543210",
            "images": [],
            "rules_and_regulations": "No smoking, proper sports attire required",
            "cancellation_policy": "24 hours advance notice required",
            "arenas": [
                {
                    "name": "Cricket Ground A",
                    "sport": "Cricket",
                    "capacity": 22,
                    "description": "Professional cricket ground with floodlights",
                    "amenities": ["Floodlights", "Parking"],
                    "base_price_per_hour": 1200.0,
                    "images": [],
                    "slots": [
                        {
                            "day_of_week": 0,
                            "start_time": "18:00",
                            "end_time": "20:00",
                            "capacity": 1,
                            "price_per_hour": 1200.0,
                            "is_peak_hour": True
                        }
                    ],
                    "is_active": True
                },
                {
                    "name": "Football Field B",
                    "sport": "Football",
                    "capacity": 20,
                    "description": "FIFA standard football field",
                    "amenities": ["Washroom", "Seating"],
                    "base_price_per_hour": 800.0,
                    "images": [],
                    "slots": [
                        {
                            "day_of_week": 0,
                            "start_time": "18:00",
                            "end_time": "20:00",
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
                                     json=venue_data, headers=headers, timeout=10)
        
        if venue_response.status_code == 200:
            venue_result = venue_response.json()
            venue_id = venue_result.get("venue_id")
            print(f"✅ PASS: Multi-Arena Venue Created - ID: {venue_id}")
            results.append(True)
        else:
            error_msg = venue_response.json().get("detail", "Unknown error") if venue_response.text else "No response"
            print(f"❌ FAIL: Venue creation failed - {error_msg}")
            results.append(False)
            return results
            
    except Exception as e:
        print(f"❌ FAIL: {str(e)}")
        results.append(False)
        return results
    
    # Test 4: Venue Listing with Arenas
    print("\n🔍 Test 4: Venue Listing with Arenas Array")
    try:
        venues_response = requests.get(f"{BASE_URL}/venue-owner/venues", 
                                     headers=headers, timeout=10)
        
        if venues_response.status_code == 200:
            venues = venues_response.json()
            test_venue = next((v for v in venues if v.get("id") == venue_id), None)
            
            if test_venue:
                arenas = test_venue.get("arenas", [])
                if len(arenas) >= 2:
                    cricket_arena = next((a for a in arenas if a["sport"] == "Cricket"), None)
                    football_arena = next((a for a in arenas if a["sport"] == "Football"), None)
                    
                    if cricket_arena and football_arena:
                        print(f"✅ PASS: Venue Listing - Found {len(arenas)} arenas")
                        print(f"   Cricket Ground A: ₹{cricket_arena['base_price_per_hour']}/hr, capacity {cricket_arena['capacity']}")
                        print(f"   Football Field B: ₹{football_arena['base_price_per_hour']}/hr, capacity {football_arena['capacity']}")
                        arena_ids = [cricket_arena["id"], football_arena["id"]]
                        results.append(True)
                    else:
                        print("❌ FAIL: Missing expected arenas")
                        results.append(False)
                        return results
                else:
                    print(f"❌ FAIL: Expected 2+ arenas, got {len(arenas)}")
                    results.append(False)
                    return results
            else:
                print("❌ FAIL: Test venue not found in listing")
                results.append(False)
                return results
        else:
            print(f"❌ FAIL: Venue listing failed - {venues_response.status_code}")
            results.append(False)
            return results
            
    except Exception as e:
        print(f"❌ FAIL: {str(e)}")
        results.append(False)
        return results
    
    # Test 5: Arena-Specific Booking
    print("\n🔍 Test 5: Arena-Specific Booking Creation")
    try:
        tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
        
        booking_data = {
            "venue_id": venue_id,
            "arena_id": arena_ids[0],  # Cricket arena
            "player_mobile": "+919888777666",
            "booking_date": tomorrow,
            "start_time": "18:00",
            "end_time": "20:00",
            "sport": "Cricket",
            "notes": "Evening cricket practice session"
        }
        
        booking_response = requests.post(f"{BASE_URL}/venue-owner/bookings", 
                                       json=booking_data, headers=headers, timeout=10)
        
        if booking_response.status_code == 200:
            booking_result = booking_response.json()
            booking_id = booking_result.get("booking_id")
            amount = booking_result.get("total_amount")
            print(f"✅ PASS: Arena-Specific Booking - ID: {booking_id}, Amount: ₹{amount}")
            results.append(True)
        else:
            error_msg = booking_response.json().get("detail", "Unknown error") if booking_response.text else "No response"
            print(f"❌ FAIL: Booking creation failed - {error_msg}")
            results.append(False)
            return results
            
    except Exception as e:
        print(f"❌ FAIL: {str(e)}")
        results.append(False)
        return results
    
    # Test 6: Arena Conflict Detection
    print("\n🔍 Test 6: Arena-Specific Conflict Detection")
    try:
        # Test same arena conflict (should fail)
        conflict_booking = {
            "venue_id": venue_id,
            "arena_id": arena_ids[0],  # Same cricket arena
            "player_mobile": "+919999888777",
            "player_name": "Rahul Verma",
            "booking_date": tomorrow,
            "start_time": "18:00",
            "end_time": "20:00",
            "sport": "Cricket"
        }
        
        conflict_response = requests.post(f"{BASE_URL}/venue-owner/bookings", 
                                        json=conflict_booking, headers=headers, timeout=10)
        
        if conflict_response.status_code == 409:
            print("✅ PASS: Same Arena Conflict Detection - Correctly rejected")
            
            # Test different arena (should succeed)
            different_arena_booking = {
                "venue_id": venue_id,
                "arena_id": arena_ids[1],  # Football arena
                "player_mobile": "+919999888777",
                "player_name": "Rahul Verma",
                "booking_date": tomorrow,
                "start_time": "18:00",
                "end_time": "20:00",
                "sport": "Football"
            }
            
            different_response = requests.post(f"{BASE_URL}/venue-owner/bookings", 
                                             json=different_arena_booking, headers=headers, timeout=10)
            
            if different_response.status_code == 200:
                result = different_response.json()
                print(f"✅ PASS: Different Arena Same Time - Amount: ₹{result.get('total_amount')}")
                results.append(True)
            else:
                print(f"❌ FAIL: Different arena booking failed - {different_response.status_code}")
                results.append(False)
        else:
            print(f"❌ FAIL: Expected 409 conflict, got {conflict_response.status_code}")
            results.append(False)
            
    except Exception as e:
        print(f"❌ FAIL: {str(e)}")
        results.append(False)
        return results
    
    # Test 7: Analytics Dashboard
    print("\n🔍 Test 7: Analytics Dashboard (Arena-Based)")
    try:
        analytics_response = requests.get(f"{BASE_URL}/venue-owner/analytics/dashboard", 
                                        headers=headers, timeout=10)
        
        if analytics_response.status_code == 200:
            analytics = analytics_response.json()
            
            required_fields = [
                "total_venues", "total_bookings", "total_revenue", "occupancy_rate",
                "recent_bookings", "revenue_trend", "top_sports", "peak_hours"
            ]
            
            missing_fields = [field for field in required_fields if field not in analytics]
            
            if not missing_fields:
                print(f"✅ PASS: Analytics Dashboard")
                print(f"   Venues: {analytics['total_venues']}")
                print(f"   Bookings: {analytics['total_bookings']}")
                print(f"   Revenue: ₹{analytics['total_revenue']}")
                print(f"   Occupancy: {analytics['occupancy_rate']}%")
                results.append(True)
            else:
                print(f"❌ FAIL: Missing fields - {missing_fields}")
                results.append(False)
        else:
            print(f"❌ FAIL: Analytics failed - {analytics_response.status_code}")
            results.append(False)
            
    except Exception as e:
        print(f"❌ FAIL: {str(e)}")
        results.append(False)
    
    # Summary
    print("\n" + "=" * 60)
    print("🏆 ARENA-BASED SYSTEM TEST SUMMARY")
    print("=" * 60)
    
    passed = sum(results)
    total = len(results)
    
    print(f"✅ PASSED: {passed}/{total}")
    print(f"❌ FAILED: {total - passed}/{total}")
    print(f"📊 SUCCESS RATE: {(passed/total*100):.1f}%")
    
    if passed == total:
        print("\n🎉 ALL TESTS PASSED! Arena-based system is working perfectly.")
        print("✅ Multi-arena venue creation working")
        print("✅ Arena-specific booking system working")
        print("✅ Arena-based conflict detection working")
        print("✅ Analytics dashboard with arena metrics working")
    else:
        print(f"\n⚠️ {total - passed} test(s) failed. Please review the issues above.")
    
    return passed == total

if __name__ == "__main__":
    success = test_arena_system()
    exit(0 if success else 1)