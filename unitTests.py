import requests
import json
import sys
from datetime import datetime

BASE_URL = "https://final-project-server-side-dcly.onrender.com/api"

def test_about():
    print("Testing /about endpoint")
    response = requests.get(f"{BASE_URL}/about/")
    print(response.status_code, response.json())
    assert response.status_code == 200, "Failed to fetch team details"
    assert isinstance(response.json(), list), "Response should be a list"

def test_check_user_exists():
    print("Testing user existence before adding cost")
    user_id = "123123"
    response = requests.get(f"{BASE_URL}/users/{user_id}")
    print(response.status_code, response.json())
    assert response.status_code == 200, "User should exist before adding cost"

def test_add_valid_cost():
    print("Testing valid cost addition")
    data = {
        "userid": "123123",
        "description": "Bread",
        "category": "food",
        "sum": 5
    }
    response = requests.post(f"{BASE_URL}/add/", json=data)
    print(response.status_code, response.json())
    assert response.status_code == 201, "Valid cost addition should succeed"

def test_add_invalid_category():
    print("Testing /add with invalid category")
    data = {
        "userid": "587747",
        "description": "Test user",
        "category": "invalid_category",
        "sum": 10
    }
    response = requests.post(f"{BASE_URL}/add/", json=data)
    print(response.status_code, response.json())
    assert response.status_code == 400, "Should fail for invalid category"

def test_get_report_no_data():
    print("Testing /report with user not found")
    response = requests.get(f"{BASE_URL}/report/?id=999999&year=2025&month=2")
    print(response.status_code, response.json())
    assert response.status_code == 404, "User not found"

def test_get_report_invalid_params():
    print("Testing /report with invalid params")
    response = requests.get(f"{BASE_URL}/report/?id=123123&year=abcd&month=13")
    print(response.status_code, response.json())
    assert response.status_code == 400, "Should return error for invalid params"

def test_report_after_addition():
    print("Testing report after adding cost")
    current_date = datetime.now()
    response = requests.get(f"{BASE_URL}/report/?id=123123&year={current_date.year}&month={current_date.month}")
    print(response.status_code, response.json())
    assert response.status_code == 200, "Report request should succeed"
    report_data = response.json()
    assert any(item["description"] == "Bread" for item in report_data["costs"]["food"]), \
        "Added cost should appear in the report"

def test_get_user_not_found():
    print("Testing /users/{id} for non-existent user")
    response = requests.get(f"{BASE_URL}/users/99999999")
    print(response.status_code, response.json())
    assert response.status_code == 404, "Should return 404 for missing user"

def test_get_user_valid():
    print("Testing /users/{id} for valid user")
    response = requests.get(f"{BASE_URL}/users/123123")
    print(response.status_code, response.json())
    assert response.status_code == 200, "Valid user should return data"
    assert "total" in response.json(), "Response should include total cost"

def run_tests():
    with open("api_test_results.txt", "w") as f:
        sys.stdout = f
        test_about()
        test_check_user_exists()
        test_add_valid_cost()
        test_add_invalid_category()
        test_get_report_no_data()
        test_get_report_invalid_params()
        test_report_after_addition()
        test_get_user_not_found()
        test_get_user_valid()
        sys.stdout = sys.__stdout__

if __name__ == "__main__":
    run_tests()
