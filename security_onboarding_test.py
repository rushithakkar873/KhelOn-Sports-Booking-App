#!/usr/bin/env python3
"""
Progressive Onboarding Security Testing
Testing the critical security and flow issues reported by the user:

CRITICAL ISSUES TO TEST AND FIX:
1. **Scenario 1**: Existing user (9909385701) - check-user API returning "user exists undefined" and redirecting to onboarding instead of login flow
2. **Scenario 2**: New user flow - no OTP verification required before onboarding (major security flaw)
3. **Step 2 venue details API failing** - test step2 endpoint after step1 completion

SECURITY CONCERNS TO VALIDATE:
- Test that onboarding step1 is now properly protected (should require mobile verification header)
- Verify existing users are redirected to login, not onboarding
- Ensure new users must complete OTP verification before accessing onboarding
- Test all 5 onboarding steps work with proper JWT authentication
"""

import requests
import json
import time
from datetime import datetime

# Get backend URL from frontend env
def get_backend_url():
    try:
        with open('/app/frontend/.env', 'r') as f:
            for line in f:
                if line.startswith('EXPO_PUBLIC_BACKEND_URL='):
                    return line.split('=')[1].strip()
    except:
        pass
    return "https://tourneymaster-16.preview.emergentagent.com"

BASE_URL = f"{get_backend_url()}/api"

