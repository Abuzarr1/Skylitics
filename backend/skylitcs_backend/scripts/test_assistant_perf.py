import requests
import json
import time

def test_assistant_speed():
    url = "http://localhost:8000/api/v1/assistant/query"
    
    # This query contains "Route... flight..." context which we optimized
    payload = {
        "message": "Route ATL→JFK, flight DL192, weather Rain severity 5/10: What is the solution for this delay?"
    }
    
    print("--- Testing Optimized Assistant Rule Engine ---")
    start = time.time()
    try:
        response = requests.post(url, json=payload)
        elapsed = time.time() - start
        
        print(f"Status Code: {response.status_code}")
        print(f"Latency: {elapsed:.3f}s")
        
        data = response.json()
        print(f"Intent Caught: {data.get('intent')}")
        print("Response Snippet:")
        print(data.get('response')[:200])
        
        if elapsed < 0.5:
            print("SUCCESS: Response was near-instant (Rule Engine Hit)")
        else:
            print("WARNING: Response took > 500ms. Might have fallen back to LLM.")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_assistant_speed()
