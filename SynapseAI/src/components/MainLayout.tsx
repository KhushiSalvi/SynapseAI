import { useState, useEffect, useRef } from "react"
import { supabase } from "../integrations/supabase/client"
import { createSession, getSessions, deleteSession, getSessionHistory } from "../lib/api"
import ReactMarkdown from "react-markdown"

const EXAMPLES = [
  "Plan disaster response for a Category 5 hurricane hitting Miami in 48 hours.",
  "Debug and optimize this distributed system where p99 latency spikes every 15 minutes under load.",
  "Analyze market entry strategy for Southeast Asia for a fintech B2B SaaS company.",
]

const STAGES = ["Analyzing", "Deciding", "Executing", "Responding"]

export default function MainLayout({ session }: { session: any }) {
  const [query, setQuery] = useState("")
  const [messages, setMessages] = useState<any[]>([])
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [stage, setStage] = useState(-1)
  const [sessions, setSessions] = useState<any[]>([])
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [followups, setFollowups] = useState<string[]>([])
  const [showDashboard, setShowDashboard] = useState(false)
  const [dashboardStats, setDashboardStats] = useState<any>(null)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [darkMode, setDarkMode] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const token = session?.access_token
  const BACKEND_URL = "http://127.0.0.1:8000"

  const t = {
    bg:          darkMode ? "#0a0a0f" : "#f1f5f9",
    sidebar:     darkMode ? "#0f0f1a" : "#ffffff",
    border:      darkMode ? "#1e1e2e" : "#e2e8f0",
    text:        darkMode ? "#e2e8f0" : "#1e293b",
    subtext:     darkMode ? "#94a3b8" : "#64748b",
    muted:       darkMode ? "#4a5568" : "#94a3b8",
    chatBg:      darkMode ? "#1a1a2e" : "#f0f4ff",
    inputBg:     darkMode ? "#1a1a2e" : "#ffffff",
    inputBorder: darkMode ? "#2d3748" : "#cbd5e1",
    card:        darkMode ? "#0f0f1a" : "#ffffff",
    accent:      "#6366f1",
    accentLight: "#a78bfa",
  }

  useEffect(() => { loadSessions() }, [])
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const loadSessions = async () => {
    try {
      const s = await getSessions(token)
      setSessions(s || [])
    } catch (e) {}
  }

  const loadDashboard = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/dashboard`, {
        headers: { "authorization": `Bearer ${token}` }
      })
      const data = await res.json()
      setDashboardStats(data)
      setShowDashboard(true)
    } catch (e) {}
  }

  const startNewChat = async () => {
    try {
      const session_id = await createSession(token)
      setCurrentSessionId(session_id)
      setMessages([])
      setResult(null)
      setStage(-1)
      setFollowups([])
      setUploadedFile(null)
      setShowDashboard(false)
      await loadSessions()
    } catch (e) {}
  }

  const switchSession = async (session_id: string) => {
    setCurrentSessionId(session_id)
    setResult(null)
    setStage(-1)
    setFollowups([])
    setShowDashboard(false)
    try {
      const history = await getSessionHistory(session_id, token)
      const msgs: any[] = []
      for (const row of history) {
        msgs.push({ role: "user", content: row.query, time: row.timestamp })
        msgs.push({ role: "assistant", content: row.answer, time: row.timestamp })
      }
      setMessages(msgs)
    } catch (e) {}
  }

  const handleDeleteSession = async (e: any, session_id: string) => {
    e.stopPropagation()
    try {
      await deleteSession(session_id, token)
      if (currentSessionId === session_id) {
        setCurrentSessionId(null)
        setMessages([])
        setResult(null)
        setFollowups([])
      }
      await loadSessions()
    } catch (e) {}
  }

  const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

  const handleFileUpload = async (q: string, sessionId: string) => {
    if (!uploadedFile) return null
    const formData = new FormData()
    formData.append("file", uploadedFile)
    formData.append("query", q)
    formData.append("session_id", sessionId)
    const res = await fetch(`${BACKEND_URL}/upload`, {
      method: "POST",
      headers: { "authorization": `Bearer ${token}` },
      body: formData
    })
    return await res.json()
  }

  const handleSubmit = async (q?: string) => {
    const text = q || query
    if (!text.trim()) return

    let sessionId = currentSessionId
    if (!sessionId) {
      sessionId = await createSession(token)
      setCurrentSessionId(sessionId)
      await loadSessions()
    }

    setLoading(true)
    setResult(null)
    setFollowups([])
    setStage(0)
    setShowDashboard(false)

    setMessages(prev => [...prev, {
      role: "user",
      content: uploadedFile ? `[File: ${uploadedFile.name}] ${text}` : text,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    }])
    setQuery("")

    try {
      await sleep(400); setStage(1)
      await sleep(400); setStage(2)

      let data
      if (uploadedFile) {
        data = await handleFileUpload(text, sessionId)
        setUploadedFile(null)
      } else {
        const res = await fetch(`${BACKEND_URL}/chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            query: text,
            session_id: sessionId,
            conversation_history: []
          })
        })
        data = await res.json()
      }

      setStage(3)
      await sleep(300)
      setResult(data)
      setFollowups(data.followups || [])
      setMessages(prev => [...prev, {
        role: "assistant",
        content: data.answer || "Something went wrong.",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      }])
      await loadSessions()
    } catch (e) {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Something went wrong. Is the backend running?",
        time: ""
      }])
    } finally {
      setLoading(false)
      setStage(-1)
    }
  }

  return (
    <div style={{
      display: "flex", height: "100vh",
      background: t.bg, color: t.text,
      fontFamily: "Inter, system-ui, sans-serif",
      overflow: "hidden", transition: "all 0.3s ease"
    }}>

      {/* SIDEBAR */}
      <div style={{
        width: 240, background: t.sidebar,
        borderRight: `1px solid ${t.border}`,
        display: "flex", flexDirection: "column"
      }}>
        <div style={{
          padding: "16px",
          borderBottom: `1px solid ${t.border}`,
          display: "flex", justifyContent: "space-between", alignItems: "center"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
              display: "flex", alignItems: "center",
              justifyContent: "center", color: "#fff",
              fontSize: 14, fontWeight: 800
            }}>S</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: t.text }}>SynapseAI</div>
              <div style={{ fontSize: 10, color: t.accent }}>Autonomous Engine</div>
            </div>
          </div>

          {/* TOGGLE SWITCH */}
          <div onClick={() => setDarkMode(!darkMode)} style={{
            width: 52, height: 26, borderRadius: 13,
            background: darkMode ? "#6366f1" : "#e2e8f0",
            cursor: "pointer", position: "relative",
            transition: "background 0.3s ease",
            border: `1px solid ${darkMode ? "#818cf8" : "#cbd5e1"}`
          }}>
            <div style={{
              position: "absolute", top: 2,
              left: darkMode ? 26 : 2,
              width: 20, height: 20, borderRadius: "50%",
              background: "#fff",
              transition: "left 0.3s ease",
              display: "flex", alignItems: "center",
              justifyContent: "center", fontSize: 11
            }}>
              {darkMode ? "M" : "S"}
            </div>
          </div>
        </div>

        <div style={{ padding: "12px", display: "flex", flexDirection: "column", gap: 8 }}>
          <button onClick={startNewChat} style={{
            width: "100%", padding: "10px",
            background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
            border: "none", borderRadius: 8,
            color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer"
          }}>+ New Chat</button>
          <button onClick={loadDashboard} style={{
            width: "100%", padding: "10px",
            background: "transparent",
            border: `1px solid ${t.border}`,
            borderRadius: 8, color: t.subtext,
            fontSize: 13, cursor: "pointer"
          }}>Dashboard</button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "0 12px" }}>
          {sessions.length > 0 && (
            <>
              <div style={{
                fontSize: 10, fontWeight: 600, color: t.muted,
                textTransform: "uppercase", letterSpacing: 1, marginBottom: 8
              }}>Recent Chats</div>
              {sessions.map((s: any) => (
                <div key={s.id} onClick={() => switchSession(s.id)} style={{
                  padding: "8px 10px", borderRadius: 6,
                  cursor: "pointer", marginBottom: 4, fontSize: 11,
                  color: currentSessionId === s.id ? t.accentLight : t.subtext,
                  background: currentSessionId === s.id ? "rgba(99,102,241,0.15)" : "transparent",
                  border: currentSessionId === s.id ? `1px solid ${t.accent}` : "1px solid transparent",
                  display: "flex", justifyContent: "space-between", alignItems: "center"
                }}>
                  <span style={{
                    overflow: "hidden", textOverflow: "ellipsis",
                    whiteSpace: "nowrap", flex: 1
                  }}>{s.title}</span>
                  <span onClick={(e) => handleDeleteSession(e, s.id)}
                    style={{ color: t.muted, marginLeft: 6, fontSize: 14, fontWeight: 700 }}>x</span>
                </div>
              ))}
            </>
          )}

          <div style={{
            fontSize: 10, fontWeight: 600, color: t.muted,
            textTransform: "uppercase", letterSpacing: 1, margin: "12px 0 8px"
          }}>Examples</div>
          {EXAMPLES.map((ex, i) => (
            <div key={i} onClick={() => handleSubmit(ex)} style={{
              fontSize: 11, color: t.subtext,
              padding: "8px 10px", borderRadius: 6,
              cursor: "pointer", marginBottom: 4, lineHeight: 1.4
            }}
              onMouseEnter={e => (e.currentTarget.style.background = darkMode ? "#1e1e2e" : "#f1f5f9")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
              {ex}
            </div>
          ))}
        </div>

        <div style={{ padding: "12px 16px", borderTop: `1px solid ${t.border}` }}>
          <div style={{ fontSize: 11, color: t.muted, marginBottom: 4 }}>{session?.user?.email}</div>
          <div onClick={() => supabase.auth.signOut()}
            style={{ fontSize: 11, color: "#ef4444", cursor: "pointer" }}>Sign out</div>
        </div>
      </div>

      {/* CHAT PANEL */}
      <div style={{
        width: 420, borderRight: `1px solid ${t.border}`,
        display: "flex", flexDirection: "column", background: t.bg
      }}>
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${t.border}` }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: t.text }}>Chat</div>
          <div style={{ fontSize: 11, color: t.muted }}>
            {currentSessionId ? "Session active" : "Start a new chat"}
          </div>
        </div>

        <div style={{
          flex: 1, overflowY: "auto", padding: "16px 20px",
          display: "flex", flexDirection: "column", gap: 12
        }}>
          {messages.length === 0 && (
            <div style={{ textAlign: "center", color: t.muted, marginTop: 60, fontSize: 13 }}>
              Click + New Chat or pick an example
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} style={{
              display: "flex", flexDirection: "column",
              alignItems: msg.role === "user" ? "flex-end" : "flex-start"
            }}>
              <div style={{
                maxWidth: "85%", padding: "10px 14px",
                borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                background: msg.role === "user"
                  ? "linear-gradient(135deg,#6366f1,#8b5cf6)" : t.chatBg,
                fontSize: 13, lineHeight: 1.5,
                color: msg.role === "user" ? "#fff" : t.text,
                border: msg.role === "assistant" ? `1px solid ${t.border}` : "none"
              }}>
                {msg.role === "assistant"
                  ? <ReactMarkdown>{msg.content}</ReactMarkdown>
                  : msg.content}
              </div>
              {msg.time && (
                <div style={{ fontSize: 10, color: t.muted, marginTop: 4 }}>{msg.time}</div>
              )}
            </div>
          ))}

          {followups.length > 0 && !loading && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 4 }}>
              <div style={{
                fontSize: 10, color: t.muted,
                textTransform: "uppercase", letterSpacing: 1
              }}>Suggested follow-ups</div>
              {followups.map((f, i) => (
                <div key={i} onClick={() => handleSubmit(f)} style={{
                  padding: "8px 12px",
                  background: "rgba(99,102,241,0.1)",
                  border: "1px solid rgba(99,102,241,0.3)",
                  borderRadius: 8, fontSize: 12,
                  color: t.accentLight, cursor: "pointer"
                }}
                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(99,102,241,0.2)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "rgba(99,102,241,0.1)")}>
                  {f}
                </div>
              ))}
            </div>
          )}

          {loading && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: t.accent, fontSize: 12 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: t.accent }}></div>
              SynapseAI is thinking...
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {uploadedFile && (
          <div style={{
            margin: "0 16px 8px", padding: "8px 14px",
            background: "rgba(99,102,241,0.1)",
            border: "1px solid #6366f1", borderRadius: 10,
            fontSize: 12, color: t.accentLight,
            display: "flex", justifyContent: "space-between", alignItems: "center"
          }}>
            <span>File ready: {uploadedFile.name}</span>
            <span onClick={() => setUploadedFile(null)}
              style={{ cursor: "pointer", color: "#ef4444", fontWeight: 700, marginLeft: 8 }}>x</span>
          </div>
        )}

        <div style={{ padding: "12px 16px 16px", borderTop: `1px solid ${t.border}` }}>
          <div style={{
            display: "flex", gap: 8, alignItems: "flex-end",
            background: t.inputBg, border: `1px solid ${t.inputBorder}`,
            borderRadius: 12, padding: "8px 8px 8px 14px"
          }}>
            <textarea
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  handleSubmit()
                }
              }}
              placeholder={uploadedFile ? "Ask about the uploaded file..." : "Ask anything..."}
              rows={2}
              style={{
                flex: 1, background: "transparent",
                border: "none", color: t.text,
                fontSize: 13, resize: "none",
                outline: "none", fontFamily: "inherit", lineHeight: 1.5
              }}
            />
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <button onClick={() => fileInputRef.current?.click()}
                title="Upload PDF, TXT or DOCX"
                style={{
                  width: 38, height: 38, borderRadius: 8,
                  cursor: "pointer", fontSize: 11, fontWeight: 700,
                  background: uploadedFile ? "rgba(99,102,241,0.3)" : t.inputBg,
                  border: `1px solid ${uploadedFile ? t.accent : t.inputBorder}`,
                  color: uploadedFile ? t.accentLight : t.subtext,
                  display: "flex", alignItems: "center", justifyContent: "center"
                }}>PDF</button>
              <button onClick={() => handleSubmit()} disabled={loading}
                style={{
                  padding: "0 16px", height: 38,
                  borderRadius: 8, border: "none",
                  cursor: loading ? "not-allowed" : "pointer",
                  background: loading ? t.inputBorder : "linear-gradient(135deg,#6366f1,#8b5cf6)",
                  color: "#fff", fontSize: 13, fontWeight: 700, whiteSpace: "nowrap"
                }}>
                {loading ? "..." : "Send"}
              </button>
            </div>
          </div>
          <input ref={fileInputRef} type="file" accept=".pdf,.txt,.docx"
            style={{ display: "none" }}
            onChange={e => { if (e.target.files?.[0]) setUploadedFile(e.target.files[0]) }} />
          <div style={{ fontSize: 10, color: t.muted, marginTop: 6, textAlign: "center" }}>
            Enter to send • Shift+Enter for new line • PDF to upload files
          </div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div style={{
        flex: 1, display: "flex", flexDirection: "column",
        overflow: "hidden", background: t.bg
      }}>
        <div style={{
          padding: "14px 24px", borderBottom: `1px solid ${t.border}`,
          display: "flex", gap: 8, alignItems: "center"
        }}>
          {STAGES.map((s, i) => {
            const done = stage > i
            const active = stage === i
            return (
              <div key={s} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "4px 12px", borderRadius: 20,
                  background: done || active ? "rgba(99,102,241,0.15)" : "transparent",
                  border: `1px solid ${done || active ? t.accent : t.border}`,
                  fontSize: 11, fontWeight: 600,
                  color: done || active ? t.accent : t.muted,
                  transition: "all 0.3s"
                }}>
                  <div style={{
                    width: 6, height: 6, borderRadius: "50%",
                    background: done ? t.accent : active ? t.accentLight : t.muted
                  }}></div>
                  {s} {done && "v"}
                </div>
                {i < STAGES.length - 1 && (
                  <div style={{
                    width: 40, height: 1,
                    background: done ? t.accent : t.border
                  }}></div>
                )}
              </div>
            )
          })}
        </div>

        <div style={{
          flex: 1, overflowY: "auto", padding: 24,
          display: "flex", flexDirection: "column", gap: 16
        }}>

          {showDashboard && dashboardStats && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: t.text }}>Your Dashboard</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {[
                  { label: "Total Queries", value: dashboardStats.total_queries },
                  { label: "Total Sessions", value: dashboardStats.total_sessions },
                  { label: "This Week", value: dashboardStats.this_week },
                  { label: "Today", value: dashboardStats.today },
                ].map((stat, i) => (
                  <div key={i} style={{
                    background: t.card, border: `1px solid ${t.border}`,
                    borderRadius: 12, padding: 16
                  }}>
                    <div style={{ fontSize: 32, fontWeight: 800, color: t.accentLight }}>
                      {stat.value}
                    </div>
                    <div style={{ fontSize: 11, color: t.muted, marginTop: 4 }}>{stat.label}</div>
                  </div>
                ))}
              </div>
              {dashboardStats.decisions && Object.keys(dashboardStats.decisions).length > 0 && (
                <div style={{
                  background: t.card, border: `1px solid ${t.border}`,
                  borderRadius: 12, padding: 20
                }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: t.text }}>
                    Decision Breakdown
                  </div>
                  {Object.entries(dashboardStats.decisions).map(([key, val]: any) => (
                    <div key={key} style={{
                      display: "flex", justifyContent: "space-between",
                      alignItems: "center", marginBottom: 10
                    }}>
                      <span style={{ fontSize: 12, color: t.subtext }}>
                        {key === "web_search" ? "Web Search"
                          : key === "direct" ? "Direct Answer"
                          : key === "file" ? "File Analysis" : key}
                      </span>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 100, height: 4, background: t.border, borderRadius: 2 }}>
                          <div style={{
                            width: `${Math.round((val / dashboardStats.total_queries) * 100)}%`,
                            height: "100%",
                            background: "linear-gradient(90deg,#6366f1,#8b5cf6)", borderRadius: 2
                          }}></div>
                        </div>
                        <span style={{ fontSize: 11, color: t.accentLight, minWidth: 20 }}>{val}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {!showDashboard && !result && !loading && (
            <div style={{ textAlign: "center", color: t.muted, marginTop: 80, fontSize: 14 }}>
              Ask a question to see the analysis
            </div>
          )}

          {!showDashboard && result && (
            <>
              <div style={{
                background: t.card, border: `1px solid ${t.border}`,
                borderRadius: 12, padding: 20
              }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 16, color: t.text }}>
                  Query Analysis
                </div>
                <div style={{
                  display: "grid", gridTemplateColumns: "120px 1fr",
                  gap: "12px 0", fontSize: 12
                }}>
                  <span style={{ color: t.muted, textTransform: "uppercase", fontSize: 10 }}>Decision</span>
                  <span>
                    <span style={{
                      padding: "3px 12px", borderRadius: 20,
                      background: "rgba(99,102,241,0.2)",
                      color: t.accentLight, fontSize: 11, fontWeight: 600
                    }}>
                      {result.decision === "web_search" ? "Web Search"
                        : result.decision === "direct" ? "Direct Answer"
                        : result.decision === "file" ? "File Analysis"
                        : result.decision}
                    </span>
                  </span>
                  <span style={{ color: t.muted, textTransform: "uppercase", fontSize: 10 }}>Confidence</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ flex: 1, height: 4, background: t.border, borderRadius: 2 }}>
                      <div style={{
                        width: `${Math.round((result.confidence || 0.8) * 100)}%`,
                        height: "100%",
                        background: "linear-gradient(90deg,#6366f1,#8b5cf6)", borderRadius: 2
                      }}></div>
                    </div>
                    <span style={{ color: t.accentLight, fontSize: 11 }}>
                      {Math.round((result.confidence || 0.8) * 100)}%
                    </span>
                  </div>
                  <span style={{ color: t.muted, textTransform: "uppercase", fontSize: 10 }}>Reasoning</span>
                  <span style={{ color: t.subtext, fontSize: 12 }}>{result.reasoning}</span>
                </div>
              </div>

              <div style={{
                background: t.card, border: `1px solid ${t.border}`,
                borderRadius: 12, padding: 20
              }}>
                <div style={{
                  display: "flex", alignItems: "center",
                  justifyContent: "space-between", marginBottom: 16
                }}>
                  <span style={{ fontWeight: 700, fontSize: 14, color: t.text }}>Structured Output</span>
                  <span style={{
                    padding: "2px 10px", borderRadius: 20,
                    background: "rgba(16,185,129,0.15)",
                    color: "#10b981", fontSize: 11
                  }}>High Confidence</span>
                </div>
                <div style={{ fontSize: 13, lineHeight: 1.7, color: t.text }}>
                  <ReactMarkdown>{result.answer}</ReactMarkdown>
                </div>
              </div>

              {result.sources?.length > 0 && (
                <div style={{
                  background: t.card, border: `1px solid ${t.border}`,
                  borderRadius: 12, padding: 20
                }}>
                  <div style={{
                    fontSize: 10, color: t.muted,
                    textTransform: "uppercase", letterSpacing: 1, marginBottom: 12
                  }}>Sources</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {result.sources.map((src: string, i: number) => (
                      <a key={i} href={src} target="_blank" style={{
                        padding: "4px 12px", background: t.inputBg,
                        border: `1px solid ${t.border}`,
                        borderRadius: 20, fontSize: 11,
                        color: t.accent, textDecoration: "none"
                      }}>
                        {(() => { try { return new URL(src).hostname } catch { return src } })()}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
