#!/usr/bin/env python3
"""
Venue Owner API Endpoints Testing
Tests the specific venue owner endpoints that were just added to fix integration issues
"""

import requests
import json
import time
from datetime import datetime, timedelta
from typing import Dict, Any, Optional

# Configuration
BASE_URL = "https://playonapp.preview.emergentagent.com/api"
HEADERS = {"Content-Type": "application/json"}

class VenueOwnerAPITester:
    def __init__(self):
        self.base_url = BASE_URL
        self.headers = HEADERS.copy()
        self.venue_owner_token = None
        self.venue_owner_id = None
        self.test_venue_id = None
        self.test_booking_id = None
        
        # Test venue owner data
        self.test_venue_owner = {
            "mobile": "+919876543210",
            "name": "Rajesh Kumar",
            "email": "rajesh.kumar@example.com",
            "role": "venue_owner",
            "business_name": "Elite Sports Complex",
            "business_address": "Sector 15, Noida, Uttar Pradesh 201301",
            "gst_number": "24ABCDE1234F1Z5"
        }
        
        # Test venue data
        self.test_venue = {
            "name": "Elite Cricket Ground Mumbai",
            "sports_supported": ["Cricket"],
            "address": "Bandra West, Mumbai",
            "city": "Mumbai",
            "state": "Maharashtra",
            "pincode": "400050",
            "description": "Premium cricket ground with professional facilities",
            "amenities": ["Floodlights", "Changing Rooms", "Parking", "Cafeteria"],
            "base_price_per_hour": 1200.0,
            "contact_phone": "+919876543212",
            "whatsapp_number": "+919876543212",
            "images": [],
            "rules_and_regulations": "No smoking, proper cricket attire required",
            "cancellation_policy": "24 hours notice required",
            "slots": [
                {
                    "day_of_week": 0,  # Monday
                    "start_time": "06:00",
                    "end_time": "08:00",
                    "capacity": 1,
                    "price_per_hour": 1000.0,
                    "is_peak_hour": False
                },
                {
                    "day_of_week": 0,  # Monday
                    "start_time": "18:00",
                    "end_time": "20:00",
                    "capacity": 1,
                    "price_per_hour": 1500.0,
                    "is_peak_hour": True
                }
            ]
        }
        
        # Test booking data (will be created by a player)
        self.test_player = {
            "mobile": "+919876543211",
            "name": "Arjun Sharma",
            "email": "arjun.sharma@example.com",
            "role": "player",
            "sports_interests": ["Cricket"],
            "location": "Mumbai, Maharashtra"
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
                "data": {"error": "Invalid JSON response"},
                "success": False
            }

    def setup_venue_owner_auth(self):
        """Setup venue owner authentication using unified auth system"""
        print("\n=== Setting up Venue Owner Authentication ===")
        
        # Step 1: Send OTP
        otp_request = {"mobile": self.test_venue_owner["mobile"]}
        result = self.make_request("POST", "/auth/send-otp", otp_request)
        
        if not result["success"]:
            print(f"❌ Failed to send OTP: {result}")
            return False
        
        print(f"✅ OTP sent to {self.test_venue_owner['mobile']}")
        dev_otp = result["data"].get("dev_info", "").replace("OTP: ", "")
        print(f"   Development OTP: {dev_otp}")
        
        # Step 2: Register venue owner (includes OTP verification)
        registration_data = self.test_venue_owner.copy()
        registration_data["otp"] = dev_otp
        
        result = self.make_request("POST", "/auth/register", registration_data)
        
        if result["success"]:
            print("✅ Venue owner registration successful")
            self.venue_owner_token = result["data"].get("access_token")
            self.venue_owner_id = result["data"]["user"]["id"]
            print(f"   Venue Owner ID: {self.venue_owner_id}")
            print(f"   Token: {self.venue_owner_token[:20]}...")
            return True
        elif "already exists" in result["data"].get("detail", ""):
            print("ℹ️  Venue owner already exists, attempting login...")
            
            # Step 3: Login if user already exists
            # First send OTP for login
            result = self.make_request("POST", "/auth/send-otp", otp_request)
            if not result["success"]:
                print(f"❌ Failed to send login OTP: {result}")
                return False
            
            dev_otp = result["data"].get("dev_info", "").replace("OTP: ", "")
            
            # Login with OTP
            login_data = {
                "mobile": self.test_venue_owner["mobile"],
                "otp": dev_otp
            }
            result = self.make_request("POST", "/auth/login", login_data)
            
            if result["success"]:
                print("✅ Venue owner login successful")
                self.venue_owner_token = result["data"].get("access_token")
                self.venue_owner_id = result["data"]["user"]["id"]
                print(f"   Venue Owner ID: {self.venue_owner_id}")
                return True
            else:
                print(f"❌ Venue owner login failed: {result}")
                return False
        else:
            print(f"❌ Venue owner registration failed: {result}")
            return False

    def create_test_venue(self):
        """Create a test venue for testing"""
        print("\n=== Creating Test Venue ===")
        
        result = self.make_request("POST", "/venue-owner/venues", self.test_venue, auth_required=True)
        
        if result["success"]:
            print("✅ Test venue created successfully")
            self.test_venue_id = result["data"].get("venue_id")
            print(f"   Venue ID: {self.test_venue_id}")
            return True
        else:
            print(f"❌ Failed to create test venue: {result}")
            return False

    def create_test_booking(self):
        """Create a test booking by registering a player and making a booking"""
        print("\n=== Creating Test Booking ===")
        
        # Step 1: Register a player
        otp_request = {"mobile": self.test_player["mobile"]}
        result = self.make_request("POST", "/auth/send-otp", otp_request)
        
        if not result["success"]:
            print(f"❌ Failed to send player OTP: {result}")
            return False
        
        dev_otp = result["data"].get("dev_info", "").replace("OTP: ", "")
        
        # Register player
        registration_data = self.test_player.copy()
        registration_data["otp"] = dev_otp
        
        result = self.make_request("POST", "/auth/register", registration_data)
        
        player_token = None
        player_id = None
        if result["success"]:
            print("✅ Player registration successful")
            player_token = result["data"].get("access_token")
            player_id = result["data"]["user"]["id"]
        elif "already exists" in result["data"].get("detail", ""):
            print("ℹ️  Player already exists, attempting login...")
            
            # Login existing player
            result = self.make_request("POST", "/auth/send-otp", otp_request)
            if not result["success"]:
                return False
            
            dev_otp = result["data"].get("dev_info", "").replace("OTP: ", "")
            login_data = {
                "mobile": self.test_player["mobile"],
                "otp": dev_otp
            }
            result = self.make_request("POST", "/auth/login", login_data)
            
            if result["success"]:
                print("✅ Player login successful")
                player_token = result["data"].get("access_token")
                player_id = result["data"]["user"]["id"]
            else:
                print(f"❌ Player login failed: {result}")
                return False
        else:
            print(f"❌ Player registration failed: {result}")
            return False
        
    def create_real_booking_via_db(self):
        """Create a real booking by directly inserting into MongoDB"""
        print("\n=== Creating Real Test Booking via Database ===")
        
        try:
            from motor.motor_asyncio import AsyncIOMotorClient
            import asyncio
            import os
            
            # Get MongoDB connection details
            mongo_url = "mongodb+srv://Rushi08:h7grfXY1vbf3MRyC@cluster0.cd9pn1a.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
            
            async def insert_booking():
                client = AsyncIOMotorClient(mongo_url)
                db = client["PlayON_DB"]
                
                # First, register a player if not exists
                player_id = str(__import__('uuid').uuid4())
                
                # Check if player exists
                existing_player = await db.users.find_one({"mobile": self.test_player["mobile"]})
                if existing_player:
                    player_id = existing_player["_id"]
                    print(f"   Using existing player: {player_id}")
                else:
                    # Create player
                    player_doc = {
                        "_id": player_id,
                        "mobile": self.test_player["mobile"],
                        "name": self.test_player["name"],
                        "email": self.test_player["email"],
                        "role": "player",
                        "is_verified": True,
                        "created_at": datetime.utcnow(),
                        "updated_at": datetime.utcnow(),
                        "is_active": True,
                        "sports_interests": self.test_player["sports_interests"],
                        "location": self.test_player["location"]
                    }
                    await db.users.insert_one(player_doc)
                    print(f"   Created new player: {player_id}")
                
                # Create booking
                booking_id = str(__import__('uuid').uuid4())
                booking_doc = {
                    "_id": booking_id,
                    "venue_id": self.test_venue_id,
                    "user_id": player_id,
                    "slot_id": "test-slot-123",
                    "booking_date": (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d"),
                    "start_time": "18:00",
                    "end_time": "20:00",
                    "duration_hours": 2,
                    "total_amount": 3000.0,
                    "status": "confirmed",
                    "payment_status": "pending",
                    "player_name": self.test_player["name"],
                    "player_phone": self.test_player["mobile"],
                    "notes": "Test booking for venue owner API testing",
                    "created_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow()
                }
                
                await db.bookings.insert_one(booking_doc)
                client.close()
                return booking_id
            
            # Run the async function
            booking_id = asyncio.run(insert_booking())
            self.test_booking_id = booking_id
            print(f"✅ Real test booking created: {booking_id}")
            return True
            
        except Exception as e:
            print(f"❌ Failed to create real booking: {str(e)}")
            return False

    def test_get_specific_venue_details(self):
        """Test GET /api/venue-owner/venues/{venue_id}"""
        print("\n=== Testing GET Specific Venue Details ===")
        
        if not self.test_venue_id:
            print("❌ No test venue available")
            return False
        
        result = self.make_request("GET", f"/venue-owner/venues/{self.test_venue_id}", auth_required=True)
        
        if result["success"]:
            venue_data = result["data"]
            print("✅ Get specific venue details successful")
            print(f"   Venue: {venue_data.get('name')}")
            print(f"   Owner: {venue_data.get('owner_name')}")
            print(f"   Sports: {venue_data.get('sports_supported')}")
            print(f"   Address: {venue_data.get('address')}, {venue_data.get('city')}")
            print(f"   Active: {venue_data.get('is_active')}")
            print(f"   Slots: {len(venue_data.get('slots', []))} slots configured")
            
            # Verify response structure
            required_fields = ['id', 'name', 'owner_id', 'sports_supported', 'address', 'city', 'state']
            missing_fields = [field for field in required_fields if field not in venue_data]
            if missing_fields:
                print(f"⚠️  Missing fields in response: {missing_fields}")
            
            return True
        else:
            print(f"❌ Get specific venue details failed: {result}")
            return False

    def test_update_venue_status(self):
        """Test PUT /api/venue-owner/venues/{venue_id}/status"""
        print("\n=== Testing Update Venue Status ===")
        
        if not self.test_venue_id:
            print("❌ No test venue available")
            return False
        
        # Test deactivating venue
        result = self.make_request("PUT", f"/venue-owner/venues/{self.test_venue_id}/status", 
                                 params={"is_active": False}, auth_required=True)
        
        if result["success"]:
            print("✅ Venue deactivation successful")
            print(f"   Message: {result['data'].get('message')}")
        else:
            print(f"❌ Venue deactivation failed: {result}")
            return False
        
        # Test reactivating venue
        result = self.make_request("PUT", f"/venue-owner/venues/{self.test_venue_id}/status", 
                                 params={"is_active": True}, auth_required=True)
        
        if result["success"]:
            print("✅ Venue reactivation successful")
            print(f"   Message: {result['data'].get('message')}")
            return True
        else:
            print(f"❌ Venue reactivation failed: {result}")
            return False

    def test_get_venue_owner_bookings(self):
        """Test GET /api/venue-owner/bookings"""
        print("\n=== Testing Get Venue Owner Bookings ===")
        
        # Test basic bookings retrieval
        result = self.make_request("GET", "/venue-owner/bookings", auth_required=True)
        
        if result["success"]:
            bookings = result["data"]
            print(f"✅ Get venue owner bookings successful ({len(bookings)} bookings)")
            
            if bookings:
                booking = bookings[0]
                print(f"   Sample booking: {booking.get('venue_name')} - {booking.get('booking_date')}")
                print(f"   Player: {booking.get('player_name')} ({booking.get('player_phone')})")
                print(f"   Status: {booking.get('status')} | Payment: {booking.get('payment_status')}")
                
                # Store first booking ID for detailed test
                self.test_booking_id = booking.get('id')
            
            # Test with filters
            print("\n   Testing with filters...")
            
            # Test venue filter
            if self.test_venue_id:
                result = self.make_request("GET", "/venue-owner/bookings", 
                                         params={"venue_id": self.test_venue_id}, auth_required=True)
                if result["success"]:
                    print(f"   ✅ Venue filter working ({len(result['data'])} bookings for venue)")
                else:
                    print(f"   ❌ Venue filter failed: {result}")
            
            # Test status filter
            result = self.make_request("GET", "/venue-owner/bookings", 
                                     params={"status": "confirmed"}, auth_required=True)
            if result["success"]:
                print(f"   ✅ Status filter working ({len(result['data'])} confirmed bookings)")
            else:
                print(f"   ❌ Status filter failed: {result}")
            
            # Test date range filter
            today = datetime.now().strftime("%Y-%m-%d")
            future_date = (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d")
            result = self.make_request("GET", "/venue-owner/bookings", 
                                     params={"start_date": today, "end_date": future_date}, 
                                     auth_required=True)
            if result["success"]:
                print(f"   ✅ Date range filter working ({len(result['data'])} bookings in range)")
            else:
                print(f"   ❌ Date range filter failed: {result}")
            
            return True
        else:
            print(f"❌ Get venue owner bookings failed: {result}")
            return False

    def test_get_specific_booking_details(self):
        """Test GET /api/venue-owner/bookings/{booking_id}"""
        print("\n=== Testing Get Specific Booking Details ===")
        
        if not self.test_booking_id:
            print("❌ No test booking available")
            return False
        
        result = self.make_request("GET", f"/venue-owner/bookings/{self.test_booking_id}", auth_required=True)
        
        if result["success"]:
            booking_data = result["data"]
            print("✅ Get specific booking details successful")
            print(f"   Booking ID: {booking_data.get('id')}")
            print(f"   Venue: {booking_data.get('venue_name')}")
            print(f"   Player: {booking_data.get('player_name')} ({booking_data.get('player_phone')})")
            print(f"   Date/Time: {booking_data.get('booking_date')} {booking_data.get('start_time')}-{booking_data.get('end_time')}")
            print(f"   Duration: {booking_data.get('duration_hours')} hours")
            print(f"   Amount: ₹{booking_data.get('total_amount')}")
            print(f"   Status: {booking_data.get('status')} | Payment: {booking_data.get('payment_status')}")
            
            # Verify response structure
            required_fields = ['id', 'venue_id', 'venue_name', 'user_id', 'booking_date', 'start_time', 'end_time']
            missing_fields = [field for field in required_fields if field not in booking_data]
            if missing_fields:
                print(f"⚠️  Missing fields in response: {missing_fields}")
            
            return True
        else:
            print(f"❌ Get specific booking details failed: {result}")
            return False

    def test_update_booking_status(self):
        """Test PUT /api/venue-owner/bookings/{booking_id}/status"""
        print("\n=== Testing Update Booking Status ===")
        
        if not self.test_booking_id:
            print("❌ No test booking available")
            return False
        
        # Test updating to confirmed
        result = self.make_request("PUT", f"/venue-owner/bookings/{self.test_booking_id}/status", 
                                 params={"new_status": "confirmed"}, auth_required=True)
        
        if result["success"]:
            print("✅ Booking status update to confirmed successful")
            print(f"   Message: {result['data'].get('message')}")
        else:
            print(f"❌ Booking status update to confirmed failed: {result}")
            return False
        
        # Test updating to completed
        result = self.make_request("PUT", f"/venue-owner/bookings/{self.test_booking_id}/status", 
                                 params={"new_status": "completed"}, auth_required=True)
        
        if result["success"]:
            print("✅ Booking status update to completed successful")
            print(f"   Message: {result['data'].get('message')}")
        else:
            print(f"❌ Booking status update to completed failed: {result}")
            return False
        
        # Test invalid status
        result = self.make_request("PUT", f"/venue-owner/bookings/{self.test_booking_id}/status", 
                                 params={"new_status": "invalid_status"}, auth_required=True)
        
        if not result["success"] and result["status_code"] == 400:
            print("✅ Invalid status properly rejected")
            return True
        else:
            print(f"❌ Invalid status not handled properly: {result}")
            return False

    def test_analytics_dashboard(self):
        """Test GET /api/venue-owner/analytics/dashboard"""
        print("\n=== Testing Analytics Dashboard ===")
        
        # Test basic analytics
        result = self.make_request("GET", "/venue-owner/analytics/dashboard", auth_required=True)
        
        if result["success"]:
            analytics = result["data"]
            print("✅ Analytics dashboard successful")
            print(f"   Total Venues: {analytics.get('total_venues')}")
            print(f"   Total Bookings: {analytics.get('total_bookings')}")
            print(f"   Total Revenue: ₹{analytics.get('total_revenue')}")
            print(f"   Occupancy Rate: {analytics.get('occupancy_rate')}%")
            print(f"   Recent Bookings: {len(analytics.get('recent_bookings', []))}")
            print(f"   Revenue Trend Data: {len(analytics.get('revenue_trend', {}))} days")
            print(f"   Top Sports: {len(analytics.get('top_sports', []))} sports")
            print(f"   Peak Hours: {len(analytics.get('peak_hours', []))} hours")
            
            # Test with date filters
            print("\n   Testing with date filters...")
            
            # Test start_date filter
            today = datetime.now().strftime("%Y-%m-%d")
            result = self.make_request("GET", "/venue-owner/analytics/dashboard", 
                                     params={"start_date": today}, auth_required=True)
            if result["success"]:
                print(f"   ✅ Start date filter working")
            else:
                print(f"   ❌ Start date filter failed: {result}")
            
            # Test end_date filter
            result = self.make_request("GET", "/venue-owner/analytics/dashboard", 
                                     params={"end_date": today}, auth_required=True)
            if result["success"]:
                print(f"   ✅ End date filter working")
            else:
                print(f"   ❌ End date filter failed: {result}")
            
            # Test date range filter
            past_date = (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d")
            result = self.make_request("GET", "/venue-owner/analytics/dashboard", 
                                     params={"start_date": past_date, "end_date": today}, 
                                     auth_required=True)
            if result["success"]:
                print(f"   ✅ Date range filter working")
            else:
                print(f"   ❌ Date range filter failed: {result}")
            
            return True
        else:
            print(f"❌ Analytics dashboard failed: {result}")
            return False

    def test_authentication_and_authorization(self):
        """Test authentication and authorization for venue owner endpoints"""
        print("\n=== Testing Authentication & Authorization ===")
        
        # Test without authentication
        result = self.make_request("GET", "/venue-owner/venues/test-id")
        if not result["success"] and result["status_code"] in [401, 403]:
            print("✅ Unauthenticated access properly rejected")
        else:
            print(f"❌ Unauthenticated access not handled properly: {result}")
            return False
        
        # Test with invalid token
        old_token = self.venue_owner_token
        self.venue_owner_token = "invalid-token"
        
        result = self.make_request("GET", "/venue-owner/venues/test-id", auth_required=True)
        if not result["success"] and result["status_code"] in [401, 403]:
            print("✅ Invalid token properly rejected")
        else:
            print(f"❌ Invalid token not handled properly: {result}")
            return False
        
        # Restore valid token
        self.venue_owner_token = old_token
        
        # Test venue owner accessing non-existent venue
        result = self.make_request("GET", "/venue-owner/venues/non-existent-venue-id", auth_required=True)
        if not result["success"] and result["status_code"] == 404:
            print("✅ Non-existent venue properly handled")
        else:
            print(f"❌ Non-existent venue not handled properly: {result}")
            return False
        
        # Test venue owner accessing non-existent booking
        result = self.make_request("GET", "/venue-owner/bookings/non-existent-booking-id", auth_required=True)
        if not result["success"] and result["status_code"] in [404, 403]:
            print("✅ Non-existent booking properly handled")
            return True
        else:
            print(f"❌ Non-existent booking not handled properly: {result}")
            return False

    def run_all_tests(self):
        """Run all venue owner API tests"""
        print("🚀 Starting Venue Owner API Tests")
        print(f"Testing against: {self.base_url}")
        
        # Setup phase
        if not self.setup_venue_owner_auth():
            print("❌ Failed to setup venue owner authentication")
            return False
        
        if not self.create_test_venue():
            print("❌ Failed to create test venue")
            return False
        
        # Create a real booking for testing booking endpoints
        if not self.create_real_booking_via_db():
            print("⚠️  Failed to create test booking - booking tests will be limited")
        
        test_results = []
        
        # Run test suites for specific endpoints
        test_suites = [
            ("GET Specific Venue Details", self.test_get_specific_venue_details),
            ("Update Venue Status", self.test_update_venue_status),
            ("Get Venue Owner Bookings", self.test_get_venue_owner_bookings),
            ("Get Specific Booking Details", self.test_get_specific_booking_details),
            ("Update Booking Status", self.test_update_booking_status),
            ("Analytics Dashboard", self.test_analytics_dashboard),
            ("Authentication & Authorization", self.test_authentication_and_authorization)
        ]
        
        for suite_name, test_func in test_suites:
            try:
                result = test_func()
                test_results.append((suite_name, result))
                if not result:
                    print(f"\n⚠️  {suite_name} test suite failed!")
            except Exception as e:
                print(f"\n💥 {suite_name} test suite crashed: {str(e)}")
                test_results.append((suite_name, False))
        
        # Print summary
        print("\n" + "="*60)
        print("🏁 VENUE OWNER API TEST SUMMARY")
        print("="*60)
        
        passed = sum(1 for _, result in test_results if result)
        total = len(test_results)
        
        for suite_name, result in test_results:
            status = "✅ PASS" if result else "❌ FAIL"
            print(f"{status} {suite_name}")
        
        print(f"\nOverall: {passed}/{total} test suites passed")
        
        if passed == total:
            print("🎉 All venue owner API tests passed! Endpoints are working correctly.")
            return True
        else:
            print("⚠️  Some tests failed. Please check the issues above.")
            return False

def main():
    """Main test execution"""
    tester = VenueOwnerAPITester()
    success = tester.run_all_tests()
    return success

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)