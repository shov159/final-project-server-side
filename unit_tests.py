import requests
import json
import sys

BASE_ENDPOINT = "https://final-project-server-side-dcly.onrender.com/api"

def verify_team_endpoint():
    print("Verifying /about endpoint")
    resp = requests.get(f"{BASE_ENDPOINT}/about/")
    print(resp.status_code, resp.json())
    assert resp.status_code == 200, "Failed to fetch dev team data"
    assert isinstance(resp.json(), list), "Response should be a list"

def check_user_missing_case():
    print("Checking user retrieval for missing user")
    resp = requests.get(f"{BASE_ENDPOINT}/users/99999999")
    print(resp.status_code, resp.json())
    assert resp.status_code == 404, "Missing user should return 404"

def check_user_valid_case():
    print("Checking user retrieval for valid user")
    resp = requests.get(f"{BASE_ENDPOINT}/users/123123")
    print(resp.status_code, resp.json())
    data = resp.json()
    assert resp.status_code == 200, "User retrieval should succeed"
    assert "total" in data, "Response must contain total cost"

def validate_user_presence():
    print("Validating user presence before cost addition")
    uid = "123123"
    resp = requests.get(f"{BASE_ENDPOINT}/users/{uid}")
    print(resp.status_code, resp.json())
    assert resp.status_code == 200, "User must exist before cost addition"

def reject_invalid_category_cost():
    print("Rejecting cost entry with invalid category")
    invalid_data = {
        "userid": "635635",
        "description": "Invalid category test",
        "category": "not_a_category",
        "sum": 10
    }
    resp = requests.post(f"{BASE_ENDPOINT}/add/", json=invalid_data)
    print(resp.status_code, resp.json())
    assert resp.status_code == 400, "Invalid category should cause rejection"

def submit_valid_cost_entry():
    print("Submitting valid cost entry")
    cost_payload = {
        "userid": "123123",
        "description": "pasta",
        "category": "food",
        "sum": 12
    }
    resp = requests.post(f"{BASE_ENDPOINT}/add/", json=cost_payload)
    print(resp.status_code, resp.json())
    assert resp.status_code == 201, "Cost entry should be accepted"

def fetch_report_with_bad_params():
    print("Fetching report with invalid parameters")
    resp = requests.get(f"{BASE_ENDPOINT}/report/?id=123123&year=abcd&month=13")
    print(resp.status_code, resp.json())
    assert resp.status_code == 400, "Invalid year/month should return error"

def fetch_report_for_nonexistent_user():
    print("Fetching report for nonexistent user")
    resp = requests.get(f"{BASE_ENDPOINT}/report/?id=999999&year=2025&month=5")
    print(resp.status_code, resp.json())
    assert resp.status_code in [200, 404], "Expect 404 or empty report"

def verify_cost_appears_in_report():
    print("Verifying added cost appears in monthly report")
    response = requests.get(f"{BASE_ENDPOINT}/report/?id=123123&year=2025&month=5")
    print(response.status_code, response.json())
    assert response.status_code == 200, "Report request should succeed"
    report_data = response.json()
    assert any(item["description"] == "pasta" for item in report_data["costs"]["food"]), \
        "Added cost should appear in the report"

def execute_all_tests():
    with open("api_test_results.txt", "w") as output_file:
        sys.stdout = output_file

        verify_team_endpoint()
        check_user_missing_case()
        check_user_valid_case()
        validate_user_presence()
        reject_invalid_category_cost()
        submit_valid_cost_entry()
        verify_cost_appears_in_report()
        fetch_report_with_bad_params()
        fetch_report_for_nonexistent_user()

        sys.stdout = sys.__stdout__

if __name__ == "__main__":
    execute_all_tests()
