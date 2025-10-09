#!/usr/bin/env python3
"""
Comprehensive Backend Testing for KhelON Onboarding Step 3 Multi-Arena Functionality
Testing the updated onboarding step 3 API with new multi-arena functionality
"""

import asyncio
import aiohttp
import json
import uuid
from datetime import datetime
from typing import Dict, List, Any

# Backend URL from environment
BACKEND_URL = "https://tourneymaster-16.preview.emergentagent.com/api"

class OnboardingStep3Tester:
    def __init__(self):
        self.session = None
        self.test_results = []
        self.jwt_token = None
        self.test_user_mobile = "+919876543210"
        self.test_user_name = "Rajesh Kumar"
        
    async def setup_session(self):
        """Setup HTTP session"""
        self.session = aiohttp.ClientSession()
        
    async def cleanup_session(self):
        """Cleanup HTTP session"""
        if self.session:
            await self.session.close()
            
    def log_result(self, test_name: str, success: bool, message: str, details: Dict = None):
        """Log test result"""
        result = {
            "test": test_name,
            "success": success,
            "message": message,
            "details": details or {},
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {message}")
        if details:
            print(f"   Details: {json.dumps(details, indent=2)}")
            
    async def test_api_health_check(self):
        """Test 1: API Health Check"""
        try:
            async with self.session.get(f"{BACKEND_URL}/") as response:
                if response.status == 200:
                    data = await response.json()
                    self.log_result(
                        "API Health Check", 
                        True, 
                        f"Backend running: {data.get('message', 'OK')}", 
                        {"status_code": response.status, "response": data}
                    )
                    return True
                else:
                    self.log_result("API Health Check", False, f"Backend not responding: {response.status}")
                    return False
        except Exception as e:
            self.log_result("API Health Check", False, f"Connection failed: {str(e)}")
            return False
            
    async def test_authentication_flow(self):
        """Test 2: Complete Authentication Flow"""
        try:
            # Step 1: Send OTP
            otp_payload = {"mobile": self.test_user_mobile}
            async with self.session.post(f"{BACKEND_URL}/auth/send-otp", json=otp_payload) as response:
                if response.status != 200:
                    self.log_result("Authentication - Send OTP", False, f"Failed to send OTP: {response.status}")
                    return False
                    
                otp_data = await response.json()
                dev_otp = otp_data.get("dev_info", "").replace("OTP: ", "")
                
                if not dev_otp or len(dev_otp) != 6:
                    self.log_result("Authentication - Send OTP", False, "No valid OTP received")
                    return False
                    
                self.log_result("Authentication - Send OTP", True, f"OTP sent successfully: {dev_otp}")
                
            # Step 2: Login with OTP
            login_payload = {"mobile": self.test_user_mobile, "otp": dev_otp}
            async with self.session.post(f"{BACKEND_URL}/auth/login", json=login_payload) as response:
                if response.status != 200:
                    self.log_result("Authentication - Login", False, f"Login failed: {response.status}")
                    return False
                    
                login_data = await response.json()
                self.jwt_token = login_data.get("access_token")
                
                if not self.jwt_token:
                    self.log_result("Authentication - Login", False, "No JWT token received")
                    return False
                    
                self.log_result(
                    "Authentication - Login", 
                    True, 
                    f"Login successful, user exists: {login_data.get('user_exists', False)}", 
                    {"token_length": len(self.jwt_token), "user_data": login_data.get("user", {})}
                )
                
                # If new user, complete onboarding steps 1 and 2
                if not login_data.get("user_exists", False):
                    await self.complete_onboarding_prerequisites()
                    
                return True
                
        except Exception as e:
            self.log_result("Authentication Flow", False, f"Authentication error: {str(e)}")
            return False
            
    async def complete_onboarding_prerequisites(self):
        """Complete onboarding steps 1 and 2 if needed"""
        headers = {"Authorization": f"Bearer {self.jwt_token}"}
        
        # Step 1: Basic user info
        step1_payload = {
            "name": self.test_user_name,
            "email": "rajesh@example.com",
            "business_name": "Elite Sports Complex"
        }
        
        async with self.session.post(f"{BACKEND_URL}/onboarding/step1", json=step1_payload, headers=headers) as response:
            if response.status == 200:
                self.log_result("Onboarding Step 1", True, "Basic user info completed")
            else:
                self.log_result("Onboarding Step 1", False, f"Step 1 failed: {response.status}")
                
        # Step 2: Venue basic info
        step2_payload = {
            "venue_name": "Elite Cricket & Football Ground",
            "address": "456 Ground Road, Andheri West",
            "city": "Mumbai",
            "state": "Maharashtra", 
            "pincode": "400058",
            "operating_days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
            "start_time": "06:00",
            "end_time": "22:00",
            "contact_phone": self.test_user_mobile
        }
        
        async with self.session.post(f"{BACKEND_URL}/onboarding/step2", json=step2_payload, headers=headers) as response:
            if response.status == 200:
                self.log_result("Onboarding Step 2", True, "Venue basic info completed")
            else:
                self.log_result("Onboarding Step 2", False, f"Step 2 failed: {response.status}")
                
    async def test_step3_multi_arena_creation(self):
        """Test 3: Step 3 Multi-Arena Creation - Main Test Case"""
        if not self.jwt_token:
            self.log_result("Step 3 Multi-Arena", False, "No JWT token available")
            return False
            
        headers = {"Authorization": f"Bearer {self.jwt_token}"}
        
        # Test case from review request
        step3_payload = {
            "sport_type": "Cricket",
            "number_of_courts": 2,
            "slot_duration": 60,
            "price_per_slot": 1000,
            "arena_names": [
                {"name": "Cricket Turf 1", "id": "cricket_1"},
                {"name": "Cricket Turf 2", "id": "cricket_2"}
            ]
        }
        
        try:
            async with self.session.post(f"{BACKEND_URL}/onboarding/step3", json=step3_payload, headers=headers) as response:
                response_data = await response.json()
                
                if response.status == 200:
                    self.log_result(
                        "Step 3 Multi-Arena Creation", 
                        True, 
                        f"Created {response_data.get('arenas_created', 0)} arenas successfully",
                        {
                            "arena_ids": response_data.get("arena_ids", []),
                            "venue_id": response_data.get("venue_id"),
                            "sport_type": response_data.get("sport_type"),
                            "next_step": response_data.get("next_step")
                        }
                    )
                    return True
                else:
                    self.log_result(
                        "Step 3 Multi-Arena Creation", 
                        False, 
                        f"Failed with status {response.status}: {response_data.get('detail', 'Unknown error')}"
                    )
                    return False
                    
        except Exception as e:
            self.log_result("Step 3 Multi-Arena Creation", False, f"Request error: {str(e)}")
            return False
            
    async def test_different_sports(self):
        """Test 4: Different Sports (Football, Tennis)"""
        if not self.jwt_token:
            self.log_result("Different Sports Test", False, "No JWT token available")
            return False
            
        headers = {"Authorization": f"Bearer {self.jwt_token}"}
        
        # Test Football
        football_payload = {
            "sport_type": "Football",
            "number_of_courts": 1,
            "slot_duration": 90,
            "price_per_slot": 1500,
            "arena_names": [{"name": "Football Field 1", "id": "football_1"}]
        }
        
        try:
            async with self.session.post(f"{BACKEND_URL}/onboarding/step3", json=football_payload, headers=headers) as response:
                if response.status == 200:
                    response_data = await response.json()
                    self.log_result(
                        "Different Sports - Football", 
                        True, 
                        f"Football arena created successfully",
                        {"sport_type": response_data.get("sport_type")}
                    )
                else:
                    # This might fail if user already completed step 3, which is expected
                    response_data = await response.json()
                    self.log_result(
                        "Different Sports - Football", 
                        False, 
                        f"Expected failure (step already completed): {response_data.get('detail', 'Unknown')}"
                    )
                    
        except Exception as e:
            self.log_result("Different Sports - Football", False, f"Request error: {str(e)}")
            
        # Test Tennis
        tennis_payload = {
            "sport_type": "Tennis",
            "number_of_courts": 3,
            "slot_duration": 60,
            "price_per_slot": 800,
            "arena_names": [
                {"name": "Tennis Court 1", "id": "tennis_1"},
                {"name": "Tennis Court 2", "id": "tennis_2"},
                {"name": "Tennis Court 3", "id": "tennis_3"}
            ]
        }
        
        try:
            async with self.session.post(f"{BACKEND_URL}/onboarding/step3", json=tennis_payload, headers=headers) as response:
                if response.status == 200:
                    response_data = await response.json()
                    self.log_result(
                        "Different Sports - Tennis", 
                        True, 
                        f"Tennis arenas created successfully",
                        {"arenas_created": response_data.get("arenas_created")}
                    )
                else:
                    response_data = await response.json()
                    self.log_result(
                        "Different Sports - Tennis", 
                        False, 
                        f"Expected failure (step already completed): {response_data.get('detail', 'Unknown')}"
                    )
                    
        except Exception as e:
            self.log_result("Different Sports - Tennis", False, f"Request error: {str(e)}")
            
    async def test_arena_count_mismatch(self):
        """Test 5: Arena Count Mismatch"""
        if not self.jwt_token:
            self.log_result("Arena Count Mismatch", False, "No JWT token available")
            return False
            
        headers = {"Authorization": f"Bearer {self.jwt_token}"}
        
        # Test mismatch: 3 courts but only 2 arena names
        mismatch_payload = {
            "sport_type": "Basketball",
            "number_of_courts": 3,
            "slot_duration": 60,
            "price_per_slot": 600,
            "arena_names": [
                {"name": "Basketball Court 1", "id": "basketball_1"},
                {"name": "Basketball Court 2", "id": "basketball_2"}
                # Missing third arena name
            ]
        }
        
        try:
            async with self.session.post(f"{BACKEND_URL}/onboarding/step3", json=mismatch_payload, headers=headers) as response:
                response_data = await response.json()
                
                if response.status == 400 and "mismatch" in response_data.get("detail", "").lower():
                    self.log_result(
                        "Arena Count Mismatch", 
                        True, 
                        "Correctly rejected arena count mismatch",
                        {"error_message": response_data.get("detail")}
                    )
                else:
                    self.log_result(
                        "Arena Count Mismatch", 
                        False, 
                        f"Should have rejected mismatch but got: {response.status} - {response_data.get('detail', 'Unknown')}"
                    )
                    
        except Exception as e:
            self.log_result("Arena Count Mismatch", False, f"Request error: {str(e)}")
            
    async def test_auto_generation(self):
        """Test 6: Auto-generation without arena_names"""
        if not self.jwt_token:
            self.log_result("Auto Generation Test", False, "No JWT token available")
            return False
            
        headers = {"Authorization": f"Bearer {self.jwt_token}"}
        
        # Test without arena_names - should auto-generate
        auto_gen_payload = {
            "sport_type": "Badminton",
            "number_of_courts": 4,
            "slot_duration": 45,
            "price_per_slot": 400
            # No arena_names provided
        }
        
        try:
            async with self.session.post(f"{BACKEND_URL}/onboarding/step3", json=auto_gen_payload, headers=headers) as response:
                response_data = await response.json()
                
                if response.status == 200:
                    self.log_result(
                        "Auto Generation Test", 
                        True, 
                        f"Auto-generated {response_data.get('arenas_created', 0)} arena names",
                        {"arena_ids": response_data.get("arena_ids", [])}
                    )
                else:
                    # Expected if step already completed
                    self.log_result(
                        "Auto Generation Test", 
                        False, 
                        f"Expected failure (step completed): {response_data.get('detail', 'Unknown')}"
                    )
                    
        except Exception as e:
            self.log_result("Auto Generation Test", False, f"Request error: {str(e)}")
            
    async def test_maximum_courts(self):
        """Test 7: Maximum Courts (20)"""
        if not self.jwt_token:
            self.log_result("Maximum Courts Test", False, "No JWT token available")
            return False
            
        headers = {"Authorization": f"Bearer {self.jwt_token}"}
        
        # Test maximum allowed courts
        max_courts_payload = {
            "sport_type": "General",
            "number_of_courts": 20,
            "slot_duration": 60,
            "price_per_slot": 500
            # Let it auto-generate 20 arena names
        }
        
        try:
            async with self.session.post(f"{BACKEND_URL}/onboarding/step3", json=max_courts_payload, headers=headers) as response:
                response_data = await response.json()
                
                if response.status == 200:
                    self.log_result(
                        "Maximum Courts Test", 
                        True, 
                        f"Successfully created maximum {response_data.get('arenas_created', 0)} arenas",
                        {"arena_count": response_data.get("arenas_created")}
                    )
                else:
                    # Expected if step already completed
                    self.log_result(
                        "Maximum Courts Test", 
                        False, 
                        f"Expected failure (step completed): {response_data.get('detail', 'Unknown')}"
                    )
                    
        except Exception as e:
            self.log_result("Maximum Courts Test", False, f"Request error: {str(e)}")
            
        # Test exceeding maximum (should fail validation)
        exceed_max_payload = {
            "sport_type": "General",
            "number_of_courts": 25,  # Exceeds maximum of 20
            "slot_duration": 60,
            "price_per_slot": 500
        }
        
        try:
            async with self.session.post(f"{BACKEND_URL}/onboarding/step3", json=exceed_max_payload, headers=headers) as response:
                response_data = await response.json()
                
                if response.status == 422:  # Validation error
                    self.log_result(
                        "Maximum Courts Validation", 
                        True, 
                        "Correctly rejected courts count > 20",
                        {"error_details": response_data}
                    )
                else:
                    self.log_result(
                        "Maximum Courts Validation", 
                        False, 
                        f"Should have rejected > 20 courts but got: {response.status}"
                    )
                    
        except Exception as e:
            self.log_result("Maximum Courts Validation", False, f"Request error: {str(e)}")
            
    async def test_data_validation(self):
        """Test 8: Data Validation - Verify venue and arena creation"""
        if not self.jwt_token:
            self.log_result("Data Validation", False, "No JWT token available")
            return False
            
        headers = {"Authorization": f"Bearer {self.jwt_token}"}
        
        try:
            # Get user profile to check venue creation
            async with self.session.get(f"{BACKEND_URL}/auth/profile", headers=headers) as response:
                if response.status == 200:
                    profile_data = await response.json()
                    
                    has_venue = profile_data.get("has_venue", False)
                    has_arenas = profile_data.get("has_arenas", False)
                    total_venues = profile_data.get("total_venues", 0)
                    total_arenas = profile_data.get("total_arenas", 0)
                    
                    self.log_result(
                        "Data Validation - Profile", 
                        True, 
                        f"Profile check: venues={total_venues}, arenas={total_arenas}",
                        {
                            "has_venue": has_venue,
                            "has_arenas": has_arenas,
                            "total_venues": total_venues,
                            "total_arenas": total_arenas
                        }
                    )
                    
            # Get onboarding status
            async with self.session.get(f"{BACKEND_URL}/onboarding/status", headers=headers) as response:
                if response.status == 200:
                    status_data = await response.json()
                    
                    completed_steps = status_data.get("completed_steps", [])
                    current_step = status_data.get("current_step", 1)
                    
                    step3_completed = 3 in completed_steps
                    progressed_to_step4 = current_step == 4
                    
                    self.log_result(
                        "Data Validation - Onboarding Status", 
                        True, 
                        f"Step 3 completed: {step3_completed}, Current step: {current_step}",
                        {
                            "completed_steps": completed_steps,
                            "current_step": current_step,
                            "step3_completed": step3_completed,
                            "progressed_to_step4": progressed_to_step4
                        }
                    )
                    
        except Exception as e:
            self.log_result("Data Validation", False, f"Validation error: {str(e)}")
            
    async def test_edge_cases(self):
        """Test 9: Edge Cases and Error Handling"""
        if not self.jwt_token:
            self.log_result("Edge Cases", False, "No JWT token available")
            return False
            
        headers = {"Authorization": f"Bearer {self.jwt_token}"}
        
        # Test invalid sport type (too short)
        invalid_sport_payload = {
            "sport_type": "A",  # Too short (min_length=2)
            "number_of_courts": 1,
            "slot_duration": 60,
            "price_per_slot": 500
        }
        
        try:
            async with self.session.post(f"{BACKEND_URL}/onboarding/step3", json=invalid_sport_payload, headers=headers) as response:
                if response.status == 422:
                    self.log_result("Edge Cases - Invalid Sport", True, "Correctly rejected short sport name")
                else:
                    self.log_result("Edge Cases - Invalid Sport", False, f"Should reject short sport but got: {response.status}")
        except Exception as e:
            self.log_result("Edge Cases - Invalid Sport", False, f"Error: {str(e)}")
            
        # Test invalid slot duration (too short)
        invalid_duration_payload = {
            "sport_type": "Cricket",
            "number_of_courts": 1,
            "slot_duration": 15,  # Too short (min=30)
            "price_per_slot": 500
        }
        
        try:
            async with self.session.post(f"{BACKEND_URL}/onboarding/step3", json=invalid_duration_payload, headers=headers) as response:
                if response.status == 422:
                    self.log_result("Edge Cases - Invalid Duration", True, "Correctly rejected short slot duration")
                else:
                    self.log_result("Edge Cases - Invalid Duration", False, f"Should reject short duration but got: {response.status}")
        except Exception as e:
            self.log_result("Edge Cases - Invalid Duration", False, f"Error: {str(e)}")
            
        # Test negative price
        negative_price_payload = {
            "sport_type": "Cricket",
            "number_of_courts": 1,
            "slot_duration": 60,
            "price_per_slot": -100  # Negative price
        }
        
        try:
            async with self.session.post(f"{BACKEND_URL}/onboarding/step3", json=negative_price_payload, headers=headers) as response:
                if response.status == 422:
                    self.log_result("Edge Cases - Negative Price", True, "Correctly rejected negative price")
                else:
                    self.log_result("Edge Cases - Negative Price", False, f"Should reject negative price but got: {response.status}")
        except Exception as e:
            self.log_result("Edge Cases - Negative Price", False, f"Error: {str(e)}")
            
    async def run_all_tests(self):
        """Run all test scenarios"""
        print("🚀 Starting KhelON Onboarding Step 3 Multi-Arena Testing")
        print("=" * 70)
        
        await self.setup_session()
        
        try:
            # Core functionality tests
            health_ok = await self.test_api_health_check()
            if not health_ok:
                print("❌ Backend not available, stopping tests")
                return
                
            auth_ok = await self.test_authentication_flow()
            if not auth_ok:
                print("❌ Authentication failed, stopping tests")
                return
                
            # Main test case from review request
            await self.test_step3_multi_arena_creation()
            
            # Edge case tests
            await self.test_different_sports()
            await self.test_arena_count_mismatch()
            await self.test_auto_generation()
            await self.test_maximum_courts()
            await self.test_data_validation()
            await self.test_edge_cases()
            
        finally:
            await self.cleanup_session()
            
        # Print summary
        print("\n" + "=" * 70)
        print("📊 TEST SUMMARY")
        print("=" * 70)
        
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
                    
        print("\n✨ Testing completed!")
        
        return {
            "total": total_tests,
            "passed": passed_tests,
            "failed": failed_tests,
            "success_rate": (passed_tests/total_tests)*100,
            "results": self.test_results
        }

async def main():
    """Main test execution"""
    tester = OnboardingStep3Tester()
    results = await tester.run_all_tests()
    return results

if __name__ == "__main__":
    asyncio.run(main())