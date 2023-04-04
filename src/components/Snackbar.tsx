import styles from '@/styles/Snackbar.module.scss'

export default function Snackbar() {
  return (
    <div id={styles.snackbar} className={styles["error"]}>
      <span id={styles.icon} className="material-symbols-outlined">error</span>
      <div id={styles.text}></div>
    </div>
  )
}

const SNACKBAR_DURATION = 3000
export function makeSnackbar(text: string, type: "error") {
  let snackbar = document.getElementById(styles.snackbar)
  if (!snackbar) return console.error("Snackbar not found")

  let icon = document.getElementById(styles.icon)
  if (!icon) return console.error("Snackbar icon not found")

  let snackbarText = document.getElementById(styles.text)
  if (!snackbarText) return console.error("Snackbar text not found")

  icon.textContent = type === "error" ? "error" : "check_circle"
  snackbarText.textContent = text

  snackbar.classList.add(styles[type])
  snackbar.classList.add(styles.visible)

  setTimeout(() => {
    snackbar?.classList.remove(styles.visible)
    snackbar?.classList.remove(styles[type])
  }, SNACKBAR_DURATION)
}