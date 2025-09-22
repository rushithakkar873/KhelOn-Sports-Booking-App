#!/usr/bin/env python3
"""
KhelON Backend Testing Suite - Arena-Based System
Testing major backend modifications for multiple sports arenas per venue
"""

import requests
import json
import time
from datetime import datetime, timedelta

# Configuration
BASE_URL = "http://localhost:8001/api"
VENUE_OWNER_MOBILE = "+919876543210"
PLAYER_MOBILE_1 = "+919888777666"
PLAYER_MOBILE_2 = "+919999888777"

class KhelOnTester:
    def __init__(self):
        self.venue_owner_token = None
        self.venue_id = None
        self.arena_ids = []
        self.booking_ids = []
        
    def log(self, message, status="INFO"):
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {status}: {message}")
    
    def make_request(self, method, endpoint, data=None, headers=None, params=None):
        """Make HTTP request with error handling"""
        url = f"{BASE_URL}{endpoint}"
        
        try:
            if method.upper() == "GET":
                response = requests.get(url, headers=headers, params=params)
            elif method.upper() == "POST":
                response = requests.post(url, json=data, headers=headers, params=params)
            elif method.upper() == "PUT":
                response = requests.put(url, json=data, headers=headers, params=params)
            else:
                raise ValueError(f"Unsupported method: {method}")
            
            return response
        except requests.exceptions.RequestException as e:
            self.log(f"Request failed: {str(e)}", "ERROR")
            return None
    
    def test_1_health_check(self):
        """Test 1: Basic Health Check - should return KhelON API status"""
        self.log("Testing basic health check...")
        
        response = self.make_request("GET", "/")
        if not response:
            return False
            
        if response.status_code == 200:
            data = response.json()
            if "KhelOn" in data.get("message", "") and data.get("status") == "running":
                self.log("✅ Health check passed - KhelON branding confirmed", "SUCCESS")
                return True
            else:
                self.log(f"❌ Health check failed - Unexpected response: {data}", "ERROR")
                return False
        else:
            self.log(f"❌ Health check failed - Status: {response.status_code}", "ERROR")
            return False
    
    def test_2_venue_owner_auth(self):
        """Test 2: Venue Owner Authentication with Mobile OTP"""
        self.log("Testing venue owner authentication...")
        
        # Step 1: Send OTP
        otp_data = {"mobile": VENUE_OWNER_MOBILE}
        response = self.make_request("POST", "/auth/send-otp", otp_data)
        
        if not response or response.status_code != 200:
            self.log(f"❌ Send OTP failed - Status: {response.status_code if response else 'No response'}", "ERROR")
            return False
        
        otp_response = response.json()
        dev_otp = otp_response.get("dev_info", "").split("OTP: ")[-1]
        
        # Step 2: Login with OTP
        login_data = {"mobile": VENUE_OWNER_MOBILE, "otp": dev_otp}
        response = self.make_request("POST", "/auth/login", login_data)
        
        if response and response.status_code == 200:
            login_response = response.json()
            self.venue_owner_token = login_response.get("access_token")
            user_data = login_response.get("user", {})
            
            if user_data.get("role") == "venue_owner":
                self.log("✅ Venue owner authentication successful", "SUCCESS")
                return True
            else:
                self.log(f"❌ Wrong user role: {user_data.get('role')}", "ERROR")
                return False
        else:
            self.log(f"❌ Login failed - Status: {response.status_code if response else 'No response'}", "ERROR")
            return False
    
    def test_3_venue_creation_with_arenas(self):
        """Test 3: Venue Creation with Multiple Arenas (Cricket + Football)"""
        self.log("Testing venue creation with multiple arenas...")
        
        if not self.venue_owner_token:
            self.log("❌ No venue owner token available", "ERROR")
            return False
        
        headers = {"Authorization": f"Bearer {self.venue_owner_token}"}
        
        # Create venue with multiple arenas
        venue_data = {
            "name": "Elite Sports Complex Mumbai",
            "sports_supported": ["Cricket", "Football"],
            "address": "123 Sports Avenue, Andheri West",
            "city": "Mumbai",
            "state": "Maharashtra",
            "pincode": "400058",
            "description": "Premium sports facility with multiple arenas",
            "amenities": ["Parking", "Changing Rooms", "Cafeteria", "First Aid"],
            "base_price_per_hour": 1000.0,
            "contact_phone": "+919876543210",
            "whatsapp_number": "+919876543210",
            "images": ["https://example.com/venue1.jpg"],
            "rules_and_regulations": "No smoking, proper sports attire required",
            "cancellation_policy": "24 hours advance notice required",
            "arenas": [
                {
                    "name": "Cricket Ground A",
                    "sport": "Cricket",
                    "capacity": 2,
                    "description": "Professional cricket ground with turf wicket",
                    "amenities": ["Turf Wicket", "Floodlights", "Scoreboard"],
                    "base_price_per_hour": 1200.0,
                    "images": ["https://example.com/cricket1.jpg"],
                    "slots": [
                        {
                            "day_of_week": 0,  # Monday
                            "start_time": "06:00",
                            "end_time": "08:00",
                            "capacity": 1,
                            "price_per_hour": 1200.0,
                            "is_peak_hour": False
                        },
                        {
                            "day_of_week": 0,  # Monday
                            "start_time": "18:00",
                            "end_time": "20:00",
                            "capacity": 1,
                            "price_per_hour": 1500.0,
                            "is_peak_hour": True
                        },
                        {
                            "day_of_week": 5,  # Saturday
                            "start_time": "08:00",
                            "end_time": "10:00",
                            "capacity": 1,
                            "price_per_hour": 1500.0,
                            "is_peak_hour": True
                        }
                    ],
                    "is_active": True
                },
                {
                    "name": "Football Field",
                    "sport": "Football",
                    "capacity": 1,
                    "description": "Full-size football field with artificial turf",
                    "amenities": ["Artificial Turf", "Goals", "Floodlights"],
                    "base_price_per_hour": 800.0,
                    "images": ["https://example.com/football1.jpg"],
                    "slots": [
                        {
                            "day_of_week": 0,  # Monday
                            "start_time": "18:00",
                            "end_time": "20:00",
                            "capacity": 1,
                            "price_per_hour": 800.0,
                            "is_peak_hour": False
                        },
                        {
                            "day_of_week": 1,  # Tuesday
                            "start_time": "19:00",
                            "end_time": "21:00",
                            "capacity": 1,
                            "price_per_hour": 900.0,
                            "is_peak_hour": True
                        }
                    ],
                    "is_active": True
                }
            ]
        }
        
        response = self.make_request("POST", "/venue-owner/venues", venue_data, headers)
        
        if response and response.status_code == 200:
            result = response.json()
            self.venue_id = result.get("venue_id")
            self.log(f"✅ Venue created successfully with ID: {self.venue_id}", "SUCCESS")
            return True
        else:
            error_msg = response.json().get("detail", "Unknown error") if response else "No response"
            self.log(f"❌ Venue creation failed - {error_msg}", "ERROR")
            return False
    
    def test_4_arena_listing(self):
        """Test 4: Arena Listing - GET /api/venue-owner/venues/{venue_id}/arenas"""
        self.log("Testing arena listing endpoint...")
        
        if not self.venue_owner_token or not self.venue_id:
            self.log("❌ Missing venue owner token or venue ID", "ERROR")
            return False
        
        headers = {"Authorization": f"Bearer {self.venue_owner_token}"}
        endpoint = f"/venue-owner/venues/{self.venue_id}/arenas"
        
        response = self.make_request("GET", endpoint, headers=headers)
        
        if response and response.status_code == 200:
            data = response.json()
            arenas = data.get("arenas", [])
            
            if len(arenas) >= 2:
                # Store arena IDs for later tests
                self.arena_ids = [arena["id"] for arena in arenas]
                
                # Verify arena details
                cricket_arena = next((a for a in arenas if a["sport"] == "Cricket"), None)
                football_arena = next((a for a in arenas if a["sport"] == "Football"), None)
                
                if cricket_arena and football_arena:
                    self.log(f"✅ Arena listing successful - Found {len(arenas)} arenas", "SUCCESS")
                    self.log(f"   Cricket Arena: {cricket_arena['name']} (₹{cricket_arena['base_price_per_hour']}/hr)")
                    self.log(f"   Football Arena: {football_arena['name']} (₹{football_arena['base_price_per_hour']}/hr)")
                    return True
                else:
                    self.log("❌ Missing expected arenas (Cricket/Football)", "ERROR")
                    return False
            else:
                self.log(f"❌ Expected at least 2 arenas, got {len(arenas)}", "ERROR")
                return False
        else:
            error_msg = response.json().get("detail", "Unknown error") if response else "No response"
            self.log(f"❌ Arena listing failed - {error_msg}", "ERROR")
            return False
    
    def test_5_booking_creation_with_arena(self):
        """Test 5: Booking Creation with Arena ID"""
        self.log("Testing booking creation with arena ID...")
        
        if not self.venue_owner_token or not self.venue_id or not self.arena_ids:
            self.log("❌ Missing required data for booking test", "ERROR")
            return False
        
        headers = {"Authorization": f"Bearer {self.venue_owner_token}"}
        
        # Create booking for Cricket arena
        tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
        
        booking_data = {
            "venue_id": self.venue_id,
            "arena_id": self.arena_ids[0],  # First arena (Cricket)
            "player_mobile": PLAYER_MOBILE_1,
            "player_name": "Arjun Patel",
            "booking_date": tomorrow,
            "start_time": "18:00",
            "end_time": "20:00",
            "sport": "Cricket",
            "notes": "Evening practice session"
        }
        
        response = self.make_request("POST", "/venue-owner/bookings", booking_data, headers)
        
        if response and response.status_code == 200:
            result = response.json()
            booking_id = result.get("booking_id")
            total_amount = result.get("total_amount")
            
            if booking_id:
                self.booking_ids.append(booking_id)
                self.log(f"✅ Booking created successfully - ID: {booking_id}, Amount: ₹{total_amount}", "SUCCESS")
                return True
            else:
                self.log("❌ Booking creation failed - No booking ID returned", "ERROR")
                return False
        else:
            error_msg = response.json().get("detail", "Unknown error") if response else "No response"
            self.log(f"❌ Booking creation failed - {error_msg}", "ERROR")
            return False
    
    def test_6_arena_specific_conflict_detection(self):
        """Test 6: Arena-Specific Conflict Detection"""
        self.log("Testing arena-specific conflict detection...")
        
        if not self.venue_owner_token or not self.venue_id or len(self.arena_ids) < 2:
            self.log("❌ Missing required data for conflict test", "ERROR")
            return False
        
        headers = {"Authorization": f"Bearer {self.venue_owner_token}"}
        tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
        
        # Test 1: Try to book same arena at same time (should fail)
        self.log("  Testing same arena conflict...")
        conflict_booking = {
            "venue_id": self.venue_id,
            "arena_id": self.arena_ids[0],  # Same arena as previous booking
            "player_mobile": PLAYER_MOBILE_2,
            "player_name": "Rahul Verma",
            "booking_date": tomorrow,
            "start_time": "18:00",  # Same time as previous booking
            "end_time": "20:00",
            "sport": "Cricket"
        }
        
        response = self.make_request("POST", "/venue-owner/bookings", conflict_booking, headers)
        
        if response and response.status_code == 409:  # Conflict expected
            self.log("✅ Same arena conflict detection working", "SUCCESS")
        else:
            self.log(f"❌ Same arena conflict detection failed - Status: {response.status_code if response else 'No response'}", "ERROR")
            return False
        
        # Test 2: Book different arena at same time (should succeed)
        self.log("  Testing different arena booking...")
        different_arena_booking = {
            "venue_id": self.venue_id,
            "arena_id": self.arena_ids[1],  # Different arena (Football)
            "player_mobile": PLAYER_MOBILE_2,
            "player_name": "Rahul Verma",
            "booking_date": tomorrow,
            "start_time": "18:00",  # Same time but different arena
            "end_time": "20:00",
            "sport": "Football"
        }
        
        response = self.make_request("POST", "/venue-owner/bookings", different_arena_booking, headers)
        
        if response and response.status_code == 200:
            result = response.json()
            booking_id = result.get("booking_id")
            self.booking_ids.append(booking_id)
            self.log("✅ Different arena booking successful - Arena-specific conflict detection working", "SUCCESS")
            return True
        else:
            error_msg = response.json().get("detail", "Unknown error") if response else "No response"
            self.log(f"❌ Different arena booking failed - {error_msg}", "ERROR")
            return False
    
    def test_7_analytics_dashboard(self):
        """Test 7: Analytics Dashboard with Arena-Based Calculations"""
        self.log("Testing analytics dashboard with arena-based calculations...")
        
        if not self.venue_owner_token:
            self.log("❌ No venue owner token available", "ERROR")
            return False
        
        headers = {"Authorization": f"Bearer {self.venue_owner_token}"}
        
        response = self.make_request("GET", "/venue-owner/analytics/dashboard", headers=headers)
        
        if response and response.status_code == 200:
            data = response.json()
            
            # Verify required fields
            required_fields = [
                "total_venues", "total_bookings", "total_revenue", "occupancy_rate",
                "recent_bookings", "revenue_trend", "top_sports", "peak_hours"
            ]
            
            missing_fields = [field for field in required_fields if field not in data]
            if missing_fields:
                self.log(f"❌ Analytics missing fields: {missing_fields}", "ERROR")
                return False
            
            # Verify arena-based calculations
            total_venues = data.get("total_venues", 0)
            total_bookings = data.get("total_bookings", 0)
            occupancy_rate = data.get("occupancy_rate", 0)
            
            if total_venues > 0 and total_bookings >= len(self.booking_ids):
                self.log(f"✅ Analytics dashboard working - Venues: {total_venues}, Bookings: {total_bookings}, Occupancy: {occupancy_rate}%", "SUCCESS")
                
                # Check sport distribution
                sport_distribution = data.get("sportDistribution", [])
                if sport_distribution:
                    sports = [item["sport"] for item in sport_distribution]
                    self.log(f"   Sports tracked: {sports}")
                
                return True
            else:
                self.log(f"❌ Analytics data inconsistent - Venues: {total_venues}, Bookings: {total_bookings}", "ERROR")
                return False
        else:
            error_msg = response.json().get("detail", "Unknown error") if response else "No response"
            self.log(f"❌ Analytics dashboard failed - {error_msg}", "ERROR")
            return False
    
    def test_8_backward_compatibility(self):
        """Test 8: Backward Compatibility with Existing Venues"""
        self.log("Testing backward compatibility...")
        
        if not self.venue_owner_token:
            self.log("❌ No venue owner token available", "ERROR")
            return False
        
        headers = {"Authorization": f"Bearer {self.venue_owner_token}"}
        
        # Get all venues to check if old format is handled
        response = self.make_request("GET", "/venue-owner/venues", headers=headers)
        
        if response and response.status_code == 200:
            venues = response.json()
            
            if venues:
                # Check if venues have arenas field
                venue = venues[0]
                if "arenas" in venue and isinstance(venue["arenas"], list):
                    self.log("✅ Backward compatibility working - Venues have arenas field", "SUCCESS")
                    return True
                else:
                    self.log("❌ Backward compatibility issue - Missing arenas field", "ERROR")
                    return False
            else:
                self.log("⚠️ No venues found for backward compatibility test", "WARNING")
                return True
        else:
            error_msg = response.json().get("detail", "Unknown error") if response else "No response"
            self.log(f"❌ Backward compatibility test failed - {error_msg}", "ERROR")
            return False
    
    def run_all_tests(self):
        """Run all tests in sequence"""
        self.log("=" * 60)
        self.log("KHELON BACKEND TESTING SUITE - ARENA-BASED SYSTEM")
        self.log("=" * 60)
        
        tests = [
            ("Health Check", self.test_1_health_check),
            ("Venue Owner Authentication", self.test_2_venue_owner_auth),
            ("Venue Creation with Arenas", self.test_3_venue_creation_with_arenas),
            ("Arena Listing", self.test_4_arena_listing),
            ("Booking Creation with Arena", self.test_5_booking_creation_with_arena),
            ("Arena-Specific Conflict Detection", self.test_6_arena_specific_conflict_detection),
            ("Analytics Dashboard", self.test_7_analytics_dashboard),
            ("Backward Compatibility", self.test_8_backward_compatibility)
        ]
        
        passed = 0
        failed = 0
        
        for test_name, test_func in tests:
            self.log(f"\n--- Running: {test_name} ---")
            try:
                if test_func():
                    passed += 1
                else:
                    failed += 1
            except Exception as e:
                self.log(f"❌ {test_name} crashed: {str(e)}", "ERROR")
                failed += 1
            
            time.sleep(1)  # Brief pause between tests
        
        # Summary
        self.log("\n" + "=" * 60)
        self.log("TEST SUMMARY")
        self.log("=" * 60)
        self.log(f"✅ PASSED: {passed}")
        self.log(f"❌ FAILED: {failed}")
        self.log(f"📊 SUCCESS RATE: {(passed/(passed+failed)*100):.1f}%")
        
        if failed == 0:
            self.log("🎉 ALL TESTS PASSED! Arena-based system is working correctly.", "SUCCESS")
        else:
            self.log(f"⚠️ {failed} test(s) failed. Please review the issues above.", "WARNING")
        
        return failed == 0

if __name__ == "__main__":
    tester = KhelOnTester()
    success = tester.run_all_tests()
    exit(0 if success else 1)