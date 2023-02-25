import '@/styles/globals.css'
import { supabase } from '@/utils/supabase'
import { AuthSession } from '@supabase/supabase-js'
import type { AppProps } from 'next/app'
import { createContext, useEffect, useState } from 'react'

export const SessionContext = createContext<{ session: AuthSession | null, setSession: (session: AuthSession | null) => void }>({ session: null, setSession: () => {} })

export default function App({ Component, pageProps }: AppProps) {
  const [session, setSession] = useState<AuthSession | null>(null)

  useEffect(() => { (async () => {
    let { data, error } = await supabase.auth.getSession()
    setSession(data.session)

    supabase.auth.onAuthStateChange((event, session) => {
      setSession(session)
    })
  })() })

  return (
    <SessionContext.Provider value={{ session, setSession }}>
      <Component {...pageProps} />
    </SessionContext.Provider>
  )
}
