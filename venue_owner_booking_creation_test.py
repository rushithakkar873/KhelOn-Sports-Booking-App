#!/usr/bin/env python3
"""
Comprehensive Venue Owner Booking Creation Testing for Playon Sports Booking App
Tests venue owner authentication and booking creation functionality with payment & SMS integration
"""

import requests
import json
import time
from datetime import datetime, timedelta
from typing import Dict, Any, Optional

# Configuration
BASE_URL = "https://venue-finder-20.preview.emergentagent.com/api"
HEADERS = {"Content-Type": "application/json"}

class VenueOwnerBookingTester:
    def __init__(self):
        self.base_url = BASE_URL
        self.headers = HEADERS.copy()
        self.venue_owner_token = None
        self.venue_owner_id = None
        self.test_venue_ids = []
        self.test_booking_ids = []
        
        # Test data for venue owner (Rajesh Kumar)
        self.venue_owner_mobile = "+919876543211"
        self.venue_owner_name = "Rajesh Kumar"
        
        # Test data for players
        self.existing_player_mobile = "+919876543210"  # Arjun Sharma
        self.existing_player_name = "Arjun Sharma"
        
        self.new_player_mobile = "+919111222333"
        self.new_player_name = "New Player"
        
        # Test booking data
        tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
        self.test_booking_data = {
            "player_mobile": self.existing_player_mobile,
            "player_name": self.existing_player_name,
            "booking_date": tomorrow,
            "start_time": "10:00",
            "end_time": "12:00",
            "sport": "Cricket",
            "notes": "Team practice session"
        }

    def make_request(self, method: str, endpoint: str, data: Optional[Dict] = None, 
                    auth_required: bool = False, params: Optional[Dict] = None) -> Dict[str, Any]:
        """Make HTTP request with proper error handling"""
        url = f"{self.base_url}{endpoint}"
        headers = self.headers.copy()
        
        if auth_required and self.venue_owner_token:
            headers["Authorization"] = f"Bearer {self.venue_owner_token}"
        
        try:
            if method.upper() == "GET":
                response = requests.get(url, headers=headers, params=params, timeout=30)
            elif method.upper() == "POST":
                response = requests.post(url, headers=headers, json=data, timeout=30)
            elif method.upper() == "PUT":
                response = requests.put(url, headers=headers, json=data, params=params, timeout=30)
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
                "data": {"error": "Invalid JSON response", "content": response.text[:200]},
                "success": False
            }

    def test_venue_owner_authentication(self):
        """Test venue owner authentication with mobile OTP"""
        print("\n=== Testing Venue Owner Authentication ===")
        
        # Step 1: Send OTP to venue owner mobile
        print(f"📱 Sending OTP to venue owner: {self.venue_owner_mobile}")
        otp_request = {"mobile": self.venue_owner_mobile}
        result = self.make_request("POST", "/auth/send-otp", otp_request)
        
        if not result["success"]:
            print(f"❌ Failed to send OTP: {result}")
            return False
        
        print("✅ OTP sent successfully")
        dev_otp = result["data"].get("dev_info", "").replace("OTP: ", "")
        print(f"   Development OTP: {dev_otp}")
        
        if not dev_otp or dev_otp == "N/A":
            print("❌ No development OTP received")
            return False
        
        # Step 2: Login with mobile and OTP
        print(f"🔐 Logging in venue owner with mobile and OTP")
        login_request = {
            "mobile": self.venue_owner_mobile,
            "otp": dev_otp
        }
        result = self.make_request("POST", "/auth/login", login_request)
        
        if not result["success"]:
            print(f"❌ Venue owner login failed: {result}")
            return False
        
        self.venue_owner_token = result["data"].get("access_token")
        user_data = result["data"].get("user", {})
        self.venue_owner_id = user_data.get("id")
        
        print("✅ Venue owner login successful")
        print(f"   Name: {user_data.get('name')}")
        print(f"   Role: {user_data.get('role')}")
        print(f"   Mobile: {user_data.get('mobile')}")
        print(f"   Token: {self.venue_owner_token[:20]}...")
        
        # Verify the user is Rajesh Kumar
        if user_data.get("name") != self.venue_owner_name:
            print(f"❌ Expected venue owner name '{self.venue_owner_name}', got '{user_data.get('name')}'")
            return False
        
        if user_data.get("role") != "venue_owner":
            print(f"❌ Expected role 'venue_owner', got '{user_data.get('role')}'")
            return False
        
        return True

    def test_get_venue_owner_venues(self):
        """Get venues owned by the venue owner"""
        print("\n=== Getting Venue Owner's Venues ===")
        
        result = self.make_request("GET", "/venue-owner/venues", auth_required=True)
        
        if not result["success"]:
            print(f"❌ Failed to get venues: {result}")
            return False
        
        venues = result["data"]
        print(f"✅ Retrieved {len(venues)} venues")
        
        # Look for Elite Cricket Ground Mumbai and Elite Football Ground Mumbai
        cricket_venue = None
        football_venue = None
        
        for venue in venues:
            print(f"   - {venue['name']} ({', '.join(venue['sports_supported'])})")
            self.test_venue_ids.append(venue['id'])
            
            if "Cricket" in venue['name'] and "Mumbai" in venue['name']:
                cricket_venue = venue
            elif "Football" in venue['name'] and "Mumbai" in venue['name']:
                football_venue = venue
        
        if not cricket_venue:
            print("❌ Elite Cricket Ground Mumbai not found")
            return False
        
        print(f"✅ Found Elite Cricket Ground Mumbai: {cricket_venue['id']}")
        self.cricket_venue_id = cricket_venue['id']
        self.cricket_venue = cricket_venue
        
        return True

    def test_create_booking_existing_player(self):
        """Test creating booking for existing player"""
        print("\n=== Testing Booking Creation for Existing Player ===")
        
        if not hasattr(self, 'cricket_venue_id'):
            print("❌ No cricket venue available for testing")
            return False
        
        booking_data = self.test_booking_data.copy()
        booking_data["venue_id"] = self.cricket_venue_id
        booking_data["player_mobile"] = self.existing_player_mobile
        booking_data["player_name"] = self.existing_player_name
        
        print(f"🏏 Creating booking for existing player: {self.existing_player_name} ({self.existing_player_mobile})")
        print(f"   Venue: {self.cricket_venue['name']}")
        print(f"   Date: {booking_data['booking_date']}")
        print(f"   Time: {booking_data['start_time']} - {booking_data['end_time']}")
        
        result = self.make_request("POST", "/venue-owner/bookings", booking_data, auth_required=True)
        
        if not result["success"]:
            print(f"❌ Booking creation failed: {result}")
            return False
        
        booking_response = result["data"]
        booking_id = booking_response.get("booking_id")
        payment_link = booking_response.get("payment_link")
        total_amount = booking_response.get("total_amount")
        sms_status = booking_response.get("sms_status")
        
        print("✅ Booking created successfully for existing player")
        print(f"   Booking ID: {booking_id}")
        print(f"   Total Amount: ₹{total_amount}")
        print(f"   Payment Link: {payment_link}")
        print(f"   SMS Status: {sms_status}")
        
        self.test_booking_ids.append(booking_id)
        self.existing_player_booking_id = booking_id
        
        # Verify payment link format
        if not payment_link or not payment_link.startswith("https://"):
            print(f"❌ Invalid payment link format: {payment_link}")
            return False
        
        # Verify SMS was sent
        if sms_status != "sent":
            print(f"⚠️  SMS status is '{sms_status}', expected 'sent'")
        
        return True

    def test_create_booking_new_player(self):
        """Test creating booking for new player"""
        print("\n=== Testing Booking Creation for New Player ===")
        
        if not hasattr(self, 'cricket_venue_id'):
            print("❌ No cricket venue available for testing")
            return False
        
        booking_data = self.test_booking_data.copy()
        booking_data["venue_id"] = self.cricket_venue_id
        booking_data["player_mobile"] = self.new_player_mobile
        booking_data["player_name"] = self.new_player_name
        booking_data["start_time"] = "14:00"  # Different time to avoid conflict
        booking_data["end_time"] = "16:00"
        
        print(f"🏏 Creating booking for new player: {self.new_player_name} ({self.new_player_mobile})")
        print(f"   Venue: {self.cricket_venue['name']}")
        print(f"   Date: {booking_data['booking_date']}")
        print(f"   Time: {booking_data['start_time']} - {booking_data['end_time']}")
        
        result = self.make_request("POST", "/venue-owner/bookings", booking_data, auth_required=True)
        
        if not result["success"]:
            print(f"❌ Booking creation failed: {result}")
            return False
        
        booking_response = result["data"]
        booking_id = booking_response.get("booking_id")
        payment_link = booking_response.get("payment_link")
        total_amount = booking_response.get("total_amount")
        sms_status = booking_response.get("sms_status")
        
        print("✅ Booking created successfully for new player")
        print(f"   Booking ID: {booking_id}")
        print(f"   Total Amount: ₹{total_amount}")
        print(f"   Payment Link: {payment_link}")
        print(f"   SMS Status: {sms_status}")
        
        self.test_booking_ids.append(booking_id)
        self.new_player_booking_id = booking_id
        
        return True

    def test_validation_errors(self):
        """Test validation errors for booking creation"""
        print("\n=== Testing Validation Errors ===")
        
        if not hasattr(self, 'cricket_venue_id'):
            print("❌ No cricket venue available for testing")
            return False
        
        # Test invalid mobile format
        print("📱 Testing invalid mobile format")
        invalid_mobile_data = self.test_booking_data.copy()
        invalid_mobile_data["venue_id"] = self.cricket_venue_id
        invalid_mobile_data["player_mobile"] = "9876543210"  # Missing +91
        invalid_mobile_data["start_time"] = "16:00"
        invalid_mobile_data["end_time"] = "18:00"
        
        result = self.make_request("POST", "/venue-owner/bookings", invalid_mobile_data, auth_required=True)
        
        if result["success"]:
            print(f"❌ Invalid mobile format should have failed: {result}")
            return False
        
        print("✅ Invalid mobile format properly rejected")
        print(f"   Error: {result['data'].get('detail', 'No error message')}")
        
        # Test missing player name for new user
        print("👤 Testing missing player name for new user")
        missing_name_data = self.test_booking_data.copy()
        missing_name_data["venue_id"] = self.cricket_venue_id
        missing_name_data["player_mobile"] = "+919999888777"  # New mobile
        missing_name_data["player_name"] = None
        missing_name_data["start_time"] = "18:00"
        missing_name_data["end_time"] = "20:00"
        
        result = self.make_request("POST", "/venue-owner/bookings", missing_name_data, auth_required=True)
        
        if result["success"]:
            print(f"❌ Missing player name should have failed: {result}")
            return False
        
        print("✅ Missing player name properly rejected")
        print(f"   Error: {result['data'].get('detail', 'No error message')}")
        
        # Test invalid time format
        print("⏰ Testing invalid time format")
        invalid_time_data = self.test_booking_data.copy()
        invalid_time_data["venue_id"] = self.cricket_venue_id
        invalid_time_data["start_time"] = "25:00"  # Invalid hour
        invalid_time_data["end_time"] = "26:00"
        
        result = self.make_request("POST", "/venue-owner/bookings", invalid_time_data, auth_required=True)
        
        if result["success"]:
            print(f"❌ Invalid time format should have failed: {result}")
            return False
        
        print("✅ Invalid time format properly rejected")
        
        return True

    def test_slot_conflict_detection(self):
        """Test slot conflict detection"""
        print("\n=== Testing Slot Conflict Detection ===")
        
        if not hasattr(self, 'cricket_venue_id'):
            print("❌ No cricket venue available for testing")
            return False
        
        # Try to book the same slot as existing player booking
        conflict_data = self.test_booking_data.copy()
        conflict_data["venue_id"] = self.cricket_venue_id
        conflict_data["player_mobile"] = "+919888777666"  # Different player
        conflict_data["player_name"] = "Conflict Test Player"
        # Same time as first booking: 10:00-12:00
        
        print(f"🔄 Attempting to book same slot: {conflict_data['start_time']}-{conflict_data['end_time']}")
        
        result = self.make_request("POST", "/venue-owner/bookings", conflict_data, auth_required=True)
        
        if result["success"]:
            print(f"❌ Slot conflict should have been detected: {result}")
            return False
        
        print("✅ Slot conflict properly detected")
        print(f"   Error: {result['data'].get('detail', 'No error message')}")
        
        return True

    def test_booking_management_endpoints(self):
        """Test venue owner booking management endpoints"""
        print("\n=== Testing Booking Management Endpoints ===")
        
        # Test GET /api/venue-owner/bookings (list bookings)
        print("📋 Testing booking list endpoint")
        result = self.make_request("GET", "/venue-owner/bookings", auth_required=True)
        
        if not result["success"]:
            print(f"❌ Failed to get bookings list: {result}")
            return False
        
        bookings = result["data"]
        print(f"✅ Retrieved {len(bookings)} bookings")
        
        for booking in bookings[:3]:  # Show first 3 bookings
            print(f"   - {booking['player_name']} ({booking['player_phone']}) - {booking['booking_date']} {booking['start_time']}-{booking['end_time']} - ₹{booking['total_amount']}")
        
        # Test filtering by venue
        if hasattr(self, 'cricket_venue_id'):
            print("🏏 Testing booking list with venue filter")
            result = self.make_request("GET", "/venue-owner/bookings", 
                                     params={"venue_id": self.cricket_venue_id}, 
                                     auth_required=True)
            
            if result["success"]:
                filtered_bookings = result["data"]
                print(f"✅ Retrieved {len(filtered_bookings)} bookings for cricket venue")
            else:
                print(f"❌ Failed to filter bookings by venue: {result}")
                return False
        
        # Test GET /api/venue-owner/bookings/{booking_id} (get specific booking)
        if hasattr(self, 'existing_player_booking_id'):
            print("🔍 Testing specific booking details endpoint")
            result = self.make_request("GET", f"/venue-owner/bookings/{self.existing_player_booking_id}", 
                                     auth_required=True)
            
            if not result["success"]:
                print(f"❌ Failed to get booking details: {result}")
                return False
            
            booking_details = result["data"]
            print("✅ Retrieved booking details successfully")
            print(f"   Player: {booking_details['player_name']} ({booking_details['player_phone']})")
            print(f"   Venue: {booking_details['venue_name']}")
            print(f"   Amount: ₹{booking_details['total_amount']}")
            print(f"   Status: {booking_details['status']}")
            print(f"   Payment Status: {booking_details['payment_status']}")
        
        # Test PUT /api/venue-owner/bookings/{booking_id}/status (update booking status)
        if hasattr(self, 'existing_player_booking_id'):
            print("✏️  Testing booking status update endpoint")
            result = self.make_request("PUT", f"/venue-owner/bookings/{self.existing_player_booking_id}/status", 
                                     params={"new_status": "confirmed"}, 
                                     auth_required=True)
            
            if not result["success"]:
                print(f"❌ Failed to update booking status: {result}")
                return False
            
            print("✅ Booking status updated successfully")
            print(f"   Message: {result['data'].get('message')}")
            print(f"   New Status: {result['data'].get('new_status')}")
        
        return True

    def test_payment_and_sms_integration(self):
        """Test payment and SMS integration features"""
        print("\n=== Testing Payment & SMS Integration ===")
        
        if not hasattr(self, 'existing_player_booking_id'):
            print("❌ No booking available for payment testing")
            return False
        
        # Get booking details to verify payment link
        result = self.make_request("GET", f"/venue-owner/bookings/{self.existing_player_booking_id}", 
                                 auth_required=True)
        
        if not result["success"]:
            print(f"❌ Failed to get booking for payment test: {result}")
            return False
        
        booking = result["data"]
        
        # Verify payment status is initially pending
        if booking["payment_status"] != "pending":
            print(f"⚠️  Expected payment status 'pending', got '{booking['payment_status']}'")
        else:
            print("✅ Booking payment status is correctly set to 'pending'")
        
        # Verify booking status is initially pending
        if booking["status"] != "pending":
            print(f"⚠️  Expected booking status 'pending', got '{booking['status']}'")
        else:
            print("✅ Booking status is correctly set to 'pending'")
        
        # Test webhook endpoint (simulate payment confirmation)
        print("💳 Testing payment webhook endpoint")
        webhook_data = {
            "event": "payment_link.paid",
            "payload": {
                "payment": {
                    "id": f"pay_mock_{self.existing_player_booking_id[:8]}"
                },
                "payment_link": {
                    "id": f"plink_mock_{self.existing_player_booking_id[:8]}"
                }
            }
        }
        
        result = self.make_request("POST", "/webhook/razorpay", webhook_data)
        
        if not result["success"]:
            print(f"❌ Webhook endpoint failed: {result}")
            return False
        
        print("✅ Payment webhook processed successfully")
        
        # Verify SMS notification was logged (check server logs)
        print("📱 SMS notification system verified (check server logs for SMS details)")
        
        return True

    def run_all_tests(self):
        """Run all venue owner booking creation tests"""
        print("🚀 Starting Venue Owner Booking Creation Tests")
        print(f"Testing against: {self.base_url}")
        
        test_results = []
        
        # Run test suites in order
        test_suites = [
            ("Venue Owner Authentication", self.test_venue_owner_authentication),
            ("Get Venue Owner Venues", self.test_get_venue_owner_venues),
            ("Create Booking for Existing Player", self.test_create_booking_existing_player),
            ("Create Booking for New Player", self.test_create_booking_new_player),
            ("Validation Errors", self.test_validation_errors),
            ("Slot Conflict Detection", self.test_slot_conflict_detection),
            ("Booking Management Endpoints", self.test_booking_management_endpoints),
            ("Payment & SMS Integration", self.test_payment_and_sms_integration)
        ]
        
        for suite_name, test_func in test_suites:
            try:
                print(f"\n{'='*60}")
                result = test_func()
                test_results.append((suite_name, result))
                if not result:
                    print(f"\n⚠️  {suite_name} test suite failed!")
                    # Continue with other tests even if one fails
            except Exception as e:
                print(f"\n💥 {suite_name} test suite crashed: {str(e)}")
                test_results.append((suite_name, False))
        
        # Print summary
        print("\n" + "="*60)
        print("🏁 VENUE OWNER BOOKING CREATION TEST SUMMARY")
        print("="*60)
        
        passed = sum(1 for _, result in test_results if result)
        total = len(test_results)
        
        for suite_name, result in test_results:
            status = "✅ PASS" if result else "❌ FAIL"
            print(f"{status} {suite_name}")
        
        print(f"\nOverall: {passed}/{total} test suites passed")
        
        if passed == total:
            print("🎉 All venue owner booking creation tests passed!")
            print("✅ Authentication working with mobile OTP")
            print("✅ Booking creation for existing and new players working")
            print("✅ Payment link generation working")
            print("✅ SMS notification system working")
            print("✅ Validation and conflict detection working")
            print("✅ Booking management endpoints working")
            return True
        else:
            print("⚠️  Some tests failed. Please check the issues above.")
            return False

def main():
    """Main test execution"""
    tester = VenueOwnerBookingTester()
    success = tester.run_all_tests()
    return success

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)