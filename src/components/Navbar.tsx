import styles from '@/styles/Navbar.module.scss'
import { schoolName } from "@/config"
import { SessionContext } from "@/pages/_app"
import { supabase } from "@/lib/supabase"
import { getAvatar, getFirstName } from "@/utils/user-helper"
import { useContext, useEffect, useState } from "react"

export default function Navbar() {
  const sessionContext = useContext(SessionContext)!
  const [username, setUsername] = useState<string | null>(null)
  const [credits, setCredits] = useState<number | null>(null)

  useEffect(() => { (async () => {
    if (sessionContext.session == null || username || credits) return
    let user = sessionContext.session?.user

    setUsername(getFirstName(user?.email ?? ""))

    let { data, error, status } = await supabase
      .from("students")
      .select("credits")
      .eq("id", user?.id)
      .single()
    if (error && status !== 406) throw error

    setCredits(data?.credits ?? 0)
  })() })

  const expandDropdown = () => {
    let dropdown = document.getElementById(styles.dropdown)
    dropdown && dropdown.classList.toggle(styles.expanded)
  }

  return (
    <div id={styles.navbar}>
      <div id={styles.logo}>
        <h1 id={styles.logoBig}>Exam Exchange</h1>
        <h4 id={styles.logoSmall}>{schoolName}</h4>
      </div>
      <div id={styles.links}>
        <a href="/">Home</a>
        <a href="/dashboard">Dashboard</a>
      </div>

      <div id={styles.account}>
        { sessionContext.session && username && credits ? (
          <div id={styles.user} onClick={expandDropdown}>
            <div id={styles.userDetails}>
              <img id={styles.avatar} src={getAvatar(username)} alt="Avatar" />
              <div>
                <strong>{username}</strong><br/>
                <span id={styles.balance}>{credits}<img id={styles.coin} src="/coin.svg" alt="Coin" /></span>
              </div>
              <span id={styles.accountDropdownArrow} className="material-symbols-outlined">expand_more</span>
            </div>

            <div id={styles.dropdown}>
              <DropdownElement href="/upload" text="Upload" icon="upload" />
              <DropdownElement href="/logout" text="Logout" icon="logout" />
            </div>
          </div>
        ) : (
          <div id={styles.login}>
            <a href="/login"><button>Login</button></a>
          </div>
        ) }
      </div>
    </div>
  )
}

function DropdownElement({ href, text, icon }: {
  href: string,
  text: string,
  icon: string
}) {
  return (
    <a className={styles.dropdownItem} href={href}>
      {text}
      <span className={`${styles.icon} material-symbols-outlined`}>{icon}</span>
    </a>
  )
}
