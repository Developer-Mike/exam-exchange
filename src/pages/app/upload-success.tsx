import styles from '@/styles/UploadSuccess.module.scss'
import useTranslation from 'next-translate/useTranslation'
import Link from 'next/link'

export default function UploadSuccess() {
  const { t } = useTranslation('upload-success')
  
  return (
    <>
      <main id={styles.main}>
        <h1 className={styles.successTitle}>{t("upload_success")}</h1>
        <p className={styles.uploadInfo}>{t("wait_for_verification")}</p>

        <div id={styles.options}>
          <Link href="/app/dashboard"><button id={styles.goToDashboard}>{t("go_to_dashboard")}</button></Link>
          <Link href="/app/upload"><button id={styles.uploadAnother}>{t("upload_another")}</button></Link>
        </div>
      </main>
    </>
  )
}
