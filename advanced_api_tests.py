import requests
import json
import sys

BASE_URL = "https://final-project-server-side-dcly.onrender.com"
API_BASE = f"{BASE_URL}/api"

def safe_json(response):
    try:
        return response.json()
    except Exception as e:
        print("⚠️ JSONDecodeError:", e)
        print("Response text:", response.text)
        return None

def test_about():
    print("Testing /about endpoint")
    response = requests.get(f"{API_BASE}/about")
    data = safe_json(response)
    print("Status:", response.status_code)
    print("Data:", data)
    assert response.status_code == 200, "Failed to fetch team details"
    assert isinstance(data, list), "Response should be a list"

def test_check_user_exists():
    print("Testing user existence before adding cost")
    user_id = "123123"
    response = requests.get(f"{API_BASE}/users/{user_id}")
    data = safe_json(response)
    print("Status:", response.status_code)
    print("Data:", data)
    assert response.status_code == 200, "User should exist before adding cost"

def test_add_valid_cost():
    print("Testing valid cost addition")
    data = {
        "userid": 123123,
        "description": "Bread",
        "category": "food",
        "sum": 5
    }
    response = requests.post(f"{API_BASE}/add", json=data)
    res = safe_json(response)
    print("Status:", response.status_code)
    print("Response:", res)
    assert response.status_code == 201, "Valid cost addition should succeed"

def test_add_invalid_category():
    print("Testing /add with invalid category")
    data = {
        "userid": 123123,
        "description": "Test item",
        "category": "invalid_category",
        "sum": 10
    }
    response = requests.post(f"{API_BASE}/add", json=data)
    res = safe_json(response)
    print("Status:", response.status_code)
    print("Response:", res)
    if response.status_code != 400:
        print("⚠️ Server returned", response.status_code, "instead of 400. Consider fixing backend validation.")
    assert response.status_code == 400, "Should fail for invalid category"

def test_get_report_no_data():
    print("Testing /report with nonexistent user")
    response = requests.get(f"{API_BASE}/report?id=999999&year=2025&month=2")
    print("Status:", response.status_code)
    print("Text:", response.text)
    assert response.status_code in [200, 404], "User not found or no data"

def test_get_report_invalid_params():
    print("Testing /report with invalid params")
    response = requests.get(f"{API_BASE}/report?id=123123&year=abcd&month=13")
    print("Status:", response.status_code)
    print("Text:", response.text)
    assert response.status_code == 400, "Should return error for invalid params"

def test_report_after_addition():
    print("Testing report after adding cost")
    response = requests.get(f"{API_BASE}/report?id=123123&year=2025&month=5")
    data = safe_json(response)
    print("Status:", response.status_code)
    print("Report Data:", data)
    assert response.status_code == 200, "Report request should succeed"
    found = False
    for category_name, items in data["costs"].items():
        if any(item.get("description") == "Bread" for item in items):
            found = True
            break
    assert found, "Added cost should appear in the report"

def test_get_user_not_found():
    print("Testing /users/{id} for non-existent user")
    response = requests.get(f"{API_BASE}/users/99999999")
    print("Status:", response.status_code)
    print("Text:", response.text)
    assert response.status_code == 404, "Should return 404 for missing user"

def test_get_user_valid():
    print("Testing /users/{id} for valid user")
    response = requests.get(f"{API_BASE}/users/123123")
    data = safe_json(response)
    print("Status:", response.status_code)
    print("Data:", data)
    assert response.status_code == 200, "Valid user should return data"
    assert "total" in data, "Response should include total cost"

def run_tests():
    with open("advanced_api_test_results.txt", "w", encoding="utf-8") as f:
        original_stdout = sys.stdout
        sys.stdout = f
        try:
            test_about()
            test_check_user_exists()
            test_add_valid_cost()
            test_add_invalid_category()
            test_get_report_no_data()
            test_get_report_invalid_params()
            test_report_after_addition()
            test_get_user_not_found()
            test_get_user_valid()
            print("\n✅ All tests completed.")
        except AssertionError as e:
            print(f"\n❌ Test failed: {e}")
        finally:
            sys.stdout = original_stdout
            print("📄 Results saved to advanced_api_test_results.txt")

if __name__ == "__main__":
    run_tests()
