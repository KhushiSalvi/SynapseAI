from groq import Groq
import os
from dotenv import load_dotenv

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# Direct answer from Groq
def ask_llm(query, conversation_history=[]):
    
    # Build messages with history
    messages = conversation_history.copy()
    messages.append({
        "role": "user", 
        "content": query
    })
    
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {
                "role": "system",
                "content": """You are SynapseAI, an intelligent 
                decision-making assistant. Give clear, structured, 
                and actionable answers. Always be concise but thorough."""
            },
            *messages
        ],
        max_tokens=1000
    )
    
    return response.choices[0].message.content

# Answer based on search results
def ask_llm_with_context(query, search_results):
    
    context = "\n\n".join([
        f"Source {i+1}: {result['content']}"
        for i, result in enumerate(search_results)
    ])
    
    prompt = f"""
    You are SynapseAI. Answer the user's question 
    using the search results below.
    
    Search Results:
    {context}
    
    User Question: {query}
    
    Give a clear answer based on the search results.
    Mention which source you used.
    """
    
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {
                "role": "user", 
                "content": prompt
            }
        ],
        max_tokens=1000
    )
    
    return response.choices[0].message.content