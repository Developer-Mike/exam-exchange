import Head from 'next/head'
import styles from '@/styles/Login.module.scss'
import { useEffect, useState } from 'react'
import { isEmailValid } from '@/utils/user-helper'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/router'
import { useAuthContext } from '@/components/AuthContext'
import useTranslation from 'next-translate/useTranslation'

export default function Login() {
  const { t } = useTranslation('login')

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
              <input id={styles.email} type="text" placeholder={t("email")} />
              { isInvalidEmail && <span className={styles.error}>{t("invalidEmail")}</span> }
              <button id={styles.submit} onClick={login}>{t("sendEmail")}</button>
            </>
          ) }
        </div>
      </main>
    </>
  )
}
