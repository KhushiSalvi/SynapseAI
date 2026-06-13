from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from models import ChatRequest
from database import init_db, save_chat, get_chat_history
from auth import verify_token
from decision import make_decision
from llm import ask_llm, ask_llm_with_context
from search import search_web

load_dotenv()

app = FastAPI(title="SynapseAI Backend")

# Allow frontend to talk to backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)

# Create database on startup
@app.on_event("startup")
def startup():
    init_db()

# ─────────────────────────────
# CHAT ROUTE
# ─────────────────────────────

@app.post("/chat")
def chat(data: ChatRequest, user_email: str = Depends(verify_token)):

    query = data.query
    history = data.conversation_history
    sources = []

    # Step 1: Make decision
    decision_result = make_decision(query)
    decision = decision_result["decision"]
    reasoning = decision_result["reasoning"]
    confidence = decision_result["confidence"]

    # Step 2: Act based on decision
    if decision == "web_search":
        search_results = search_web(query)
        answer = ask_llm_with_context(query, search_results)
        sources = [r["url"] for r in search_results]

    elif decision == "clarify":
        answer = "Could you please give more details? I want to make sure I give you the most accurate answer."

    else:
        answer = ask_llm(query, history)

    # Step 3: Save to history
    save_chat(user_email, query, answer, decision)

    # Step 4: Return response
    return {
        "answer": answer,
        "decision": decision,
        "reasoning": reasoning,
        "confidence": confidence,
        "sources": sources
    }

# ─────────────────────────────
# HISTORY ROUTE
# ─────────────────────────────

@app.get("/history")
def history(user_email: str = Depends(verify_token)):
    chats = get_chat_history(user_email)
    return {"history": [dict(c) for c in chats]}