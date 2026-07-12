import requests
import time
import os

BASE_URL = "http://localhost:8000/api"

# 1. Register a test user
email = f"test_{int(time.time())}@example.com"
password = "testpassword123"

print("--- Registering user ---")
res = requests.post(f"{BASE_URL}/auth/register", json={
    "email": email,
    "password": password,
    "full_name": "Test User",
    "role": "administrator"
})
print(res.status_code, res.text)

# 2. Login to get token
print("--- Logging in ---")
res = requests.post(f"{BASE_URL}/auth/login", data={
    "username": email,
    "password": password
})
print(res.status_code)
token = res.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}

# 3. Create a Site
print("--- Creating site ---")
res = requests.post(f"{BASE_URL}/sites/", json={
    "name": "Test Site",
    "habitat_type": "Forest",
    "protected_area": "Yes",
    "device_type": "camera_trap",
    "latitude": 10.0,
    "longitude": 20.0
}, headers=headers)
print(res.status_code, res.text)
site_id = res.json()["id"]

# 4. Create a Survey
print("--- Creating survey ---")
res = requests.post(f"{BASE_URL}/surveys/", json={
    "site_id": site_id,
    "start_date": "2023-01-01T00:00:00Z",
    "notes": "Test Survey"
}, headers=headers)
print(res.status_code, res.text)
survey_id = res.json()["id"]

# 5. Create a dummy image
img_path = "test_image.jpg"
with open(img_path, "wb") as f:
    f.write(os.urandom(1024)) # 1KB random data

# 6. Upload Observation
print("--- Uploading observation ---")
with open(img_path, "rb") as f:
    files = {"file": ("test_image.jpg", f, "image/jpeg")}
    data = {
        "survey_id": survey_id,
        "observation_type": "image",
        "notes": "This is a test image"
    }
    res = requests.post(f"{BASE_URL}/observations/", headers=headers, data=data, files=files)
    print(res.status_code)
    print(res.json())

# 7. Check GET
print("--- Getting observations ---")
res = requests.get(f"{BASE_URL}/observations/", headers=headers)
print(res.status_code)
print(len(res.json()), "observations found.")
