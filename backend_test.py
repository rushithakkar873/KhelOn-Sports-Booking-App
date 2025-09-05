#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for Playon Sports Booking App
Tests all authentication, venue, booking, and tournament endpoints
"""

import requests
import json
import time
from datetime import datetime, timedelta
from typing import Dict, Any, Optional

# Configuration
BASE_URL = "https://playon-app.preview.emergentagent.com/api"
HEADERS = {"Content-Type": "application/json"}

class PlayonAPITester:
    def __init__(self):
        self.base_url = BASE_URL
        self.headers = HEADERS.copy()
        self.auth_token = None
        self.test_user_id = None
        self.venue_owner_token = None
        self.venue_owner_id = None
        self.test_venue_id = None
        self.test_booking_id = None
        self.test_tournament_id = None
        
        # Test data
        self.test_player = {
            "name": "Rahul Sharma",
            "email": "rahul.sharma@example.com",
            "mobile": "+919876543210",
            "password": "securepass123",
            "role": "player"
        }
        
        self.test_venue_owner = {
            "name": "Priya Patel",
            "email": "priya.patel@example.com", 
            "mobile": "+919876543211",
            "password": "venueowner123",
            "role": "venue_owner"
        }
        
        self.test_venue = {
            "name": "Elite Cricket Ground",
            "sport": "Cricket",
            "location": "Bandra West, Mumbai, Maharashtra",
            "description": "Premium cricket ground with professional facilities",
            "facilities": ["Floodlights", "Changing Rooms", "Parking", "Cafeteria"],
            "pricing": {"hourly": 1200, "daily": 8000},
            "available_slots": ["06:00-08:00", "08:00-10:00", "18:00-20:00", "20:00-22:00"],
            "contact_phone": "+919876543212",
            "rules": "No smoking, proper cricket attire required"
        }
        
        self.test_booking = {
            "date": (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d"),
            "time_slot": "18:00-20:00",
            "duration": 2,
            "notes": "Team practice session"
        }
        
        self.test_tournament = {
            "name": "Mumbai Cricket Championship 2025",
            "sport": "Cricket", 
            "location": "Mumbai, Maharashtra",
            "description": "Annual cricket tournament for amateur teams",
            "format": "Single Elimination",
            "max_participants": 16,
            "registration_fee": 2500.0,
            "start_date": (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d"),
            "end_date": (datetime.now() + timedelta(days=35)).strftime("%Y-%m-%d"),
            "rules": "All players must be amateur level",
            "prizes": "Winner: ₹50,000, Runner-up: ₹25,000"
        }

    def make_request(self, method: str, endpoint: str, data: Optional[Dict] = None, 
                    auth_required: bool = False) -> Dict[str, Any]:
        """Make HTTP request with proper error handling"""
        url = f"{self.base_url}{endpoint}"
        headers = self.headers.copy()
        
        if auth_required and self.auth_token:
            headers["Authorization"] = f"Bearer {self.auth_token}"
        
        try:
            if method.upper() == "GET":
                response = requests.get(url, headers=headers, timeout=30)
            elif method.upper() == "POST":
                response = requests.post(url, headers=headers, json=data, timeout=30)
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

    def test_health_endpoints(self):
        """Test basic health and root endpoints"""
        print("\n=== Testing Health Endpoints ===")
        
        # Test root endpoint
        result = self.make_request("GET", "/")
        if result["success"]:
            print("✅ Root endpoint working")
            print(f"   Response: {result['data']}")
        else:
            print(f"❌ Root endpoint failed: {result}")
            return False
        
        # Test health endpoint
        result = self.make_request("GET", "/health")
        if result["success"]:
            print("✅ Health endpoint working")
            print(f"   Response: {result['data']}")
        else:
            print(f"❌ Health endpoint failed: {result}")
            return False
        
        return True

    def test_user_registration(self):
        """Test user registration functionality"""
        print("\n=== Testing User Registration ===")
        
        # Test player registration
        result = self.make_request("POST", "/auth/register", self.test_player)
        if result["success"]:
            print("✅ Player registration successful")
            self.test_user_id = result["data"].get("user_id")
            print(f"   User ID: {self.test_user_id}")
        else:
            print(f"❌ Player registration failed: {result}")
            return False
        
        # Test venue owner registration
        result = self.make_request("POST", "/auth/register", self.test_venue_owner)
        if result["success"]:
            print("✅ Venue owner registration successful")
            self.venue_owner_id = result["data"].get("user_id")
            print(f"   Venue Owner ID: {self.venue_owner_id}")
        else:
            print(f"❌ Venue owner registration failed: {result}")
            return False
        
        # Test duplicate registration (should fail)
        result = self.make_request("POST", "/auth/register", self.test_player)
        if not result["success"] and result["status_code"] == 400:
            print("✅ Duplicate registration properly rejected")
        else:
            print(f"❌ Duplicate registration not handled properly: {result}")
            return False
        
        return True

    def test_user_login(self):
        """Test user login functionality"""
        print("\n=== Testing User Login ===")
        
        # Test player login
        login_data = {
            "email": self.test_player["email"],
            "password": self.test_player["password"]
        }
        result = self.make_request("POST", "/auth/login", login_data)
        if result["success"]:
            print("✅ Player login successful")
            self.auth_token = result["data"].get("access_token")
            print(f"   Token received: {self.auth_token[:20]}...")
        else:
            print(f"❌ Player login failed: {result}")
            return False
        
        # Test venue owner login
        owner_login_data = {
            "email": self.test_venue_owner["email"],
            "password": self.test_venue_owner["password"]
        }
        result = self.make_request("POST", "/auth/login", owner_login_data)
        if result["success"]:
            print("✅ Venue owner login successful")
            self.venue_owner_token = result["data"].get("access_token")
            print(f"   Owner token received: {self.venue_owner_token[:20]}...")
        else:
            print(f"❌ Venue owner login failed: {result}")
            return False
        
        # Test invalid login
        invalid_login = {
            "email": self.test_player["email"],
            "password": "wrongpassword"
        }
        result = self.make_request("POST", "/auth/login", invalid_login)
        if not result["success"] and result["status_code"] == 401:
            print("✅ Invalid login properly rejected")
        else:
            print(f"❌ Invalid login not handled properly: {result}")
            return False
        
        return True

    def test_protected_endpoints(self):
        """Test protected endpoints with authentication"""
        print("\n=== Testing Protected Endpoints ===")
        
        # Test /auth/me with valid token
        result = self.make_request("GET", "/auth/me", auth_required=True)
        if result["success"]:
            print("✅ Protected endpoint with valid token working")
            user_data = result["data"]
            print(f"   User: {user_data.get('name')} ({user_data.get('role')})")
        else:
            print(f"❌ Protected endpoint with valid token failed: {result}")
            return False
        
        # Test /auth/me without token
        old_token = self.auth_token
        self.auth_token = None
        result = self.make_request("GET", "/auth/me", auth_required=True)
        if not result["success"] and result["status_code"] in [401, 403]:
            print("✅ Protected endpoint without token properly rejected")
        else:
            print(f"❌ Protected endpoint without token not handled properly: {result}")
            return False
        
        # Restore token
        self.auth_token = old_token
        return True

    def test_venue_management(self):
        """Test venue management functionality"""
        print("\n=== Testing Venue Management ===")
        
        # Test venue creation by player (should fail)
        result = self.make_request("POST", "/venues", self.test_venue, auth_required=True)
        if not result["success"] and result["status_code"] == 403:
            print("✅ Venue creation by player properly rejected")
        else:
            print(f"❌ Venue creation by player not handled properly: {result}")
            return False
        
        # Switch to venue owner token
        old_token = self.auth_token
        self.auth_token = self.venue_owner_token
        
        # Test venue creation by venue owner
        result = self.make_request("POST", "/venues", self.test_venue, auth_required=True)
        if result["success"]:
            print("✅ Venue creation by venue owner successful")
            self.test_venue_id = result["data"].get("venue_id")
            print(f"   Venue ID: {self.test_venue_id}")
        else:
            print(f"❌ Venue creation by venue owner failed: {result}")
            return False
        
        # Test venue listing
        result = self.make_request("GET", "/venues")
        if result["success"]:
            venues = result["data"]
            print(f"✅ Venue listing successful ({len(venues)} venues)")
            if venues:
                print(f"   Sample venue: {venues[0]['name']}")
        else:
            print(f"❌ Venue listing failed: {result}")
            return False
        
        # Test venue filtering by sport
        result = self.make_request("GET", "/venues?sport=Cricket")
        if result["success"]:
            cricket_venues = result["data"]
            print(f"✅ Venue filtering by sport successful ({len(cricket_venues)} cricket venues)")
        else:
            print(f"❌ Venue filtering by sport failed: {result}")
            return False
        
        # Test specific venue details
        if self.test_venue_id:
            result = self.make_request("GET", f"/venues/{self.test_venue_id}")
            if result["success"]:
                venue_details = result["data"]
                print(f"✅ Venue details retrieval successful")
                print(f"   Venue: {venue_details['name']} - {venue_details['location']}")
            else:
                print(f"❌ Venue details retrieval failed: {result}")
                return False
        
        # Restore player token
        self.auth_token = old_token
        return True

    def test_booking_system(self):
        """Test booking system functionality"""
        print("\n=== Testing Booking System ===")
        
        if not self.test_venue_id:
            print("❌ No venue available for booking test")
            return False
        
        # Prepare booking data
        booking_data = self.test_booking.copy()
        booking_data["venue_id"] = self.test_venue_id
        
        # Test booking creation
        result = self.make_request("POST", "/bookings", booking_data, auth_required=True)
        if result["success"]:
            print("✅ Booking creation successful")
            self.test_booking_id = result["data"].get("booking_id")
            amount = result["data"].get("amount")
            print(f"   Booking ID: {self.test_booking_id}")
            print(f"   Amount: ₹{amount}")
        else:
            print(f"❌ Booking creation failed: {result}")
            return False
        
        # Test conflict detection (try to book same slot)
        result = self.make_request("POST", "/bookings", booking_data, auth_required=True)
        if not result["success"] and result["status_code"] == 400:
            print("✅ Booking conflict detection working")
        else:
            print(f"❌ Booking conflict detection not working properly: {result}")
            return False
        
        # Test user bookings retrieval
        result = self.make_request("GET", "/bookings", auth_required=True)
        if result["success"]:
            bookings = result["data"]
            print(f"✅ User bookings retrieval successful ({len(bookings)} bookings)")
            if bookings:
                print(f"   Latest booking: {bookings[0]['date']} {bookings[0]['time_slot']}")
        else:
            print(f"❌ User bookings retrieval failed: {result}")
            return False
        
        # Test bookings filtering by status
        result = self.make_request("GET", "/bookings?status=confirmed", auth_required=True)
        if result["success"]:
            confirmed_bookings = result["data"]
            print(f"✅ Bookings filtering by status successful ({len(confirmed_bookings)} confirmed)")
        else:
            print(f"❌ Bookings filtering by status failed: {result}")
            return False
        
        return True

    def test_tournament_management(self):
        """Test tournament management functionality"""
        print("\n=== Testing Tournament Management ===")
        
        # Test tournament creation
        result = self.make_request("POST", "/tournaments", self.test_tournament, auth_required=True)
        if result["success"]:
            print("✅ Tournament creation successful")
            self.test_tournament_id = result["data"].get("tournament_id")
            print(f"   Tournament ID: {self.test_tournament_id}")
        else:
            print(f"❌ Tournament creation failed: {result}")
            return False
        
        # Test tournament listing
        result = self.make_request("GET", "/tournaments")
        if result["success"]:
            tournaments = result["data"]
            print(f"✅ Tournament listing successful ({len(tournaments)} tournaments)")
            if tournaments:
                print(f"   Sample tournament: {tournaments[0]['name']}")
        else:
            print(f"❌ Tournament listing failed: {result}")
            return False
        
        # Test tournament filtering by sport
        result = self.make_request("GET", "/tournaments?sport=Cricket")
        if result["success"]:
            cricket_tournaments = result["data"]
            print(f"✅ Tournament filtering by sport successful ({len(cricket_tournaments)} cricket tournaments)")
        else:
            print(f"❌ Tournament filtering by sport failed: {result}")
            return False
        
        # Test tournament filtering by status
        result = self.make_request("GET", "/tournaments?status=upcoming")
        if result["success"]:
            upcoming_tournaments = result["data"]
            print(f"✅ Tournament filtering by status successful ({len(upcoming_tournaments)} upcoming)")
        else:
            print(f"❌ Tournament filtering by status failed: {result}")
            return False
        
        # Test specific tournament details
        if self.test_tournament_id:
            result = self.make_request("GET", f"/tournaments/{self.test_tournament_id}")
            if result["success"]:
                tournament_details = result["data"]
                print(f"✅ Tournament details retrieval successful")
                print(f"   Tournament: {tournament_details['name']} - {tournament_details['location']}")
            else:
                print(f"❌ Tournament details retrieval failed: {result}")
                return False
        
        return True

    def test_error_handling(self):
        """Test error handling for various scenarios"""
        print("\n=== Testing Error Handling ===")
        
        # Test invalid venue ID
        result = self.make_request("GET", "/venues/invalid-id")
        if not result["success"] and result["status_code"] == 404:
            print("✅ Invalid venue ID properly handled")
        else:
            print(f"❌ Invalid venue ID not handled properly: {result}")
            return False
        
        # Test invalid tournament ID
        result = self.make_request("GET", "/tournaments/invalid-id")
        if not result["success"] and result["status_code"] == 404:
            print("✅ Invalid tournament ID properly handled")
        else:
            print(f"❌ Invalid tournament ID not handled properly: {result}")
            return False
        
        # Test booking with invalid venue
        invalid_booking = self.test_booking.copy()
        invalid_booking["venue_id"] = "invalid-venue-id"
        result = self.make_request("POST", "/bookings", invalid_booking, auth_required=True)
        if not result["success"] and result["status_code"] == 404:
            print("✅ Booking with invalid venue properly handled")
        else:
            print(f"❌ Booking with invalid venue not handled properly: {result}")
            return False
        
        return True

    def run_all_tests(self):
        """Run all test suites"""
        print("🚀 Starting Playon Backend API Tests")
        print(f"Testing against: {self.base_url}")
        
        test_results = []
        
        # Run test suites
        test_suites = [
            ("Health Endpoints", self.test_health_endpoints),
            ("User Registration", self.test_user_registration),
            ("User Login", self.test_user_login),
            ("Protected Endpoints", self.test_protected_endpoints),
            ("Venue Management", self.test_venue_management),
            ("Booking System", self.test_booking_system),
            ("Tournament Management", self.test_tournament_management),
            ("Error Handling", self.test_error_handling)
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
        print("🏁 TEST SUMMARY")
        print("="*60)
        
        passed = sum(1 for _, result in test_results if result)
        total = len(test_results)
        
        for suite_name, result in test_results:
            status = "✅ PASS" if result else "❌ FAIL"
            print(f"{status} {suite_name}")
        
        print(f"\nOverall: {passed}/{total} test suites passed")
        
        if passed == total:
            print("🎉 All tests passed! Backend API is working correctly.")
            return True
        else:
            print("⚠️  Some tests failed. Please check the issues above.")
            return False

def main():
    """Main test execution"""
    tester = PlayonAPITester()
    success = tester.run_all_tests()
    return success

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)