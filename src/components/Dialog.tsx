import styles from '@/styles/Dialog.module.scss'
import { useEffect, useRef } from 'react'

export type DialogFunction = () => Promise<boolean>

export default function Dialog({ reference, title, negative, positive, children }: { 
  reference: React.MutableRefObject<DialogFunction|undefined>,
  title: string,
  negative?: string,
  positive: string,
  children: React.ReactNode
}) {
  const dialog = useRef<HTMLDivElement>(null)
  const positiveButton = useRef<HTMLButtonElement>(null)
  const negativeButton = useRef<HTMLButtonElement>(null)
  
  useEffect(() => {
    // @ts-ignore
    reference.current = () => makeDialog(dialog.current, positiveButton.current, negativeButton.current)
  }, [])

  return (
    <div className={styles.dialogOverlay}>
      <div ref={dialog} className={styles.dialogContainer}>
        <div className={styles.dialogTitle}>{title}</div>
        <div className={styles.dialogContent}>
          {children}
        </div>
        <div className={styles.dialogButtons}>
          { negative && <button ref={negativeButton} className={styles.negativeButton}>{negative}</button> }
          <button ref={positiveButton} className={styles.positiveButton}>{positive}</button>
        </div>
      </div>
    </div>
  )
}

async function makeDialog(dialog: HTMLElement, positiveButton: HTMLElement, negativeButton: HTMLElement|null): Promise<boolean> {
  return new Promise((resolve, reject) => {
    dialog.classList.add(styles.dialogVisible)

    if (negativeButton) {
      negativeButton.onclick = () => {
        dialog?.classList.remove(styles.dialogVisible)
        resolve(false)
      }
    }

    positiveButton.onclick = () => {
      dialog?.classList.remove(styles.dialogVisible)
      resolve(true)
    }
  })
}