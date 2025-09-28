#!/usr/bin/env python3
"""
Backend API Testing for Onboarding Step 2 Contact Phone Fix
Testing the specific fix for contact_phone field formatting in onboarding step 2
"""

import asyncio
import aiohttp
import json
import logging
from datetime import datetime
from typing import Dict, Any

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class OnboardingStep2Tester:
    def __init__(self):
        # Get backend URL from environment
        with open('/app/frontend/.env', 'r') as f:
            env_content = f.read()
            for line in env_content.split('\n'):
                if 'EXPO_PUBLIC_BACKEND_URL=' in line and not line.startswith('#'):
                    self.base_url = line.split('=')[1].strip() + '/api'
                    break
        
        logger.info(f"🌐 Testing backend at: {self.base_url}")
        
        # Test data
        self.test_mobile = "+919876543210"
        self.test_user_data = {
            "first_name": "Rajesh",
            "last_name": "Kumar",
            "email": "rajesh.kumar@example.com"
        }
        
        # Test venue data with properly formatted contact_phone
        self.test_venue_data = {
            "venue_name": "Elite Sports Complex",
            "address": "456 Ground Road, Andheri West",
            "city": "Mumbai",
            "state": "Maharashtra", 
            "pincode": "400058",
            "cover_photo": None,
            "operating_days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
            "start_time": "06:00",
            "end_time": "22:00",
            "contact_phone": "+919876543210"  # Properly formatted phone number
        }
        
        # Invalid contact_phone formats to test validation
        self.invalid_phone_formats = [
            "9876543210",           # Missing +91
            "+919876543",           # Too short
            "+9198765432100",       # Too long
            "+915876543210",        # Invalid first digit (5)
            "+91abcd543210",        # Contains letters
            "+92876543210",         # Wrong country code
            "919876543210",         # Missing +
            "+91 9876543210",       # Contains space
            "+91-9876543210",       # Contains dash
        ]
        
        self.session = None
        self.jwt_token = None
        
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    async def make_request(self, method: str, endpoint: str, data: Dict = None, headers: Dict = None) -> Dict[str, Any]:
        """Make HTTP request with error handling"""
        url = f"{self.base_url}{endpoint}"
        
        try:
            default_headers = {"Content-Type": "application/json"}
            if headers:
                default_headers.update(headers)
                
            if self.jwt_token and "Authorization" not in default_headers:
                default_headers["Authorization"] = f"Bearer {self.jwt_token}"
            
            async with self.session.request(
                method, url, 
                json=data if data else None,
                headers=default_headers
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
    
    async def test_api_health(self) -> bool:
        """Test API health check"""
        logger.info("🔍 Testing API health...")
        
        result = await self.make_request("GET", "/")
        
        if result["success"]:
            logger.info(f"✅ API Health: {result['data'].get('message', 'OK')}")
            return True
        else:
            logger.error(f"❌ API Health failed: {result['data']}")
            return False
    
    async def test_send_otp(self) -> bool:
        """Test sending OTP to mobile number"""
        logger.info(f"📱 Testing OTP send to {self.test_mobile}...")
        
        result = await self.make_request("POST", "/auth/send-otp", {
            "mobile": self.test_mobile
        })
        
        if result["success"]:
            logger.info(f"✅ OTP sent successfully: {result['data'].get('message')}")
            if "dev_info" in result["data"]:
                logger.info(f"🔐 Dev OTP: {result['data']['dev_info']}")
            return True
        else:
            logger.error(f"❌ OTP send failed: {result['data']}")
            return False
    
    async def test_login_and_get_token(self) -> bool:
        """Test login with mobile OTP and get JWT token"""
        logger.info(f"🔑 Testing login with {self.test_mobile}...")
        
        # Use mock OTP (in real scenario, user would enter received OTP)
        mock_otp = "123456"  # Mock OTP for testing
        
        result = await self.make_request("POST", "/auth/login", {
            "mobile": self.test_mobile,
            "otp": mock_otp
        })
        
        if result["success"]:
            data = result["data"]
            if "access_token" in data:
                self.jwt_token = data["access_token"]
                logger.info(f"✅ Login successful: {data.get('message')}")
                logger.info(f"🎫 JWT Token obtained: {self.jwt_token[:20]}...")
                logger.info(f"📍 Action: {data.get('action')}, Redirect: {data.get('redirect_to')}")
                return True
            else:
                logger.error(f"❌ Login successful but no token: {data}")
                return False
        else:
            logger.error(f"❌ Login failed: {result['data']}")
            return False
    
    async def test_onboarding_step1(self) -> bool:
        """Test onboarding step 1 - basic user info"""
        logger.info("👤 Testing onboarding step 1...")
        
        if not self.jwt_token:
            logger.error("❌ No JWT token available for step 1")
            return False
        
        result = await self.make_request("POST", "/onboarding/step1", self.test_user_data)
        
        if result["success"]:
            data = result["data"]
            logger.info(f"✅ Step 1 completed: {data.get('message')}")
            logger.info(f"📍 Next step: {data.get('next_step')}")
            
            # Update JWT token if provided
            if "access_token" in data:
                self.jwt_token = data["access_token"]
                logger.info("🎫 JWT Token updated for permanent user")
            
            return True
        else:
            logger.error(f"❌ Step 1 failed: {result['data']}")
            return False
    
    async def test_onboarding_step2_valid_phone(self) -> bool:
        """Test onboarding step 2 with valid contact_phone format"""
        logger.info("🏢 Testing onboarding step 2 with VALID contact_phone...")
        
        if not self.jwt_token:
            logger.error("❌ No JWT token available for step 2")
            return False
        
        result = await self.make_request("POST", "/onboarding/step2", self.test_venue_data)
        
        if result["success"]:
            data = result["data"]
            logger.info(f"✅ Step 2 completed with valid phone: {data.get('message')}")
            logger.info(f"📍 Next step: {data.get('next_step')}")
            logger.info(f"📞 Contact phone accepted: {self.test_venue_data['contact_phone']}")
            return True
        else:
            logger.error(f"❌ Step 2 failed with valid phone: {result['data']}")
            return False
    
    async def test_onboarding_step2_invalid_phones(self) -> Dict[str, bool]:
        """Test onboarding step 2 with various invalid contact_phone formats"""
        logger.info("🚫 Testing onboarding step 2 with INVALID contact_phone formats...")
        
        if not self.jwt_token:
            logger.error("❌ No JWT token available for invalid phone tests")
            return {}
        
        results = {}
        
        for invalid_phone in self.invalid_phone_formats:
            logger.info(f"🔍 Testing invalid phone: {invalid_phone}")
            
            # Create test data with invalid phone
            invalid_venue_data = self.test_venue_data.copy()
            invalid_venue_data["contact_phone"] = invalid_phone
            
            result = await self.make_request("POST", "/onboarding/step2", invalid_venue_data)
            
            # We expect this to fail with 422 validation error
            if result["status_code"] == 422:
                logger.info(f"✅ Correctly rejected invalid phone: {invalid_phone}")
                results[invalid_phone] = True
            elif not result["success"]:
                logger.info(f"✅ Rejected invalid phone (status {result['status_code']}): {invalid_phone}")
                results[invalid_phone] = True
            else:
                logger.error(f"❌ Incorrectly accepted invalid phone: {invalid_phone}")
                results[invalid_phone] = False
        
        return results
    
    async def test_onboarding_status(self) -> bool:
        """Test getting onboarding status"""
        logger.info("📊 Testing onboarding status...")
        
        if not self.jwt_token:
            logger.error("❌ No JWT token available for status check")
            return False
        
        result = await self.make_request("GET", "/onboarding/status")
        
        if result["success"]:
            data = result["data"]
            logger.info(f"✅ Onboarding status retrieved:")
            logger.info(f"   📱 Mobile: {data.get('mobile')}")
            logger.info(f"   ✅ Completed steps: {data.get('completed_steps')}")
            logger.info(f"   📍 Current step: {data.get('current_step')}")
            logger.info(f"   🏁 Onboarding completed: {data.get('onboarding_completed')}")
            return True
        else:
            logger.error(f"❌ Status check failed: {result['data']}")
            return False
    
    async def run_comprehensive_test(self):
        """Run comprehensive onboarding step 2 contact_phone fix test"""
        logger.info("🚀 Starting Comprehensive Onboarding Step 2 Contact Phone Fix Test")
        logger.info("=" * 80)
        
        test_results = {}
        
        # Test 1: API Health
        test_results["api_health"] = await self.test_api_health()
        
        # Test 2: Send OTP
        test_results["send_otp"] = await self.test_send_otp()
        
        # Test 3: Login and get JWT token
        test_results["login"] = await self.test_login_and_get_token()
        
        # Test 4: Complete onboarding step 1
        test_results["step1"] = await self.test_onboarding_step1()
        
        # Test 5: Test step 2 with valid contact_phone
        test_results["step2_valid"] = await self.test_onboarding_step2_valid_phone()
        
        # Test 6: Test step 2 with invalid contact_phone formats
        invalid_phone_results = await self.test_onboarding_step2_invalid_phones()
        test_results["step2_invalid_phones"] = invalid_phone_results
        
        # Test 7: Check onboarding status
        test_results["status_check"] = await self.test_onboarding_status()
        
        # Summary
        logger.info("=" * 80)
        logger.info("📋 TEST SUMMARY - ONBOARDING STEP 2 CONTACT PHONE FIX")
        logger.info("=" * 80)
        
        passed_tests = 0
        total_tests = 0
        
        # Core functionality tests
        core_tests = ["api_health", "send_otp", "login", "step1", "step2_valid", "status_check"]
        for test_name in core_tests:
            total_tests += 1
            if test_results.get(test_name, False):
                logger.info(f"✅ {test_name.upper()}: PASSED")
                passed_tests += 1
            else:
                logger.info(f"❌ {test_name.upper()}: FAILED")
        
        # Invalid phone validation tests
        invalid_phone_results = test_results.get("step2_invalid_phones", {})
        for phone, result in invalid_phone_results.items():
            total_tests += 1
            if result:
                logger.info(f"✅ INVALID_PHONE_REJECTION ({phone}): PASSED")
                passed_tests += 1
            else:
                logger.info(f"❌ INVALID_PHONE_REJECTION ({phone}): FAILED")
        
        logger.info("=" * 80)
        logger.info(f"📊 OVERALL RESULTS: {passed_tests}/{total_tests} tests passed")
        
        if passed_tests == total_tests:
            logger.info("🎉 ALL TESTS PASSED - ONBOARDING STEP 2 CONTACT PHONE FIX IS WORKING!")
        else:
            logger.info(f"⚠️  {total_tests - passed_tests} tests failed - Issues found with contact phone validation")
        
        logger.info("=" * 80)
        
        # Specific findings about the fix
        logger.info("🔍 SPECIFIC FINDINGS ABOUT CONTACT PHONE FIX:")
        
        if test_results.get("step2_valid", False):
            logger.info(f"✅ Valid contact_phone format (+91[6-9]XXXXXXXXX) is accepted: {self.test_venue_data['contact_phone']}")
        else:
            logger.info("❌ Valid contact_phone format is being rejected - FIX NOT WORKING")
        
        rejected_invalid = sum(1 for result in invalid_phone_results.values() if result)
        total_invalid = len(invalid_phone_results)
        
        if rejected_invalid == total_invalid and total_invalid > 0:
            logger.info(f"✅ All {total_invalid} invalid contact_phone formats correctly rejected")
        elif total_invalid > 0:
            logger.info(f"⚠️  Only {rejected_invalid}/{total_invalid} invalid formats rejected")
        
        logger.info("=" * 80)
        
        return test_results

async def main():
    """Main test execution"""
    async with OnboardingStep2Tester() as tester:
        await tester.run_comprehensive_test()

if __name__ == "__main__":
    asyncio.run(main())
            ) as response:
                data = await response.json()
                return {
                    "success": response.status == 200,
                    "status_code": response.status,
                    "data": data
                }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    async def login_with_otp(self, mobile: str, otp: str) -> Dict[str, Any]:
        """Login with OTP - Enhanced endpoint that handles routing"""
        try:
            async with self.session.post(
                f"{BACKEND_URL}/auth/login",
                json={"mobile": mobile, "otp": otp},
                headers={"Content-Type": "application/json"}
            ) as response:
                data = await response.json()
                return {
                    "success": response.status == 200,
                    "status_code": response.status,
                    "data": data
                }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    async def onboarding_step1_jwt(self, jwt_token: str, first_name: str, last_name: str, email: str = None) -> Dict[str, Any]:
        """Onboarding Step 1 with JWT protection (no OTP required)"""
        try:
            payload = {
                "first_name": first_name,
                "last_name": last_name
            }
            if email:
                payload["email"] = email
                
            async with self.session.post(
                f"{BACKEND_URL}/onboarding/step1",
                json=payload,
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {jwt_token}"
                }
            ) as response:
                data = await response.json()
                return {
                    "success": response.status == 200,
                    "status_code": response.status,
                    "data": data
                }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    async def test_new_user_complete_flow(self):
        """Test complete flow for new user +919111222333"""
        print("\n🔥 TESTING NEW USER COMPLETE FLOW")
        import random
        # Generate a unique mobile number for testing
        mobile = f"+9191112{random.randint(10000, 99999)}"
        
        # Step 1: Send OTP
        print(f"\n1️⃣ Sending OTP to {mobile}")
        otp_result = await self.send_otp(mobile)
        
        if not otp_result["success"]:
            self.log_test("NEW USER - Send OTP", False, f"Failed to send OTP: {otp_result.get('error', 'Unknown error')}")
            return False
        
        # Extract OTP from dev_info
        dev_otp = otp_result["data"].get("dev_info", "").replace("OTP: ", "")
        if not dev_otp or len(dev_otp) != 6:
            self.log_test("NEW USER - Send OTP", False, "No valid OTP received in dev_info")
            return False
        
        self.log_test("NEW USER - Send OTP", True, f"OTP sent successfully: {dev_otp}")
        
        # Step 2: Login with OTP (should create temp user + return JWT + routing)
        print(f"\n2️⃣ Login with OTP: {dev_otp}")
        login_result = await self.login_with_otp(mobile, dev_otp)
        
        if not login_result["success"]:
            self.log_test("NEW USER - Login with OTP", False, f"Login failed: {login_result.get('error', 'Unknown error')}")
            return False
        
        login_data = login_result["data"]
        
        # Validate new user response structure
        expected_fields = ["success", "user_exists", "action", "redirect_to", "access_token", "token_type", "temp_user_id", "mobile_verified"]
        missing_fields = [field for field in expected_fields if field not in login_data]
        
        if missing_fields:
            self.log_test("NEW USER - Login Response Structure", False, f"Missing fields: {missing_fields}")
            return False
        
        # Validate new user specific values
        if login_data.get("user_exists") != False:
            self.log_test("NEW USER - User Exists Check", False, f"Expected user_exists=False, got {login_data.get('user_exists')}")
            return False
        
        if login_data.get("action") != "start_onboarding":
            self.log_test("NEW USER - Action Check", False, f"Expected action='start_onboarding', got {login_data.get('action')}")
            return False
        
        if login_data.get("redirect_to") != "onboarding_step_1":
            self.log_test("NEW USER - Redirect Check", False, f"Expected redirect_to='onboarding_step_1', got {login_data.get('redirect_to')}")
            return False
        
        jwt_token = login_data.get("access_token")
        if not jwt_token:
            self.log_test("NEW USER - JWT Token", False, "No JWT token received")
            return False
        
        self.log_test("NEW USER - Login with OTP", True, f"Login successful, JWT received, routing to {login_data.get('redirect_to')}")
        
        # Step 3: Test JWT-Protected Onboarding Step 1 (NO OTP required)
        print(f"\n3️⃣ Testing JWT-Protected Onboarding Step 1")
        step1_result = await self.onboarding_step1_jwt(
            jwt_token=jwt_token,
            first_name="Arjun",
            last_name="Sharma",
            email="arjun.sharma@example.com"
        )
        
        if not step1_result["success"]:
            self.log_test("NEW USER - Onboarding Step 1 JWT", False, f"Step 1 failed: {step1_result.get('error', 'Unknown error')}")
            return False
        
        step1_data = step1_result["data"]
        
        # Validate step 1 response
        if not step1_data.get("success"):
            self.log_test("NEW USER - Onboarding Step 1 JWT", False, f"Step 1 not successful: {step1_data.get('message', 'Unknown error')}")
            return False
        
        # Check if permanent user was created
        if step1_data.get("user_id"):
            self.log_test("NEW USER - Permanent User Creation", True, f"Permanent user created: {step1_data.get('user_id')}")
        else:
            self.log_test("NEW USER - Permanent User Creation", False, "No permanent user ID returned")
            return False
        
        self.log_test("NEW USER - Onboarding Step 1 JWT", True, "Step 1 completed successfully with JWT protection")
        
        print(f"\n✅ NEW USER COMPLETE FLOW SUCCESSFUL")
        return True
    
    async def test_existing_user_flow(self):
        """Test flow for existing user +919909385701"""
        print("\n🔥 TESTING EXISTING USER FLOW")
        mobile = "+919909385701"
        
        # Step 1: Send OTP
        print(f"\n1️⃣ Sending OTP to existing user {mobile}")
        otp_result = await self.send_otp(mobile)
        
        if not otp_result["success"]:
            self.log_test("EXISTING USER - Send OTP", False, f"Failed to send OTP: {otp_result.get('error', 'Unknown error')}")
            return False
        
        # Extract OTP from dev_info
        dev_otp = otp_result["data"].get("dev_info", "").replace("OTP: ", "")
        if not dev_otp or len(dev_otp) != 6:
            self.log_test("EXISTING USER - Send OTP", False, "No valid OTP received in dev_info")
            return False
        
        self.log_test("EXISTING USER - Send OTP", True, f"OTP sent successfully: {dev_otp}")
        
        # Step 2: Login with OTP (should return existing user + JWT + proper routing)
        print(f"\n2️⃣ Login with OTP: {dev_otp}")
        login_result = await self.login_with_otp(mobile, dev_otp)
        
        if not login_result["success"]:
            self.log_test("EXISTING USER - Login with OTP", False, f"Login failed: {login_result.get('error', 'Unknown error')}")
            return False
        
        login_data = login_result["data"]
        
        # Validate existing user response structure
        expected_fields = ["success", "user_exists", "action", "redirect_to", "access_token", "token_type", "user"]
        missing_fields = [field for field in expected_fields if field not in login_data]
        
        if missing_fields:
            self.log_test("EXISTING USER - Login Response Structure", False, f"Missing fields: {missing_fields}")
            return False
        
        # Validate existing user specific values
        if login_data.get("user_exists") != True:
            self.log_test("EXISTING USER - User Exists Check", False, f"Expected user_exists=True, got {login_data.get('user_exists')}")
            return False
        
        # Check routing based on onboarding completion
        user_data = login_data.get("user", {})
        onboarding_completed = user_data.get("onboarding_completed", False)
        
        if onboarding_completed:
            expected_action = "dashboard_access"
            expected_redirect = "dashboard"
        else:
            expected_action = "complete_onboarding"
            current_step = user_data.get("current_step", 1)
            expected_redirect = f"onboarding_step_{current_step}"
        
        if login_data.get("action") != expected_action:
            self.log_test("EXISTING USER - Action Check", False, f"Expected action='{expected_action}', got {login_data.get('action')}")
            return False
        
        if login_data.get("redirect_to") != expected_redirect:
            self.log_test("EXISTING USER - Redirect Check", False, f"Expected redirect_to='{expected_redirect}', got {login_data.get('redirect_to')}")
            return False
        
        jwt_token = login_data.get("access_token")
        if not jwt_token:
            self.log_test("EXISTING USER - JWT Token", False, "No JWT token received")
            return False
        
        self.log_test("EXISTING USER - Login with OTP", True, f"Login successful, JWT received, routing to {login_data.get('redirect_to')}")
        
        print(f"\n✅ EXISTING USER FLOW SUCCESSFUL")
        return True
    
    async def test_security_validation(self):
        """Test JWT security validation"""
        print("\n🔥 TESTING SECURITY VALIDATION")
        
        # Test 1: Onboarding step1 without JWT → 401/403
        print(f"\n1️⃣ Testing onboarding step1 without JWT")
        try:
            async with self.session.post(
                f"{BACKEND_URL}/onboarding/step1",
                json={
                    "first_name": "Test",
                    "last_name": "User"
                },
                headers={"Content-Type": "application/json"}
            ) as response:
                if response.status in [401, 403]:
                    self.log_test("SECURITY - No JWT Protection", True, f"Correctly rejected with status {response.status}")
                else:
                    self.log_test("SECURITY - No JWT Protection", False, f"Expected 401/403, got {response.status}")
                    return False
        except Exception as e:
            self.log_test("SECURITY - No JWT Protection", False, f"Error: {str(e)}")
            return False
        
        # Test 2: Onboarding step1 with invalid JWT → 401/403
        print(f"\n2️⃣ Testing onboarding step1 with invalid JWT")
        try:
            async with self.session.post(
                f"{BACKEND_URL}/onboarding/step1",
                json={
                    "first_name": "Test",
                    "last_name": "User"
                },
                headers={
                    "Content-Type": "application/json",
                    "Authorization": "Bearer invalid_jwt_token_12345"
                }
            ) as response:
                if response.status in [401, 403]:
                    self.log_test("SECURITY - Invalid JWT Protection", True, f"Correctly rejected with status {response.status}")
                else:
                    self.log_test("SECURITY - Invalid JWT Protection", False, f"Expected 401/403, got {response.status}")
                    return False
        except Exception as e:
            self.log_test("SECURITY - Invalid JWT Protection", False, f"Error: {str(e)}")
            return False
        
        # Test 3: Get valid JWT and test successful access
        print(f"\n3️⃣ Testing onboarding step1 with valid JWT")
        
        # First get a valid JWT token
        import random
        mobile = f"+9191112{random.randint(20000, 29999)}"  # Different number for this test
        
        # Send OTP
        otp_result = await self.send_otp(mobile)
        if not otp_result["success"]:
            self.log_test("SECURITY - Valid JWT Test Setup", False, "Failed to send OTP for JWT test")
            return False
        
        dev_otp = otp_result["data"].get("dev_info", "").replace("OTP: ", "")
        
        # Login to get JWT
        login_result = await self.login_with_otp(mobile, dev_otp)
        if not login_result["success"]:
            self.log_test("SECURITY - Valid JWT Test Setup", False, "Failed to login for JWT test")
            return False
        
        jwt_token = login_result["data"].get("access_token")
        if not jwt_token:
            self.log_test("SECURITY - Valid JWT Test Setup", False, "No JWT token received for test")
            return False
        
        # Now test with valid JWT
        step1_result = await self.onboarding_step1_jwt(
            jwt_token=jwt_token,
            first_name="Security",
            last_name="Test"
        )
        
        if step1_result["success"]:
            self.log_test("SECURITY - Valid JWT Access", True, "Successfully accessed with valid JWT")
        else:
            self.log_test("SECURITY - Valid JWT Access", False, f"Failed with valid JWT: {step1_result.get('error', 'Unknown error')}")
            return False
        
        print(f"\n✅ SECURITY VALIDATION SUCCESSFUL")
        return True
    
    async def test_flow_validation(self):
        """Test overall flow validation"""
        print("\n🔥 TESTING FLOW VALIDATION")
        
        # Test 1: Login API returns proper routing instructions
        import random
        mobile = f"+9191112{random.randint(30000, 39999)}"
        
        # Send OTP and login
        otp_result = await self.send_otp(mobile)
        if not otp_result["success"]:
            self.log_test("FLOW - Routing Test Setup", False, "Failed to send OTP")
            return False
        
        dev_otp = otp_result["data"].get("dev_info", "").replace("OTP: ", "")
        login_result = await self.login_with_otp(mobile, dev_otp)
        
        if not login_result["success"]:
            self.log_test("FLOW - Routing Test Setup", False, "Failed to login")
            return False
        
        login_data = login_result["data"]
        
        # Check routing instructions
        required_routing_fields = ["action", "redirect_to", "message"]
        missing_routing = [field for field in required_routing_fields if field not in login_data]
        
        if missing_routing:
            self.log_test("FLOW - Login Routing Instructions", False, f"Missing routing fields: {missing_routing}")
            return False
        
        self.log_test("FLOW - Login Routing Instructions", True, f"Proper routing: {login_data.get('action')} → {login_data.get('redirect_to')}")
        
        # Test 2: JWT tokens work for protected endpoints
        jwt_token = login_data.get("access_token")
        if not jwt_token:
            self.log_test("FLOW - JWT Token Generation", False, "No JWT token in login response")
            return False
        
        # Test JWT with onboarding endpoint
        step1_result = await self.onboarding_step1_jwt(
            jwt_token=jwt_token,
            first_name="Flow",
            last_name="Test"
        )
        
        if step1_result["success"]:
            self.log_test("FLOW - JWT Token Functionality", True, "JWT token works for protected endpoints")
        else:
            self.log_test("FLOW - JWT Token Functionality", False, "JWT token doesn't work for protected endpoints")
            return False
        
        # Test 3: No double OTP verification in onboarding steps
        # This is validated by the fact that step1 works with just JWT, no OTP required
        self.log_test("FLOW - No Double OTP Verification", True, "Onboarding step1 works with JWT only (no OTP required)")
        
        print(f"\n✅ FLOW VALIDATION SUCCESSFUL")
        return True
    
    async def run_all_tests(self):
        """Run all secure onboarding flow tests"""
        print("🚀 STARTING SECURE ONBOARDING FLOW TESTING")
        print("=" * 60)
        
        test_functions = [
            self.test_new_user_complete_flow,
            self.test_existing_user_flow,
            self.test_security_validation,
            self.test_flow_validation
        ]
        
        passed_tests = 0
        total_tests = len(test_functions)
        
        for test_func in test_functions:
            try:
                result = await test_func()
                if result:
                    passed_tests += 1
            except Exception as e:
                print(f"❌ Test {test_func.__name__} failed with exception: {str(e)}")
        
        # Print summary
        print("\n" + "=" * 60)
        print("📊 SECURE ONBOARDING FLOW TEST SUMMARY")
        print("=" * 60)
        
        success_rate = (passed_tests / total_tests) * 100
        print(f"✅ Passed: {passed_tests}/{total_tests} ({success_rate:.1f}%)")
        
        if passed_tests == total_tests:
            print("🎉 ALL SECURE ONBOARDING FLOW TESTS PASSED!")
            print("\n🔐 SECURE FLOW VALIDATION:")
            print("✅ Clean separation: OTP verification in login API only")
            print("✅ JWT protection for all onboarding endpoints")
            print("✅ Proper user routing (new → onboarding, existing → dashboard/incomplete step)")
            print("✅ No OTP double verification in onboarding steps")
            print("✅ Temp user → permanent user conversion in step1")
        else:
            print(f"❌ {total_tests - passed_tests} tests failed")
            print("\n🔍 FAILED TESTS:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"   ❌ {result['test']}: {result['details']}")
        
        return passed_tests == total_tests

async def main():
    """Main test execution"""
    async with SecureOnboardingTester() as tester:
        success = await tester.run_all_tests()
        sys.exit(0 if success else 1)

if __name__ == "__main__":
    asyncio.run(main())