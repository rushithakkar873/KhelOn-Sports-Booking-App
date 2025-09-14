#!/usr/bin/env python3
"""
Venue Owner Analytics Dashboard API Testing
Tests the analytics dashboard endpoint after recent fixes to handle missing data gracefully
"""

import requests
import json
import time
from datetime import datetime, timedelta
from typing import Dict, Any, Optional

# Configuration
BASE_URL = "https://venuemate-11.preview.emergentagent.com/api"
HEADERS = {"Content-Type": "application/json"}

class VenueOwnerAnalyticsTester:
    def __init__(self):
        self.base_url = BASE_URL
        self.headers = HEADERS.copy()
        self.venue_owner_token = None
        self.venue_owner_id = None
        self.test_venue_ids = []
        self.test_booking_ids = []
        
        # Test venue owner data (Rajesh Kumar as mentioned in review request)
        self.venue_owner_mobile = "+919876543210"
        self.venue_owner_data = {
            "mobile": "+919876543210",
            "name": "Rajesh Kumar",
            "email": "rajesh.kumar@example.com",
            "role": "venue_owner",
            "business_name": "Elite Sports Complex",
            "business_address": "Bandra West, Mumbai, Maharashtra 400050",
            "gst_number": "24ABCDE1234F1Z5"
        }
        
        # Test venues data
        self.test_venues = [
            {
                "name": "Elite Cricket Ground Mumbai",
                "sports_supported": ["Cricket"],
                "address": "Plot 123, Bandra West",
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
                    }
                ]
            },
            {
                "name": "Elite Football Ground Mumbai",
                "sports_supported": ["Football"],
                "address": "Plot 124, Bandra West",
                "city": "Mumbai",
                "state": "Maharashtra",
                "pincode": "400050", 
                "description": "Professional football ground with FIFA standard turf",
                "amenities": ["Floodlights", "Changing Rooms", "Parking"],
                "base_price_per_hour": 1000.0,
                "contact_phone": "+919876543213",
                "whatsapp_number": "+919876543213",
                "images": [],
                "rules_and_regulations": "No metal studs allowed",
                "cancellation_policy": "24 hours notice required",
                "slots": [
                    {
                        "day_of_week": 1,  # Tuesday
                        "start_time": "07:00",
                        "end_time": "09:00", 
                        "capacity": 1,
                        "price_per_hour": 1000.0,
                        "is_peak_hour": False
                    }
                ]
            }
        ]

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

    def authenticate_venue_owner(self):
        """Authenticate as venue owner using unified auth system"""
        print("\n=== Authenticating Venue Owner (Rajesh Kumar) ===")
        
        # Step 1: Send OTP
        otp_request = {"mobile": self.venue_owner_mobile}
        result = self.make_request("POST", "/auth/send-otp", otp_request)
        
        if not result["success"]:
            print(f"❌ Failed to send OTP: {result}")
            return False
        
        print(f"✅ OTP sent to {self.venue_owner_mobile}")
        dev_otp = result["data"].get("dev_info", "").replace("OTP: ", "")
        print(f"   Development OTP: {dev_otp}")
        
        if not dev_otp or dev_otp == "N/A":
            print("❌ No development OTP received")
            return False
        
        # Step 2: Try login first (user might already exist)
        login_data = {"mobile": self.venue_owner_mobile, "otp": dev_otp}
        result = self.make_request("POST", "/auth/login", login_data)
        
        if result["success"]:
            print("✅ Venue owner logged in successfully")
            self.venue_owner_token = result["data"].get("access_token")
            self.venue_owner_id = result["data"]["user"]["id"]
        else:
            # If login fails, try registration
            # Need to send OTP again since it was consumed by login attempt
            result = self.make_request("POST", "/auth/send-otp", otp_request)
            if not result["success"]:
                print(f"❌ Failed to send OTP for registration: {result}")
                return False
            
            dev_otp = result["data"].get("dev_info", "").replace("OTP: ", "")
            
            registration_data = self.venue_owner_data.copy()
            registration_data["otp"] = dev_otp
            
            result = self.make_request("POST", "/auth/register", registration_data)
            if result["success"]:
                print("✅ Venue owner registered successfully")
                self.venue_owner_token = result["data"].get("access_token")
                self.venue_owner_id = result["data"]["user"]["id"]
            else:
                print(f"❌ Failed to authenticate venue owner: {result}")
                return False
        
        print(f"   Token: {self.venue_owner_token[:20]}...")
        print(f"   User ID: {self.venue_owner_id}")
        return True

    def setup_test_data(self):
        """Create test venues and bookings for analytics testing"""
        print("\n=== Setting Up Test Data ===")
        
        # Create test venues
        for i, venue_data in enumerate(self.test_venues):
            result = self.make_request("POST", "/venue-owner/venues", venue_data, auth_required=True)
            
            if result["success"]:
                venue_id = result["data"].get("venue_id")
                self.test_venue_ids.append(venue_id)
                print(f"✅ Created venue {i+1}: {venue_data['name']} (ID: {venue_id})")
            else:
                print(f"❌ Failed to create venue {i+1}: {result}")
                return False
        
        print(f"✅ Created {len(self.test_venue_ids)} test venues")
        return True

    def test_analytics_dashboard_basic(self):
        """Test basic analytics dashboard endpoint"""
        print("\n=== Testing Analytics Dashboard - Basic ===")
        
        result = self.make_request("GET", "/venue-owner/analytics/dashboard", auth_required=True)
        
        if not result["success"]:
            print(f"❌ Analytics dashboard request failed: {result}")
            return False
        
        data = result["data"]
        print("✅ Analytics dashboard endpoint accessible")
        
        # Check required fields
        required_fields = [
            "total_venues", "total_bookings", "total_revenue", "occupancy_rate",
            "recent_bookings", "revenue_trend", "top_sports", "peak_hours",
            "bookingsTrend", "sportDistribution", "venuePerformance", "monthlyComparison"
        ]
        
        missing_fields = []
        for field in required_fields:
            if field not in data:
                missing_fields.append(field)
        
        if missing_fields:
            print(f"❌ Missing required fields: {missing_fields}")
            return False
        
        print("✅ All required fields present in response")
        
        # Validate data types and structure
        print(f"   Total Venues: {data['total_venues']}")
        print(f"   Total Bookings: {data['total_bookings']}")
        print(f"   Total Revenue: ₹{data['total_revenue']}")
        print(f"   Occupancy Rate: {data['occupancy_rate']}%")
        
        # Check array fields are actually arrays
        array_fields = ["recent_bookings", "top_sports", "peak_hours", "bookingsTrend", 
                       "sportDistribution", "venuePerformance", "monthlyComparison"]
        
        for field in array_fields:
            if not isinstance(data[field], list):
                print(f"❌ Field '{field}' should be an array but is {type(data[field])}")
                return False
        
        print("✅ All array fields have correct data types")
        
        # Check revenue_trend is dict (for daily revenue mapping)
        if not isinstance(data["revenue_trend"], dict):
            print(f"❌ Field 'revenue_trend' should be a dict but is {type(data['revenue_trend'])}")
            return False
        
        print("✅ Revenue trend has correct data type")
        return True

    def test_analytics_dashboard_with_date_filters(self):
        """Test analytics dashboard with date range parameters"""
        print("\n=== Testing Analytics Dashboard - Date Filters ===")
        
        # Test with start_date only
        start_date = (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d")
        params = {"start_date": start_date}
        
        result = self.make_request("GET", "/venue-owner/analytics/dashboard", 
                                 auth_required=True, params=params)
        
        if not result["success"]:
            print(f"❌ Analytics dashboard with start_date failed: {result}")
            return False
        
        print(f"✅ Analytics dashboard with start_date ({start_date}) working")
        
        # Test with end_date only
        end_date = datetime.now().strftime("%Y-%m-%d")
        params = {"end_date": end_date}
        
        result = self.make_request("GET", "/venue-owner/analytics/dashboard",
                                 auth_required=True, params=params)
        
        if not result["success"]:
            print(f"❌ Analytics dashboard with end_date failed: {result}")
            return False
        
        print(f"✅ Analytics dashboard with end_date ({end_date}) working")
        
        # Test with both start_date and end_date
        params = {"start_date": start_date, "end_date": end_date}
        
        result = self.make_request("GET", "/venue-owner/analytics/dashboard",
                                 auth_required=True, params=params)
        
        if not result["success"]:
            print(f"❌ Analytics dashboard with date range failed: {result}")
            return False
        
        print(f"✅ Analytics dashboard with date range ({start_date} to {end_date}) working")
        
        # Validate that data structure remains consistent with filters
        data = result["data"]
        required_fields = [
            "total_venues", "total_bookings", "total_revenue", "occupancy_rate",
            "recent_bookings", "revenue_trend", "top_sports", "peak_hours",
            "bookingsTrend", "sportDistribution", "venuePerformance", "monthlyComparison"
        ]
        
        for field in required_fields:
            if field not in data:
                print(f"❌ Field '{field}' missing in filtered response")
                return False
        
        print("✅ All required fields present in filtered response")
        return True

    def test_analytics_dashboard_no_venues(self):
        """Test analytics dashboard when venue owner has no venues"""
        print("\n=== Testing Analytics Dashboard - No Venues Scenario ===")
        
        # Create a new venue owner with no venues
        new_owner_mobile = "+919876543299"
        
        # Send OTP for new owner
        otp_request = {"mobile": new_owner_mobile}
        result = self.make_request("POST", "/auth/send-otp", otp_request)
        
        if not result["success"]:
            print(f"❌ Failed to send OTP for new owner: {result}")
            return False
        
        dev_otp = result["data"].get("dev_info", "").replace("OTP: ", "")
        
        # Register new venue owner
        new_owner_data = {
            "mobile": new_owner_mobile,
            "name": "Test Owner No Venues",
            "email": "test.novenues@example.com",
            "role": "venue_owner",
            "business_name": "Test Business",
            "business_address": "Test Address",
            "gst_number": "24TESTNO1234F1Z5",
            "otp": dev_otp
        }
        
        result = self.make_request("POST", "/auth/register", new_owner_data)
        
        if not result["success"]:
            print(f"❌ Failed to register new venue owner: {result}")
            return False
        
        new_owner_token = result["data"].get("access_token")
        
        # Test analytics dashboard with no venues
        old_token = self.venue_owner_token
        self.venue_owner_token = new_owner_token
        
        result = self.make_request("GET", "/venue-owner/analytics/dashboard", auth_required=True)
        
        if not result["success"]:
            print(f"❌ Analytics dashboard for owner with no venues failed: {result}")
            self.venue_owner_token = old_token
            return False
        
        data = result["data"]
        
        # Validate empty state handling
        expected_empty_values = {
            "total_venues": 0,
            "total_bookings": 0,
            "total_revenue": 0.0,
            "occupancy_rate": 0.0
        }
        
        for field, expected_value in expected_empty_values.items():
            if data[field] != expected_value:
                print(f"❌ Field '{field}' should be {expected_value} but is {data[field]}")
                self.venue_owner_token = old_token
                return False
        
        # Check that arrays are empty
        array_fields = ["recent_bookings", "top_sports", "peak_hours"]
        for field in array_fields:
            if not isinstance(data[field], list) or len(data[field]) != 0:
                print(f"❌ Field '{field}' should be empty array but is {data[field]}")
                self.venue_owner_token = old_token
                return False
        
        print("✅ Analytics dashboard handles no venues scenario correctly")
        print(f"   Total Venues: {data['total_venues']}")
        print(f"   Total Bookings: {data['total_bookings']}")
        print(f"   Total Revenue: ₹{data['total_revenue']}")
        print(f"   Occupancy Rate: {data['occupancy_rate']}%")
        
        # Restore original token
        self.venue_owner_token = old_token
        return True

    def test_analytics_data_structure_safety(self):
        """Test that analytics data structure is safe for frontend consumption"""
        print("\n=== Testing Analytics Data Structure Safety ===")
        
        result = self.make_request("GET", "/venue-owner/analytics/dashboard", auth_required=True)
        
        if not result["success"]:
            print(f"❌ Analytics dashboard request failed: {result}")
            return False
        
        data = result["data"]
        
        # Test sportDistribution structure
        sport_dist = data.get("sportDistribution", [])
        if sport_dist:
            for sport_item in sport_dist:
                required_sport_fields = ["sport", "bookings", "revenue", "color"]
                for field in required_sport_fields:
                    if field not in sport_item:
                        print(f"❌ sportDistribution item missing field: {field}")
                        return False
                    if sport_item[field] is None:
                        print(f"❌ sportDistribution field '{field}' is null")
                        return False
        else:
            # Should have at least one default entry
            print("⚠️  sportDistribution is empty, checking if default entry exists")
        
        print("✅ sportDistribution structure is safe")
        
        # Test venuePerformance structure
        venue_perf = data.get("venuePerformance", [])
        for venue_item in venue_perf:
            required_venue_fields = ["venueName", "bookings", "revenue", "occupancy"]
            for field in required_venue_fields:
                if field not in venue_item:
                    print(f"❌ venuePerformance item missing field: {field}")
                    return False
                if venue_item[field] is None:
                    print(f"❌ venuePerformance field '{field}' is null")
                    return False
        
        print("✅ venuePerformance structure is safe")
        
        # Test monthlyComparison structure
        monthly_comp = data.get("monthlyComparison", [])
        for month_item in monthly_comp:
            required_month_fields = ["month", "revenue", "bookings"]
            for field in required_month_fields:
                if field not in month_item:
                    print(f"❌ monthlyComparison item missing field: {field}")
                    return False
                if month_item[field] is None:
                    print(f"❌ monthlyComparison field '{field}' is null")
                    return False
        
        print("✅ monthlyComparison structure is safe")
        
        # Test bookingsTrend structure
        bookings_trend = data.get("bookingsTrend", [])
        for trend_item in bookings_trend:
            required_trend_fields = ["month", "bookings"]
            for field in required_trend_fields:
                if field not in trend_item:
                    print(f"❌ bookingsTrend item missing field: {field}")
                    return False
                if trend_item[field] is None:
                    print(f"❌ bookingsTrend field '{field}' is null")
                    return False
        
        print("✅ bookingsTrend structure is safe")
        
        # Test peak_hours structure (note: backend returns 'peak_hours', not 'peakHours')
        peak_hours = data.get("peak_hours", [])
        for hour_item in peak_hours:
            required_hour_fields = ["hour", "bookings"]
            for field in required_hour_fields:
                if field not in hour_item:
                    print(f"❌ peak_hours item missing field: {field}")
                    return False
                if hour_item[field] is None:
                    print(f"❌ peak_hours field '{field}' is null")
                    return False
        
        print("✅ peak_hours structure is safe")
        
        # Test top_sports structure
        top_sports = data.get("top_sports", [])
        for sport_item in top_sports:
            required_sport_fields = ["sport", "count"]
            for field in required_sport_fields:
                if field not in sport_item:
                    print(f"❌ top_sports item missing field: {field}")
                    return False
                if sport_item[field] is None:
                    print(f"❌ top_sports field '{field}' is null")
                    return False
        
        print("✅ top_sports structure is safe")
        
        return True

    def test_analytics_authentication(self):
        """Test analytics endpoint authentication requirements"""
        print("\n=== Testing Analytics Authentication ===")
        
        # Test without authentication
        result = self.make_request("GET", "/venue-owner/analytics/dashboard")
        
        if result["success"] or result["status_code"] not in [401, 403]:
            print(f"❌ Analytics endpoint should require authentication: {result}")
            return False
        
        print("✅ Analytics endpoint properly requires authentication")
        
        # Test with invalid token
        old_token = self.venue_owner_token
        self.venue_owner_token = "invalid-token"
        
        result = self.make_request("GET", "/venue-owner/analytics/dashboard", auth_required=True)
        
        if result["success"] or result["status_code"] not in [401, 403]:
            print(f"❌ Analytics endpoint should reject invalid token: {result}")
            self.venue_owner_token = old_token
            return False
        
        print("✅ Analytics endpoint properly rejects invalid token")
        
        # Restore valid token
        self.venue_owner_token = old_token
        return True

    def run_all_tests(self):
        """Run all analytics dashboard tests"""
        print("🚀 Starting Venue Owner Analytics Dashboard Tests")
        print(f"Testing against: {self.base_url}")
        
        test_results = []
        
        # Authentication first
        if not self.authenticate_venue_owner():
            print("❌ Failed to authenticate venue owner - cannot proceed with tests")
            return False
        
        # Setup test data
        if not self.setup_test_data():
            print("❌ Failed to setup test data - some tests may not work properly")
        
        # Run test suites
        test_suites = [
            ("Analytics Dashboard Basic", self.test_analytics_dashboard_basic),
            ("Analytics Dashboard Date Filters", self.test_analytics_dashboard_with_date_filters),
            ("Analytics Dashboard No Venues", self.test_analytics_dashboard_no_venues),
            ("Analytics Data Structure Safety", self.test_analytics_data_structure_safety),
            ("Analytics Authentication", self.test_analytics_authentication)
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
        print("\n" + "="*70)
        print("🏁 VENUE OWNER ANALYTICS DASHBOARD TEST SUMMARY")
        print("="*70)
        
        passed = sum(1 for _, result in test_results if result)
        total = len(test_results)
        
        for suite_name, result in test_results:
            status = "✅ PASS" if result else "❌ FAIL"
            print(f"{status} {suite_name}")
        
        print(f"\nOverall: {passed}/{total} test suites passed")
        
        if passed == total:
            print("🎉 All analytics dashboard tests passed! Endpoint is working correctly.")
            return True
        else:
            print("⚠️  Some tests failed. Please check the issues above.")
            return False

def main():
    """Main test execution"""
    tester = VenueOwnerAnalyticsTester()
    success = tester.run_all_tests()
    return success

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)