#!/usr/bin/env python3
"""
Progressive Onboarding System Testing
Testing the new unified authentication flow with mobile OTP and 5-step onboarding process
"""

import asyncio
import aiohttp
import json
import uuid
from datetime import datetime
from typing import Dict, Any, Optional

# Configuration
BASE_URL = "https://tourneymaster-16.preview.emergentagent.com/api"
TEST_MOBILE = "+919876541234"  # New number for testing
TEST_USER_DATA = {
    "first_name": "Amit",
    "last_name": "Patel",
    "email": "amit.patel@example.com",
    "venue_name": "Elite Sports Arena Mumbai",
    "address": "123 Sports Complex Road, Andheri West, Mumbai",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400058",
    "contact_phone": "+919876541234",
    "sport_type": "Cricket",
    "number_of_courts": 2,
    "slot_duration": 60,
    "price_per_slot": 1500.0
}

class ProgressiveOnboardingTester:
    def __init__(self):
        self.session = None
        self.access_token = None
        self.user_id = None
        self.arena_id = None
        self.test_results = []
        
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    def log_result(self, test_name: str, success: bool, message: str, details: Optional[Dict] = None):
        """Log test result"""
        result = {
            "test": test_name,
            "success": success,
            "message": message,
            "timestamp": datetime.now().isoformat(),
            "details": details or {}
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} | {test_name}: {message}")
        if details and not success:
            print(f"    Details: {details}")
    
    async def make_request(self, method: str, endpoint: str, data: Optional[Dict] = None, 
                          headers: Optional[Dict] = None) -> Dict[str, Any]:
        """Make HTTP request with error handling"""
        url = f"{BASE_URL}{endpoint}"
        request_headers = {"Content-Type": "application/json"}
        
        if self.access_token:
            request_headers["Authorization"] = f"Bearer {self.access_token}"
        
        if headers:
            request_headers.update(headers)
        
        try:
            async with self.session.request(method, url, json=data, headers=request_headers) as response:
                response_text = await response.text()
                try:
                    response_data = json.loads(response_text)
                except json.JSONDecodeError:
                    response_data = {"raw_response": response_text}
                
                return {
                    "status_code": response.status,
                    "data": response_data,
                    "success": 200 <= response.status < 300
                }
        except Exception as e:
            return {
                "status_code": 0,
                "data": {"error": str(e)},
                "success": False
            }
    
    async def test_api_health(self):
        """Test API health and connectivity"""
        response = await self.make_request("GET", "/")
        
        if response["success"]:
            data = response["data"]
            expected_fields = ["message", "status", "auth_type"]
            missing_fields = [field for field in expected_fields if field not in data]
            
            if not missing_fields and data.get("auth_type") == "mobile_otp":
                self.log_result("API Health Check", True, 
                              f"API is healthy - {data.get('message', 'Unknown')}")
            else:
                self.log_result("API Health Check", False, 
                              f"API response missing fields: {missing_fields}", data)
        else:
            self.log_result("API Health Check", False, 
                          f"API not accessible: {response['data']}")
    
    async def test_check_user_exists(self):
        """Test check-user endpoint for new mobile number"""
        data = {"mobile": TEST_MOBILE}
        response = await self.make_request("POST", "/auth/check-user", data)
        
        if response["success"]:
            result_data = response["data"]
            if result_data.get("user_exists") == False:
                self.log_result("Check User Exists", True, 
                              "New mobile number confirmed - user does not exist")
            else:
                self.log_result("Check User Exists", False, 
                              "User already exists for this mobile number", result_data)
        else:
            self.log_result("Check User Exists", False, 
                          f"Check user failed: {response['data']}")
    
    async def test_send_otp(self):
        """Test OTP sending functionality"""
        data = {"mobile": TEST_MOBILE}
        response = await self.make_request("POST", "/auth/send-otp", data)
        
        if response["success"]:
            result_data = response["data"]
            if result_data.get("success") and "dev_info" in result_data:
                # Extract OTP from dev_info for testing
                dev_info = result_data["dev_info"]
                if "OTP:" in dev_info:
                    self.test_otp = dev_info.split("OTP: ")[1].strip()
                    self.log_result("Send OTP", True, 
                                  f"OTP sent successfully to {TEST_MOBILE}")
                else:
                    self.log_result("Send OTP", False, 
                                  "OTP sent but dev_info format unexpected", result_data)
            else:
                self.log_result("Send OTP", False, 
                              "OTP sending failed", result_data)
        else:
            self.log_result("Send OTP", False, 
                          f"Send OTP request failed: {response['data']}")
    
    async def test_verify_otp(self):
        """Test OTP verification"""
        if not hasattr(self, 'test_otp'):
            self.log_result("Verify OTP", False, "No OTP available from previous test")
            return
        
        data = {"mobile": TEST_MOBILE, "otp": self.test_otp}
        response = await self.make_request("POST", "/auth/verify-otp", data)
        
        if response["success"]:
            result_data = response["data"]
            if result_data.get("success"):
                self.log_result("Verify OTP", True, "OTP verified successfully")
            else:
                self.log_result("Verify OTP", False, 
                              f"OTP verification failed: {result_data.get('message', 'Unknown error')}")
        else:
            self.log_result("Verify OTP", False, 
                          f"Verify OTP request failed: {response['data']}")
    
    async def test_onboarding_step1(self):
        """Test Onboarding Step 1: Basic user info with OTP verification"""
        if not hasattr(self, 'test_otp'):
            self.log_result("Onboarding Step 1", False, "No OTP available")
            return
        
        data = {
            "mobile": TEST_MOBILE,
            "otp": self.test_otp,
            "first_name": TEST_USER_DATA["first_name"],
            "last_name": TEST_USER_DATA["last_name"],
            "email": TEST_USER_DATA["email"]
        }
        
        response = await self.make_request("POST", "/onboarding/step1", data)
        
        if response["success"]:
            result_data = response["data"]
            if result_data.get("success") and "access_token" in result_data:
                self.access_token = result_data["access_token"]
                self.user_id = result_data.get("user_id")
                self.log_result("Onboarding Step 1", True, 
                              f"Step 1 completed - User created with ID: {self.user_id}")
            else:
                self.log_result("Onboarding Step 1", False, 
                              f"Step 1 failed: {result_data.get('message', 'Unknown error')}")
        else:
            self.log_result("Onboarding Step 1", False, 
                          f"Step 1 request failed: {response['data']}")
    
    async def test_onboarding_step2(self):
        """Test Onboarding Step 2: Venue basic information"""
        if not self.access_token:
            self.log_result("Onboarding Step 2", False, "No access token available")
            return
        
        data = {
            "venue_name": TEST_USER_DATA["venue_name"],
            "address": TEST_USER_DATA["address"],
            "city": TEST_USER_DATA["city"],
            "state": TEST_USER_DATA["state"],
            "pincode": TEST_USER_DATA["pincode"],
            "operating_days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
            "start_time": "06:00",
            "end_time": "22:00",
            "contact_phone": TEST_USER_DATA["contact_phone"]
        }
        
        response = await self.make_request("POST", "/onboarding/step2", data)
        
        if response["success"]:
            result_data = response["data"]
            if result_data.get("success"):
                self.log_result("Onboarding Step 2", True, 
                              f"Step 2 completed - Venue info saved: {TEST_USER_DATA['venue_name']}")
            else:
                self.log_result("Onboarding Step 2", False, 
                              f"Step 2 failed: {result_data.get('message', 'Unknown error')}")
        else:
            self.log_result("Onboarding Step 2", False, 
                          f"Step 2 request failed: {response['data']}")
    
    async def test_onboarding_step3(self):
        """Test Onboarding Step 3: Arena/Sport configuration"""
        if not self.access_token:
            self.log_result("Onboarding Step 3", False, "No access token available")
            return
        
        data = {
            "sport_type": TEST_USER_DATA["sport_type"],
            "number_of_courts": TEST_USER_DATA["number_of_courts"],
            "slot_duration": TEST_USER_DATA["slot_duration"],
            "price_per_slot": TEST_USER_DATA["price_per_slot"]
        }
        
        response = await self.make_request("POST", "/onboarding/step3", data)
        
        if response["success"]:
            result_data = response["data"]
            if result_data.get("success"):
                self.arena_id = result_data.get("arena_id")
                self.log_result("Onboarding Step 3", True, 
                              f"Step 3 completed - Arena created: {self.arena_id}")
            else:
                self.log_result("Onboarding Step 3", False, 
                              f"Step 3 failed: {result_data.get('message', 'Unknown error')}")
        else:
            self.log_result("Onboarding Step 3", False, 
                          f"Step 3 request failed: {response['data']}")
    
    async def test_onboarding_step4(self):
        """Test Onboarding Step 4: Amenities and rules"""
        if not self.access_token:
            self.log_result("Onboarding Step 4", False, "No access token available")
            return
        
        data = {
            "amenities": ["Parking", "Washroom", "Floodlights", "Seating Area"],
            "rules": "No smoking. Proper sports attire required. Advance booking mandatory."
        }
        
        response = await self.make_request("POST", "/onboarding/step4", data)
        
        if response["success"]:
            result_data = response["data"]
            if result_data.get("success"):
                self.log_result("Onboarding Step 4", True, 
                              "Step 4 completed - Amenities and rules saved")
            else:
                self.log_result("Onboarding Step 4", False, 
                              f"Step 4 failed: {result_data.get('message', 'Unknown error')}")
        else:
            self.log_result("Onboarding Step 4", False, 
                          f"Step 4 request failed: {response['data']}")
    
    async def test_onboarding_step5(self):
        """Test Onboarding Step 5: Payment setup (optional)"""
        if not self.access_token:
            self.log_result("Onboarding Step 5", False, "No access token available")
            return
        
        data = {
            "bank_account_number": "1234567890123456",
            "bank_ifsc": "HDFC0001234",
            "bank_account_holder": "Amit Patel",
            "upi_id": "amit.patel@paytm"
        }
        
        response = await self.make_request("POST", "/onboarding/step5", data)
        
        if response["success"]:
            result_data = response["data"]
            if result_data.get("success"):
                onboarding_completed = result_data.get("onboarding_completed", False)
                self.log_result("Onboarding Step 5", True, 
                              f"Step 5 completed - Onboarding completed: {onboarding_completed}")
            else:
                self.log_result("Onboarding Step 5", False, 
                              f"Step 5 failed: {result_data.get('message', 'Unknown error')}")
        else:
            self.log_result("Onboarding Step 5", False, 
                          f"Step 5 request failed: {response['data']}")
    
    async def test_onboarding_status(self):
        """Test getting onboarding status"""
        if not self.access_token:
            self.log_result("Onboarding Status", False, "No access token available")
            return
        
        response = await self.make_request("GET", "/onboarding/status")
        
        if response["success"]:
            result_data = response["data"]
            expected_fields = ["user_id", "mobile", "onboarding_completed", "completed_steps", 
                             "current_step", "has_venue", "has_arena", "can_go_live"]
            
            missing_fields = [field for field in expected_fields if field not in result_data]
            
            if not missing_fields:
                completed_steps = result_data.get("completed_steps", [])
                onboarding_completed = result_data.get("onboarding_completed", False)
                can_go_live = result_data.get("can_go_live", False)
                
                self.log_result("Onboarding Status", True, 
                              f"Status retrieved - Steps: {completed_steps}, Completed: {onboarding_completed}, Can go live: {can_go_live}")
            else:
                self.log_result("Onboarding Status", False, 
                              f"Status response missing fields: {missing_fields}", result_data)
        else:
            self.log_result("Onboarding Status", False, 
                          f"Status request failed: {response['data']}")
    
    async def test_authentication_flow(self):
        """Test complete authentication flow after onboarding"""
        if not self.access_token:
            self.log_result("Authentication Flow", False, "No access token available")
            return
        
        # Test protected endpoint
        response = await self.make_request("GET", "/auth/profile")
        
        if response["success"]:
            result_data = response["data"]
            expected_fields = ["id", "mobile", "name", "role"]
            missing_fields = [field for field in expected_fields if field not in result_data]
            
            if not missing_fields and result_data.get("role") == "venue_partner":
                self.log_result("Authentication Flow", True, 
                              f"Protected endpoint accessible - User: {result_data.get('name')}")
            else:
                self.log_result("Authentication Flow", False, 
                              f"Profile response invalid: missing {missing_fields}", result_data)
        else:
            self.log_result("Authentication Flow", False, 
                          f"Profile request failed: {response['data']}")
    
    async def test_data_persistence(self):
        """Test that onboarding data is properly persisted"""
        if not self.access_token:
            self.log_result("Data Persistence", False, "No access token available")
            return
        
        # Test venue partner specific endpoints
        response = await self.make_request("GET", "/venue-partner/venues")
        
        if response["success"]:
            venues = response["data"]
            if isinstance(venues, list):
                self.log_result("Data Persistence", True, 
                              f"Venue data accessible - Found {len(venues)} venues")
            else:
                self.log_result("Data Persistence", False, 
                              "Venue data format unexpected", venues)
        else:
            self.log_result("Data Persistence", False, 
                          f"Venue data request failed: {response['data']}")
    
    async def run_all_tests(self):
        """Run all progressive onboarding tests in sequence"""
        print("🚀 Starting Progressive Onboarding System Tests")
        print("=" * 60)
        
        # Test sequence
        test_sequence = [
            ("API Health Check", self.test_api_health),
            ("Check User Exists", self.test_check_user_exists),
            ("Send OTP", self.test_send_otp),
            ("Verify OTP", self.test_verify_otp),
            ("Onboarding Step 1", self.test_onboarding_step1),
            ("Onboarding Step 2", self.test_onboarding_step2),
            ("Onboarding Step 3", self.test_onboarding_step3),
            ("Onboarding Step 4", self.test_onboarding_step4),
            ("Onboarding Step 5", self.test_onboarding_step5),
            ("Onboarding Status", self.test_onboarding_status),
            ("Authentication Flow", self.test_authentication_flow),
            ("Data Persistence", self.test_data_persistence)
        ]
        
        for test_name, test_func in test_sequence:
            try:
                await test_func()
            except Exception as e:
                self.log_result(test_name, False, f"Test exception: {str(e)}")
            
            # Small delay between tests
            await asyncio.sleep(0.5)
        
        # Print summary
        self.print_summary()
    
    def print_summary(self):
        """Print test summary"""
        print("\n" + "=" * 60)
        print("📊 PROGRESSIVE ONBOARDING TEST SUMMARY")
        print("=" * 60)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result["success"])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"✅ Passed: {passed_tests}")
        print(f"❌ Failed: {failed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        if failed_tests > 0:
            print("\n🔍 FAILED TESTS:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"  • {result['test']}: {result['message']}")
        
        print("\n🎯 KEY METRICS:")
        print(f"  • Test Mobile: {TEST_MOBILE}")
        print(f"  • User ID: {self.user_id or 'Not created'}")
        print(f"  • Arena ID: {self.arena_id or 'Not created'}")
        print(f"  • Access Token: {'✅ Generated' if self.access_token else '❌ Missing'}")
        
        # Test specific validations
        onboarding_steps_completed = sum(1 for result in self.test_results 
                                       if result["success"] and "Step" in result["test"])
        print(f"  • Onboarding Steps Completed: {onboarding_steps_completed}/5")
        
        print("\n" + "=" * 60)

async def main():
    """Main test execution"""
    async with ProgressiveOnboardingTester() as tester:
        await tester.run_all_tests()

if __name__ == "__main__":
    asyncio.run(main())