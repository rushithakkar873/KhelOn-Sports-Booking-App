#!/usr/bin/env python3
"""
Enhanced Venue Partner Registration Flow Testing
Tests the updated venue partner registration with automatic venue creation
"""

import requests
import json
import time
from datetime import datetime

# Test Configuration
BASE_URL = "http://localhost:8001/api"
HEADERS = {"Content-Type": "application/json"}

# Test Data - Realistic Indian venue partner data
VENUE_OWNER_DATA = {
    "mobile": "+919876543210",
    "name": "Rajesh Kumar",
    "email": "rajesh.kumar@elitesports.com",
    "role": "venue_partner",
    "business_name": "Elite Sports Complex",
    "business_address": "123 Sports Avenue, Andheri West, Mumbai",
    "gst_number": "27ABCDE1234F1Z5",
    "venue_name": "Elite Cricket & Football Ground",
    "venue_address": "456 Ground Road, Andheri West, Mumbai",
    "venue_city": "Mumbai",
    "venue_state": "Maharashtra", 
    "venue_pincode": "400058",
    "venue_description": "Premium sports facility with cricket and football grounds, modern amenities and professional coaching",
    "venue_amenities": ["Parking", "Washroom", "Floodlights", "Seating"],
    "base_price_per_hour": 1200.0,
    "contact_phone": "+919876543210",
    "whatsapp_number": "+919876543210"
}

class TestResults:
    def __init__(self):
        self.tests_run = 0
        self.tests_passed = 0
        self.tests_failed = 0
        self.failures = []
        
    def add_result(self, test_name, passed, message=""):
        self.tests_run += 1
        if passed:
            self.tests_passed += 1
            print(f"✅ {test_name}")
        else:
            self.tests_failed += 1
            self.failures.append(f"{test_name}: {message}")
            print(f"❌ {test_name}: {message}")
    
    def print_summary(self):
        print(f"\n{'='*60}")
        print(f"TEST SUMMARY")
        print(f"{'='*60}")
        print(f"Total Tests: {self.tests_run}")
        print(f"Passed: {self.tests_passed}")
        print(f"Failed: {self.tests_failed}")
        
        if self.failures:
            print(f"\nFAILURES:")
            for failure in self.failures:
                print(f"  - {failure}")

def test_api_health():
    """Test API health and branding"""
    results = TestResults()
    
    try:
        response = requests.get(f"{BASE_URL}/", headers=HEADERS)
        if response.status_code == 200:
            data = response.json()
            results.add_result(
                "API Health Check", 
                data.get("message") == "KhelOn API v2.0.0 - Unified Auth System",
                f"Expected KhelOn API v2.0.0, got: {data.get('message')}"
            )
        else:
            results.add_result("API Health Check", False, f"Status: {response.status_code}")
    except Exception as e:
        results.add_result("API Health Check", False, str(e))
    
    return results

def test_send_otp():
    """Test OTP sending functionality"""
    results = TestResults()
    
    try:
        # Test valid Indian mobile number
        response = requests.post(
            f"{BASE_URL}/auth/send-otp",
            headers=HEADERS,
            json={"mobile": VENUE_OWNER_DATA["mobile"]}
        )
        
        if response.status_code == 200:
            data = response.json()
            results.add_result(
                "Send OTP - Valid Mobile",
                data.get("success") == True and "dev_info" in data,
                f"Response: {data}"
            )
            # Store OTP for later use
            global TEST_OTP
            TEST_OTP = data.get("dev_info", "").replace("OTP: ", "")
        else:
            results.add_result("Send OTP - Valid Mobile", False, f"Status: {response.status_code}, Response: {response.text}")
        
        # Test invalid mobile number format
        response = requests.post(
            f"{BASE_URL}/auth/send-otp",
            headers=HEADERS,
            json={"mobile": "9876543210"}  # Missing +91
        )
        
        results.add_result(
            "Send OTP - Invalid Mobile Format",
            response.status_code == 422,  # Validation error
            f"Expected 422, got: {response.status_code}"
        )
        
    except Exception as e:
        results.add_result("Send OTP Tests", False, str(e))
    
    return results

