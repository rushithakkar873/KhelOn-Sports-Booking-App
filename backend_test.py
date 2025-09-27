#!/usr/bin/env python3
"""
SECURE ONBOARDING FLOW TESTING
Testing the fully fixed secure onboarding flow with JWT protection
"""

import asyncio
import aiohttp
import json
import sys
from datetime import datetime
from typing import Dict, Any

# Backend URL from environment
BACKEND_URL = "https://sports-book.preview.emergentagent.com/api"

class SecureOnboardingTester:
    def __init__(self):
        self.session = None
        self.test_results = []
        
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    def log_test(self, test_name: str, success: bool, details: str = ""):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if details:
            print(f"   {details}")
        
        self.test_results.append({
            "test": test_name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat()
        })
    
    async def send_otp(self, mobile: str) -> Dict[str, Any]:
        """Send OTP to mobile number"""
        try:
            async with self.session.post(
                f"{BACKEND_URL}/auth/send-otp",
                json={"mobile": mobile},
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