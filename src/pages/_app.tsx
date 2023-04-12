import '@/styles/globals.scss'
import Navbar from '@/components/Navbar'
import Snackbar from '@/components/Snackbar'
import Head from 'next/head'
import { createBrowserSupabaseClient } from '@supabase/auth-helpers-nextjs'
import { SessionContextProvider, Session } from '@supabase/auth-helpers-react'
import { useState } from 'react'
import { AppProps } from 'next/app'

export default function App({ Component, pageProps }: AppProps<{
  initialSession: Session
}>) {
  // Create a new supabase browser client on every first render.
  const [supabaseClient] = useState(() => createBrowserSupabaseClient())

  return (
    <>
      <Head>
        <title>Exam Exchange</title>
      </Head>
      
      <SessionContextProvider
        supabaseClient={supabaseClient}
        initialSession={pageProps.initialSession}>

        <Navbar/>
        <Component {...pageProps} />
        <Snackbar/>
      </SessionContextProvider>
    </>
  )
}