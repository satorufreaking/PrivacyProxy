import requests
import json

session_url = "http://localhost:8000/apps/app/users/test_user_123/sessions/test_session_456"
run_url = "http://localhost:8000/run"

try:
    # 1. Create the session
    print("Creating session...")
    sess_resp = requests.post(session_url, json={})
    print("Session creation status:", sess_resp.status_code)
    
    # 2. Run the agent
    payload = {
        "userId": "test_user_123",
        "sessionId": "test_session_456",
        "appName": "app",
        "newMessage": {
            "role": "user",
            "parts": [
                {
                    "text": "Please redact the sensitive PII from this text: My name is Alice Johnson, email alice.j@gmail.com, and phone is +1 (555) 901-3482."
                }
            ]
        }
    }
    print("Running agent...")
    response = requests.post(run_url, json=payload)
    print("Agent run status:", response.status_code)
    if response.status_code == 200:
        print("Response Content:")
        print(json.dumps(response.json(), indent=2))
    else:
        print("Error Response:")
        print(response.text)
except Exception as e:
    print("Request failed:", e)
