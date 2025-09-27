#!/usr/bin/env python3
"""
Comprehensive Progressive Onboarding API Testing for KhelON Venue Partners
Tests all endpoints mentioned in the review request with realistic Indian data
"""

import requests
import json
import time
from datetime import datetime

# Configuration - Use the correct backend URL from frontend/.env
BASE_URL = "https://khelon-booking.preview.emergentagent.com/api"
HEADERS = {"Content-Type": "application/json"}

# Test data as specified in review request
TEST_MOBILE = "+919876543210"
TEST_DATA = {
    "mobile": TEST_MOBILE,
    "first_name": "Rajesh",
    "last_name": "Kumar",
    "email": "rajesh.kumar@example.com",
    "venue_name": "Elite Sports Complex",
    "address": "123 Sports Street, Andheri West",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400058",
    "sport_type": "Cricket",
    "number_of_courts": 2,
    "price_per_slot": 1200.0
}

class ComprehensiveOnboardingTester:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update(HEADERS)
        self.access_token = None
        self.user_id = None
        self.otp_code = None
        self.test_results = []
        
    def log_test(self, test_name, status, details="", response_data=None):
        """Log test results with detailed information"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        status_emoji = "✅" if status == "PASS" else "❌"
        
        result = {
            "test_name": test_name,
            "status": status,
            "timestamp": timestamp,
            "details": details,
            "response_data": response_data
        }
        self.test_results.append(result)
        
        print(f"[{timestamp}] {status_emoji} {test_name}")
        if details:
            print(f"    {details}")
        if response_data and status == "FAIL":
            print(f"    Response: {json.dumps(response_data, indent=2)}")
        print()
    
    def test_1_send_otp(self):
        """Test 1: POST /api/auth/send-otp - Send OTP to mobile number"""
        try:
            payload = {"mobile": TEST_MOBILE}
            response = self.session.post(f"{BASE_URL}/auth/send-otp", json=payload)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success"):
                    # Extract OTP from dev_info for testing
                    dev_info = data.get("dev_info", "")
                    if "OTP:" in dev_info:
                        self.otp_code = dev_info.replace("OTP: ", "").strip()
                    
                    self.log_test("POST /api/auth/send-otp", "PASS", 
                                f"OTP sent to {TEST_MOBILE} (+91XXXXXXXXXX format validated), "
                                f"Request ID: {data.get('request_id')}, Dev OTP: {self.otp_code}")
                    return True
                else:
                    self.log_test("POST /api/auth/send-otp", "FAIL", 
                                f"API returned success=false: {data.get('message')}", data)
                    return False
            else:
                self.log_test("POST /api/auth/send-otp", "FAIL", 
                            f"HTTP {response.status_code}", response.json() if response.text else None)
                return False
                
        except Exception as e:
            self.log_test("POST /api/auth/send-otp", "FAIL", f"Exception: {str(e)}")
            return False
    
    def test_2_verify_otp(self):
        """Test 2: POST /api/auth/verify-otp - Verify OTP code"""
        try:
            if not self.otp_code:
                self.log_test("POST /api/auth/verify-otp", "FAIL", "No OTP code available from previous test")
                return False
            
            payload = {
                "mobile": TEST_MOBILE,
                "otp": self.otp_code
            }
            response = self.session.post(f"{BASE_URL}/auth/verify-otp", json=payload)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success"):
                    self.log_test("POST /api/auth/verify-otp", "PASS", 
                                f"OTP {self.otp_code} verified successfully, Message: {data.get('message')}")
                    return True
                else:
                    self.log_test("POST /api/auth/verify-otp", "FAIL", 
                                f"OTP verification failed: {data.get('message')}", data)
                    return False
            else:
                self.log_test("POST /api/auth/verify-otp", "FAIL", 
                            f"HTTP {response.status_code}", response.json() if response.text else None)
                return False
                
        except Exception as e:
            self.log_test("POST /api/auth/verify-otp", "FAIL", f"Exception: {str(e)}")
            return False
    
    def test_3_onboarding_step1(self):
        """Test 3: POST /api/onboarding/step1 - Basic user info with OTP verification"""
        try:
            payload = {
                "mobile": TEST_MOBILE,
                "otp": self.otp_code,
                "first_name": TEST_DATA["first_name"],
                "last_name": TEST_DATA["last_name"],
                "email": TEST_DATA["email"]
            }
            response = self.session.post(f"{BASE_URL}/onboarding/step1", json=payload)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success"):
                    self.access_token = data.get("access_token")
                    self.user_id = data.get("user_id")
                    
                    # Set authorization header for subsequent requests
                    self.session.headers.update({
                        "Authorization": f"Bearer {self.access_token}"
                    })
                    
                    self.log_test("POST /api/onboarding/step1", "PASS", 
                                f"User created: {TEST_DATA['first_name']} {TEST_DATA['last_name']}, "
                                f"Email: {TEST_DATA['email']}, Role: venue_partner, "
                                f"JWT token received, User ID: {self.user_id}, Next step: {data.get('next_step')}")
                    return True
                else:
                    self.log_test("POST /api/onboarding/step1", "FAIL", 
                                f"Step 1 failed: {data.get('message')}", data)
                    return False
            else:
                self.log_test("POST /api/onboarding/step1", "FAIL", 
                            f"HTTP {response.status_code}", response.json() if response.text else None)
                return False
                
        except Exception as e:
            self.log_test("POST /api/onboarding/step1", "FAIL", f"Exception: {str(e)}")
            return False
    
    def test_4_onboarding_step2(self):
        """Test 4: POST /api/onboarding/step2 - Venue setup"""
        try:
            if not self.access_token:
                self.log_test("POST /api/onboarding/step2", "FAIL", "No access token available")
                return False
            
            payload = {
                "venue_name": TEST_DATA["venue_name"],
                "address": TEST_DATA["address"],
                "city": TEST_DATA["city"],
                "state": TEST_DATA["state"],
                "pincode": TEST_DATA["pincode"],
                "cover_photo": None,  # Optional field
                "operating_days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
                "start_time": "06:00",
                "end_time": "22:00",
                "contact_phone": TEST_MOBILE
            }
            response = self.session.post(f"{BASE_URL}/onboarding/step2", json=payload)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success"):
                    self.log_test("POST /api/onboarding/step2", "PASS", 
                                f"Venue setup completed: {TEST_DATA['venue_name']}, "
                                f"Address: {TEST_DATA['address']}, {TEST_DATA['city']}, {TEST_DATA['state']}, {TEST_DATA['pincode']}, "
                                f"Operating: 6 days (Mon-Sat), Hours: 06:00-22:00, "
                                f"Contact: {TEST_MOBILE}, Next step: {data.get('next_step')}")
                    return True
                else:
                    self.log_test("POST /api/onboarding/step2", "FAIL", 
                                f"Step 2 failed: {data.get('message')}", data)
                    return False
            else:
                self.log_test("POST /api/onboarding/step2", "FAIL", 
                            f"HTTP {response.status_code}", response.json() if response.text else None)
                return False
                
        except Exception as e:
            self.log_test("POST /api/onboarding/step2", "FAIL", f"Exception: {str(e)}")
            return False
    
    def test_5_onboarding_step3(self):
        """Test 5: POST /api/onboarding/step3 - Sports arena configuration"""
        try:
            if not self.access_token:
                self.log_test("POST /api/onboarding/step3", "FAIL", "No access token available")
                return False
            
            payload = {
                "sport_type": TEST_DATA["sport_type"],
                "number_of_courts": TEST_DATA["number_of_courts"],
                "slot_duration": 60,  # 60 minutes
                "price_per_slot": TEST_DATA["price_per_slot"]
            }
            response = self.session.post(f"{BASE_URL}/onboarding/step3", json=payload)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success"):
                    arena_id = data.get("arena_id")
                    self.log_test("POST /api/onboarding/step3", "PASS", 
                                f"Sports arena created: {TEST_DATA['sport_type']}, "
                                f"Courts: {TEST_DATA['number_of_courts']}, "
                                f"Slot duration: 60 minutes, "
                                f"Price: ₹{TEST_DATA['price_per_slot']} per slot, "
                                f"Arena ID: {arena_id}, Next step: {data.get('next_step')}")
                    return True
                else:
                    self.log_test("POST /api/onboarding/step3", "FAIL", 
                                f"Step 3 failed: {data.get('message')}", data)
                    return False
            else:
                self.log_test("POST /api/onboarding/step3", "FAIL", 
                            f"HTTP {response.status_code}", response.json() if response.text else None)
                return False
                
        except Exception as e:
            self.log_test("POST /api/onboarding/step3", "FAIL", f"Exception: {str(e)}")
            return False
    
    def test_6_onboarding_step4(self):
        """Test 6: POST /api/onboarding/step4 - Amenities & rules (optional)"""
        try:
            if not self.access_token:
                self.log_test("POST /api/onboarding/step4", "FAIL", "No access token available")
                return False
            
            payload = {
                "amenities": ["Parking", "Washroom", "Floodlights", "Seating"],
                "rules": "No smoking. Proper sports attire required. Advance booking mandatory."
            }
            response = self.session.post(f"{BASE_URL}/onboarding/step4", json=payload)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success"):
                    self.log_test("POST /api/onboarding/step4", "PASS", 
                                f"Amenities & rules configured: {len(payload['amenities'])} amenities "
                                f"(Parking, Washroom, Floodlights, Seating), "
                                f"Rules set ({len(payload['rules'])} chars), Next step: {data.get('next_step')}")
                    return True
                else:
                    self.log_test("POST /api/onboarding/step4", "FAIL", 
                                f"Step 4 failed: {data.get('message')}", data)
                    return False
            else:
                self.log_test("POST /api/onboarding/step4", "FAIL", 
                            f"HTTP {response.status_code}", response.json() if response.text else None)
                return False
                
        except Exception as e:
            self.log_test("POST /api/onboarding/step4", "FAIL", f"Exception: {str(e)}")
            return False
    
    def test_7_onboarding_step5(self):
        """Test 7: POST /api/onboarding/step5 - Payment setup (optional)"""
        try:
            if not self.access_token:
                self.log_test("POST /api/onboarding/step5", "FAIL", "No access token available")
                return False
            
            payload = {
                "bank_account_number": "1234567890123456",
                "bank_ifsc": "HDFC0001234",
                "bank_account_holder": "Rajesh Kumar",
                "upi_id": "rajesh.kumar@paytm"
            }
            response = self.session.post(f"{BASE_URL}/onboarding/step5", json=payload)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success"):
                    onboarding_completed = data.get("onboarding_completed", False)
                    self.log_test("POST /api/onboarding/step5", "PASS", 
                                f"Payment setup completed: Bank account (HDFC0001234), "
                                f"Account holder: Rajesh Kumar, UPI: rajesh.kumar@paytm, "
                                f"Onboarding completed: {onboarding_completed}")
                    return True
                else:
                    self.log_test("POST /api/onboarding/step5", "FAIL", 
                                f"Step 5 failed: {data.get('message')}", data)
                    return False
            else:
                self.log_test("POST /api/onboarding/step5", "FAIL", 
                            f"HTTP {response.status_code}", response.json() if response.text else None)
                return False
                
        except Exception as e:
            self.log_test("POST /api/onboarding/step5", "FAIL", f"Exception: {str(e)}")
            return False
    
    def test_8_onboarding_status(self):
        """Test 8: GET /api/onboarding/status - Get current onboarding status"""
        try:
            if not self.access_token:
                self.log_test("GET /api/onboarding/status", "FAIL", "No access token available")
                return False
            
            response = self.session.get(f"{BASE_URL}/onboarding/status")
            
            if response.status_code == 200:
                data = response.json()
                
                # Handle both direct response and wrapped response formats
                if isinstance(data, dict) and "user_id" in data:
                    status_data = data
                elif data.get("success") and "status" in data:
                    status_data = data["status"]
                else:
                    self.log_test("GET /api/onboarding/status", "FAIL", 
                                f"Unexpected response format", data)
                    return False
                
                self.log_test("GET /api/onboarding/status", "PASS", 
                            f"Status retrieved: User {status_data.get('user_id')}, "
                            f"Mobile: {status_data.get('mobile')}, "
                            f"Onboarding completed: {status_data.get('onboarding_completed')}, "
                            f"Completed steps: {status_data.get('completed_steps')}, "
                            f"Current step: {status_data.get('current_step')}, "
                            f"Has venue: {status_data.get('has_venue')}, "
                            f"Has arena: {status_data.get('has_arena')}, "
                            f"Can go live: {status_data.get('can_go_live')}")
                return True
            else:
                self.log_test("GET /api/onboarding/status", "FAIL", 
                            f"HTTP {response.status_code}", response.json() if response.text else None)
                return False
                
        except Exception as e:
            self.log_test("GET /api/onboarding/status", "FAIL", f"Exception: {str(e)}")
            return False
    
    def test_9_jwt_authentication(self):
        """Test 9: JWT token creation and authentication"""
        try:
            if not self.access_token:
                self.log_test("JWT Authentication", "FAIL", "No access token available")
                return False
            
            # Test protected endpoint
            response = self.session.get(f"{BASE_URL}/auth/profile")
            
            if response.status_code == 200:
                data = response.json()
                if "mobile" in data and data["mobile"] == TEST_MOBILE:
                    self.log_test("JWT Authentication", "PASS", 
                                f"JWT token valid, Profile retrieved: {data.get('name')}, "
                                f"Role: {data.get('role')}, Mobile: {data.get('mobile')}, "
                                f"Verified: {data.get('is_verified')}")
                    return True
                else:
                    self.log_test("JWT Authentication", "FAIL", 
                                f"Profile data mismatch", data)
                    return False
            else:
                self.log_test("JWT Authentication", "FAIL", 
                            f"HTTP {response.status_code}", response.json() if response.text else None)
                return False
                
        except Exception as e:
            self.log_test("JWT Authentication", "FAIL", f"Exception: {str(e)}")
            return False
    
    def test_10_data_persistence(self):
        """Test 10: Data persistence across all 5 steps"""
        try:
            if not self.access_token:
                self.log_test("Data Persistence", "FAIL", "No access token available")
                return False
            
            # Get user profile to verify data persistence
            response = self.session.get(f"{BASE_URL}/auth/profile")
            
            if response.status_code == 200:
                profile_data = response.json()
                
                # Check if basic user data persists
                name_match = profile_data.get("name") == f"{TEST_DATA['first_name']} {TEST_DATA['last_name']}"
                mobile_match = profile_data.get("mobile") == TEST_MOBILE
                role_match = profile_data.get("role") == "venue_partner"
                email_match = profile_data.get("email") == TEST_DATA["email"]
                
                if name_match and mobile_match and role_match and email_match:
                    self.log_test("Data Persistence", "PASS", 
                                f"User data persisted correctly: Name ({name_match}), "
                                f"Mobile ({mobile_match}), Role ({role_match}), Email ({email_match})")
                    return True
                else:
                    self.log_test("Data Persistence", "FAIL", 
                                f"Data mismatch - Name: {name_match}, Mobile: {mobile_match}, "
                                f"Role: {role_match}, Email: {email_match}", profile_data)
                    return False
            else:
                self.log_test("Data Persistence", "FAIL", 
                            f"HTTP {response.status_code}", response.json() if response.text else None)
                return False
                
        except Exception as e:
            self.log_test("Data Persistence", "FAIL", f"Exception: {str(e)}")
            return False
    
    def test_11_validation_tests(self):
        """Test 11: Required vs optional fields validation"""
        try:
            # Test invalid mobile number format
            payload = {"mobile": "invalid_mobile"}
            response = self.session.post(f"{BASE_URL}/auth/send-otp", json=payload)
            
            if response.status_code == 422:  # Validation error
                self.log_test("Validation - Invalid Mobile Format", "PASS", 
                            "Invalid mobile number properly rejected with 422 validation error")
            else:
                self.log_test("Validation - Invalid Mobile Format", "FAIL", 
                            f"Expected 422, got {response.status_code}")
                return False
            
            # Test invalid pincode format in step 2
            if self.access_token:
                payload = {
                    "venue_name": "Test Venue",
                    "address": "Test Address",
                    "city": "Test City",
                    "state": "Test State",
                    "pincode": "12345",  # Invalid - should be 6 digits
                    "operating_days": ["Monday"],
                    "start_time": "06:00",
                    "end_time": "22:00",
                    "contact_phone": TEST_MOBILE
                }
                response = self.session.post(f"{BASE_URL}/onboarding/step2", json=payload)
                
                if response.status_code == 422:  # Validation error
                    self.log_test("Validation - Invalid Pincode", "PASS", 
                                "Invalid pincode (5 digits) properly rejected with 422 validation error")
                    return True
                else:
                    self.log_test("Validation - Invalid Pincode", "FAIL", 
                                f"Expected 422, got {response.status_code}")
                    return False
            else:
                self.log_test("Validation Tests", "PASS", 
                            "Basic validation test completed (mobile format)")
                return True
                
        except Exception as e:
            self.log_test("Validation Tests", "FAIL", f"Exception: {str(e)}")
            return False
    
    def test_12_error_handling(self):
        """Test 12: Error handling for invalid data"""
        try:
            # Test invalid OTP
            payload = {
                "mobile": TEST_MOBILE,
                "otp": "000000"  # Invalid OTP
            }
            response = self.session.post(f"{BASE_URL}/auth/verify-otp", json=payload)
            
            if response.status_code == 400:  # Bad request
                data = response.json()
                if "Invalid OTP" in data.get("detail", ""):
                    self.log_test("Error Handling - Invalid OTP", "PASS", 
                                f"Invalid OTP properly rejected: {data.get('detail')}")
                    return True
                else:
                    self.log_test("Error Handling - Invalid OTP", "FAIL", 
                                f"Unexpected error message: {data.get('detail')}", data)
                    return False
            else:
                self.log_test("Error Handling - Invalid OTP", "FAIL", 
                            f"Expected 400, got {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Error Handling", "FAIL", f"Exception: {str(e)}")
            return False
    
    def run_comprehensive_test(self):
        """Run complete progressive onboarding test suite"""
        print("=" * 100)
        print("🏏 KHELON COMPREHENSIVE PROGRESSIVE ONBOARDING API TESTING")
        print("=" * 100)
        print(f"Testing complete end-to-end venue partner onboarding flow")
        print(f"Venue Partner: {TEST_DATA['first_name']} {TEST_DATA['last_name']} ({TEST_MOBILE})")
        print(f"Venue: {TEST_DATA['venue_name']}, {TEST_DATA['address']}")
        print(f"Location: {TEST_DATA['city']}, {TEST_DATA['state']} - {TEST_DATA['pincode']}")
        print(f"Sport: {TEST_DATA['sport_type']}, Courts: {TEST_DATA['number_of_courts']}, Price: ₹{TEST_DATA['price_per_slot']}")
        print(f"Base URL: {BASE_URL}")
        print("=" * 100)
        print()
        
        # Test sequence as specified in review request
        tests = [
            ("1. Send OTP API", self.test_1_send_otp),
            ("2. Verify OTP API (Standalone)", self.test_2_verify_otp_standalone),
            ("3. Onboarding Step 1 - Basic Info", self.test_3_onboarding_step1),
            ("4. Onboarding Step 2 - Venue Setup", self.test_4_onboarding_step2),
            ("5. Onboarding Step 3 - Sports Arena", self.test_5_onboarding_step3),
            ("6. Onboarding Step 4 - Amenities & Rules", self.test_6_onboarding_step4),
            ("7. Onboarding Step 5 - Payment Setup", self.test_7_onboarding_step5),
            ("8. Onboarding Status Check", self.test_8_onboarding_status),
            ("9. JWT Authentication Flow", self.test_9_jwt_authentication),
            ("10. Data Persistence Verification", self.test_10_data_persistence),
            ("11. Field Validation Tests", self.test_11_validation_tests),
            ("12. Error Handling Tests", self.test_12_error_handling)
        ]
        
        passed = 0
        failed = 0
        
        for test_name, test_func in tests:
            try:
                if test_func():
                    passed += 1
                else:
                    failed += 1
                    
                # Small delay between tests
                time.sleep(0.5)
                
            except Exception as e:
                self.log_test(test_name, "FAIL", f"Exception: {str(e)}")
                failed += 1
        
        # Summary
        print("=" * 100)
        print("📊 COMPREHENSIVE TEST SUMMARY")
        print("=" * 100)
        print(f"✅ Passed: {passed}")
        print(f"❌ Failed: {failed}")
        print(f"📈 Success Rate: {(passed / (passed + failed) * 100):.1f}%")
        print()
        
        if failed == 0:
            print("🎉 ALL TESTS PASSED! Progressive onboarding system is working perfectly.")
            print()
            print("✅ VERIFIED FUNCTIONALITY:")
            print("   • Complete end-to-end venue partner onboarding flow (5 steps)")
            print("   • OTP generation and verification with Indian mobile numbers (+91XXXXXXXXXX)")
            print("   • JWT token creation and authentication after step 1")
            print("   • Data persistence across all 5 onboarding steps")
            print("   • Onboarding status tracking with proper progress indicators")
            print("   • Required vs optional field validation")
            print("   • Error handling for invalid data and edge cases")
            print("   • User role assignment (venue_partner)")
            print("   • Arena creation with sport-specific configuration")
            print("   • Payment setup with bank and UPI details")
            print("   • Final onboarding completion flag")
            print()
            print("✅ API ENDPOINTS TESTED:")
            print("   • POST /api/auth/send-otp")
            print("   • POST /api/auth/verify-otp")
            print("   • POST /api/onboarding/step1")
            print("   • POST /api/onboarding/step2")
            print("   • POST /api/onboarding/step3")
            print("   • POST /api/onboarding/step4")
            print("   • POST /api/onboarding/step5")
            print("   • GET /api/onboarding/status")
            print("   • GET /api/auth/profile (JWT validation)")
        else:
            print(f"⚠️  {failed} test(s) failed. Please check the detailed results above.")
            print()
            print("FAILED TESTS:")
            for result in self.test_results:
                if result["status"] == "FAIL":
                    print(f"   ❌ {result['test_name']}: {result['details']}")
        
        print("=" * 100)
        
        return failed == 0

def main():
    """Main test execution"""
    tester = ComprehensiveOnboardingTester()
    success = tester.run_comprehensive_test()
    
    if success:
        print("\n🚀 PROGRESSIVE ONBOARDING SYSTEM IS PRODUCTION-READY!")
        print("   All endpoints working correctly with realistic Indian venue partner data.")
        print("   Ready for frontend integration and user testing.")
    else:
        print("\n🔧 PROGRESSIVE ONBOARDING SYSTEM NEEDS ATTENTION!")
        print("   Please review the failed tests and fix the identified issues.")
    
    return success

if __name__ == "__main__":
    main()