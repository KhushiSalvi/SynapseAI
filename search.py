from tavily import TavilyClient
import os
from dotenv import load_dotenv

load_dotenv()

tavily = TavilyClient(api_key=os.getenv("TAVILY_API_KEY"))

def search_web(query):
    try:
        results = tavily.search(
            query=query,
            max_results=3,
            search_depth="basic"
        )
        
        # Clean up results
        cleaned = []
        for r in results['results']:
            cleaned.append({
                "title": r.get("title", ""),
                "content": r.get("content", ""),
                "url": r.get("url", "")
            })
        
        return cleaned
    
    except Exception as e:
        print(f"Search error: {e}")
        return []
    