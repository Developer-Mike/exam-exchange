import Head from 'next/head'
import styles from '@/styles/Login.module.css'
import { useState } from 'react'
import { isEmailValid } from '@/utils/user-helper'
import { supabase } from '@/utils/supabase'
import Navbar from '@/components/Navbar'

export default function Login() {
  const [isInvalidEmail, setIsInvalidEmail] = useState(false)
  
  async function login() {
    let email = (document.getElementById("email") as HTMLInputElement).value

    let validMail = isEmailValid(email)
    setIsInvalidEmail(!validMail)
    if (!validMail) return

    let { data, error } = await supabase.auth.signInWithOtp({
      email: email,
      options: {
        emailRedirectTo: window.location.origin,
        shouldCreateUser: true,
      },
    })

    if (error) throw error
  }

  return (
    <>
      <Head>
        <title>Exam Exchange - Login</title>
      </Head>
      <main>
        <Navbar />

        <h1>Login</h1>

        <input id={styles.email} type="text" placeholder="Email" />
        { isInvalidEmail && <span className={styles.error}>Invalid email</span> }
        <button onClick={login}>Login</button>
      </main>
    </>
  )
}
