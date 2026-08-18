import requests

BASE_URL = "http://127.0.0.1:8000"

# 1. Login
login_res = requests.post(
    f"{BASE_URL}/api/auth/login",
    json={"email": "priya@wildlife.com", "password": "wildlife123"}
)
assert login_res.status_code == 200, f"Login failed: {login_res.text}"
token = login_res.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}
print("1. Authenticated as researcher (priya@wildlife.com) successfully.")

# 2. Get existing survey
surveys_res = requests.get(f"{BASE_URL}/api/surveys", headers=headers)
assert surveys_res.status_code == 200, f"Surveys fetch failed: {surveys_res.text}"
surveys_data = surveys_res.json()
survey_id = surveys_data[0]["id"] if isinstance(surveys_data, list) else surveys_data["items"][0]["id"]
print(f"2. Retrieved Survey ID: {survey_id}")

# 3. Upload Crow audio observation
with open("test_audio/test_crow.wav", "rb") as f:
    upload_res = requests.post(
        f"{BASE_URL}/api/observations",
        headers=headers,
        data={
            "survey_id": survey_id,
            "observation_type": "audio",
            "latitude": "21.1234",
            "longitude": "78.5678",
            "notes": "Crow caw observation"
        },
        files={"file": ("test_crow.wav", f, "audio/wav")}
    )

assert upload_res.status_code == 201, f"Upload failed: {upload_res.text}"
obs_id = upload_res.json()["id"]
print(f"3. Created Crow audio observation ID: {obs_id}")

# 3. Trigger Detection
detect_res = requests.post(
    f"{BASE_URL}/api/observations/{obs_id}/detect",
    headers=headers
)
assert detect_res.status_code == 201, f"Detection failed: {detect_res.text}"
detections = detect_res.json()
print(f"3. Detection returned {len(detections)} results:")
for d in detections:
    print(f"   -> Label: {d['raw_label']} | Species ID: {d.get('species_id')} | Conf: {d['confidence']*100:.1f}% | Source: {d['detection_source']}")

# 4. Fetch Observation Detections
get_dets_res = requests.get(f"{BASE_URL}/api/observations/{obs_id}/detections", headers=headers)
assert get_dets_res.status_code == 200, f"Detections fetch failed: {get_dets_res.text}"
saved_dets = get_dets_res.json()
print(f"4. Verified {len(saved_dets)} saved detections in database:")
for d in saved_dets:
    print(f"   -> Saved: {d['raw_label']} (Species: {d.get('species_id')}) - {d['confidence']*100:.1f}%")

print("\nALL END-TO-END API TESTS PASSED!")