def test_otp_verification():
    """Test OTP verification"""
    results = TestResults()
    
    try:
        # Test correct OTP
        response = requests.post(
            f"{BASE_URL}/auth/verify-otp",
            headers=HEADERS,
            json={
                "mobile": VENUE_OWNER_DATA["mobile"],
                "otp": TEST_OTP
            }
        )
        
        # Note: This will consume the OTP, so we need to send a new one for registration
        if response.status_code == 200:
            data = response.json()
            results.add_result(
                "Verify OTP - Correct Code",
                data.get("success") == True,
                f"Response: {data}"
            )
        else:
            results.add_result("Verify OTP - Correct Code", False, f"Status: {response.status_code}, Response: {response.text}")
        
        # Test incorrect OTP
        response = requests.post(
            f"{BASE_URL}/auth/verify-otp",
            headers=HEADERS,
            json={
                "mobile": VENUE_OWNER_DATA["mobile"],
                "otp": "000000"
            }
        )
        
        results.add_result(
            "Verify OTP - Incorrect Code",
            response.status_code == 400,
            f"Expected 400, got: {response.status_code}"
        )
        
    except Exception as e:
        results.add_result("OTP Verification Tests", False, str(e))
    
    return results

def test_venue_owner_registration():
    """Test enhanced venue partner registration with venue details"""
    results = TestResults()
    
    try:
        # First, send OTP again for registration
        requests.post(
            f"{BASE_URL}/auth/send-otp",
            headers=HEADERS,
            json={"mobile": VENUE_OWNER_DATA["mobile"]}
        )
        time.sleep(1)  # Brief delay
        
        # Get fresh OTP
        otp_response = requests.post(
            f"{BASE_URL}/auth/send-otp",
            headers=HEADERS,
            json={"mobile": VENUE_OWNER_DATA["mobile"]}
        )
        
        if otp_response.status_code == 200:
            fresh_otp = otp_response.json().get("dev_info", "").replace("OTP: ", "")
            
            # Test complete venue partner registration
            registration_data = VENUE_OWNER_DATA.copy()
            registration_data["otp"] = fresh_otp
            
            response = requests.post(
                f"{BASE_URL}/auth/register",
                headers=HEADERS,
                json=registration_data
            )
            
            if response.status_code == 200:
                data = response.json()
                results.add_result(
                    "Venue Partner Registration - Complete Data",
                    data.get("success") == True and "access_token" in data,
                    f"Response: {data}"
                )
                
                # Store token for further tests
                global VENUE_OWNER_TOKEN
                VENUE_OWNER_TOKEN = data.get("access_token")
                
                # Verify user data structure
                user_data = data.get("user", {})
                results.add_result(
                    "Registration Response - User Data",
                    user_data.get("role") == "venue_partner" and user_data.get("business_name") == "Elite Sports Complex",
                    f"User data: {user_data}"
                )
                
            else:
                results.add_result("Venue Partner Registration - Complete Data", False, f"Status: {response.status_code}, Response: {response.text}")
        
        # Test registration with missing required venue fields
        time.sleep(1)
        requests.post(f"{BASE_URL}/auth/send-otp", headers=HEADERS, json={"mobile": "+919876543211"})
        time.sleep(1)
        otp_response = requests.post(f"{BASE_URL}/auth/send-otp", headers=HEADERS, json={"mobile": "+919876543211"})
        
        if otp_response.status_code == 200:
            incomplete_otp = otp_response.json().get("dev_info", "").replace("OTP: ", "")
            
            incomplete_data = {
                "mobile": "+919876543211",
                "otp": incomplete_otp,
                "name": "Test Owner",
                "role": "venue_partner",
                "business_name": "Test Business"
                # Missing venue_name, venue_address, etc.
            }
            
            response = requests.post(
                f"{BASE_URL}/auth/register",
                headers=HEADERS,
                json=incomplete_data
            )
            
            results.add_result(
                "Registration Validation - Missing Venue Fields",
                response.status_code == 422,  # Validation error
                f"Expected 422, got: {response.status_code}"
            )
        
    except Exception as e:
        results.add_result("Venue Partner Registration Tests", False, str(e))
    
    return results

