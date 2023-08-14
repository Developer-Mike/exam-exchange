import Head from 'next/head'
import styles from '@/styles/Login.module.scss'
import { useEffect, useState } from 'react'
import { isEmailValid } from '@/utils/user-helper'
import { useRouter } from 'next/router'
import useTranslation from 'next-translate/useTranslation'
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react'

export default function Login() {
  const { t } = useTranslation('login')

  const router = useRouter()
  const supabaseClient = useSupabaseClient()
  const user = useUser()
  const [isInvalidEmail, setIsInvalidEmail] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  useEffect(() => {
    if (user) router.push("/")
  }, [user])
  
  async function login() {
    let email = (document.getElementById(styles.email) as HTMLInputElement).value

    let validMail = isEmailValid(email)
    setIsInvalidEmail(!validMail)
    if (!validMail) return

    setEmailSent(true)

    let { error } = await supabaseClient.auth.signInWithOtp({
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
      <main className="fullscreen">
        <div className={styles.card}>
          <h1>{t("login")}</h1>

          { emailSent ? (
            <>
              <span className={styles.success}>{t("emailSent")}</span>
              <button id={styles.submit} onClick={() => setEmailSent(false)}>{t("changeEmail")}</button>
            </>
          ) : (
            <>
              <input id={styles.email} type="text" placeholder={t("email")} onKeyUp={(e) => { if (e.key == "Enter") document.getElementById(styles.submit)?.click() }} />
              { isInvalidEmail && <span className={styles.error}>{t("invalidEmail")}</span> }
              <button id={styles.submit} onClick={login}>{t("sendEmail")}</button>
            </>
          ) }
        </div>
      </main>
    </>
  )
}
