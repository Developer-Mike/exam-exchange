import styles from '@/styles/UploadSuccess.module.scss'
import useTranslation from 'next-translate/useTranslation'

export default function UploadSuccess() {
  const { t } = useTranslation('upload-success')
  
  return (
    <>
      <main id={styles.main}>
        <h1 className={styles.successTitle}>{t("uploadSuccess")}</h1>
        <p className={styles.uploadInfo}>{t("waitForVerification")}</p>

        <div id={styles.options}>
          <a href="/app/dashboard"><button id={styles.goToDashboard}>{t("goToDashboard")}</button></a>
          <a href="/app/upload"><button id={styles.uploadAnother}>{t("uploadAnother")}</button></a>
        </div>
      </main>
    </>
  )
}
