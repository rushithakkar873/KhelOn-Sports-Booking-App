#!/usr/bin/env python3
"""
Comprehensive Backend Testing for KhelON Onboarding API Validation
Focus: Testing Pydantic validation for onboarding steps 3, 4, and 5
"""

import asyncio
import aiohttp
import json
import uuid
from datetime import datetime
from typing import Dict, Any

# Backend URL configuration
BACKEND_URL = "http://localhost:8001/api"

class OnboardingValidationTester:
    def __init__(self):
        self.session = None
        self.test_results = []
        self.jwt_token = None
        self.test_mobile = f"+919876543210"  # Using consistent test mobile
        
    async def setup_session(self):
        """Setup HTTP session"""
        self.session = aiohttp.ClientSession()
        
    async def cleanup_session(self):
        """Cleanup HTTP session"""
        if self.session:
            await self.session.close()
            
    async def authenticate_user(self) -> bool:
        """Authenticate user and get JWT token for testing"""
        try:
            print("🔐 Setting up authentication for onboarding validation tests...")
            
            # Step 1: Send OTP
            otp_response = await self.session.post(
                f"{BACKEND_URL}/auth/send-otp",
                json={"mobile": self.test_mobile}
            )
            
            if otp_response.status != 200:
                print(f"❌ Failed to send OTP: {otp_response.status}")
                return False
                
            otp_data = await otp_response.json()
            mock_otp = otp_data.get("dev_info", "").split(": ")[-1] if "dev_info" in otp_data else "123456"
            
            # Step 2: Login with OTP to get JWT token
            login_response = await self.session.post(
                f"{BACKEND_URL}/auth/login",
                json={
                    "mobile": self.test_mobile,
                    "otp": mock_otp
                }
            )
            
            if login_response.status != 200:
                print(f"❌ Failed to login: {login_response.status}")
                return False
                
            login_data = await login_response.json()
            self.jwt_token = login_data.get("access_token")
            
            if not self.jwt_token:
                print("❌ No JWT token received")
                return False
                
            print(f"✅ Authentication successful, JWT token obtained")
            return True
            
        except Exception as e:
            print(f"❌ Authentication failed: {str(e)}")
            return False
    
    async def complete_onboarding_steps_1_and_2(self) -> bool:
        """Complete onboarding steps 1 and 2 to prepare for step 3 testing"""
        try:
            print("📝 Completing onboarding steps 1 and 2...")
            
            headers = {"Authorization": f"Bearer {self.jwt_token}"}
            
            # Step 1: Basic partner details
            step1_data = {
                "first_name": "Rajesh",
                "last_name": "Kumar",
                "email": "rajesh.kumar@example.com",
                "business_name": "Elite Sports Complex"
            }
            
            step1_response = await self.session.post(
                f"{BACKEND_URL}/onboarding/step1",
                json=step1_data,
                headers=headers
            )
            
            if step1_response.status != 200:
                print(f"❌ Step 1 failed: {step1_response.status}")
                return False
            
            # Step 2: Venue basic information
            step2_data = {
                "venue_name": "Elite Cricket Ground",
                "venue_address": "456 Ground Road, Andheri West",
                "city": "Mumbai",
                "state": "Maharashtra",
                "pincode": "400058",
                "cover_photo": None,
                "operating_days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
                "start_time": "06:00",
                "end_time": "22:00",
                "contact_phone": "+919876543210"
            }
            
            step2_response = await self.session.post(
                f"{BACKEND_URL}/onboarding/step2",
                json=step2_data,
                headers=headers
            )
            
            if step2_response.status != 200:
                print(f"❌ Step 2 failed: {step2_response.status}")
                return False
            
            print("✅ Onboarding steps 1 and 2 completed successfully")
            return True
            
        except Exception as e:
            print(f"❌ Failed to complete initial onboarding steps: {str(e)}")
            return False
    
    async def test_step3_validation(self):
        """Test Step 3 validation - Arena/Sport configuration"""
        print("\n🏏 Testing Step 3 Validation (Arena/Sport Configuration)")
        print("=" * 60)
        
        headers = {"Authorization": f"Bearer {self.jwt_token}"}
        
        # Test cases for Step 3 validation
        test_cases = [
            # Valid data
            {
                "name": "Valid Step 3 Data",
                "data": {
                    "sport_type": "Cricket",
                    "number_of_courts": 2,
                    "slot_duration": 60,
                    "price_per_slot": 1200.0
                },
                "expected_status": 200,
                "should_pass": True
            },
            
            # Invalid sport_type - empty
            {
                "name": "Empty sport_type",
                "data": {
                    "sport_type": "",
                    "number_of_courts": 2,
                    "slot_duration": 60,
                    "price_per_slot": 1200.0
                },
                "expected_status": 422,
                "should_pass": False
            },
            
            # Invalid sport_type - too short
            {
                "name": "sport_type too short",
                "data": {
                    "sport_type": "C",
                    "number_of_courts": 2,
                    "slot_duration": 60,
                    "price_per_slot": 1200.0
                },
                "expected_status": 422,
                "should_pass": False
            },
            
            # Invalid sport_type - too long
            {
                "name": "sport_type too long",
                "data": {
                    "sport_type": "A" * 51,  # 51 characters, max is 50
                    "number_of_courts": 2,
                    "slot_duration": 60,
                    "price_per_slot": 1200.0
                },
                "expected_status": 422,
                "should_pass": False
            },
            
            # Invalid number_of_courts - 0
            {
                "name": "number_of_courts is 0",
                "data": {
                    "sport_type": "Cricket",
                    "number_of_courts": 0,
                    "slot_duration": 60,
                    "price_per_slot": 1200.0
                },
                "expected_status": 422,
                "should_pass": False
            },
            
            # Invalid number_of_courts - negative
            {
                "name": "number_of_courts is negative",
                "data": {
                    "sport_type": "Cricket",
                    "number_of_courts": -1,
                    "slot_duration": 60,
                    "price_per_slot": 1200.0
                },
                "expected_status": 422,
                "should_pass": False
            },
            
            # Invalid number_of_courts - greater than 20
            {
                "name": "number_of_courts > 20",
                "data": {
                    "sport_type": "Cricket",
                    "number_of_courts": 21,
                    "slot_duration": 60,
                    "price_per_slot": 1200.0
                },
                "expected_status": 422,
                "should_pass": False
            },
            
            # Invalid slot_duration - less than 30
            {
                "name": "slot_duration < 30",
                "data": {
                    "sport_type": "Cricket",
                    "number_of_courts": 2,
                    "slot_duration": 29,
                    "price_per_slot": 1200.0
                },
                "expected_status": 422,
                "should_pass": False
            },
            
            # Invalid slot_duration - greater than 240
            {
                "name": "slot_duration > 240",
                "data": {
                    "sport_type": "Cricket",
                    "number_of_courts": 2,
                    "slot_duration": 241,
                    "price_per_slot": 1200.0
                },
                "expected_status": 422,
                "should_pass": False
            },
            
            # Invalid price_per_slot - negative
            {
                "name": "price_per_slot is negative",
                "data": {
                    "sport_type": "Cricket",
                    "number_of_courts": 2,
                    "slot_duration": 60,
                    "price_per_slot": -100.0
                },
                "expected_status": 422,
                "should_pass": False
            },
            
            # Edge case: price_per_slot is 0 (should pass as per Pydantic ge=0)
            {
                "name": "price_per_slot is 0",
                "data": {
                    "sport_type": "Cricket",
                    "number_of_courts": 2,
                    "slot_duration": 60,
                    "price_per_slot": 0.0
                },
                "expected_status": 200,
                "should_pass": True
            }
        ]
        
        passed = 0
        failed = 0
        
        for test_case in test_cases:
            try:
                response = await self.session.post(
                    f"{BACKEND_URL}/onboarding/step3",
                    json=test_case["data"],
                    headers=headers
                )
                
                response_data = await response.json()
                
                if test_case["should_pass"]:
                    if response.status == 200:
                        print(f"✅ {test_case['name']}: PASSED")
                        passed += 1
                    else:
                        print(f"❌ {test_case['name']}: FAILED - Expected success but got {response.status}")
                        print(f"   Response: {response_data}")
                        failed += 1
                else:
                    if response.status == 422:
                        print(f"✅ {test_case['name']}: PASSED (correctly rejected)")
                        passed += 1
                    else:
                        print(f"❌ {test_case['name']}: FAILED - Expected 422 but got {response.status}")
                        print(f"   Response: {response_data}")
                        failed += 1
                        
            except Exception as e:
                print(f"❌ {test_case['name']}: ERROR - {str(e)}")
                failed += 1
        
        print(f"\nStep 3 Validation Results: {passed} passed, {failed} failed")
        self.test_results.append({"step": "Step 3", "passed": passed, "failed": failed})
    
    async def test_step4_validation(self):
        """Test Step 4 validation - Amenities and rules"""
        print("\n🏢 Testing Step 4 Validation (Amenities and Rules)")
        print("=" * 60)
        
        headers = {"Authorization": f"Bearer {self.jwt_token}"}
        
        # Test cases for Step 4 validation
        test_cases = [
            # Valid data with amenities
            {
                "name": "Valid Step 4 Data with amenities",
                "data": {
                    "amenities": ["Parking", "Washroom", "Floodlights", "Seating"],
                    "rules": "No smoking. No outside food. Proper sports attire required."
                },
                "expected_status": 200,
                "should_pass": True
            },
            
            # Valid data with empty amenities
            {
                "name": "Valid Step 4 Data with empty amenities",
                "data": {
                    "amenities": [],
                    "rules": "Basic venue rules apply."
                },
                "expected_status": 200,
                "should_pass": True
            },
            
            # Valid data with no rules
            {
                "name": "Valid Step 4 Data with no rules",
                "data": {
                    "amenities": ["Parking", "Washroom"],
                    "rules": None
                },
                "expected_status": 200,
                "should_pass": True
            },
            
            # Valid data with empty rules
            {
                "name": "Valid Step 4 Data with empty rules",
                "data": {
                    "amenities": ["Parking"],
                    "rules": ""
                },
                "expected_status": 200,
                "should_pass": True
            },
            
            # Invalid amenities - not a list
            {
                "name": "Invalid amenities - not a list",
                "data": {
                    "amenities": "Parking, Washroom",  # Should be a list
                    "rules": "Basic rules"
                },
                "expected_status": 422,
                "should_pass": False
            },
            
            # Very long rules text (> 2000 characters) - testing if there's a limit
            {
                "name": "Rules text very long (2001 chars)",
                "data": {
                    "amenities": ["Parking"],
                    "rules": "A" * 2001  # 2001 characters
                },
                "expected_status": 200,  # Expecting success as no max_length defined in model
                "should_pass": True
            }
        ]
        
        passed = 0
        failed = 0
        
        for test_case in test_cases:
            try:
                response = await self.session.post(
                    f"{BACKEND_URL}/onboarding/step4",
                    json=test_case["data"],
                    headers=headers
                )
                
                response_data = await response.json()
                
                if test_case["should_pass"]:
                    if response.status == 200:
                        print(f"✅ {test_case['name']}: PASSED")
                        passed += 1
                    else:
                        print(f"❌ {test_case['name']}: FAILED - Expected success but got {response.status}")
                        print(f"   Response: {response_data}")
                        failed += 1
                else:
                    if response.status == 422:
                        print(f"✅ {test_case['name']}: PASSED (correctly rejected)")
                        passed += 1
                    else:
                        print(f"❌ {test_case['name']}: FAILED - Expected 422 but got {response.status}")
                        print(f"   Response: {response_data}")
                        failed += 1
                        
            except Exception as e:
                print(f"❌ {test_case['name']}: ERROR - {str(e)}")
                failed += 1
        
        print(f"\nStep 4 Validation Results: {passed} passed, {failed} failed")
        self.test_results.append({"step": "Step 4", "passed": passed, "failed": failed})
    
    async def test_step5_validation(self):
        """Test Step 5 validation - Payment details"""
        print("\n💳 Testing Step 5 Validation (Payment Details)")
        print("=" * 60)
        
        headers = {"Authorization": f"Bearer {self.jwt_token}"}
        
        # Test cases for Step 5 validation
        test_cases = [
            # Valid bank details
            {
                "name": "Valid bank details",
                "data": {
                    "bank_account_number": "1234567890123456",
                    "bank_ifsc": "HDFC0001234",
                    "bank_account_holder": "Rajesh Kumar",
                    "upi_id": None
                },
                "expected_status": 200,
                "should_pass": True
            },
            
            # Valid UPI ID
            {
                "name": "Valid UPI ID",
                "data": {
                    "bank_account_number": None,
                    "bank_ifsc": None,
                    "bank_account_holder": None,
                    "upi_id": "rajesh@paytm"
                },
                "expected_status": 200,
                "should_pass": True
            },
            
            # Valid UPI ID with phone number
            {
                "name": "Valid UPI ID with phone",
                "data": {
                    "bank_account_number": None,
                    "bank_ifsc": None,
                    "bank_account_holder": None,
                    "upi_id": "9876543210@paytm"
                },
                "expected_status": 200,
                "should_pass": True
            },
            
            # Valid UPI ID with different format
            {
                "name": "Valid UPI ID different format",
                "data": {
                    "bank_account_number": None,
                    "bank_ifsc": None,
                    "bank_account_holder": None,
                    "upi_id": "rajesh.kumar@okaxis"
                },
                "expected_status": 200,
                "should_pass": True
            },
            
            # All fields empty (should be valid as payment is optional)
            {
                "name": "All payment fields empty",
                "data": {
                    "bank_account_number": None,
                    "bank_ifsc": None,
                    "bank_account_holder": None,
                    "upi_id": None
                },
                "expected_status": 200,
                "should_pass": True
            },
            
            # Invalid UPI ID format - missing @
            {
                "name": "Invalid UPI ID - missing @",
                "data": {
                    "bank_account_number": None,
                    "bank_ifsc": None,
                    "bank_account_holder": None,
                    "upi_id": "rajeshpaytm"
                },
                "expected_status": 200,  # No validation in model, so should pass
                "should_pass": True
            },
            
            # Invalid UPI ID format - empty
            {
                "name": "Invalid UPI ID - empty string",
                "data": {
                    "bank_account_number": None,
                    "bank_ifsc": None,
                    "bank_account_holder": None,
                    "upi_id": ""
                },
                "expected_status": 200,  # Empty string should be treated as None
                "should_pass": True
            }
        ]
        
        passed = 0
        failed = 0
        
        for test_case in test_cases:
            try:
                response = await self.session.post(
                    f"{BACKEND_URL}/onboarding/step5",
                    json=test_case["data"],
                    headers=headers
                )
                
                response_data = await response.json()
                
                if test_case["should_pass"]:
                    if response.status == 200:
                        print(f"✅ {test_case['name']}: PASSED")
                        passed += 1
                    else:
                        print(f"❌ {test_case['name']}: FAILED - Expected success but got {response.status}")
                        print(f"   Response: {response_data}")
                        failed += 1
                else:
                    if response.status == 422:
                        print(f"✅ {test_case['name']}: PASSED (correctly rejected)")
                        passed += 1
                    else:
                        print(f"❌ {test_case['name']}: FAILED - Expected 422 but got {response.status}")
                        print(f"   Response: {response_data}")
                        failed += 1
                        
            except Exception as e:
                print(f"❌ {test_case['name']}: ERROR - {str(e)}")
                failed += 1
        
        print(f"\nStep 5 Validation Results: {passed} passed, {failed} failed")
        self.test_results.append({"step": "Step 5", "passed": passed, "failed": failed})
    
    async def run_all_tests(self):
        """Run all onboarding validation tests"""
        print("🚀 Starting KhelON Onboarding API Validation Tests")
        print("=" * 80)
        
        await self.setup_session()
        
        try:
            # Authenticate and setup
            if not await self.authenticate_user():
                print("❌ Authentication failed, cannot proceed with tests")
                return
            
            # Check if user already has completed steps 1 and 2
            print("📋 Checking onboarding status...")
            headers = {"Authorization": f"Bearer {self.jwt_token}"}
            status_response = await self.session.get(
                f"{BACKEND_URL}/onboarding/status",
                headers=headers
            )
            
            if status_response.status == 200:
                status_data = await status_response.json()
                completed_steps = status_data.get("completed_steps", [])
                if 1 in completed_steps and 2 in completed_steps:
                    print("✅ User already has completed steps 1 and 2, proceeding with validation tests")
                else:
                    if not await self.complete_onboarding_steps_1_and_2():
                        print("❌ Failed to complete initial onboarding steps")
                        return
            else:
                print("❌ Failed to check onboarding status")
                return
            
            # Run validation tests
            await self.test_step3_validation()
            await self.test_step4_validation()
            await self.test_step5_validation()
            
            # Print summary
            print("\n" + "=" * 80)
            print("📊 ONBOARDING VALIDATION TEST SUMMARY")
            print("=" * 80)
            
            total_passed = 0
            total_failed = 0
            
            for result in self.test_results:
                print(f"{result['step']}: {result['passed']} passed, {result['failed']} failed")
                total_passed += result['passed']
                total_failed += result['failed']
            
            print(f"\nOVERALL: {total_passed} passed, {total_failed} failed")
            
            if total_failed == 0:
                print("🎉 ALL ONBOARDING VALIDATION TESTS PASSED!")
            else:
                print(f"⚠️  {total_failed} tests failed - review validation logic")
                
        finally:
            await self.cleanup_session()

async def main():
    """Main test runner"""
    tester = OnboardingValidationTester()
    await tester.run_all_tests()

if __name__ == "__main__":
    asyncio.run(main())