from supabase import create_client
from fastapi import HTTPException, Header
import os
from dotenv import load_dotenv

load_dotenv()

supabase = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_SERVICE_KEY")
)

def verify_token(authorization: str = Header(...)):
    try:
        token = authorization.replace("Bearer ", "")
        user = supabase.auth.get_user(token)
        if not user:
            raise HTTPException(
                status_code=401,
                detail="Invalid token"
            )
        return user.user.email
    except Exception as e:
        raise HTTPException(
            status_code=401,
            detail="Token expired or invalid"
        )