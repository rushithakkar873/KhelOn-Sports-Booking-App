#!/usr/bin/env python3
"""
Focused Backend Testing for KhelON Unified Schema Changes
Testing the key unified schema features mentioned in the review request
"""

import asyncio
import aiohttp
import json
import logging
from datetime import datetime
from typing import Dict, Any, Optional

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Configuration
BASE_URL = "https://sportsbooker-5.preview.emergentagent.com/api"

class UnifiedSchemaTester:
    """Focused tester for KhelON unified schema changes"""
    
    def __init__(self):
        self.base_url = BASE_URL
        self.session = None
        self.test_results = []
        self.auth_token = None
        self.test_user_mobile = "+919876543210"
        self.test_user_name = "Rajesh Kumar"
        self.test_user_email = "rajesh.kumar@example.com"
        self.received_otp = None
        
        logger.info(f"🌐 Testing backend at: {self.base_url}")
        
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
        
    def log_result(self, test_name: str, success: bool, details: str = "", response_data: Any = None):
        """Log test result"""
        result = {
            "test": test_name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat(),
            "response_data": response_data
        }
        self.test_results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        logger.info(f"{status} {test_name}: {details}")
        
        if not success and response_data:
            logger.info(f"   Response: {json.dumps(response_data, indent=2)}")
    
    def set_auth_token(self, token: str):
        """Set authentication token for subsequent requests"""
        self.auth_token = token
    
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
        """Test API health and KhelON branding"""
        logger.info("🔍 Testing API health and KhelON branding...")
        
        result = await self.make_request("GET", "/")
        
        if result["success"]:
            data = result["data"]
            
            # Check for KhelON branding and unified auth system
            if ("KhelOn" in data.get("message", "") and 
                data.get("auth_type") == "mobile_otp" and
                "v2.0.0" in data.get("message", "")):
                self.log_result(
                    "Health Check & KhelON Branding",
                    True,
                    f"API healthy with KhelON v2.0.0 branding and unified auth system",
                    data
                )
            else:
                self.log_result(
                    "Health Check & KhelON Branding",
                    False,
                    f"Missing KhelON branding or unified auth system indicators",
                    data
                )
        else:
            self.log_result(
                "Health Check & KhelON Branding",
                False,
                f"Health check failed with status {result['status_code']}",
                result["data"]
            )
    
    async def test_unified_auth_flow(self):
        """Test complete unified authentication flow"""
        logger.info("🔐 Testing unified authentication flow...")
        
        # Step 1: Send OTP
        otp_result = await self.make_request("POST", "/auth/send-otp", {
            "mobile": self.test_user_mobile
        })
        
        if not otp_result["success"]:
            self.log_result(
                "Unified Auth Flow",
                False,
                "Failed to send OTP",
                otp_result["data"]
            )
            return
        
        # Extract OTP from dev_info
        dev_info = otp_result["data"].get("dev_info", "")
        if "OTP:" in dev_info:
            self.received_otp = dev_info.split("OTP:")[1].strip()
        
        # Step 2: Login (which includes OTP verification)
        login_result = await self.make_request("POST", "/auth/login", {
            "mobile": self.test_user_mobile,
            "otp": self.received_otp or "123456"
        })
        
        if login_result["success"]:
            data = login_result["data"]
            
            # Check if it's a new user flow (expected for first time)
            if (data.get("success") and 
                data.get("user_exists") == False and
                data.get("action") == "start_onboarding" and
                "access_token" in data):
                
                self.set_auth_token(data["access_token"])
                
                self.log_result(
                    "Unified Auth Flow",
                    True,
                    f"Unified auth flow working - new user redirected to onboarding",
                    {
                        "user_exists": data.get("user_exists"),
                        "action": data.get("action"),
                        "redirect_to": data.get("redirect_to"),
                        "has_token": "access_token" in data
                    }
                )
            else:
                self.log_result(
                    "Unified Auth Flow",
                    False,
                    "Login response missing required unified auth fields",
                    data
                )
        else:
            self.log_result(
                "Unified Auth Flow",
                False,
                f"Login failed with status {login_result['status_code']}",
                login_result["data"]
            )
    
    async def test_single_name_field_onboarding(self):
        """Test onboarding step 1 with single name field (not first_name + last_name)"""
        logger.info("👤 Testing single name field in onboarding...")
        
        if not self.auth_token:
            self.log_result(
                "Single Name Field Onboarding",
                False,
                "No auth token available for onboarding test"
            )
            return
        
        # Test onboarding step 1 with single name field
        payload = {
            "mobile": self.test_user_mobile,
            "otp": self.received_otp or "123456",
            "name": self.test_user_name,  # Single name field (unified schema)
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
                
                # Update token for next steps
                self.set_auth_token(data["access_token"])
                
                self.log_result(
                    "Single Name Field Onboarding",
                    True,
                    f"Step 1 completed with single name field: {self.test_user_name}",
                    {
                        "success": data.get("success"),
                        "next_step": data.get("next_step"),
                        "has_token": "access_token" in data
                    }
                )
            else:
                self.log_result(
                    "Single Name Field Onboarding",
                    False,
                    "Step 1 response missing required fields",
                    data
                )
        else:
            self.log_result(
                "Single Name Field Onboarding",
                False,
                f"Step 1 failed with status {result['status_code']}",
                result["data"]
            )
    
    async def test_contact_phone_field_validation(self):
        """Test onboarding step 2 with contact_phone field validation"""
        logger.info("📞 Testing contact_phone field validation...")
        
        if not self.auth_token:
            self.log_result(
                "Contact Phone Field Validation",
                False,
                "No auth token available for step 2 test"
            )
            return
        
        # Test with valid contact_phone
        payload = {
            "venue_name": "Elite Cricket Ground",
            "address": "456 Ground Road, Andheri West",
            "city": "Mumbai",
            "state": "Maharashtra",
            "pincode": "400058",
            "operating_days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
            "start_time": "06:00",
            "end_time": "22:00",
            "contact_phone": "+919876543210"  # Properly formatted contact_phone
        }
        
        result = await self.make_request("POST", "/onboarding/step2", payload)
        
        if result["success"]:
            data = result["data"]
            
            if (data.get("success") and 
                data.get("next_step") == 3):
                
                self.log_result(
                    "Contact Phone Field Validation",
                    True,
                    f"Step 2 completed with contact_phone field validation",
                    {
                        "success": data.get("success"),
                        "next_step": data.get("next_step"),
                        "contact_phone_accepted": "+919876543210"
                    }
                )
            else:
                self.log_result(
                    "Contact Phone Field Validation",
                    False,
                    "Step 2 response missing required fields",
                    data
                )
        else:
            self.log_result(
                "Contact Phone Field Validation",
                False,
                f"Step 2 failed with status {result['status_code']}",
                result["data"]
            )
    
    async def test_progressive_onboarding_flow(self):
        """Test remaining onboarding steps (3, 4, 5)"""
        logger.info("🏗️ Testing progressive onboarding flow...")
        
        if not self.auth_token:
            self.log_result(
                "Progressive Onboarding Flow",
                False,
                "No auth token available for onboarding flow test"
            )
            return
        
        # Step 3: Arena creation
        step3_payload = {
            "sport_type": "Cricket",
            "arena_name": "Cricket Ground A",
            "capacity": 22,
            "description": "Professional cricket ground with floodlights",
            "slot_duration": 120,
            "price_per_hour": 1200.0
        }
        
        step3_result = await self.make_request("POST", "/onboarding/step3", step3_payload)
        
        if not step3_result["success"]:
            self.log_result(
                "Progressive Onboarding Flow",
                False,
                f"Step 3 failed with status {step3_result['status_code']}",
                step3_result["data"]
            )
            return
        
        # Step 4: Amenities
        step4_payload = {
            "amenities": ["Parking", "Washroom", "Floodlights", "Seating"],
            "rules": "No smoking, No alcohol, Proper sports attire required"
        }
        
        step4_result = await self.make_request("POST", "/onboarding/step4", step4_payload)
        
        if not step4_result["success"]:
            self.log_result(
                "Progressive Onboarding Flow",
                False,
                f"Step 4 failed with status {step4_result['status_code']}",
                step4_result["data"]
            )
            return
        
        # Step 5: Payment info
        step5_payload = {
            "bank_account_number": "1234567890",
            "bank_ifsc": "HDFC0001234",
            "bank_account_holder": "Rajesh Kumar",
            "upi_id": "rajesh@paytm"
        }
        
        step5_result = await self.make_request("POST", "/onboarding/step5", step5_payload)
        
        if step5_result["success"]:
            data = step5_result["data"]
            
            if (data.get("success") and 
                data.get("onboarding_completed") == True):
                
                self.log_result(
                    "Progressive Onboarding Flow",
                    True,
                    f"All onboarding steps (3, 4, 5) completed successfully",
                    {
                        "step3_success": step3_result["success"],
                        "step4_success": step4_result["success"],
                        "step5_success": step5_result["success"],
                        "onboarding_completed": data.get("onboarding_completed")
                    }
                )
            else:
                self.log_result(
                    "Progressive Onboarding Flow",
                    False,
                    "Step 5 response missing onboarding completion",
                    data
                )
        else:
            self.log_result(
                "Progressive Onboarding Flow",
                False,
                f"Step 5 failed with status {step5_result['status_code']}",
                step5_result["data"]
            )
    
    async def test_onboarding_status_api(self):
        """Test onboarding status API"""
        logger.info("📊 Testing onboarding status API...")
        
        if not self.auth_token:
            self.log_result(
                "Onboarding Status API",
                False,
                "No auth token available for status test"
            )
            return
        
        result = await self.make_request("GET", "/onboarding/status")
        
        if result["success"]:
            data = result["data"]
            
            if (data.get("user_id") and 
                data.get("mobile") == self.test_user_mobile and
                "completed_steps" in data and
                "current_step" in data and
                "onboarding_completed" in data):
                
                self.log_result(
                    "Onboarding Status API",
                    True,
                    f"Onboarding status retrieved successfully",
                    {
                        "mobile": data.get("mobile"),
                        "completed_steps": data.get("completed_steps"),
                        "current_step": data.get("current_step"),
                        "onboarding_completed": data.get("onboarding_completed")
                    }
                )
            else:
                self.log_result(
                    "Onboarding Status API",
                    False,
                    "Status response missing required fields",
                    data
                )
        else:
            self.log_result(
                "Onboarding Status API",
                False,
                f"Status API failed with status {result['status_code']}",
                result["data"]
            )
    
    async def test_profile_api_unified_schema(self):
        """Test profile API with unified schema"""
        logger.info("👤 Testing profile API with unified schema...")
        
        if not self.auth_token:
            self.log_result(
                "Profile API Unified Schema",
                False,
                "No auth token available for profile test"
            )
            return
        
        result = await self.make_request("GET", "/auth/profile")
        
        if result["success"]:
            data = result["data"]
            
            # Check unified schema fields
            if (data.get("id") and 
                data.get("mobile") == self.test_user_mobile and
                data.get("name") == self.test_user_name and  # Single name field
                data.get("role") == "venue_partner" and
                "venue_name" in data and  # Should read from venues collection
                "venue_city" in data and
                "has_venue" in data and
                "has_arenas" in data and
                "total_arenas" in data):
                
                self.log_result(
                    "Profile API Unified Schema",
                    True,
                    f"Profile retrieved with unified schema fields",
                    {
                        "name": data.get("name"),  # Single name field
                        "mobile": data.get("mobile"),
                        "role": data.get("role"),
                        "has_venue": data.get("has_venue"),
                        "has_arenas": data.get("has_arenas"),
                        "venue_name": data.get("venue_name"),
                        "venue_city": data.get("venue_city")
                    }
                )
            else:
                self.log_result(
                    "Profile API Unified Schema",
                    False,
                    "Profile response missing unified schema fields",
                    data
                )
        else:
            self.log_result(
                "Profile API Unified Schema",
                False,
                f"Profile API failed with status {result['status_code']}",
                result["data"]
            )
    
    async def run_focused_tests(self):
        """Run focused unified schema tests"""
        logger.info("🚀 Starting KhelON Unified Schema Focused Testing...")
        logger.info("=" * 80)
        
        # Test sequence focusing on unified schema changes
        test_sequence = [
            self.test_health_check,
            self.test_unified_auth_flow,
            self.test_single_name_field_onboarding,
            self.test_contact_phone_field_validation,
            self.test_progressive_onboarding_flow,
            self.test_onboarding_status_api,
            self.test_profile_api_unified_schema
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
        logger.info("📊 UNIFIED SCHEMA TESTING SUMMARY")
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
        
        logger.info("\n🎯 UNIFIED SCHEMA FEATURES TESTED:")
        logger.info("  • KhelON v2.0.0 branding and mobile OTP auth")
        logger.info("  • Single name field (not first_name + last_name)")
        logger.info("  • contact_phone field validation")
        logger.info("  • Progressive onboarding flow (5 steps)")
        logger.info("  • Profile API with unified schema")
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
    async with UnifiedSchemaTester() as tester:
        await tester.run_focused_tests()

if __name__ == "__main__":
    asyncio.run(main())