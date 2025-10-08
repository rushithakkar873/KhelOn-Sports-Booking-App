#!/usr/bin/env python3
"""
Comprehensive Backend Testing for KhelON Onboarding Step1 Fix
Testing the unified system approach with JWT-protected onboarding
"""

import requests
import json
import time
from datetime import datetime

# Configuration
BASE_URL = "https://sportsbooker-5.preview.emergentagent.com/api"
TEST_MOBILE = "+919876543210"
TEST_NAME = "Rajesh Kumar"
TEST_EMAIL = "rajesh@example.com"

class OnboardingStep1Tester:
    def __init__(self):
        self.session = requests.Session()
        self.jwt_token = None
        self.user_id = None
        self.received_otp = None
        
    def log_test(self, test_name, status, details=""):
        """Log test results"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        status_emoji = "✅" if status == "PASS" else "❌"
        print(f"[{timestamp}] {status_emoji} {test_name}")
        if details:
            print(f"    {details}")
        print()
    
    def test_api_health(self):
        """Test 1: API Health Check"""
        try:
            response = self.session.get(f"{BASE_URL}/")
            
            if response.status_code == 200:
                data = response.json()
                if "KhelOn API" in data.get("message", "") and data.get("auth_type") == "mobile_otp":
                    self.log_test("API Health Check", "PASS", 
                                f"API running with unified auth system: {data['message']}")
                    return True
                else:
                    self.log_test("API Health Check", "FAIL", 
                                f"Unexpected response: {data}")
                    return False
            else:
                self.log_test("API Health Check", "FAIL", 
                            f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("API Health Check", "FAIL", f"Exception: {str(e)}")
            return False
    
    def test_send_otp(self):
        """Test 2: Send OTP to mobile number"""
        try:
            payload = {"mobile": TEST_MOBILE}
            response = self.session.post(f"{BASE_URL}/auth/send-otp", json=payload)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and "request_id" in data:
                    # Extract OTP from dev_info
                    if "dev_info" in data:
                        dev_info = data["dev_info"]
                        if "OTP:" in dev_info:
                            self.received_otp = dev_info.split("OTP:")[1].strip()
                        print(f"    Development OTP: {data['dev_info']}")
                        print(f"    Extracted OTP: {self.received_otp}")
                    
                    self.log_test("Send OTP", "PASS", 
                                f"OTP sent successfully. Request ID: {data['request_id']}")
                    return True
                else:
                    self.log_test("Send OTP", "FAIL", f"Unexpected response: {data}")
                    return False
            else:
                self.log_test("Send OTP", "FAIL", 
                            f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Send OTP", "FAIL", f"Exception: {str(e)}")
            return False
    
    def test_login_with_otp(self):
        """Test 3: Login with mobile + OTP to get JWT token"""
        try:
            # Use the actual OTP received from send_otp
            payload = {
                "mobile": TEST_MOBILE,
                "otp": self.received_otp or "123456"  # Use received OTP or fallback
            }
            response = self.session.post(f"{BASE_URL}/auth/login", json=payload)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and "access_token" in data:
                    self.jwt_token = data["access_token"]
                    
                    # Check if this is new user flow (should be for onboarding)
                    if not data.get("user_exists", True):
                        self.log_test("Login with OTP", "PASS", 
                                    f"New user flow detected. Action: {data.get('action')}, Redirect: {data.get('redirect_to')}")
                        return True
                    else:
                        # Existing user - get user ID
                        user_info = data.get("user", {})
                        self.user_id = user_info.get("id")
                        self.log_test("Login with OTP", "PASS", 
                                    f"Existing user login. User ID: {self.user_id}, Onboarding completed: {user_info.get('onboarding_completed')}")
                        return True
                else:
                    self.log_test("Login with OTP", "FAIL", f"Missing access_token: {data}")
                    return False
            else:
                self.log_test("Login with OTP", "FAIL", 
                            f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Login with OTP", "FAIL", f"Exception: {str(e)}")
            return False
    
    def test_onboarding_step1_jwt(self):
        """Test 4: Onboarding Step 1 with JWT (THE MAIN FIX TEST)"""
        if not self.jwt_token:
            self.log_test("Onboarding Step 1 (JWT)", "FAIL", "No JWT token available")
            return False
            
        try:
            # Test the fixed payload structure - only name and email (no first_name/last_name)
            payload = {
                "name": TEST_NAME,
                "email": TEST_EMAIL
            }
            
            headers = {"Authorization": f"Bearer {self.jwt_token}"}
            response = self.session.post(f"{BASE_URL}/onboarding/step1", 
                                       json=payload, headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success"):
                    # Update token if new one provided
                    if "access_token" in data:
                        self.jwt_token = data["access_token"]
                    
                    self.user_id = data.get("user_id", self.user_id)
                    next_step = data.get("next_step", 2)
                    
                    self.log_test("Onboarding Step 1 (JWT)", "PASS", 
                                f"✅ FIXED: No 422 error! Step 1 completed successfully. User ID: {self.user_id}, Next step: {next_step}")
                    return True
                else:
                    self.log_test("Onboarding Step 1 (JWT)", "FAIL", 
                                f"Step 1 failed: {data.get('message')}")
                    return False
            elif response.status_code == 422:
                # This is the error we're trying to fix
                error_data = response.json()
                self.log_test("Onboarding Step 1 (JWT)", "FAIL", 
                            f"❌ 422 UNPROCESSABLE ENTITY ERROR STILL EXISTS: {error_data}")
                return False
            else:
                self.log_test("Onboarding Step 1 (JWT)", "FAIL", 
                            f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Onboarding Step 1 (JWT)", "FAIL", f"Exception: {str(e)}")
            return False
    
    def test_onboarding_status(self):
        """Test 5: Check onboarding status after step 1"""
        if not self.jwt_token:
            self.log_test("Onboarding Status Check", "FAIL", "No JWT token available")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.jwt_token}"}
            response = self.session.get(f"{BASE_URL}/onboarding/status", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                completed_steps = data.get("completed_steps", [])
                current_step = data.get("current_step", 1)
                
                if 1 in completed_steps and current_step == 2:
                    self.log_test("Onboarding Status Check", "PASS", 
                                f"Step 1 marked as completed. Completed steps: {completed_steps}, Current step: {current_step}")
                    return True
                else:
                    self.log_test("Onboarding Status Check", "FAIL", 
                                f"Step 1 not properly recorded. Completed: {completed_steps}, Current: {current_step}")
                    return False
            else:
                self.log_test("Onboarding Status Check", "FAIL", 
                            f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Onboarding Status Check", "FAIL", f"Exception: {str(e)}")
            return False
    
    def test_onboarding_step2(self):
        """Test 6: Continue with Step 2 to verify flow"""
        if not self.jwt_token:
            self.log_test("Onboarding Step 2", "FAIL", "No JWT token available")
            return False
            
        try:
            payload = {
                "venue_name": "Elite Sports Complex",
                "address": "456 Ground Road, Andheri West",
                "city": "Mumbai",
                "state": "Maharashtra", 
                "pincode": "400058",
                "operating_days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
                "start_time": "06:00",
                "end_time": "22:00",
                "contact_phone": "+919876543210"
            }
            
            headers = {"Authorization": f"Bearer {self.jwt_token}"}
            response = self.session.post(f"{BASE_URL}/onboarding/step2", 
                                       json=payload, headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success"):
                    self.log_test("Onboarding Step 2", "PASS", 
                                f"Step 2 completed successfully. Message: {data.get('message')}")
                    return True
                else:
                    self.log_test("Onboarding Step 2", "FAIL", 
                                f"Step 2 failed: {data.get('message')}")
                    return False
            else:
                self.log_test("Onboarding Step 2", "FAIL", 
                            f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Onboarding Step 2", "FAIL", f"Exception: {str(e)}")
            return False
    
    def test_user_profile_unified_schema(self):
        """Test 7: Verify user data stored in unified schema"""
        if not self.jwt_token:
            self.log_test("User Profile Unified Schema", "FAIL", "No JWT token available")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.jwt_token}"}
            response = self.session.get(f"{BASE_URL}/auth/profile", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                
                # Check unified schema fields
                name = data.get("name")
                email = data.get("email")
                role = data.get("role")
                onboarding_completed = data.get("onboarding_completed")
                completed_steps = data.get("completed_steps", [])
                
                if (name == TEST_NAME and 
                    email == TEST_EMAIL and 
                    role == "venue_partner" and
                    1 in completed_steps):
                    
                    self.log_test("User Profile Unified Schema", "PASS", 
                                f"✅ Unified schema verified: Name='{name}', Email='{email}', Role='{role}', Steps completed: {completed_steps}")
                    return True
                else:
                    self.log_test("User Profile Unified Schema", "FAIL", 
                                f"Schema mismatch: Name='{name}', Email='{email}', Role='{role}', Steps: {completed_steps}")
                    return False
            else:
                self.log_test("User Profile Unified Schema", "FAIL", 
                            f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("User Profile Unified Schema", "FAIL", f"Exception: {str(e)}")
            return False
    
    def run_comprehensive_test(self):
        """Run all tests in sequence"""
        print("=" * 80)
        print("🏏 KHELON ONBOARDING STEP1 FIX TESTING")
        print("=" * 80)
        print(f"Testing unified system approach with JWT-protected onboarding")
        print(f"Base URL: {BASE_URL}")
        print(f"Test Mobile: {TEST_MOBILE}")
        print(f"Test Name: {TEST_NAME}")
        print(f"Test Email: {TEST_EMAIL}")
        print("=" * 80)
        print()
        
        tests = [
            self.test_api_health,
            self.test_send_otp,
            self.test_login_with_otp,
            self.test_onboarding_step1_jwt,  # THE MAIN FIX TEST
            self.test_onboarding_status,
            self.test_onboarding_step2,
            self.test_user_profile_unified_schema
        ]
        
        passed = 0
        total = len(tests)
        
        for test in tests:
            if test():
                passed += 1
            time.sleep(1)  # Brief pause between tests
        
        print("=" * 80)
        print(f"🏏 ONBOARDING STEP1 FIX TEST RESULTS")
        print("=" * 80)
        print(f"Tests Passed: {passed}/{total}")
        
        if passed == total:
            print("🎉 ALL TESTS PASSED! Onboarding Step1 fix is working correctly!")
            print("✅ The 422 Unprocessable Entity error has been resolved")
            print("✅ JWT authentication is working properly")
            print("✅ Progressive onboarding flow is functional")
            print("✅ User data is stored correctly in unified schema")
        else:
            print(f"❌ {total - passed} tests failed. Issues need to be addressed.")
            
            if passed >= 4:  # If step1 test passed
                print("✅ Main fix (Step 1) appears to be working")
                print("❌ Some related functionality may need attention")
            else:
                print("❌ Core onboarding step1 fix may still have issues")
        
        print("=" * 80)
        return passed == total

if __name__ == "__main__":
    tester = OnboardingStep1Tester()
    success = tester.run_comprehensive_test()
    exit(0 if success else 1)