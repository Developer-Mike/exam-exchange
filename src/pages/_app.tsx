import '@/styles/globals.scss'
import type { AppProps } from 'next/app'
import Navbar from '@/components/Navbar'
import AuthContext from '@/components/AuthContext'
import Head from 'next/head'
import Snackbar from '@/components/Snackbar'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>Exam Exchange</title>
      </Head>
      
      <AuthContext>
        <Navbar/>
        <Component {...pageProps} />
        <Snackbar/>
      </AuthContext>
    </>
  )
}