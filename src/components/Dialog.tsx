import styles from '@/styles/Dialog.module.scss'
import ReactDOMServer from 'react-dom/server'

export default function Dialog() {
  return (
    <div id={styles.dialogOverlay}>
      <div id={styles.dialogContainer}>
        <div id={styles.dialogTitle}></div>
        <div id={styles.dialogContent}></div>
        <div id={styles.dialogButtons}>
          <button id={styles.negativeButton}>Cancel</button>
          <button id={styles.positiveButton}>Confirm</button>
        </div>
      </div>
    </div>
  )
}

export async function makeDialog(title: string, content: React.ReactElement, negative: string|null, positive: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    let dialog = document.getElementById(styles.dialogContainer)
    if (!dialog) return console.error("Dialog not found")

    let dialogTitle = document.getElementById(styles.dialogTitle)
    if (!dialogTitle) return console.error("Dialog title not found")

    let dialogContent = document.getElementById(styles.dialogContent)
    if (!dialogContent) return console.error("Dialog content not found")

    let negativeButton = document.getElementById(styles.negativeButton)
    if (!negativeButton) return console.error("Negative button not found")

    let positiveButton = document.getElementById(styles.positiveButton)
    if (!positiveButton) return console.error("Positive button not found")

    dialog.classList.add(styles.dialogVisible)
    dialogTitle.textContent = title
    dialogContent.innerHTML = ReactDOMServer.renderToString(content)

    if (negative) negativeButton.style.display = "block"
    else negativeButton.style.display = "none"
    negativeButton.textContent = negative
    negativeButton.onclick = () => {
      dialog?.classList.remove(styles.dialogVisible)
      resolve(false)
    }

    positiveButton.textContent = positive
    positiveButton.onclick = () => {
      dialog?.classList.remove(styles.dialogVisible)
      resolve(true)
    }
  })
}