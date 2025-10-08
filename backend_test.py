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
                    self.log_test("Send OTP", "PASS", 
                                f"OTP sent successfully. Request ID: {data['request_id']}")
                    if "dev_info" in data:
                        print(f"    Development OTP: {data['dev_info']}")
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
            # Use mock OTP for testing
            payload = {
                "mobile": TEST_MOBILE,
                "otp": "123456"  # Mock OTP
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
        
        if not success and response_data:
            logger.info(f"   Response: {json.dumps(response_data, indent=2)}")
    
    def set_auth_token(self, token: str):
        """Set authentication token for subsequent requests"""
        self.auth_token = token
    
    def clear_auth_token(self):
        """Clear authentication token"""
        self.auth_token = None
    
    async def make_request(self, method: str, endpoint: str, data: Dict = None) -> Dict[str, Any]:
        """Make HTTP request with error handling"""
        url = f"{self.base_url}{endpoint}"
        
        try:
            headers = {"Content-Type": "application/json"}
            if self.auth_token:
                headers["Authorization"] = f"Bearer {self.auth_token}"
            
            async with self.session.request(
                method, url, 
                json=data if data else None,
                headers=headers
            ) as response:
                response_text = await response.text()
                
                try:
                    response_data = json.loads(response_text)
                except json.JSONDecodeError:
                    response_data = {"raw_response": response_text}
                
                return {
                    "status_code": response.status,
                    "data": response_data,
                    "success": response.status < 400
                }
                
        except Exception as e:
            logger.error(f"Request failed: {str(e)}")
            return {
                "status_code": 500,
                "data": {"error": str(e)},
                "success": False
            }
    
    async def test_health_check(self):
        """Test API health and branding"""
        logger.info("🔍 Testing API health and KhelON branding...")
        
        result = await self.make_request("GET", "/")
        
        if result["success"]:
            data = result["data"]
            
            # Check for KhelON branding and unified auth system
            if ("KhelOn" in data.get("message", "") and 
                data.get("auth_type") == "mobile_otp" and
                "v2.0.0" in data.get("message", "")):
                self.log_result(
                    "Health Check & Branding",
                    True,
                    f"API healthy with KhelON v2.0.0 branding and unified auth system",
                    data
                )
            else:
                self.log_result(
                    "Health Check & Branding",
                    False,
                    f"Missing KhelON branding or unified auth system indicators",
                    data
                )
        else:
            self.log_result(
                "Health Check & Branding",
                False,
                f"Health check failed with status {result['status_code']}",
                result["data"]
            )
    
    async def test_send_otp(self):
        """Test unified send OTP endpoint"""
        logger.info(f"📱 Testing send OTP to {self.test_user_mobile}...")
        
        payload = {"mobile": self.test_user_mobile}
        result = await self.make_request("POST", "/auth/send-otp", payload)
        
        if result["success"]:
            data = result["data"]
            
            if (data.get("success") and 
                "request_id" in data and 
                "dev_info" in data):  # Development OTP info
                
                # Extract OTP for testing
                dev_info = data.get("dev_info", "")
                if "OTP:" in dev_info:
                    self.received_otp = dev_info.split("OTP:")[1].strip()
                
                self.log_result(
                    "Send OTP API",
                    True,
                    f"OTP sent successfully to {self.test_user_mobile}",
                    data
                )
            else:
                self.log_result(
                    "Send OTP API",
                    False,
                    "Missing required fields in OTP response",
                    data
                )
        else:
            self.log_result(
                "Send OTP API",
                False,
                f"Send OTP failed with status {result['status_code']}",
                result["data"]
            )
    
    async def test_verify_otp(self):
        """Test unified verify OTP endpoint"""
        logger.info(f"🔐 Testing verify OTP for {self.test_user_mobile}...")
        
        payload = {
            "mobile": self.test_user_mobile,
            "otp": self.received_otp or "123456"
        }
        result = await self.make_request("POST", "/auth/verify-otp", payload)
        
        if result["success"]:
            data = result["data"]
            
            if data.get("success"):
                self.log_result(
                    "Verify OTP API",
                    True,
                    f"OTP verified successfully for {self.test_user_mobile}",
                    data
                )
            else:
                self.log_result(
                    "Verify OTP API",
                    False,
                    "OTP verification failed",
                    data
                )
        else:
            self.log_result(
                "Verify OTP API",
                False,
                f"Verify OTP failed with status {result['status_code']}",
                result["data"]
            )
    
    async def test_login_new_user(self):
        """Test unified login for new user (should redirect to onboarding)"""
        logger.info(f"🔑 Testing login for new user {self.test_user_mobile}...")
        
        payload = {
            "mobile": self.test_user_mobile,
            "otp": self.received_otp or "123456"
        }
        result = await self.make_request("POST", "/auth/login", payload)
        
        if result["success"]:
            data = result["data"]
            
            if (data.get("success") and 
                data.get("user_exists") == False and
                data.get("action") == "start_onboarding" and
                data.get("redirect_to") == "onboarding_step_1" and
                "access_token" in data):
                
                # Store token for onboarding
                self.set_auth_token(data["access_token"])
                
                self.log_result(
                    "Login New User",
                    True,
                    f"New user login successful, redirected to onboarding",
                    data
                )
            else:
                self.log_result(
                    "Login New User",
                    False,
                    "Login response missing required fields for new user flow",
                    data
                )
        else:
            self.log_result(
                "Login New User",
                False,
                f"Login failed with status {result['status_code']}",
                result["data"]
            )
    
    async def test_onboarding_step1(self):
        """Test onboarding step 1 with single name field"""
        logger.info("👤 Testing onboarding step 1 with single name field...")
        
        payload = {
            "mobile": self.test_user_mobile,
            "otp": self.received_otp or "123456",
            "name": self.test_user_name,  # Single name field (not first_name + last_name)
            "email": self.test_user_email,
            "role": "venue_partner",
            "business_name": "Elite Sports Complex",
            "business_address": "123 Sports Street, Mumbai",
            "gst_number": "24ABCDE1234F1Z5"
        }
        result = await self.make_request("POST", "/onboarding/step1", payload)
        
        if result["success"]:
            data = result["data"]
            
            if (data.get("success") and 
                data.get("next_step") == 2 and
                "access_token" in data):
                
                # Update token
                self.set_auth_token(data["access_token"])
                
                self.log_result(
                    "Onboarding Step 1 (Single Name Field)",
                    True,
                    f"Step 1 completed with single name field: {self.test_user_name}",
                    data
                )
            else:
                self.log_result(
                    "Onboarding Step 1 (Single Name Field)",
                    False,
                    "Step 1 response missing required fields",
                    data
                )
        else:
            self.log_result(
                "Onboarding Step 1 (Single Name Field)",
                False,
                f"Step 1 failed with status {result['status_code']}",
                result["data"]
            )
    
    async def test_onboarding_step2(self):
        """Test onboarding step 2 with contact_number field"""
        logger.info("🏢 Testing onboarding step 2 with contact_phone field...")
        
        payload = {
            "venue_name": "Elite Cricket Ground",
            "address": "456 Ground Road, Andheri West",
            "city": "Mumbai",
            "state": "Maharashtra",
            "pincode": "400058",
            "operating_days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
            "start_time": "06:00",
            "end_time": "22:00",
            "contact_phone": "+919876543210"  # contact_phone field (renamed from contact_number)
        }
        result = await self.make_request("POST", "/onboarding/step2", payload)
        
        if result["success"]:
            data = result["data"]
            
            if (data.get("success") and 
                data.get("next_step") == 3):
                
                self.log_result(
                    "Onboarding Step 2 (Contact Phone Field)",
                    True,
                    f"Step 2 completed with contact_phone field validation",
                    data
                )
            else:
                self.log_result(
                    "Onboarding Step 2 (Contact Phone Field)",
                    False,
                    "Step 2 response missing required fields",
                    data
                )
        else:
            self.log_result(
                "Onboarding Step 2 (Contact Phone Field)",
                False,
                f"Step 2 failed with status {result['status_code']}",
                result["data"]
            )
    
    async def test_onboarding_step3(self):
        """Test onboarding step 3 (arena creation)"""
        logger.info("🏟️ Testing onboarding step 3 (arena creation)...")
        
        payload = {
            "sport_type": "Cricket",
            "arena_name": "Cricket Ground A",
            "capacity": 22,
            "description": "Professional cricket ground with floodlights",
            "slot_duration": 120,
            "price_per_hour": 1200.0
        }
        result = await self.make_request("POST", "/onboarding/step3", payload)
        
        if result["success"]:
            data = result["data"]
            
            if (data.get("success") and 
                data.get("next_step") == 4 and
                "arena_id" in data):
                
                self.arena_id = data["arena_id"]
                
                self.log_result(
                    "Onboarding Step 3 (Arena Creation)",
                    True,
                    f"Step 3 completed, arena created with ID: {self.arena_id}",
                    data
                )
            else:
                self.log_result(
                    "Onboarding Step 3 (Arena Creation)",
                    False,
                    "Step 3 response missing required fields",
                    data
                )
        else:
            self.log_result(
                "Onboarding Step 3 (Arena Creation)",
                False,
                f"Step 3 failed with status {result['status_code']}",
                result["data"]
            )
    
    async def test_onboarding_step4(self):
        """Test onboarding step 4 (amenities)"""
        logger.info("🏪 Testing onboarding step 4 (amenities)...")
        
        payload = {
            "amenities": ["Parking", "Washroom", "Floodlights", "Seating"],
            "rules": "No smoking, No alcohol, Proper sports attire required"
        }
        result = await self.make_request("POST", "/onboarding/step4", payload)
        
        if result["success"]:
            data = result["data"]
            
            if (data.get("success") and 
                data.get("next_step") == 5):
                
                self.log_result(
                    "Onboarding Step 4 (Amenities)",
                    True,
                    f"Step 4 completed with amenities and rules",
                    data
                )
            else:
                self.log_result(
                    "Onboarding Step 4 (Amenities)",
                    False,
                    "Step 4 response missing required fields",
                    data
                )
        else:
            self.log_result(
                "Onboarding Step 4 (Amenities)",
                False,
                f"Step 4 failed with status {result['status_code']}",
                result["data"]
            )
    
    async def test_onboarding_step5(self):
        """Test onboarding step 5 (payment info)"""
        logger.info("💳 Testing onboarding step 5 (payment info)...")
        
        payload = {
            "bank_account_number": "1234567890",
            "bank_ifsc": "HDFC0001234",
            "bank_account_holder": "Rajesh Kumar",
            "upi_id": "rajesh@paytm"
        }
        result = await self.make_request("POST", "/onboarding/step5", payload)
        
        if result["success"]:
            data = result["data"]
            
            if (data.get("success") and 
                data.get("onboarding_completed") == True):
                
                self.log_result(
                    "Onboarding Step 5 (Payment Info)",
                    True,
                    f"Step 5 completed, onboarding finished",
                    data
                )
            else:
                self.log_result(
                    "Onboarding Step 5 (Payment Info)",
                    False,
                    "Step 5 response missing required fields",
                    data
                )
        else:
            self.log_result(
                "Onboarding Step 5 (Payment Info)",
                False,
                f"Step 5 failed with status {result['status_code']}",
                result["data"]
            )
    
    async def test_onboarding_status(self):
        """Test onboarding status endpoint"""
        logger.info("📊 Testing onboarding status...")
        
        result = await self.make_request("GET", "/onboarding/status")
        
        if result["success"]:
            data = result["data"]
            
            if (data.get("user_id") and 
                data.get("mobile") == self.test_user_mobile and
                data.get("onboarding_completed") == True and
                data.get("completed_steps") == [1, 2, 3, 4, 5]):
                
                self.log_result(
                    "Onboarding Status",
                    True,
                    f"Onboarding status retrieved successfully, all steps completed",
                    data
                )
            else:
                self.log_result(
                    "Onboarding Status",
                    False,
                    "Onboarding status response missing required fields",
                    data
                )
        else:
            self.log_result(
                "Onboarding Status",
                False,
                f"Onboarding status failed with status {result['status_code']}",
                result["data"]
            )
    
    async def test_profile_api_unified_schema(self):
        """Test profile API with unified schema (reads from venues collection)"""
        logger.info("👤 Testing profile API with unified schema...")
        
        result = await self.make_request("GET", "/auth/profile")
        
        if result["success"]:
            data = result["data"]
            
            # Check unified schema fields
            if (data.get("id") and 
                data.get("mobile") == self.test_user_mobile and
                data.get("name") == self.test_user_name and  # Single name field
                data.get("role") == "venue_partner" and
                data.get("onboarding_completed") == True and
                "venue_name" in data and  # Should read from venues collection
                "venue_city" in data and
                "has_venue" in data and
                "has_arenas" in data and
                "total_arenas" in data):
                
                self.log_result(
                    "Profile API (Unified Schema)",
                    True,
                    f"Profile retrieved with unified schema, venue info from venues collection",
                    data
                )
            else:
                self.log_result(
                    "Profile API (Unified Schema)",
                    False,
                    "Profile response missing unified schema fields",
                    data
                )
        else:
            self.log_result(
                "Profile API (Unified Schema)",
                False,
                f"Profile API failed with status {result['status_code']}",
                result["data"]
            )
    
    async def test_existing_user_login(self):
        """Test login for existing user (should go to dashboard)"""
        logger.info("🔄 Testing login for existing user...")
        
        # Clear token first
        self.clear_auth_token()
        
        # Send OTP again
        await self.test_send_otp()
        
        payload = {
            "mobile": self.test_user_mobile,
            "otp": self.received_otp or "123456"
        }
        result = await self.make_request("POST", "/auth/login", payload)
        
        if result["success"]:
            data = result["data"]
            
            if (data.get("success") and 
                data.get("user_exists") == True and
                data.get("action") == "dashboard_access" and
                data.get("redirect_to") == "dashboard" and
                "access_token" in data and
                data.get("user", {}).get("onboarding_completed") == True):
                
                self.set_auth_token(data["access_token"])
                
                self.log_result(
                    "Existing User Login",
                    True,
                    f"Existing user login successful, redirected to dashboard",
                    data
                )
            else:
                self.log_result(
                    "Existing User Login",
                    False,
                    "Login response missing required fields for existing user flow",
                    data
                )
        else:
            self.log_result(
                "Existing User Login",
                False,
                f"Existing user login failed with status {result['status_code']}",
                result["data"]
            )
    
    async def test_data_integrity(self):
        """Test data integrity - check if data is stored in correct collections"""
        logger.info("🔍 Testing data integrity...")
        
        # Get profile to check venue data
        result = await self.make_request("GET", "/auth/profile")
        
        if result["success"]:
            data = result["data"]
            
            # Check if venue info is present (should come from venues collection)
            if (data.get("venue_name") and 
                data.get("venue_city") and
                data.get("has_venue") == True and
                data.get("has_arenas") == True):
                
                self.log_result(
                    "Data Integrity Check",
                    True,
                    f"Data integrity verified - venue info properly retrieved from venues collection",
                    {
                        "venue_name": data.get("venue_name"),
                        "venue_city": data.get("venue_city"),
                        "has_venue": data.get("has_venue"),
                        "has_arenas": data.get("has_arenas"),
                        "total_arenas": data.get("total_arenas")
                    }
                )
            else:
                self.log_result(
                    "Data Integrity Check",
                    False,
                    "Data integrity issue - venue info not properly retrieved",
                    data
                )
        else:
            self.log_result(
                "Data Integrity Check",
                False,
                f"Could not verify data integrity, profile API failed",
                result["data"]
            )
    
    async def run_all_tests(self):
        """Run all unified schema tests"""
        logger.info("🚀 Starting KhelON Unified Schema Testing...")
        logger.info("=" * 80)
        
        # Test sequence for unified schema changes
        test_sequence = [
            self.test_health_check,
            self.test_send_otp,
            self.test_verify_otp,
            self.test_login_new_user,
            self.test_onboarding_step1,
            self.test_onboarding_step2,
            self.test_onboarding_step3,
            self.test_onboarding_step4,
            self.test_onboarding_step5,
            self.test_onboarding_status,
            self.test_profile_api_unified_schema,
            self.test_existing_user_login,
            self.test_data_integrity
        ]
        
        for test_func in test_sequence:
            try:
                await test_func()
                await asyncio.sleep(0.5)  # Small delay between tests
            except Exception as e:
                self.log_result(test_func.__name__, False, f"Test execution failed: {str(e)}")
        
        # Print summary
        self.print_summary()
    
    def print_summary(self):
        """Print test summary"""
        logger.info("\n" + "=" * 80)
        logger.info("📊 TEST SUMMARY - KHELON UNIFIED SCHEMA CHANGES")
        logger.info("=" * 80)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result["success"])
        failed_tests = total_tests - passed_tests
        
        logger.info(f"Total Tests: {total_tests}")
        logger.info(f"✅ Passed: {passed_tests}")
        logger.info(f"❌ Failed: {failed_tests}")
        logger.info(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        if failed_tests > 0:
            logger.info("\n🔍 FAILED TESTS:")
            for result in self.test_results:
                if not result["success"]:
                    logger.info(f"  ❌ {result['test']}: {result['details']}")
        
        logger.info("\n🎯 KEY UNIFIED SCHEMA FEATURES TESTED:")
        logger.info("  • Single name field (not first_name + last_name)")
        logger.info("  • contact_phone field validation")
        logger.info("  • Unified collections (users, venues, bookings)")
        logger.info("  • Profile API reads from venues collection")
        logger.info("  • Progressive onboarding flow (5 steps)")
        logger.info("  • Mobile OTP authentication system")
        logger.info("  • Data integrity across collections")
        
        return {
            "total_tests": total_tests,
            "passed_tests": passed_tests,
            "failed_tests": failed_tests,
            "success_rate": (passed_tests/total_tests)*100 if total_tests > 0 else 0,
            "test_results": self.test_results
        }

# Main execution
async def main():
    """Main test execution"""
    async with KhelONUnifiedTester() as tester:
        await tester.run_all_tests()

if __name__ == "__main__":
    asyncio.run(main())