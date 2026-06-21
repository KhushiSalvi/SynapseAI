const BACKEND_URL = "http://127.0.0.1:8000"

// Create new session
export async function createSession(token: string) {
  const response = await fetch(`${BACKEND_URL}/sessions`, {
    method: "POST",
    headers: { "authorization": `Bearer ${token}` }
  })
  const data = await response.json()
  return data.session_id
}

// Get all sessions
export async function getSessions(token: string) {
  const response = await fetch(`${BACKEND_URL}/sessions`, {
    headers: { "authorization": `Bearer ${token}` }
  })
  const data = await response.json()
  return data.sessions
}

// Delete a session
export async function deleteSession(session_id: string, token: string) {
  await fetch(`${BACKEND_URL}/sessions/${session_id}`, {
    method: "DELETE",
    headers: { "authorization": `Bearer ${token}` }
  })
}

// Send chat message
export async function sendChat(query: string, session_id: string, token: string) {
  const response = await fetch(`${BACKEND_URL}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "authorization": `Bearer ${token}`
    },
    body: JSON.stringify({
      query: query,
      session_id: session_id,
      conversation_history: []
    })
  })
  const data = await response.json()
  return data
}

// Get history for a session
export async function getSessionHistory(session_id: string, token: string) {
  const response = await fetch(`${BACKEND_URL}/history/${session_id}`, {
    headers: { "authorization": `Bearer ${token}` }
  })
  const data = await response.json()
  return data.history
}
