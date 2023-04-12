import styles from '@/styles/Logout.module.scss'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { useSupabaseClient } from '@supabase/auth-helpers-react'

export default function Logout() {
  const router = useRouter()
  const supabaseClient = useSupabaseClient()
  
  useEffect(() => { (async () => {
    await supabaseClient.auth.signOut()
    router.push("/")
  })() })
  
  return <></>
}
