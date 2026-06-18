import urllib.request
import json

try:
    url = "http://127.0.0.1:8000/api/v1/doctors/dr-doctor1-doctor1/booking-mode-for-date?date=2026-06-28"
    req = urllib.request.Request(url)
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read().decode())
        print(json.dumps(data, indent=2))
except urllib.error.HTTPError as e:
    print(f"HTTP Error: {e.code}")
    print(e.read().decode())
except Exception as e:
    print(f"Error: {e}")
