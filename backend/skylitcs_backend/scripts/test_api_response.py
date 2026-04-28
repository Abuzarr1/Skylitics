import requests
import json

def test_prediction():
    url = "http://localhost:8000/api/v1/predictions/realtime"
    payload = {
        "airline": "DL",
        "origin": "JFK",
        "destination": "LAX",
        "date": "2026-04-23",
        "time": "14:30",
        "distance": 2475,
        "weather_severity": 0.5
    }
    
    try:
        response = requests.post(url, json=payload)
        print(f"Status Code: {response.status_code}")
        print("Response JSON:")
        print(json.dumps(response.json(), indent=2))
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_prediction()
