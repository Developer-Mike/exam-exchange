import '@/styles/globals.scss'
import { supabase } from '@/lib/supabase'
import { AuthSession } from '@supabase/supabase-js'
import type { AppProps } from 'next/app'
import { createContext, useContext, useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'

export const SessionContext = createContext<{ 
  session: AuthSession | null, 
  setSession: (session: AuthSession | null) => void 
}>({ 
  session: null, 
  setSession: () => {} 
})

export default function App({ Component, pageProps }: AppProps) {
  const [session, setSession] = useState<AuthSession | null>(null)

  useEffect(() => { (async () => {
    let { data, error } = await supabase.auth.getSession()
    setSession(data.session)

    supabase.auth.onAuthStateChange((event, session) => {
      setSession(session)
    })
  })() }, [])

  return (
    <SessionContext.Provider value={{ session: session, setSession: setSession }}>
      <Navbar/>
      <Component {...pageProps} />
    </SessionContext.Provider>
  )
}

export function useSession() {
  return useContext(SessionContext)!
}