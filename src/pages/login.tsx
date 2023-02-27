import Head from 'next/head'
import styles from '@/styles/Login.module.scss'
import { useEffect, useState } from 'react'
import { isEmailValid } from '@/utils/user-helper'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/router'
import { useAuthContext } from '@/components/AuthContext'

export default function Login() {
  const router = useRouter()
  const authContext = useAuthContext()
  const [isInvalidEmail, setIsInvalidEmail] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  useEffect(() => {
    if (authContext) router.push("/")
  }, [authContext])
  
  async function login() {
    let email = (document.getElementById(styles.email) as HTMLInputElement).value

    let validMail = isEmailValid(email)
    setIsInvalidEmail(!validMail)
    if (!validMail) return

    setEmailSent(true)

    let { error } = await supabase.auth.signInWithOtp({
      email: email,
      options: {
        emailRedirectTo: window.location.origin,
        shouldCreateUser: true,
      },
    })

    if (error) {
      setEmailSent(false)
      throw error
    }
  }

  return (
    <>
      <Head>
        <title>Exam Exchange - Login</title>
      </Head>
      <main className="fullscreen">
        <div className={styles.card}>
          <h1>Login</h1>

          { emailSent ? (
            <>
              <span className={styles.success}>Email sent! Check your inbox and click the link to login.</span>
              <button id={styles.submit} onClick={() => setEmailSent(false)}>Change email</button>
            </>
          ) : (
            <>
              <input id={styles.email} type="text" placeholder="Email" />
              { isInvalidEmail && <span className={styles.error}>Invalid email (Make sure this is your school email)</span> }
              <button id={styles.submit} onClick={login}>Send email</button>
            </>
          ) }
        </div>
      </main>
    </>
  )
}