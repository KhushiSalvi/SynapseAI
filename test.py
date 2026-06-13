import requests

BASE_URL = "http://127.0.0.1:8000"

# Your token from signup
TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InJvaGFuQHRlc3QuY29tIiwiZXhwIjoxNzgxNDEyODQxfQ.3UyCRH7N8Fbq8dpfXdV9a8GEfEIhmy4XpEwcg9Cy67M"

# Test chat
response = requests.post(
    f"{BASE_URL}/chat",
    json={
        "query": "What is artificial intelligence?",
        "conversation_history": []
    },
    headers={
        "authorization": f"Bearer {TOKEN}"
    }
)

# Print everything
print("Status Code:", response.status_code)
print("Response Text:", response.text)