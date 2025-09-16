#!/usr/bin/env python3
"""
Comprehensive Testing for Unified Authentication System with Mobile OTP Verification
Tests all new authentication endpoints with Indian mobile numbers and OTP verification
"""

import requests
import json
import time
from datetime import datetime, timedelta
from typing import Dict, Any, Optional

# Configuration
BASE_URL = "https://matchfinder-7.preview.emergentagent.com/api"
HEADERS = {"Content-Type": "application/json"}

class UnifiedAuthTester:
    def __init__(self):
        self.base_url = BASE_URL
        self.headers = HEADERS.copy()
        self.player_token = None
        self.venue_owner_token = None
        self.player_id = None
        self.venue_owner_id = None
        self.test_venue_id = None
        
        # Test data with realistic Indian mobile numbers
        self.test_player_mobile = "+919876543210"
        self.test_venue_owner_mobile = "+918765432109"
        
        self.test_player_data = {
            "name": "Arjun Sharma",
            "email": "arjun.sharma@example.com",
            "role": "player",
            "sports_interests": ["Cricket", "Football"],
            "location": "Mumbai, Maharashtra"
        }
        
        self.test_venue_owner_data = {
            "name": "Rajesh Kumar",
            "email": "rajesh.kumar@example.com", 
            "role": "venue_owner",
            "business_name": "Elite Sports Complex",
            "business_address": "Sector 15, Noida, Uttar Pradesh",
            "gst_number": "24ABCDE1234F1Z5"
        }
        
        self.test_venue_data = {
            "name": "Elite Cricket Ground Mumbai",
            "sports_supported": ["Cricket"],
            "address": "Bandra Kurla Complex, Bandra East",
            "city": "Mumbai",
            "state": "Maharashtra", 
            "pincode": "400051",
            "description": "Premium cricket ground with professional facilities and floodlights",
            "amenities": ["Floodlights", "Changing Rooms", "Parking", "Cafeteria", "First Aid"],
            "base_price_per_hour": 1500.0,
            "contact_phone": "+919876543212",
            "whatsapp_number": "+919876543212",
            "images": [],
            "rules_and_regulations": "No smoking, proper cricket attire required, advance booking mandatory",
            "cancellation_policy": "24 hours advance notice required for cancellation",
            "slots": [
                {
                    "day_of_week": 0,  # Monday
                    "start_time": "06:00",
                    "end_time": "08:00",
                    "capacity": 2,
                    "price_per_hour": 1200.0,
                    "is_peak_hour": False
                },
                {
                    "day_of_week": 0,  # Monday
                    "start_time": "18:00", 
                    "end_time": "20:00",
                    "capacity": 2,
                    "price_per_hour": 1800.0,
                    "is_peak_hour": True
                }
            ]
        }

    def make_request(self, method: str, endpoint: str, data: Optional[Dict] = None, 
                    auth_required: bool = False, token: str = None) -> Dict[str, Any]:
        """Make HTTP request with proper error handling"""
        url = f"{self.base_url}{endpoint}"
        headers = self.headers.copy()
        
        if auth_required:
            auth_token = token or self.player_token
            if auth_token:
                headers["Authorization"] = f"Bearer {auth_token}"
        
        try:
            if method.upper() == "GET":
                response = requests.get(url, headers=headers, timeout=30)
            elif method.upper() == "POST":
                response = requests.post(url, headers=headers, json=data, timeout=30)
            elif method.upper() == "PUT":
                response = requests.put(url, headers=headers, json=data, timeout=30)
            else:
                raise ValueError(f"Unsupported method: {method}")
            
            return {
                "status_code": response.status_code,
                "data": response.json() if response.content else {},
                "success": 200 <= response.status_code < 300
            }
        except requests.exceptions.RequestException as e:
            return {
                "status_code": 0,
                "data": {"error": str(e)},
                "success": False
            }
        except json.JSONDecodeError:
            return {
                "status_code": response.status_code,
                "data": {"error": "Invalid JSON response"},
                "success": False
            }

    def test_send_otp_api(self):
        """Test Send OTP API with Indian mobile numbers"""
        print("\n=== Testing Send OTP API ===")
        
        # Test valid Indian mobile number
        otp_request = {"mobile": self.test_player_mobile}
        result = self.make_request("POST", "/auth/send-otp", otp_request)
        
        if result["success"]:
            print("✅ Send OTP with valid Indian mobile successful")
            print(f"   Mobile: {self.test_player_mobile}")
            print(f"   Message: {result['data'].get('message')}")
            if 'dev_info' in result['data']:
                print(f"   Dev OTP: {result['data']['dev_info']}")
            return result['data'].get('dev_info', '').replace('OTP: ', '') if 'dev_info' in result['data'] else None
        else:
            print(f"❌ Send OTP failed: {result}")
            return None
        
    def test_send_otp_validation(self):
        """Test Send OTP API validation"""
        print("\n=== Testing Send OTP Validation ===")
        
        # Test invalid mobile formats
        invalid_mobiles = [
            "+919876543",  # Too short
            "+9198765432100",  # Too long
            "+819876543210",  # Wrong country code
            "+915876543210",  # Invalid first digit
            "9876543210",  # Missing country code
            "+91-9876543210"  # Invalid format
        ]
        
        for mobile in invalid_mobiles:
            result = self.make_request("POST", "/auth/send-otp", {"mobile": mobile})
            if not result["success"] and result["status_code"] == 422:
                print(f"✅ Invalid mobile {mobile} properly rejected")
            else:
                print(f"❌ Invalid mobile {mobile} not handled properly: {result}")
                return False
        
        return True

    def test_verify_otp_api(self):
        """Test Verify OTP API"""
        print("\n=== Testing Verify OTP API ===")
        
        # First send OTP
        otp_code = self.test_send_otp_api()
        if not otp_code:
            print("❌ Could not get OTP for verification test")
            return False
        
        # Test correct OTP verification
        verify_request = {
            "mobile": self.test_player_mobile,
            "otp": otp_code
        }
        result = self.make_request("POST", "/auth/verify-otp", verify_request)
        
        if result["success"]:
            print("✅ OTP verification with correct code successful")
            print(f"   Message: {result['data'].get('message')}")
        else:
            print(f"❌ OTP verification with correct code failed: {result}")
            return False
        
        # Test incorrect OTP
        verify_request["otp"] = "123456"  # Wrong OTP
        result = self.make_request("POST", "/auth/verify-otp", verify_request)
        
        if not result["success"] and result["status_code"] == 400:
            print("✅ OTP verification with incorrect code properly rejected")
        else:
            print(f"❌ OTP verification with incorrect code not handled properly: {result}")
            return False
        
        return True

    def test_user_registration(self):
        """Test User Registration with OTP"""
        print("\n=== Testing User Registration ===")
        
        # Test Player Registration
        print("\n--- Testing Player Registration ---")
        
        # Send OTP for player
        otp_request = {"mobile": self.test_player_mobile}
        result = self.make_request("POST", "/auth/send-otp", otp_request)
        if not result["success"]:
            print(f"❌ Failed to send OTP for player registration: {result}")
            return False
        
        player_otp = result['data'].get('dev_info', '').replace('OTP: ', '') if 'dev_info' in result['data'] else None
        if not player_otp:
            print("❌ Could not extract OTP for player registration")
            return False
        
        # Register player
        registration_data = self.test_player_data.copy()
        registration_data.update({
            "mobile": self.test_player_mobile,
            "otp": player_otp
        })
        
        result = self.make_request("POST", "/auth/register", registration_data)
        if result["success"]:
            print("✅ Player registration successful")
            self.player_token = result['data'].get('access_token')
            self.player_id = result['data'].get('user', {}).get('id')
            print(f"   Player ID: {self.player_id}")
            print(f"   Token: {self.player_token[:20]}..." if self.player_token else "No token")
            print(f"   Role: {result['data'].get('user', {}).get('role')}")
        else:
            print(f"❌ Player registration failed: {result}")
            return False
        
        # Test Venue Owner Registration
        print("\n--- Testing Venue Owner Registration ---")
        
        # Send OTP for venue owner
        otp_request = {"mobile": self.test_venue_owner_mobile}
        result = self.make_request("POST", "/auth/send-otp", otp_request)
        if not result["success"]:
            print(f"❌ Failed to send OTP for venue owner registration: {result}")
            return False
        
        owner_otp = result['data'].get('dev_info', '').replace('OTP: ', '') if 'dev_info' in result['data'] else None
        if not owner_otp:
            print("❌ Could not extract OTP for venue owner registration")
            return False
        
        # Register venue owner
        registration_data = self.test_venue_owner_data.copy()
        registration_data.update({
            "mobile": self.test_venue_owner_mobile,
            "otp": owner_otp
        })
        
        result = self.make_request("POST", "/auth/register", registration_data)
        if result["success"]:
            print("✅ Venue owner registration successful")
            self.venue_owner_token = result['data'].get('access_token')
            self.venue_owner_id = result['data'].get('user', {}).get('id')
            print(f"   Venue Owner ID: {self.venue_owner_id}")
            print(f"   Token: {self.venue_owner_token[:20]}..." if self.venue_owner_token else "No token")
            print(f"   Role: {result['data'].get('user', {}).get('role')}")
            print(f"   Business: {result['data'].get('user', {}).get('business_name')}")
        else:
            print(f"❌ Venue owner registration failed: {result}")
            return False
        
        # Test duplicate registration
        print("\n--- Testing Duplicate Registration Prevention ---")
        result = self.make_request("POST", "/auth/register", registration_data)
        if not result["success"] and result["status_code"] == 400:
            print("✅ Duplicate registration properly prevented")
        else:
            print(f"❌ Duplicate registration not handled properly: {result}")
            return False
        
        return True

    def test_user_login(self):
        """Test User Login with Mobile + OTP"""
        print("\n=== Testing User Login ===")
        
        # Test Player Login
        print("\n--- Testing Player Login ---")
        
        # Send OTP for login
        otp_request = {"mobile": self.test_player_mobile}
        result = self.make_request("POST", "/auth/send-otp", otp_request)
        if not result["success"]:
            print(f"❌ Failed to send OTP for player login: {result}")
            return False
        
        player_otp = result['data'].get('dev_info', '').replace('OTP: ', '') if 'dev_info' in result['data'] else None
        if not player_otp:
            print("❌ Could not extract OTP for player login")
            return False
        
        # Login player
        login_data = {
            "mobile": self.test_player_mobile,
            "otp": player_otp
        }
        
        result = self.make_request("POST", "/auth/login", login_data)
        if result["success"]:
            print("✅ Player login successful")
            new_token = result['data'].get('access_token')
            print(f"   New Token: {new_token[:20]}..." if new_token else "No token")
            print(f"   User: {result['data'].get('user', {}).get('name')}")
            print(f"   Role: {result['data'].get('user', {}).get('role')}")
        else:
            print(f"❌ Player login failed: {result}")
            return False
        
        # Test Venue Owner Login
        print("\n--- Testing Venue Owner Login ---")
        
        # Send OTP for venue owner login
        otp_request = {"mobile": self.test_venue_owner_mobile}
        result = self.make_request("POST", "/auth/send-otp", otp_request)
        if not result["success"]:
            print(f"❌ Failed to send OTP for venue owner login: {result}")
            return False
        
        owner_otp = result['data'].get('dev_info', '').replace('OTP: ', '') if 'dev_info' in result['data'] else None
        if not owner_otp:
            print("❌ Could not extract OTP for venue owner login")
            return False
        
        # Login venue owner
        login_data = {
            "mobile": self.test_venue_owner_mobile,
            "otp": owner_otp
        }
        
        result = self.make_request("POST", "/auth/login", login_data)
        if result["success"]:
            print("✅ Venue owner login successful")
            new_token = result['data'].get('access_token')
            print(f"   New Token: {new_token[:20]}..." if new_token else "No token")
            print(f"   User: {result['data'].get('user', {}).get('name')}")
            print(f"   Role: {result['data'].get('user', {}).get('role')}")
            print(f"   Business: {result['data'].get('user', {}).get('business_name')}")
        else:
            print(f"❌ Venue owner login failed: {result}")
            return False
        
        # Test login with unregistered mobile
        print("\n--- Testing Unregistered Mobile Login ---")
        
        unregistered_mobile = "+919999999999"
        otp_request = {"mobile": unregistered_mobile}
        result = self.make_request("POST", "/auth/send-otp", otp_request)
        if result["success"]:
            unregistered_otp = result['data'].get('dev_info', '').replace('OTP: ', '') if 'dev_info' in result['data'] else None
            if unregistered_otp:
                login_data = {
                    "mobile": unregistered_mobile,
                    "otp": unregistered_otp
                }
                result = self.make_request("POST", "/auth/login", login_data)
                if not result["success"] and result["status_code"] == 400:
                    print("✅ Unregistered mobile login properly rejected")
                else:
                    print(f"❌ Unregistered mobile login not handled properly: {result}")
                    return False
        
        return True

    def test_protected_routes(self):
        """Test Protected Routes with JWT Token"""
        print("\n=== Testing Protected Routes ===")
        
        # Test /auth/profile with valid token
        result = self.make_request("GET", "/auth/profile", auth_required=True, token=self.player_token)
        if result["success"]:
            print("✅ Player profile retrieval successful")
            profile = result['data']
            print(f"   Name: {profile.get('name')}")
            print(f"   Mobile: {profile.get('mobile')}")
            print(f"   Role: {profile.get('role')}")
            print(f"   Verified: {profile.get('is_verified')}")
            print(f"   Sports: {profile.get('sports_interests')}")
        else:
            print(f"❌ Player profile retrieval failed: {result}")
            return False
        
        # Test venue owner profile
        result = self.make_request("GET", "/auth/profile", auth_required=True, token=self.venue_owner_token)
        if result["success"]:
            print("✅ Venue owner profile retrieval successful")
            profile = result['data']
            print(f"   Name: {profile.get('name')}")
            print(f"   Business: {profile.get('business_name')}")
            print(f"   GST: {profile.get('gst_number')}")
            print(f"   Total Venues: {profile.get('total_venues')}")
        else:
            print(f"❌ Venue owner profile retrieval failed: {result}")
            return False
        
        # Test without token
        result = self.make_request("GET", "/auth/profile", auth_required=False)
        if not result["success"] and result["status_code"] in [401, 403]:
            print("✅ Profile access without token properly rejected")
        else:
            print(f"❌ Profile access without token not handled properly: {result}")
            return False
        
        # Test with invalid token
        result = self.make_request("GET", "/auth/profile", auth_required=True, token="invalid_token")
        if not result["success"] and result["status_code"] in [401, 403]:
            print("✅ Profile access with invalid token properly rejected")
        else:
            print(f"❌ Profile access with invalid token not handled properly: {result}")
            return False
        
        return True

    def test_venue_owner_routes(self):
        """Test Venue Owner Specific Routes"""
        print("\n=== Testing Venue Owner Routes ===")
        
        # Test venue creation by player (should fail)
        print("\n--- Testing Role-Based Access Control ---")
        result = self.make_request("POST", "/venue-owner/venues", self.test_venue_data, 
                                 auth_required=True, token=self.player_token)
        if not result["success"] and result["status_code"] == 403:
            print("✅ Venue creation by player properly rejected")
        else:
            print(f"❌ Venue creation by player not handled properly: {result}")
            return False
        
        # Test venue creation by venue owner
        print("\n--- Testing Venue Creation by Venue Owner ---")
        result = self.make_request("POST", "/venue-owner/venues", self.test_venue_data,
                                 auth_required=True, token=self.venue_owner_token)
        if result["success"]:
            print("✅ Venue creation by venue owner successful")
            self.test_venue_id = result['data'].get('venue_id')
            print(f"   Venue ID: {self.test_venue_id}")
            print(f"   Message: {result['data'].get('message')}")
        else:
            print(f"❌ Venue creation by venue owner failed: {result}")
            return False
        
        # Test venue listing for venue owner
        print("\n--- Testing Venue Owner Venue Listing ---")
        result = self.make_request("GET", "/venue-owner/venues", 
                                 auth_required=True, token=self.venue_owner_token)
        if result["success"]:
            venues = result['data']
            print(f"✅ Venue owner venue listing successful ({len(venues)} venues)")
            if venues:
                venue = venues[0]
                print(f"   Venue: {venue.get('name')}")
                print(f"   Sports: {venue.get('sports_supported')}")
                print(f"   City: {venue.get('city')}")
                print(f"   Slots: {len(venue.get('slots', []))}")
        else:
            print(f"❌ Venue owner venue listing failed: {result}")
            return False
        
        # Test venue owner analytics
        print("\n--- Testing Venue Owner Analytics ---")
        result = self.make_request("GET", "/venue-owner/analytics/dashboard",
                                 auth_required=True, token=self.venue_owner_token)
        if result["success"]:
            analytics = result['data']
            print("✅ Venue owner analytics retrieval successful")
            print(f"   Total Venues: {analytics.get('total_venues')}")
            print(f"   Total Bookings: {analytics.get('total_bookings')}")
            print(f"   Total Revenue: ₹{analytics.get('total_revenue')}")
            print(f"   Occupancy Rate: {analytics.get('occupancy_rate')}%")
        else:
            print(f"❌ Venue owner analytics retrieval failed: {result}")
            return False
        
        return True

    def test_error_scenarios(self):
        """Test Various Error Scenarios"""
        print("\n=== Testing Error Scenarios ===")
        
        # Test expired OTP (simulate by using old OTP)
        print("\n--- Testing Error Handling ---")
        
        # Test invalid JSON
        try:
            url = f"{self.base_url}/auth/send-otp"
            response = requests.post(url, headers=self.headers, data="invalid json", timeout=30)
            if response.status_code == 422:
                print("✅ Invalid JSON properly handled")
            else:
                print(f"❌ Invalid JSON not handled properly: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Error testing invalid JSON: {e}")
            return False
        
        # Test missing required fields
        result = self.make_request("POST", "/auth/register", {"mobile": self.test_player_mobile})
        if not result["success"] and result["status_code"] == 422:
            print("✅ Missing required fields properly handled")
        else:
            print(f"❌ Missing required fields not handled properly: {result}")
            return False
        
        return True

    def run_all_tests(self):
        """Run all test suites for unified authentication"""
        print("🚀 Starting Unified Authentication System Tests")
        print(f"Testing against: {self.base_url}")
        print("="*60)
        
        test_results = []
        
        # Run test suites in order
        test_suites = [
            ("Send OTP API", self.test_send_otp_validation),
            ("Verify OTP API", self.test_verify_otp_api),
            ("User Registration", self.test_user_registration),
            ("User Login", self.test_user_login),
            ("Protected Routes", self.test_protected_routes),
            ("Venue Owner Routes", self.test_venue_owner_routes),
            ("Error Scenarios", self.test_error_scenarios)
        ]
        
        for suite_name, test_func in test_suites:
            try:
                print(f"\n{'='*60}")
                result = test_func()
                test_results.append((suite_name, result))
                if not result:
                    print(f"\n⚠️  {suite_name} test suite failed!")
                else:
                    print(f"\n✅ {suite_name} test suite passed!")
            except Exception as e:
                print(f"\n💥 {suite_name} test suite crashed: {str(e)}")
                test_results.append((suite_name, False))
        
        # Print summary
        print("\n" + "="*60)
        print("🏁 UNIFIED AUTH TEST SUMMARY")
        print("="*60)
        
        passed = sum(1 for _, result in test_results if result)
        total = len(test_results)
        
        for suite_name, result in test_results:
            status = "✅ PASS" if result else "❌ FAIL"
            print(f"{status} {suite_name}")
        
        print(f"\nOverall: {passed}/{total} test suites passed")
        
        if passed == total:
            print("🎉 All unified authentication tests passed!")
            print("✅ Mobile OTP verification working correctly")
            print("✅ User registration (player & venue owner) working")
            print("✅ JWT token authentication working")
            print("✅ Role-based access control working")
            print("✅ Protected routes secured properly")
            print("✅ Venue owner specific routes working")
            return True
        else:
            print("⚠️  Some tests failed. Please check the issues above.")
            return False

def main():
    """Main test execution"""
    tester = UnifiedAuthTester()
    success = tester.run_all_tests()
    return success

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)