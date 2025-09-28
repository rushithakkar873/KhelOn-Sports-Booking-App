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
        # Use internal backend URL for testing
        self.base_url = "http://localhost:8001/api"
        
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
        self.received_otp = None
        
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
                # Extract OTP from dev_info (format: "OTP: 123456")
                dev_info = result["data"]["dev_info"]
                if "OTP:" in dev_info:
                    self.received_otp = dev_info.split("OTP:")[1].strip()
                    logger.info(f"🔐 Dev OTP: {dev_info}")
                else:
                    self.received_otp = None
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