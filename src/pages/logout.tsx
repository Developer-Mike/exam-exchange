import { supabase } from '@/lib/supabase'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import styles from '@/styles/Logout.module.scss'

export default function Logout() {
  const router = useRouter()
  
  useEffect(() => { (async () => {
    await supabase.auth.signOut()
    router.push("/")
  })() })
  
  return <></>
}
