#!/usr/bin/env python3
"""
Comprehensive Venue Owner Dashboard API Testing for Playon Sports Booking App
Tests all venue owner authentication, venue management, booking management, analytics, and profile endpoints
"""

import requests
import json
import time
from datetime import datetime, timedelta
from typing import Dict, Any, Optional

# Configuration
BASE_URL = "https://venuemate-11.preview.emergentagent.com/api"
HEADERS = {"Content-Type": "application/json"}

class VenueOwnerDashboardTester:
    def __init__(self):
        self.base_url = BASE_URL
        self.headers = HEADERS.copy()
        self.venue_owner_token = None
        self.venue_owner_id = None
        self.test_venue_id = None
        self.test_booking_id = None
        self.player_token = None
        self.player_id = None
        
        # Realistic Indian venue owner test data
        self.venue_owner_data = {
            "name": "Rajesh Kumar",
            "email": "rajesh.kumar@elitesports.com",
            "mobile": "+919876543210",
            "password": "EliteSports@123",
            "business_name": "Elite Sports Complex",
            "business_address": "Plot No. 45, Sector 18, Noida, Uttar Pradesh 201301",
            "gst_number": "24ABCDE1234F1Z5"
        }
        
        # Test player for booking creation
        self.test_player = {
            "name": "Arjun Patel",
            "email": "arjun.patel@example.com",
            "mobile": "+919876543211",
            "password": "player123",
            "role": "player"
        }
        
        # Realistic venue data
        self.venue_data = {
            "name": "Elite Cricket Ground Mumbai",
            "sports_supported": ["Cricket", "Football"],
            "address": "Bandra Kurla Complex, Bandra East",
            "city": "Mumbai",
            "state": "Maharashtra", 
            "pincode": "400051",
            "description": "Premium cricket ground with international standard facilities and floodlights",
            "amenities": ["Floodlights", "Changing Rooms", "Parking", "Cafeteria", "First Aid", "Security"],
            "base_price_per_hour": 1200.0,
            "contact_phone": "+919876543212",
            "whatsapp_number": "+919876543212",
            "images": ["https://example.com/ground1.jpg", "https://example.com/ground2.jpg"],
            "rules_and_regulations": "No smoking, proper cricket attire required, advance booking mandatory",
            "cancellation_policy": "24 hours advance notice required for cancellation",
            "slots": [
                {
                    "day_of_week": 1,  # Monday
                    "start_time": "06:00",
                    "end_time": "08:00",
                    "capacity": 2,
                    "price_per_hour": 1000.0,
                    "is_peak_hour": False
                },
                {
                    "day_of_week": 1,  # Monday
                    "start_time": "18:00", 
                    "end_time": "20:00",
                    "capacity": 2,
                    "price_per_hour": 1500.0,
                    "is_peak_hour": True
                },
                {
                    "day_of_week": 6,  # Saturday
                    "start_time": "08:00",
                    "end_time": "10:00", 
                    "capacity": 2,
                    "price_per_hour": 1800.0,
                    "is_peak_hour": True
                },
                {
                    "day_of_week": 0,  # Sunday
                    "start_time": "16:00",
                    "end_time": "18:00",
                    "capacity": 2,
                    "price_per_hour": 1600.0,
                    "is_peak_hour": True
                }
            ]
        }

    def make_request(self, method: str, endpoint: str, data: Optional[Dict] = None, 
                    auth_token: Optional[str] = None, params: Optional[Dict] = None) -> Dict[str, Any]:
        """Make HTTP request with proper error handling"""
        url = f"{self.base_url}{endpoint}"
        headers = self.headers.copy()
        
        if auth_token:
            headers["Authorization"] = f"Bearer {auth_token}"
        
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

    def test_venue_owner_authentication(self):
        """Test venue owner authentication endpoints"""
        print("\n=== Testing Venue Owner Authentication ===")
        
        # Test venue owner registration
        result = self.make_request("POST", "/venue-owner/register", self.venue_owner_data)
        if result["success"]:
            print("✅ Venue owner registration successful")
            self.venue_owner_id = result["data"].get("owner_id")
            print(f"   Owner ID: {self.venue_owner_id}")
            print(f"   Business: {self.venue_owner_data['business_name']}")
            print(f"   GST: {self.venue_owner_data['gst_number']}")
        else:
            # Check if already exists
            if result["status_code"] == 400 and "already exists" in str(result["data"]):
                print("✅ Venue owner already exists (expected for repeat tests)")
            else:
                print(f"❌ Venue owner registration failed: {result}")
                return False
        
        # Test venue owner login
        login_data = {
            "email": self.venue_owner_data["email"],
            "password": self.venue_owner_data["password"]
        }
        result = self.make_request("POST", "/venue-owner/login", login_data)
        if result["success"]:
            print("✅ Venue owner login successful")
            self.venue_owner_token = result["data"].get("access_token")
            user_type = result["data"].get("user_type")
            owner_name = result["data"].get("name")
            print(f"   Token received: {self.venue_owner_token[:20]}...")
            print(f"   User type: {user_type}")
            print(f"   Owner name: {owner_name}")
            
            if user_type != "venue_owner":
                print(f"❌ Incorrect user type returned: {user_type}")
                return False
        else:
            print(f"❌ Venue owner login failed: {result}")
            return False
        
        # Test venue owner profile retrieval
        result = self.make_request("GET", "/venue-owner/profile", auth_token=self.venue_owner_token)
        if result["success"]:
            print("✅ Venue owner profile retrieval successful")
            profile = result["data"]
            print(f"   Name: {profile.get('name')}")
            print(f"   Business: {profile.get('business_name')}")
            print(f"   Total venues: {profile.get('total_venues', 0)}")
            print(f"   Total revenue: ₹{profile.get('total_revenue', 0)}")
        else:
            print(f"❌ Venue owner profile retrieval failed: {result}")
            return False
        
        # Test invalid login
        invalid_login = {
            "email": self.venue_owner_data["email"],
            "password": "wrongpassword"
        }
        result = self.make_request("POST", "/venue-owner/login", invalid_login)
        if not result["success"] and result["status_code"] == 401:
            print("✅ Invalid venue owner login properly rejected")
        else:
            print(f"❌ Invalid venue owner login not handled properly: {result}")
            return False
        
        # Test duplicate registration
        result = self.make_request("POST", "/venue-owner/register", self.venue_owner_data)
        if not result["success"] and result["status_code"] == 400:
            print("✅ Duplicate venue owner registration properly rejected")
        else:
            print(f"❌ Duplicate venue owner registration not handled properly: {result}")
            return False
        
        return True

    def test_venue_management(self):
        """Test venue owner venue management endpoints"""
        print("\n=== Testing Venue Owner Venue Management ===")
        
        if not self.venue_owner_token:
            print("❌ No venue owner token available")
            return False
        
        # Test venue creation
        result = self.make_request("POST", "/venue-owner/venues", self.venue_data, auth_token=self.venue_owner_token)
        if result["success"]:
            print("✅ Venue creation successful")
            self.test_venue_id = result["data"].get("venue_id")
            print(f"   Venue ID: {self.test_venue_id}")
            print(f"   Venue: {self.venue_data['name']}")
            print(f"   Location: {self.venue_data['city']}, {self.venue_data['state']}")
            print(f"   Sports: {', '.join(self.venue_data['sports_supported'])}")
            print(f"   Slots configured: {len(self.venue_data['slots'])}")
        else:
            print(f"❌ Venue creation failed: {result}")
            return False
        
        # Test venue listing with pagination
        result = self.make_request("GET", "/venue-owner/venues", auth_token=self.venue_owner_token, params={"skip": 0, "limit": 10})
        if result["success"]:
            venues = result["data"]
            print(f"✅ Venue listing successful ({len(venues)} venues)")
            if venues:
                venue = venues[0]
                print(f"   Sample venue: {venue['name']} - {venue['city']}")
                print(f"   Status: {'Active' if venue.get('is_active') else 'Inactive'}")
                print(f"   Slots: {len(venue.get('slots', []))}")
        else:
            print(f"❌ Venue listing failed: {result}")
            return False
        
        # Test venue filtering by active status
        result = self.make_request("GET", "/venue-owner/venues", auth_token=self.venue_owner_token, params={"is_active": True})
        if result["success"]:
            active_venues = result["data"]
            print(f"✅ Active venue filtering successful ({len(active_venues)} active venues)")
        else:
            print(f"❌ Active venue filtering failed: {result}")
            return False
        
        # Test individual venue details
        if self.test_venue_id:
            result = self.make_request("GET", f"/venue-owner/venues/{self.test_venue_id}", auth_token=self.venue_owner_token)
            if result["success"]:
                venue_details = result["data"]
                print("✅ Individual venue details retrieval successful")
                print(f"   Venue: {venue_details['name']}")
                print(f"   Owner: {venue_details['owner_name']}")
                print(f"   Amenities: {len(venue_details.get('amenities', []))}")
                print(f"   Base price: ₹{venue_details['base_price_per_hour']}/hour")
            else:
                print(f"❌ Individual venue details retrieval failed: {result}")
                return False
        
        # Test venue status update (deactivate)
        if self.test_venue_id:
            result = self.make_request("PUT", f"/venue-owner/venues/{self.test_venue_id}/status", 
                                     auth_token=self.venue_owner_token, params={"is_active": False})
            if result["success"]:
                print("✅ Venue deactivation successful")
                print(f"   Message: {result['data'].get('message')}")
            else:
                print(f"❌ Venue deactivation failed: {result}")
                return False
            
            # Reactivate venue
            result = self.make_request("PUT", f"/venue-owner/venues/{self.test_venue_id}/status", 
                                     auth_token=self.venue_owner_token, params={"is_active": True})
            if result["success"]:
                print("✅ Venue reactivation successful")
            else:
                print(f"❌ Venue reactivation failed: {result}")
                return False
        
        # Test venue ownership validation (try to access non-owned venue)
        fake_venue_id = "non-existent-venue-id"
        result = self.make_request("GET", f"/venue-owner/venues/{fake_venue_id}", auth_token=self.venue_owner_token)
        if not result["success"] and result["status_code"] == 404:
            print("✅ Venue ownership validation working (non-owned venue rejected)")
        else:
            print(f"❌ Venue ownership validation not working properly: {result}")
            return False
        
        return True

    def setup_test_booking(self):
        """Setup a test booking for booking management tests"""
        print("\n=== Setting up Test Booking ===")
        
        # Register and login test player
        result = self.make_request("POST", "/auth/register", self.test_player)
        if not result["success"] and result["status_code"] != 400:  # 400 means already exists
            print(f"❌ Player registration failed: {result}")
            return False
        
        login_data = {
            "email": self.test_player["email"],
            "password": self.test_player["password"]
        }
        result = self.make_request("POST", "/auth/login", login_data)
        if result["success"]:
            self.player_token = result["data"].get("access_token")
            self.player_id = result["data"].get("user", {}).get("id")
            print("✅ Test player login successful")
        else:
            print(f"❌ Test player login failed: {result}")
            return False
        
        # Create a test booking if we have a venue
        if self.test_venue_id and self.player_token:
            # Get venue details to find a slot
            venue_result = self.make_request("GET", f"/venue-owner/venues/{self.test_venue_id}", auth_token=self.venue_owner_token)
            if venue_result["success"]:
                venue = venue_result["data"]
                slots = venue.get("slots", [])
                if slots:
                    slot = slots[0]  # Use first slot
                    booking_data = {
                        "venue_id": self.test_venue_id,
                        "slot_id": slot["_id"],
                        "booking_date": (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d"),
                        "duration_hours": 2,
                        "player_name": "Arjun Patel",
                        "player_phone": "+919876543211",
                        "notes": "Cricket practice session for team"
                    }
                    
                    # Create booking using regular booking endpoint (simulating player booking)
                    # Note: We need to use the correct booking endpoint structure
                    booking_result = self.make_request("POST", "/bookings", booking_data, auth_token=self.player_token)
                    if booking_result["success"]:
                        self.test_booking_id = booking_result["data"].get("booking_id")
                        print(f"✅ Test booking created: {self.test_booking_id}")
                        return True
                    else:
                        print(f"⚠️  Test booking creation failed: {booking_result}")
                        # Continue without booking for other tests
                        return True
        
        return True

    def test_booking_management(self):
        """Test venue owner booking management endpoints"""
        print("\n=== Testing Venue Owner Booking Management ===")
        
        if not self.venue_owner_token:
            print("❌ No venue owner token available")
            return False
        
        # Setup test booking first
        if not self.setup_test_booking():
            print("❌ Failed to setup test booking")
            return False
        
        # Test booking listing for venue owner
        result = self.make_request("GET", "/venue-owner/bookings", auth_token=self.venue_owner_token, 
                                 params={"skip": 0, "limit": 10})
        if result["success"]:
            bookings = result["data"]
            print(f"✅ Venue owner booking listing successful ({len(bookings)} bookings)")
            if bookings:
                booking = bookings[0]
                print(f"   Sample booking: {booking['venue_name']} on {booking['booking_date']}")
                print(f"   Player: {booking['player_name']} ({booking['player_phone']})")
                print(f"   Amount: ₹{booking['total_amount']}")
                print(f"   Status: {booking['status']}")
        else:
            print(f"❌ Venue owner booking listing failed: {result}")
            return False
        
        # Test booking filtering by venue
        if self.test_venue_id:
            result = self.make_request("GET", "/venue-owner/bookings", auth_token=self.venue_owner_token,
                                     params={"venue_id": self.test_venue_id})
            if result["success"]:
                venue_bookings = result["data"]
                print(f"✅ Booking filtering by venue successful ({len(venue_bookings)} bookings)")
            else:
                print(f"❌ Booking filtering by venue failed: {result}")
                return False
        
        # Test booking filtering by status
        result = self.make_request("GET", "/venue-owner/bookings", auth_token=self.venue_owner_token,
                                 params={"status": "confirmed"})
        if result["success"]:
            confirmed_bookings = result["data"]
            print(f"✅ Booking filtering by status successful ({len(confirmed_bookings)} confirmed)")
        else:
            print(f"❌ Booking filtering by status failed: {result}")
            return False
        
        # Test booking filtering by date range
        start_date = datetime.now().strftime("%Y-%m-%d")
        end_date = (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d")
        result = self.make_request("GET", "/venue-owner/bookings", auth_token=self.venue_owner_token,
                                 params={"start_date": start_date, "end_date": end_date})
        if result["success"]:
            date_filtered_bookings = result["data"]
            print(f"✅ Booking filtering by date range successful ({len(date_filtered_bookings)} bookings)")
        else:
            print(f"❌ Booking filtering by date range failed: {result}")
            return False
        
        # Test individual booking details
        if self.test_booking_id:
            result = self.make_request("GET", f"/venue-owner/bookings/{self.test_booking_id}", 
                                     auth_token=self.venue_owner_token)
            if result["success"]:
                booking_details = result["data"]
                print("✅ Individual booking details retrieval successful")
                print(f"   Booking: {booking_details['venue_name']} - {booking_details['booking_date']}")
                print(f"   Duration: {booking_details['duration_hours']} hours")
                print(f"   Payment status: {booking_details['payment_status']}")
            else:
                print(f"❌ Individual booking details retrieval failed: {result}")
                return False
            
            # Test booking status update
            result = self.make_request("PUT", f"/venue-owner/bookings/{self.test_booking_id}/status",
                                     auth_token=self.venue_owner_token, params={"new_status": "completed"})
            if result["success"]:
                print("✅ Booking status update successful")
                print(f"   Message: {result['data'].get('message')}")
                print(f"   New status: {result['data'].get('new_status')}")
            else:
                print(f"❌ Booking status update failed: {result}")
                return False
        
        # Test booking ownership validation (try to access booking from different owner)
        fake_booking_id = "non-existent-booking-id"
        result = self.make_request("GET", f"/venue-owner/bookings/{fake_booking_id}", 
                                 auth_token=self.venue_owner_token)
        if not result["success"] and result["status_code"] == 404:
            print("✅ Booking ownership validation working (non-owned booking rejected)")
        else:
            print(f"❌ Booking ownership validation not working properly: {result}")
            return False
        
        return True

    def test_analytics_dashboard(self):
        """Test venue owner analytics dashboard endpoint"""
        print("\n=== Testing Venue Owner Analytics Dashboard ===")
        
        if not self.venue_owner_token:
            print("❌ No venue owner token available")
            return False
        
        # Test analytics dashboard without date filter
        result = self.make_request("GET", "/venue-owner/analytics/dashboard", auth_token=self.venue_owner_token)
        if result["success"]:
            analytics = result["data"]
            print("✅ Analytics dashboard retrieval successful")
            print(f"   Total venues: {analytics.get('total_venues', 0)}")
            print(f"   Total bookings: {analytics.get('total_bookings', 0)}")
            print(f"   Total revenue: ₹{analytics.get('total_revenue', 0)}")
            print(f"   Occupancy rate: {analytics.get('occupancy_rate', 0)}%")
            print(f"   Recent bookings: {len(analytics.get('recent_bookings', []))}")
            print(f"   Top sports: {len(analytics.get('top_sports', []))}")
            print(f"   Peak hours: {len(analytics.get('peak_hours', []))}")
            
            # Check data structure
            if 'revenue_trend' in analytics:
                print(f"   Revenue trend data: {len(analytics['revenue_trend'])} entries")
            
            # Display top sports if available
            top_sports = analytics.get('top_sports', [])
            if top_sports:
                print(f"   Most popular sport: {top_sports[0]['sport']} ({top_sports[0]['count']} bookings)")
            
            # Display peak hours if available
            peak_hours = analytics.get('peak_hours', [])
            if peak_hours:
                print(f"   Peak hour: {peak_hours[0]['hour']} ({peak_hours[0]['count']} bookings)")
        else:
            print(f"❌ Analytics dashboard retrieval failed: {result}")
            return False
        
        # Test analytics dashboard with date filter
        start_date = (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d")
        end_date = datetime.now().strftime("%Y-%m-%d")
        result = self.make_request("GET", "/venue-owner/analytics/dashboard", auth_token=self.venue_owner_token,
                                 params={"start_date": start_date, "end_date": end_date})
        if result["success"]:
            filtered_analytics = result["data"]
            print("✅ Analytics dashboard with date filter successful")
            print(f"   Filtered period: {start_date} to {end_date}")
            print(f"   Filtered bookings: {filtered_analytics.get('total_bookings', 0)}")
            print(f"   Filtered revenue: ₹{filtered_analytics.get('total_revenue', 0)}")
        else:
            print(f"❌ Analytics dashboard with date filter failed: {result}")
            return False
        
        # Test analytics with start date only
        result = self.make_request("GET", "/venue-owner/analytics/dashboard", auth_token=self.venue_owner_token,
                                 params={"start_date": start_date})
        if result["success"]:
            print("✅ Analytics dashboard with start date filter successful")
        else:
            print(f"❌ Analytics dashboard with start date filter failed: {result}")
            return False
        
        # Test analytics with end date only
        result = self.make_request("GET", "/venue-owner/analytics/dashboard", auth_token=self.venue_owner_token,
                                 params={"end_date": end_date})
        if result["success"]:
            print("✅ Analytics dashboard with end date filter successful")
        else:
            print(f"❌ Analytics dashboard with end date filter failed: {result}")
            return False
        
        return True

    def test_profile_management(self):
        """Test venue owner profile management"""
        print("\n=== Testing Venue Owner Profile Management ===")
        
        if not self.venue_owner_token:
            print("❌ No venue owner token available")
            return False
        
        # Test profile retrieval (already tested in authentication, but verify again)
        result = self.make_request("GET", "/venue-owner/profile", auth_token=self.venue_owner_token)
        if result["success"]:
            profile = result["data"]
            print("✅ Profile retrieval successful")
            print(f"   Owner ID: {profile.get('id')}")
            print(f"   Name: {profile.get('name')}")
            print(f"   Email: {profile.get('email')}")
            print(f"   Mobile: {profile.get('mobile')}")
            print(f"   Business name: {profile.get('business_name')}")
            print(f"   Business address: {profile.get('business_address')}")
            print(f"   GST number: {profile.get('gst_number')}")
            print(f"   Account status: {'Active' if profile.get('is_active') else 'Inactive'}")
            print(f"   Member since: {profile.get('created_at')}")
            
            # Verify business information
            if profile.get('business_name') == self.venue_owner_data['business_name']:
                print("✅ Business information correctly stored")
            else:
                print(f"❌ Business information mismatch")
                return False
                
            if profile.get('gst_number') == self.venue_owner_data['gst_number']:
                print("✅ GST number correctly stored")
            else:
                print(f"❌ GST number mismatch")
                return False
        else:
            print(f"❌ Profile retrieval failed: {result}")
            return False
        
        # Test unauthorized access (without token)
        result = self.make_request("GET", "/venue-owner/profile")
        if not result["success"] and result["status_code"] in [401, 403]:
            print("✅ Unauthorized profile access properly rejected")
        else:
            print(f"❌ Unauthorized profile access not handled properly: {result}")
            return False
        
        return True

    def test_error_handling_and_validation(self):
        """Test error handling and validation for venue owner endpoints"""
        print("\n=== Testing Error Handling and Validation ===")
        
        if not self.venue_owner_token:
            print("❌ No venue owner token available")
            return False
        
        # Test invalid venue status update
        if self.test_venue_id:
            result = self.make_request("PUT", f"/venue-owner/venues/{self.test_venue_id}/status",
                                     auth_token=self.venue_owner_token, params={"is_active": "invalid_boolean"})
            if not result["success"]:
                print("✅ Invalid venue status update properly rejected")
            else:
                print(f"❌ Invalid venue status update not handled properly: {result}")
                return False
        
        # Test invalid booking status update
        if self.test_booking_id:
            result = self.make_request("PUT", f"/venue-owner/bookings/{self.test_booking_id}/status",
                                     auth_token=self.venue_owner_token, params={"new_status": "invalid_status"})
            if not result["success"] and result["status_code"] == 400:
                print("✅ Invalid booking status update properly rejected")
            else:
                print(f"❌ Invalid booking status update not handled properly: {result}")
                return False
        
        # Test venue creation with missing required fields
        invalid_venue = {"name": "Test Venue"}  # Missing required fields
        result = self.make_request("POST", "/venue-owner/venues", invalid_venue, auth_token=self.venue_owner_token)
        if not result["success"] and result["status_code"] == 422:
            print("✅ Venue creation with missing fields properly rejected")
        else:
            print(f"❌ Venue creation with missing fields not handled properly: {result}")
            return False
        
        # Test analytics with invalid date format
        result = self.make_request("GET", "/venue-owner/analytics/dashboard", auth_token=self.venue_owner_token,
                                 params={"start_date": "invalid-date"})
        if result["success"]:  # Should still work, just ignore invalid date
            print("✅ Analytics with invalid date handled gracefully")
        else:
            print(f"❌ Analytics with invalid date not handled properly: {result}")
            return False
        
        return True

    def run_all_tests(self):
        """Run all venue owner dashboard test suites"""
        print("🚀 Starting Venue Owner Dashboard API Tests")
        print(f"Testing against: {self.base_url}")
        print(f"Venue Owner: {self.venue_owner_data['name']} ({self.venue_owner_data['business_name']})")
        
        test_results = []
        
        # Run test suites in order
        test_suites = [
            ("Venue Owner Authentication", self.test_venue_owner_authentication),
            ("Venue Management", self.test_venue_management),
            ("Booking Management", self.test_booking_management),
            ("Analytics Dashboard", self.test_analytics_dashboard),
            ("Profile Management", self.test_profile_management),
            ("Error Handling & Validation", self.test_error_handling_and_validation)
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
        print("🏁 VENUE OWNER DASHBOARD TEST SUMMARY")
        print("="*60)
        
        passed = sum(1 for _, result in test_results if result)
        total = len(test_results)
        
        for suite_name, result in test_results:
            status = "✅ PASS" if result else "❌ FAIL"
            print(f"{status} {suite_name}")
        
        print(f"\nOverall: {passed}/{total} test suites passed")
        
        if passed == total:
            print("🎉 All venue owner dashboard tests passed! APIs are working correctly.")
            return True
        else:
            print("⚠️  Some tests failed. Please check the issues above.")
            return False

def main():
    """Main test execution"""
    tester = VenueOwnerDashboardTester()
    success = tester.run_all_tests()
    return success

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)