def test_automatic_venue_creation():
    """Test that venue is automatically created during registration"""
    results = TestResults()
    
    try:
        if 'VENUE_OWNER_TOKEN' not in globals():
            results.add_result("Automatic Venue Creation", False, "No venue partner token available")
            return results
        
        # Test venue retrieval
        auth_headers = {
            **HEADERS,
            "Authorization": f"Bearer {VENUE_OWNER_TOKEN}"
        }
        
        response = requests.get(
            f"{BASE_URL}/venue-owner/venues",
            headers=auth_headers
        )
        
        if response.status_code == 200:
            venues = response.json()
            results.add_result(
                "Venue Auto-Creation - Venue Exists",
                len(venues) == 1,
                f"Expected 1 venue, got: {len(venues)}"
            )
            
            if len(venues) > 0:
                venue = venues[0]
                
                # Verify venue details match registration data
                results.add_result(
                    "Venue Details - Name",
                    venue.get("name") == VENUE_OWNER_DATA["venue_name"],
                    f"Expected: {VENUE_OWNER_DATA['venue_name']}, Got: {venue.get('name')}"
                )
                
                results.add_result(
                    "Venue Details - Address",
                    venue.get("address") == VENUE_OWNER_DATA["venue_address"],
                    f"Expected: {VENUE_OWNER_DATA['venue_address']}, Got: {venue.get('address')}"
                )
                
                results.add_result(
                    "Venue Details - City",
                    venue.get("city") == VENUE_OWNER_DATA["venue_city"],
                    f"Expected: {VENUE_OWNER_DATA['venue_city']}, Got: {venue.get('city')}"
                )
                
                results.add_result(
                    "Venue Details - Base Price",
                    venue.get("base_price_per_hour") == VENUE_OWNER_DATA["base_price_per_hour"],
                    f"Expected: {VENUE_OWNER_DATA['base_price_per_hour']}, Got: {venue.get('base_price_per_hour')}"
                )
                
                results.add_result(
                    "Venue Details - Amenities",
                    venue.get("amenities") == VENUE_OWNER_DATA["venue_amenities"],
                    f"Expected: {VENUE_OWNER_DATA['venue_amenities']}, Got: {venue.get('amenities')}"
                )
                
                results.add_result(
                    "Venue Details - Empty Arenas Array",
                    venue.get("arenas") == [],
                    f"Expected empty arenas array, got: {venue.get('arenas')}"
                )
                
                results.add_result(
                    "Venue Details - Active Status",
                    venue.get("is_active") == True,
                    f"Expected active venue, got: {venue.get('is_active')}"
                )
                
                # Store venue ID for further tests
                global VENUE_ID
                VENUE_ID = venue.get("id")
        else:
            results.add_result("Venue Auto-Creation - Venue Exists", False, f"Status: {response.status_code}, Response: {response.text}")
    
    except Exception as e:
        results.add_result("Automatic Venue Creation Tests", False, str(e))
    
    return results

def test_error_cases():
    """Test various error scenarios"""
    results = TestResults()
    
    try:
        # Test registration with invalid mobile format
        response = requests.post(
            f"{BASE_URL}/auth/register",
            headers=HEADERS,
            json={
                "mobile": "9876543210",  # Missing +91
                "otp": "123456",
                "name": "Test User",
                "role": "venue_partner",
                "business_name": "Test Business",
                "venue_name": "Test Venue",
                "venue_address": "Test Address",
                "venue_city": "Test City",
                "venue_state": "Test State",
                "venue_pincode": "123456",
                "base_price_per_hour": 1000
            }
        )
        
        results.add_result(
            "Error Case - Invalid Mobile Format",
            response.status_code == 422,
            f"Expected 422, got: {response.status_code}"
        )
        
        # Test registration with invalid base price
        time.sleep(1)
        requests.post(f"{BASE_URL}/auth/send-otp", headers=HEADERS, json={"mobile": "+919876543212"})
        time.sleep(1)
        otp_response = requests.post(f"{BASE_URL}/auth/send-otp", headers=HEADERS, json={"mobile": "+919876543212"})
        
        if otp_response.status_code == 200:
            test_otp = otp_response.json().get("dev_info", "").replace("OTP: ", "")
            
            response = requests.post(
                f"{BASE_URL}/auth/register",
                headers=HEADERS,
                json={
                    "mobile": "+919876543212",
                    "otp": test_otp,
                    "name": "Test User",
                    "role": "venue_partner",
                    "business_name": "Test Business",
                    "venue_name": "Test Venue",
                    "venue_address": "Test Address",
                    "venue_city": "Test City",
                    "venue_state": "Test State",
                    "venue_pincode": "123456",
                    "base_price_per_hour": -100  # Invalid negative price
                }
            )
            
            results.add_result(
                "Error Case - Invalid Base Price",
                response.status_code == 422,
                f"Expected 422, got: {response.status_code}"
            )
        
        # Test duplicate registration
        if 'VENUE_OWNER_TOKEN' in globals():
            time.sleep(1)
            requests.post(f"{BASE_URL}/auth/send-otp", headers=HEADERS, json={"mobile": VENUE_OWNER_DATA["mobile"]})
            time.sleep(1)
            otp_response = requests.post(f"{BASE_URL}/auth/send-otp", headers=HEADERS, json={"mobile": VENUE_OWNER_DATA["mobile"]})
            
            if otp_response.status_code == 200:
                duplicate_otp = otp_response.json().get("dev_info", "").replace("OTP: ", "")
                
                duplicate_data = VENUE_OWNER_DATA.copy()
                duplicate_data["otp"] = duplicate_otp
                
                response = requests.post(
                    f"{BASE_URL}/auth/register",
                    headers=HEADERS,
                    json=duplicate_data
                )
                
                results.add_result(
                    "Error Case - Duplicate Registration",
                    response.status_code == 400,
                    f"Expected 400, got: {response.status_code}"
                )
    
    except Exception as e:
        results.add_result("Error Case Tests", False, str(e))
    
    return results

