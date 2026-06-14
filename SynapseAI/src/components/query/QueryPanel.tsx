import { useState } from "react"
import { sendChat } from "../../lib/api"

export default function QueryPanel({ session }: { session: any }) {
  const [query, setQuery] = useState("")
  const [response, setResponse] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState<any[]>([])

  const handleSubmit = async () => {
    if (!query.trim()) return
    setLoading(true)
    try {
      const token = session?.access_token
      if (!token) { alert("Please login first!"); return }
      const result = await sendChat(query, history, token)
      setHistory(prev => [...prev, { role: "user", content: query }, { role: "assistant", content: result.answer }])
      setResponse(result)
      setQuery("")
    } catch (error) {
      console.error("Error:", error)
      alert("Something went wrong!")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      {response && (
        <div className="flex gap-2 items-center">
          <span className="text-sm font-bold">Decision:</span>
          <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
            {response.decision === "web_search" && "?? Web Search"}
            {response.decision === "direct" && "?? Direct Answer"}
            {response.decision === "clarify" && "? Needs Clarification"}
          </span>
          <span className="text-xs text-gray-500">{response.reasoning}</span>
        </div>
      )}
      <div className="flex flex-col gap-2 max-h-96 overflow-y-auto">
        {history.map((msg, i) => (
          <div key={i} className={`p-3 rounded-lg ${msg.role === "user" ? "bg-blue-50 ml-auto max-w-xs" : "bg-gray-50 mr-auto max-w-lg"}`}>
            <p className="text-sm font-bold">{msg.role === "user" ? "You" : "SynapseAI"}</p>
            <p className="text-sm">{msg.content}</p>
          </div>
        ))}
      </div>
      {response?.sources?.length > 0 && (
        <div className="text-xs text-gray-500">
          <p className="font-bold">Sources:</p>
          {response.sources.map((srcUrl: string, i: number) => (
            <a key={i} href={srcUrl} target="_blank" className="block text-blue-500 hover:underline">{srcUrl}</a>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder="Ask SynapseAI anything..."
          className="flex-1 border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button onClick={handleSubmit} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
          {loading ? "Thinking..." : "Send"}
        </button>
      </div>
    </div>
  )
}
