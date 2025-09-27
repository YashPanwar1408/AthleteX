#!/usr/bin/env python3
"""
Test script for the /api/analyze endpoint
This script helps debug the 400 error by testing different scenarios
"""

import requests
import json

# Test data - modify these values as needed
TEST_DATA = {
    "videoUrl": "https://example.com/test-video.mp4",  # Replace with actual video URL
    "testType": "vertical-jump",  # Must be one of: vertical-jump, sit-ups, shuttle-run, endurance-run
    "attemptId": "test-attempt-123",
    "userId": "user-123",
    "username": "testuser",
    "profileImageUrl": "https://example.com/profile.jpg"  # Replace with actual profile image URL
}

API_URL = "http://localhost:5000/api/analyze"  # Adjust port if different

def test_valid_request():
    """Test with valid data"""
    print("Testing with valid data...")
    try:
        response = requests.post(API_URL, json=TEST_DATA)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        return response.status_code == 200
    except Exception as e:
        print(f"Error: {e}")
        return False

def test_missing_fields():
    """Test with missing required fields"""
    print("\nTesting with missing fields...")
    test_data = TEST_DATA.copy()
    del test_data["videoUrl"]  # Remove required field
    
    try:
        response = requests.post(API_URL, json=test_data)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        return response.status_code == 400
    except Exception as e:
        print(f"Error: {e}")
        return False

def test_invalid_test_type():
    """Test with invalid test type"""
    print("\nTesting with invalid test type...")
    test_data = TEST_DATA.copy()
    test_data["testType"] = "invalid-test"
    
    try:
        response = requests.post(API_URL, json=test_data)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        return response.status_code == 400
    except Exception as e:
        print(f"Error: {e}")
        return False

def test_no_json():
    """Test with no JSON data"""
    print("\nTesting with no JSON data...")
    try:
        response = requests.post(API_URL, data="not json")
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        return response.status_code == 400
    except Exception as e:
        print(f"Error: {e}")
        return False

if __name__ == "__main__":
    print("API Testing Script")
    print("=" * 50)
    
    # Run all tests
    tests = [
        ("Valid Request", test_valid_request),
        ("Missing Fields", test_missing_fields),
        ("Invalid Test Type", test_invalid_test_type),
        ("No JSON Data", test_no_json)
    ]
    
    results = []
    for test_name, test_func in tests:
        print(f"\n{test_name}:")
        print("-" * 30)
        result = test_func()
        results.append((test_name, result))
    
    print("\n" + "=" * 50)
    print("Test Results:")
    for test_name, result in results:
        status = "PASS" if result else "FAIL"
        print(f"{test_name}: {status}")
