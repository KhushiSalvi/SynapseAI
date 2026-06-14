import { useState, useEffect } from "react"
import { supabase } from "./integrations/supabase/client"
import Auth from "./components/Auth"
import MainLayout from "./components/MainLayout"

function App() {
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })
    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
  }, [])

  if (loading) return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#0a0a0f",color:"#fff"}}>
      Loading...
    </div>
  )

  if (!session) return <Auth onLogin={() => {}} />

  return <MainLayout session={session} />
}

export default App
