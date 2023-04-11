import styles from '@/styles/Dialog.module.scss'
import { useEffect, useRef } from 'react'

export interface DialogRef {
  show: () => Promise<boolean>
}

export default function Dialog({ reference, title, negative, positive, children }: { 
  reference: React.MutableRefObject<DialogRef|undefined>,
  title: string,
  negative?: string,
  positive: string,
  children: React.ReactNode
}) {
  const dialog = useRef<HTMLDivElement>(null)
  const dialogOverlay = useRef<HTMLDivElement>(null)
  const positiveButton = useRef<HTMLButtonElement>(null)
  const negativeButton = useRef<HTMLButtonElement>(null)
  
  useEffect(() => {
    reference.current = {
      show: () => {
        return new Promise((resolve, reject) => {
          dialog.current!.classList.add(styles.dialogVisible)
          const hide = () => dialog.current?.classList.remove(styles.dialogVisible)
      
          if (negativeButton) {
            dialogOverlay.current!.onclick = (e) => {
              if (e.target !== dialogOverlay.current) return // Ignore children clicks

              hide()
              resolve(false)
            }

            negativeButton.current!.onclick = () => {
              hide()
              resolve(false)
            }
          }
      
          positiveButton.current!.onclick = () => {
            hide()
            resolve(true)
          }
        })
      }
    }
  }, [])

  return (
    <div ref={dialogOverlay} className={styles.dialogOverlay}>
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