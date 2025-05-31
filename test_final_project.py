import sys
import requests
import time

filename = input("filename=")

BASE_URL = "https://final-project-server-side-dcly.onrender.com"

output = open(filename, "w")
sys.stdout = output

print("__________________________________")
print()
print("testing getting the about")
print("-------------------------")

try:
    url = f"{BASE_URL}/api/about"
    data = requests.get(url)
    print(f"url={url}")
    print(f"data.status_code={data.status_code}")
    print(data.content)
    print(f"data.text={data.text}")
    print(data.json())
except Exception as e:
    print("problem")
    print(e)
print()
print("testing getting the report - 1")
print("------------------------------")

try:
    url = f"{BASE_URL}/api/report?id=123123&year=2025&month=5"
    data = requests.get(url)
    print(f"url={url}")
    print(f"data.status_code={data.status_code}")
    print(data.content)
    print(f"data.text={data.text}")
    print("")
except Exception as e:
    print("problem")
    print(e)
print()
print("testing adding cost item")
print("----------------------------------")

try:
    url = f"{BASE_URL}/api/add"
    cost_item = {
        'userid': 123123,
        'description': 'milk 9',
        'category': 'food',
        'sum': 8
    }
    data = requests.post(url, json=cost_item)
    print(f"url={url}")
    print(f"data.status_code={data.status_code}")
    print(data.content)

    print("Waiting for server to process the cost...")
    time.sleep(10)

except Exception as e:
    print("problem")
    print(e)
print()
print("testing getting the report - 2")
print("------------------------------")

try:
    url = f"{BASE_URL}/api/report?id=123123&year=2025&month=5"
    data = requests.get(url)
    print(f"url={url}")
    print(f"data.status_code={data.status_code}")
    print(data.content)
    print(f"data.text={data.text}")
    print("")
except Exception as e:
    print("problem")
    print(e)
print()

sys.stdout = sys.__stdout__
print(f"Test completed. Results saved to {filename}")