def test_venue_retrieval_single_venue_mvp():
    """Test venue retrieval for single venue MVP"""
    results = TestResults()
    
    try:
        if 'VENUE_OWNER_TOKEN' not in globals():
            results.add_result("Single Venue MVP", False, "No venue partner token available")
            return results
        
        auth_headers = {
            **HEADERS,
            "Authorization": f"Bearer {VENUE_OWNER_TOKEN}"
        }
        
        # Test GET /api/venue-owner/venues
        response = requests.get(
            f"{BASE_URL}/venue-owner/venues",
            headers=auth_headers
        )
        
        if response.status_code == 200:
            venues = response.json()
            
            results.add_result(
                "Single Venue MVP - Exactly One Venue",
                len(venues) == 1,
                f"Expected exactly 1 venue, got: {len(venues)}"
            )
            
            if len(venues) == 1:
                venue = venues[0]
                
                # Verify complete venue data structure
                required_fields = [
                    "id", "name", "owner_id", "owner_name", "sports_supported",
                    "address", "city", "state", "pincode", "description",
                    "amenities", "base_price_per_hour", "contact_phone",
                    "is_active", "arenas", "created_at"
                ]
                
                missing_fields = [field for field in required_fields if field not in venue]
                results.add_result(
                    "Venue Data Structure - All Required Fields",
                    len(missing_fields) == 0,
                    f"Missing fields: {missing_fields}"
                )
                
                # Verify owner information
                results.add_result(
                    "Venue Partner Info - Name",
                    venue.get("owner_name") == VENUE_OWNER_DATA["name"],
                    f"Expected: {VENUE_OWNER_DATA['name']}, Got: {venue.get('owner_name')}"
                )
                
                # Verify venue is ready for arena population
                results.add_result(
                    "Venue Ready for Arenas - Empty Array",
                    isinstance(venue.get("arenas"), list) and len(venue.get("arenas")) == 0,
                    f"Expected empty arenas list, got: {venue.get('arenas')}"
                )
        else:
            results.add_result("Single Venue MVP", False, f"Status: {response.status_code}, Response: {response.text}")
    
    except Exception as e:
        results.add_result("Single Venue MVP Tests", False, str(e))
    
    return results

def run_all_tests():
    """Run all test suites"""
    print("🏏 ENHANCED VENUE OWNER REGISTRATION FLOW TESTING")
    print("=" * 60)
    print(f"Testing Backend: {BASE_URL}")
    print(f"Test Data: {VENUE_OWNER_DATA['name']} - {VENUE_OWNER_DATA['business_name']}")
    print("=" * 60)
    
    all_results = TestResults()
    
    # Run test suites
    test_suites = [
        ("API Health Check", test_api_health),
        ("OTP Sending", test_send_otp),
        ("OTP Verification", test_otp_verification),
        ("Enhanced Venue Partner Registration", test_venue_owner_registration),
        ("Automatic Venue Creation", test_automatic_venue_creation),
        ("Single Venue MVP", test_venue_retrieval_single_venue_mvp),
        ("Error Cases", test_error_cases)
    ]
    
    for suite_name, test_func in test_suites:
        print(f"\n📋 Running {suite_name} Tests...")
        suite_results = test_func()
        
        # Aggregate results
        all_results.tests_run += suite_results.tests_run
        all_results.tests_passed += suite_results.tests_passed
        all_results.tests_failed += suite_results.tests_failed
        all_results.failures.extend(suite_results.failures)
    
    # Print final summary
    all_results.print_summary()
    
    # Return success status
    return all_results.tests_failed == 0

if __name__ == "__main__":
    success = run_all_tests()
    exit(0 if success else 1)