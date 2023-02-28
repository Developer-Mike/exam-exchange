import { supabase } from '@/lib/supabase'
import { getAvatar, getFirstName } from '@/utils/user-helper'
import { AuthSession } from '@supabase/supabase-js'
import { createContext, useContext, useEffect, useState } from 'react'

interface AuthValues { 
  session: AuthSession,
  uid: string,
  username: string,
  avatar: string,
  credits: number
}
const SessionContext = createContext<AuthValues | null | undefined>(undefined)

export default function AuthContext({ children }: { 
  children: React.ReactNode 
}) {
  const [authValues, setAuthValues] = useState<AuthValues | null | undefined>(undefined)

  const updateSession = async (session: AuthSession | null) => {
    if (!session) {
      setAuthValues(null)
      return
    }

    let { data } = await supabase
      .from("students")
      .select("credits")
      .eq("id", session.user?.id)
      .single()

    setAuthValues({
      session,
      uid: session.user?.id ?? "",
      username: getFirstName(session.user?.email ?? ""),
      avatar: getAvatar(getFirstName(session.user?.email ?? "")),
      credits: data?.credits ?? 0
    })
  }

  useEffect(() => { (async () => {
    let { data } = await supabase.auth.getSession()
    updateSession(data.session)

    supabase.auth.onAuthStateChange((event, session) => {
      updateSession(session)
    })
  })() }, [])

  return (
    <SessionContext.Provider value={authValues}>
      { children }
    </SessionContext.Provider>
  )
}

export function useAuthContext() {
  return useContext(SessionContext)!
}