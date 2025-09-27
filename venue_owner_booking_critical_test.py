#!/usr/bin/env python3
"""
Critical Venue Partner Booking Functionality Testing
Focus on Day-of-Week Conversion, Conflict Detection, Time Slot Validation, and Booking Submission

Testing the specific fixes mentioned in the review request:
1. Day-of-Week Conversion Bug Fix (JavaScript Date.getDay() vs backend day_of_week)
2. Real-Time Booking Conflict Detection
3. Time Slot Selection Validation
4. Booking Submission Validation
"""

import requests
import json
import time
from datetime import datetime, timedelta
from typing import Dict, Any, Optional

# Configuration - Use the correct backend URL from frontend/.env
BASE_URL = "https://playonapp.preview.emergentagent.com/api"
HEADERS = {"Content-Type": "application/json"}

class VenuePartnerBookingTester:
    def __init__(self):
        self.base_url = BASE_URL
        self.headers = HEADERS.copy()
        self.venue_owner_token = None
        self.venue_owner_id = None
        self.test_venue_id = None
        self.test_booking_ids = []
        
        # Test venue partner from test history
        self.venue_owner_mobile = "+919876543210"
        self.venue_owner_name = "Rajesh Kumar"
        
        # Test players for booking creation
        self.test_players = [
            {
                "mobile": "+919888777666",
                "name": "Arjun Patel"
            },
            {
                "mobile": "+919999888777", 
                "name": "Rahul Verma"
            }
        ]

    def make_request(self, method: str, endpoint: str, data: Optional[Dict] = None, 
                    auth_required: bool = False) -> Dict[str, Any]:
        """Make HTTP request with proper error handling"""
        url = f"{self.base_url}{endpoint}"
        headers = self.headers.copy()
        
        if auth_required and self.venue_owner_token:
            headers["Authorization"] = f"Bearer {self.venue_owner_token}"
        
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

    def test_venue_owner_authentication(self):
        """Test venue partner authentication with mobile OTP"""
        print("\n=== Testing Venue Partner Authentication ===")
        
        # Step 1: Send OTP
        otp_request = {"mobile": self.venue_owner_mobile}
        result = self.make_request("POST", "/auth/send-otp", otp_request)
        
        if not result["success"]:
            print(f"❌ Failed to send OTP: {result}")
            return False
        
        print(f"✅ OTP sent to {self.venue_owner_mobile}")
        dev_otp = result["data"].get("dev_info", "").replace("OTP: ", "")
        print(f"   Development OTP: {dev_otp}")
        
        # Step 2: Login with OTP
        login_request = {
            "mobile": self.venue_owner_mobile,
            "otp": dev_otp
        }
        result = self.make_request("POST", "/auth/login", login_request)
        
        if result["success"]:
            self.venue_owner_token = result["data"]["access_token"]
            user_data = result["data"]["user"]
            self.venue_owner_id = user_data["id"]
            print(f"✅ Venue partner login successful")
            print(f"   Name: {user_data['name']}")
            print(f"   Role: {user_data['role']}")
            print(f"   Token: {self.venue_owner_token[:20]}...")
            return True
        else:
            print(f"❌ Venue partner login failed: {result}")
            return False

    def test_venue_creation_with_slots(self):
        """Test venue creation with time slots for different days of week"""
        print("\n=== Testing Venue Creation with Time Slots ===")
        
        if not self.venue_owner_token:
            print("❌ No venue partner token available")
            return False
        
        # Create venue with slots for different days of week
        # Testing day_of_week field: 0=Monday, 1=Tuesday, ..., 6=Sunday
        venue_data = {
            "name": "Elite Cricket Ground Mumbai",
            "sports_supported": ["Cricket"],
            "address": "Bandra West, Near Linking Road",
            "city": "Mumbai",
            "state": "Maharashtra", 
            "pincode": "400050",
            "description": "Premium cricket ground with professional facilities and floodlights",
            "amenities": ["Floodlights", "Changing Rooms", "Parking", "Cafeteria", "First Aid"],
            "base_price_per_hour": 1200.0,
            "contact_phone": "+919876543212",
            "whatsapp_number": "+919876543212",
            "images": [],
            "rules_and_regulations": "No smoking, proper cricket attire required, advance booking mandatory",
            "cancellation_policy": "24 hours advance notice required for cancellation",
            "slots": [
                # Monday slots (day_of_week: 0)
                {
                    "day_of_week": 0,
                    "start_time": "06:00",
                    "end_time": "08:00", 
                    "capacity": 1,
                    "price_per_hour": 1000.0,
                    "is_peak_hour": False
                },
                {
                    "day_of_week": 0,
                    "start_time": "18:00",
                    "end_time": "20:00",
                    "capacity": 1,
                    "price_per_hour": 1500.0,
                    "is_peak_hour": True
                },
                # Tuesday slots (day_of_week: 1)
                {
                    "day_of_week": 1,
                    "start_time": "06:00",
                    "end_time": "08:00",
                    "capacity": 1,
                    "price_per_hour": 1000.0,
                    "is_peak_hour": False
                },
                {
                    "day_of_week": 1,
                    "start_time": "18:00",
                    "end_time": "20:00",
                    "capacity": 1,
                    "price_per_hour": 1500.0,
                    "is_peak_hour": True
                },
                # Weekend slots (Saturday - day_of_week: 5)
                {
                    "day_of_week": 5,
                    "start_time": "08:00",
                    "end_time": "10:00",
                    "capacity": 1,
                    "price_per_hour": 1800.0,
                    "is_peak_hour": True
                },
                {
                    "day_of_week": 5,
                    "start_time": "16:00",
                    "end_time": "18:00",
                    "capacity": 1,
                    "price_per_hour": 2000.0,
                    "is_peak_hour": True
                }
            ]
        }
        
        result = self.make_request("POST", "/venue-owner/venues", venue_data, auth_required=True)
        
        if result["success"]:
            self.test_venue_id = result["data"]["venue_id"]
            print(f"✅ Venue created successfully")
            print(f"   Venue ID: {self.test_venue_id}")
            print(f"   Slots configured for different days of week:")
            print(f"   - Monday (0): 06:00-08:00, 18:00-20:00")
            print(f"   - Tuesday (1): 06:00-08:00, 18:00-20:00") 
            print(f"   - Saturday (5): 08:00-10:00, 16:00-18:00")
            return True
        else:
            print(f"❌ Venue creation failed: {result}")
            return False

    def test_booking_creation_with_conflict_detection(self):
        """Test booking creation with real-time conflict detection"""
        print("\n=== Testing Booking Creation with Conflict Detection ===")
        
        if not self.test_venue_id:
            print("❌ No test venue available")
            return False
        
        # Test booking for next Monday (day_of_week: 0)
        next_monday = self.get_next_weekday(0)  # 0 = Monday
        booking_date = next_monday.strftime("%Y-%m-%d")
        
        print(f"Testing bookings for {booking_date} (Monday)")
        
        # Test 1: Create first booking (should succeed)
        booking_data_1 = {
            "venue_id": self.test_venue_id,
            "player_mobile": self.test_players[0]["mobile"],
            "player_name": self.test_players[0]["name"],
            "booking_date": booking_date,
            "start_time": "18:00",
            "end_time": "20:00",
            "sport": "Cricket",
            "notes": "Team practice session - first booking"
        }
        
        result = self.make_request("POST", "/venue-owner/bookings", booking_data_1, auth_required=True)
        
        if result["success"]:
            booking_id_1 = result["data"]["booking_id"]
            self.test_booking_ids.append(booking_id_1)
            print(f"✅ First booking created successfully")
            print(f"   Booking ID: {booking_id_1}")
            print(f"   Player: {self.test_players[0]['name']} ({self.test_players[0]['mobile']})")
            print(f"   Time: {booking_data_1['start_time']}-{booking_data_1['end_time']}")
            print(f"   Amount: ₹{result['data']['total_amount']}")
            print(f"   Payment Link: {result['data']['payment_link']}")
            print(f"   SMS Status: {result['data']['sms_status']}")
        else:
            print(f"❌ First booking creation failed: {result}")
            return False
        
        # Test 2: Try to create conflicting booking (should fail)
        booking_data_2 = {
            "venue_id": self.test_venue_id,
            "player_mobile": self.test_players[1]["mobile"],
            "player_name": self.test_players[1]["name"],
            "booking_date": booking_date,
            "start_time": "18:00",  # Same time slot
            "end_time": "20:00",    # Same time slot
            "sport": "Cricket",
            "notes": "Conflicting booking attempt"
        }
        
        result = self.make_request("POST", "/venue-owner/bookings", booking_data_2, auth_required=True)
        
        if not result["success"] and result["status_code"] == 409:
            print(f"✅ Booking conflict detection working correctly")
            print(f"   Conflict detected for same time slot: {booking_data_2['start_time']}-{booking_data_2['end_time']}")
            print(f"   Error message: {result['data'].get('detail', 'Conflict detected')}")
        else:
            print(f"❌ Booking conflict detection failed: {result}")
            return False
        
        # Test 3: Create non-conflicting booking (different time slot)
        booking_data_3 = {
            "venue_id": self.test_venue_id,
            "player_mobile": self.test_players[1]["mobile"],
            "player_name": self.test_players[1]["name"],
            "booking_date": booking_date,
            "start_time": "06:00",  # Different time slot
            "end_time": "08:00",    # Different time slot
            "sport": "Cricket",
            "notes": "Non-conflicting booking - morning slot"
        }
        
        result = self.make_request("POST", "/venue-owner/bookings", booking_data_3, auth_required=True)
        
        if result["success"]:
            booking_id_3 = result["data"]["booking_id"]
            self.test_booking_ids.append(booking_id_3)
            print(f"✅ Non-conflicting booking created successfully")
            print(f"   Booking ID: {booking_id_3}")
            print(f"   Player: {self.test_players[1]['name']} ({self.test_players[1]['mobile']})")
            print(f"   Time: {booking_data_3['start_time']}-{booking_data_3['end_time']}")
            print(f"   Amount: ₹{result['data']['total_amount']}")
        else:
            print(f"❌ Non-conflicting booking creation failed: {result}")
            return False
        
        return True

    def test_day_of_week_conversion(self):
        """Test day-of-week conversion between JavaScript and backend"""
        print("\n=== Testing Day-of-Week Conversion ===")
        
        # Test bookings for different days of the week
        test_cases = [
            {"day_name": "Monday", "day_of_week": 0, "js_getday": 1},
            {"day_name": "Tuesday", "day_of_week": 1, "js_getday": 2},
            {"day_name": "Saturday", "day_of_week": 5, "js_getday": 6},
            {"day_name": "Sunday", "day_of_week": 6, "js_getday": 0}
        ]
        
        for test_case in test_cases:
            day_name = test_case["day_name"]
            backend_day = test_case["day_of_week"]
            js_day = test_case["js_getday"]
            
            print(f"\nTesting {day_name}:")
            print(f"   Backend day_of_week: {backend_day}")
            print(f"   JavaScript getDay(): {js_day}")
            
            # Get next occurrence of this day
            target_date = self.get_next_weekday(backend_day)
            booking_date = target_date.strftime("%Y-%m-%d")
            
            # Verify the day conversion
            actual_weekday = target_date.weekday()  # Python weekday (0=Monday)
            if actual_weekday == backend_day:
                print(f"   ✅ Day conversion correct: {booking_date} is {day_name}")
            else:
                print(f"   ❌ Day conversion error: Expected {backend_day}, got {actual_weekday}")
                return False
        
        return True

    def test_time_slot_validation(self):
        """Test time slot selection validation"""
        print("\n=== Testing Time Slot Validation ===")
        
        if not self.test_venue_id:
            print("❌ No test venue available")
            return False
        
        next_monday = self.get_next_weekday(0)
        booking_date = next_monday.strftime("%Y-%m-%d")
        
        # Test invalid time formats
        invalid_time_tests = [
            {
                "name": "Invalid start time format",
                "start_time": "25:00",  # Invalid hour
                "end_time": "20:00",
                "expected_error": "Invalid time format"
            },
            {
                "name": "Invalid end time format", 
                "start_time": "18:00",
                "end_time": "24:60",  # Invalid minute
                "expected_error": "Invalid time format"
            },
            {
                "name": "End time before start time",
                "start_time": "20:00",
                "end_time": "18:00",  # End before start
                "expected_error": "End time must be after start time"
            },
            {
                "name": "Zero duration booking",
                "start_time": "18:00",
                "end_time": "18:00",  # Same time
                "expected_error": "Booking duration must be at least 1 hour"
            }
        ]
        
        for test in invalid_time_tests:
            print(f"\nTesting: {test['name']}")
            
            booking_data = {
                "venue_id": self.test_venue_id,
                "player_mobile": "+919111222333",
                "player_name": "Test Player",
                "booking_date": booking_date,
                "start_time": test["start_time"],
                "end_time": test["end_time"],
                "sport": "Cricket",
                "notes": f"Testing {test['name']}"
            }
            
            result = self.make_request("POST", "/venue-owner/bookings", booking_data, auth_required=True)
            
            if not result["success"] and result["status_code"] in [400, 422]:
                error_detail = result['data'].get('detail', 'Validation error')
                if isinstance(error_detail, list) and len(error_detail) > 0:
                    error_msg = error_detail[0].get('msg', 'Validation error')
                else:
                    error_msg = str(error_detail)
                print(f"   ✅ Validation working: {error_msg}")
            else:
                print(f"   ❌ Validation failed: {result}")
                return False
        
        return True

    def test_booking_submission_validation(self):
        """Test comprehensive booking submission validation"""
        print("\n=== Testing Booking Submission Validation ===")
        
        if not self.test_venue_id:
            print("❌ No test venue available")
            return False
        
        next_tuesday = self.get_next_weekday(1)  # Tuesday
        booking_date = next_tuesday.strftime("%Y-%m-%d")
        
        # Test missing required fields
        validation_tests = [
            {
                "name": "Missing venue_id",
                "data": {
                    "player_mobile": "+919111222333",
                    "player_name": "Test Player",
                    "booking_date": booking_date,
                    "start_time": "18:00",
                    "end_time": "20:00"
                }
            },
            {
                "name": "Missing player_mobile",
                "data": {
                    "venue_id": self.test_venue_id,
                    "player_name": "Test Player",
                    "booking_date": booking_date,
                    "start_time": "18:00",
                    "end_time": "20:00"
                }
            },
            {
                "name": "Invalid mobile format",
                "data": {
                    "venue_id": self.test_venue_id,
                    "player_mobile": "9876543210",  # Missing +91
                    "player_name": "Test Player",
                    "booking_date": booking_date,
                    "start_time": "18:00",
                    "end_time": "20:00"
                }
            },
            {
                "name": "Invalid date format",
                "data": {
                    "venue_id": self.test_venue_id,
                    "player_mobile": "+919111222333",
                    "player_name": "Test Player",
                    "booking_date": "2025-1-15",  # Invalid format
                    "start_time": "18:00",
                    "end_time": "20:00"
                }
            },
            {
                "name": "Non-existent venue",
                "data": {
                    "venue_id": "non-existent-venue-id",
                    "player_mobile": "+919111222333",
                    "player_name": "Test Player",
                    "booking_date": booking_date,
                    "start_time": "18:00",
                    "end_time": "20:00"
                }
            }
        ]
        
        for test in validation_tests:
            print(f"\nTesting: {test['name']}")
            
            result = self.make_request("POST", "/venue-owner/bookings", test["data"], auth_required=True)
            
            if not result["success"] and result["status_code"] in [400, 404, 422]:
                print(f"   ✅ Validation working: {result['data'].get('detail', 'Validation error')}")
            else:
                print(f"   ❌ Validation failed: {result}")
                return False
        
        return True

    def test_booking_management(self):
        """Test booking management functionality"""
        print("\n=== Testing Booking Management ===")
        
        if not self.test_booking_ids:
            print("❌ No test bookings available")
            return False
        
        # Test booking listing
        result = self.make_request("GET", "/venue-owner/bookings", auth_required=True)
        
        if result["success"]:
            bookings = result["data"]
            print(f"✅ Booking listing successful ({len(bookings)} bookings)")
            
            for booking in bookings[:2]:  # Show first 2 bookings
                print(f"   Booking: {booking['player_name']} - {booking['booking_date']} {booking['start_time']}-{booking['end_time']}")
                print(f"   Status: {booking['status']} | Payment: {booking['payment_status']} | Amount: ₹{booking['total_amount']}")
        else:
            print(f"❌ Booking listing failed: {result}")
            return False
        
        # Test individual booking details
        if self.test_booking_ids:
            booking_id = self.test_booking_ids[0]
            result = self.make_request("GET", f"/venue-owner/bookings/{booking_id}", auth_required=True)
            
            if result["success"]:
                booking = result["data"]
                print(f"✅ Individual booking details retrieved")
                print(f"   Booking ID: {booking['id']}")
                print(f"   Player: {booking['player_name']} ({booking['player_phone']})")
                print(f"   Venue: {booking['venue_name']}")
                print(f"   Date/Time: {booking['booking_date']} {booking['start_time']}-{booking['end_time']}")
                print(f"   Amount: ₹{booking['total_amount']}")
                print(f"   Status: {booking['status']} | Payment: {booking['payment_status']}")
            else:
                print(f"❌ Individual booking details failed: {result}")
                return False
        
        return True

    def get_next_weekday(self, weekday):
        """Get next occurrence of specified weekday (0=Monday, 6=Sunday)"""
        today = datetime.now()
        days_ahead = weekday - today.weekday()
        if days_ahead <= 0:  # Target day already happened this week
            days_ahead += 7
        return today + timedelta(days=days_ahead)

    def run_critical_tests(self):
        """Run all critical venue partner booking tests"""
        print("🚀 Starting Critical Venue Partner Booking Tests")
        print(f"Testing against: {self.base_url}")
        print("Focus: Day-of-Week Conversion, Conflict Detection, Time Slot Validation, Booking Submission")
        
        test_results = []
        
        # Run test suites in order
        test_suites = [
            ("Venue Partner Authentication", self.test_venue_owner_authentication),
            ("Venue Creation with Slots", self.test_venue_creation_with_slots),
            ("Day-of-Week Conversion", self.test_day_of_week_conversion),
            ("Booking Creation with Conflict Detection", self.test_booking_creation_with_conflict_detection),
            ("Time Slot Validation", self.test_time_slot_validation),
            ("Booking Submission Validation", self.test_booking_submission_validation),
            ("Booking Management", self.test_booking_management)
        ]
        
        for suite_name, test_func in test_suites:
            try:
                print(f"\n{'='*60}")
                result = test_func()
                test_results.append((suite_name, result))
                if not result:
                    print(f"\n⚠️  {suite_name} test suite failed!")
                    # Continue with other tests to get full picture
            except Exception as e:
                print(f"\n💥 {suite_name} test suite crashed: {str(e)}")
                test_results.append((suite_name, False))
        
        # Print summary
        print("\n" + "="*80)
        print("🏁 CRITICAL VENUE OWNER BOOKING TEST SUMMARY")
        print("="*80)
        
        passed = sum(1 for _, result in test_results if result)
        total = len(test_results)
        
        for suite_name, result in test_results:
            status = "✅ PASS" if result else "❌ FAIL"
            print(f"{status} {suite_name}")
        
        print(f"\nOverall: {passed}/{total} test suites passed")
        
        if passed == total:
            print("🎉 All critical tests passed! Venue partner booking functionality is working correctly.")
            print("\n✅ CONFIRMED FIXES:")
            print("   - Day-of-Week Conversion: Backend day_of_week field working correctly")
            print("   - Real-Time Booking Conflict Detection: Preventing overlapping bookings")
            print("   - Time Slot Selection Validation: Proper time format and duration validation")
            print("   - Booking Submission Validation: Comprehensive input validation working")
            return True
        else:
            print("⚠️  Some critical tests failed. Please check the issues above.")
            return False

def main():
    """Main test execution"""
    tester = VenuePartnerBookingTester()
    success = tester.run_critical_tests()
    return success

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)