class SecurityOnboardingTester:
    def __init__(self):
        self.test_results = []
        self.access_tokens = {}
        
    def log_result(self, test_name, success, details):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if details:
            print(f"   Details: {details}")
        self.test_results.append({
            "test": test_name,
            "success": success,
            "details": details
        })
        
    def make_request(self, method, endpoint, data=None, headers=None, params=None):
        """Make HTTP request with error handling"""
        url = f"{BASE_URL}{endpoint}"
        
        try:
            if method.upper() == "GET":
                response = requests.get(url, headers=headers, params=params, timeout=10)
            elif method.upper() == "POST":
                response = requests.post(url, json=data, headers=headers, params=params, timeout=10)
            elif method.upper() == "PUT":
                response = requests.put(url, json=data, headers=headers, params=params, timeout=10)
            else:
                raise ValueError(f"Unsupported method: {method}")
            
            return response
        except requests.exceptions.RequestException as e:
            print(f"Request failed: {str(e)}")
            return None
            
    def test_api_health(self):
        """Test API health and connectivity"""
        print("🔍 Testing API Health...")
        response = self.make_request("GET", "/")
        
        if response and response.status_code == 200:
            data = response.json()
            self.log_result("API Health Check", True, f"API running: {data.get('message', 'OK')}")
            return True
        else:
            status = response.status_code if response else "No Response"
            self.log_result("API Health Check", False, f"API not accessible: {status}")
            return False
            
    def test_scenario_1_existing_user(self):
        """
        SCENARIO 1: Test existing user (9909385701) - check-user API issues
        Expected: Should return user_exists=true and redirect to login flow
        """
        print("\n🔍 TESTING SCENARIO 1: Existing User Flow (+919909385701)")
        
        existing_mobile = "+919909385701"
        
        # Step 1: Check if user exists
        payload = {"mobile": existing_mobile}
        response = self.make_request("POST", "/auth/check-user", payload)
        
        if response and response.status_code == 200:
            data = response.json()
            user_exists = data.get("user_exists")
            message = data.get("message", "")
            
            # Check for the specific issue: "user exists undefined"
            if user_exists is None:
                self.log_result("Existing User Detection - Critical Bug", False, f"user_exists field is undefined/null: {user_exists} - This is the reported bug!")
            elif user_exists is True:
                self.log_result("Existing User Detection", True, f"User exists correctly detected: {message}")
                
                # Test OTP flow for existing user
                otp_request_id = data.get("otp_request_id")
                dev_otp = data.get("dev_otp")
                
                if otp_request_id and dev_otp:
                    # Step 2: Verify OTP and check routing
                    verify_payload = {"mobile": existing_mobile, "otp": dev_otp}
                    verify_response = self.make_request("POST", "/auth/verify-otp-and-route", verify_payload)
                    
                    if verify_response and verify_response.status_code == 200:
                        verify_data = verify_response.json()
                        action = verify_data.get("action")
                        user_exists_route = verify_data.get("user_exists")
                        
                        if action == "login" and user_exists_route is True:
                            self.log_result("Existing User Routing", True, "Correctly routed to login flow")
                            
                            # Check if access token is provided for existing user
                            access_token = verify_data.get("access_token")
                            if access_token:
                                self.log_result("Existing User Token Generation", True, "Access token provided for existing user")
                                self.access_tokens["existing_user"] = access_token
                                return access_token
                            else:
                                self.log_result("Existing User Token Generation", False, "No access token provided for existing user")
                        else:
                            self.log_result("Existing User Routing - Critical Bug", False, f"Wrong routing - action: {action}, user_exists: {user_exists_route} - Should redirect to login, not onboarding!")
                    else:
                        status = verify_response.status_code if verify_response else "No Response"
                        self.log_result("Existing User OTP Verification", False, f"HTTP {status}")
                else:
                    self.log_result("Existing User OTP Generation", False, "No OTP request ID or dev OTP provided")
            elif user_exists is False:
                self.log_result("Existing User Detection - Critical Bug", False, f"User should exist but returned false: {message} - This indicates the user doesn't exist in DB!")
            else:
                self.log_result("Existing User Detection - Critical Bug", False, f"user_exists field has unexpected value: {user_exists}")
        else:
            status = response.status_code if response else "No Response"
            self.log_result("Check User API", False, f"HTTP {status}")
            
        return None
        
    def test_scenario_2_new_user_security(self):
        """
        SCENARIO 2: Test new user flow security
        Expected: OTP verification should be required before onboarding
        """
        print("\n🔍 TESTING SCENARIO 2: New User Security Flow (+919876543210)")
        
        new_mobile = "+919876543210"
        
        # Step 1: Check new user
        payload = {"mobile": new_mobile}
        response = self.make_request("POST", "/auth/check-user", payload)
        
        if response and response.status_code == 200:
            data = response.json()
            user_exists = data.get("user_exists")
            
            if user_exists is False:
                self.log_result("New User Detection", True, "New user correctly detected")
                
                dev_otp = data.get("dev_otp")
                if dev_otp:
                    # Step 2: Test onboarding step1 WITHOUT OTP verification (security test)
                    step1_payload = {
                        "mobile": new_mobile,
                        "name": "Test User",
                        "business_name": "Test Business",
                        "business_address": "Test Address"
                    }
                    
                    # CRITICAL SECURITY TEST: Try without mobile_verified header (should fail)
                    step1_response = self.make_request("POST", "/onboarding/step1", step1_payload)
                    if step1_response and step1_response.status_code == 401:
                        self.log_result("Onboarding Security - No Header", True, "Step1 correctly rejected without mobile verification header")
                    else:
                        status = step1_response.status_code if step1_response else "No Response"
                        self.log_result("Onboarding Security - No Header - CRITICAL SECURITY FLAW", False, f"Step1 should reject without header but got HTTP {status} - MAJOR SECURITY ISSUE!")
                    
                    # CRITICAL SECURITY TEST: Try with wrong mobile in header (should fail)
                    headers = {"mobile-verified": "+919999999999"}
                    step1_response = self.make_request("POST", "/onboarding/step1", step1_payload, headers=headers)
                    if step1_response and step1_response.status_code == 401:
                        self.log_result("Onboarding Security - Wrong Header", True, "Step1 correctly rejected with wrong mobile in header")
                    else:
                        status = step1_response.status_code if step1_response else "No Response"
                        self.log_result("Onboarding Security - Wrong Header - CRITICAL SECURITY FLAW", False, f"Step1 should reject wrong mobile but got HTTP {status} - MAJOR SECURITY ISSUE!")
                    
                    # Step 3: Proper flow - verify OTP first
                    verify_payload = {"mobile": new_mobile, "otp": dev_otp}
                    verify_response = self.make_request("POST", "/auth/verify-otp-and-route", verify_payload)
                    
                    if verify_response and verify_response.status_code == 200:
                        verify_data = verify_response.json()
                        action = verify_data.get("action")
                        mobile_verified = verify_data.get("mobile_verified")
                        
                        if action == "onboarding" and mobile_verified is True:
                            self.log_result("New User OTP Verification", True, "OTP verified and routed to onboarding")
                            
                            # Step 4: Now try onboarding step1 with proper header
                            headers = {"mobile-verified": new_mobile}
                            step1_response = self.make_request("POST", "/onboarding/step1", step1_payload, headers=headers)
                            
                            if step1_response and step1_response.status_code == 200:
                                step1_data = step1_response.json()
                                access_token = step1_data.get("access_token")
                                if access_token:
                                    self.log_result("Secure Onboarding Step1", True, "Step1 completed with proper OTP verification")
                                    self.access_tokens["new_user"] = access_token
                                    return access_token
                                else:
                                    self.log_result("Secure Onboarding Step1", False, "Step1 completed but no access token provided")
                            else:
                                status = step1_response.status_code if step1_response else "No Response"
                                error_text = step1_response.text if step1_response else "No Response"
                                self.log_result("Secure Onboarding Step1", False, f"Step1 failed: HTTP {status} - {error_text}")
                        else:
                            self.log_result("New User OTP Verification", False, f"Wrong routing - action: {action}, mobile_verified: {mobile_verified}")
                    else:
                        status = verify_response.status_code if verify_response else "No Response"
                        self.log_result("New User OTP Verification", False, f"OTP verification failed: HTTP {status}")
                else:
                    self.log_result("New User OTP Generation", False, "No dev OTP provided")
            else:
                self.log_result("New User Detection", False, f"Expected new user but got user_exists: {user_exists}")
        else:
            status = response.status_code if response else "No Response"
            self.log_result("New User Check", False, f"HTTP {status}")
            
        return None
        
    def test_scenario_3_step2_api(self, access_token):
        """
        SCENARIO 3: Test step2 venue details API
        Expected: Should work with proper JWT authentication
        """
        print("\n🔍 TESTING SCENARIO 3: Step 2 Venue Details API")
        
        if not access_token:
            self.log_result("Step2 API Test", False, "No access token available for testing")
            return False
            
        # Test step2 with proper authentication
        step2_payload = {
            "venue_name": "Test Cricket Ground",
            "venue_address": "123 Test Street, Test Area",
            "venue_city": "Mumbai",
            "venue_state": "Maharashtra",
            "venue_pincode": "400001",
            "venue_description": "Professional cricket ground with modern facilities"
        }
        
        headers = {"Authorization": f"Bearer {access_token}"}
        response = self.make_request("POST", "/onboarding/step2", step2_payload, headers=headers)
        
        if response and response.status_code == 200:
            data = response.json()
            self.log_result("Step2 Venue Details API", True, f"Step2 completed successfully: {data.get('message', 'OK')}")
            return True
        else:
            status = response.status_code if response else "No Response"
            error_text = response.text if response else "No Response"
            self.log_result("Step2 Venue Details API - CRITICAL BUG", False, f"HTTP {status}: {error_text} - This is the reported Step2 API failure!")
            
        # Test step2 without authentication (should fail)
        response = self.make_request("POST", "/onboarding/step2", step2_payload)
        if response and response.status_code == 401:
            self.log_result("Step2 Security - No Auth", True, "Step2 correctly rejected without authentication")
        else:
            status = response.status_code if response else "No Response"
            self.log_result("Step2 Security - No Auth", False, f"Step2 should require auth but got HTTP {status}")
            
        return False
        
    def test_all_onboarding_steps(self, access_token):
        """
        Test all 5 onboarding steps with proper JWT authentication
        """
        print("\n🔍 TESTING ALL ONBOARDING STEPS (1-5)")
        
        if not access_token:
            self.log_result("All Onboarding Steps", False, "No access token available")
            return
            
        headers = {"Authorization": f"Bearer {access_token}"}
        
        # Step 3: Arena/Sport configuration
        step3_payload = {
            "arenas": [
                {
                    "name": "Cricket Ground A",
                    "sport": "Cricket",
                    "capacity": 22,
                    "base_price_per_hour": 1200,
                    "slots": [
                        {
                            "day_of_week": 0,
                            "start_time": "06:00",
                            "end_time": "08:00",
                            "capacity": 1,
                            "price_per_hour": 1200,
                            "is_peak_hour": False
                        }
                    ]
                }
            ]
        }
        
        response = self.make_request("POST", "/onboarding/step3", step3_payload, headers=headers)
        if response and response.status_code == 200:
            self.log_result("Onboarding Step3 - Arena Config", True, "Arena configuration completed")
        else:
            status = response.status_code if response else "No Response"
            error_text = response.text if response else "No Response"
            self.log_result("Onboarding Step3 - Arena Config", False, f"HTTP {status}: {error_text}")
        
        # Step 4: Amenities and rules
        step4_payload = {
            "amenities": ["Parking", "Washroom", "Floodlights"],
            "rules_and_regulations": "No smoking, No alcohol, Proper sports attire required",
            "cancellation_policy": "24 hours advance notice required for cancellation"
        }
        
        response = self.make_request("POST", "/onboarding/step4", step4_payload, headers=headers)
        if response and response.status_code == 200:
            self.log_result("Onboarding Step4 - Amenities", True, "Amenities and rules configured")
        else:
            status = response.status_code if response else "No Response"
            error_text = response.text if response else "No Response"
            self.log_result("Onboarding Step4 - Amenities", False, f"HTTP {status}: {error_text}")
        
        # Step 5: Payment details
        step5_payload = {
            "bank_account_number": "1234567890",
            "bank_ifsc_code": "HDFC0001234",
            "bank_account_holder_name": "Test User",
            "upi_id": "testuser@paytm"
        }
        
        response = self.make_request("POST", "/onboarding/step5", step5_payload, headers=headers)
        if response and response.status_code == 200:
            self.log_result("Onboarding Step5 - Payment", True, "Payment details configured")
        else:
            status = response.status_code if response else "No Response"
            error_text = response.text if response else "No Response"
            self.log_result("Onboarding Step5 - Payment", False, f"HTTP {status}: {error_text}")
        
        # Check onboarding status
        response = self.make_request("GET", "/onboarding/status", headers=headers)
        if response and response.status_code == 200:
            data = response.json()
            self.log_result("Onboarding Status Check", True, f"Status retrieved successfully")
        else:
            status = response.status_code if response else "No Response"
            error_text = response.text if response else "No Response"
            self.log_result("Onboarding Status Check", False, f"HTTP {status}: {error_text}")
            
    def test_unauthorized_access_protection(self):
        """
        Test that all onboarding APIs reject unauthorized access
        """
        print("\n🔍 TESTING UNAUTHORIZED ACCESS PROTECTION")
        
        test_payload = {"test": "data"}
        
        endpoints = [
            "/onboarding/step2",
            "/onboarding/step3", 
            "/onboarding/step4",
            "/onboarding/step5",
            "/onboarding/status"
        ]
        
        for endpoint in endpoints:
            response = self.make_request("POST", endpoint, test_payload)
            if response and response.status_code == 401:
                self.log_result(f"Unauthorized Protection - {endpoint}", True, "Correctly rejected unauthorized access")
            else:
                status = response.status_code if response else "No Response"
                self.log_result(f"Unauthorized Protection - {endpoint}", False, f"Should reject but got HTTP {status}")
                
    def run_all_tests(self):
        """Run all progressive onboarding security tests"""
        print("🚀 STARTING PROGRESSIVE ONBOARDING SECURITY TESTING")
        print(f"🌐 Backend URL: {BASE_URL}")
        print("🎯 Focus: Critical security and flow issues reported by user")
        print("=" * 80)
        
        # Test API connectivity
        if not self.test_api_health():
            print("❌ API not accessible, stopping tests")
            return
        
        # Test Scenario 1: Existing user flow (Critical Issue)
        existing_user_token = self.test_scenario_1_existing_user()
        
        # Test Scenario 2: New user security (Critical Issue)
        new_user_token = self.test_scenario_2_new_user_security()
        
        # Test Scenario 3: Step2 API (Critical Issue)
        test_token = new_user_token or existing_user_token
        step2_success = self.test_scenario_3_step2_api(test_token)
        
        # Test all onboarding steps if we have a token
        if test_token:
            self.test_all_onboarding_steps(test_token)
        
        # Test unauthorized access protection
        self.test_unauthorized_access_protection()
        
        # Print comprehensive summary
        self.print_summary()
        
    def print_summary(self):
        """Print comprehensive test summary"""
        print("\n" + "=" * 80)
        print("📊 PROGRESSIVE ONBOARDING SECURITY TEST SUMMARY")
        print("=" * 80)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result["success"])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"✅ Passed: {passed_tests}")
        print(f"❌ Failed: {failed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        # Critical Issues Analysis
        print("\n🚨 CRITICAL SECURITY ISSUES FOUND:")
        critical_issues = []
        
        for result in self.test_results:
            if not result["success"]:
                if "user exists undefined" in result["details"] or "user_exists field is undefined" in result["details"]:
                    critical_issues.append("❗ SCENARIO 1: Check-user API returning undefined user_exists field")
                elif "CRITICAL SECURITY FLAW" in result["test"]:
                    critical_issues.append("❗ SCENARIO 2: Onboarding Step1 not properly protected - allows access without OTP verification")
                elif "Step2" in result["test"] and "CRITICAL BUG" in result["test"]:
                    critical_issues.append("❗ SCENARIO 3: Step2 venue details API failing")
                elif "Wrong routing" in result["details"] and "Should redirect to login" in result["details"]:
                    critical_issues.append("❗ SCENARIO 1: Existing users redirected to onboarding instead of login")
        
        if critical_issues:
            for issue in set(critical_issues):  # Remove duplicates
                print(f"   {issue}")
        else:
            print("   ✅ No critical security issues found!")
            
        # Failed Tests Details
        if failed_tests > 0:
            print(f"\n🔍 DETAILED FAILURE ANALYSIS:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"   ❌ {result['test']}")
                    print(f"      Issue: {result['details']}")
                    
        # Recommendations
        print(f"\n💡 RECOMMENDATIONS FOR MAIN AGENT:")
        recommendations = []
        
        for result in self.test_results:
            if not result["success"]:
                if "user_exists field is undefined" in result["details"]:
                    recommendations.append("1. Fix check_user_exists() method in auth_service.py to properly return user_exists boolean")
                elif "CRITICAL SECURITY FLAW" in result["test"]:
                    recommendations.append("2. Strengthen onboarding step1 security - ensure mobile verification header is properly validated")
                elif "Step2" in result["test"] and "CRITICAL BUG" in result["test"]:
                    recommendations.append("3. Debug and fix step2 venue details API endpoint")
                elif "Wrong routing" in result["details"]:
                    recommendations.append("4. Fix verify-otp-and-route logic to properly redirect existing users to login")
        
        for rec in set(recommendations):  # Remove duplicates
            print(f"   {rec}")
            
        if not recommendations:
            print("   ✅ All critical issues resolved!")

def main():
    """Main test runner"""
    tester = SecurityOnboardingTester()
    tester.run_all_tests()

if __name__ == "__main__":
    main()