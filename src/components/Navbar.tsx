import styles from '@/styles/Navbar.module.scss'
import { schoolName } from "@/config"
import { useEffect } from "react"
import { useAuthContext } from './AuthContext'

export default function Navbar() {
  const authContext = useAuthContext()

  const expandProfileDropdown = () => {
    document.getElementById(styles.dropdown)?.classList.toggle(styles.expanded)
  }

  const toggleMenuDropdown = () => {
    document.getElementById(styles.collapsible)?.classList.toggle(styles.expanded)
  }

  useEffect(() => {
    document.addEventListener("click", (e) => {
      if (document.getElementById(styles.user)?.contains(e.target as Node)) return
      
      let dropdown = document.getElementById(styles.dropdown)
      dropdown && dropdown.classList.remove(styles.expanded)
    })
  }, [])

  return (
    <div id={styles.navbar}>
      <a href="/" id={styles.logo}>
        <h1 id={styles.logoBig}>Exam Exchange</h1>
        <h4 id={styles.logoSmall}>{schoolName}</h4>
      </a>

      <span id={styles.dropdownButton} className="material-symbols-outlined" onClick={toggleMenuDropdown}>menu</span>

      <div id={styles.collapsible}>
        <div id={styles.links}>
          <a href="/">Home</a>
          <a href="/dashboard">Dashboard</a>
        </div>

        <div id={styles.account}>
          { authContext ? (
            <div id={styles.user} onClick={expandProfileDropdown}>
              <div id={styles.userDetails}>
                <img id={styles.avatar} src={"school-icon.svg" /*authContext.avatar*/} alt="Avatar" />
                <div>
                  <strong>{authContext.username}</strong><br/>
                  <span id={styles.balance}>{authContext.credits}<img id={styles.coin} src="/coin.svg" alt="Coin" /></span>
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
