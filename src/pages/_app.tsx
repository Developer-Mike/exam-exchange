import '@/styles/globals.scss'
import type { AppProps } from 'next/app'
import Navbar from '@/components/Navbar'
import AuthContext from '@/components/AuthContext'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AuthContext>
      <Navbar/>
      <Component {...pageProps} />
    </AuthContext>
  )
}