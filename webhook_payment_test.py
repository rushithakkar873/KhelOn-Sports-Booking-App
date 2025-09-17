#!/usr/bin/env python3
"""
Test webhook payment confirmation functionality
"""

import requests
import json

BASE_URL = "https://playonapp.preview.emergentagent.com/api"

def test_payment_webhook():
    """Test payment webhook with mock payment confirmation"""
    print("=== Testing Payment Webhook Confirmation ===")
    
    # Mock webhook payload for payment confirmation
    webhook_payload = {
        "event": "payment_link.paid",
        "payload": {
            "payment": {
                "id": "pay_test_webhook_123456",
                "amount": 240000,  # ₹2400 in paise
                "status": "captured",
                "method": "upi",
                "created_at": 1642678800
            },
            "payment_link": {
                "id": "plink_mock_3f978db3026c",  # Using ID from recent test
                "amount": 240000,
                "currency": "INR",
                "status": "paid"
            }
        }
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/webhook/razorpay",
            json=webhook_payload,
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        
        if response.status_code == 200:
            print("✅ Webhook endpoint processed payment confirmation successfully")
            print(f"   Response: {response.json()}")
            return True
        else:
            print(f"❌ Webhook failed with status {response.status_code}: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Webhook test failed: {str(e)}")
        return False

if __name__ == "__main__":
    success = test_payment_webhook()
    print(f"\nWebhook test {'PASSED' if success else 'FAILED'}")