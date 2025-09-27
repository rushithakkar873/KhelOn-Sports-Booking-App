#!/usr/bin/env python3
"""
SECURE ONBOARDING FLOW TESTING
Testing the new secure authentication flow with JWT-protected onboarding APIs
"""

import requests
import json
import time
from datetime import datetime

# Backend URL from frontend/.env
BACKEND_URL = "https://sports-book.preview.emergentagent.com/api"

class SecureOnboardingTester:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        })
        
        # Test data
        self.new_user_mobile = "+919123456789"  # Should be new user
        self.existing_user_mobile = "+919876543210"  # Existing user from previous tests
        self.test_results = []
        
    def log_result(self, test_name, success, details):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if details:
            print(f"   Details: {details}")
        
        self.test_results.append({
            "test": test_name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat()
        })
    
    def test_api_health(self):
        """Test API health and branding"""
        try:
            response = self.session.get(f"{BACKEND_URL}/")
            
            if response.status_code == 200:
                data = response.json()
                if "KhelOn API" in data.get("message", "") and data.get("auth_type") == "mobile_otp":
                    self.log_result("API Health Check", True, f"KhelOn API v{data.get('version')} running with mobile OTP auth")
                    return True
                else:
                    self.log_result("API Health Check", False, f"Unexpected response: {data}")
                    return False
            else:
                self.log_result("API Health Check", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_result("API Health Check", False, f"Connection error: {str(e)}")
            return False
    
    def test_deprecated_check_user_api(self):
        """Test deprecated /auth/check-user endpoint"""
        try:
            payload = {"mobile": self.new_user_mobile}
            response = self.session.post(f"{BACKEND_URL}/auth/check-user", json=payload)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("deprecated") and "Use /auth/send-otp followed by /auth/login" in data.get("message", ""):
                    self.log_result("Deprecated Check User API", True, "Returns proper deprecation message")
                    return True
                else:
                    self.log_result("Deprecated Check User API", False, f"Unexpected response: {data}")
                    return False
            else:
                self.log_result("Deprecated Check User API", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_result("Deprecated Check User API", False, f"Error: {str(e)}")
            return False
    
    def send_otp(self, mobile):
        """Send OTP to mobile number"""
        try:
            payload = {"mobile": mobile}
            response = self.session.post(f"{BACKEND_URL}/auth/send-otp", json=payload)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and data.get("request_id"):
                    otp = data.get("dev_info", "").replace("OTP: ", "") if "OTP: " in data.get("dev_info", "") else None
                    return True, otp, data.get("request_id")
                else:
                    return False, None, f"Unexpected response: {data}"
            else:
                return False, None, f"HTTP {response.status_code}: {response.text}"
                
        except Exception as e:
            return False, None, f"Error: {str(e)}"
    
    def login_with_otp(self, mobile, otp):
        """Login with mobile and OTP - Enhanced login endpoint"""
        try:
            payload = {"mobile": mobile, "otp": otp}
            response = self.session.post(f"{BACKEND_URL}/auth/login", json=payload)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and data.get("access_token"):
                    return True, data
                else:
                    return False, f"Login failed: {data}"
            else:
                return False, f"HTTP {response.status_code}: {response.text}"
                
        except Exception as e:
            return False, f"Error: {str(e)}"
    
    def test_onboarding_step_with_token(self, step_num, token, should_work=True, otp=None):
        """Test onboarding step with JWT token"""
        try:
            headers = {"Authorization": f"Bearer {token}"} if token else {}
            
            # Sample data for each step
            step_data = {
                1: {
                    "mobile": self.new_user_mobile,
                    "otp": otp or "123456",  # Include OTP for step1
                    "first_name": "Rajesh",
                    "last_name": "Kumar", 
                    "email": "rajesh.kumar@example.com"
                },
                2: {
                    "venue_name": "Elite Cricket Ground",
                    "venue_address": "456 Ground Road, Andheri West",
                    "city": "Mumbai",
                    "state": "Maharashtra", 
                    "pincode": "400058",
                    "description": "Premium cricket ground with modern facilities"
                },
                3: {
                    "arenas": [
                        {
                            "name": "Cricket Ground A",
                            "sport": "Cricket",
                            "capacity": 22,
                            "base_price_per_hour": 1200.0,
                            "slots": [
                                {"day_of_week": 0, "start_time": "06:00", "end_time": "08:00", "capacity": 1, "price_per_hour": 1200.0},
                                {"day_of_week": 0, "start_time": "18:00", "end_time": "20:00", "capacity": 1, "price_per_hour": 1500.0, "is_peak_hour": True}
                            ]
                        }
                    ]
                },
                4: {
                    "amenities": ["Parking", "Washroom", "Floodlights", "Seating"],
                    "rules": "No smoking, No alcohol, Proper sports attire required"
                },
                5: {
                    "bank_account_number": "1234567890",
                    "ifsc_code": "HDFC0001234",
                    "account_holder_name": "Rajesh Kumar",
                    "upi_id": "rajesh@paytm"
                }
            }
            
            payload = step_data.get(step_num, {})
            response = self.session.post(f"{BACKEND_URL}/onboarding/step{step_num}", json=payload, headers=headers)
            
            if should_work:
                if response.status_code == 200:
                    data = response.json()
                    if data.get("success"):
                        return True, f"Step {step_num} completed successfully"
                    else:
                        return False, f"Step {step_num} failed: {data}"
                else:
                    return False, f"Step {step_num} HTTP {response.status_code}: {response.text}"
            else:
                # Should fail with 401/403
                if response.status_code in [401, 403]:
                    return True, f"Step {step_num} properly rejected unauthorized access (HTTP {response.status_code})"
                else:
                    return False, f"Step {step_num} should have returned 401/403 but got HTTP {response.status_code}"
                    
        except Exception as e:
            return False, f"Step {step_num} error: {str(e)}"
    
    def test_onboarding_step_without_token(self, step_num):
        """Test onboarding step without JWT token (should fail)"""
        return self.test_onboarding_step_with_token(step_num, None, should_work=False)
    
    def test_new_user_flow(self):
        """Test complete new user flow"""
        print(f"\n🔄 TESTING NEW USER FLOW ({self.new_user_mobile})")
        
        # Step 1: Send OTP
        success, otp, request_id = self.send_otp(self.new_user_mobile)
        if not success:
            self.log_result("New User - Send OTP", False, otp)
            return False
        
        self.log_result("New User - Send OTP", True, f"OTP sent successfully, dev OTP: {otp}")
        
        # Step 2: Login with OTP (should return JWT + redirect to onboarding_step_1)
        success, login_data = self.login_with_otp(self.new_user_mobile, otp)
        if not success:
            self.log_result("New User - Login with OTP", False, login_data)
            return False
        
        # Verify new user response structure
        expected_fields = ["user_exists", "action", "redirect_to", "access_token", "token_type"]
        missing_fields = [field for field in expected_fields if field not in login_data]
        
        if missing_fields:
            self.log_result("New User - Login Response Structure", False, f"Missing fields: {missing_fields}")
            return False
        
        # Check if this is actually a new user flow (user_exists=False) or existing user with incomplete onboarding
        if not login_data.get("user_exists") and login_data.get("action") == "start_onboarding" and login_data.get("redirect_to") == "onboarding_step_1":
            self.log_result("New User - Login with OTP", True, f"Correct new user routing: {login_data.get('action')} → {login_data.get('redirect_to')}")
        elif login_data.get("user_exists") and login_data.get("action") == "complete_onboarding" and login_data.get("redirect_to") == "onboarding_step_1":
            self.log_result("New User - Login with OTP", True, f"Existing user with incomplete onboarding: {login_data.get('action')} → {login_data.get('redirect_to')}")
        else:
            self.log_result("New User - Login with OTP", False, f"Incorrect routing: user_exists={login_data.get('user_exists')}, action={login_data.get('action')}, redirect_to={login_data.get('redirect_to')}")
            return False
        
        # Step 3: Test onboarding step1 with JWT token (should work)
        jwt_token = login_data.get("access_token")
        success, details = self.test_onboarding_step_with_token(1, jwt_token, should_work=True, otp=otp)
        
        # Note: This may fail due to OTP being consumed during login - this is a backend design issue
        if not success and "No OTP found" in details:
            self.log_result("New User - Onboarding Step1 with JWT", False, f"BACKEND DESIGN ISSUE: {details} - OTP already consumed during login, but onboarding step1 still requires OTP verification")
        else:
            self.log_result("New User - Onboarding Step1 with JWT", success, details)
        
        return success
    
    def test_existing_user_flow(self):
        """Test existing user flow"""
        print(f"\n🔄 TESTING EXISTING USER FLOW ({self.existing_user_mobile})")
        
        # Step 1: Send OTP
        success, otp, request_id = self.send_otp(self.existing_user_mobile)
        if not success:
            self.log_result("Existing User - Send OTP", False, otp)
            return False
        
        self.log_result("Existing User - Send OTP", True, f"OTP sent successfully, dev OTP: {otp}")
        
        # Step 2: Login with OTP (should return JWT + redirect to dashboard or incomplete step)
        success, login_data = self.login_with_otp(self.existing_user_mobile, otp)
        if not success:
            self.log_result("Existing User - Login with OTP", False, login_data)
            return False
        
        # Verify existing user response structure
        if login_data.get("user_exists") and login_data.get("access_token"):
            redirect_to = login_data.get("redirect_to", "")
            action = login_data.get("action", "")
            
            if redirect_to in ["dashboard", "onboarding_step_1", "onboarding_step_2", "onboarding_step_3", "onboarding_step_4", "onboarding_step_5"]:
                self.log_result("Existing User - Login with OTP", True, f"Correct routing: {action} → {redirect_to}")
                return True
            else:
                self.log_result("Existing User - Login with OTP", False, f"Unexpected routing: {action} → {redirect_to}")
                return False
        else:
            self.log_result("Existing User - Login with OTP", False, f"Missing user_exists or access_token in response")
            return False
    
    def test_security_validation(self):
        """Test security validation - JWT protection"""
        print(f"\n🔒 TESTING SECURITY VALIDATION")
        
        all_passed = True
        
        # Test onboarding steps without JWT token (should fail with 401/403)
        for step in range(1, 6):
            success, details = self.test_onboarding_step_without_token(step)
            self.log_result(f"Security - Step{step} without JWT", success, details)
            if not success:
                all_passed = False
        
        # Test with invalid JWT token
        try:
            invalid_token = "invalid.jwt.token"
            success, details = self.test_onboarding_step_with_token(1, invalid_token, should_work=False)
            self.log_result("Security - Invalid JWT Token", success, details)
            if not success:
                all_passed = False
        except Exception as e:
            self.log_result("Security - Invalid JWT Token", False, f"Error: {str(e)}")
            all_passed = False
        
        return all_passed
    
    def run_comprehensive_test(self):
        """Run all tests for secure onboarding flow"""
        print("🚀 STARTING SECURE ONBOARDING FLOW TESTING")
        print("=" * 60)
        
        # Test 1: API Health
        if not self.test_api_health():
            print("❌ API Health check failed. Stopping tests.")
            return False
        
        # Test 2: Deprecated API
        self.test_deprecated_check_user_api()
        
        # Test 3: New User Flow
        new_user_success = self.test_new_user_flow()
        
        # Test 4: Existing User Flow  
        existing_user_success = self.test_existing_user_flow()
        
        # Test 5: Security Validation
        security_success = self.test_security_validation()
        
        # Summary
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        passed_tests = sum(1 for result in self.test_results if result["success"])
        total_tests = len(self.test_results)
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {total_tests - passed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        # Critical flow results
        critical_flows = {
            "New User Flow": new_user_success,
            "Existing User Flow": existing_user_success, 
            "Security Validation": security_success
        }
        
        print(f"\n🎯 CRITICAL FLOW RESULTS:")
        for flow, success in critical_flows.items():
            status = "✅ PASS" if success else "❌ FAIL"
            print(f"   {status} {flow}")
        
        # Failed tests details
        failed_tests = [result for result in self.test_results if not result["success"]]
        if failed_tests:
            print(f"\n❌ FAILED TESTS DETAILS:")
            for test in failed_tests:
                print(f"   • {test['test']}: {test['details']}")
        
        overall_success = all(critical_flows.values())
        
        if overall_success:
            print(f"\n🎉 SECURE ONBOARDING FLOW TESTING COMPLETED SUCCESSFULLY!")
            print(f"✅ All critical authentication and security flows are working correctly")
        else:
            print(f"\n⚠️  SECURE ONBOARDING FLOW TESTING COMPLETED WITH ISSUES")
            print(f"❌ Some critical flows failed - review failed tests above")
        
        return overall_success

if __name__ == "__main__":
    tester = SecureOnboardingTester()
    success = tester.run_comprehensive_test()
    
    # Save detailed results
    with open("/app/secure_onboarding_test_results.json", "w") as f:
        json.dump({
            "overall_success": success,
            "test_results": tester.test_results,
            "timestamp": datetime.now().isoformat(),
            "backend_url": BACKEND_URL
        }, f, indent=2)
    
    print(f"\n📄 Detailed results saved to: /app/secure_onboarding_test_results.json")