from pydantic import BaseModel

# Login data shape
class LoginRequest(BaseModel):
    email: str
    password: str

# Signup data shape
class SignupRequest(BaseModel):
    name: str
    email: str
    password: str

# Chat data shape
class ChatRequest(BaseModel):
    query: str
    conversation_history: list = []