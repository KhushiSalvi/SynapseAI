# Keywords that need web search
WEB_SEARCH_KEYWORDS = [
    "latest", "today", "current", "news",
    "2025", "2026", "recent", "now", "live",
    "price", "score", "weather", "trending",
    "update", "new", "just", "happened"
]

# Keywords that need action plan
ACTION_PLAN_KEYWORDS = [
    "how to", "steps to", "plan", "strategy",
    "manage", "build", "create", "develop",
    "implement", "design", "setup"
]

# Keywords that are vague
CLARIFY_KEYWORDS = [
    "help me", "assist", "something", "stuff",
    "things", "whatever", "anything"
]

def make_decision(query: str):
    query_lower = query.lower()

    if any(word in query_lower for word in WEB_SEARCH_KEYWORDS):
        return {
            "decision": "web_search",
            "reasoning": "Query needs real-time information",
            "confidence": "high"
        }

    elif any(word in query_lower for word in ACTION_PLAN_KEYWORDS):
        return {
            "decision": "action_plan",
            "reasoning": "Query needs step by step guidance",
            "confidence": "high"
        }

    elif len(query.split()) < 4 or any(word in query_lower for word in CLARIFY_KEYWORDS):
        return {
            "decision": "clarify",
            "reasoning": "Query is too vague to answer accurately",
            "confidence": "medium"
        }

    else:
        return {
            "decision": "direct",
            "reasoning": "Query can be answered from AI knowledge",
            "confidence": "high"
        }